import { insertNutritionGoals } from '../../../services/userPreference';
import { createClient } from '../../utils/supabase/server';

// Example request body:
// {
//   "nutrition_goals": {
//     "protein": 50,
//     "carbohydrates": 90,
//     "fats": 84,
//     "vitamins": 95,
//     "minerals": 99,
//     "fiber": 80
//   }
// }
export async function POST(request) {
  try {
    // Use server-side Supabase client for API routes
    const supabase = await createClient();
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return Response.json(
        { error: "User not authenticated" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { nutrition_goals } = body;

    if (!nutrition_goals || typeof nutrition_goals !== 'object') {
      return Response.json(
        { error: "nutrition_goals (object) is required in request body" },
        { status: 400 }
      );
    }

    // Pass supabase and user to insertNutritionGoals for server-side operation
    const result = await insertNutritionGoals(nutrition_goals, supabase, user);
    if (!result) {
      return Response.json(
        { error: "Failed to save nutrition goals" },
        { status: 500 }
      );
    }

    return Response.json({ 
      success: true,
      data: result 
    });
  } catch (error) {
    console.error("Error in nutrition-goals API:", error);
    return Response.json(
      { error: "Failed to process nutrition goals" },
      { status: 500 }
    );
  }
}

