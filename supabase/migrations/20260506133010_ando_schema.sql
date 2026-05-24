create type public.global_role as enum ('SUPER_USER', 'USER');

create table public.app_user (
  id uuid primary key,
  email text not null unique,
  global_role public.global_role not null default 'USER'
);

create table public.newsletter (
  id uuid primary key default gen_random_uuid(),
  email text not null unique
);