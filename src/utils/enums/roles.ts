import type { Enums } from '../../supabase/database.types';

export const AppRole = {
  SUPER_USER: 'SUPER_USER',
  PROVIDER: 'PROVIDER',
  USER: 'USER',
} as const;

export type AppRole = Enums<'global_role'>;
