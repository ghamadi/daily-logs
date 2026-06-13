import { Enum } from '@daily-logs/utils/ts-utils';

export const AuthProvider = {
  Supabase: 'supabase',
} as const;
export type AuthProvider = Enum<typeof AuthProvider>;
