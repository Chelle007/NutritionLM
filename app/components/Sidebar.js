"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Sparkles, Menu, X, Plus, FileText, User, Import, ChevronDown, ChevronUp } from 'lucide-react';
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
    setAttachment = { setAttachment }
}) {
    const [userFullName, setUserFullName] = useState('User');
    const [isExpanded, setIsExpanded] = useState(false); 

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
                transition-all duration-300 ease-in-out md:border-r md:border-gray-200 flex flex-col shrink-0
                fixed md:relative inset-y-0 left-0 z-40 md:z-auto overflow-hidden`}
                style={{
                    backgroundColor: COLOR_ACCENT_DARK,
                    transform: isMobile
                        ? (isSidebarOpen ? 'translateX(0)' : 'translateX(-100%)')
                        : 'translateX(0)',
                    pointerEvents: isMobile && !isSidebarOpen ? 'none' : 'auto'
                }}
            >
                <div className={`h-16 flex ${!isMobile && !isSidebarOpen ? 'justify-center' : 'justify-end'} items-center ${isMobile ? 'px-4' : (isSidebarOpen ? 'pl-6 pr-4' : 'px-4')} ${isMobile ? 'transition-opacity duration-300' : ''} ${isSidebarOpen ? 'opacity-100' : (isMobile ? 'opacity-0' : 'opacity-100')}`}>
                    {isMobile ? (
                        <button
                            onClick={() => setIsSidebarOpen(false)}
                            className="p-2 hover:bg-white/10 rounded-lg text-white transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    ) : (
                        <>
                            {isSidebarOpen ? (
                                <button
                                    onClick={() => setIsSidebarOpen(false)}
                                    className="p-2 hover:bg-white/10 rounded-lg text-white transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            ) : (
                                <button
                                    onClick={() => setIsSidebarOpen(true)}
                                    className="p-2 hover:bg-white/10 rounded-lg text-white transition-colors"
                                >
                                    <Menu className="w-5 h-5" />
                                </button>
                            )}
                        </>
                    )}
                </div>

                {/* CONTENT */}
                <div className="p-4 flex-1 overflow-y-auto">

                    {/* LIBRARY TITLE */}
                    <div className="flex justify-between items-center mb-3">
                        <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                            Library
                        </h2>

                        {telegramPhotos.length > 0 && (
                            <button
                                onClick={() => setIsExpanded(!isExpanded)}
                                className="text-gray-300 hover:text-white flex items-center gap-1 text-xs"
                            >
                                {isExpanded ? (
                                    <>
                                        Collapse <ChevronUp className="w-4 h-4" />
                                    </>
                                ) : (
                                    <>
                                        Expand <ChevronDown className="w-4 h-4" />
                                    </>
                                )}
                            </button>
                        )}
                    </div>

                    {/* LIBRARY BOX */}
                    <div
                        className="border border-dashed rounded-xl p-4 text-center transition-colors"
                        style={{ borderColor: 'rgba(255, 255, 255, 0.3)' }}
                    >

                        <div className="text-sm font-medium text-white">
                            Uploaded Photos from Telegram
                        </div>

                        <div className="text-xs text-gray-400">
                            {telegramPhotos.length === 0
                                ? "No photos yet"
                                : `${telegramPhotos.length} photos`}
                        </div>

                        {telegramPhotos.length > 0 && !isExpanded && (
                            <div className="mt-3 grid grid-cols-4 gap-2">
                                {telegramPhotos.slice(0, 4).map((photo, index) => ( 
                                    <img
                                        key={index}
                                        src={photo.url}
                                        className="w-full h-16 rounded-md object-cover cursor-pointer hover:opacity-80 transition"
                                        onClick={async () => {
                                            const file = await urlToFile(photo.url);
                                            setAttachment({ file, preview: photo.url });
                                        }}
                                    />
                                ))}
                            </div>
                        )}

                        {isExpanded && (
                            <div className="mt-3 grid grid-cols-4 gap-2">
                                {telegramPhotos.map((photo, index) => (
                                    <img
                                        key={index}
                                        src={photo.url}
                                        className="w-full h-20 rounded-md object-cover cursor-pointer hover:opacity-80 transition"
                                        onClick={async () => {
                                            const file = await urlToFile(photo.url);
                                            setAttachment({ file, preview: photo.url });
                                        }}
                                    />
                                ))}
                            </div>
                        )}
                    </div>

                    {/* SOURCES */}
                    <div className="flex justify-between items-center mt-6 mb-4">
                        <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                            Sources ({sources.length})
                        </h2>
                        <button className="text-gray-400 hover:text-white">
                            <Plus className="w-4 h-4" />
                        </button>
                    </div>

                    <div className="space-y-3">
                        {sources.map((source) => (
                            <div key={source.id} className="group relative bg-white border rounded-xl p-3 hover:shadow-md transition-shadow cursor-pointer">
                                <div className="flex items-start gap-3">
                                    <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                                        style={{ backgroundColor: source.color, color: source.textColor }}>
                                        <FileText className="w-4 h-4" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="text-sm font-medium truncate">{source.title}</h3>
                                        <p className="text-xs text-gray-500 mt-0.5">{source.type} • Added today</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                </div>
                
                <div className={`p-4 ${(isMobile || isSidebarOpen) ? 'border-t' : ''} ${isMobile ? 'transition-opacity duration-300' : ''} ${isSidebarOpen ? 'opacity-100' : (isMobile ? 'opacity-0' : 'opacity-100')}`} style={(isMobile || isSidebarOpen) ? { borderColor: 'rgba(255, 255, 255, 0.1)' } : {}}>
                    <button 
                        onClick={() => {
                            if (onOpenProfile) {
                                onOpenProfile();
                            }
                            if (isMobile) {
                                setIsSidebarOpen(false);
                            }
                        }}
                        className={`flex items-center gap-3 p-2 hover:bg-white/10 rounded-lg cursor-pointer transition-colors w-full ${!isMobile && !isSidebarOpen ? 'justify-center' : 'text-left'}`}
                    >
                        <div
                            className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                            style={{ backgroundColor: COLOR_SECONDARY_LIGHT, color: COLOR_ACCENT_DARK }}
                        >
                            <User className="w-4 h-4" />
                        </div>
                        <div className={`flex-1 ${isMobile ? '' : (isSidebarOpen ? '' : 'hidden')}`}>
                            <div className="text-sm font-medium text-white">{userFullName}</div>
                            <div className="text-xs text-gray-400">Pro Plan</div>
                        </div>
                    </button>
                </div>

            </div>

            {/* MOBILE BACKDROP */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-30 md:hidden"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}
        </>
    );
}
