import { createClient } from '../../utils/supabase/server';
import { getLastWeekFoodLogs, getLastWeekDateRange } from '../../../services/foodLog';
import { getUserPreferenceServer } from '../../../services/userPreference';

// example response:
// {
//   "week": {
//     "startDate": "2025-11-24",
//     "endDate": "2025-12-01"
//   },
//   "foodLogs": [],
//   "nutritionGoals": {},
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

    // Return weekly report
    return Response.json({
      week: {
        startDate: dateRange.startDate,
        endDate: dateRange.endDate
      },
      foodLogs: foodLogs || [],
      nutritionGoals: nutritionGoals,
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

