create or replace function public.handle_new_or_updated_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.app_user (id, email, global_role)
  values (new.id, new.email, 'USER')
  on conflict (id) do update
    set email = excluded.email;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row
execute function public.handle_new_or_updated_auth_user();

drop trigger if exists on_auth_user_email_updated on auth.users;
create trigger on_auth_user_email_updated
after update of email on auth.users
for each row
execute function public.handle_new_or_updated_auth_user();