"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { Menu, X, BarChart3, CheckCircle } from 'lucide-react';
import Image from 'next/image';
import { COLOR_FACT_CHECK } from '../constants/colors';

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
                    <span 
                        className="hidden md:flex px-2 md:px-3 py-1 text-xs md:text-sm text-white rounded-full font-medium cursor-default opacity-90"
                        style={{ backgroundColor: "#4CAF50" }}
                    >
                        <span className="hidden sm:inline">Telegram Connected ✓</span>
                    </span>
                ) : (
                    <button
                        onClick={onOpenOtpBox}
                        className="hidden md:flex px-2 md:px-3 py-1 text-xs md:text-sm text-white rounded-full transition"
                        style={{ backgroundColor: '#0088CC' }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#0077B5'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#0088CC'}
                    >
                        <span className="hidden sm:inline">Manage Telegram</span>
                    </button>
                )}

                {googleFitVerified ? (
                    <div 
                        className="hidden md:flex px-2 md:px-3 py-1 text-xs md:text-sm rounded-full font-medium items-center gap-1 border-2"
                        style={{ 
                            backgroundColor: '#E8F5E9',
                            color: '#2E7D32',
                            borderColor: '#4CAF50',
                            cursor: 'default'
                        }}
                    >
                        <CheckCircle className="w-3 h-3 md:w-4 md:h-4" style={{ color: '#4CAF50' }} />
                        <span className="hidden sm:inline">Google Fit Connected</span>
                    </div>
                ) : (
                    <button
                        onClick={onConnectGoogleFit}
                        className="hidden md:flex px-2 md:px-3 py-1 text-xs md:text-sm text-white rounded-full transition"
                        style={{ backgroundColor: COLOR_FACT_CHECK }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#1E8E7E'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = COLOR_FACT_CHECK}
                    >
                        <span className="hidden sm:inline">Connect Fit</span>
                    </button>
                )}

                <button 
                    onClick={() => router.push('/analytics')}
                    className="p-2 hover:bg-gray-100 rounded-lg text-gray-600 transition-colors"
                    title="View Analytics"
                >
                    <BarChart3 className="w-5 h-5" />
                </button>
            </div>
        </header>
    );
}

