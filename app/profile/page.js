"use client";

import React, { useState, useEffect } from 'react';
import { createBrowserClient } from "@supabase/ssr";
import { useRouter } from 'next/navigation';
import { 
    COLOR_CONTENT_BG,
    COLOR_SECONDARY_LIGHT,
    COLOR_ACCENT_DARK
} from '../constants/colors';
import { User, Mail, Calendar, Ruler, Weight, Target, Activity, UtensilsCrossed, AlertCircle, Settings, ArrowLeft } from 'lucide-react';

export default function ProfilePage() {
    const [user, setUser] = useState(null);
    const [userPreferences, setUserPreferences] = useState(null);
    const [telegramVerified, setTelegramVerified] = useState(false);
    const [googleFitVerified, setGoogleFitVerified] = useState(false);
    const router = useRouter();

    useEffect(() => {
        async function loadUserData() {
            const supabase = createBrowserClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
                process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? ""
            );

            const { data: { session } } = await supabase.auth.getSession();
            const authUser = session?.user;

            if (!authUser) {
            supabase.auth.onAuthStateChange((_event, session) => {
                if (!session) router.replace("/login");
            });
            return;
            }

            // Get user data
            const { data: userData } = await supabase
                .from("users")
                .select("*")
                .eq("id", authUser.id)
                .single();

            setUser({
                ...authUser,
                ...userData
            });

            setTelegramVerified(userData?.telegram_verified === true);
            setGoogleFitVerified(userData?.google_fit_verified === true);

            // Get user preferences
            const { data: preferences } = await supabase
                .from("user_preferences")
                .select("*")
                .eq("user_id", authUser.id)
                .single();

            setUserPreferences(preferences);
        }
        loadUserData();
    }, [router]);

    const formatDate = (dateString) => {
        if (!dateString) return 'Not set';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    };

    const calculateAge = (birthDate) => {
        if (!birthDate) return null;
        const today = new Date();
        const birth = new Date(birthDate);
        let age = today.getFullYear() - birth.getFullYear();
        const monthDiff = today.getMonth() - birth.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
            age--;
        }
        return age;
    };

    const calculateBMI = (weight, height) => {
        if (!weight || !height) return null;
        const heightInMeters = height / 100;
        const bmi = weight / (heightInMeters * heightInMeters);
        return bmi.toFixed(1);
    };

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
                            Profile
                        </h1>
                    </div>
                </header>

                {/* Profile Content */}
                <div className="flex-1 overflow-y-auto p-3 md:p-4 lg:p-8">
                    <div className="max-w-4xl mx-auto">
                        {user && (
                            <div className="space-y-6">
                                {/* Profile Header Card */}
                                <div className="bg-white rounded-xl p-6 shadow-sm border" style={{ borderColor: COLOR_SECONDARY_LIGHT }}>
                                    <div className="flex items-center gap-6">
                                        <div className="w-20 h-20 rounded-full flex items-center justify-center shrink-0" 
                                             style={{ backgroundColor: COLOR_SECONDARY_LIGHT, color: COLOR_ACCENT_DARK }}>
                                            <User className="w-10 h-10" style={{ color: COLOR_ACCENT_DARK }} />
                                        </div>
                                        <div className="flex-1">
                                            <h2 className="text-2xl font-bold mb-1" style={{ color: COLOR_ACCENT_DARK }}>
                                                {user.full_name || 'User'}
                                            </h2>
                                            <div className="flex items-center gap-2 text-gray-600">
                                                <Mail className="w-4 h-4" />
                                                <span className="text-sm">{user.email}</span>
                                            </div>
                                            {user.created_at && (
                                                <p className="text-xs text-gray-500 mt-1">
                                                    Member since {formatDate(user.created_at)}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Personal Information */}
                                <div className="bg-white rounded-xl p-6 shadow-sm border" style={{ borderColor: COLOR_SECONDARY_LIGHT }}>
                                    <div className="flex items-center gap-2 mb-4">
                                        <User className="w-5 h-5" style={{ color: COLOR_ACCENT_DARK }} />
                                        <h3 className="text-xl font-semibold" style={{ color: COLOR_ACCENT_DARK }}>Personal Information</h3>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="flex items-center gap-3">
                                            <Calendar className="w-5 h-5 text-gray-400" />
                                            <div>
                                                <p className="text-xs text-gray-500">Birth Date</p>
                                                <p className="text-sm font-medium">
                                                    {userPreferences?.birth_date ? formatDate(userPreferences.birth_date) : 'Not set'}
                                                    {userPreferences?.birth_date && ` (Age: ${calculateAge(userPreferences.birth_date)})`}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <Ruler className="w-5 h-5 text-gray-400" />
                                            <div>
                                                <p className="text-xs text-gray-500">Height</p>
                                                <p className="text-sm font-medium">
                                                    {userPreferences?.height_cm ? `${userPreferences.height_cm} cm` : 'Not set'}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <Weight className="w-5 h-5 text-gray-400" />
                                            <div>
                                                <p className="text-xs text-gray-500">Weight</p>
                                                <p className="text-sm font-medium">
                                                    {userPreferences?.weight_kg ? `${userPreferences.weight_kg} kg` : 'Not set'}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <Activity className="w-5 h-5 text-gray-400" />
                                            <div>
                                                <p className="text-xs text-gray-500">BMI</p>
                                                <p className="text-sm font-medium">
                                                    {userPreferences?.weight_kg && userPreferences?.height_cm 
                                                        ? calculateBMI(userPreferences.weight_kg, userPreferences.height_cm)
                                                        : 'Not available'}
                                                </p>
                                            </div>
                                        </div>
                                        {userPreferences?.gender && (
                                            <div className="flex items-center gap-3">
                                                <User className="w-5 h-5 text-gray-400" />
                                                <div>
                                                    <p className="text-xs text-gray-500">Gender</p>
                                                    <p className="text-sm font-medium capitalize">{userPreferences.gender}</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Goals & Preferences */}
                                <div className="bg-white rounded-xl p-6 shadow-sm border" style={{ borderColor: COLOR_SECONDARY_LIGHT }}>
                                    <div className="flex items-center gap-2 mb-4">
                                        <Target className="w-5 h-5" style={{ color: COLOR_ACCENT_DARK }} />
                                        <h3 className="text-xl font-semibold" style={{ color: COLOR_ACCENT_DARK }}>Goals & Preferences</h3>
                                    </div>
                                    <div className="space-y-4">
                                        {userPreferences?.goal && (
                                            <div>
                                                <p className="text-xs text-gray-500 mb-1">Goal</p>
                                                <p className="text-sm font-medium">{userPreferences.goal}</p>
                                            </div>
                                        )}
                                        {userPreferences?.activity_level && (
                                            <div>
                                                <p className="text-xs text-gray-500 mb-1">Activity Level</p>
                                                <p className="text-sm font-medium capitalize">{userPreferences.activity_level}</p>
                                            </div>
                                        )}
                                        {userPreferences?.dietary_preference && (
                                            <div>
                                                <p className="text-xs text-gray-500 mb-1">Dietary Preference</p>
                                                <p className="text-sm font-medium capitalize">{userPreferences.dietary_preference}</p>
                                            </div>
                                        )}
                                        {userPreferences?.allergies && userPreferences.allergies.length > 0 && (
                                            <div>
                                                <p className="text-xs text-gray-500 mb-2">Allergies</p>
                                                <div className="flex flex-wrap gap-2">
                                                    {userPreferences.allergies.map((allergy, index) => (
                                                        <span 
                                                            key={index}
                                                            className="px-3 py-1 rounded-full text-xs font-medium"
                                                            style={{ backgroundColor: COLOR_SECONDARY_LIGHT, color: COLOR_ACCENT_DARK }}
                                                        >
                                                            <AlertCircle className="w-3 h-3 inline mr-1" />
                                                            {allergy}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                        {userPreferences?.habits && userPreferences.habits.length > 0 && (
                                            <div>
                                                <p className="text-xs text-gray-500 mb-2">Habits</p>
                                                <div className="flex flex-wrap gap-2">
                                                    {userPreferences.habits.map((habit, index) => (
                                                        <span 
                                                            key={index}
                                                            className="px-3 py-1 rounded-full text-xs font-medium"
                                                            style={{ backgroundColor: COLOR_SECONDARY_LIGHT, color: COLOR_ACCENT_DARK }}
                                                        >
                                                            {habit}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Connected Services */}
                                <div className="bg-white rounded-xl p-6 shadow-sm border" style={{ borderColor: COLOR_SECONDARY_LIGHT }}>
                                    <div className="flex items-center gap-2 mb-4">
                                        <Settings className="w-5 h-5" style={{ color: COLOR_ACCENT_DARK }} />
                                        <h3 className="text-xl font-semibold" style={{ color: COLOR_ACCENT_DARK }}>Connected Services</h3>
                                    </div>
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between p-3 rounded-lg" style={{ backgroundColor: COLOR_SECONDARY_LIGHT }}>
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full flex items-center justify-center overflow-hidden" style={{ backgroundColor: 'transparent' }}>
                                                    <svg className="w-8 h-8" viewBox="0 0 240 240" xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink">
                                                        <defs>
                                                            <linearGradient id="telegram-gradient" x1="120" y1="240" x2="120" gradientUnits="userSpaceOnUse">
                                                                <stop offset="0" stopColor="#1d93d2"/>
                                                                <stop offset="1" stopColor="#38b0e3"/>
                                                            </linearGradient>
                                                        </defs>
                                                        <circle cx="120" cy="120" r="120" fill="url(#telegram-gradient)"/>
                                                        <path d="M81.229,128.772l14.237,39.406s1.78,3.687,3.686,3.687,30.255-29.492,30.255-29.492l31.525-60.89L81.737,118.6Z" fill="#c8daea"/>
                                                        <path d="M100.106,138.878l-2.733,29.046s-1.144,8.9,7.754,0,17.415-15.763,17.415-15.763" fill="#a9c6d8"/>
                                                        <path d="M81.486,130.178,52.2,120.636s-3.5-1.42-2.373-4.64c.232-.664.7-1.229,2.1-2.2,6.489-4.523,120.106-45.36,120.106-45.36s3.208-1.081,5.1-.362a2.766,2.766,0,0,1,1.885,2.055,9.357,9.357,0,0,1,.254,2.585c-.009.752-.1,1.449-.169,2.542-.692,11.165-21.4,94.493-21.4,94.493s-1.239,4.876-5.678,5.043A8.13,8.13,0,0,1,146.1,172.5c-8.711-7.493-38.819-27.727-45.472-32.177a1.27,1.27,0,0,1-.546-.9c-.093-.469.417-1.05.417-1.05s52.426-46.6,53.821-51.492c.108-.379-.3-.566-.848-.4-3.482,1.281-63.844,39.4-70.506,43.607A3.21,3.21,0,0,1,81.486,130.178Z" fill="#fff"/>
                                                    </svg>
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium" style={{ color: COLOR_ACCENT_DARK }}>Telegram</p>
                                                </div>
                                            </div>
                                            <span 
                                                className={`px-3 py-1 rounded-full text-xs font-medium ${
                                                    telegramVerified ? 'text-white' : 'text-gray-600'
                                                }`}
                                                style={{ 
                                                    backgroundColor: telegramVerified ? '#4CAF50' : '#E0E0E0'
                                                }}
                                            >
                                                {telegramVerified ? 'Connected' : 'Not Connected'}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between p-3 rounded-lg" style={{ backgroundColor: COLOR_SECONDARY_LIGHT }}>
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: '#F8F8F8' }}>
                                                    <svg className="w-5 h-5" viewBox="0 0 236.2 200" xmlns="http://www.w3.org/2000/svg">
                                                        <path fill="#EA4335" d="M22.6 105.8l11.9 11.9 25.7-25.6-11.8-11.9-5.4-5.4c-4.3-4.3-6.6-9.9-6.6-16 0-5.3 1.8-10.1 4.9-13.9 4.2-5.3 10.6-8.7 17.8-8.7 6.1 0 11.7 2.4 16.1 6.7l5.3 5.1 11.9 12 25.8-25.6-12-11.9-5.4-5.2C90.1 6.6 75.4 0 59.1 0 26.4 0 0 26.4 0 58.9 0 67 1.6 74.7 4.6 81.8c3 7.1 7.3 13.4 12.7 18.7l5.3 5.3"/>
                                                        <polyline fill="#FBBC04" points="81.5,122.2 118.2,85.7 92.4,60 60.2,92.1 60.2,92.1 34.5,117.7 48.3,131.6 60.2,143.4 72.6,131"/>
                                                        <polygon fill="#34A853" points="143.8,175.6 201.8,117.7 176,92.1 118.1,149.9 85.9,117.8 60.2,143.4 92.4,175.6 92.3,175.7 118.1,200 118.1,200 118.1,200 143.9,175.6 143.9,175.6"/>
                                                        <path fill="#4285F4" d="M218.9 100.5c12-12 18.9-30.4 17-49-2.8-28.2-26.2-49.4-54.6-51.3C163.4-1 147 5.7 135.4 17.3L92.4 60l25.7 25.7 43-42.8c5.2-5.1 12.4-7.5 19.8-6.3 9.6 1.5 17.4 9.4 18.7 19 1 7.2-1.4 14.2-6.5 19.3L176 92.1l25.8 25.6 17.1-17.2z"/>
                                                    </svg>
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium" style={{ color: COLOR_ACCENT_DARK }}>Google Fit</p>
                                                </div>
                                            </div>
                                            <span 
                                                className={`px-3 py-1 rounded-full text-xs font-medium ${
                                                    googleFitVerified ? 'text-white' : 'text-gray-600'
                                                }`}
                                                style={{ 
                                                    backgroundColor: googleFitVerified ? '#4CAF50' : '#E0E0E0'
                                                }}
                                            >
                                                {googleFitVerified ? 'Connected' : 'Not Connected'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {!user && (
                            <div className="bg-white rounded-xl p-6 shadow-sm border text-center" style={{ borderColor: COLOR_SECONDARY_LIGHT }}>
                                <p className="text-gray-600">Loading profile...</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

