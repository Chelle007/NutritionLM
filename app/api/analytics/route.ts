import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '../../utils/supabase/server';

export async function GET(request: NextRequest) {
    try {
        // Get the authenticated user from Supabase
        const supabase = await createClient();
        const { data: { user }, error: userError } = await supabase.auth.getUser();

        if (userError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Fetch food logs for the last 30 days
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const { data: foodLogs, error: logsError } = await supabase
            .from('food_logs')
            .select('record_date, nutrition, food_name, healthy_level, created_at')
            .eq('user_id', user.id)
            .gte('record_date', thirtyDaysAgo.toISOString().split('T')[0])
            .order('record_date', { ascending: true });

        if (logsError) {
            console.error('Error fetching food logs:', logsError);
            return NextResponse.json({ error: 'Failed to fetch food logs' }, { status: 500 });
        }

        // Process data for graph (group by date)
        // Use UTC dates to match record_date format (YYYY-MM-DD in UTC)
        const dailyData: Record<string, { date: string; count: number; healthy: boolean; healthLevelSum: number; healthLevelCount: number }> = {};
        const today = new Date();
        // Get today's date in UTC (matching how record_date is stored)
        const todayUTC = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
        const todayStr = todayUTC.toISOString().split('T')[0];

        // Initialize last 30 days with 0 (using UTC dates)
        for (let i = 29; i >= 0; i--) {
            const date = new Date(todayUTC);
            date.setUTCDate(date.getUTCDate() - i);
            const dateStr = date.toISOString().split('T')[0];
            dailyData[dateStr] = {
                date: dateStr,
                count: 0,
                healthy: false,
                healthLevelSum: 0,
                healthLevelCount: 0
            };
        }

        // Process food logs
        foodLogs?.forEach((log: any) => {
            const dateStr = log.record_date;
            if (dailyData[dateStr]) {
                dailyData[dateStr].count += 1;
                
                // Track healthy_level for average calculation
                if (log.healthy_level !== null && log.healthy_level !== undefined) {
                    const healthLevel = Number(log.healthy_level);
                    if (!isNaN(healthLevel)) {
                        dailyData[dateStr].healthLevelSum += healthLevel;
                        dailyData[dateStr].healthLevelCount += 1;
                    }
                }
                
                // Determine if food is healthy based on nutrition data
                // Consider healthy if nutrition exists and has reasonable values
                if (log.nutrition && typeof log.nutrition === 'object') {
                    const nutrition = log.nutrition as any;
                    // Simple heuristic: healthy if has protein, not too high in calories
                    // You can adjust this logic based on your definition of "healthy"
                    const hasProtein = nutrition.protein && nutrition.protein > 0;
                    const reasonableCalories = !nutrition.calories || nutrition.calories < 800;
                    if (hasProtein && reasonableCalories) {
                        dailyData[dateStr].healthy = true;
                    }
                }
            }
        });

        // Calculate average health_level per day
        const graphData = Object.values(dailyData).map(day => ({
            ...day,
            avgHealthLevel: day.healthLevelCount > 0 
                ? Number((day.healthLevelSum / day.healthLevelCount).toFixed(1))
                : null
        }));

        // Calculate food log streak (consecutive days with at least one log)
        // Start from today and count backwards - today counts as day 1 if it has logs
        // Use UTC dates to match record_date format
        let foodLogStreak = 0;
        let currentDate = new Date(todayUTC);
        
        while (true) {
            const dateStr = currentDate.toISOString().split('T')[0];
            const dayData = dailyData[dateStr];
            
            if (dayData && dayData.count > 0) {
                foodLogStreak++;
                // Move to previous day (in UTC)
                currentDate.setUTCDate(currentDate.getUTCDate() - 1);
            } else {
                // Stop if we hit a day with no logs
                break;
            }
        }

        // Calculate healthy food streak (consecutive days with healthy food)
        // Start from today and count backwards - today counts as day 1 if it has healthy food
        // Use UTC dates to match record_date format
        let healthyFoodStreak = 0;
        currentDate = new Date(todayUTC);
        
        while (true) {
            const dateStr = currentDate.toISOString().split('T')[0];
            const dayData = dailyData[dateStr];
            
            if (dayData && dayData.healthy) {
                healthyFoodStreak++;
                // Move to previous day (in UTC)
                currentDate.setUTCDate(currentDate.getUTCDate() - 1);
            } else {
                // Stop if we hit a day without healthy food
                break;
            }
        }

        // Get the most recent health_level (get the latest food log by created_at)
        let mostRecentHealthLevel = null;
        if (foodLogs && foodLogs.length > 0) {
            // Sort by created_at descending to get the most recent
            const sortedByCreated = [...foodLogs].sort((a: any, b: any) => {
                const dateA = new Date(a.created_at || 0).getTime();
                const dateB = new Date(b.created_at || 0).getTime();
                return dateB - dateA;
            });
            mostRecentHealthLevel = sortedByCreated[0]?.healthy_level ?? null;
        }

        // Fetch all food logs for achievements (not just last 30 days)
        const { data: allFoodLogs } = await supabase
            .from('food_logs')
            .select('record_date, healthy_level, created_at')
            .eq('user_id', user.id);

        // Calculate achievements
        const achievements: any[] = [];
        const totalAllLogs = allFoodLogs?.length || 0;

        // First Log Achievement
        if (totalAllLogs >= 1) {
            achievements.push({
                id: 'first_log',
                name: 'First Steps',
                description: 'Logged your first meal',
                icon: '🎯',
                unlocked: true
            });
        } else {
            achievements.push({
                id: 'first_log',
                name: 'First Steps',
                description: 'Log your first meal',
                icon: '🎯',
                unlocked: false
            });
        }

        // Total Logs Achievements
        if (totalAllLogs >= 100) {
            achievements.push({
                id: 'century',
                name: 'Century Club',
                description: '100 food logs',
                icon: '💯',
                unlocked: true
            });
        } else {
            achievements.push({
                id: 'century',
                name: 'Century Club',
                description: 'Log 100 meals',
                icon: '💯',
                unlocked: false,
                progress: totalAllLogs
            });
        }

        if (totalAllLogs >= 50) {
            achievements.push({
                id: 'fifty',
                name: 'Half Century',
                description: '50 food logs',
                icon: '⭐',
                unlocked: true
            });
        } else {
            achievements.push({
                id: 'fifty',
                name: 'Half Century',
                description: 'Log 50 meals',
                icon: '⭐',
                unlocked: false,
                progress: totalAllLogs
            });
        }

        if (totalAllLogs >= 10) {
            achievements.push({
                id: 'ten',
                name: 'Getting Started',
                description: '10 food logs',
                icon: '🌱',
                unlocked: true
            });
        } else {
            achievements.push({
                id: 'ten',
                name: 'Getting Started',
                description: 'Log 10 meals',
                icon: '🌱',
                unlocked: false,
                progress: totalAllLogs
            });
        }

        // Streak Achievements
        if (foodLogStreak >= 30) {
            achievements.push({
                id: 'streak_30',
                name: 'Monthly Master',
                description: '30-day streak',
                icon: '🔥',
                unlocked: true
            });
        } else {
            achievements.push({
                id: 'streak_30',
                name: 'Monthly Master',
                description: 'Maintain a 30-day streak',
                icon: '🔥',
                unlocked: false,
                progress: foodLogStreak
            });
        }

        if (foodLogStreak >= 7) {
            achievements.push({
                id: 'streak_7',
                name: 'Week Warrior',
                description: '7-day streak',
                icon: '⚡',
                unlocked: true
            });
        } else {
            achievements.push({
                id: 'streak_7',
                name: 'Week Warrior',
                description: 'Maintain a 7-day streak',
                icon: '⚡',
                unlocked: false,
                progress: foodLogStreak
            });
        }

        // Healthy Food Achievements
        if (healthyFoodStreak >= 14) {
            achievements.push({
                id: 'healthy_14',
                name: 'Health Champion',
                description: '14-day healthy streak',
                icon: '🏆',
                unlocked: true
            });
        } else {
            achievements.push({
                id: 'healthy_14',
                name: 'Health Champion',
                description: '14-day healthy food streak',
                icon: '🏆',
                unlocked: false,
                progress: healthyFoodStreak
            });
        }

        if (healthyFoodStreak >= 7) {
            achievements.push({
                id: 'healthy_7',
                name: 'Healthy Habit',
                description: '7-day healthy streak',
                icon: '🥗',
                unlocked: true
            });
        } else {
            achievements.push({
                id: 'healthy_7',
                name: 'Healthy Habit',
                description: '7-day healthy food streak',
                icon: '🥗',
                unlocked: false,
                progress: healthyFoodStreak
            });
        }

        return NextResponse.json({
            graphData,
            foodLogStreak,
            healthyFoodStreak,
            totalLogs: foodLogs?.length || 0,
            mostRecentHealthLevel,
            achievements
        });

    } catch (error) {
        console.error('Analytics API error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

