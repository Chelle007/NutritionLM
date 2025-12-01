## NutritionLM

NutritionLM is a Next.js app that helps users track and understand their nutrition, with a conversational interface powered by a Telegram bot and Supabase-backed authentication and user preferences.

- **Live app**: https://nutrition-lm.vercel.app
- **Telegram bot**: https://t.me/nutritionlm_bot
- **Bot backend repo**: https://github.com/Chloelee05/NutritionLM_bot
- **Bot deployment (Render)**: https://nutritionlm-bot.onrender.com/

---

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: React 19 (JS/TS-ready)
- **Auth & Database**: Supabase (`app/utils/supabase`)
- **Styling**: Tailwind CSS 4 (via PostCSS)
- **Icons**: `lucide-react`

---

## Getting Started (Local Development)

1. **Install dependencies**

```bash
npm install
```

2. **Set up environment variables**

Create a `.env.local` file at the project root and configure your Supabase keys and any other required secrets, e.g.:

```bash
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
```

3. **Run the development server**

```bash
npm run dev
```

Then open `http://localhost:3000` in your browser.

---

## Project Structure (Web)

- **`app/page.js`**: Landing/entry page of the NutritionLM web app.
- **`app/login/page.js`**: Login screen and Supabase auth flow.
- **`app/onboarding/get-to-know-you/page.js`**: Onboarding questions to understand the user’s nutrition profile.
- **`app/onboarding/connect-tele/page.js`**: Flow to connect the Telegram bot with the user’s account.
- **`app/utils/supabase`**: Supabase client setup for server and client usage.
- **`services/`**: Higher-level service helpers for auth, user data, and user preferences.

---

## Deployment

The web app is deployed on Vercel:

- **Production URL**: `https://nutrition-lm.vercel.app`

Pushes to the `main` branch (or your configured production branch) will trigger a new deployment on Vercel.

The Telegram bot backend is deployed separately on Render and communicates with Telegram and any shared persistence layer as defined in its own repository.

---

## Related Projects

- **NutritionLM Telegram Bot** (backend & bot logic): `https://github.com/Chloelee05/NutritionLM_bot`

