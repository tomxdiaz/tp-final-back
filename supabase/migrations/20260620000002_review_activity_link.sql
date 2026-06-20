-- Remove existing reviews (they lack activity_id and cannot be migrated)
delete from public.review;

-- Drop old unique constraint
alter table public.review
  drop constraint if exists uq_review_user_business;

-- Add activity_id column with FK and cascade
alter table public.review
  add column activity_id integer not null references public.activity(id) on delete cascade;

-- Add new unique constraint: one review per user per activity
alter table public.review
  add constraint uq_review_user_activity unique (app_user_id, activity_id);
