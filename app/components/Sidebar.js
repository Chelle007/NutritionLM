"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Sparkles, Menu, X, Plus, FileText, User, Import } from 'lucide-react';
import { createBrowserClient } from "@supabase/ssr";
import {
    COLOR_SECONDARY_LIGHT,
    COLOR_ACCENT_DARK,
    COLOR_CONTENT_BG
} from '../constants/colors';
import Image from 'next/image'; 

export default function Sidebar({ 
    isSidebarOpen, 
    setIsSidebarOpen, 
    isMobile,
    sources = [],
    telegramPhotos = [],      
    setAttachment={setAttachment}             
}) {
    const [userFullName, setUserFullName] = useState('User');

    async function urlToFile(url) {
        const response = await fetch(url);
        const blob = await response.blob();
        return new File([blob], "telegram-photo.jpg", { type: blob.type });
    }

    useEffect(() => {
        async function loadUser() {
            const supabase = createBrowserClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
                process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? ""
            );

            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data } = await supabase
                .from("users")
                .select("full_name")
                .eq("id", user.id)
                .single();

            if (data?.full_name) {
                setUserFullName(data.full_name);
            }
        }
        loadUser();
    }, []);

    return (
        <>
            <div 
                className={`${isMobile ? 'w-80' : (isSidebarOpen ? 'w-80' : 'w-16')}
                transition-all duration-300 ease-in-out border-r border-gray-200 flex flex-col shrink-0
                fixed md:relative inset-y-0 left-0 z-40 md:z-auto overflow-hidden`}
                style={{ 
                    backgroundColor: COLOR_ACCENT_DARK,
                    transform: isMobile 
                        ? (isSidebarOpen ? 'translateX(0)' : 'translateX(-100%)')
                        : 'translateX(0)',
                    pointerEvents: isMobile && !isSidebarOpen ? 'none' : 'auto'
                }}
            >
                <div className={`h-16 flex ${!isMobile && !isSidebarOpen ? 'justify-center' : 'justify-between'} items-center ${isMobile ? 'px-4' : (isSidebarOpen ? 'pl-6 pr-4' : 'px-4')} ${isMobile ? 'transition-opacity duration-300' : ''} ${isSidebarOpen ? 'opacity-100' : (isMobile ? 'opacity-0' : 'opacity-100')}`}>
                    {(!isMobile && !isSidebarOpen) ? null : (
                        <div className="flex items-center gap-3 whitespace-nowrap">
                            {/* Logo for the application*/}
                            <div className="relative" style={{ width: isSidebarOpen ? "250px" : "40px", height: "100px" }}>
                                <Image
                                    src="/Nutritionlm.png"
                                    alt="NutritionLM logo"
                                    fill
                                    className="object-contain"
                                    sizes="150px"
                                />
                            </div>
                        </div>
                    )}
                    {isMobile ? (
                        <button 
                            onClick={() => setIsSidebarOpen(false)}
                            className="p-2 hover:bg-white/10 rounded-lg text-white transition-colors"
                            aria-label="Close sidebar"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    ) : (
                        <>
                            {isSidebarOpen ? (
                                <button 
                                    onClick={() => setIsSidebarOpen(false)}
                                    className="p-2 hover:bg-white/10 rounded-lg text-white transition-colors"
                                    aria-label="Close sidebar"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            ) : (
                                <button
                                    onClick={() => setIsSidebarOpen(true)}
                                    className="p-2 hover:bg-white/10 rounded-lg text-white transition-colors"
                                    aria-label="Open sidebar"
                                >
                                    <Menu className="w-5 h-5" />
                                </button>
                            )}
                        </>
                    )}
                </div>

                <div className={`p-4 flex-1 overflow-y-auto ${isMobile ? 'transition-opacity duration-300' : ''} ${isSidebarOpen ? 'opacity-100' : (isMobile ? 'opacity-0' : 'opacity-0 pointer-events-none')}`}>

                    <div className="mb-6">
                        <div className="flex justify-between items-center mb-3">
                            <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                                Library
                            </h2>
                        </div>

                        <div className="border border-dashed rounded-xl p-4 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-white/10 transition-colors"
                            style={{ borderColor: 'rgba(255, 255, 255, 0.3)' }}
                        >
                            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center mb-2">
                                📸
                            </div>
                            <span className="text-sm font-medium text-white">Uploaded Photos from Telegram</span>
                            <span className="text-xs text-gray-400">
                                {telegramPhotos.length === 0 ? "No photos yet" : `${telegramPhotos.length} photos`}
                            </span>
                        </div>

                        {telegramPhotos.length > 0 && (
                            <div className="mt-3 space-y-2">
                                {telegramPhotos.map((photo, index) => (
                                    <div 
                                        key={index} 
                                        className="bg-white/10 rounded-lg overflow-hidden cursor-pointer hover:bg-white/20 transition"
                                        onClick={async () => {
                                            const file = await urlToFile(photo.url);   
                                            setAttachment({ file, preview: photo.url }); 
                                        }}
                                    >
                                        <img src={photo.url} className="w-full h-24 object-cover" />
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>



                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                            Sources ({sources.length})
                        </h2>
                        <button className="text-gray-400 hover:text-white">
                            <Plus className="w-4 h-4" />
                        </button>
                    </div>

                    <div className="space-y-3">
                        <div className="border border-dashed rounded-xl p-4 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-white/10 transition-colors" style={{ borderColor: 'rgba(255, 255, 255, 0.3)' }}>
                            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center mb-2">
                                <Plus className="w-4 h-4 text-white" />
                            </div>
                            <span className="text-sm font-medium text-white">Add source</span>
                            <span className="text-xs text-gray-400">PDF, TXT, MD, Audio</span>
                        </div>

                        {sources.map((source) => (
                            <div key={source.id} className="group relative bg-white border rounded-xl p-3 hover:shadow-md transition-shadow cursor-pointer" style={{ borderColor: COLOR_CONTENT_BG }}>
                                <div className="flex items-start gap-3">
                                    <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: source.color, color: source.textColor }}>
                                        <FileText className="w-4 h-4" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="text-sm font-medium truncate" style={{ color: COLOR_ACCENT_DARK }}>{source.title}</h3>
                                        <p className="text-xs text-gray-500 mt-0.5">{source.type} • Added today</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
                
                <div className={`p-4 border-t ${isMobile ? 'transition-opacity duration-300' : ''} ${isSidebarOpen ? 'opacity-100' : (isMobile ? 'opacity-0' : 'opacity-0 pointer-events-none')}`} style={{ borderColor: 'rgba(255, 255, 255, 0.1)' }}>
                    <Link 
                        href="/profile"
                        className="flex items-center gap-3 p-2 hover:bg-white/10 rounded-lg cursor-pointer transition-colors"
                        onClick={() => isMobile && setIsSidebarOpen(false)}
                    >
                        <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: COLOR_SECONDARY_LIGHT, color: COLOR_ACCENT_DARK }}>
                            <User className="w-4 h-4" style={{ color: COLOR_ACCENT_DARK }} />
                        </div>
                        <div className={`flex-1 ${isMobile ? '' : (isSidebarOpen ? '' : 'hidden')}`}>
                            <div className="text-sm font-medium text-white">{userFullName}</div>
                            <div className="text-xs text-gray-400">Pro Plan</div>
                        </div>
                    </Link>
                </div>
            </div>

            {isSidebarOpen && (
                <div 
                    className="fixed inset-0 bg-black/50 z-30 md:hidden"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}
        </>
    );
}
