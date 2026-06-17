alter table public.activity
  add column if not exists location text,
  add column if not exists images   text[] not null default '{}';
