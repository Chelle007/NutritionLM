import { GoogleGenerativeAI } from '@google/generative-ai';
import { createClient } from '../../utils/supabase/server';
import { getLastWeekFoodLogs, getLastWeekDateRange } from '../../../services/foodLog';
import { getUserPreferenceServer } from '../../../services/userPreference';

// Calculate average nutrition intake from food logs
function calculateAverageNutrition(foodLogs) {
  if (!foodLogs || foodLogs.length === 0) {
    return {};
  }

  // Initialize accumulators for each nutrition type
  const nutritionSums = {};
  const nutritionCounts = {};

  // Common nutrition types to track
  const nutritionTypes = [
    'protein',
    'carbohydrates',
    'fats',
    'vitamins',
    'minerals',
    'fiber'
  ];

  // Initialize sums and counts
  nutritionTypes.forEach(type => {
    nutritionSums[type] = 0;
    nutritionCounts[type] = 0;
  });

  // Iterate through food logs and accumulate nutrition values
  foodLogs.forEach(log => {
    if (log.nutrition && typeof log.nutrition === 'object') {
      nutritionTypes.forEach(type => {
        const value = log.nutrition[type];
        if (value !== null && value !== undefined && !isNaN(value)) {
          nutritionSums[type] += Number(value);
          nutritionCounts[type]++;
        }
      });
    }
  });

  // Calculate averages
  const averages = {};
  nutritionTypes.forEach(type => {
    if (nutritionCounts[type] > 0) {
      averages[type] = Number((nutritionSums[type] / nutritionCounts[type]).toFixed(2));
    } else {
      averages[type] = 0;
    }
  });

  return averages;
}

// Compares weekly average nutrition intake with nutrition goals
// Returns AI-generated recommendations from Gemini
export async function GET() {
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

    // Get date range for last week
    const dateRange = getLastWeekDateRange();

    // Get food logs for last week
    const foodLogs = await getLastWeekFoodLogs(supabase, user);
    
    if (foodLogs === null) {
      return Response.json(
        { error: "Failed to fetch food logs" },
        { status: 500 }
      );
    }

    // Get user preferences (which contains nutrition_goals)
    const userPreference = await getUserPreferenceServer(supabase, user);
    
    if (!userPreference) {
      return Response.json(
        { error: "Failed to get user preferences" },
        { status: 500 }
      );
    }

    // Extract nutrition_goals from user preferences
    const nutritionGoals = userPreference.length > 0 
      ? userPreference[0].nutrition_goals 
      : null;

    if (!nutritionGoals) {
      return Response.json(
        { error: "Nutrition goals not found. Please set your nutrition goals first." },
        { status: 400 }
      );
    }

    // Calculate average nutrition intake for last week
    const lastWeekNutritionIntakeAvg = calculateAverageNutrition(foodLogs || []);

    // Check API key
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return Response.json(
        { error: "GEMINI_API_KEY is not set on the server." },
        { status: 500 }
      );
    }

    // Call Gemini API to generate recommendations
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    // Build comparison data for the prompt
    const comparison = {};
    const nutritionTypes = ['protein', 'carbohydrates', 'fats', 'vitamins', 'minerals', 'fiber'];
    
    nutritionTypes.forEach(type => {
      const actual = lastWeekNutritionIntakeAvg[type] || 0;
      const goal = nutritionGoals[type] || 0;
      const difference = actual - goal;
      const percentageDiff = goal > 0 ? ((difference / goal) * 100).toFixed(1) : 0;
      
      comparison[type] = {
        actual: actual,
        goal: goal,
        difference: Number(difference.toFixed(2)),
        percentageDiff: Number(percentageDiff)
      };
    });

    // Build the prompt
    const parts = [
      {
        text: `
You are a professional nutritionist. Analyze the user's weekly nutrition intake compared to their goals and provide personalized recommendations.

Week Period: ${dateRange.startDate} to ${dateRange.endDate}

Nutrition Comparison:
${JSON.stringify(comparison, null, 2)}

Nutrition Goals (target values on scale 0-100):
${JSON.stringify(nutritionGoals, null, 2)}

Actual Average Weekly Intake:
${JSON.stringify(lastWeekNutritionIntakeAvg, null, 2)}

Based on this comparison, provide:
1. A brief analysis of how the user performed against their goals
2. Specific, actionable recommendations to improve their nutrition intake
3. Focus on areas where they are below or above their goals
4. Provide practical dietary suggestions

Write your response in a friendly, encouraging tone. Be specific and actionable. Do not include any JSON formatting or code blocks - just provide the recommendation text directly.`
      }
    ];

    // Generate content
    const result = await model.generateContent(parts);
    const response = await result.response;
    const recommendation = response.text();
    
    console.log("Gemini recommendation:", recommendation);

    // Return just the recommendation
    return Response.json({ 
      recommendation: recommendation.trim()
    });
  } catch (error) {
    console.error("Error in report recommendation API:", error);
    return Response.json(
      { error: "Failed to generate recommendation" },
      { status: 500 }
    );
  }
}

