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

export default function AnalyticsPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [graphData, setGraphData] = useState([]);
    const [foodLogStreak, setFoodLogStreak] = useState(0);
    const [healthyFoodStreak, setHealthyFoodStreak] = useState(0);
    const [totalLogs, setTotalLogs] = useState(0);
    const [mostRecentHealthLevel, setMostRecentHealthLevel] = useState(null);
    const [achievements, setAchievements] = useState([]);

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

                const response = await fetch('/api/analytics');

                if (!response.ok) {
                    throw new Error('Failed to fetch analytics');
                }

                const data = await response.json();
                setGraphData(data.graphData || []);
                setFoodLogStreak(data.foodLogStreak || 0);
                setHealthyFoodStreak(data.healthyFoodStreak || 0);
                setTotalLogs(data.totalLogs || 0);
                setMostRecentHealthLevel(data.mostRecentHealthLevel);
                setAchievements(data.achievements || []);
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
                    className="h-16 flex items-center justify-between px-6 border-b backdrop-blur-sm sticky top-0 z-10 bg-white/80"
                    style={{ borderColor: 'rgba(52, 73, 94, 0.1)' }}
                >
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => router.back()}
                            className="p-2 hover:bg-gray-100 rounded-lg text-gray-600 transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <h1 className="text-xl font-bold" style={{ color: COLOR_ACCENT_DARK }}>
                            Analytics
                        </h1>
                    </div>
                </header>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4 md:p-8">
                    <div className="max-w-6xl mx-auto space-y-6">
                        {/* Top Card with Streaks and Health Emoji */}
                        <div className="bg-white rounded-2xl p-6 shadow-lg border overflow-hidden transition-shadow" style={{ borderColor: 'rgba(52, 73, 94, 0.1)' }}>
                            <div className="flex items-center justify-between">
                                {/* Food Log Streak - Left */}
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="w-12 h-12 rounded-full flex items-center justify-center"
                                            style={{ backgroundColor: COLOR_SECONDARY_LIGHT }}>
                                            <Calendar className="w-6 h-6" style={{ color: COLOR_PRIMARY }} />
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-medium text-gray-600">Food Log Streak</h3>
                                            <p className="text-2xl font-bold" style={{ color: COLOR_ACCENT_DARK }}>
                                                {foodLogStreak} {foodLogStreak === 1 ? 'day' : 'days'}
                                            </p>
                                        </div>
                                    </div>
                                    <p className="text-xs text-gray-500 ml-[60px]">
                                        Consecutive days with food logs
                                    </p>
                                </div>

                                {/* Healthy Food Streak - Right */}
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="w-12 h-12 rounded-full flex items-center justify-center"
                                            style={{ backgroundColor: COLOR_SECONDARY_LIGHT }}>
                                            <Apple className="w-6 h-6" style={{ color: COLOR_PRIMARY }} />
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-medium text-gray-600">Healthy Food Streak</h3>
                                            <p className="text-2xl font-bold" style={{ color: COLOR_ACCENT_DARK }}>
                                                {healthyFoodStreak} {healthyFoodStreak === 1 ? 'day' : 'days'}
                                            </p>
                                        </div>
                                    </div>
                                    <p className="text-xs text-gray-500 ml-[60px]">
                                        Consecutive days with healthy food choices
                                    </p>
                                </div>

                                {/* Health Emoji on the far right */}
                                <div className="flex items-center justify-center ml-8">
                                    <div className="text-6xl">
                                        {getHealthEmoji(mostRecentHealthLevel)}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Achievements Section */}
                        <div className="bg-white rounded-2xl p-6 shadow-lg border overflow-hidden transition-shadow" style={{ borderColor: 'rgba(52, 73, 94, 0.1)' }}>
                            <h2 className="text-lg font-bold mb-4" style={{ color: COLOR_ACCENT_DARK }}>
                                Achievements
                            </h2>
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
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
                                            <div className={`text-4xl mb-2 ${achievement.unlocked ? '' : 'grayscale opacity-50'}`}>
                                                {achievement.icon}
                                            </div>
                                            <h3 className={`text-sm font-semibold mb-1 ${achievement.unlocked ? 'text-gray-800' : 'text-gray-500'}`}>
                                                {achievement.name}
                                            </h3>
                                            <p className="text-xs text-gray-600 mb-2">
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

                        {/* Analytics Graph */}
                        <div className="bg-white rounded-2xl p-6 shadow-lg border overflow-hidden transition-shadow" style={{ borderColor: 'rgba(52, 73, 94, 0.1)' }}>
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <h2 className="text-lg font-bold" style={{ color: COLOR_ACCENT_DARK }}>
                                        Food Logs (Last 30 Days)
                                    </h2>
                                    <p className="text-sm text-gray-500 mt-1">
                                        {totalLogs} total logs recorded
                                    </p>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                    <TrendingUp className="w-4 h-4" />
                                    <span>Activity</span>
                                </div>
                            </div>

                            {/* Graph */}
                            <div className="overflow-x-auto pb-4">
                                <svg
                                    width="100%"
                                    height={graphHeight + 60}
                                    viewBox={`0 0 ${graphData.length * (barWidth + barSpacing) + 20} ${graphHeight + 60}`}
                                    className="min-w-full"
                                >
                                    {/* Bars */}
                                    {graphData.map((data, index) => {
                                        const barHeight = maxCount > 0 ? (data.count / maxCount) * graphHeight : 0;
                                        const x = index * (barWidth + barSpacing) + 10;
                                        const y = graphHeight - barHeight;
                                        
                                        return (
                                            <g key={data.date}>
                                                {/* Bar */}
                                                <rect
                                                    x={x}
                                                    y={y}
                                                    width={barWidth}
                                                    height={barHeight}
                                                    fill={data.count > 0 ? COLOR_PRIMARY : '#E5E7EB'}
                                                    rx={4}
                                                    className="transition-all hover:opacity-80"
                                                />
                                                {/* Date label (show every 5th day to avoid crowding) */}
                                                {index % 5 === 0 && (
                                                    <text
                                                        x={x + barWidth / 2}
                                                        y={graphHeight + 20}
                                                        textAnchor="middle"
                                                        className="text-xs fill-gray-600"
                                                        fontSize="10"
                                                    >
                                                        {formatDate(data.date)}
                                                    </text>
                                                )}
                                                {/* Tooltip on hover */}
                                                <title>
                                                    {formatDate(data.date)}: {data.count} {data.count === 1 ? 'log' : 'logs'}
                                                </title>
                                            </g>
                                        );
                                    })}
                                </svg>
                            </div>

                            {/* Legend */}
                            <div className="flex items-center gap-4 mt-4 pt-4 border-t border-gray-100">
                                <div className="flex items-center gap-2">
                                    <div className="w-4 h-4 rounded" style={{ backgroundColor: COLOR_PRIMARY }}></div>
                                    <span className="text-xs text-gray-600">Days with logs</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-4 h-4 rounded bg-gray-200"></div>
                                    <span className="text-xs text-gray-600">No logs</span>
                                </div>
                            </div>
                        </div>

                        {/* Summary Stats */}
                        <div className="bg-white rounded-2xl p-6 shadow-lg border overflow-hidden transition-shadow" style={{ borderColor: 'rgba(52, 73, 94, 0.1)' }}>
                            <h2 className="text-lg font-bold mb-4" style={{ color: COLOR_ACCENT_DARK }}>
                                Summary
                            </h2>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div>
                                    <p className="text-xs text-gray-500 mb-1">Total Logs</p>
                                    <p className="text-2xl font-bold" style={{ color: COLOR_PRIMARY }}>
                                        {totalLogs}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 mb-1">Active Days</p>
                                    <p className="text-2xl font-bold" style={{ color: COLOR_PRIMARY }}>
                                        {graphData.filter(d => d.count > 0).length}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 mb-1">Avg per Day</p>
                                    <p className="text-2xl font-bold" style={{ color: COLOR_PRIMARY }}>
                                        {graphData.filter(d => d.count > 0).length > 0
                                            ? (totalLogs / graphData.filter(d => d.count > 0).length).toFixed(1)
                                            : '0'}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 mb-1">Max in a Day</p>
                                    <p className="text-2xl font-bold" style={{ color: COLOR_PRIMARY }}>
                                        {maxCount}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

