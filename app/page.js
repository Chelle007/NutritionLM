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
    Scale,
    CheckCircle,
    UtensilsCrossed
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { createBrowserClient } from "@supabase/ssr";

// COLOR PALETTE DEFINITION
const COLOR_PRIMARY = "#4CAF50";      
const COLOR_SECONDARY_LIGHT = "#C8E6C9";    
const COLOR_ACCENT_DARK = "#34495E";  
const COLOR_CONTENT_BG = "#F8F8F8";  
const COLOR_FACT_CHECK = "#26A69A";  
const COLOR_FACT_CHECK_LIGHT = "#B2DFDB";  
const COLOR_COMPARE = "#66BB6A";  
const COLOR_COMPARE_LIGHT = "#C8E6C9";  
const COLOR_NUTRITION = '#F59E0B';
const COLOR_NUTRITION_LIGHT = '#FEF3C7';

export default function NutritionLM() {
    const [otp, setOtp] = useState(null);
    const [otpVisible, setOtpVisible] = useState(false);
    const [showOtpBox, setShowOtpBox] = useState(false);
    const [isGeneratingOtp, setIsGeneratingOtp] = useState(false);
    const [copied, setCopied] = useState(false);
    const [isRegenerating, setIsRegenerating] = useState(false);


    const [messages, setMessages] = useState([
        { 
            id: 1, 
            role: 'ai', 
            text: "Hello! I'm NutritionLM. I've analyzed your uploaded dietary guidelines and meal plans. How can I help you eat better today?" 
        }
    ]);
    const [input, setInput] = useState('');
    
    // Attachment State
    const [attachment, setAttachment] = useState(null); // { file: File, preview: string }
    const fileInputRef = useRef(null);

    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [isThinking, setIsThinking] = useState(false);
    const [activeButton, setActiveButton] = useState(null); 
    const [isInputFocused, setIsInputFocused] = useState(false);
    const messagesEndRef = useRef(null);

    const [telegramVerified, setTelegramVerified] = useState(false);
    const [googleFitVerified, setGoogleFitVerified] = useState(false);

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
            .select("telegram_verified, google_fit_verified")
            .eq("id", user.id)
            .single();

            setTelegramVerified(data?.telegram_verified === true);
            setGoogleFitVerified(data?.google_fit_verified === true);

            setOtp(data?.telegram_otp || null);
        }
        loadUser();
    }, []);

    async function openOtpBox() {
        setShowOtpBox(true);

        const supabase = createBrowserClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
            process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? ""
        );

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data } = await supabase
            .from("users")
            .select("telegram_otp")
            .eq("id", user.id)
            .single();

        if (data?.telegram_otp) {
            setOtp(data.telegram_otp);
            setOtpVisible(false);
        }
    }

    // Handle OAuth callback
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const googleFitConnected = params.get("google_fit_connected");
        const error = params.get("error");
        const details = params.get("details");

        if (googleFitConnected === "true") {
            // Reload user data to update verification status
            const supabase = createBrowserClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
                process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? ""
            );
            supabase.auth.getUser().then(({ data: { user } }) => {
                if (user) {
                    supabase
                        .from("users")
                        .select("google_fit_verified")
                        .eq("id", user.id)
                        .single()
                        .then(({ data }) => {
                            if (data) {
                                setGoogleFitVerified(data.google_fit_verified === true);
                            }
                        });
                }
            });
            // Clean up URL
            window.history.replaceState({}, "", window.location.pathname);
        } else if (error) {
            let errorMessage = `Google Fit connection failed: ${error}`;
            if (details) {
                errorMessage += `\n\nDetails: ${decodeURIComponent(details)}`;
            }
            
            // Special handling for missing database columns
            if (error === "missing_database_columns") {
                errorMessage += "\n\nPlease add the required columns to your users table:\n- google_fit_access_token (TEXT)\n- google_fit_refresh_token (TEXT)\n- google_fit_token_expires_at (TIMESTAMP)\n- google_fit_verified (BOOLEAN)";
            }
            
            alert(errorMessage);
            // Clean up URL
            window.history.replaceState({}, "", window.location.pathname);
        }
    }, []);


    async function connectTelegram() {
        const supabase = createBrowserClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
            process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? ""
        );

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            alert("Please log in first.");
            return;
        }

        setIsGeneratingOtp(true);

        const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

        const { error } = await supabase
            .from("users")
            .update({
                telegram_otp: otpCode,
                telegram_verified: false,
            })
            .eq("id", user.id);

        setIsGeneratingOtp(false);

        if (error) {
            console.log(error);
            alert("Failed to generate OTP.");
            return;
        }

        setOtp(otpCode);
        setShowOtpBox(true);
        setOtpVisible(false);
    }


    async function connectGoogleFit() {
        const supabase = createBrowserClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
            process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? ""
        );

        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            alert("Please log in first.");
            return;
        }

        // Redirect to Google OAuth flow (no need to pass userId, it will be retrieved from session)
        window.location.href = `/api/google-fit/auth`;
    }

    const sources = [
        { id: 1, title: 'My Diet Plan (Nov).docx', type: 'DOC', color: COLOR_SECONDARY_LIGHT, textColor: COLOR_ACCENT_DARK },
        { id: 2, title: 'Vitamin D Research', type: 'TXT', color: COLOR_SECONDARY_LIGHT, textColor: COLOR_ACCENT_DARK },
        { id: 3, title: 'My Allergies List', type: 'PDF', color: COLOR_SECONDARY_LIGHT, textColor: COLOR_ACCENT_DARK },
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

    const handleFileSelect = (e) => {
        const file = e.target.files[0];
        if (file) {
            const objectUrl = URL.createObjectURL(file);
            setAttachment({
                file: file,
                preview: objectUrl
            });
        }
        // Reset value so same file can be selected again if needed
        e.target.value = null; 
    };

    const removeAttachment = () => {
        if (attachment?.preview) {
            URL.revokeObjectURL(attachment.preview);
        }
        setAttachment(null);
    };

    const parseNutritionInput = (inputText = '') => {
        const text = inputText.trim();
        if (!text) {
            return { foodName: '', ingredients: [] };
        }

        const lines = text.split('\n').map((line) => line.trim()).filter(Boolean);
        let foodName = '';
        let ingredients = [];

        if (text.includes(':')) {
            const colonIndex = text.indexOf(':');
            foodName = text.substring(0, colonIndex).trim() || 'Custom Food';
            const ingredientsStr = text.substring(colonIndex + 1).trim();
            ingredients = ingredientsStr.split(/[\n,]/)
                .map((item) => item.trim())
                .filter(Boolean);
        } else if (lines.length > 1) {
            foodName = lines[0];
            ingredients = lines.slice(1)
                .flatMap((line) => line.split(','))
                .map((item) => item.trim())
                .filter(Boolean);
        } else {
            const parts = text.split(',');
            if (parts.length > 1) {
                foodName = 'Custom Food';
                ingredients = parts.map((item) => item.trim()).filter(Boolean);
            } else {
                foodName = text;
                ingredients = [text];
            }
        }

        return { foodName, ingredients };
    };

    const runNutritionCheck = async (messageText, attachmentData) => {
        try {
            let foodName = '';
            let ingredients = [];

            if (attachmentData?.file) {
                const formData = new FormData();
                formData.append("image", attachmentData.file);

                const response = await fetch("/api/ingredients", {
                    method: "POST",
                    body: formData,
                });

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.error || "Failed to process image");
                }

                foodName = data.food_name || 'Detected Food';
                ingredients = data.ingredients || [];
            } else {
                const parsed = parseNutritionInput(messageText);
                foodName = parsed.foodName;
                ingredients = parsed.ingredients;
            }

            if (!foodName || ingredients.length === 0) {
                throw new Error("Please provide a food name and at least one ingredient.");
            }

            const nutritionResponse = await fetch("/api/nutritionist", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    food_name: foodName,
                    ingredients,
                }),
            });

            const nutritionData = await nutritionResponse.json();

            if (!nutritionResponse.ok) {
                throw new Error(nutritionData.error || "Failed to get nutrition data");
            }

            const nutritionMessage = {
                id: Date.now() + 1,
                role: 'ai',
                text: `**Nutrition Analysis for ${foodName}**\n\n**Ingredients:** ${ingredients.join(', ')}\n\n**Nutrition Breakdown:**`,
                nutritionData: nutritionData.nutritions,
                nutritionImage: attachmentData?.preview || null,
            };
            setMessages(prev => [...prev, nutritionMessage]);
        } catch (error) {
            setMessages(prev => [
                ...prev,
                {
                    id: Date.now() + 2,
                    role: 'ai',
                    text: `Nutrition check failed: ${error.message}`,
                },
            ]);
        }
    };

    const extractFirstJson = (text) => {
        const startIndex = text.indexOf('{');
        if (startIndex === -1) return null;
    
        let braceCount = 0;
        let endIndex = -1;
    
        for (let i = startIndex; i < text.length; i++) {
            if (text[i] === '{') {
                braceCount++;
            } else if (text[i] === '}') {
                braceCount--;
                if (braceCount === 0) {
                    endIndex = i;
                    break;
                }
            }
        }
    
        if (endIndex !== -1) {
            return text.substring(startIndex, endIndex + 1);
        }
        return null;
    };

    const handleSend = async () => {
        // Allow send if text OR attachment exists
        if ((!input.trim() && !attachment) || isThinking) return;

        const isNutritionMode = activeButton === 'nutrition';

        const currentInput = input;
        const currentAttachment = attachment;

        // Add User Message (Visual only)
        const userMsg = { 
            id: Date.now(), 
            role: 'user', 
            text: currentInput,
            image: currentAttachment ? currentAttachment.preview : null 
        };
        
        setMessages(prev => [...prev, userMsg]);
        
        setInput('');
        setAttachment(null); // Clear attachment from input area

        if (isNutritionMode) {
            try {
                setIsThinking(true);
                await runNutritionCheck(currentInput, currentAttachment);
            } finally {
                setIsThinking(false);
                setActiveButton(null);
            }
            return;
        }

        // Convert image to base64 for backend chat flow
        let imageData = null;
        if (currentAttachment?.file) {
            try {
                const reader = new FileReader();
                imageData = await new Promise((resolve, reject) => {
                    reader.onload = () => {
                        const base64 = reader.result.split(',')[1];
                        resolve({
                            data: base64,
                            mimeType: currentAttachment.file.type || 'image/jpeg'
                        });
                    };
                    reader.onerror = reject;
                    reader.readAsDataURL(currentAttachment.file);
                });
            } catch (error) {
                console.error("Error converting image to base64:", error);
            }
        }
        
        try {
            setIsThinking(true);
            const res = await fetch("/api/chat", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ 
                    message: currentInput,
                    image: imageData,
                    factCheck: activeButton === 'factCheck',
                    compare: activeButton === 'compare',
                }),
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

            let finalCitations = data.citations || []; 
            let parsedComparison = null;

            if (data.isComparison) {
                try {
                    const cleanJsonString = extractFirstJson(data.reply);
                    
                    if (cleanJsonString) {
                        parsedComparison = JSON.parse(cleanJsonString);
                        
                        if (parsedComparison.sources && Array.isArray(parsedComparison.sources)) {
                            finalCitations = parsedComparison.sources;
                        }
                    } 
                } catch (e) {
                    console.error("JSON Parse Error:", e);
                    parsedComparison = null; 
                }
            }

            setMessages(prev => [
                ...prev,
                {
                    id: Date.now() + 1,
                    role: 'ai',
                    text: parsedComparison ? parsedComparison.summary : data.reply,
                    comparisonData: parsedComparison,
                    citations: finalCitations
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
        <div className="flex h-screen font-sans text-gray-800 overflow-hidden" style={{ backgroundColor: COLOR_CONTENT_BG }}>
            
            {/* LEFT SIDEBAR */}
            <div 
                className={`${isSidebarOpen ? 'w-80 opacity-100' : 'w-0 opacity-0'} 
                transition-all duration-300 ease-in-out border-r border-gray-200 flex flex-col shrink-0`}
                style={{ backgroundColor: COLOR_ACCENT_DARK }}
            >
                <div className="p-6 border-b border-gray-100 flex justify-between items-center" style={{ borderColor: 'rgba(255, 255, 255, 0.1)' }}>
                    <div className="flex items-center gap-2 font-bold text-xl text-white">
                        <Sparkles className="w-6 h-6 fill-current" />
                        <span>NutritionLM</span>
                    </div>
                </div>

                <div className="p-4 flex-1 overflow-y-auto">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-400">Sources ({sources.length})</h2>
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
                
                <div className="p-4 border-t" style={{ borderColor: 'rgba(255, 255, 255, 0.1)' }}>
                    <div className="flex items-center gap-3 p-2 hover:bg-white/10 rounded-lg cursor-pointer">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs" style={{ backgroundColor: COLOR_SECONDARY_LIGHT, color: COLOR_ACCENT_DARK }}>
                            CB
                        </div>
                        <div className="flex-1">
                            <div className="text-sm font-medium text-white">Cool Beans</div>
                            <div className="text-xs text-gray-400">Pro Plan</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* CHAT AREA */}
            <div className="flex-1 flex flex-col relative" style={{ backgroundColor: COLOR_CONTENT_BG }}>
                
                {/* Header */}
                <header 
                    className="h-16 flex items-center justify-between px-6 border-b backdrop-blur-sm sticky top-0 z-10"
                    style={{ borderColor: 'rgba(52, 73, 94, 0.1)' }}
                >
                    <button 
                        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                        className="p-2 hover:bg-gray-100 rounded-lg text-gray-600"
                    >
                        {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                    </button>

                    <div className="text-sm font-medium text-gray-500">
                        {sources.length} sources selected
                    </div>

                    <div className="flex items-center gap-3">

                        {telegramVerified ? (
                            <span 
                                className="px-3 py-1 text-sm text-white rounded-full font-medium cursor-default opacity-90"
                                style={{ backgroundColor: "#4CAF50" }}
                            >
                                Telegram Connected ✓
                            </span>
                        ) : (
                            <button
                                onClick={openOtpBox}
                                className="px-3 py-1 text-sm text-white rounded-full transition"
                                style={{ backgroundColor: '#0088CC' }}
                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#0077B5'}
                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#0088CC'}
                            >
                                Manage Telegram
                            </button>
                        )}

                        {googleFitVerified ? (
                            <div 
                                className="px-3 py-1 text-sm rounded-full font-medium flex items-center gap-1.5 border-2"
                                style={{ 
                                    backgroundColor: '#E8F5E9',
                                    color: '#2E7D32',
                                    borderColor: '#4CAF50',
                                    cursor: 'default'
                                }}
                            >
                                <CheckCircle className="w-4 h-4" style={{ color: '#4CAF50' }} />
                                Google Fit Connected
                            </div>
                        ) : (
                            <button
                                onClick={connectGoogleFit}
                                className="px-3 py-1 text-sm text-white rounded-full transition"
                                style={{ backgroundColor: COLOR_FACT_CHECK }}
                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#1E8E7E'}
                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = COLOR_FACT_CHECK}
                            >
                                Connect Google Fit
                            </button>
                        )}

                        <button className="p-2 hover:bg-gray-100 rounded-lg text-gray-600">
                            <MoreVertical className="w-5 h-5" />
                        </button>

                    </div>

                </header>

                {/* OTP POPUP (positioned under Manage Telegram) */}
                {showOtpBox && (
                    <div className="absolute top-16 right-[180px] z-50 animate-fadeIn">
                        <div className="bg-white shadow-xl rounded-2xl p-5 w-80 border border-gray-200">
                            
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
                                            setTimeout(() => setCopied(false), 1500); // 1.5초 후 사라짐
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
                                    onClick={async () => {
                                        setIsRegenerating(true);
                                        await connectTelegram();  // 기존 함수 그대로 사용
                                        
                                        setTimeout(() => {
                                            setIsRegenerating(false);
                                            alert("A new OTP has been generated!");
                                        }, 700);
                                    }}
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
                )}




                {/* Chat */}
                <div className="flex-1 overflow-y-auto p-4 md:p-8 scrollbar-hide">
                    <div className="max-w-3xl mx-auto space-y-8">
                        {messages.map((msg) => (
                            <div key={msg.id} className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 
                                    ${msg.role === 'ai' ? 'text-white' : 'bg-gray-200'}`}
                                    style={{ 
                                        backgroundColor: msg.role === 'ai' ? COLOR_PRIMARY : COLOR_ACCENT_DARK,
                                        color: msg.role === 'user' ? 'white' : 'white'
                                    }}
                                >
                                    {msg.role === 'ai' ? <Sparkles className="w-4 h-4" /> : <span className="text-xs font-bold">You</span>}
                                </div>

                                <div className={`flex flex-col max-w-[80%] ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                                    <div className={`text-sm leading-relaxed py-2 px-4 rounded-2xl
                                        ${msg.role === 'user' ? `text-gray-900 rounded-tr-none` : 'bg-transparent text-gray-800 -ml-2'}`}
                                        style={{ backgroundColor: msg.role === 'user' ? COLOR_SECONDARY_LIGHT : 'transparent' }}
                                    >
                                        {/* Render Image in chat history */}
                                        {(msg.image || msg.nutritionImage) && (
                                            <div className="mb-2">
                                                <img 
                                                    src={msg.image || msg.nutritionImage} 
                                                    alt={msg.role === 'user' ? "User Upload" : "Food Image"} 
                                                    className="max-w-full h-auto rounded-lg border border-gray-200 shadow-sm max-h-64 object-cover"
                                                />
                                            </div>
                                        )}

                                        {msg.comparisonData ? (
                                            <div className="flex flex-col gap-3 w-full min-w-[300px] md:min-w-[400px]">
                                                <div className="grid grid-cols-2 gap-3">
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
                                                <div className="grid grid-cols-2 gap-3">
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
                        ))}
                        
                        {isThinking && (
                            <div className="flex gap-4">
                                <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-white" style={{ backgroundColor: COLOR_PRIMARY }}>
                                    <Sparkles className="w-4 h-4" />
                                </div>
                                <div className="flex flex-col max-w-[80%] items-start">
                                    <div className="text-sm leading-relaxed py-2 px-4 rounded-2xl bg-transparent text-gray-500 -ml-2 animate-pulse">
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
                        
                        {messages.length < 3 && !attachment && (
                            <div className="flex gap-2 mb-4 overflow-x-auto pb-2 scrollbar-hide">
                                {suggestedPrompts.map((prompt, i) => (
                                    <button 
                                        key={i}
                                        onClick={() => setInput(prompt)}
                                        className="whitespace-nowrap px-4 py-2 bg-white border rounded-full text-sm transition-colors shadow-sm"
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
                            className="bg-white rounded-3xl shadow-lg border overflow-hidden transition-shadow" 
                            style={{ 
                                borderColor: isInputFocused ? `${COLOR_PRIMARY}80` : 'rgba(52, 73, 94, 0.1)',
                                boxShadow: isInputFocused ? `0 0 0 1px ${COLOR_PRIMARY}40` : undefined
                            }}
                        >
                            {/* Hidden File Input */}
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleFileSelect}
                                accept="image/*"
                                className="hidden"
                            />

                            {/* Image Preview Area */}
                            {attachment && (
                                <div className="px-4 pt-4 pb-0">
                                    <div className="relative inline-block group">
                                        <img 
                                            src={attachment.preview} 
                                            alt="Preview" 
                                            className="h-20 w-20 object-cover rounded-xl border border-gray-200 shadow-sm" 
                                        />
                                        <button 
                                            onClick={removeAttachment} 
                                            className="absolute -top-2 -right-2 bg-white text-gray-500 hover:text-red-500 rounded-full p-1 shadow-md border border-gray-100 transition-colors"
                                        >
                                            <X size={14} />
                                        </button>
                                    </div>
                                </div>
                            )}

                            <textarea
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onFocus={() => setIsInputFocused(true)}
                                onBlur={() => setIsInputFocused(false)}
                                onKeyDown={(e) => {
                                    if(e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        handleSend();
                                    }
                                }}
                                placeholder="Ask NutritionLM or attach a food label..."
                                className="w-full bg-transparent border-none focus:ring-0 outline-none p-4 min-h-[60px] max-h-40 resize-none text-gray-700 placeholder:text-gray-400"
                                rows={1}
                            />
                            
                            <div className="flex justify-between items-center px-3 pb-3 pt-1">
                                <div className="flex items-center gap-2">
                                    <button 
                                        onClick={() => setActiveButton(activeButton === 'factCheck' ? null : 'factCheck')}
                                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors"
                                        style={{
                                            backgroundColor: activeButton === 'factCheck' ? COLOR_FACT_CHECK : COLOR_FACT_CHECK_LIGHT,
                                            color: activeButton === 'factCheck' ? 'white' : COLOR_ACCENT_DARK
                                        }}
                                    >
                                        <ShieldCheck className="w-4 h-4" />
                                        Fact Check
                                    </button>

                                    <button 
                                        onClick={() => setActiveButton(activeButton === 'compare' ? null : 'compare')}
                                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors"
                                        style={{
                                            backgroundColor: activeButton === 'compare' ? COLOR_COMPARE : COLOR_COMPARE_LIGHT,
                                            color: activeButton === 'compare' ? 'white' : COLOR_ACCENT_DARK
                                        }}
                                    >
                                        <Scale className="w-4 h-4" />
                                        Compare
                                    </button>

                                    <button 
                                        onClick={() => setActiveButton(activeButton === 'nutrition' ? null : 'nutrition')}
                                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors"
                                        style={{
                                            backgroundColor: activeButton === 'nutrition' ? COLOR_NUTRITION : COLOR_NUTRITION_LIGHT,
                                            color: activeButton === 'nutrition' ? 'white' : COLOR_ACCENT_DARK
                                        }}
                                    >
                                        <UtensilsCrossed className="w-4 h-4" />
                                        Nutrition Check
                                    </button>
                                </div>

                                <div className="flex items-center gap-2">
                                    {/* Trigger File Input */}
                                    <button 
                                        onClick={() => fileInputRef.current?.click()}
                                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                                        title="Attach image"
                                    >
                                        <Paperclip className="w-5 h-5" />
                                    </button>

                                    <button 
                                        onClick={handleSend}
                                        disabled={!input.trim() && !attachment} // Allow send if image is attached even if text is empty
                                        className={`p-2 rounded-full transition-all duration-200 
                                            ${(input.trim() || attachment)
                                                ? 'shadow-md text-white' 
                                                : 'bg-gray-100 text-gray-300 cursor-not-allowed'}`}
                                        style={{ backgroundColor: (input.trim() || attachment) ? COLOR_PRIMARY : 'rgb(243, 244, 246)' }} 
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