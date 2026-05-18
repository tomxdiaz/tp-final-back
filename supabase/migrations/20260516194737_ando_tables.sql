-- ── Completar app_user ──────────────────────────────────────────
alter table public.app_user
  add column if not exists first_name text,
  add column if not exists last_name  text,
  add column if not exists phone      text,
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now();

-- ── Enums ───────────────────────────────────────────────────────
do $$ begin
  create type public.difficulty_level as enum ('BAJA', 'MEDIA', 'ALTA', 'EXTREMA');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.session_status as enum ('AVAILABLE', 'CANCELLED', 'COMPLETED');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.booking_status as enum ('PENDING', 'CONFIRMED', 'CANCELLED');
exception when duplicate_object then null; end $$;

-- ── Business ────────────────────────────────────────────────────
create table if not exists public.business (
  id            serial primary key,
  app_user_id   uuid not null unique references public.app_user(id),
  business_name text not null,
  description   text,
  contact_email text,
  contact_phone text,
  verified      boolean not null default false,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- ── Activity ─────────────────────────────────────────────────────
create table if not exists public.activity (
  id               serial primary key,
  business_id      integer not null references public.business(id),
  title            text not null,
  description      text,
  category         text not null,
  location_name    text,
  province         text,
  country          text not null default 'Argentina',
  meeting_point    text,
  latitude         numeric(9,6),
  longitude        numeric(9,6),
  difficulty       public.difficulty_level,
  duration_minutes int,
  base_price       numeric(10,2) not null check (base_price >= 0),
  currency         text not null default 'ARS',
  min_age          int,
  max_participants int,
  is_active        boolean not null default true,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

-- ── Activity schedule rule ────────────────────────────────────────
create table if not exists public.activity_schedule_rule (
  id               serial primary key,
  activity_id      integer not null references public.activity(id),
  amount_of_days   int not null,
  days_of_week     int[] not null,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

-- ── Activity session ──────────────────────────────────────────────
create table if not exists public.activity_session (
  id               serial primary key,
  activity_id      integer not null references public.activity(id),
  schedule_rule_id integer references public.activity_schedule_rule(id),
  datetime   timestamptz not null,
  booked_spots     int not null default 0 check (booked_spots >= 0),
  status           public.session_status not null default 'AVAILABLE',
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  constraint uq_session unique (activity_id, schedule_rule_id, datetime)
);

-- ── Booking ───────────────────────────────────────────────────────
create table if not exists public.booking (
  id                  serial primary key,
  app_user_id         uuid not null references public.app_user(id),
  activity_session_id integer not null references public.activity_session(id),
  number_of_people    int not null check (number_of_people > 0),
  total_price         numeric(10,2) not null check (total_price >= 0),
  status              public.booking_status not null default 'PENDING',
  customer_notes      text,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

-- ── Review ────────────────────────────────────────────────────────
create table if not exists public.review (
  id          serial primary key,
  app_user_id uuid not null references public.app_user(id),
  activity_id integer not null references public.activity(id),
  booking_id  integer not null unique references public.booking(id),
  rating      int not null check (rating >= 1 and rating <= 5),
  comment     text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
