"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
  Activity,
  MessageCircle,
} from "lucide-react";
import { insertUserPreference, getUserPreference } from "../../services/userPreference";
import { createClient } from "../utils/supabase/client";

// UI theme
const COLOR_PRIMARY = "#4CAF50";
const COLOR_SECONDARY = "#C8E6C9";
const COLOR_PRIMARY_HOVER = "#388E3C";
const COLOR_ACCENT_DARK = "#34495E";

// Route to send the user to after completing onboarding
const AFTER_ONBOARDING_PATH = "/";

// Replace with your real Telegram bot link
const TELEGRAM_BOT_URL = "https://t.me/nutritionlm_bot?text=hello";

// Static options for each step
const goalOptions = [
  { label: "Weight Loss", value: "Sustainable Weight Loss", icon: WeightIcon },
  { label: "Muscle Gain", value: "Muscle & Performance Gain", icon: Dumbbell },
  { label: "Balanced Diet", value: "Optimize Gut Health", icon: Utensils },
  { label: "Energy", value: "Boost Energy & Focus", icon: Zap },
  {
    label: "Manage Health",
    value: "Manage Dietary Restrictions / Conditions",
    icon: Activity,
  },
];

const habitOptions = [
  { label: "Late Snacking", value: "Chronic Late-Night Snacking", icon: Bed },
  { label: "Sugary Drinks", value: "Reliance on Sugary Drinks", icon: Coffee },
  { label: "Skipped Meals", value: "Irregular/Skipped Meals", icon: Clock },
  {
    label: "Eating Out",
    value: "Eating Out Too Frequently",
    icon: ShoppingCart,
  },
  { label: "Hydration", value: "Insufficient Water Intake", icon: Droplet },
];

const planOptions = [
  { label: "Daily Cooking", value: "Daily Home Cooking", icon: Utensils },
  { label: "Meal Preparation", value: "Batch Meal Prep (Weekend)", icon: ScrollText },
  { label: "On-the-go", value: "Quick & Ready-to-Eat Solutions", icon: Clock },
  { label: "Flexible", value: "Flexible & Social Dining", icon: Zap },
  { label: "Budgeting", value: "Cost & Budget Constraint", icon: Tag },
];

// Basic YYYY-MM-DD validation
const isValidBirthDate = (date) => {
  if (!date) return false;
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(date)) return false;
  const d = new Date(date);
  return !Number.isNaN(d.getTime());
};

function GetToKnowYouPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // 🛡️ Onboarding guard: ensure auth + prefs routing
  useEffect(() => {
    const protectOnboarding = async () => {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user;

      if (!user) {
          // Wait for auth state hydration instead of immediately redirecting
          supabase.auth.onAuthStateChange((_event, session) => {
              if (!session) router.replace("/login");
          });
          return;
      }

      try {
        const prefs = await getUserPreference();

        // 2) User already has prefs → skip onboarding → go home
        if (prefs && prefs.length > 0) {
          router.replace("/");
          return;
        }

        // 3) Otherwise: user is new → stay on onboarding
      } catch (err) {
        console.warn("No existing preferences, showing onboarding");
      }
    };

    protectOnboarding();
  }, [router]);

  // Remove Supabase OAuth ?code=... from URL after first load
  useEffect(() => {
    const hasCode = searchParams.get("code");
    if (hasCode) {
      router.replace("/onboarding");
    }
  }, [router, searchParams]);

  // Step index: 1 = basic info, 2 = goal, 3 = habits, 4 = plan, 5 = Telegram
  const [question, setStep] = useState(1);

  // Step answers
  const [selectedGoal, setSelectedGoal] = useState("");
  const [selectedHabits, setSelectedHabits] = useState([]);
  const [selectedPlan, setSelectedPlan] = useState("");

  // Basic information
  const [birthDate, setBirthDate] = useState("");
  const [gender, setGender] = useState("");
  const [weightKg, setWeightKg] = useState("");
  const [heightCm, setHeightCm] = useState("");
  const [activityLevel, setActivityLevel] = useState("");
  const [allergiesInput, setAllergiesInput] = useState("");
  const [dietaryPreference, setDietaryPreference] = useState("");

  // UI state when answering questions
  const [currentStepContent, setCurrentStepContent] = useState(null);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const liveRouterPush = (path) => router.push(path);

  const toggleHabit = (value) => {
    setSelectedHabits((prev) =>
      prev.includes(value) ? prev.filter((h) => h !== value) : [...prev, value]
    );
  };

  const handleStepChange = (newStep) => {
    if (newStep < 1 || newStep > 5) return;
    setIsTransitioning(true);
    setTimeout(() => setStep(newStep), 300);
  };

  const handleBack = () => {
    if (question > 1) {
      handleStepChange(question - 1);
    } else {
      liveRouterPush("/login");
    }
  };

  // Basic validation so we don't save obviously broken profiles
  const isBasicInfoComplete = () => {
    const weight = parseInt(weightKg, 10);
    const height = parseInt(heightCm, 10);

    return (
      isValidBirthDate(birthDate) &&
      gender.trim() &&
      activityLevel.trim() &&
      dietaryPreference.trim() &&
      !Number.isNaN(weight) &&
      weight > 0 &&
      !Number.isNaN(height) &&
      height > 0
    );
  };

  const handleNext = () => {
    if (question === 1 && !isBasicInfoComplete()) return;
    if (question === 2 && !selectedGoal) return;
    if (question === 3 && selectedHabits.length === 0) return;
    if (question === 4 && !selectedPlan) return;

    if (question === 4) {
      handleStepChange(5);
    } else {
      handleStepChange(question + 1);
    }
  };

  // Persist the whole onboarding result once, at the end
  const finishOnboarding = async () => {
    const payload = {
      birth_date: birthDate,
      gender,
      weight_kg: parseInt(weightKg, 10),
      height_cm: parseInt(heightCm, 10),
      goal: selectedGoal,
      activity_level: activityLevel,
      dietary_preference: dietaryPreference,
      allergies: allergiesInput
        .split(",")
        .map((a) => a.trim())
        .filter(Boolean),
      habits: selectedHabits,
      nutrition_goals: selectedPlan,
    };

    try {
      await insertUserPreference(payload);
    } catch (error) {
      console.error("Failed to insert user preference", error);
    }

    liveRouterPush(AFTER_ONBOARDING_PATH);
  };

  const handleSkipTelegram = async () => {
    await finishOnboarding();
  };

  const handleConnectTelegram = async () => {
    try {
      if (typeof window !== "undefined") {
        window.open(TELEGRAM_BOT_URL, "_blank", "noopener,noreferrer");
      }
    } catch (err) {
      console.error("Failed to open Telegram link", err);
    }
    await finishOnboarding();
  };

  // Rebuild the step configuration whenever relevant state changes
  useEffect(() => {
    let questionText = "";
    let options = [];
    let selection = [];
    let handler = null;
    let isMultiSelect = false;
    let type = "choices";

    if (question === 1) {
      questionText = "1. Let’s get to know you!";
      type = "form";
    } else if (question === 2) {
      questionText = "2. What is your main mission?";
      options = goalOptions;
      selection = [selectedGoal];
      handler = (value) => setSelectedGoal(value);
    } else if (question === 3) {
      questionText = "3. Which habits are currently holding you back?";
      options = habitOptions;
      selection = selectedHabits;
      handler = toggleHabit;
      isMultiSelect = true;
    } else if (question === 4) {
      questionText = "4. How would you describe your lifestyle plan?";
      options = planOptions;
      selection = [selectedPlan];
      handler = (value) => setSelectedPlan(value);
    } else if (question === 5) {
      questionText = "5. Connect Telegram (optional)";
      type = "telegram";
    }

    const isStepComplete =
      (question === 1 && isBasicInfoComplete()) ||
      (question === 2 && selectedGoal) ||
      (question === 3 && selectedHabits.length > 0) ||
      (question === 4 && selectedPlan) ||
      question === 5; 

    setCurrentStepContent({
      type,
      questionText,
      options,
      selection,
      handler,
      isMultiSelect,
      isStepComplete,
      continueText: "NEXT",
    });

    setIsTransitioning(false);
  }, [
    question,
    selectedGoal,
    selectedHabits,
    selectedPlan,
    birthDate,
    gender,
    weightKg,
    heightCm,
    activityLevel,
    allergiesInput,
    dietaryPreference,
  ]);

  const renderStepContent = () => {
    if (!currentStepContent) return null;

    const {
      type,
      questionText,
      options,
      selection,
      handler,
      isMultiSelect,
      isStepComplete,
      continueText,
    } = currentStepContent;

    const animationClasses = isTransitioning
      ? "opacity-0 translate-y-4"
      : "opacity-100 translate-y-0";

    return (
      <div
        key={question}
        className={`transition-all duration-500 ease-in-out ${animationClasses}`}
      >
        <h2
          className="text-xl font-extrabold mb-5"
          style={{ fontFamily: "Montserrat, sans-serif", color: COLOR_ACCENT_DARK }}
        >
          {questionText}
        </h2>

        {type === "form" ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Basic profile fields used to personalize recommendations */}
              <div>
                <label
                  className="block text-xs font-semibold mb-1"
                  style={{ color: COLOR_ACCENT_DARK }}
                >
                  Birthdate
                </label>
                <input
                  type="date"
                  value={birthDate}
                  onChange={(e) => setBirthDate(e.target.value)}
                  className={`w-full rounded-md border px-3 py-2 text-sm text-black ${
                    birthDate && !isValidBirthDate(birthDate)
                      ? "border-red-500"
                      : "border-black-300"
                  }`}
                />
                {birthDate && !isValidBirthDate(birthDate) && (
                  <p className="mt-1 text-[10px] text-red-500">
                    Format must be YYYY-MM-DD
                  </p>
                )}
              </div>

              <div>
                <label
                  className="block text-xs font-semibold mb-1"
                  style={{ color: COLOR_ACCENT_DARK }}
                >
                  Gender
                </label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className="w-full rounded-md border px-3 py-2 text-sm text-black"
                >
                  <option value="">Select...</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="non-binary">Non-binary</option>
                  <option value="prefer_not_to_say">Prefer not to say</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label
                  className="block text-xs font-semibold mb-1"
                  style={{ color: COLOR_ACCENT_DARK }}
                >
                  Weight (kg)
                </label>
                <input
                  type="number"
                  min={0}
                  value={weightKg}
                  onChange={(e) => setWeightKg(e.target.value)}
                  className="w-full rounded-md border px-3 py-2 text-sm text-black"
                  placeholder="e.g. 70"
                />
              </div>

              <div>
                <label
                  className="block text-xs font-semibold mb-1"
                  style={{ color: COLOR_ACCENT_DARK }}
                >
                  Height (cm)
                </label>
                <input
                  type="number"
                  min={0}
                  value={heightCm}
                  onChange={(e) => setHeightCm(e.target.value)}
                  className="w-full rounded-md border px-3 py-2 text-sm text-black"
                  placeholder="e.g. 175"
                />
              </div>

              <div>
                <label
                  className="block text-xs font-semibold mb-1"
                  style={{ color: COLOR_ACCENT_DARK }}
                >
                  Activity level
                </label>
                <select
                  value={activityLevel}
                  onChange={(e) => setActivityLevel(e.target.value)}
                  className="w-full rounded-md border px-3 py-2 text-sm text-black"
                >
                  <option value="">Select...</option>
                  <option value="sedentary">Sedentary</option>
                  <option value="Lightly Active">Lightly active</option>
                  <option value="Moderately Active">Moderately active</option>
                  <option value="Very Active">Very active</option>
                  <option value="Athlete">Athlete / intense</option>
                </select>
              </div>

              <div>
                <label
                  className="block text-xs font-semibold mb-1"
                  style={{ color: COLOR_ACCENT_DARK }}
                >
                  Dietary preference
                </label>
                <input
                  type="text"
                  value={dietaryPreference}
                  onChange={(e) => setDietaryPreference(e.target.value)}
                  className="w-full rounded-md border px-3 py-2 text-sm text-black"
                  placeholder="e.g. vegan, vegetarian, no beef"
                />
              </div>
            </div>

            <div>
              <label
                className="block text-xs font-semibold mb-1"
                style={{ color: COLOR_ACCENT_DARK }}
              >
                Allergies (optional)
              </label>
              <input
                type="text"
                value={allergiesInput}
                onChange={(e) => setAllergiesInput(e.target.value)}
                className="w-full rounded-md border px-3 py-2 text-sm text-black"
                placeholder="e.g. peanuts, shellfish, lactose"
              />
              <p className="mt-1 text-[10px] text-gray-500">
                Separate multiple allergies with commas.
              </p>
            </div>

            <div className="mt-8 text-center">
              <button
                onClick={handleNext}
                disabled={!isStepComplete || isTransitioning}
                className={`inline-flex items-center px-6 py-3 rounded-md text-sm font-bold tracking-wide uppercase transition-colors duration-300 ${
                  isStepComplete && !isTransitioning
                    ? "bg-[#4CAF50] text-white hover:bg-[#388E3C] shadow-md"
                    : "bg-gray-200 text-gray-400 cursor-not-allowed"
                }`}
              >
                NEXT
                <ArrowRight className="w-4 h-4 ml-2" />
              </button>
            </div>
          </div>
        ) : type === "telegram" ? (
          <div className="space-y-6">
            <p className="text-sm" style={{ color: COLOR_ACCENT_DARK }}>
              Connect your Telegram account to receive gentle nudges, meal
              reminders, and progress check-ins right where you chat. This step
              is optional — you can always set it up later.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mt-6">
              <button
                type="button"
                onClick={handleSkipTelegram}
                className="px-6 py-3 rounded-md text-sm font-semibold border border-gray-300 bg-white text-gray-700 hover:bg-gray-100 transition-colors"
              >
                Skip for now
              </button>

              <button
                type="button"
                onClick={handleConnectTelegram}
                className="inline-flex items-center justify-center px-6 py-3 rounded-md text-sm font-bold tracking-wide uppercase bg-[#4CAF50] text-white hover:bg-[#388E3C] shadow-md transition-colors"
              >
                <MessageCircle className="w-4 h-4 mr-2" />
                Connect Telegram
              </button>
            </div>
          </div>
        ) : (
          <>
            {isMultiSelect && (
              <p className="text-xs mb-6" style={{ color: COLOR_ACCENT_DARK }}>
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
                    onClick={() => handler && handler(option.value)}
                    style={{
                      borderColor: isSelected ? COLOR_PRIMARY : "#E5E7EB",
                      backgroundColor: isSelected ? "#F1FFF1" : "white",
                    }}
                    className="w-40 h-40 p-4 flex flex-col items-center justify-center rounded-xl border-4 transition-all shadow-md hover:shadow-lg"
                  >
                    <IconComponent
                      className="w-12 h-12 mb-3"
                      style={{
                        color: isSelected ? COLOR_PRIMARY : COLOR_ACCENT_DARK,
                      }}
                    />
                    <span
                      className="text-sm font-semibold text-center"
                      style={{ color: COLOR_ACCENT_DARK }}
                    >
                      {option.label}
                    </span>
                  </button>
                );
              })}
            </div>

            {question !== 5 && (
              <div className="mt-12 text-center">
                <button
                  onClick={handleNext}
                  disabled={!isStepComplete || isTransitioning}
                  className={`inline-flex items-center px-6 py-3 rounded-md text-sm font-bold tracking-wide uppercase transition-colors duration-300 ${
                    isStepComplete && !isTransitioning
                      ? "bg-[#4CAF50] text-white hover:bg-[#388E3C] shadow-md"
                      : "bg-gray-200 text-gray-400 cursor-not-allowed"
                  }`}
                >
                  {continueText}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    );
  };

  const getStepProgress = () => `Question ${question} of 5`;

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
            className={`flex items-center text-sm transition-colors duration-100 ${
              !isTransitioning ? "hover:text-current" : ""
            }`}
            onMouseEnter={(e) => {
              if (!isTransitioning) e.currentTarget.style.color = COLOR_PRIMARY_HOVER;
            }}
            onMouseLeave={(e) => {
              if (!isTransitioning) e.currentTarget.style.color = COLOR_PRIMARY;
            }}
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back
          </button>

          <span className="text-sm" style={{ color: COLOR_ACCENT_DARK }}>
            {getStepProgress()}
          </span>
        </div>

        <div className="relative">{renderStepContent()}</div>
      </div>
    </main>
  );
}

export default function GetToKnowYouPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen flex items-center justify-center bg-[#F8F8F8] px-4">
        <div className="w-full max-w-2xl rounded-3xl shadow-2xl p-10 overflow-hidden bg-[#C8E6C9]">
          <div className="flex items-center justify-center">
            <p className="text-lg animate-pulse" style={{ color: "#34495E" }}>Loading...</p>
          </div>
        </div>
      </main>
    }>
      <GetToKnowYouPageContent />
    </Suspense>
  );
}
