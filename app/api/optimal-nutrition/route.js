import { GoogleGenerativeAI } from '@google/generative-ai';
import { getUserPreference } from '@/services/user';
import { insertNutritionGoals } from '@/services/userPreference';

// Request body: user_preference object
export async function POST(request) {
  try {
    const userPreference = await getUserPreference();
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
        Analyse the user preference and give the recommended nutrition intake on a scale of 0-100 for each nutrition type (protein, carbohydrates, fats, vitamins, minerals, fiber) based on the user preference data.
        Now you should generate a JSON of nutritions and its recommended average intake for a week based on the user preference data.
        ONLY RESPOND WITH THE JSON FORMAT AND NO EXPLANATION. 
Example format:
{
  "protein": 50,
  "carbohydrates": 90,
  "fats": 84,
  "vitamins": 95,
  "minerals": 99,
  "fiber": 80
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

    const nutritionGoals = await insertNutritionGoals(parsedData);
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