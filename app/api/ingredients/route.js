// [START] documentation reference: https://ai.google.dev/gemini-api/docs/image-understanding
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function POST(request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    
    // Check if API key exists
    if (!apiKey) {
      return Response.json(
        { error: "GEMINI_API_KEY is not set on the server." },
        { status: 500 }
      );
    }

    // Get the image from the request (can be FormData or JSON with base64)
    const formData = await request.formData();
    const imageFile = formData.get("image");

    // Check if image file is provided
    if (!imageFile) {
      return Response.json(
        { error: "No image provided. Please send an image file." },
        { status: 400 }
      );
    }

    // Convert the image file to base64
    const arrayBuffer = await imageFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64Image = buffer.toString("base64");

    // Determine MIME type from the file
    const mimeType = imageFile.type || "image/jpeg";

    // Initialize Gemini AI
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    // Analyze ingredients from the image
    const parts = [
      {
        inlineData: {
          mimeType: mimeType,
          data: base64Image,
        },
      },
      {
        text: `Analyze this image. If it contains food or a meal, identify the name of the food and all the ingredients with their estimated weight in grams for each ingredient.
If the image does not contain food, set food_name to "not a food" and ingredients to null.

ONLY RESPOND WITH THE JSON FORMAT. For example:
{
  "food_name": "Chicken Burger",
  "ingredients": [
    {
      "name": "Chicken",
      "grams": 120
    },
    {
      "name": "Burger Bun",
      "grams": 50
    },
    {
      "name": "Lettuce",
      "grams": 20
    },
    {
      "name": "Tomato",
      "grams": 30
    }
  ]
}

Or if not food:
{
  "food_name": "not a food",
  "ingredients": null
}`,
      },
    ];

    // Generate caption using Gemini
    const result = await model.generateContent(parts);
    const response = await result.response;
    const caption = response.text();
    console.log("response from gemini:", caption);

    // Parse JSON from markdown code blocks or plain text
    let parsedData = null;
    try {
      // Try to extract JSON from markdown code blocks (```json ... ```)
      const jsonMatch = caption.match(/```(?:json)?\s*([\s\S]*?)```/);
      const jsonString = jsonMatch ? jsonMatch[1] : caption;
      
      // Clean up the string and parse JSON
      const cleanedJson = jsonString.trim();
      parsedData = JSON.parse(cleanedJson);
    } catch (parseError) {
      console.error("Error parsing JSON from Gemini response:", parseError);
      // If parsing fails, return the raw caption
      parsedData = { caption: caption };
    }

    return Response.json(parsedData);
  } catch (error) {
    console.error("Error processing image:", error);
    return Response.json(
      { error: "Failed to process image. Please try again." },
      { status: 500 }
    );
  }
}

// example response:
// {
//   food_name: "Katsu Curry",
//   ingredients: [
//     { name: "Katsu (fried breaded cutlet)", grams: 150 },
//     { name: "Curry sauce", grams: 100 },
//     { name: "White rice", grams: 200 },
//     { name: "Potatoes", grams: 80 },
//     { name: "Carrots", grams: 50 },
//     { name: "Pickled vegetables", grams: 30 }
//   ]
// }
// [END]
