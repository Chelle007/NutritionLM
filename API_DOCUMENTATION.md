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
  - [Google Fit APIs](#google-fit-apis)
  - [Ingredients API](#ingredients-api)
  - [Nutrition Goals API](#nutrition-goals-api)
  - [Nutritionist API](#nutritionist-api)
  - [Optimal Nutrition API](#optimal-nutrition-api)
  - [Report Recommendation API](#report-recommendation-api)
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

Handles chat interactions with the AI nutritionist.

**Authentication:** Required

**Request Body:**
```json
{
  "message": "What should I eat for breakfast?"
}
```

**Response:**
```json
{
  "response": "AI-generated response..."
}
```

---

### Google Fit APIs

#### Google Fit Auth

**Endpoint:** `GET /api/google-fit/auth`

Initiates Google Fit OAuth authentication.

**Authentication:** Required

#### Google Fit Callback

**Endpoint:** `GET /api/google-fit/callback`

Handles Google Fit OAuth callback.

**Authentication:** Required

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

Compares weekly average nutrition intake with nutrition goals and returns AI-generated recommendations from Gemini.

**Authentication:** Required

**Response:**
```json
{
  "recommendation": "Based on your weekly nutrition intake, I notice that you're doing well with protein and fiber, but you could benefit from increasing your vitamin intake. Here are some specific recommendations..."
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

### Weekly Report API

**Endpoint:** `GET /api/weekly-report`

Returns a comprehensive weekly nutrition report including food logs, nutrition goals, and average intake for last week (Monday-Sunday).

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
  "last_week_nutrition_intake_avg": {
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
- `GEMINI_API_KEY` - Google Gemini API key (for AI features)

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

02 Dec 2025 09:15PM SGT

