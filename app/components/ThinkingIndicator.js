"use client";

import React from 'react';
import Image from 'next/image';
import { UtensilsCrossed } from 'lucide-react';
import { COLOR_PRIMARY } from '../constants/colors';

export default function ThinkingIndicator({ 
    isThinking, 
    isScanning, 
    scanningAttachment, 
    scanProgress 
}) {
    if (!isThinking) return null;

    return (
        <div className="flex gap-4">
            <div className="w-8 h-8 flex items-center justify-center shrink-0">
                <div className="relative w-8 h-8 p-2">
                    <Image
                        src="/nutritionlm_chat_logo.png"
                        alt="NutritionLM"
                        fill
                        className="object-contain"
                        sizes="32px"
                    />
                </div>
            </div>
            <div className="flex flex-col max-w-[85%] md:max-w-[80%] items-start">
                {isScanning ? (
                    <div className="relative bg-white rounded-2xl p-4 md:p-6 border border-gray-200 shadow-sm w-full max-w-[500px]">
                        <div className="flex items-center gap-3 md:gap-4 mb-4">
                            <div className="relative w-16 h-16 md:w-24 md:h-24 bg-gray-100 rounded-lg overflow-hidden shrink-0">
                                {scanningAttachment?.preview ? (
                                    <>
                                        <img 
                                            src={scanningAttachment.preview} 
                                            alt="Scanning" 
                                            className="w-full h-full object-cover"
                                        />
                                        {/* Scanning overlay */}
                                        <div className="absolute inset-0 pointer-events-none">
                                            <div className="absolute w-full h-1 bg-gradient-to-r from-transparent via-amber-400 to-transparent animate-scanLine" 
                                                 style={{ 
                                                     boxShadow: '0 0 15px rgba(251, 191, 36, 0.8)',
                                                     top: '0%'
                                                 }}></div>
                                        </div>
                                        {/* Pulse effect */}
                                        <div className="absolute inset-0 border-2 border-amber-400 rounded-lg animate-scanPulse pointer-events-none"></div>
                                    </>
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                        <UtensilsCrossed className="w-8 h-8 text-gray-400" />
                                    </div>
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="text-base font-semibold text-gray-800 mb-1.5">
                                    {scanProgress.message || 'Scanning food...'}
                                </div>
                                <div className="text-sm text-gray-500">
                                    {scanProgress.stage === 1 && 'Identifying food items...'}
                                    {scanProgress.stage === 2 && 'Detecting ingredients from image...'}
                                    {scanProgress.stage === 3 && 'Calculating nutritional values...'}
                                    {scanProgress.stage === 4 && 'Preparing final report...'}
                                    {scanProgress.stage === 0 && 'Initializing scan...'}
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <div className="h-2 bg-amber-200 rounded-full flex-1 overflow-hidden">
                                <div 
                                    className="h-full bg-amber-500 rounded-full transition-all duration-500" 
                                    style={{ 
                                        width: scanProgress.stage >= 1 ? '100%' : '0%'
                                    }}
                                ></div>
                            </div>
                            <div className="h-2 bg-amber-200 rounded-full flex-1 overflow-hidden">
                                <div 
                                    className="h-full bg-amber-500 rounded-full transition-all duration-500" 
                                    style={{ 
                                        width: scanProgress.stage >= 2 ? '100%' : '0%'
                                    }}
                                ></div>
                            </div>
                            <div className="h-2 bg-amber-200 rounded-full flex-1 overflow-hidden">
                                <div 
                                    className="h-full bg-amber-500 rounded-full transition-all duration-500" 
                                    style={{ 
                                        width: scanProgress.stage >= 3 ? '100%' : '0%'
                                    }}
                                ></div>
                            </div>
                            <div className="h-2 bg-amber-200 rounded-full flex-1 overflow-hidden">
                                <div 
                                    className="h-full bg-amber-500 rounded-full transition-all duration-500" 
                                    style={{ 
                                        width: scanProgress.stage >= 4 ? '100%' : '0%'
                                    }}
                                ></div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="text-sm leading-relaxed py-2 px-4 rounded-2xl bg-transparent text-gray-500 -ml-2 animate-pulse">
                        NutritionLM is thinking...
                    </div>
                )}
            </div>
        </div>
    );
}

