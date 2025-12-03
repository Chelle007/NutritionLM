import { GoogleGenerativeAI } from '@google/generative-ai';
import { createClient } from '../../utils/supabase/server';
import { getUserPreferenceServer, insertNutritionGoals } from '../../../services/userPreference';

// Request body: user_preference object
export async function POST() {
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

    // Get user preferences using server-side function
    const userPreference = await getUserPreferenceServer(supabase, user);
    
    if (!userPreference) {
      return Response.json(
        { error: "Failed to get user preferences" },
        { status: 500 }
      );
    }

    console.log("userPreference:", userPreference);

    // Check API key
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return Response.json(
        { error: "GEMINI_API_KEY is not set on the server." },
        { status: 500 }
      );
    }

    // Call Gemini API to generate JSON make user's optimal nutrition recommendation
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    // Build the prompt - combine all text into a single parts array
    const parts = [
      {
        text: `
        You are a nutritionist. 
        Your task is to recommend the optimal average nutrition intake for a user to maintain their nutrition intake for a week based on their preference.
        User's preference: ${userPreference}.
        Analyse the user preference and give the recommended daily nutrition intake in grams for each nutrition type (protein, carbohydrates, fats, vitamins, minerals, fiber) based on the user preference data.
        Provide realistic values in grams:
        - Protein: typically 50-150g per day
        - Carbohydrates: typically 200-300g per day
        - Fats: typically 50-100g per day
        - Vitamins: provide in grams (note: vitamins are typically measured in mg, but provide gram values for consistency)
        - Minerals: provide in grams (note: minerals are typically measured in mg, but provide gram values for consistency)
        - Fiber: typically 25-35g per day
        Now you should generate a JSON of nutritions and its recommended average daily intake in grams based on the user preference data.
        ONLY RESPOND WITH THE JSON FORMAT AND NO EXPLANATION. 
Example format:
{
  "protein": 120,
  "carbohydrates": 250,
  "fats": 75,
  "vitamins": 0.5,
  "minerals": 2.5,
  "fiber": 30
}`
      }
    ];

    // Generate content - pass parts array directly (no role or contents wrapper)
    const result = await model.generateContent(parts);
    const response = await result.response;
    const caption = response.text();
    console.log("result from gemini:", caption);

    // Parse JSON from markdown code blocks or plain text
    let parsedData = null;
    try {
      // Try to extract JSON from markdown code blocks
      const jsonMatch = caption.match(/```(?:json)?\s*([\s\S]*?)```/);
      const jsonString = jsonMatch ? jsonMatch[1] : caption;
      const cleanedJson = jsonString.trim();
      parsedData = JSON.parse(cleanedJson);
    } catch (parseError) {
      console.error("Error parsing JSON from Gemini response:", parseError);
      return Response.json(
        { error: "Failed to parse nutrition data from AI response" },
        { status: 500 }
      );
    }

    // Insert or update nutrition goals using server-side function
    const nutritionGoals = await insertNutritionGoals(parsedData, supabase, user);
    
    if (!nutritionGoals) {
      return Response.json(
        { error: "Failed to save nutrition goals" },
        { status: 500 }
      );
    }

    console.log("nutritionGoals:", nutritionGoals);

    return Response.json({ nutritionGoals: nutritionGoals });
  } catch (error) {
    console.error("Error in nutritionist API:", error);
    return Response.json(
      { error: "Failed to process nutrition analysis" },
      { status: 500 }
    );
  }
}

// example response:
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