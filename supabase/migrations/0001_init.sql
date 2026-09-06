-- Deal Event Tracker schema, constraints, indexes, and RLS.
-- Apply in the Supabase SQL editor or via the Supabase CLI.

create extension if not exists pgcrypto;

create type public.user_role as enum ('admin', 'owner', 'team');
create type public.deal_status as enum ('active', 'archived');
create type public.event_status as enum ('open', 'closed', 'na');
create type public.event_priority as enum ('low', 'normal', 'high', 'urgent');

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  name text not null,
  email text not null unique,
  role public.user_role not null default 'team',
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.deals (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  status public.deal_status not null default 'active',
  created_by uuid not null references public.profiles (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.events (
  id uuid primary key default gen_random_uuid(),
  deal_id uuid not null references public.deals (id) on delete cascade,
  description text not null,
  priority public.event_priority not null default 'normal',
  status public.event_status not null default 'open',
  created_by uuid not null references public.profiles (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  done_by uuid references public.profiles (id),
  done_at timestamptz
);

create table public.event_comments (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events (id) on delete cascade,
  author_id uuid not null references public.profiles (id),
  comment text not null,
  created_at timestamptz not null default now()
);

create index deals_status_idx on public.deals (status);
create index deals_updated_at_idx on public.deals (updated_at desc);
create index events_deal_id_created_at_idx on public.events (deal_id, created_at desc);
create index events_status_priority_created_at_idx on public.events (status, priority, created_at);
create index event_comments_event_id_idx on public.event_comments (event_id, created_at);
create index event_comments_author_id_idx on public.event_comments (author_id);
create index profiles_role_idx on public.profiles (role);

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger deals_touch_updated_at
before update on public.deals
for each row execute function public.touch_updated_at();

create trigger events_touch_updated_at
before update on public.events
for each row execute function public.touch_updated_at();

create or replace function public.bump_deal_updated_at()
returns trigger
language plpgsql
as $$
begin
  update public.deals
  set updated_at = now()
  where id = coalesce(new.deal_id, old.deal_id);
  return coalesce(new, old);
end;
$$;

create trigger events_bump_deal
after insert or update on public.events
for each row execute function public.bump_deal_updated_at();

create or replace function public.current_profile()
returns public.profiles
language sql
stable
security definer
set search_path = public
as $$
  select *
  from public.profiles
  where id = auth.uid()
$$;

create or replace function public.is_active_user()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and is_active = true
  )
$$;

create or replace function public.current_role()
returns public.user_role
language sql
stable
security definer
set search_path = public
as $$
  select role
  from public.profiles
  where id = auth.uid()
    and is_active = true
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.current_role() = 'admin'
$$;

create or replace function public.is_owner()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.current_role() = 'owner'
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  meta_role text;
  resolved_role public.user_role;
begin
  meta_role := coalesce(new.raw_user_meta_data->>'role', 'team');
  if meta_role in ('admin', 'owner', 'team') then
    resolved_role := meta_role::public.user_role;
  else
    resolved_role := 'team';
  end if;

  insert into public.profiles (id, name, email, role)
  values (
    new.id,
    coalesce(nullif(new.raw_user_meta_data->>'name', ''), split_part(new.email, '@', 1)),
    new.email,
    resolved_role
  );
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

create or replace function public.enforce_event_update()
returns trigger
language plpgsql
as $$
begin
  if public.is_admin() then
    return new;
  end if;

  if public.current_role() is distinct from 'owner' then
    raise exception 'Not allowed to update events';
  end if;

  if new.deal_id is distinct from old.deal_id
    or new.description is distinct from old.description
    or new.priority is distinct from old.priority
    or new.created_by is distinct from old.created_by
    or new.created_at is distinct from old.created_at
  then
    raise exception 'Owners may only close events';
  end if;

  if old.status is distinct from 'open' then
    raise exception 'Only open events can be updated';
  end if;

  if new.status not in ('closed', 'na') then
    raise exception 'Owners may only mark events closed or NA';
  end if;

  new.done_by := auth.uid();
  new.done_at := coalesce(new.done_at, now());
  return new;
end;
$$;

create trigger events_enforce_update
before update on public.events
for each row execute function public.enforce_event_update();

create or replace function public.enforce_comment_insert()
returns trigger
language plpgsql
as $$
declare
  event_row public.events;
begin
  if not public.is_active_user() then
    raise exception 'Not allowed to comment';
  end if;
  if new.author_id is distinct from auth.uid() then
    raise exception 'You can only create your own comments';
  end if;

  select * into event_row
  from public.events
  where id = new.event_id;

  if event_row.id is null then
    raise exception 'Event not found';
  end if;
  if event_row.status is distinct from 'open' then
    raise exception 'Comments are only allowed on open events';
  end if;

  new.comment := trim(new.comment);
  if new.comment = '' then
    raise exception 'Comment cannot be empty';
  end if;

  return new;
end;
$$;

create trigger event_comments_enforce_insert
before insert on public.event_comments
for each row execute function public.enforce_comment_insert();

alter table public.profiles enable row level security;
alter table public.deals enable row level security;
alter table public.events enable row level security;
alter table public.event_comments enable row level security;

create policy "Active users can read profiles"
on public.profiles for select
to authenticated
using (public.is_active_user());

create policy "Admins can update profiles"
on public.profiles for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "Active users can read allowed deals"
on public.deals for select
to authenticated
using (
  public.is_active_user()
  and (
    public.current_role() in ('admin', 'owner')
    or status = 'active'
  )
);

create policy "Admins can insert deals"
on public.deals for insert
to authenticated
with check (public.is_admin() and created_by = auth.uid());

create policy "Admins can update deals"
on public.deals for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "Admins can delete deals"
on public.deals for delete
to authenticated
using (public.is_admin());

create policy "Active users can read events for visible deals"
on public.events for select
to authenticated
using (
  public.is_active_user()
  and exists (
    select 1
    from public.deals d
    where d.id = events.deal_id
      and (
        public.current_role() in ('admin', 'owner')
        or d.status = 'active'
      )
  )
);

create policy "Active users can create events on visible deals"
on public.events for insert
to authenticated
with check (
  public.is_active_user()
  and created_by = auth.uid()
  and status = 'open'
  and done_by is null
  and done_at is null
  and exists (
    select 1
    from public.deals d
    where d.id = deal_id
      and (
        public.current_role() in ('admin', 'owner')
        or d.status = 'active'
      )
  )
);

create policy "Admins and owners can update events"
on public.events for update
to authenticated
using (public.current_role() in ('admin', 'owner'))
with check (public.current_role() in ('admin', 'owner'));

create policy "Admins can delete events"
on public.events for delete
to authenticated
using (public.is_admin());

create policy "Active users can read comments"
on public.event_comments for select
to authenticated
using (public.is_active_user());

create policy "Active users can comment on open events"
on public.event_comments for insert
to authenticated
with check (
  public.is_active_user()
  and author_id = auth.uid()
);
