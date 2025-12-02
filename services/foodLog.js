// Gets the date range for last week (Monday to Sunday)
// Returns an object with startDate and endDate in ISO format (YYYY-MM-DD)
export function getLastWeekDateRange() {
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    
    // Calculate days to subtract to get to last Monday
    // If today is Monday (1), we want the previous Monday (7 days ago)
    // If today is Sunday (0), we want the Monday from 6 days ago
    // If today is Tuesday (2), we want the Monday from 1 day ago
    let daysToLastMonday;
    if (dayOfWeek === 0) {
        // Today is Sunday, last Monday was 6 days ago
        daysToLastMonday = 6;
    } else if (dayOfWeek === 1) {
        // Today is Monday, last Monday was 7 days ago
        daysToLastMonday = 7;
    } else {
        // Today is Tuesday-Saturday, last Monday was (dayOfWeek - 1) days ago
        daysToLastMonday = dayOfWeek - 1;
    }
    
    // Calculate last Monday
    const lastMonday = new Date(today);
    lastMonday.setDate(today.getDate() - daysToLastMonday);
    lastMonday.setHours(0, 0, 0, 0);
    
    // Calculate last Sunday (6 days after last Monday)
    const lastSunday = new Date(lastMonday);
    lastSunday.setDate(lastMonday.getDate() + 6);
    lastSunday.setHours(23, 59, 59, 999);
    
    return {
        startDate: lastMonday.toISOString().split('T')[0], // YYYY-MM-DD
        endDate: lastSunday.toISOString().split('T')[0], // YYYY-MM-DD
        startDateFull: lastMonday.toISOString(),
        endDateFull: lastSunday.toISOString()
    };
}

// Server-side function: Get food logs for last week (Monday-Sunday) for a user
export async function getLastWeekFoodLogs(supabase, user) {
    const dateRange = getLastWeekDateRange();
    
    const { data, error } = await supabase
        .from('food_logs')
        .select('*')
        .eq('user_id', user.id)
        .gte('record_date', dateRange.startDate)
        .lte('record_date', dateRange.endDate)
        .order('record_date', { ascending: true })
        .order('record_time', { ascending: true });
    
    if (error) {
        console.error('Error fetching last week food logs:', error);
        return null;
    }
    
    return data;
}

