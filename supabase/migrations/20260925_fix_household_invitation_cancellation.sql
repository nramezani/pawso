-- Repair invitation cancellation on projects where the 20260924 migration
-- was already applied. The household_invitations status constraint uses
-- "revoked" (not "cancelled") for owner-cancelled invitations.

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

grant execute on function public.cancel_household_invitation(uuid, uuid) to authenticated;

-- Bind addressed invitations to the authenticated email. Invitations created
-- without an email remain shareable by code.
create or replace function public.accept_household_invitation(
  code_text text,
  preferred_display_name text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  invitation public.household_invitations%rowtype;
  display_value text;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  select *
  into invitation
  from public.household_invitations
  where invite_code = code_text::uuid
    and status = 'pending'
    and expires_at > now()
  for update;

  if invitation.id is null then
    raise exception 'Invitation is invalid, expired, or already used';
  end if;

  if invitation.invited_email is not null
    and lower(coalesce(auth.jwt() ->> 'email', '')) <> lower(invitation.invited_email)
  then
    raise exception 'Sign in with the email address that received this invitation';
  end if;

  display_value := coalesce(
    nullif(trim(preferred_display_name), ''),
    split_part(coalesce(auth.jwt() ->> 'email', ''), '@', 1),
    'Household member'
  );

  insert into public.household_members(
    household_id, user_id, display_name, role
  )
  values (
    invitation.household_id,
    auth.uid(),
    display_value,
    invitation.role
  )
  on conflict (household_id, user_id)
  do update set
    display_name = excluded.display_name,
    role = case
      when public.household_members.role = 'owner' then 'owner'
      else excluded.role
    end;

  update public.household_invitations
  set
    status = 'accepted',
    accepted_by = auth.uid(),
    accepted_at = now()
  where id = invitation.id;

  return invitation.household_id;
end;
$$;

grant execute on function public.accept_household_invitation(text, text) to authenticated;
