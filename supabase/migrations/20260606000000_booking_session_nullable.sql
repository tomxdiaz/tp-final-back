-- Make activity_session_id nullable on booking so that deleting a session
-- (when an activity is deleted) keeps the booking record as history instead
-- of raising a FK violation.
alter table public.booking
  drop constraint booking_activity_session_id_fkey,
  alter column activity_session_id drop not null,
  add constraint booking_activity_session_id_fkey
    foreign key (activity_session_id)
    references public.activity_session(id)
    on delete set null;
