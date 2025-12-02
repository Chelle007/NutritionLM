"use client";

import React from 'react';
import ReactMarkdown from 'react-markdown';
import { Sparkles, ShieldCheck } from 'lucide-react';
import {
    COLOR_PRIMARY,
    COLOR_SECONDARY_LIGHT,
    COLOR_ACCENT_DARK
} from '../constants/colors';

export default function ChatMessage({ msg }) {
    return (
        <div className={`flex gap-2 md:gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
            <div className={`w-7 h-7 md:w-8 md:h-8 rounded-full flex items-center justify-center shrink-0 
                ${msg.role === 'ai' ? 'text-white' : 'bg-gray-200'}`}
                style={{ 
                    backgroundColor: msg.role === 'ai' ? COLOR_PRIMARY : COLOR_ACCENT_DARK,
                    color: msg.role === 'user' ? 'white' : 'white'
                }}
            >
                {msg.role === 'ai' ? <Sparkles className="w-3 h-3 md:w-4 md:h-4" /> : <span className="text-[10px] md:text-xs font-bold">You</span>}
            </div>

            <div className={`flex flex-col max-w-[85%] md:max-w-[80%] ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                <div className={`text-sm leading-relaxed py-2 px-4 rounded-2xl
                    ${msg.role === 'user' ? `text-gray-900 rounded-tr-none` : 'bg-transparent text-gray-800 -ml-2'}`}
                    style={{ backgroundColor: msg.role === 'user' ? COLOR_SECONDARY_LIGHT : 'transparent' }}
                >
                    {/* Render Image in chat history */}
                    {(msg.image || msg.nutritionImage) && (
                        <div className="mb-2 relative">
                            <img 
                                src={msg.image || msg.nutritionImage} 
                                alt={msg.role === 'user' ? "User Upload" : "Food Image"} 
                                className="max-w-full h-auto rounded-lg border border-gray-200 shadow-sm max-h-48 md:max-h-64 object-cover"
                            />
                            {/* Scanning animation overlay for nutrition images */}
                            {msg.nutritionImage && msg.nutritionData && msg.showScanAnimation && (
                                <div className="absolute inset-0 rounded-lg pointer-events-none overflow-hidden transition-opacity duration-1000">
                                    <div className="absolute w-full h-0.5 bg-gradient-to-r from-transparent via-amber-400 to-transparent animate-scanLine" 
                                         style={{ 
                                             boxShadow: '0 0 10px rgba(251, 191, 36, 0.6)',
                                             top: '0%'
                                         }}></div>
                                    <div className="absolute inset-0 border-2 border-amber-400 rounded-lg animate-scanPulse opacity-30"></div>
                                </div>
                            )}
                        </div>
                    )}

                    {msg.comparisonData ? (
                        <div className="flex flex-col gap-3 w-full min-w-0">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {/* Left Column */}
                                <div className="bg-white/50 rounded-xl p-3 border border-green-100">
                                    <h4 className="font-bold text-green-700 mb-2 border-b border-green-100 pb-1">
                                        {msg.comparisonData.sideA.title}
                                    </h4>
                                    <ul className="space-y-1.5">
                                        {msg.comparisonData.sideA.points.map((pt, i) => (
                                            <li key={i} className="flex items-start gap-2 text-xs">
                                                <span className="text-green-500 mt-0.5">•</span>
                                                <span>{pt}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                {/* Right Column */}
                                <div className="bg-white/50 rounded-xl p-3 border border-orange-100">
                                    <h4 className="font-bold text-orange-700 mb-2 border-b border-orange-100 pb-1">
                                        {msg.comparisonData.sideB.title}
                                    </h4>
                                    <ul className="space-y-1.5">
                                        {msg.comparisonData.sideB.points.map((pt, i) => (
                                            <li key={i} className="flex items-start gap-2 text-xs">
                                                <span className="text-orange-500 mt-0.5">•</span>
                                                <span>{pt}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                            
                            {/* Summary Footer */}
                            <div className="text-xs italic text-gray-500 bg-white/30 p-2 rounded-lg border border-gray-100">
                                <span className="font-bold">Summary: </span>
                                {msg.comparisonData.summary}
                            </div>
                        </div>
                    ) : (
                        // Standard Text Render
                        msg.text && (
                            <ReactMarkdown 
                                components={{
                                    p: ({node, ...props}) => <p className="mb-3 last:mb-0" {...props} />,
                                    ul: ({node, ...props}) => <ul className="list-disc pl-5 mt-2 mb-2" {...props} />,
                                    ol: ({node, ...props}) => <ol className="list-decimal pl-5 mt-2 mb-2" {...props} />,
                                    li: ({node, ...props}) => <li className="mb-1" {...props} />,
                                    strong: ({node, ...props}) => <span className="font-bold" {...props} />,
                                }}
                            >
                                {msg.text}
                            </ReactMarkdown>
                        )
                    )}
                    
                    {/* Display Citations if available */}
                    {msg.citations && msg.citations.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-gray-200">
                            <div className="text-xs font-semibold text-gray-600 mb-2 flex items-center gap-1">
                                <ShieldCheck className="w-3 h-3" />
                                Sources:
                            </div>
                            <div className="space-y-1.5">
                                {msg.citations.map((citation, idx) => (
                                    <a
                                        key={idx}
                                        href={citation.uri}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="block text-xs text-blue-600 hover:text-blue-800 hover:underline truncate"
                                        title={citation.uri}
                                    >
                                        {idx + 1}. {citation.title || citation.uri}
                                    </a>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Display Nutrition Data if available */}
                    {msg.nutritionData && typeof msg.nutritionData === 'object' && (
                        <div className="mt-4 pt-4 border-t border-gray-200">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {Object.entries(msg.nutritionData).map(([key, value]) => (
                                    <div key={key} className="bg-white/50 p-3 rounded-xl border border-gray-100">
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="font-medium text-sm capitalize text-gray-700">
                                                {key}
                                            </span>
                                            <span className="text-xs text-gray-600 font-semibold">
                                                {value}%
                                            </span>
                                        </div>
                                        <div className="w-full bg-gray-200 rounded-full h-2">
                                            <div
                                                className="h-2 rounded-full transition-all"
                                                style={{ 
                                                    width: `${Math.min(value, 100)}%`,
                                                    backgroundColor: COLOR_PRIMARY
                                                }}
                                            ></div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

