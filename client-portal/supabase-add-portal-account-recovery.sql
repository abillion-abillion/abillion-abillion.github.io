create or replace function public.portal_recover_login_id(p_email text)
returns text
language sql
stable
security definer
set search_path = public
as $$
  with normalized as (
    select lower(btrim(coalesce(p_email, ''))) as email
  )
  select
    case
      when n.email = '' then null
      when exists (
        select 1
        from public.portal_customers c
        where lower(coalesce(c.email, '')) = n.email
          and nullif(btrim(c.label), '') is not null
      ) then (
        select nullif(btrim(c2.label), '')
        from public.portal_customers c2
        where lower(coalesce(c2.email, '')) = n.email
          and nullif(btrim(c2.label), '') is not null
        order by c2.id desc
        limit 1
      )
      when exists (
        select 1
        from auth.users u
        where lower(coalesce(u.email, '')) = n.email
      ) then split_part(n.email, '@', 1)
      else null
    end as login_id
  from normalized n;
$$;

grant execute on function public.portal_recover_login_id(text) to anon, authenticated;
