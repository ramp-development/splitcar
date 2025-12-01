/**
 * Clerk authentication utilities
 * Replaces lib/auth/context.tsx (Supabase auth)
 */

import { auth, currentUser } from "@clerk/nextjs/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Get the current Clerk user on the server
 * Returns null if not authenticated
 */
export async function getCurrentClerkUser() {
  return await currentUser();
}

/**
 * Get the current Clerk user ID
 * Returns null if not authenticated
 */
export async function getCurrentUserId(): Promise<string | null> {
  const { userId } = await auth();
  return userId;
}

/**
 * Ensure user exists in Supabase database
 * Creates user record if it doesn't exist
 * This should be called after Clerk authentication
 */
export async function ensureUserInDatabase(userId: string) {
  const supabase = await createClient();

  // Check if user exists
  const { data: existingUser } = await supabase
    .from("users")
    .select("id")
    .eq("id", userId)
    .single();

  if (!existingUser) {
    // Create user in database
    const { error } = await supabase
      .from("users")
      .insert({ id: userId });

    if (error) {
      console.error("Failed to create user in database:", error);
      throw new Error("Failed to create user record");
    }
  }

  return userId;
}

/**
 * Protect a server component/action - throws if not authenticated
 */
export async function requireAuth() {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  return userId;
}
