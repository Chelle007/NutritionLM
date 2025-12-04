import { createClient } from '../../utils/supabase/server';
import { getLast7DaysFoodLogs, getLast7DaysDateRange } from '../../../services/foodLog';
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

// example response:
// {
//   "week": {
//     "startDate": "2025-11-24",
//     "endDate": "2025-12-01"
//   },
//   "foodLogs": [],
//   "nutritionGoals": {},
//   "last_7_days_nutrition_intake_avg": {
//     "protein": 0,
//     "carbohydrates": 0,
//     "fats": 0,
//     "vitamins": 0,
//     "minerals": 0,
//     "fiber": 0
//   },
//   "summary": {
//     "totalLogs": 0,
//     "daysWithLogs": 0
//   }
// }
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

    // Get date range for last 7 days
    const dateRange = getLast7DaysDateRange();

    // Get food logs for last 7 days
    const foodLogs = await getLast7DaysFoodLogs(supabase, user);
    
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

    // Calculate average nutrition intake for last 7 days
    const last7DaysNutritionIntakeAvg = calculateAverageNutrition(foodLogs || []);

    // Return weekly report
    return Response.json({
      week: {
        startDate: dateRange.startDate,
        endDate: dateRange.endDate
      },
      foodLogs: foodLogs || [],
      nutritionGoals: nutritionGoals,
      last_7_days_nutrition_intake_avg: last7DaysNutritionIntakeAvg,
      summary: {
        totalLogs: foodLogs?.length || 0,
        daysWithLogs: foodLogs ? new Set(foodLogs.map(log => log.record_date)).size : 0
      }
    });
  } catch (error) {
    console.error("Error in weekly report API:", error);
    return Response.json(
      { error: "Failed to generate weekly report" },
      { status: 500 }
    );
  }
}

