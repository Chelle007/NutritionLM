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

Extracts food name and ingredients from an uploaded image using Gemini AI.

**Authentication:** Not required

**Request:**
- Method: `POST`
- Content-Type: `multipart/form-data`
- Body: FormData with `image` field (File)

**Response:**
```json
{
  "food_name": "Katsu Curry",
  "ingredients": [
    "Katsu (fried breaded cutlet)",
    "Curry sauce",
    "White rice",
    "Potatoes",
    "Carrots",
    "Pickled vegetables"
  ]
}
```

**Error Response:**
```json
{
  "error": "No image provided. Please send an image file."
}
```

---

### Nutrition Goals API

**Endpoint:** `POST /api/nutrition-goals`

Saves or updates nutrition goals for the authenticated user.

**Authentication:** Required

**Request Body:**
```json
{
  "nutrition_goals": {
    "protein": 50,
    "carbohydrates": 90,
    "fats": 84,
    "vitamins": 95,
    "minerals": 99,
    "fiber": 80
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
        "protein": 50,
        "carbohydrates": 90,
        "fats": 84,
        "vitamins": 95,
        "minerals": 99,
        "fiber": 80
      },
      "updated_at": "2025-01-27T10:00:00Z"
    }
  ]
}
```

**Error Response:**
```json
{
  "error": "nutrition_goals (object) is required in request body"
}
```

---

### Nutritionist API

**Endpoint:** `POST /api/nutritionist`

Analyzes food name and ingredients to estimate nutrition values using Gemini AI.

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
    "protein": 50,
    "carbohydrates": 90,
    "fats": 84,
    "vitamins": 95,
    "minerals": 99,
    "fiber": 80
  }
}
```

**Note:** Nutrition values are on a scale of 0-100 for a single serving.

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
        "protein": 50,
        "carbohydrates": 90,
        "fats": 84,
        "vitamins": 95,
        "minerals": 99,
        "fiber": 80
      }
    }
  ]
}
```

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

**Note:** The recommendation is plain text generated by Gemini AI based on the comparison between actual intake and goals.

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
        "protein": 45,
        "carbohydrates": 20,
        "fats": 15,
        "vitamins": 80,
        "minerals": 70,
        "fiber": 60
      },
      "healthy_level": 85,
      "created_at": "2025-01-20T12:00:00Z"
    }
  ],
  "nutritionGoals": {
    "protein": 50,
    "carbohydrates": 90,
    "fats": 84,
    "vitamins": 95,
    "minerals": 99,
    "fiber": 80
  },
  "last_week_nutrition_intake_avg": {
    "protein": 45.5,
    "carbohydrates": 85.2,
    "fats": 78.3,
    "vitamins": 88.7,
    "minerals": 92.1,
    "fiber": 75.4
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
- Nutrition values are on a scale of 0-100
- All authenticated endpoints require a valid Supabase session
- Server-side services require passing Supabase client and user objects
- Client-side services automatically handle authentication

---

## Last Updated

02 Dec 2025 09:15PM SGT

