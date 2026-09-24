-- Household access management for owner-facing People & access controls.

create or replace function public.remove_household_member(
  target_household uuid,
  target_member uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  member_row public.household_members%rowtype;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  if not public.is_household_owner(target_household) then
    raise exception 'Only a household owner can remove access';
  end if;

  select *
  into member_row
  from public.household_members
  where id = target_member
    and household_id = target_household;

  if member_row.id is null then
    raise exception 'Household member was not found';
  end if;

  if member_row.role = 'owner' or member_row.user_id = auth.uid() then
    raise exception 'The household owner cannot remove their own access';
  end if;

  delete from public.household_members
  where id = target_member
    and household_id = target_household;
end;
$$;

create or replace function public.cancel_household_invitation(
  target_household uuid,
  target_invitation uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  if not public.is_household_owner(target_household) then
    raise exception 'Only a household owner can cancel invitations';
  end if;

  update public.household_invitations
  set status = 'revoked'
  where id = target_invitation
    and household_id = target_household
    and status = 'pending';

  if not found then
    raise exception 'Pending invitation was not found';
  end if;
end;
$$;

grant execute on function public.remove_household_member(uuid, uuid) to authenticated;
grant execute on function public.cancel_household_invitation(uuid, uuid) to authenticated;
