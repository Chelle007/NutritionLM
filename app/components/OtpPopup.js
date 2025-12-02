"use client";

import React from 'react';
import { X } from 'lucide-react';

export default function OtpPopup({ 
    showOtpBox, 
    setShowOtpBox, 
    otp, 
    otpVisible, 
    setOtpVisible, 
    copied, 
    setCopied, 
    isRegenerating, 
    onRegenerateOtp 
}) {
    return (
        showOtpBox && (
            <div className="fixed md:absolute top-16 right-2 md:right-[180px] z-50 animate-fadeIn max-w-[calc(100vw-1rem)] md:w-80">
                <div className="bg-white shadow-xl rounded-2xl p-4 md:p-5 w-full md:w-80 border border-gray-200">
                    
                    {/* Header */}
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-sm font-bold text-gray-800">Telegram Verification</h3>
                        <button 
                            onClick={() => setShowOtpBox(false)}
                            className="p-1 hover:bg-gray-100 rounded-full transition"
                        >
                            <X className="w-4 h-4 text-gray-500" />
                        </button>
                    </div>

                    {/* OTP BOX */}
                    <div className="space-y-4">
                        
                        {/* OTP Display */}
                        <div className="flex items-center justify-between bg-gray-50 px-4 py-3 rounded-lg border border-gray-200">
                            <span className="font-mono tracking-widest text-xl">
                                {otp !== null ? (otpVisible ? otp : "••••••") : "No OTP Yet"}
                            </span>

                            <button
                                onClick={() => setOtpVisible(!otpVisible)}
                                className="text-gray-600 hover:text-gray-800 transition"
                            >
                                {otpVisible ? "🙈" : "👁️"}
                            </button>
                        </div>

                        {/* COPY BUTTON */}
                        <button
                            onClick={async () => {
                                try {
                                    await navigator.clipboard.writeText(otp);
                                    setCopied(true);
                                    setTimeout(() => setCopied(false), 1500);
                                } catch (err) {
                                    console.error("Copy failed:", err);
                                }
                            }}
                            className="w-full py-2 rounded-lg border text-sm font-medium 
                                    border-gray-300 text-gray-700 hover:bg-gray-50 transition"
                        >
                            {copied ? "Copied!" : "📋 Copy OTP"}
                        </button>

                        {/* Regenerate OTP */}
                        <button
                            onClick={onRegenerateOtp}
                            className="w-full py-2 rounded-lg border text-sm font-medium 
                                    border-gray-300 text-gray-700 hover:bg-gray-50 transition flex items-center justify-center"
                        >
                            {isRegenerating ? (
                                <span className="flex items-center gap-2">
                                    <div className="w-4 h-4 border-2 border-gray-300 border-t-transparent rounded-full animate-spin"></div>
                                    Generating...
                                </span>
                            ) : (
                                "Regenerate OTP"
                            )}
                        </button>

                        {/* Open Bot */}
                        <a
                            href="https://t.me/nutritionLM_Bot"
                            target="_blank"
                            className="block text-center bg-[#0088CC] text-white py-2 rounded-lg 
                                    font-semibold hover:bg-[#0077B5] transition"
                        >
                            Open Telegram Bot
                        </a>
                    </div>
                </div>
            </div>
        )
    );
}

