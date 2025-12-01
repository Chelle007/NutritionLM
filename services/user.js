import getSupabaseClient from './supabaseClient'
import getAuthenticatedUser from './auth'

/**
 * Ensures a user record exists in the users table
 * Creates one if it doesn't exist
 */
export async function ensureUserExists(userId) {
    const supabase = getSupabaseClient();
    
    // Check if user exists
    const { data: existingUser, error: checkError } = await supabase
        .from('users')
        .select('id')
        .eq('id', userId)
        .single();

    // If user doesn't exist, create them with data from auth metadata
    if (!existingUser && checkError?.code === 'PGRST116') {
        // Get user data from auth to populate profile fields
        const { data: { user: currentAuthUser } } = await supabase.auth.getUser();
        
        let userData = {
            id: userId,
            full_name: null,
            avatar_url: null,
            telegram_chat_id: null,
        };

        // If this is the current authenticated user, populate from their auth metadata
        if (currentAuthUser && currentAuthUser.id === userId) {
            userData.full_name = currentAuthUser.user_metadata?.full_name || 
                                currentAuthUser.user_metadata?.name || 
                                currentAuthUser.user_metadata?.display_name || 
                                null;
            userData.avatar_url = currentAuthUser.user_metadata?.avatar_url || 
                                 currentAuthUser.user_metadata?.picture || 
                                 null;
        }

        const { error: insertError } = await supabase
            .from('users')
            .insert([userData]);
        
        if (insertError) {
            console.error('Error creating user:', insertError);
            throw insertError;
        }
        console.log('Created user record with profile data:', userId);
    } else if (checkError && checkError.code !== 'PGRST116') {
        console.error('Error checking user:', checkError);
        throw checkError;
    }
}

/**
 * Gets the current user's profile from the users table
 */
export async function getUserProfile() {
    const user = await getAuthenticatedUser();
    const supabase = getSupabaseClient();
    
    // Ensure user exists first
    await ensureUserExists(user.id);
    
    const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

    if (error) {
        console.error('Error getting user profile:', error);
        return null;
    }
    
    return data;
}

