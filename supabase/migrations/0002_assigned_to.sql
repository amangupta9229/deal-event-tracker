-- Assigned To on orders (deals) and actions (events).
-- Assignable people are active owners and team members, not admins.
-- Safe to re-run if a previous attempt failed on the events backfill.

drop trigger if exists events_enforce_update on public.events;
drop trigger if exists deals_enforce_update on public.deals;

alter table public.deals
  add column if not exists assigned_to uuid references public.profiles (id);

alter table public.events
  add column if not exists assigned_to uuid references public.profiles (id);

create or replace function public.is_assignable(uid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = uid
      and is_active = true
      and role in ('owner', 'team')
  )
$$;

update public.deals d
set assigned_to = coalesce(
  (
    select p.id
    from public.profiles p
    where p.role in ('owner', 'team')
      and p.is_active = true
    order by p.created_at
    limit 1
  ),
  d.created_by
)
where d.assigned_to is null;

update public.events e
set assigned_to = coalesce(
  e.assigned_to,
  (
    select d.assigned_to
    from public.deals d
    where d.id = e.deal_id
  ),
  e.created_by
)
where e.assigned_to is null;

create or replace function public.enforce_event_update()
returns trigger
language plpgsql
as $$
declare
  assigned_changed boolean;
  closing boolean;
begin
  if public.is_admin() then
    if new.assigned_to is not null and not public.is_assignable(new.assigned_to) then
      raise exception 'Assigned to must be an active owner or team member';
    end if;
    return new;
  end if;

  if public.current_role() is distinct from 'owner' then
    raise exception 'Not allowed to update events';
  end if;

  assigned_changed := new.assigned_to is distinct from old.assigned_to;
  closing := old.status = 'open' and new.status in ('closed', 'na');

  if new.deal_id is distinct from old.deal_id
    or new.description is distinct from old.description
    or new.priority is distinct from old.priority
    or new.created_by is distinct from old.created_by
    or new.created_at is distinct from old.created_at
  then
    raise exception 'Owners may only assign or close actions';
  end if;

  if assigned_changed then
    if new.assigned_to is null or not public.is_assignable(new.assigned_to) then
      raise exception 'Assigned to must be an active owner or team member';
    end if;
    if not closing and new.status is distinct from old.status then
      raise exception 'Owners may only assign or close actions';
    end if;
    if not closing then
      return new;
    end if;
  end if;

  if closing then
    if old.status is distinct from 'open' then
      raise exception 'Only open actions can be updated';
    end if;
    new.done_by := auth.uid();
    new.done_at := coalesce(new.done_at, now());
    return new;
  end if;

  if new.status is distinct from old.status
    or new.done_by is distinct from old.done_by
    or new.done_at is distinct from old.done_at
  then
    raise exception 'Owners may only assign or close actions';
  end if;

  return new;
end;
$$;

create trigger events_enforce_update
before update on public.events
for each row execute function public.enforce_event_update();

create or replace function public.enforce_deal_update()
returns trigger
language plpgsql
as $$
begin
  if public.is_admin() then
    if new.assigned_to is not null and not public.is_assignable(new.assigned_to) then
      raise exception 'Assigned to must be an active owner or team member';
    end if;
    return new;
  end if;

  if public.current_role() is distinct from 'owner' then
    raise exception 'Not allowed to update orders';
  end if;

  if new.name is distinct from old.name
    or new.status is distinct from old.status
    or new.created_by is distinct from old.created_by
    or new.created_at is distinct from old.created_at
  then
    raise exception 'Owners may only change order assignment';
  end if;

  if new.assigned_to is null or not public.is_assignable(new.assigned_to) then
    raise exception 'Assigned to must be an active owner or team member';
  end if;

  return new;
end;
$$;

create trigger deals_enforce_update
before update on public.deals
for each row execute function public.enforce_deal_update();

drop policy if exists "Admins can update deals" on public.deals;
drop policy if exists "Admins and owners can update deals" on public.deals;
create policy "Admins and owners can update deals"
on public.deals for update
to authenticated
using (public.current_role() in ('admin', 'owner'))
with check (public.current_role() in ('admin', 'owner'));

drop policy if exists "Admins can insert deals" on public.deals;
create policy "Admins can insert deals"
on public.deals for insert
to authenticated
with check (
  public.is_admin()
  and created_by = auth.uid()
  and public.is_assignable(assigned_to)
);

drop policy if exists "Active users can create events on visible deals" on public.events;
create policy "Active users can create events on visible deals"
on public.events for insert
to authenticated
with check (
  public.is_active_user()
  and created_by = auth.uid()
  and status = 'open'
  and done_by is null
  and done_at is null
  and public.is_assignable(assigned_to)
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
