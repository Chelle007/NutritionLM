"use client";

import { useRouter } from "next/navigation";
import {
    ArrowLeft,
    ArrowRight,
    Send,         //Telegram Icon Placeholder
    ShieldCheck,
    BellRing,
} from "lucide-react";

//Color Paletter (As per provided by Rey)
const COLOR_PRIMARY = "#4CAF50";      // Forest Green 
const COLOR_SECONDARY_LIGHT = "#C8E6C9";    // Sage Green 
const COLOR_PRIMARY_HOVER = "#388E3C"; // Darker Green
const COLOR_ACCENT_DARK = "#34495E";  // Dark Slate/Charcoal
const COLOR_CONTENT_BG = "#F8F8F8";  // Light Grey/Off-white 

// Custom color variables for this page
const COLOR_TELEGRAM_BLUE = "#0088CC"; // Telegram's color

export default function ConnectTelegramPage() {
    const router = useRouter();

    const handleConnect = () => {
        router.push("/");
    };

    return (
        // Main Background: Light Grey/Off-white (#F8F8F8)
        <main className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: COLOR_CONTENT_BG }}>
            {/* Main Card: Uses Sage Green background and shadows similar to GetToKnowYouPage */}
            <div 
                className="w-full max-w-2xl rounded-3xl shadow-2xl p-10 overflow-hidden" 
                style={{ backgroundColor: COLOR_SECONDARY_LIGHT }} 
            >
                
                {/* Header (Back button only) */}
                <div className="flex items-center justify-start mb-8">
                    <button
                        onClick={() => router.back()}
                        // Back Button style matched to GetToKnowYouPage
                        style={{ color: COLOR_PRIMARY }}
                        className={`
                            flex items-center text-sm transition-colors duration-100 
                            hover:text-current 
                        `}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.color = COLOR_PRIMARY_HOVER;
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.color = COLOR_PRIMARY;
                        }}
                    >
                        <ArrowLeft className="w-4 h-4 mr-1" />
                        Back
                    </button>
                </div>

                {/* Main Headings: Dark Slate/Charcoal (#34495E) */}
                <h1 className="text-xl font-extrabold mb-2" style={{ color: COLOR_ACCENT_DARK }}>
                    Step 2: Connect Telegram
                </h1>
                <p className="text-sm text-gray-700 mb-8">
                    Link your Telegram account so NutritionLM can send you reminders and
                    quick actions right in chat.
                </p>

                {/* Big Telegram connect card (Styled like a large selection button) */}
                <div 
                    className="rounded-xl border-4 p-5 mb-8 transition-all shadow-md"
                    style={{ borderColor: COLOR_PRIMARY, backgroundColor: 'white' }} 
                >
                    <div className="flex items-center gap-4">
                        {/* Icon Circle: Telegram Blue (Color preserved) */}
                        <div className="flex-shrink-0 w-12 h-12 rounded-full text-white flex items-center justify-center" style={{ backgroundColor: COLOR_TELEGRAM_BLUE }}>
                            <Send className="w-6 h-6" />
                        </div>
                        <div className="flex-grow">
                            {/* Text: Dark Slate/Charcoal (#34495E) */}
                            <p className="text-base font-semibold" style={{ color: COLOR_ACCENT_DARK }}>
                                Connect NutritionLM Bot
                            </p>
                            <p className="text-xs text-gray-500">
                                This allows for smart reminders and quick meal logging via chat.
                            </p>
                        </div>
                    </div>

                    <button
                        onClick={handleConnect}
                        className="mt-5 inline-flex items-center justify-center px-6 py-3 rounded-md text-sm font-bold tracking-wide uppercase text-white w-full transition-colors duration-300"
                        style={{ backgroundColor: COLOR_PRIMARY, transition: 'background-color 0.3s' }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = COLOR_PRIMARY_HOVER}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = COLOR_PRIMARY}
                    >
                        Connect Telegram
                        <ArrowRight className="w-4 h-4 ml-2" />
                    </button>
                </div>

                {/* Benefits list */}
                <div className="space-y-4 mb-10">
                    <div className="flex items-start gap-3">
                        <BellRing className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: COLOR_PRIMARY }} />
                        <div>
                            <p className="text-sm font-semibold" style={{ color: COLOR_ACCENT_DARK }}>
                                Smart reminders
                            </p>
                            <p className="text-xs text-gray-600">
                                Get gentle nudges to log meals, drink water, or review your
                                weekly summary right inside Telegram.
                            </p>
                        </div>
                    </div>

                    <div className="flex items-start gap-3">
                        <ShieldCheck className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: COLOR_PRIMARY }} />
                        <div>
                            <p className="text-sm font-semibold" style={{ color: COLOR_ACCENT_DARK }}>
                                Private & secure
                            </p>
                            <p className="text-xs text-gray-600">
                                We only use Telegram to send you messages you opt into. You can
                                disconnect at any time.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Button to home page after finish */}
                <div className="flex justify-center">
                    <button
                        onClick={() => router.push("/")}
                        className="inline-flex items-center px-6 py-3 rounded-md text-sm font-bold tracking-wide uppercase text-white transition-colors duration-300 shadow-md"
                        style={{ backgroundColor: COLOR_PRIMARY, transition: 'background-color 0.3s' }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = COLOR_PRIMARY_HOVER}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = COLOR_PRIMARY}
                    >
                        Go to Home
                        <ArrowRight className="w-4 h-4 ml-2" />
                    </button>
                </div>
            </div>
        </main>
    );
}