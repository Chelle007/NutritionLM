# NutritionLM API & Services Documentation

This document provides comprehensive documentation for all services and API endpoints in the NutritionLM application.

---

## Table of Contents

- [Services](#services)
  - [Authentication Service](#authentication-service)
  - [User Service](#user-service)
  - [User Preference Service](#user-preference-service)
  - [Food Log Service](#food-log-service)
  - [Supabase Client Service](#supabase-client-service)
- [API Endpoints](#api-endpoints)
  - [Analytics API](#analytics-api)
  - [Chat API](#chat-api)
  - [Food Log API](#food-log-api)
  - [Google Fit APIs](#google-fit-apis)
  - [Ingredients API](#ingredients-api)
  - [Nutrition Goals API](#nutrition-goals-api)
  - [Nutritionist API](#nutritionist-api)
  - [Optimal Nutrition API](#optimal-nutrition-api)
  - [Report Recommendation API](#report-recommendation-api)
  - [Sources API](#sources-api)
  - [Weekly Report API](#weekly-report-api)

---

## Services

### Authentication Service

**File:** `services/auth.js`

#### `getAuthenticatedUser()`

Checks if the user is authenticated and returns the current user object.

**Usage:**
```javascript
import getAuthenticatedUser from './services/auth'

const user = await getAuthenticatedUser();
```

**Returns:**
- `Object` - User object from Supabase Auth
- Throws `Error` if user is not authenticated

**Example:**
```javascript
try {
  const user = await getAuthenticatedUser();
  console.log('User ID:', user.id);
} catch (error) {
  console.error('User not authenticated');
}
```

---

### User Service

**File:** `services/user.js`

#### `ensureUserExists(userId)`

Ensures a user record exists in the `users` table. Creates one if it doesn't exist, populating it with data from auth metadata.

**Parameters:**
- `userId` (string) - The user's UUID

**Returns:**
- `Promise<void>` - Resolves when user is ensured to exist
- Throws `Error` if there's an issue creating the user

**Example:**
```javascript
import { ensureUserExists } from './services/user'

await ensureUserExists(user.id);
```

#### `getUserProfile()`

Gets the current user's profile from the `users` table.

**Returns:**
- `Promise<Object|null>` - User profile object or null on error

**Example:**
```javascript
import { getUserProfile } from './services/user'

const profile = await getUserProfile();
console.log(profile.full_name, profile.avatar_url);
```

---

### User Preference Service

**File:** `services/userPreference.js`

#### `insertUserPreference(userPref)`

Inserts or creates user preferences in the `user_preferences` table.

**Parameters:**
- `userPref` (Object) - User preference object with the following optional fields:
  - `birth_date` (string) - Date in 'YYYY-MM-DD' format
  - `gender` (string) - User's gender
  - `weight_kg` (number) - Weight in kilograms
  - `height_cm` (number) - Height in centimeters
  - `goal` (string) - Health goal (e.g., 'weight_loss', 'muscle_gain')
  - `activity_level` (string) - Activity level
  - `dietary_preference` (string) - Dietary preference (e.g., 'vegan', 'vegetarian')
  - `allergies` (Array<string>) - Array of allergies
  - `habits` (Array<string>) - Array of habits

**Returns:**
- `Promise<Array|null>` - Inserted preference data or null on error

**Example:**
```javascript
import { insertUserPreference } from './services/userPreference'

const userPref = {
  birth_date: '1990-01-01',
  gender: 'male',
  weight_kg: 70,
  height_cm: 180,
  goal: 'weight_loss',
  activity_level: 'moderate',
  dietary_preference: 'vegan',
  allergies: ['gluten', 'lactose'],
  habits: ['late_snacking', 'sugary_drinks']
};

const result = await insertUserPreference(userPref);
```

#### `getUserPreference()`

Gets the current user's preferences from the `user_preferences` table.

**Returns:**
- `Promise<Array|null>` - Array of user preferences or null on error

**Example:**
```javascript
import { getUserPreference } from './services/userPreference'

const preferences = await getUserPreference();
```

#### `insertNutritionGoals(nutritionGoals, supabase, user)`

Inserts or updates nutrition goals for the user. Can be used both client-side and server-side.

**Parameters:**
- `nutritionGoals` (Object) - Nutrition goals object with values 0-100:
  ```javascript
  {
    protein: 50,
    carbohydrates: 90,
    fats: 84,
    vitamins: 95,
    minerals: 99,
    fiber: 80
  }
  ```
- `supabase` (Object, optional) - Supabase client instance (for server-side use)
- `user` (Object, optional) - User object (for server-side use)

**Returns:**
- `Promise<Array|null>` - Updated/inserted nutrition goals or null on error

**Example:**
```javascript
import { insertNutritionGoals } from './services/userPreference'

const goals = {
  protein: 50,
  carbohydrates: 90,
  fats: 84,
  vitamins: 95,
  minerals: 99,
  fiber: 80
};

const result = await insertNutritionGoals(goals);
```

#### `getUserPreferenceServer(supabase, user)`

Server-side function to get user preferences. Requires Supabase client and user object.

**Parameters:**
- `supabase` (Object) - Supabase client instance
- `user` (Object) - User object with `id` property

**Returns:**
- `Promise<Array|null>` - Array of user preferences or null on error

**Example:**
```javascript
import { getUserPreferenceServer } from './services/userPreference'
import { createClient } from '../app/utils/supabase/server'

const supabase = await createClient();
const { data: { user } } = await supabase.auth.getUser();
const preferences = await getUserPreferenceServer(supabase, user);
```

---

### Food Log Service

**File:** `services/foodLog.js`

#### `getLastWeekDateRange()`

Calculates the date range for last week (Monday to Sunday).

**Returns:**
- `Object` - Date range object:
  ```javascript
  {
    startDate: "2025-01-20",  // YYYY-MM-DD format
    endDate: "2025-01-26",     // YYYY-MM-DD format
    startDateFull: "2025-01-20T00:00:00.000Z",
    endDateFull: "2025-01-26T23:59:59.999Z"
  }
  ```

**Example:**
```javascript
import { getLastWeekDateRange } from './services/foodLog'

const dateRange = getLastWeekDateRange();
console.log(`Last week: ${dateRange.startDate} to ${dateRange.endDate}`);
```

#### `getLastWeekFoodLogs(supabase, user)`

Gets all food logs for the last week (Monday-Sunday) for a specific user.

**Parameters:**
- `supabase` (Object) - Supabase client instance
- `user` (Object) - User object with `id` property

**Returns:**
- `Promise<Array|null>` - Array of food log objects or null on error

**Example:**
```javascript
import { getLastWeekFoodLogs } from './services/foodLog'
import { createClient } from '../app/utils/supabase/server'

const supabase = await createClient();
const { data: { user } } = await supabase.auth.getUser();
const foodLogs = await getLastWeekFoodLogs(supabase, user);
```

#### `getLast7DaysDateRange()`

Calculates the date range for the last 7 days (rolling 7-day period from today).

**Returns:**
- `Object` - Date range object:
  ```javascript
  {
    startDate: "2025-01-20",  // YYYY-MM-DD format (7 days ago)
    endDate: "2025-01-27",     // YYYY-MM-DD format (today)
    startDateFull: "2025-01-20T00:00:00.000Z",
    endDateFull: "2025-01-27T23:59:59.999Z"
  }
  ```

**Example:**
```javascript
import { getLast7DaysDateRange } from './services/foodLog'

const dateRange = getLast7DaysDateRange();
console.log(`Last 7 days: ${dateRange.startDate} to ${dateRange.endDate}`);
```

#### `getLast7DaysFoodLogs(supabase, user)`

Gets all food logs for the last 7 days (rolling 7-day period from today) for a specific user.

**Parameters:**
- `supabase` (Object) - Supabase client instance
- `user` (Object) - User object with `id` property

**Returns:**
- `Promise<Array|null>` - Array of food log objects or null on error

**Example:**
```javascript
import { getLast7DaysFoodLogs } from './services/foodLog'
import { createClient } from '../app/utils/supabase/server'

const supabase = await createClient();
const { data: { user } } = await supabase.auth.getUser();
const foodLogs = await getLast7DaysFoodLogs(supabase, user);
```

---

### Supabase Client Service

**File:** `services/supabaseClient.js`

#### `getSupabaseClient()`

Creates a new Supabase browser client instance. Handles authentication cookies for Next.js.

**Returns:**
- `Object` - Supabase client instance

**Example:**
```javascript
import getSupabaseClient from './services/supabaseClient'

const supabase = getSupabaseClient();
```

---

## API Endpoints

### Analytics API

**Endpoint:** `GET /api/analytics`

Returns analytics data including food log streaks, achievements, and graph data for the last 30 days.

**Authentication:** Required

**Response:**
```json
{
  "graphData": [
    {
      "date": "2025-01-20",
      "count": 3,
      "healthy": true
    }
  ],
  "foodLogStreak": 7,
  "healthyFoodStreak": 5,
  "totalLogs": 45,
  "mostRecentHealthLevel": 85,
  "achievements": [
    {
      "id": "first_log",
      "name": "First Steps",
      "description": "Logged your first meal",
      "icon": "🎯",
      "unlocked": true
    }
  ]
}
```

---

### Chat API

**Endpoint:** `POST /api/chat`

Handles chat interactions with the AI nutritionist. Supports multiple modes including regular chat, fact-checking, and comparison. Uses RAG (Retrieval-Augmented Generation) to access user-uploaded sources.

**Authentication:** Required

**Request Body:**
```json
{
  "message": "What should I eat for breakfast?",
  "image": {
    "data": "base64_encoded_image_data",
    "mimeType": "image/jpeg"
  },
  "factCheck": false,
  "compare": false,
  "chatSessionId": "optional_session_id"
}
```

**Parameters:**
- `message` (string, optional) - The user's message/question
- `image` (object, optional) - Image object with `data` (base64) and `mimeType` fields
- `factCheck` (boolean, optional) - If true, enables fact-checking mode with web search
- `compare` (boolean, optional) - If true, enables comparison mode with structured JSON response
- `chatSessionId` (string, optional) - Existing chat session ID. If not provided, a new session is created

**Response (Regular Chat):**
```json
{
  "reply": "AI-generated response...",
  "citations": [],
  "chatSessionId": "session_id",
  "isComparison": false
}
```

**Response (Fact Check Mode):**
```json
{
  "reply": "Fact-checked response with citations [1], [2], [3]...",
  "citations": [
    {
      "title": "Source Title",
      "uri": "https://example.com/source",
      "snippet": "Relevant snippet from source"
    }
  ],
  "chatSessionId": "session_id",
  "isComparison": false
}
```

**Response (Compare Mode):**
```json
{
  "reply": "Summary of comparison",
  "citations": [
    {
      "title": "Source Title",
      "uri": "https://example.com/source",
      "snippet": "Relevant snippet"
    }
  ],
  "chatSessionId": "session_id",
  "isComparison": true,
  "comparisonData": {
    "sideA": {
      "title": "Perspective A Title",
      "points": ["Point 1 [1]", "Point 2 [2]"]
    },
    "sideB": {
      "title": "Perspective B Title",
      "points": ["Point 3 [3]", "Point 4 [4]"]
    },
    "summary": "Balanced conclusion [5]",
    "sources": [
      {
        "title": "Source Title",
        "uri": "https://example.com/source"
      }
    ]
  }
}
```

**Features:**
- Maintains chat history per session (last 50 messages)
- Automatically searches user-uploaded sources for relevant information
- Supports image analysis
- Fact-checking mode uses Google Search with authoritative sources
- Comparison mode returns structured JSON with two perspectives
- Auto-generates chat session titles from first message

---

### Food Log API

**Endpoint:** `POST /api/food-log`

Uploads a food image, extracts food name and ingredients using AI, analyzes nutrition, and saves the food log to the database.

**Authentication:** Required

**Request:**
- Method: `POST`
- Content-Type: `multipart/form-data`
- Body: FormData with `image` field (File)

**Response:**
```json
{
  "success": true,
  "foodLog": {
    "id": 1,
    "user_id": "uuid",
    "image_url": "https://supabase.co/storage/...",
    "food_name": "Chicken Burger",
    "ingredients": ["Chicken", "Burger Bun", "Lettuce", "Tomato"],
    "nutrition": {
      "protein": 25,
      "carbohydrates": 45,
      "fats": 15,
      "vitamins": 0.1,
      "minerals": 0.5,
      "fiber": 8
    },
    "record_date": "2025-01-27",
    "record_time": "12:00:00",
    "created_at": "2025-01-27T12:00:00Z"
  },
  "foodName": "Chicken Burger",
  "ingredients": ["Chicken", "Burger Bun", "Lettuce", "Tomato"],
  "nutrition": {
    "protein": 25,
    "carbohydrates": 45,
    "fats": 15,
    "vitamins": 0.1,
    "minerals": 0.5,
    "fiber": 8
  }
}
```

**Error Responses:**
```json
{
  "error": "No image provided"
}
```

```json
{
  "error": "GEMINI_API_KEY is not set on the server"
}
```

```json
{
  "error": "Failed to save food log to database"
}
```

**Note:** 
- The image is uploaded to Supabase Storage in the `food-images` bucket
- Food name and ingredients are extracted using Gemini 2.5 Flash
- Nutrition values are estimated using Gemini 2.0 Flash
- The food log is automatically saved with the current date and time

---

### Google Fit APIs

#### Google Fit Auth

**Endpoint:** `GET /api/google-fit/auth`

Initiates Google Fit OAuth authentication flow. Redirects user to Google OAuth consent screen.

**Authentication:** Required

**Response:** Redirects to Google OAuth URL with the following scopes:
- `https://www.googleapis.com/auth/fitness.activity.read`
- `https://www.googleapis.com/auth/fitness.body.read`
- `https://www.googleapis.com/auth/fitness.nutrition.read`

**Error Response:**
```json
{
  "error": "Google Fit client ID not configured",
  "hint": "Set GOOGLE_FIT_CLIENT_ID or GOOGLE_CLIENT_ID in your environment variables"
}
```

**Note:** 
- Uses state parameter to prevent CSRF attacks
- If user logged in with Google, uses their email as login hint
- Redirect URI defaults to `${origin}/api/google-fit/callback` or uses `GOOGLE_FIT_REDIRECT_URI` env variable

#### Google Fit Callback

**Endpoint:** `GET /api/google-fit/callback`

Handles Google Fit OAuth callback. Exchanges authorization code for access/refresh tokens and stores them in the database.

**Authentication:** Required (via OAuth flow)

**Query Parameters:**
- `code` (string) - OAuth authorization code
- `state` (string) - Base64-encoded state containing userId
- `error` (string, optional) - OAuth error if authentication failed

**Response:** Redirects to home page with query parameters:
- Success: `?google_fit_connected=true`
- Error: `?error=error_type&details=...`

**Error Types:**
- `google_fit_auth_failed` - OAuth error from Google
- `missing_oauth_params` - Missing code or state
- `invalid_state` - Invalid state parameter
- `google_fit_not_configured` - Missing client ID or secret
- `token_exchange_failed` - Failed to exchange code for tokens
- `no_access_token` - No access token in response
- `supabase_not_configured` - Missing Supabase credentials
- `missing_database_columns` - Database schema issue
- `database_error` - Database operation failed

**Note:**
- Stores `google_fit_access_token`, `google_fit_refresh_token`, `google_fit_token_expires_at`, and `google_fit_verified` in the `users` table
- Requires `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, and `GOOGLE_FIT_REDIRECT_URI` environment variables

---

### Ingredients API

**Endpoint:** `POST /api/ingredients`

Extracts food name and ingredients with their weights from an uploaded image using Gemini AI. Automatically detects if the image contains food.

**Authentication:** Not required

**Request:**
- Method: `POST`
- Content-Type: `multipart/form-data`
- Body: FormData with `image` field (File)

**Response (Food detected):**
```json
{
  "food_name": "Katsu Curry",
  "ingredients": [
    {
      "name": "Katsu (fried breaded cutlet)",
      "grams": 150
    },
    {
      "name": "Curry sauce",
      "grams": 100
    },
    {
      "name": "White rice",
      "grams": 200
    },
    {
      "name": "Potatoes",
      "grams": 80
    },
    {
      "name": "Carrots",
      "grams": 50
    },
    {
      "name": "Pickled vegetables",
      "grams": 30
    }
  ]
}
```

**Response (Not food):**
```json
{
  "food_name": "not a food",
  "ingredients": null
}
```

**Error Response:**
```json
{
  "error": "No image provided. Please send an image file."
}
```

**Note:** Each ingredient includes its estimated weight in grams. If the image does not contain food, `food_name` will be "not a food" and `ingredients` will be `null`.

---

### Nutrition Goals API

**Endpoint:** `POST /api/nutrition-goals`

Saves or updates nutrition goals for the authenticated user.

**Authentication:** Required

**Request Body:**
```json
{
  "nutrition_goals": {
    "protein": 120,
    "carbohydrates": 250,
    "fats": 75,
    "vitamins": 0.5,
    "minerals": 2.5,
    "fiber": 30
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "user_id": "uuid",
      "nutrition_goals": {
        "protein": 120,
        "carbohydrates": 250,
        "fats": 75,
        "vitamins": 0.5,
        "minerals": 2.5,
        "fiber": 30
      },
      "updated_at": "2025-01-27T10:00:00Z"
    }
  ]
}
```

**Note:** Nutrition goals are specified in grams per day. Typical ranges:
- Protein: 50-150g per day
- Carbohydrates: 200-300g per day
- Fats: 50-100g per day
- Vitamins: typically in mg, but provided in grams for consistency
- Minerals: typically in mg, but provided in grams for consistency
- Fiber: 25-35g per day

**Error Response:**
```json
{
  "error": "nutrition_goals (object) is required in request body"
}
```

---

### Nutritionist API

**Endpoint:** `POST /api/nutritionist`

Analyzes food name and ingredients to estimate nutrition values in grams and healthiness level using Gemini AI.

**Authentication:** Not required

**Request Body:**
```json
{
  "food_name": "Chicken Burger",
  "ingredients": ["Chicken", "Burger Bun", "Lettuce", "Tomato"]
}
```

**Response:**
```json
{
  "nutritions": {
    "protein": 25,
    "carbohydrates": 45,
    "fats": 15,
    "vitamins": 0.1,
    "minerals": 0.5,
    "fiber": 8,
    "healthy_level": 75
  }
}
```

**Note:** 
- Nutrition values are in grams for a single serving
- `healthy_level` is on a scale of 0-100 (where 100 is the healthiest)

---

### Optimal Nutrition API

**Endpoint:** `POST /api/optimal-nutrition`

Generates optimal nutrition goals based on user preferences using Gemini AI and saves them.

**Authentication:** Required

**Request Body:** None (uses user preferences from database)

**Response:**
```json
{
  "nutritionGoals": [
    {
      "id": 1,
      "user_id": "uuid",
      "nutrition_goals": {
        "protein": 120,
        "carbohydrates": 250,
        "fats": 75,
        "vitamins": 0.5,
        "minerals": 2.5,
        "fiber": 30
      }
    }
  ]
}
```

**Note:** Nutrition goals are generated in grams per day based on user preferences.

**Error Response:**
```json
{
  "error": "User not authenticated"
}
```

---

### Report Recommendation API

**Endpoint:** `GET /api/report-recommendation`

Compares last 7 days average nutrition intake with nutrition goals and returns AI-generated recommendations from Gemini.

**Authentication:** Required

**Response:**
```json
{
  "recommendation": "Based on your last 7 days nutrition intake, I notice that you're doing well with protein and fiber, but you could benefit from increasing your vitamin intake. Here are some specific recommendations..."
}
```

**Error Response:**
```json
{
  "error": "Nutrition goals not found. Please set your nutrition goals first."
}
```

**Note:** The recommendation is plain text generated by Gemini AI based on the comparison between actual intake (in grams) and goals (in grams).

---

### Sources API

**Endpoint:** `GET /api/sources`, `POST /api/sources`, `DELETE /api/sources`

Manages user-uploaded sources (documents) for RAG (Retrieval-Augmented Generation) in chat.

**Authentication:** Required

#### GET /api/sources

Lists all sources for the authenticated user.

**Response:**
```json
{
  "sources": [
    {
      "id": 1,
      "title": "My Dietary Restrictions",
      "file_name": "restrictions.pdf",
      "file_type": "PDF",
      "file_url": "https://supabase.co/storage/...",
      "file_size": 102400,
      "created_at": "2025-01-27T10:00:00Z"
    }
  ]
}
```

#### POST /api/sources

Uploads a new source document. Extracts text, chunks it, and generates embeddings for RAG.

**Request:**
- Method: `POST`
- Content-Type: `multipart/form-data`
- Body: FormData with:
  - `file` (File, required) - Document file
  - `title` (string, optional) - Custom title (defaults to filename)

**Supported File Types:**
- PDF (`.pdf`)
- Word Documents (`.docx`, `.doc`)
- Text Files (`.txt`, `.text`)

**File Size Limit:** 10MB

**Response:**
```json
{
  "source": {
    "id": 1,
    "user_id": "uuid",
    "title": "My Dietary Restrictions",
    "file_name": "restrictions.pdf",
    "file_type": "PDF",
    "file_url": "https://supabase.co/storage/...",
    "file_size": 102400,
    "created_at": "2025-01-27T10:00:00Z"
  },
  "message": "Source uploaded successfully"
}
```

**Error Responses:**
```json
{
  "error": "No file provided"
}
```

```json
{
  "error": "File type not supported. Allowed types: PDF, DOCX, DOC, TXT, TEXT"
}
```

```json
{
  "error": "File size exceeds 10MB limit"
}
```

```json
{
  "error": "Storage bucket 'user-sources' not found. Please create it in Supabase Storage."
}
```

**Note:**
- Files are uploaded to Supabase Storage in the `user-sources` bucket
- Text is extracted, chunked, and embedded for semantic search
- Chunks are stored in the `source_chunks` table with embeddings
- Processing continues even if embedding generation fails (file is still saved)

#### DELETE /api/sources

Deletes a source and all its associated chunks.

**Query Parameters:**
- `id` (string, required) - Source ID to delete

**Response:**
```json
{
  "message": "Source deleted successfully"
}
```

**Error Responses:**
```json
{
  "error": "Source ID is required"
}
```

```json
{
  "error": "Source not found"
}
```

**Note:**
- Deletes the file from Supabase Storage
- Deletes all associated chunks from `source_chunks` table
- Only deletes sources owned by the authenticated user

---

### Weekly Report API

**Endpoint:** `GET /api/weekly-report`

Returns a comprehensive nutrition report including food logs, nutrition goals, and average intake for the last 7 days (rolling 7-day period from today).

**Authentication:** Required

**Response:**
```json
{
  "week": {
    "startDate": "2025-01-20",
    "endDate": "2025-01-26"
  },
  "foodLogs": [
    {
      "id": 1,
      "user_id": "uuid",
      "record_date": "2025-01-20",
      "record_time": "12:00:00",
      "food_name": "Chicken Salad",
      "food_description": "Fresh chicken salad with vegetables",
      "nutrition": {
        "protein": 25,
        "carbohydrates": 30,
        "fats": 12,
        "vitamins": 0.15,
        "minerals": 0.8,
        "fiber": 5
      },
      "healthy_level": 85,
      "created_at": "2025-01-20T12:00:00Z"
    }
  ],
  "nutritionGoals": {
    "protein": 120,
    "carbohydrates": 250,
    "fats": 75,
    "vitamins": 0.5,
    "minerals": 2.5,
    "fiber": 30
  },
  "last_7_days_nutrition_intake_avg": {
    "protein": 95.5,
    "carbohydrates": 220.2,
    "fats": 65.3,
    "vitamins": 0.42,
    "minerals": 2.1,
    "fiber": 28.4
  },
  "summary": {
    "totalLogs": 21,
    "daysWithLogs": 7
  }
}
```

**Error Response:**
```json
{
  "error": "User not authenticated"
}
```

---

## Common Error Responses

All APIs may return the following error responses:

### 401 Unauthorized
```json
{
  "error": "User not authenticated"
}
```

### 400 Bad Request
```json
{
  "error": "Invalid request parameters"
}
```

### 500 Internal Server Error
```json
{
  "error": "Failed to process request"
}
```

---

## Environment Variables

The following environment variables are required:

- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` - Supabase anon/public key
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key (for server-side operations)
- `GEMINI_API_KEY` - Google Gemini API key (for AI features)

**Optional (for Google Fit integration):**
- `GOOGLE_CLIENT_ID` - Google OAuth client ID
- `GOOGLE_CLIENT_SECRET` - Google OAuth client secret
- `GOOGLE_FIT_REDIRECT_URI` - Google Fit OAuth redirect URI (defaults to `${origin}/api/google-fit/callback`)

---

## Notes

- All dates are in ISO 8601 format (YYYY-MM-DD)
- Nutrition values are in grams (not percentages)
- `healthy_level` is on a scale of 0-100 (where 100 is the healthiest)
- Typical daily nutrition ranges:
  - Protein: 50-150g per day
  - Carbohydrates: 200-300g per day
  - Fats: 50-100g per day
  - Vitamins: typically measured in mg, but provided in grams for consistency
  - Minerals: typically measured in mg, but provided in grams for consistency
  - Fiber: 25-35g per day
- All authenticated endpoints require a valid Supabase session
- Server-side services require passing Supabase client and user objects
- Client-side services automatically handle authentication
- Ingredients API returns ingredients as objects with `name` and `grams` properties
- If an image does not contain food, Ingredients API returns `food_name: "not a food"` and `ingredients: null`

---

## Last Updated

27 Jan 2025

