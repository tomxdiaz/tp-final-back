import type { Enums } from '../../supabase/database.types';

export const AppRole = {
  SUPER_USER: 'SUPER_USER',
  USER: 'USER',
} as const;

export type AppRole = Enums<'global_role'>;
