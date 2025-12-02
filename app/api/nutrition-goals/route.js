import { insertNutritionGoals } from '../../../services/userPreference';

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
    const body = await request.json();
    const { nutrition_goals } = body;

    if (!nutrition_goals || typeof nutrition_goals !== 'object') {
      return Response.json(
        { error: "nutrition_goals (object) is required in request body" },
        { status: 400 }
      );
    }

    const result = await insertNutritionGoals(nutrition_goals);
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

