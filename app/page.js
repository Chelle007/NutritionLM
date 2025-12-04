"use client";

import React, { useState, useRef, useEffect } from 'react';
import { createBrowserClient } from "@supabase/ssr";
import { 
    COLOR_CONTENT_BG,
    COLOR_SECONDARY_LIGHT,
    COLOR_ACCENT_DARK
} from './constants/colors';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import OtpPopup from './components/OtpPopup';
import ChatMessage from './components/ChatMessage';
import ThinkingIndicator from './components/ThinkingIndicator';
import InputArea from './components/InputArea';
import ProfileModal from './components/ProfileModal';
import FoodLogModal from './components/FoodLogModal';

export default function NutritionLM() {
    const [otp, setOtp] = useState(null);
    const [otpVisible, setOtpVisible] = useState(false);
    const [showOtpBox, setShowOtpBox] = useState(false);
    const [isGeneratingOtp, setIsGeneratingOtp] = useState(false);
    const [copied, setCopied] = useState(false);
    const [isRegenerating, setIsRegenerating] = useState(false);


    const [messages, setMessages] = useState([]);
    const [isLoadingHistory, setIsLoadingHistory] = useState(true);
    const [input, setInput] = useState('');
    
    // Attachment State
    const [attachment, setAttachment] = useState(null); // { file: File, preview: string }
    const [scanningAttachment, setScanningAttachment] = useState(null); // For scanning animation
    const fileInputRef = useRef(null);

    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [isThinking, setIsThinking] = useState(false);
    const [activeButton, setActiveButton] = useState(null); 
    const [isInputFocused, setIsInputFocused] = useState(false);
    const [isScanning, setIsScanning] = useState(false);
    const [scanProgress, setScanProgress] = useState({ stage: 0, message: '' });
    const messagesEndRef = useRef(null);

    const [telegramVerified, setTelegramVerified] = useState(false);
    const [googleFitVerified, setGoogleFitVerified] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const [foodLogs, setFoodLogs] = useState([]);
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
    const [isFoodLogModalOpen, setIsFoodLogModalOpen] = useState(false);
    const [selectedFoodLog, setSelectedFoodLog] = useState(null);
    const [sources, setSources] = useState([]);
    const [isLoadingSources, setIsLoadingSources] = useState(true);
    const [chatSessions, setChatSessions] = useState([]);
    const [currentChatSessionId, setCurrentChatSessionId] = useState(null);
    const [isLoadingChatSessions, setIsLoadingChatSessions] = useState(true);

    // Handle responsive detection
    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 768);
        };
        
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    useEffect(() => {
        async function loadUser() {
            const supabase = createBrowserClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
                process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? ""
            );

            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                setIsLoadingHistory(false);
                return;
            }

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

    // Load chat sessions
    useEffect(() => {
        async function loadChatSessions() {
            const supabase = createBrowserClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
                process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? ""
            );

            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                setIsLoadingChatSessions(false);
                return;
            }

            const { data: sessions, error } = await supabase
                .from("chat_sessions")
                .select("*")
                .eq("user_id", user.id)
                .order("updated_at", { ascending: false });

            if (error) {
                console.error("Error loading chat sessions:", error);
                setIsLoadingChatSessions(false);
                return;
            }

            if (sessions && sessions.length > 0) {
                setChatSessions(sessions);
                // Set the most recent session as current if none is selected
                if (!currentChatSessionId) {
                    setCurrentChatSessionId(sessions[0].id);
                }
            } else {
                // Create a default session if none exists
                const { data: newSession, error: createError } = await supabase
                    .from("chat_sessions")
                    .insert({
                        user_id: user.id,
                        title: "New Chat"
                    })
                    .select()
                    .single();

                if (!createError && newSession) {
                    setChatSessions([newSession]);
                    setCurrentChatSessionId(newSession.id);
                }
            }

            setIsLoadingChatSessions(false);
        }
        loadChatSessions();
    }, []);

    // Load chat history for current session
    useEffect(() => {
        async function loadChatHistory() {
            if (!currentChatSessionId) {
                setIsLoadingHistory(false);
                // Show welcome message if no session
                setMessages([{ 
                    id: 1, 
                    role: 'ai', 
                    text: "Hello! I'm NutritionLM. I've analyzed your uploaded dietary guidelines and meal plans. How can I help you eat better today?" 
                }]);
                return;
            }

            const supabase = createBrowserClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
                process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? ""
            );

            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                setIsLoadingHistory(false);
                setMessages([{ 
                    id: 1, 
                    role: 'ai', 
                    text: "Hello! I'm NutritionLM. I've analyzed your uploaded dietary guidelines and meal plans. How can I help you eat better today?" 
                }]);
                return;
            }

            const { data: chatHistory, error } = await supabase
                .from("chat_messages")
                .select("*")
                .eq("user_id", user.id)
                .eq("chat_session_id", currentChatSessionId)
                .order("created_at", { ascending: true })
                .limit(100); // Load last 100 messages

            if (error) {
                console.error("Error loading chat history:", error);
                setIsLoadingHistory(false);
                setMessages([{ 
                    id: 1, 
                    role: 'ai', 
                    text: "Hello! I'm NutritionLM. I've analyzed your uploaded dietary guidelines and meal plans. How can I help you eat better today?" 
                }]);
                return;
            }

            if (chatHistory && chatHistory.length > 0) {
                // Convert database messages to frontend format
                const formattedMessages = chatHistory.map((msg, index) => {
                    const messageObj = {
                        id: msg.id,
                        role: msg.role,
                        text: msg.message,
                    };

                    // Add metadata if available
                    if (msg.metadata) {
                        if (msg.metadata.citations) {
                            messageObj.citations = msg.metadata.citations;
                        }
                        if (msg.metadata.isComparison) {
                            messageObj.comparisonData = msg.metadata.comparisonData;
                        }
                    }

                    // Note: We can't restore images from history since we only stored a flag
                    // Images in history will be lost, but new messages will work fine

                    return messageObj;
                });

                setMessages(formattedMessages);
            } else {
                // No history, show welcome message
                setMessages([{ 
                    id: 1, 
                    role: 'ai', 
                    text: "Hello! I'm NutritionLM. I've analyzed your uploaded dietary guidelines and meal plans. How can I help you eat better today?" 
                }]);
            }

            setIsLoadingHistory(false);
        }
        loadChatHistory();
    }, [currentChatSessionId]);

    // Load food logs function
    const loadFoodLogs = async () => {
        const supabase = createBrowserClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
            process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? ""
        );

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: logs, error } = await supabase
            .from("food_logs")
            .select("*")
            .eq("user_id", user.id)
            .order("record_date", { ascending: false })
            .order("record_time", { ascending: false });

        if (error) {
            console.error("Error loading food logs:", error);
            setFoodLogs([]);
            return;
        }

        setFoodLogs(logs || []);
    };

    // Load food logs on mount
    useEffect(() => {
        loadFoodLogs();
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

    const handleRegenerateOtp = async () => {
        setIsRegenerating(true);
        await connectTelegram();
        
        setTimeout(() => {
            setIsRegenerating(false);
            alert("A new OTP has been generated!");
        }, 700);
    };


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

    // Load sources from API
    useEffect(() => {
        async function loadSources() {
            try {
                const response = await fetch('/api/sources');
                if (response.ok) {
                    const data = await response.json();
                    setSources(data.sources || []);
                } else {
                    console.error('Failed to load sources');
                }
            } catch (error) {
                console.error('Error loading sources:', error);
            } finally {
                setIsLoadingSources(false);
            }
        }
        loadSources();
    }, []);

    // Handle source upload
    const handleSourceUpload = async (file) => {
        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('title', file.name);

            const response = await fetch('/api/sources', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                let errorMessage = 'Failed to upload source';
                try {
                    const error = await response.json();
                    errorMessage = error.error || errorMessage;
                } catch (parseError) {
                    // If response is not JSON, use status text
                    errorMessage = response.statusText || errorMessage;
                }
                throw new Error(errorMessage);
            }

            const data = await response.json();
            setSources(prev => [data.source, ...prev]);
        } catch (error) {
            console.error('Error uploading source:', error);
            // Re-throw with a more user-friendly message if it's a network error
            if (error instanceof TypeError && error.message.includes('fetch')) {
                throw new Error('Network error. Please check your connection and try again.');
            }
            throw error;
        }
    };

    // Handle source delete
    const handleSourceDelete = async (sourceId) => {
        try {
            const response = await fetch(`/api/sources?id=${sourceId}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to delete source');
            }

            setSources(prev => prev.filter(s => s.id !== sourceId));
        } catch (error) {
            console.error('Error deleting source:', error);
            throw error;
        }
    };

    // Handle new chat creation
    const handleNewChat = async () => {
        const supabase = createBrowserClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
            process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? ""
        );

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: newSession, error } = await supabase
            .from("chat_sessions")
            .insert({
                user_id: user.id,
                title: "New Chat"
            })
            .select()
            .single();

        if (error) {
            console.error("Error creating new chat session:", error);
            alert("Failed to create new chat. Please try again.");
            return;
        }

        setChatSessions(prev => [newSession, ...prev]);
        setCurrentChatSessionId(newSession.id);
        setMessages([{ 
            id: 1, 
            role: 'ai', 
            text: "Hello! I'm NutritionLM. I've analyzed your uploaded dietary guidelines and meal plans. How can I help you eat better today?" 
        }]);
    };

    // Handle chat session selection
    const handleChatSessionSelect = (sessionId) => {
        setCurrentChatSessionId(sessionId);
    };

    // Handle chat session deletion
    const handleDeleteChatSession = async (sessionId) => {
        const supabase = createBrowserClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
            process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? ""
        );

        const { error } = await supabase
            .from("chat_sessions")
            .delete()
            .eq("id", sessionId);

        if (error) {
            console.error("Error deleting chat session:", error);
            throw new Error("Failed to delete chat session");
        }

        setChatSessions(prev => prev.filter(s => s.id !== sessionId));
        
        // If deleted session was current, switch to another or create new
        if (currentChatSessionId === sessionId) {
            const remainingSessions = chatSessions.filter(s => s.id !== sessionId);
            if (remainingSessions.length > 0) {
                setCurrentChatSessionId(remainingSessions[0].id);
            } else {
                // Create a new session if none remain
                handleNewChat();
            }
        }
    };

    const suggestedPrompts = [
        "Diet plan summary",
        "Grocery list based on my allergies"
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

            // Stage 1: Scanning food image (if image provided)
            if (attachmentData?.file) {
                setScanProgress({ stage: 1, message: 'Scanning food image...' });
                await new Promise(resolve => setTimeout(resolve, 500)); // Small delay for UX
                
                setScanProgress({ stage: 2, message: 'Analyzing ingredients...' });
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

                // Check if the image is not food
                if (data.food_name === "not a food") {
                    throw new Error("The uploaded image does not appear to contain food. Please upload an image of food or a meal.");
                }

                foodName = data.food_name || 'Detected Food';
                // Convert ingredients from array of objects {name, grams} to array of strings
                if (data.ingredients && Array.isArray(data.ingredients)) {
                    ingredients = data.ingredients.map(ing => 
                        typeof ing === 'object' && ing.name ? ing.name : ing
                    );
                } else {
                    ingredients = data.ingredients || [];
                }
            } else {
                setScanProgress({ stage: 2, message: 'Analyzing ingredients...' });
                const parsed = parseNutritionInput(messageText);
                foodName = parsed.foodName;
                ingredients = parsed.ingredients;
            }

            if (!foodName || ingredients.length === 0) {
                throw new Error("Please provide a food name and at least one ingredient.");
            }

            // Stage 3: Extracting nutrition data
            setScanProgress({ stage: 3, message: 'Extracting nutrition data...' });
            await new Promise(resolve => setTimeout(resolve, 300)); // Small delay for UX

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

            // Stage 4: Generating breakdown
            setScanProgress({ stage: 4, message: 'Generating nutrition breakdown...' });
            
            // Stop scanning and thinking immediately to prevent extra render
            setIsScanning(false);
            setIsThinking(false);
            setScanProgress({ stage: 0, message: '' });

            const nutritionMessage = {
                id: Date.now() + 1,
                role: 'ai',
                text: `**Nutrition Analysis for ${foodName}**\n\n**Ingredients:** ${ingredients.join(', ')}\n\n**Nutrition Breakdown:**`,
                nutritionData: nutritionData.nutritions,
                nutritionImage: attachmentData?.preview || null,
                showScanAnimation: true, // Flag to show scanning animation initially
            };
            setMessages(prev => [...prev, nutritionMessage]);
            
            // Hide scanning animation on image after 2 seconds
            setTimeout(() => {
                setMessages(prev => prev.map(msg => 
                    msg.id === nutritionMessage.id 
                        ? { ...msg, showScanAnimation: false }
                        : msg
                ));
            }, 2000);
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

    const logFood = async (attachmentData) => {
        try {
            if (!attachmentData?.file) {
                throw new Error("Please attach an image to log food.");
            }

            // Stage 1: Uploading image
            setScanProgress({ stage: 1, message: 'Uploading image...' });
            await new Promise(resolve => setTimeout(resolve, 300));

            // Stage 2: Scanning ingredients
            setScanProgress({ stage: 2, message: 'Scanning ingredients...' });
            await new Promise(resolve => setTimeout(resolve, 300));

            // Stage 3: Analyzing nutrition
            setScanProgress({ stage: 3, message: 'Analyzing nutrition...' });
            await new Promise(resolve => setTimeout(resolve, 300));

            // Stage 4: Saving to database
            setScanProgress({ stage: 4, message: 'Saving food log...' });

            const formData = new FormData();
            formData.append("image", attachmentData.file);

            const response = await fetch("/api/food-log", {
                method: "POST",
                body: formData,
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Failed to log food");
            }

            // Stop scanning and thinking
            setIsScanning(false);
            setIsThinking(false);
            setScanProgress({ stage: 0, message: '' });

            const successMessage = {
                id: Date.now() + 1,
                role: 'ai',
                text: `✅ **Food logged successfully!**\n\n**Food:** ${data.foodName}\n\n**Ingredients:** ${data.ingredients.join(', ')}\n\n**Nutrition:**\n${Object.entries(data.nutrition).map(([key, value]) => `- ${key}: ${value}`).join('\n')}`,
                nutritionData: data.nutrition,
                nutritionImage: attachmentData?.preview || null,
                showScanAnimation: true,
            };
            setMessages(prev => [...prev, successMessage]);

            // Refresh food logs list
            await loadFoodLogs();

            // Hide scanning animation on image after 2 seconds
            setTimeout(() => {
                setMessages(prev => prev.map(msg => 
                    msg.id === successMessage.id 
                        ? { ...msg, showScanAnimation: false }
                        : msg
                ));
            }, 2000);
        } catch (error) {
            setMessages(prev => [
                ...prev,
                {
                    id: Date.now() + 2,
                    role: 'ai',
                    text: `❌ Failed to log food: ${error.message}`,
                },
            ]);
            setIsScanning(false);
            setIsThinking(false);
            setScanProgress({ stage: 0, message: '' });
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
        const isLogFoodMode = activeButton === 'logFood';

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
                setIsScanning(true);
                setScanningAttachment(currentAttachment); // Store attachment for scanning animation
                setScanProgress({ stage: 0, message: 'Initializing nutrition check...' });
                await runNutritionCheck(currentInput, currentAttachment);
            } finally {
                // Clean up scanning state (already stopped in runNutritionCheck, but ensure cleanup)
                setIsThinking(false);
                setIsScanning(false);
                setScanningAttachment(null);
                setScanProgress({ stage: 0, message: '' });
                setActiveButton(null);
            }
            return;
        }

        if (isLogFoodMode) {
            try {
                setIsThinking(true);
                setIsScanning(true);
                setScanningAttachment(currentAttachment); // Store attachment for scanning animation
                setScanProgress({ stage: 0, message: 'Initializing food log...' });
                await logFood(currentAttachment);
            } finally {
                // Clean up scanning state (already stopped in logFood, but ensure cleanup)
                setIsThinking(false);
                setIsScanning(false);
                setScanningAttachment(null);
                setScanProgress({ stage: 0, message: '' });
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
                    chatSessionId: currentChatSessionId,
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

            // Update current session ID if a new one was created
            if (data.chatSessionId) {
                if (data.chatSessionId !== currentChatSessionId) {
                    setCurrentChatSessionId(data.chatSessionId);
                }
                // Reload chat sessions to get updated titles and order
                const supabase = createBrowserClient(
                    process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
                    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? ""
                );
                const { data: { user } } = await supabase.auth.getUser();
                if (user) {
                    const { data: sessions } = await supabase
                        .from("chat_sessions")
                        .select("*")
                        .eq("user_id", user.id)
                        .order("updated_at", { ascending: false });
                    if (sessions) {
                        setChatSessions(sessions);
                    }
                }
            }

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
            <Sidebar 
                isSidebarOpen={isSidebarOpen}
                setIsSidebarOpen={setIsSidebarOpen}
                isMobile={isMobile}
                sources={sources}
                foodLogs={foodLogs}
                onOpenFoodLog={(foodLog) => {
                    setSelectedFoodLog(foodLog);
                    setIsFoodLogModalOpen(true);
                }}
                onOpenProfile={() => setIsProfileModalOpen(true)}
                onSourceUpload={handleSourceUpload}
                onSourceDelete={handleSourceDelete}
                chatSessions={chatSessions}
                currentChatSessionId={currentChatSessionId}
                onChatSessionSelect={handleChatSessionSelect}
                onNewChat={handleNewChat}
                onDeleteChatSession={handleDeleteChatSession}
            />

            {/* CHAT AREA */}
            <div className="flex-1 flex flex-col relative w-full" style={{ backgroundColor: COLOR_CONTENT_BG }}>
                <Header 
                    isSidebarOpen={isSidebarOpen}
                    setIsSidebarOpen={setIsSidebarOpen}
                    isMobile={isMobile}
                    sources={sources}
                    telegramVerified={telegramVerified}
                    googleFitVerified={googleFitVerified}
                    onOpenOtpBox={openOtpBox}
                    onConnectGoogleFit={connectGoogleFit}
                />

                <OtpPopup 
                    showOtpBox={showOtpBox}
                    setShowOtpBox={setShowOtpBox}
                    otp={otp}
                    otpVisible={otpVisible}
                    setOtpVisible={setOtpVisible}
                    copied={copied}
                    setCopied={setCopied}
                    isRegenerating={isRegenerating}
                    onRegenerateOtp={handleRegenerateOtp}
                />

                <ProfileModal 
                    isOpen={isProfileModalOpen}
                    onClose={() => setIsProfileModalOpen(false)}
                />

                <FoodLogModal 
                    isOpen={isFoodLogModalOpen}
                    onClose={() => {
                        setIsFoodLogModalOpen(false);
                        setSelectedFoodLog(null);
                    }}
                    foodLog={selectedFoodLog}
                    onAddToInput={setAttachment}
                />




                {/* Chat */}
                <div className="flex-1 overflow-y-auto p-3 md:p-4 lg:p-8 scrollbar-hide">
                    <div className="max-w-3xl mx-auto space-y-6 md:space-y-8">
                        {messages.map((msg) => (
                            <ChatMessage key={msg.id} msg={msg} />
                        ))}
                        
                        <ThinkingIndicator 
                            isThinking={isThinking}
                            isScanning={isScanning}
                            scanningAttachment={scanningAttachment}
                            scanProgress={scanProgress}
                        />
                        <div ref={messagesEndRef} />
                    </div>
                </div>

                <InputArea
                    input={input}
                    setInput={setInput}
                    attachment={attachment}
                    fileInputRef={fileInputRef}
                    isInputFocused={isInputFocused}
                    setIsInputFocused={setIsInputFocused}
                    activeButton={activeButton}
                    setActiveButton={setActiveButton}
                    suggestedPrompts={suggestedPrompts}
                    messages={messages}
                    onFileSelect={handleFileSelect}
                    onRemoveAttachment={removeAttachment}
                    onSend={handleSend}
                />

            </div>
        </div>
    );
}