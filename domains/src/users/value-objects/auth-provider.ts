import { Enum } from '@utils/ts-utils';

export const AuthProvider = {
  Supabase: 'supabase',
} as const;
export type AuthProvider = Enum<typeof AuthProvider>;
