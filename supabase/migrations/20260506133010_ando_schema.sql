create type public.global_role as enum ('SUPER_USER', 'PROVIDER', 'USER');

create table public.app_user (
  id uuid primary key,
  email text not null unique,
  global_role public.global_role not null default 'USER'
);