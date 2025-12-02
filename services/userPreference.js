import getSupabaseClient from './supabaseClient'
import getAuthenticatedUser from './auth'
import { ensureUserExists } from './user'

// Example argument for insertUserPreference function
// { 
//     birth_date: '1990-01-01', 
//     gender: 'male',
//     weight_kg: 70,
//     height_cm: 180,
//     goal: 'weight_loss',
//     activity_level: 'moderate',
//     dietary_preference: 'vegan',
//     allergies: ['gluten', 'lactose'],
//     habits: ['late_snacking', 'sugary_drinks'],
// }
export async function insertUserPreference(userPref) {
    const user = await getAuthenticatedUser();
    const supabase = getSupabaseClient();
    
    // Ensure user exists in users table before inserting preferences
    await ensureUserExists(user.id);
    
    const { data, error } = await supabase
        .from('user_preferences')
        .insert([{ 
            ...userPref, 
            user_id: user.id 
        }])
        .select() // returns the inserted data
  
    if (error) {
        console.error('Insert error:', error);
        return null;
    }
    console.log('Inserted user preference:', data);
    return data;
}

export async function getUserPreference() {
    const user = await getAuthenticatedUser();
    const supabase = getSupabaseClient();
    
    // Ensure user exists in users table before querying preferences
    await ensureUserExists(user.id);
    
    const { data, error } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', user.id);

    if (error) {
        console.error('Get error:', error);
        return null;
    }
    console.log('Got user preference:', data);
    return data;
}

// request body: nutritionGoals object
export async function insertNutritionGoals(nutritionGoals) {
    const user = await getAuthenticatedUser();
    const supabase = getSupabaseClient();
    
    // Ensure user exists in users table
    await ensureUserExists(user.id);
    
    // Check if user preference exists
    const existing = await getUserPreference();
    
    if (existing && existing.length > 0) {
        // Update existing preference
        const { data, error } = await supabase
            .from('user_preferences')
            .update({ 
                nutrition_goals: nutritionGoals,
                updated_at: new Date().toISOString()
            })
            .eq('user_id', user.id)
            .select();
        
        if (error) {
            console.error('Update error:', error);
            return null;
        }
        console.log('Updated nutrition goals:', data);
        return data;
    } else {
        // Create new preference with nutrition goals
        const { data, error } = await supabase
            .from('user_preferences')
            .insert([{ 
                user_id: user.id,
                nutrition_goals: nutritionGoals
            }])
            .select();
        
        if (error) {
            console.error('Insert error:', error);
            return null;
        }
        console.log('Inserted nutrition goals:', data);
        return data;
    }
}