# NutritionLM

NutritionLM is an AI-powered nutrition assistant that helps users track, understand, and optimize their nutrition through a conversational interface. The platform combines personalized AI guidance with food logging, source-based learning, and integration with health tracking services.

- **Live app**: https://nutrition-lm.vercel.app
- **Telegram bot**: https://t.me/nutritionlm_bot
- **Bot backend repo**: https://github.com/Chloelee05/NutritionLM_bot
- **Bot deployment (Render)**: https://nutritionlm-bot.onrender.com/

---

## Features

### 🤖 AI-Powered Chat Assistant
- **Conversational Interface**: Chat with an AI nutritionist powered by Google Gemini
- **Chat Sessions**: Multiple conversation threads with automatic session management
- **Fact Checking**: Verify nutrition claims with web search and authoritative sources
- **Comparison Mode**: Compare different nutrition perspectives side-by-side
- **Image Analysis**: Upload food images for ingredient detection and nutrition analysis
- **RAG Integration**: Answers informed by user-uploaded documents (dietary guidelines, meal plans, etc.)

### 📸 Food Logging
- **Image Recognition**: Automatically extract ingredients from food photos
- **Nutrition Analysis**: Get detailed nutrition breakdowns (protein, carbs, fats, vitamins, minerals, fiber)
- **Health Scoring**: Receive healthiness ratings (0-100) for logged foods
- **Food History**: View and manage your food logs with filtering and search

### 📊 Analytics & Reports
- **Weekly Reports**: Comprehensive nutrition summaries with goal tracking
- **Streaks & Achievements**: Track logging consistency and unlock achievements
- **Analytics Dashboard**: Visualize nutrition trends over time
- **Goal Comparison**: Compare actual intake vs. nutrition goals

### 📄 Source Management
- **Document Upload**: Upload PDFs, Word docs, and text files as knowledge sources
- **RAG Search**: AI searches your documents to provide personalized answers
- **Source Citations**: See which sources inform each AI response

### 🔗 Integrations
- **Telegram Bot**: Connect via Telegram for reminders and check-ins
- **Google Fit**: Sync activity and health data (optional)

### 👤 User Profile
- **Onboarding Flow**: Personalized setup with goals, preferences, and dietary restrictions
- **Profile Management**: Update personal information and nutrition goals
- **Custom Goals**: Set daily nutrition targets (protein, carbs, fats, etc.)

---

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: React 19 (JavaScript/TypeScript)
- **AI**: Google Gemini 2.0 Flash/Pro
- **Auth & Database**: Supabase (PostgreSQL)
- **Styling**: Tailwind CSS 4 (via PostCSS)
- **Icons**: `lucide-react`
- **File Processing**: `mammoth` (Word docs), `pdf-parse` (PDFs)
- **Markdown Rendering**: `react-markdown`

---

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Supabase project (with Google OAuth provider configured)
- Google Gemini API key
- Google OAuth credentials (optional, for Google Fit integration)

### Installation

1. **Clone the repository**

```bash
git clone <repository-url>
cd nutritionlm
```

2. **Install dependencies**

```bash
npm install
```

3. **Set up environment variables**

Create a `.env.local` file at the project root:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Google Gemini
GEMINI_API_KEY=your_gemini_api_key

# Google Fit OAuth (optional)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_FIT_REDIRECT_URI=http://localhost:3000/api/google-fit/callback
```

4. **Set up the database**

Run the SQL schema file from the `db/` directory in your Supabase SQL editor:

- `db/schema.sql` - Complete database schema

5. **Run the development server**

```bash
npm run dev
```

Open `http://localhost:3000` in your browser.

---

## Project Structure

```
nutritionlm/
├── app/
│   ├── api/                    # API routes
│   │   ├── analytics/          # Analytics endpoints
│   │   ├── chat/               # AI chat endpoint
│   │   ├── food-log/           # Food logging
│   │   ├── google-fit/         # Google Fit OAuth
│   │   ├── ingredients/        # Image ingredient extraction
│   │   ├── nutrition-goals/    # Nutrition goal management
│   │   ├── nutritionist/       # Nutrition analysis
│   │   ├── optimal-nutrition/  # Goal generation
│   │   ├── sources/            # Document management
│   │   └── weekly-report/      # Weekly reports
│   ├── components/             # React components
│   │   ├── ChatMessage.js      # Chat message display
│   │   ├── FoodLogModal.js     # Food log details
│   │   ├── Header.js           # App header
│   │   ├── InputArea.js        # Chat input area
│   │   ├── ProfileModal.js     # User profile
│   │   ├── Sidebar.js          # Navigation sidebar
│   │   └── ThinkingIndicator.js
│   ├── login/                  # Login page
│   ├── onboarding/             # User onboarding flow
│   ├── profile/                # Profile page
│   ├── analytics/              # Analytics dashboard
│   ├── page.js                 # Main chat interface
│   └── utils/supabase/         # Supabase clients
├── services/                   # Service layer
│   ├── auth.js                 # Authentication helpers
│   ├── documentProcessor.js    # Document processing
│   ├── foodLog.js              # Food log utilities
│   ├── sourceSearch.js         # RAG search
│   └── userPreference.js       # User preferences
├── db/                         # Database schemas
└── public/                     # Static assets
```

---

## Deployment

### Web App (Vercel)

The web app is deployed on Vercel with automatic deployments from the `main` branch:

- **Production URL**: https://nutrition-lm.vercel.app

Environment variables must be configured in Vercel's project settings.

### Telegram Bot

The Telegram bot is deployed separately on Render:
- **Repository**: https://github.com/Chloelee05/NutritionLM_bot
- **Deployment**: https://nutritionlm-bot.onrender.com/

---

## Documentation

- [API Documentation](./API_DOCUMENTATION.md) - Complete API reference

---

## Credit

Made with ❤️ by Cool Beans
