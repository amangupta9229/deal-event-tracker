-- Allow service-role / SQL-editor updates (auth.uid() is null).
-- Owners and admins can delete actions.

create or replace function public.enforce_event_update()
returns trigger
language plpgsql
as $$
declare
  assigned_changed boolean;
  closing boolean;
begin
  if auth.uid() is null then
    return new;
  end if;

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

create or replace function public.enforce_deal_update()
returns trigger
language plpgsql
as $$
begin
  if auth.uid() is null then
    return new;
  end if;

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

drop policy if exists "Admins can delete events" on public.events;
drop policy if exists "Admins and owners can delete events" on public.events;
create policy "Admins and owners can delete events"
on public.events for delete
to authenticated
using (public.current_role() in ('admin', 'owner'));
