-- Public bucket used to store activity images uploaded from the backend.
-- The backend uploads with the service role key (bypasses RLS); public = true
-- allows the generated public URLs to be read by anyone.
insert into storage.buckets (id, name, public)
values ('activity-images', 'activity-images', true)
on conflict (id) do nothing;
