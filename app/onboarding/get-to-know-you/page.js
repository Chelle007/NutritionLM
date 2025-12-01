"use client";

import { useState, useEffect } from "react"; 
import { useRouter } from "next/navigation";
import { 
    ArrowRight, 
    ArrowLeft, 
    Dumbbell, 
    Utensils, 
    WeightIcon, 
    Zap, 
    ScrollText, 
    Coffee, 
    Bed, 
    Clock, 
    ShoppingCart, 
    Droplet, 
    Tag, 
    Activity 
} from "lucide-react";
import { insertUserPreference } from "../../../services/userPreference"; 

//Defining the color palette for this page
const COLOR_PRIMARY = "#4CAF50";      //Forest Green
const COLOR_SECONDARY = "#C8E6C9";    //Sage Green 
const COLOR_PRIMARY_HOVER = "#388E3C"; //Darker Green for hover feedback
const COLOR_ACCENT_DARK = "#34495E";  //Dark Slate/Charcoal

//Data structure for the questions and options
const goalOptions = [
    { label: "Weight Loss", value: "Sustainable Weight Loss", icon: WeightIcon },
    { label: "Muscle Gain", value: "Muscle & Performance Gain", icon: Dumbbell },
    { label: "Balanced Diet", value: "Optimize Gut Health", icon: Utensils },
    { label: "Energy", value: "Boost Energy & Focus", icon: Zap },
    { label: "Manage Health", value: "Manage Dietary Restrictions / Conditions", icon: Activity },
];

const habitOptions = [
    { label: "Late Snacking", value: "Chronic Late-Night Snacking", icon: Bed },
    { label: "Sugary Drinks", value: "Reliance on Sugary Drinks", icon: Coffee },
    { label: "Skipped Meals", value: "Irregular/Skipped Meals", icon: Clock },
    { label: "Eating Out", value: "Eating Out Too Frequently", icon: ShoppingCart },
    { label: "Hydration", value: "Insufficient Water Intake", icon: Droplet },
];

const planOptions = [
    { label: "Daily Cooking", value: "Daily Home Cooking", icon: Utensils },
    { label: "Meal Preparation", value: "Batch Meal Prep (Weekend)", icon: ScrollText },
    { label: "On-the-go", value: "Quick & Ready-to-Eat Solutions", icon: Clock },
    { label: "Flexible", value: "Flexible & Social Dining", icon: Zap },
    { label: "Budgeting", value: "Cost & Budget Constraint", icon: Tag },
];

//Used to connect to the connect-tele page later on
export default function GetToKnowYouPage() {
    //Initializes the Next.js router for navigation
    const router = useRouter();

    //Create a wrapper function that uses the real router instance
    const liveRouterPush = (path) => {
        router.push(path);
    };
    
    //This state tracks the current question/step and user selections
    const [question, setStep] = useState(1);
    const [selectedGoal, setSelectedGoal] = useState("");
    const [selectedHabits, setSelectedHabits] = useState([]);
    const [selectedPlan, setSelectedPlan] = useState("");
    
    //States used for animation control
    const [currentStepContent, setCurrentStepContent] = useState(null);
    const [isTransitioning, setIsTransitioning] = useState(false); 

    // TEST: Inserts dummy user preference data into the database
    useEffect(() => {
        const insertUserPreferenceData = async () => {
            try {
                const result = await insertUserPreference({ 
                    birth_date: '1990-01-01', 
                    gender: 'male',
                    weight_kg: 70,
                    height_cm: 180,
                    goal: 'weight_loss',
                    activity_level: 'moderate',
                    dietary_preference: 'vegan',
                    allergies: ['gluten', 'lactose'],
                    habits: ['late_snacking', 'sugary_drinks'],
                });
                console.log('Test insertion result:', result);
            } catch (error) {
                console.error('Test insertion error:', error);
            }
        };
        insertUserPreferenceData();
    }, []); // Empty dependency array means this runs once on mount

    //Below here is the Logic for handling user interactions and rendering content
    //LOGIC CODES
    //Toggles the selection status of a habit in the multi-select step
    const toggleHabit = (value) => {
        setSelectedHabits((prev) =>
            prev.includes(value) ? prev.filter((h) => h !== value) : [...prev, value]
        );
    };

    //Handles the step transition with a fade-out/fade-in animation delay
    const handleStepChange = (newStep) => {
        if (newStep < 1 || newStep > 3) return;

        //First step, transition out current content
        setIsTransitioning(true);

        //Second step, after delay, change content and transition in
        setTimeout(() => {
            setStep(newStep);
        }, 300);
    };
    
    //Handles going back one step or navigating to the login page from step 1
    const handleBack = () => {
        if (question > 1) {
            handleStepChange(question - 1);
        } else {
            // ACTION: Go back to login page
            liveRouterPush("/login"); 
        }
    };

    //Handles advancing to the next step or completing the onboarding
    const handleNext = () => {
        // Validation checks
        if (question === 1 && !selectedGoal) return;
        if (question === 2 && selectedHabits.length === 0) return; 
        if (question === 3 && !selectedPlan) return; 

        if (question === 3) {
            // FINAL ACTION: Navigate to the /onboarding/connect-tele page
            liveRouterPush("/onboarding/connect-tele");
        } else {
            handleStepChange(question + 1);
        }
    };


    //nEffect, controls, and animation
    //Updates the content displayed (question text, options) whenever the step or selection changes
    useEffect(() => {
        let questionText = "";
        let options = [];
        let selection = [];
        let handler = null;
        let isMultiSelect = false;
        
        if (question === 1) {
            questionText = "1. What is your main mission?";
            options = goalOptions;
            selection = [selectedGoal];
            handler = (value) => setSelectedGoal(value);
        } else if (question === 2) {
            questionText = "2. Which habits are currently holding you back?";
            options = habitOptions;
            selection = selectedHabits;
            handler = toggleHabit;
            isMultiSelect = true;
        } else if (question === 3) {
            questionText = "3. How would you describe your lifestyle plan?";
            options = planOptions;
            selection = [selectedPlan];
            handler = (value) => setSelectedPlan(value);
        }

        const isStepComplete = (question === 1 && selectedGoal) ||
                             (question === 2 && selectedHabits.length > 0) ||
                             (question === 3 && selectedPlan);
                             
        const continueText = question === 3 ? "FINISH" : "NEXT";
        
        // Update the content object when question changes
        setCurrentStepContent({ questionText, options, selection, handler, isMultiSelect, isStepComplete, continueText });
        
        // After content updates, immediately reset transition state to fade-in
        setIsTransitioning(false); 

    }, [question, selectedGoal, selectedHabits, selectedPlan]);

    //Function responsible for rendering the content of the current step/question
    const renderStepContent = () => {
        if (!currentStepContent) return null; 

        const { questionText, options, selection, handler, isMultiSelect, isStepComplete, continueText } = currentStepContent;
        
        const animationClasses = isTransitioning 
            ? 'opacity-0 translate-y-4' 
            : 'opacity-100 translate-y-0'; 
        
        return (
            <div 
                key={question} 
                className={`transition-all duration-500 ease-in-out ${animationClasses}`}
            >
                {/* QUESTION STYLING: Dark Slate for readability */}
                <h2 
                    className="text-xl font-extrabold mb-5" 
                    style={{ fontFamily: 'Montserrat, sans-serif', color: COLOR_ACCENT_DARK }}
                >
                    {questionText}
                </h2>
                
                {isMultiSelect && (
                    <p 
                        className="text-xs mb-6" 
                        style={{ color: COLOR_ACCENT_DARK }}
                    >
                        Choose as many as you like!
                    </p>
                )}
                
                <div className="flex flex-wrap gap-4 justify-center">
                    {options.map((option) => {
                        const isSelected = selection.includes(option.value);
                        const IconComponent = option.icon;

                        return (
                            <button
                                key={option.value}
                                type="button"
                                onClick={() => handler(option.value)}
                                style={{ 
                                    borderColor: isSelected ? COLOR_PRIMARY : '#E5E7EB',
                                    backgroundColor: isSelected ? '#F1FFF1' : 'white', 
                                }}
                                className={`w-40 h-40 p-4 flex flex-col items-center justify-center rounded-xl border-4 transition-all shadow-md hover:shadow-lg`}
                            >
                                <IconComponent 
                                    className="w-12 h-12 mb-3" 
                                    style={{ color: isSelected ? COLOR_PRIMARY : COLOR_ACCENT_DARK }}
                                />
                                <span className="text-sm font-semibold text-center" style={{ color: COLOR_ACCENT_DARK }}>
                                    {option.label}
                                </span>
                            </button>
                        );
                    })}
                </div>
                
                {/* Typeform Style Footer (OK/Next Button) */}
                <div className="mt-12 text-center">
                    <button
                        onClick={handleNext}
                        disabled={!isStepComplete || isTransitioning}
                        className={`
                            inline-flex items-center px-6 py-3 rounded-md text-sm font-bold tracking-wide uppercase
                            transition-colors duration-300 
                            ${isStepComplete 
                                ? 'bg-[#4CAF50] text-white hover:bg-[#388E3C] shadow-md' 
                                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                            }
                        `}
                    >
                        {continueText}
                        <ArrowRight className="w-4 h-4 ml-2" />
                    </button>

                </div>
            </div>
        );
    };

    //Calculates and returns the current progress text
    const getStepProgress = () => {
        return `Question ${question} of 3`;
    };

    //Main component return statement rendering the entire layout
    return (
        <main className="min-h-screen flex items-center justify-center bg-[#F8F8F8] px-4">
            <div 
                className="w-full max-w-2xl rounded-3xl shadow-2xl p-10 overflow-hidden" 
                style={{ backgroundColor: COLOR_SECONDARY }} 
            >
                <div className="flex items-center justify-between mb-8">
                    <button
                        onClick={handleBack}
                        disabled={isTransitioning} 
                        style={{ color: COLOR_PRIMARY }} 
                        className={`
                            flex items-center text-sm transition-colors duration-100 
                            hover:text-current 
                            ${!isTransitioning ? `hover:text-current` : ''}
                        `}
                        onMouseEnter={(e) => {
                            if (!isTransitioning) e.currentTarget.style.color = COLOR_PRIMARY_HOVER
                        }}
                        onMouseLeave={(e) => {
                            if (!isTransitioning) e.currentTarget.style.color = COLOR_PRIMARY;
                        }}
                    >
                        <ArrowLeft className="w-4 h-4 mr-1" />
                        Back
                    </button>

                    <span className="text-sm" style={{ color: COLOR_PRIMARY }}>
                        {getStepProgress()}
                    </span>
                </div>

                <div className="relative">
                    {renderStepContent()}
                </div>

            </div>
        </main>
    );
}