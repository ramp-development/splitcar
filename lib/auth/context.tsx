"use client";

import { useUser, useClerk } from "@clerk/nextjs";

type AuthUser = {
  id: string;
};

type AuthContextType = {
  user: AuthUser | null;
  loading: boolean;
  signOut: () => Promise<void>;
};

/**
 * Custom auth hook wrapping Clerk's useUser
 * Provides a compatible API with the old Supabase auth context
 */
export const useAuth = (): AuthContextType => {
  const { user, isLoaded } = useUser();
  const { signOut: clerkSignOut } = useClerk();

  const signOut = async () => {
    await clerkSignOut();
  };

  return {
    user: user ? { id: user.id } : null,
    loading: !isLoaded,
    signOut,
  };
};
