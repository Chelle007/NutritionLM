import getSupabaseClient from './supabaseClient'

// Used to check if the user is authenticated or not
// Call this function before accessing any user data
export default async function getAuthenticatedUser() {
  const supabase = getSupabaseClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) throw new Error('User not authenticated');

  return user;
}
