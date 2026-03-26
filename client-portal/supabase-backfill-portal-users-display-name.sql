-- Fill missing portal_users.display_name from existing auth.users metadata.
-- This helps legacy users created before display_name support show their real names
-- in the approval lists.

alter table if exists public.portal_users
  add column if not exists display_name text;

create index if not exists idx_portal_users_display_name
  on public.portal_users (display_name);

update public.portal_users as pu
set display_name = nullif(
  btrim(
    coalesce(
      au.raw_user_meta_data ->> 'full_name',
      au.raw_user_meta_data ->> 'display_name',
      au.raw_user_meta_data ->> 'name',
      split_part(au.email, '@', 1)
    )
  ),
  ''
)
from auth.users as au
where au.id = pu.auth_user_id
  and (pu.display_name is null or btrim(pu.display_name) = '')
  and pu.role = 'customer';
