import { createBrowserClient } from '@supabase/ssr'

/**
 * Creates a Supabase client
 * Handles authentication cookies for Next.js
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  )
}

// Creates a new client instance each time
// Ensures proper cookie handling in Next.js
export default function getSupabaseClient() {
  return createClient();
}