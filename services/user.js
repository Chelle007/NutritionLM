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

    // If user doesn't exist, create them
    if (!existingUser && checkError?.code === 'PGRST116') {
        const { error: insertError } = await supabase
            .from('users')
            .insert([{ id: userId }]);
        
        if (insertError) {
            console.error('Error creating user:', insertError);
            throw insertError;
        }
        console.log('Created user record:', userId);
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

