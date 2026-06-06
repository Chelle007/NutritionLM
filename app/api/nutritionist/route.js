import { generateFastJson, getErrorResponse } from "../../../services/geminiClient";

// Request body: { food_name: string, ingredients: string[] }
export async function POST(request) {
  try {
    // Extract food name and ingredients from request body
    const { food_name, ingredients } = await request.json();
    if (!food_name || !ingredients || !Array.isArray(ingredients)) {
      return Response.json({ error: "Food name and ingredients array are required" }, { status: 400 });
    }
    console.log("food_name:", food_name);
    console.log("ingredients:", ingredients);

    // Reference: https://www.medicinenet.com/what_are_the_7_types_of_nutrition/article.htm
    const prompt = `The food name is "${food_name}". The ingredients are: ${ingredients.join(", ")}.

ONLY RESPOND WITH THE JSON FORMAT AND NO EXPLANATION. 
Provide 6 types of nutritions as specified below and its estimated amount in grams for a single serving of the food, and also assess the overall healthiness level on a scale of 0-100 (where 100 is the healthiest):

Example format:
{
  "protein": 25,
  "carbohydrates": 45,
  "fats": 15,
  "vitamins": 0.1,
  "minerals": 0.5,
  "fiber": 8,
  "healthy_level": 75
}`;

    let parsedData;
    try {
      parsedData = await generateFastJson(prompt);
      console.log("result from gemini:", parsedData);
    } catch (parseError) {
      console.error("Error parsing JSON from Gemini response:", parseError);
      return Response.json(
        { error: "Failed to parse nutrition data from AI response" },
        { status: 500 }
      );
    }

    return Response.json({ nutritions: parsedData });
  } catch (error) {
    console.error("Error in nutritionist API:", error);
    const { message, status } = getErrorResponse(error);
    return Response.json({ error: message }, { status });
  }
}

// example response:
// {
//   "nutritions": {
//     "protein": 25,
//     "carbohydrates": 45,
//     "fats": 15,
//     "vitamins": 0.1,
//     "minerals": 0.5,
//     "fiber": 8,
//     "healthy_level": 75
//   }
// }
