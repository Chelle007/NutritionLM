"use client";

import React from 'react';
import { Send, Paperclip, X, ShieldCheck, Scale, UtensilsCrossed } from 'lucide-react';
import {
    COLOR_PRIMARY,
    COLOR_ACCENT_DARK,
    COLOR_FACT_CHECK,
    COLOR_FACT_CHECK_LIGHT,
    COLOR_COMPARE,
    COLOR_COMPARE_LIGHT,
    COLOR_NUTRITION,
    COLOR_NUTRITION_LIGHT
} from '../constants/colors';

export default function InputArea({
    input,
    setInput,
    attachment,
    fileInputRef,
    isInputFocused,
    setIsInputFocused,
    activeButton,
    setActiveButton,
    suggestedPrompts,
    messages,
    onFileSelect,
    onRemoveAttachment,
    onSend
}) {
    return (
        <div className="p-3 md:p-4 lg:p-6 pb-4 md:pb-8">
            <div className="max-w-3xl mx-auto">
                
                {messages.length < 3 && !attachment && (
                    <div className="flex gap-2 mb-3 md:mb-4 overflow-x-auto pb-2 scrollbar-hide">
                        {suggestedPrompts.map((prompt, i) => (
                            <button 
                                key={i}
                                onClick={() => setInput(prompt)}
                                className="whitespace-nowrap px-3 md:px-4 py-1.5 md:py-2 bg-white border rounded-full text-xs md:text-sm transition-colors shadow-sm"
                                style={{ borderColor: 'rgba(52, 73, 94, 0.1)', color: COLOR_ACCENT_DARK }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.borderColor = COLOR_PRIMARY;
                                    e.currentTarget.style.color = COLOR_PRIMARY;
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.borderColor = 'rgba(52, 73, 94, 0.1)';
                                    e.currentTarget.style.color = COLOR_ACCENT_DARK;
                                }}
                            >
                                {prompt}
                            </button>
                        ))}
                    </div>
                )}

                <div 
                    className="bg-white rounded-2xl md:rounded-3xl shadow-lg border overflow-hidden transition-shadow" 
                    style={{ 
                        borderColor: isInputFocused ? `${COLOR_PRIMARY}80` : 'rgba(52, 73, 94, 0.1)',
                        boxShadow: isInputFocused ? `0 0 0 1px ${COLOR_PRIMARY}40` : undefined
                    }}
                >
                    {/* Hidden File Input */}
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={onFileSelect}
                        accept="image/*"
                        className="hidden"
                    />

                    {/* Image Preview Area */}
                    {attachment && (
                        <div className="px-3 md:px-4 pt-3 md:pt-4 pb-0">
                            <div className="relative inline-block group">
                                <img 
                                    src={attachment.preview} 
                                    alt="Preview" 
                                    className="h-16 w-16 md:h-20 md:w-20 object-cover rounded-xl border border-gray-200 shadow-sm" 
                                />
                                <button 
                                    onClick={onRemoveAttachment} 
                                    className="absolute -top-1.5 -right-1.5 md:-top-2 md:-right-2 bg-white text-gray-500 hover:text-red-500 rounded-full p-0.5 md:p-1 shadow-md border border-gray-100 transition-colors"
                                >
                                    <X size={12} className="md:w-3.5 md:h-3.5" />
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Text Input */}
                    <div className="px-3 pt-3 md:px-4 md:pt-4">
                        <textarea
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onFocus={() => setIsInputFocused(true)}
                            onBlur={() => setIsInputFocused(false)}
                            onKeyDown={(e) => {
                                if(e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    onSend();
                                }
                            }}
                            placeholder="Ask NutritionLM or attach a food label..."
                            className="w-full bg-transparent border-none focus:ring-0 outline-none min-h-[48px] md:min-h-[60px] max-h-40 resize-none text-sm md:text-base text-gray-700 placeholder:text-gray-400 scrollbar-hide"
                            rows={1}
                        />
                    </div>
                    
                    {/* Bottom Toolbar */}
                    {/* Added border-t back here */}
                    <div className="flex items-center justify-between gap-2 px-2 py-2 md:px-4 md:py-3 border-t border-gray-100/50">
                        
                        {/* Left Side: Pills (Scrollable on mobile) */}
                        <div className="flex-1 min-w-0 flex items-center gap-2 overflow-x-auto scrollbar-hide py-1 pr-2">
                            <button 
                                onClick={() => setActiveButton(activeButton === 'factCheck' ? null : 'factCheck')}
                                // Changed px-3 py-1.5 to px-2.5 py-1 (Slightly smaller)
                                className="flex items-center gap-1.5 px-2.5 py-1 md:px-3 md:py-1.5 rounded-full text-[11px] md:text-xs font-semibold transition-colors whitespace-nowrap shrink-0"
                                style={{
                                    backgroundColor: activeButton === 'factCheck' ? COLOR_FACT_CHECK : COLOR_FACT_CHECK_LIGHT,
                                    color: activeButton === 'factCheck' ? 'white' : COLOR_ACCENT_DARK
                                }}
                            >
                                {/* Changed w-3.5 to w-3 (Slightly smaller icon) */}
                                <ShieldCheck className="w-3 h-3 md:w-4 md:h-4 shrink-0" />
                                Fact<span className="hidden sm:inline"> Check</span>
                            </button>

                            <button 
                                onClick={() => setActiveButton(activeButton === 'compare' ? null : 'compare')}
                                // Changed px-3 py-1.5 to px-2.5 py-1
                                className="flex items-center gap-1.5 px-2.5 py-1 md:px-3 md:py-1.5 rounded-full text-[11px] md:text-xs font-semibold transition-colors whitespace-nowrap shrink-0"
                                style={{
                                    backgroundColor: activeButton === 'compare' ? COLOR_COMPARE : COLOR_COMPARE_LIGHT,
                                    color: activeButton === 'compare' ? 'white' : COLOR_ACCENT_DARK
                                }}
                            >
                                <Scale className="w-3 h-3 md:w-4 md:h-4 shrink-0" />
                                Compare
                            </button>

                            <button 
                                onClick={() => setActiveButton(activeButton === 'nutrition' ? null : 'nutrition')}
                                // Changed px-3 py-1.5 to px-2.5 py-1
                                className="flex items-center gap-1.5 px-2.5 py-1 md:px-3 md:py-1.5 rounded-full text-[11px] md:text-xs font-semibold transition-colors whitespace-nowrap shrink-0"
                                style={{
                                    backgroundColor: activeButton === 'nutrition' ? COLOR_NUTRITION : COLOR_NUTRITION_LIGHT,
                                    color: activeButton === 'nutrition' ? 'white' : COLOR_ACCENT_DARK
                                }}
                            >
                                <UtensilsCrossed className="w-3 h-3 md:w-4 md:h-4 shrink-0" />
                                Nutrition<span className="hidden sm:inline"> Check</span>
                            </button>
                        </div>

                        {/* Right Side: Actions (Fixed) */}
                        <div className="flex items-center gap-1 md:gap-2 shrink-0 pl-2 bg-white">
                            <button 
                                onClick={() => fileInputRef.current?.click()}
                                // Changed p-2 to p-1.5 (Slightly smaller)
                                className="p-1.5 md:p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                                title="Attach image"
                            >
                                <Paperclip className="w-4 h-4 md:w-5 md:h-5" />
                            </button>

                            <button 
                                onClick={onSend}
                                disabled={!input.trim() && !attachment}
                                // Changed p-2 to p-1.5 (Slightly smaller)
                                className={`p-1.5 md:p-2 rounded-full transition-all duration-200 flex items-center justify-center
                                    ${(input.trim() || attachment)
                                        ? 'shadow-md text-white' 
                                        : 'bg-gray-100 text-gray-300 cursor-not-allowed'}`}
                                style={{ backgroundColor: (input.trim() || attachment) ? COLOR_PRIMARY : 'rgb(243, 244, 246)' }} 
                            >
                                <Send className="w-4 h-4 md:w-5 md:h-5 ml-0.5" />
                            </button>
                        </div>
                    </div>
                </div>

                <p className="text-center text-[10px] md:text-xs text-gray-400 mt-2 md:mt-3 px-1">
                    NutritionLM may produce inaccurate information about health. Verify with a professional.
                </p>
            </div>
        </div>
    );
}