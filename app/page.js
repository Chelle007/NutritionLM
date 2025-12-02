"use client";

import React, { useState, useRef, useEffect } from 'react';
import { 
    Send, 
    Paperclip, 
    Sparkles, 
    Menu, 
    Plus, 
    FileText, 
    MoreVertical, 
    X,
    ShieldCheck,
    Scale
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { createBrowserClient } from "@supabase/ssr";

// --- COLOR PALETTE DEFINITION ---
const COLOR_PRIMARY = "#4CAF50";      // Forest Green
const COLOR_SECONDARY_LIGHT = "#C8E6C9";    // Sage Green 
const COLOR_ACCENT_DARK = "#34495E";  // Dark Slate/Charcoal
const COLOR_CONTENT_BG = "#F8F8F8";  // Light Grey/Off-white

export default function NutritionLM() {
    const [messages, setMessages] = useState([
        { 
            id: 1, 
            role: 'ai', 
            text: "Hello! I'm NutritionLM. I've analyzed your uploaded dietary guidelines and meal plans. How can I help you eat better today?" 
        }
    ]);
    const [input, setInput] = useState('');
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [isThinking, setIsThinking] = useState(false);
    const [activeButton, setActiveButton] = useState(null); // 'factCheck', 'compare', or null
    const messagesEndRef = useRef(null);

    const [telegramVerified, setTelegramVerified] = useState(false);

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
        .select("telegram_verified")
        .eq("id", user.id)
        .single();

        setTelegramVerified(data?.telegram_verified === true);
    }

    loadUser();
    }, []);


    async function connectTelegram() {
    const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? ""
    );


    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        alert("Please log in first.");
        return;
    }

    const { error } = await supabase
        .from("users")
        .update({
        telegram_otp: otp,
        telegram_verified: false,
        })
        .eq("id", user.id);

    if (error) console.log(error);

    alert(`Your OTP is ${otp}. Please send this code to the Telegram bot.`);
    }

    const sources = [
        { id: 1, title: 'My Diet Plan (Nov).docx', type: 'DOC', color: 'bg-blue-100 text-blue-700' },
        { id: 2, title: 'Vitamin D Research', type: 'TXT', color: 'bg-green-100 text-green-700' },
        { id: 3, title: 'My Allergies List', type: 'PDF', color: 'bg-purple-100 text-purple-700' },
    ];

    const suggestedPrompts = [
        "Summarize my diet plan",
        "Create a grocery list based on my allergies"
    ];

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim() || isThinking) return;

        // Add User Message
        const userMsg = { id: Date.now(), role: 'user', text: input };
        setMessages(prev => [...prev, userMsg]);
        const currentInput = input;
        setInput('');

        try {
            setIsThinking(true);
            const res = await fetch("/api/chat", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ message: currentInput }),
            });

            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                const msg = errorData.error || "Sorry, there was an error talking to the server.";
                setMessages(prev => [
                    ...prev,
                    {
                        id: Date.now() + 1,
                        role: 'ai',
                        text: msg,
                    }
                ]);
                setIsThinking(false);
                return;
            }

            const data = await res.json();
            const reply = data.reply || "Gemini returned an empty response.";

            setMessages(prev => [
                ...prev,
                {
                    id: Date.now() + 1,
                    role: 'ai',
                    text: reply,
                }
            ]);
        } catch (error) {
            console.error("Chat API error:", error);
            setMessages(prev => [
                ...prev,
                {
                    id: Date.now() + 1,
                    role: 'ai',
                    text: "Sorry, there was a network error. Please try again.",
                }
            ]);
        } finally {
            setIsThinking(false);
        }
    };

    return (
        // Main Background: Light Grey/Off-white (#F8F8F8)
        <div className="flex h-screen font-sans text-gray-800 overflow-hidden" style={{ backgroundColor: COLOR_CONTENT_BG }}>
            
            {/* LEFT SIDEBAR */}
            <div 
                className={`${isSidebarOpen ? 'w-80 opacity-100' : 'w-0 opacity-0'} 
                transition-all duration-300 ease-in-out border-r border-gray-200 flex flex-col shrink-0`}
                // Sidebar Background: Dark Slate/Charcoal (#34495E)
                style={{ backgroundColor: COLOR_ACCENT_DARK }}
            >
                <div className="p-6 border-b border-gray-100 flex justify-between items-center" style={{ borderColor: 'rgba(255, 255, 255, 0.1)' }}>
                    {/* Logo/Header: Text and Icon color is White for contrast on Dark Slate */}
                    <div className="flex items-center gap-2 font-bold text-xl text-white">
                        <Sparkles className="w-6 h-6 fill-current" />
                        <span>NutritionLM</span>
                    </div>
                </div>

                <div className="p-4 flex-1 overflow-y-auto">
                    <div className="flex justify-between items-center mb-4">
                        {/* Heading: Light gray text on Dark Slate */}
                        <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-400">Sources ({sources.length})</h2>
                        {/* Plus button: White/Gray on hover */}
                        <button className="text-gray-400 hover:text-white">
                            <Plus className="w-4 h-4" />
                        </button>
                    </div>

                    <div className="space-y-3">
                        {/* Upload New Source Card (White/Gray accent) */}
                        <div className="border border-dashed rounded-xl p-4 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-white/10 transition-colors" style={{ borderColor: 'rgba(255, 255, 255, 0.3)' }}>
                            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center mb-2">
                                <Plus className="w-4 h-4 text-white" />
                            </div>
                            <span className="text-sm font-medium text-white">Add source</span>
                            <span className="text-xs text-gray-400">PDF, TXT, MD, Audio</span>
                        </div>

                        {/* Source Cards (White background, Dark Slate text) */}
                        {sources.map((source) => (
                            <div key={source.id} className="group relative bg-white border rounded-xl p-3 hover:shadow-md transition-shadow cursor-pointer" style={{ borderColor: COLOR_CONTENT_BG }}>
                                <div className="flex items-start gap-3">
                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${source.color}`}>
                                        <FileText className="w-4 h-4" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        {/* Title Text: Dark Slate/Charcoal */}
                                        <h3 className="text-sm font-medium truncate" style={{ color: COLOR_ACCENT_DARK }}>{source.title}</h3>
                                        <p className="text-xs text-gray-500 mt-0.5">{source.type} • Added today</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
                
                {/* User Profile */}
                <div className="p-4 border-t" style={{ borderColor: 'rgba(255, 255, 255, 0.1)' }}>
                    <div className="flex items-center gap-3 p-2 hover:bg-white/10 rounded-lg cursor-pointer">
                        {/* Avatar: Light green background for contrast */}
                        <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs" style={{ backgroundColor: COLOR_SECONDARY_LIGHT, color: COLOR_ACCENT_DARK }}>
                            CB
                        </div>
                        <div className="flex-1">
                            {/* Profile Text: White on Dark Slate */}
                            <div className="text-sm font-medium text-white">Cool Beans</div>
                            <div className="text-xs text-gray-400">Pro Plan</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* CHAT AREA */}
            {/* Chat Area Background: Light Grey/Off-white (#F8F8F8) */}
            <div className="flex-1 flex flex-col relative" style={{ backgroundColor: COLOR_CONTENT_BG }}>
                
                {/* Header */}
                {/* Header Background: Light Grey/Off-white (with slight opacity/blur effect) */}
                <header 
                    className="h-16 flex items-center justify-between px-6 border-b border-gray-200 backdrop-blur-sm sticky top-0 z-10"
                >
                    {/* LEFT: Sidebar Toggle */}
                    <button 
                        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                        className="p-2 hover:bg-gray-100 rounded-lg text-gray-600"
                    >
                        {isSidebarOpen ? (
                            <X className="w-5 h-5" />
                        ) : (
                            <Menu className="w-5 h-5" />
                        )}
                    </button>

                    {/* MIDDLE: Sources Count */}
                    <div className="text-sm font-medium text-gray-500">
                        {sources.length} sources selected
                    </div>

                    {/* RIGHT: Telegram Status + More Button */}
                    <div className="flex items-center gap-3">
                        
                        {telegramVerified ? (
                            /* VERIFIED BADGE */
                            <span className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded-full font-medium">
                                Verified ✓
                            </span>
                        ) : (
                            /* CONNECT TELEGRAM BUTTON */
                            <button
                                onClick={connectTelegram}
                                className="px-3 py-1 text-sm bg-blue-600 text-white rounded-full hover:bg-blue-700 transition"
                            >
                                Connect Telegram
                            </button>
                        )}

                        {/* MORE OPTIONS BUTTON */}
                        <button className="p-2 hover:bg-gray-100 rounded-lg text-gray-600">
                            <MoreVertical className="w-5 h-5" />
                        </button>
                    </div>
                </header>


                {/* Chat */}
                <div className="flex-1 overflow-y-auto p-4 md:p-8 scrollbar-hide">
                    <div className="max-w-3xl mx-auto space-y-8">
                        {messages.map((msg) => (
                            <div key={msg.id} className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                                {/* Avatar */}
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 
                                    ${msg.role === 'ai' 
                                        // AI Avatar: Forest Green (#4CAF50)
                                        ? 'text-white' 
                                        // User Avatar: Dark Slate/Charcoal (#34495E)
                                        : 'bg-gray-200'}`}
                                    style={{ 
                                        backgroundColor: msg.role === 'ai' ? COLOR_PRIMARY : COLOR_ACCENT_DARK,
                                        color: msg.role === 'user' ? 'white' : 'white'
                                    }}
                                >
                                    {msg.role === 'ai' ? <Sparkles className="w-4 h-4" /> : <span className="text-xs font-bold">You</span>}
                                </div>

                                {/* Message Bubble */}
                                <div className={`flex flex-col max-w-[80%] ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                                    <div className={`text-sm leading-relaxed whitespace-pre-wrap py-2 px-4 rounded-2xl
                                        ${msg.role === 'user' 
                                            // User Bubble: Sage Green (#C8E6C9)
                                            ? `text-gray-900 rounded-tr-none` 
                                            // AI Bubble: Transparent on Light Grey BG
                                            : 'bg-transparent text-gray-800 -ml-2'
                                        }`}
                                        style={{ backgroundColor: msg.role === 'user' ? COLOR_SECONDARY_LIGHT : 'transparent' }}
                                    >
                                        <ReactMarkdown 
                                            components={{
                                                // Tailwind removes list styles by default, so we add them back manually
                                                ul: ({node, ...props}) => <ul className="list-disc pl-5 mt-2 mb-2" {...props} />,
                                                ol: ({node, ...props}) => <ol className="list-decimal pl-5 mt-2 mb-2" {...props} />,
                                                li: ({node, ...props}) => <li className="mb-1" {...props} />,
                                                strong: ({node, ...props}) => <span className="font-bold" {...props} />,
                                            }}
                                        >
                                            {msg.text}
                                        </ReactMarkdown>
                                    </div>
                                    
                                    {/* TODO: Citations */}
                                </div>
                            </div>
                        ))}
                        
                        {/* AI thinking indicator */}
                        {isThinking && (
                            <div className="flex gap-4">
                                {/* AI Avatar */}
                                <div
                                    className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-white"
                                    style={{ backgroundColor: COLOR_PRIMARY }}
                                >
                                    <Sparkles className="w-4 h-4" />
                                </div>

                                {/* Thinking bubble */}
                                <div className="flex flex-col max-w-[80%] items-start">
                                    <div
                                        className="text-sm leading-relaxed py-2 px-4 rounded-2xl bg-transparent text-gray-500 -ml-2 animate-pulse"
                                    >
                                        NutritionLM is thinking...
                                    </div>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>
                </div>

                {/* Input Area */}
                <div className="p-4 md:p-6 pb-8">
                    <div className="max-w-3xl mx-auto">
                        
                        {/* Suggested Chips */}
                        {messages.length < 3 && (
                            <div className="flex gap-2 mb-4 overflow-x-auto pb-2 scrollbar-hide">
                                {suggestedPrompts.map((prompt, i) => (
                                    <button 
                                        key={i}
                                        onClick={() => setInput(prompt)}
                                        // Chips: White background, Primary text/border on hover
                                        className="whitespace-nowrap px-4 py-2 bg-white border border-gray-200 rounded-full text-sm text-gray-600 transition-colors shadow-sm"
                                        style={{ borderColor: 'rgba(0,0,0,0.1)' }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.borderColor = COLOR_PRIMARY;
                                            e.currentTarget.style.color = COLOR_PRIMARY;
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.borderColor = 'rgba(0,0,0,0.1)';
                                            e.currentTarget.style.color = 'rgb(75, 85, 99)'; // text-gray-600 equivalent
                                        }}
                                    >
                                        {prompt}
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* Input Bar */}
                        <div className="bg-white rounded-3xl shadow-lg border border-gray-200 overflow-hidden focus-within:ring-1 focus-within:ring-green-500/50 transition-shadow">
                            <textarea
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={(e) => {
                                    if(e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        handleSend();
                                    }
                                }}
                                placeholder="Ask NutritionLM specifically about your sources..."
                                className="w-full bg-transparent border-none focus:ring-0 outline-none p-4 min-h-[60px] max-h-40 resize-none text-gray-700 placeholder:text-gray-400"
                                rows={1}
                            />
                            
                            {/* Input Toolbar */}
                            <div className="flex justify-between items-center px-3 pb-3 pt-1">
                                
                                {/* LEFT: New Feature Buttons */}
                                <div className="flex items-center gap-2">
                                    <button 
                                        onClick={() => {
                                            // Toggle: if already active, deactivate; otherwise activate and deactivate the other
                                            setActiveButton(activeButton === 'factCheck' ? null : 'factCheck');
                                        }}
                                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                                            activeButton === 'factCheck'
                                                ? 'text-white bg-blue-600 hover:bg-blue-700'
                                                : 'text-blue-600 bg-blue-50 hover:bg-blue-100'
                                        }`}
                                    >
                                        <ShieldCheck className="w-4 h-4" />
                                        Fact Check
                                    </button>

                                    <button 
                                        onClick={() => {
                                            // Toggle: if already active, deactivate; otherwise activate and deactivate the other
                                            setActiveButton(activeButton === 'compare' ? null : 'compare');
                                        }}
                                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                                            activeButton === 'compare'
                                                ? 'text-white bg-purple-600 hover:bg-purple-700'
                                                : 'text-purple-600 bg-purple-50 hover:bg-purple-100'
                                        }`}
                                    >
                                        <Scale className="w-4 h-4" />
                                        Compare
                                    </button>
                                </div>

                                {/* RIGHT: Existing Actions */}
                                <div className="flex items-center gap-2">
                                    <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors">
                                        <Paperclip className="w-5 h-5" />
                                    </button>
                                    <button 
                                        onClick={handleSend}
                                        disabled={!input.trim()}
                                        className={`p-2 rounded-full transition-all duration-200 
                                            ${input.trim() 
                                                // Send Button: Forest Green
                                                ? 'shadow-md text-white' 
                                                : 'bg-gray-100 text-gray-300 cursor-not-allowed'}`}
                                        style={{ backgroundColor: input.trim() ? COLOR_PRIMARY : 'rgb(243, 244, 246)' }} 
                                    >
                                        <Send className="w-5 h-5 ml-0.5" />
                                    </button>
                                </div>
                            </div>
                        </div>

                        <p className="text-center text-xs text-gray-400 mt-3">
                            NutritionLM may produce inaccurate information about health. Verify with a professional.
                        </p>
                    </div>
                </div>

            </div>
        </div>
    );
}