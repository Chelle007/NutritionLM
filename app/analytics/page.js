"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, TrendingUp, Calendar, Apple } from 'lucide-react';
import { createBrowserClient } from "@supabase/ssr";
import { 
    COLOR_PRIMARY, 
    COLOR_SECONDARY_LIGHT, 
    COLOR_ACCENT_DARK, 
    COLOR_CONTENT_BG 
} from '../constants/colors';

// Apply BMI category color
const getBmiColor = (category) => {
    switch (category) {
        case "Normal":
            return "text-green-500";
        case "Underweight":
            return "text-orange-500";
        case "Overweight":
        case "Obese":
            return "text-red-500";
        default:
            return "text-gray-500";
    }
};


export default function AnalyticsPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [graphData, setGraphData] = useState([]);
    const [foodLogStreak, setFoodLogStreak] = useState(0);
    const [healthyFoodStreak, setHealthyFoodStreak] = useState(0);
    const [totalLogs, setTotalLogs] = useState(0);
    const [mostRecentHealthLevel, setMostRecentHealthLevel] = useState(null);
    const [achievements, setAchievements] = useState([]);
    const [bmi, setBmi] = useState(null);
    const [bmiCategory, setBmiCategory] = useState(null);
    const [loggedNutrition, setLoggedNutrition] = useState({
        carbs: 0,
        protein: 0,
        fats: 0,
        vitamins: 0,
        minerals: 0,
        fiber: 0,
    });
    const [heightCm, setHeightCm] = useState(null);
    const [weightKg, setWeightKg] = useState(null);
    const [nutritionGoals, setNutritionGoals] = useState(null);

    // Build recommended nutrition from nutrition goals
    const recommendedNutrition = nutritionGoals ? [
        { key: 'carbs', label: 'Carbohydrate', target: Number(nutritionGoals.carbohydrates ?? 0), unit: 'g' },
        { key: 'protein', label: 'Protein', target: Number(nutritionGoals.protein ?? 0), unit: 'g' },
        { key: 'fats', label: 'Fats', target: Number(nutritionGoals.fats ?? 0), unit: 'g' },
        { key: 'vitamins', label: 'Vitamins', target: Number(nutritionGoals.vitamins ?? 0), unit: 'g' },
        { key: 'minerals', label: 'Minerals', target: Number(nutritionGoals.minerals ?? 0), unit: 'g' },
        { key: 'fiber', label: 'Fiber', target: Number(nutritionGoals.fiber ?? 0), unit: 'g' },
    ] : [];
    const isOverweightOrObese = bmiCategory === 'Overweight' || bmiCategory === 'Obese';

    // Add progress information for each nutrient
    const nutritionProgress = recommendedNutrition.map((nutrient) => {
        const target = nutrient.target;
        const actual = Number(loggedNutrition[nutrient.key] ?? 0);
        const percent =
            target > 0 ? (actual / target) * 100 : 0;

        return {
            ...nutrient,
            target,
            actual,
            percent,
        };
    });

    // Overall % (average, capped at 100 for the ring)
    const overallPercent =
        nutritionProgress.length > 0
            ? Math.round(
                nutritionProgress.reduce(
                    (sum, n) => sum + Math.min(n.percent, 100),
                    0
                ) / nutritionProgress.length
            )
            : 0;

    // Overall hit/over status
    const allHit =
        nutritionProgress.length > 0 &&
        nutritionProgress.every((n) => n.actual >= n.target);

    const anyOverTarget = nutritionProgress.some((n) => n.actual > n.target);

    // Overall status text + colour (for bottom "Status" row)
    let overallText = '';
    let overallClass = '';

    if (isOverweightOrObese && anyOverTarget) {
        overallText = "Oh no you're doomed!";
        overallClass = 'text-red-500';
    } else if (allHit) {
        overallText = 'You are getting healthier!';
        overallClass = 'text-green-500';
    } else {
        overallText = 'Remember, some nutrients are still below target.';
        overallClass = 'text-red-400';
    }


    useEffect(() => {
        async function fetchAnalytics() {
            try {
                const supabase = createBrowserClient(
                    process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
                    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? ""
                );

                const { data: { user } } = await supabase.auth.getUser();
                if (!user) {
                    router.push('/login');
                    return;
                }

                // Fetch analytics data (graph, streaks, achievements)
                const analyticsResponse = await fetch('/api/analytics');
                if (!analyticsResponse.ok) {
                    throw new Error('Failed to fetch analytics');
                }
                const analyticsData = await analyticsResponse.json();
                setGraphData(analyticsData.graphData || []);
                setFoodLogStreak(analyticsData.foodLogStreak || 0);
                setHealthyFoodStreak(analyticsData.healthyFoodStreak || 0);
                setTotalLogs(analyticsData.totalLogs || 0);
                setMostRecentHealthLevel(analyticsData.mostRecentHealthLevel);
                setAchievements(analyticsData.achievements || []);

                // Fetch weekly report for nutrition averages and goals
                const weeklyReportResponse = await fetch('/api/weekly-report');
                if (!weeklyReportResponse.ok) {
                    throw new Error('Failed to fetch weekly report');
                }
                const weeklyReportData = await weeklyReportResponse.json();
                const nutritionAvg = weeklyReportData.last_7_days_nutrition_intake_avg || {};
                setLoggedNutrition({
                    carbs: Number(nutritionAvg.carbohydrates ?? 0), 
                    protein: Number(nutritionAvg.protein ?? 0),
                    fats: Number(nutritionAvg.fats ?? 0),
                    vitamins: Number(nutritionAvg.vitamins ?? 0),
                    minerals: Number(nutritionAvg.minerals ?? 0),
                    fiber: Number(nutritionAvg.fiber ?? 0),
                });
                setNutritionGoals(weeklyReportData.nutritionGoals || null);


                //Fetch BMI / compute from height & weight
                const { data: profile, error: profileError } = await supabase
                    .from('user_preferences') 
                    .select('weight_kg, height_cm')
                    .eq('user_id', user.id)
                    .single();

                    if (profileError) {
                    console.error(
                        'Error fetching profile for BMI:',
                        profileError.message || profileError
                    );
                    } else if (profile && profile.height_cm && profile.weight_kg) {
                    const heightCM = Number(profile.height_cm) / 100;
                    const weightKg = Number(profile.weight_kg);

                    setHeightCm(profile.height_cm);
                    setWeightKg(profile.weight_kg);

                    if (heightCM > 0 && weightKg > 0) {
                        const computedBmi = weightKg / (heightCM * heightCM);
                        const rounded = Number(computedBmi.toFixed(1));
                        setBmi(rounded);

                        // BMI category logic
                        let category;
                        if (rounded < 18.5)       category = 'Underweight';
                        else if (rounded < 23)    category = 'Normal';
                        else if (rounded < 27.5)  category = 'Overweight';
                        else                      category = 'Obese';

                        setBmiCategory(category);
                        }
                    }
                } catch (error) {
                    console.error('Error fetching analytics:', error);
                } finally {
                    setLoading(false);
                }
        }
        fetchAnalytics();
    }, [router]);

    // Calculate max count for scaling the graph
    const maxCount = Math.max(...graphData.map(d => d.count), 1);
    const graphHeight = 200;
    const barWidth = 8;
    const barSpacing = 4;
    // Show at most ~6 date labels on the x-axis
    const labelEvery = graphData.length > 0 ? Math.ceil(graphData.length / 6) : 1;



    const formatDate = (dateStr) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    // Get emoji based on health_level
    const getHealthEmoji = (healthLevel) => {
        if (healthLevel === null || healthLevel === undefined) {
            return '😐'; // mid (no data)
        }
        
        const level = Number(healthLevel);
        
        if (level >= 80) {
            return '😄'; // super happy (super high)
        } else if (level >= 60) {
            return '🙂'; // happy (high)
        } else if (level >= 40) {
            return '😐'; // mid (usual)
        } else if (level >= 20) {
            return '😟'; // sad (low)
        } else {
            return '😢'; // sad sad (super low)
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: COLOR_CONTENT_BG }}>
                <div className="text-center">
                    <div className="w-8 h-8 border-4 rounded-full animate-spin mx-auto mb-4" style={{ borderColor: COLOR_SECONDARY_LIGHT, borderTopColor: COLOR_PRIMARY }}></div>
                    <p style={{ color: COLOR_ACCENT_DARK }}>Loading analytics...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex h-screen font-sans text-gray-800 overflow-hidden" style={{ backgroundColor: COLOR_CONTENT_BG }}>
            {/* Main Content Area */}
            <div className="flex-1 flex flex-col relative" style={{ backgroundColor: COLOR_CONTENT_BG }}>
                
                {/* Header */}
                <header 
                    className="h-16 flex items-center justify-between px-3 md:px-6 border-b backdrop-blur-sm sticky top-0 z-10 bg-white/80"
                    style={{ borderColor: 'rgba(52, 73, 94, 0.1)' }}
                >
                    <div className="flex items-center gap-2 md:gap-4">
                        <button
                            onClick={() => router.back()}
                            className="p-2 hover:bg-gray-100 rounded-lg text-gray-600 transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <h1 className="text-lg md:text-xl font-bold" style={{ color: COLOR_ACCENT_DARK }}>
                            Analytics
                        </h1>
                    </div>
                </header>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-3 md:p-4 lg:p-8">
                    <div className="max-w-6xl mx-auto space-y-4 md:space-y-6">
                        {/* Top Card with Streaks and Health Emoji */}
                        <div className="bg-white rounded-2xl p-4 md:p-6 shadow-lg border overflow-hidden transition-shadow" style={{ borderColor: 'rgba(52, 73, 94, 0.1)' }}>
                            <div className="flex flex-col md:flex-row items-center md:justify-between gap-4 md:gap-0">
                                {/* Health Emoji - Top on mobile, right on desktop */}
                                <div className="flex items-center justify-center order-first md:order-last md:ml-8">
                                    <div className="text-7xl md:text-6xl">
                                        {getHealthEmoji(mostRecentHealthLevel)}
                                    </div>
                                </div>

                                {/* Food Log Streak - Left */}
                                <div className="flex-1 w-full md:w-auto order-2">
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center shrink-0"
                                            style={{ backgroundColor: COLOR_SECONDARY_LIGHT }}>
                                            <Calendar className="w-5 h-5 md:w-6 md:h-6" style={{ color: COLOR_PRIMARY }} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="text-xs md:text-sm font-medium text-gray-600">Food Log Streak</h3>
                                            <p className="text-xl md:text-2xl font-bold" style={{ color: COLOR_ACCENT_DARK }}>
                                                {foodLogStreak} {foodLogStreak === 1 ? 'day' : 'days'}
                                            </p>
                                        </div>
                                    </div>
                                    <p className="text-xs text-gray-500 ml-[52px] md:ml-[60px]">
                                        Consecutive days with food logs
                                    </p>
                                </div>

                                {/* Healthy Food Streak - Right */}
                                <div className="flex-1 w-full md:w-auto order-3">
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center shrink-0"
                                            style={{ backgroundColor: COLOR_SECONDARY_LIGHT }}>
                                            <Apple className="w-5 h-5 md:w-6 md:h-6" style={{ color: COLOR_PRIMARY }} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="text-xs md:text-sm font-medium text-gray-600">Healthy Food Streak</h3>
                                            <p className="text-xl md:text-2xl font-bold" style={{ color: COLOR_ACCENT_DARK }}>
                                                {healthyFoodStreak} {healthyFoodStreak === 1 ? 'day' : 'days'}
                                            </p>
                                        </div>
                                    </div>
                                    <p className="text-xs text-gray-500 ml-[52px] md:ml-[60px]">
                                        Consecutive days with healthy food choices
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Nutrition Activity – SECOND CARD */}
                        <div
                            className="bg-white rounded-2xl p-4 md:p-6 shadow-lg border overflow-hidden transition-shadow"
                            style={{ borderColor: 'rgba(52, 73, 94, 0.1)' }}
                        >
                            {/* Header */}
                            <div className="flex items-center justify-between mb-3 md:mb-4">
                                <div>
                                    <h2 className="text-base md:text-lg font-bold" style={{ color: COLOR_ACCENT_DARK }}>
                                        Nutrition Activity
                                    </h2>
                                    <p className="text-xs md:text-sm text-gray-500 mt-1">
                                        All nutrition types vs Your Daily Targets.
                                    </p>
                                </div>
                                <div className="flex flex-col items-end gap-1 text-[11px] md:text-xs text-gray-600">
                                    <span className="px-2 py-0.5 rounded-full bg-gray-100 border border-gray-200">
                                        {heightCm && weightKg
                                            ? `Ht: ${heightCm} cm · Wt: ${weightKg} kg`
                                            : 'Set your height & weight'}
                                    </span>
                                </div>
                            </div>

                            {/* Main content: left list + right ring */}
                            <div className="flex flex-col md:flex-row gap-6 items-stretch">
                                {/* Left side: All nutrition types */}
                                <div className="flex-1 space-y-3">
                                    {nutritionProgress.map((nutrient) => {
                                        const colorClass =
                                            nutrient.key === 'carbs'
                                                ? 'text-rose-500'   // red
                                                : nutrient.key === 'protein'
                                                ? 'text-green-500' // green
                                                : nutrient.key === 'fats'
                                                ? 'text-sky-500'   // blue
                                                : nutrient.key === 'vitamins'
                                                ? 'text-yellow-500' // yellow
                                                : nutrient.key === 'minerals'
                                                ? 'text-purple-500' // purple
                                                : 'text-orange-500'; // orange for fiber

                                        let perNutrientMessage = '';
                                        if (isOverweightOrObese && nutrient.actual > nutrient.target) {
                                            perNutrientMessage = "Oh no, you ate too much!";
                                        } else if (nutrient.actual >= nutrient.target) {
                                            perNutrientMessage = 'Steady, you\'re on target';
                                        } else {
                                            perNutrientMessage = 'Jiayou, eat more!';
                                        }

                                        return (
                                            <div key={nutrient.key} className="space-y-0.5">
                                                <div className="flex items-baseline justify-between">
                                                    <span className="text-xs md:text-sm font-semibold text-gray-800">
                                                        {/* bold nutrient name */}
                                                        {nutrient.label}
                                                    </span>
                                                    <span className={`text-lg md:text-xl font-semibold ${colorClass}`}>
                                                        {nutrient.actual.toFixed(1)}/{nutrient.target}
                                                        {nutrient.unit}
                                                    </span>
                                                </div>
                                                <div className="flex items-center justify-between text-[11px] md:text-xs text-gray-500">
                                                    <span>{perNutrientMessage}</span>
                                                    <span>
                                                        {Math.round(Math.min(nutrient.percent, 200))}%
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Right side: overall circular ring */}
                                <div className="flex items-center justify-center md:w-40">
                                    <div className="relative w-28 h-28 md:w-32 md:h-32">
                                        {/* Outer ring */}
                                        <div
                                            className="absolute inset-0 rounded-full"
                                            style={{
                                                background: `conic-gradient(#22c55e 0deg, #22c55e ${
                                                    overallPercent * 3.6
                                                }deg, #e5e7eb ${overallPercent * 3.6}deg 360deg)`,
                                            }}
                                        />
                                        {/* Inner cut-out */}
                                        <div className="absolute inset-4 bg-white rounded-full" />
                                        {/* Center text */}
                                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                                            <span className="text-[10px] uppercase tracking-wide text-gray-500">
                                                Overall
                                            </span>
                                            <span className="text-xl font-semibold text-gray-800">
                                                {overallPercent}%
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Bottom row: Status & BMI */}
                            <div className="mt-4 pt-3 border-t border-gray-200 flex items-center justify-between text-xs md:text-sm">
                                <div>
                                    <p className="text-gray-500">Status</p>
                                    <p className={`font-semibold ${getBmiColor(bmiCategory)}`}>
                                        {bmiCategory ? bmiCategory : 'Not set yet'}
                                    </p>
                                    {bmiCategory && (
                                        <p className="text-[11px] md:text-xs text-gray-500 mt-0.5">
                                            {overallText}
                                        </p>
                                    )}
                                </div>
                                <div className="text-right">
                                    <p className="text-gray-500">BMI</p>
                                    <p className="font-semibold text-gray-800">
                                        {bmi ? `${bmi} (${bmiCategory || 'Unknown'})` : 'Not set yet'}
                                    </p>
                                </div>
                            </div>
                        </div>


                     {/* Analytics Graph */}
                        <div
                        className="bg-white rounded-2xl p-4 md:p-6 shadow-lg border overflow-hidden transition-shadow"
                        style={{ borderColor: 'rgba(52, 73, 94, 0.1)' }}
                        >
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0 mb-4 md:mb-6">
                            <div>
                            <h2 className="text-base md:text-lg font-bold" style={{ color: COLOR_ACCENT_DARK }}>
                                Food Logs (30 days)
                            </h2>
                            <p className="text-xs md:text-sm text-gray-500 mt-1">
                                {totalLogs} total logs recorded
                                {graphData.length > 0 && (
                                <>
                                    {' · From '}
                                    {formatDate(graphData[0].date)}
                                </>
                                )}
                            </p>
                            </div>
                            <div className="flex items-center gap-2 text-xs md:text-sm text-gray-600">
                            <TrendingUp className="w-3 h-3 md:w-4 md:h-4" />
                            <span>Activity</span>
                            </div>
                        </div>

                        {/* Bar Chart – covers full activity window */}
                        <div className="overflow-x-auto pb-4">
                            <svg
                            width="100%"
                            height={graphHeight + 60}
                            viewBox={`0 0 ${graphData.length * (barWidth + barSpacing) + 20} ${graphHeight + 60}`}
                            className="min-w-full"
                            >
                            {/* X-Axis baseline */}
                            <line
                                x1="10"
                                y1={graphHeight + 10}
                                x2={graphData.length * (barWidth + barSpacing) + 10}
                                y2={graphHeight + 10}
                                stroke="#E5E7EB"
                                strokeWidth="1"
                            />

                            {/* Optional top guide for maxCount */}
                            {maxCount > 1 && (
                                <>
                                <line
                                    x1="10"
                                    y1="10"
                                    x2={graphData.length * (barWidth + barSpacing) + 10}
                                    y2="10"
                                    stroke="#E5E7EB"
                                    strokeDasharray="3 3"
                                    strokeWidth="0.5"
                                />
                                <text
                                    x="5"
                                    y="15"
                                    className="text-xs fill-gray-400"
                                    fontSize="10"
                                    textAnchor="end"
                                >
                                    {maxCount}
                                </text>
                                </>
                            )}

                            {/* Bars */}
                            {graphData.map((data, index) => {
                                const normalizedHeight =
                                maxCount > 0 ? (data.count / maxCount) * graphHeight : 0;

                                // Ensure zero days still show a small "no logs" bar
                                const hasLogs = data.count > 0;
                                const barHeight = hasLogs ? Math.max(normalizedHeight, 4) : 4;
                                const x = 10 + index * (barWidth + barSpacing);
                                const y = graphHeight + 10 - barHeight;

                                const barFill = hasLogs ? COLOR_PRIMARY : '#E5E7EB';

                                const showLabel = index % labelEvery === 0;

                                return (
                                <g key={data.date}>
                                    {/* Bar */}
                                    <rect
                                    x={x}
                                    y={y}
                                    width={barWidth}
                                    height={barHeight}
                                    rx={2}
                                    fill={barFill}
                                    className="transition-all hover:opacity-80 cursor-pointer"
                                    >
                                    <title>
                                        {formatDate(data.date)}: {data.count}{' '}
                                        {data.count === 1 ? 'log' : 'logs'}
                                    </title>
                                    </rect>

                                    {/* Date label */}
                                    {showLabel && (
                                    <text
                                        x={x + barWidth / 2}
                                        y={graphHeight + 30}
                                        textAnchor="middle"
                                        className="text-xs fill-gray-600"
                                        fontSize="10"
                                    >
                                        {formatDate(data.date)}
                                    </text>
                                    )}
                                </g>
                                );
                            })}
                            </svg>
                        </div>

                        {/* Legend */}
                        <div className="flex flex-wrap items-center gap-3 md:gap-4 mt-3 md:mt-4 pt-3 md:pt-4 border-t border-gray-100">
                            <div className="flex items-center gap-2">
                            <div
                                className="w-3 h-3 md:w-4 md:h-4 rounded-full"
                                style={{ backgroundColor: COLOR_PRIMARY }}
                            ></div>
                            <span className="text-xs text-gray-600">Logs recorded</span>
                            </div>
                            <div className="flex items-center gap-2">
                            <div className="w-3 h-3 md:w-4 md:h-4 rounded-full bg-gray-200"></div>
                            <span className="text-xs text-gray-600">No logs</span>
                            </div>
                        </div>
                        </div>


                        {/* Summary Stats */}
                        <div className="bg-white rounded-2xl p-4 md:p-6 shadow-lg border overflow-hidden transition-shadow" style={{ borderColor: 'rgba(52, 73, 94, 0.1)' }}>
                            <h2 className="text-base md:text-lg font-bold mb-3 md:mb-4" style={{ color: COLOR_ACCENT_DARK }}>
                                Summary
                            </h2>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                                <div>
                                    <p className="text-xs text-gray-500 mb-1">Total Logs</p>
                                    <p className="text-xl md:text-2xl font-bold" style={{ color: COLOR_PRIMARY }}>
                                        {totalLogs}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 mb-1">Active Days</p>
                                    <p className="text-xl md:text-2xl font-bold" style={{ color: COLOR_PRIMARY }}>
                                        {graphData.filter(d => d.count > 0).length}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 mb-1">Avg per Day</p>
                                    <p className="text-xl md:text-2xl font-bold" style={{ color: COLOR_PRIMARY }}>
                                        {graphData.filter(d => d.count > 0).length > 0
                                            ? (totalLogs / graphData.filter(d => d.count > 0).length).toFixed(1)
                                            : '0'}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 mb-1">Max in a Day</p>
                                    <p className="text-xl md:text-2xl font-bold" style={{ color: COLOR_PRIMARY }}>
                                        {maxCount}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Achievements Section */}
                        <div className="bg-white rounded-2xl p-4 md:p-6 shadow-lg border overflow-hidden transition-shadow" style={{ borderColor: 'rgba(52, 73, 94, 0.1)' }}>
                            <h2 className="text-base md:text-lg font-bold mb-3 md:mb-4" style={{ color: COLOR_ACCENT_DARK }}>
                                Achievements
                            </h2>
                            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
                                {achievements.map((achievement) => (
                                    <div
                                        key={achievement.id}
                                        className={`relative p-4 rounded-xl border-2 transition-all ${
                                            achievement.unlocked
                                                ? ''
                                                : 'opacity-60'
                                        }`}
                                        style={{
                                            backgroundColor: achievement.unlocked ? COLOR_SECONDARY_LIGHT : '#F5F5F5',
                                            borderColor: achievement.unlocked ? COLOR_PRIMARY : '#E5E7EB'
                                        }}
                                    >
                                        <div className="text-center">
                                            <div className={`text-3xl md:text-4xl mb-1.5 md:mb-2 ${achievement.unlocked ? '' : 'grayscale opacity-50'}`}>
                                                {achievement.icon}
                                            </div>
                                            <h3 className={`text-xs md:text-sm font-semibold mb-0.5 md:mb-1 ${achievement.unlocked ? 'text-gray-800' : 'text-gray-500'}`}>
                                                {achievement.name}
                                            </h3>
                                            <p className="text-[10px] md:text-xs text-gray-600 mb-1.5 md:mb-2">
                                                {achievement.description}
                                            </p>
                                            {!achievement.unlocked && achievement.progress !== undefined && (
                                                <div className="mt-2">
                                                    <div className="w-full rounded-full h-1.5" style={{ backgroundColor: COLOR_SECONDARY_LIGHT }}>
                                                        <div
                                                            className="h-1.5 rounded-full transition-all"
                                                            style={{
                                                                width: `${Math.min((achievement.progress / (achievement.id.includes('streak_30') ? 30 : achievement.id.includes('streak_7') ? 7 : achievement.id.includes('healthy_14') ? 14 : achievement.id.includes('healthy_7') ? 7 : achievement.id.includes('century') ? 100 : achievement.id.includes('fifty') ? 50 : 10)) * 100, 100)}%`,
                                                                backgroundColor: COLOR_PRIMARY
                                                            }}
                                                        ></div>
                                                    </div>
                                                    <p className="text-xs mt-1" style={{ color: COLOR_ACCENT_DARK }}>
                                                        {achievement.progress} / {achievement.id.includes('streak_30') ? 30 : achievement.id.includes('streak_7') ? 7 : achievement.id.includes('healthy_14') ? 14 : achievement.id.includes('healthy_7') ? 7 : achievement.id.includes('century') ? 100 : achievement.id.includes('fifty') ? 50 : 10}
                                                    </p>
                                                </div>
                                            )}
                                            {achievement.unlocked && (
                                                <div className="absolute top-2 right-2">
                                                    <span className="text-lg" style={{ color: COLOR_PRIMARY }}>✓</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
