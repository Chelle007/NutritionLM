<div align="center">
  <img src="./public/NutritionLM_logo.svg" alt="NutritionLM Logo" width="120" />
  
  # NutritionLM
  
  **Your AI-powered nutrition companion for smarter eating**
  
  Track, understand, and optimize your nutrition through intelligent conversations and personalized insights.
  
  [![Live App](https://img.shields.io/badge/Live-nutrition--lm.vercel.app-blue?style=flat-square)](https://nutrition-lm.vercel.app)
  [![Telegram Bot](https://img.shields.io/badge/Telegram-@nutritionlm__bot-26A5E4?style=flat-square&logo=telegram)](https://t.me/nutritionlm_bot)
  
</div>

---

## ✨ Features

### 🤖 AI Nutritionist Chat
Chat with an intelligent AI nutritionist powered by Google Gemini 2.0. Get personalized advice, verify nutrition claims with authoritative sources, and compare different perspectives side-by-side. Upload food images for instant ingredient detection and analysis, with answers informed by your own uploaded documents.

### 📸 Smart Food Logging
Snap a photo of your meal and let AI extract ingredients automatically. Get detailed nutrition breakdowns including macros, vitamins, minerals, and fiber. Each food receives a healthiness score (0-100) and is saved to your searchable food history.

### 📊 Analytics & Insights
Track your progress with comprehensive weekly reports, nutrition trend visualizations, and goal comparisons. Build logging streaks, unlock achievements, and see how your actual intake stacks up against your targets.

### � Peersonal Knowledge Base
Upload your dietary guidelines, meal plans, or nutrition research as PDFs, Word docs, or text files. The AI uses RAG (Retrieval-Augmented Generation) to search your documents and provide personalized, source-cited answers.

### 🔗 Seamless Integrations
- **Telegram Bot**: Get reminders and check-ins via [@nutritionlm_bot](https://t.me/nutritionlm_bot)
- **Google Fit**: Sync your activity and health data (optional)

### 👤 Personalized Experience
Complete an onboarding flow to set your nutrition goals, dietary preferences, and restrictions. Manage your profile and customize daily targets for protein, carbs, fats, and more.

---

## 🛠️ Tech Stack

| Category | Technology |
|----------|-----------|
| **Framework** | Next.js 16 (App Router) |
| **Frontend** | React 19 |
| **AI** | Google Gemini 2.0 Flash/Pro |
| **Database** | Supabase (PostgreSQL) |
| **Auth** | Supabase Auth (Google OAuth) |
| **Styling** | Tailwind CSS 4 |
| **Icons** | Lucide React |
| **Document Processing** | mammoth, pdf-parse |
| **Markdown** | react-markdown |

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm
- [Supabase](https://supabase.com) project with Google OAuth configured
- [Google Gemini API](https://ai.google.dev) key
- Google OAuth credentials (optional, for Google Fit)

### Installation

1. Clone the repository
   ```bash
   git clone <repository-url>
   cd nutritionlm
   ```

2. Install dependencies
   ```bash
   npm install
   ```

3. Set up environment variables
   
   Create `.env.local` in the project root:
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

4. Set up the database
   
   Run `db/schema.sql` in your Supabase SQL editor to create all required tables.

5. Start the development server
   ```bash
   npm run dev
   ```
   
   Open [http://localhost:3000](http://localhost:3000) in your browser.

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

## Telegram bot Project Structure

```
NutritionLM_bot/
│
├── main.py               # Telegram bot main entry point
│                        # - Handles webhook
│                        # - Receives photos
│                        # - Uploads images to Supabase
│                        # - Calls Nutrition & Ingredients APIs
│                        # - Inserts food log records
│
├── render.yaml          # Render deployment configuration
│                        # - Web service setup
│                        # - Auto deploy triggers
│                        # - Environment variables
│
├── requirements.txt     # Python package dependencies
│                        # - telegram bot
│                        # - supabase-py
│                        # - requests, zoneinfo, etc.
│
└── runtime.txt          # Python runtime version for Render
                         # e.g., python-3.10

```
---

## 🌐 Deployment

### Web App
Deployed on [Vercel](https://vercel.com) with automatic deployments from the `main` branch.

**Production**: [nutrition-lm.vercel.app](https://nutrition-lm.vercel.app)

Configure environment variables in your Vercel project settings.

### Telegram Bot
Deployed separately on [Render](https://render.com).

- **Repository**: [NutritionLM_bot](https://github.com/Chloelee05/NutritionLM_bot)
- **Endpoint**: [nutritionlm-bot.onrender.com](https://nutritionlm-bot.onrender.com/)

---

## 📚 Documentation

For detailed API reference, see [API_DOCUMENTATION.md](./API_DOCUMENTATION.md)

---

## 🤝 Contributing

Contributions are welcome! Feel free to open issues or submit pull requests.

---

<div align="center">
  
Made with ❤️ by Cool Beans

</div>
