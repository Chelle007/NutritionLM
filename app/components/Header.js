"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { Menu, X, BarChart3, CheckCircle } from 'lucide-react';
import Image from 'next/image';
import { COLOR_FACT_CHECK, COLOR_ACCENT_DARK } from '../constants/colors';

export default function Header({ 
    isSidebarOpen, 
    setIsSidebarOpen, 
    isMobile,
    sources = [],
    telegramVerified,
    googleFitVerified,
    onOpenOtpBox,
    onConnectGoogleFit
}) {
    const router = useRouter();

    return (
        <header 
            className="h-16 flex items-center justify-between px-3 md:pl-6 md:pr-6 border-b backdrop-blur-sm sticky top-0 z-20 bg-white/80"
            style={{ borderColor: 'rgba(52, 73, 94, 0.1)' }}
        >
            <div className="flex items-center gap-2 md:gap-0">
                {isMobile && (
                    <button 
                        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                        className="p-2 hover:bg-gray-100 rounded-lg text-gray-600"
                    >
                        {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                    </button>
                )}

                <div className="flex items-center ml-1 md:ml-0">
                    <div className="relative w-[130px] h-[50px] md:w-[220px] md:h-[56px]">
                        <Image
                            src="/Nutritionlm.png"
                            alt="NutritionLM logo"
                            fill
                            className="object-contain"
                            sizes="(max-width: 768px) 130px, 220px"
                        />
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-1.5 md:gap-3">
                {telegramVerified ? (
                    <button
                        className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 md:px-3 md:py-2 rounded-lg transition-colors"
                        style={{ backgroundColor: '#0088CC' }}
                        title="Telegram Connected"
                    >
                        <svg className="w-5 h-5" viewBox="0 0 240 240" xmlns="http://www.w3.org/2000/svg">
                            <defs>
                                <linearGradient id="telegram-gradient-header" x1="120" y1="240" x2="120" gradientUnits="userSpaceOnUse">
                                    <stop offset="0" stopColor="#1d93d2"/>
                                    <stop offset="1" stopColor="#38b0e3"/>
                                </linearGradient>
                            </defs>
                            <circle cx="120" cy="120" r="120" fill="url(#telegram-gradient-header)"/>
                            <path d="M81.229,128.772l14.237,39.406s1.78,3.687,3.686,3.687,30.255-29.492,30.255-29.492l31.525-60.89L81.737,118.6Z" fill="#c8daea"/>
                            <path d="M100.106,138.878l-2.733,29.046s-1.144,8.9,7.754,0,17.415-15.763,17.415-15.763" fill="#a9c6d8"/>
                            <path d="M81.486,130.178,52.2,120.636s-3.5-1.42-2.373-4.64c.232-.664.7-1.229,2.1-2.2,6.489-4.523,120.106-45.36,120.106-45.36s3.208-1.081,5.1-.362a2.766,2.766,0,0,1,1.885,2.055,9.357,9.357,0,0,1,.254,2.585c-.009.752-.1,1.449-.169,2.542-.692,11.165-21.4,94.493-21.4,94.493s-1.239,4.876-5.678,5.043A8.13,8.13,0,0,1,146.1,172.5c-8.711-7.493-38.819-27.727-45.472-32.177a1.27,1.27,0,0,1-.546-.9c-.093-.469.417-1.05.417-1.05s52.426-46.6,53.821-51.492c.108-.379-.3-.566-.848-.4-3.482,1.281-63.844,39.4-70.506,43.607A3.21,3.21,0,0,1,81.486,130.178Z" fill="#fff"/>
                        </svg>
                        <CheckCircle className="w-4 h-4 text-white" />
                    </button>
                ) : (
                    <button
                        onClick={onOpenOtpBox}
                        className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 md:px-3 md:py-2 rounded-lg text-xs md:text-sm text-white font-semibold transition"
                        style={{ backgroundColor: '#0088CC' }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#0077B5'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#0088CC'}
                    >
                        <svg className="w-4 h-4 md:w-5 md:h-5" viewBox="0 0 240 240" xmlns="http://www.w3.org/2000/svg">
                            <defs>
                                <linearGradient id="telegram-gradient-header-connect" x1="120" y1="240" x2="120" gradientUnits="userSpaceOnUse">
                                    <stop offset="0" stopColor="#1d93d2"/>
                                    <stop offset="1" stopColor="#38b0e3"/>
                                </linearGradient>
                            </defs>
                            <circle cx="120" cy="120" r="120" fill="url(#telegram-gradient-header-connect)"/>
                            <path d="M81.229,128.772l14.237,39.406s1.78,3.687,3.686,3.687,30.255-29.492,30.255-29.492l31.525-60.89L81.737,118.6Z" fill="#c8daea"/>
                            <path d="M100.106,138.878l-2.733,29.046s-1.144,8.9,7.754,0,17.415-15.763,17.415-15.763" fill="#a9c6d8"/>
                            <path d="M81.486,130.178,52.2,120.636s-3.5-1.42-2.373-4.64c.232-.664.7-1.229,2.1-2.2,6.489-4.523,120.106-45.36,120.106-45.36s3.208-1.081,5.1-.362a2.766,2.766,0,0,1,1.885,2.055,9.357,9.357,0,0,1,.254,2.585c-.009.752-.1,1.449-.169,2.542-.692,11.165-21.4,94.493-21.4,94.493s-1.239,4.876-5.678,5.043A8.13,8.13,0,0,1,146.1,172.5c-8.711-7.493-38.819-27.727-45.472-32.177a1.27,1.27,0,0,1-.546-.9c-.093-.469.417-1.05.417-1.05s52.426-46.6,53.821-51.492c.108-.379-.3-.566-.848-.4-3.482,1.281-63.844,39.4-70.506,43.607A3.21,3.21,0,0,1,81.486,130.178Z" fill="#fff"/>
                        </svg>
                        <span className="hidden sm:inline">Connect</span>
                    </button>
                )}

                {googleFitVerified ? (
                    <button
                        className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 md:px-3 md:py-2 rounded-lg transition-colors"
                        style={{ 
                            backgroundColor: COLOR_FACT_CHECK,
                            cursor: 'default'
                        }}
                        title="Google Fit Connected"
                    >
                        <svg className="w-5 h-5" viewBox="0 0 236.2 200" xmlns="http://www.w3.org/2000/svg">
                            <path fill="#EA4335" d="M22.6 105.8l11.9 11.9 25.7-25.6-11.8-11.9-5.4-5.4c-4.3-4.3-6.6-9.9-6.6-16 0-5.3 1.8-10.1 4.9-13.9 4.2-5.3 10.6-8.7 17.8-8.7 6.1 0 11.7 2.4 16.1 6.7l5.3 5.1 11.9 12 25.8-25.6-12-11.9-5.4-5.2C90.1 6.6 75.4 0 59.1 0 26.4 0 0 26.4 0 58.9 0 67 1.6 74.7 4.6 81.8c3 7.1 7.3 13.4 12.7 18.7l5.3 5.3"/>
                            <polyline fill="#FBBC04" points="81.5,122.2 118.2,85.7 92.4,60 60.2,92.1 60.2,92.1 34.5,117.7 48.3,131.6 60.2,143.4 72.6,131"/>
                            <polygon fill="#34A853" points="143.8,175.6 201.8,117.7 176,92.1 118.1,149.9 85.9,117.8 60.2,143.4 92.4,175.6 92.3,175.7 118.1,200 118.1,200 118.1,200 143.9,175.6 143.9,175.6"/>
                            <path fill="#4285F4" d="M218.9 100.5c12-12 18.9-30.4 17-49-2.8-28.2-26.2-49.4-54.6-51.3C163.4-1 147 5.7 135.4 17.3L92.4 60l25.7 25.7 43-42.8c5.2-5.1 12.4-7.5 19.8-6.3 9.6 1.5 17.4 9.4 18.7 19 1 7.2-1.4 14.2-6.5 19.3L176 92.1l25.8 25.6 17.1-17.2z"/>
                        </svg>
                        <CheckCircle className="w-4 h-4 text-white" />
                    </button>
                ) : (
                    <button
                        onClick={onConnectGoogleFit}
                        className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 md:px-3 md:py-2 rounded-lg text-xs md:text-sm text-white font-semibold transition"
                        style={{ backgroundColor: COLOR_FACT_CHECK }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#1E8E7E'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = COLOR_FACT_CHECK}
                    >
                        <svg className="w-4 h-4 md:w-5 md:h-5" viewBox="0 0 236.2 200" xmlns="http://www.w3.org/2000/svg">
                            <path fill="#EA4335" d="M22.6 105.8l11.9 11.9 25.7-25.6-11.8-11.9-5.4-5.4c-4.3-4.3-6.6-9.9-6.6-16 0-5.3 1.8-10.1 4.9-13.9 4.2-5.3 10.6-8.7 17.8-8.7 6.1 0 11.7 2.4 16.1 6.7l5.3 5.1 11.9 12 25.8-25.6-12-11.9-5.4-5.2C90.1 6.6 75.4 0 59.1 0 26.4 0 0 26.4 0 58.9 0 67 1.6 74.7 4.6 81.8c3 7.1 7.3 13.4 12.7 18.7l5.3 5.3"/>
                            <polyline fill="#FBBC04" points="81.5,122.2 118.2,85.7 92.4,60 60.2,92.1 60.2,92.1 34.5,117.7 48.3,131.6 60.2,143.4 72.6,131"/>
                            <polygon fill="#34A853" points="143.8,175.6 201.8,117.7 176,92.1 118.1,149.9 85.9,117.8 60.2,143.4 92.4,175.6 92.3,175.7 118.1,200 118.1,200 118.1,200 143.9,175.6 143.9,175.6"/>
                            <path fill="#4285F4" d="M218.9 100.5c12-12 18.9-30.4 17-49-2.8-28.2-26.2-49.4-54.6-51.3C163.4-1 147 5.7 135.4 17.3L92.4 60l25.7 25.7 43-42.8c5.2-5.1 12.4-7.5 19.8-6.3 9.6 1.5 17.4 9.4 18.7 19 1 7.2-1.4 14.2-6.5 19.3L176 92.1l25.8 25.6 17.1-17.2z"/>
                        </svg>
                        <span className="hidden sm:inline">Connect</span>
                    </button>
                )}

                <button 
                    onClick={() => router.push('/analytics')}
                    className="flex items-center gap-1.5 px-3 py-1.5 md:px-4 md:py-2 rounded-lg text-sm md:text-base font-semibold transition-all"
                    style={{
                        backgroundColor: COLOR_ACCENT_DARK,
                        color: 'white'
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = 'rgba(52, 73, 94, 0.9)';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = COLOR_ACCENT_DARK;
                    }}
                    title="View Analytics"
                >
                    <BarChart3 className="w-4 h-4 md:w-5 md:h-5" />
                    <span className="hidden sm:inline">View Analytics</span>
                </button>
            </div>
        </header>
    );
}

