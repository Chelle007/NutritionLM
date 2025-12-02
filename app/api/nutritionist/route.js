import { GoogleGenerativeAI } from '@google/generative-ai';

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

    // Check API key
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return Response.json(
        { error: "GEMINI_API_KEY is not set on the server." },
        { status: 500 }
      );
    }

    // Call Gemini API to generate JSON of nutritions and its amount
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    // Reference: https://www.medicinenet.com/what_are_the_7_types_of_nutrition/article.htm
    // Build the prompt - combine all text into a single parts array
    const parts = [
      {
        text: `The food name is "${food_name}". The ingredients are: ${ingredients.join(", ")}.

ONLY RESPOND WITH THE JSON FORMAT AND NO EXPLANATION. 
Provide 6 types of nutritions as specified below and its estimated amount (0-100) for a single serving of the food:

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

    return Response.json({ nutritions: parsedData });
  } catch (error) {
    console.error("Error in nutritionist API:", error);
    return Response.json(
      { error: "Failed to process nutrition analysis" },
      { status: 500 }
    );
  }
}