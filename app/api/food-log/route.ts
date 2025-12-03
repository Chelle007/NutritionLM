import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '../../utils/supabase/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function POST(req: NextRequest) {
  try {
    // Get authenticated user
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get form data with image
    const formData = await req.formData();
    const imageFile = formData.get('image') as File | null;

    if (!imageFile) {
      return NextResponse.json({ error: 'No image provided' }, { status: 400 });
    }

    // Step 1: Upload image to Supabase storage
    // Note: Make sure to create a 'food-images' bucket in Supabase Storage
    // with public access if you want the images to be publicly accessible
    const timestamp = Date.now();
    const fileExt = imageFile.name.split('.').pop();
    const fileName = `${user.id}/${timestamp}.${fileExt}`;
    const bucketName = 'food-images';

    // Convert File to ArrayBuffer for upload
    const arrayBuffer = await imageFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(fileName, buffer, {
        contentType: imageFile.type,
        upsert: false
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      // If bucket doesn't exist, try to create it or use a different approach
      // For now, we'll continue without the image URL if upload fails
      console.warn('Image upload failed, continuing without image URL');
    }

    // Get public URL for the uploaded image
    let imageUrl = null;
    if (uploadData) {
      const { data: urlData } = supabase.storage
        .from(bucketName)
        .getPublicUrl(fileName);
      imageUrl = urlData.publicUrl;
    }

    // Step 2: Scan ingredients from image
    // Call Gemini API directly instead of making HTTP fetch
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'GEMINI_API_KEY is not set on the server' },
        { status: 500 }
      );
    }

    // Initialize Gemini AI (reused for both ingredients and nutrition)
    const genAI = new GoogleGenerativeAI(apiKey);

    let foodName: string;
    let ingredients: string[];

    try {
      // Convert buffer to base64
      const base64Image = buffer.toString('base64');
      const mimeType = imageFile.type || 'image/jpeg';

      const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

      // Prepare the parts array with image and prompt
      const parts: any[] = [
        {
          inlineData: {
            mimeType: mimeType,
            data: base64Image,
          },
        },
        {
          text: `Identify the name of the food and all the ingredients in this image. 
ONLY RESPOND WITH THE JSON FORMAT. For example:
{
  "food_name": "Chicken Burger",
  "ingredients": [
    "Chicken",
    "Burger",
    "Lettuce",
    "Tomato"
  ]
}`,
        },
      ];

      // Generate caption using Gemini
      const result = await model.generateContent(parts);
      const response = await result.response;
      const caption = response.text();
      console.log('response from gemini:', caption);

      // Parse JSON from markdown code blocks or plain text
      let parsedData: any = null;
      try {
        // Try to extract JSON from markdown code blocks (```json ... ```)
        const jsonMatch = caption.match(/```(?:json)?\s*([\s\S]*?)```/);
        const jsonString = jsonMatch ? jsonMatch[1] : caption;
        
        // Clean up the string and parse JSON
        const cleanedJson = jsonString.trim();
        parsedData = JSON.parse(cleanedJson);
      } catch (parseError) {
        console.error('Error parsing JSON from Gemini response:', parseError);
        return NextResponse.json(
          { error: 'Failed to parse ingredients data from AI response' },
          { status: 500 }
        );
      }

      foodName = parsedData.food_name || 'Unknown Food';
      ingredients = parsedData.ingredients || [];

      if (!foodName || ingredients.length === 0) {
        return NextResponse.json(
          { error: 'Could not identify food or ingredients from image' },
          { status: 400 }
        );
      }

    } catch (scanError: any) {
      console.error('Error scanning ingredients:', scanError);
      return NextResponse.json(
        { error: `Failed to scan ingredients: ${scanError.message || 'Unknown error'}` },
        { status: 500 }
      );
    }

    // Step 3: Get nutrition data
    // Call Gemini API directly instead of making HTTP fetch
    let nutritions: any = {};
    
    try {
      const nutritionModel = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
      
      const nutritionParts: any[] = [
        {
          text: `The food name is "${foodName}". The ingredients are: ${ingredients.join(", ")}.

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
}`,
        },
      ];

      const nutritionResult = await nutritionModel.generateContent(nutritionParts);
      const nutritionResponse = await nutritionResult.response;
      const nutritionCaption = nutritionResponse.text();
      console.log('result from gemini (nutrition):', nutritionCaption);

      // Parse JSON from markdown code blocks or plain text
      try {
        const jsonMatch = nutritionCaption.match(/```(?:json)?\s*([\s\S]*?)```/);
        const jsonString = jsonMatch ? jsonMatch[1] : nutritionCaption;
        const cleanedJson = jsonString.trim();
        nutritions = JSON.parse(cleanedJson);
      } catch (parseError) {
        console.error('Error parsing JSON from Gemini response (nutrition):', parseError);
        return NextResponse.json(
          { error: 'Failed to parse nutrition data from AI response' },
          { status: 500 }
        );
      }
    } catch (nutritionError: any) {
      console.error('Error getting nutrition data:', nutritionError);
      return NextResponse.json(
        { error: `Failed to get nutrition data: ${nutritionError.message || 'Unknown error'}` },
        { status: 500 }
      );
    }

    // Step 4: Save to database
    const { data: foodLog, error: dbError } = await supabase
      .from('food_logs')
      .insert({
        user_id: user.id,
        image_url: imageUrl,
        food_name: foodName,
        ingredients: ingredients,
        nutrition: nutritions,
        record_date: new Date().toISOString().split('T')[0],
        record_time: new Date().toTimeString().split(' ')[0],
      })
      .select()
      .single();

    if (dbError) {
      console.error('Database error:', dbError);
      return NextResponse.json(
        { error: 'Failed to save food log to database' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      foodLog: foodLog,
      foodName: foodName,
      ingredients: ingredients,
      nutrition: nutritions,
    });
  } catch (error: any) {
    console.error('Food log API error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

