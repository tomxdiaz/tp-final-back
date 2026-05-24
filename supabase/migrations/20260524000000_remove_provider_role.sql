-- Migrate existing PROVIDER users to USER before removing the role
UPDATE public.app_user SET global_role = 'USER' WHERE global_role = 'PROVIDER';

-- Recreate the enum without PROVIDER
CREATE TYPE public.global_role_new AS ENUM ('SUPER_USER', 'USER');

ALTER TABLE public.app_user
  ALTER COLUMN global_role TYPE public.global_role_new
  USING global_role::text::public.global_role_new;

DROP TYPE public.global_role;
ALTER TYPE public.global_role_new RENAME TO global_role;
