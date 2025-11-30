-- version 1.0.0
-- USERS PROFILE TABLE
create table users (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  avatar_url text,
  telegram_chat_id text,
  created_at timestamp with time zone default now()
);

-- LOG PROGRESS
create table progress_record (
  id bigint generated always as identity primary key,
  user_id uuid references users(id) on delete cascade,
  record_date date not null default current_date,
  record_time time not null default current_time,
  weight_kg NUMERIC(5,2), -- up to 999.99
  height_cm NUMERIC(5,2),

  notes text,
  created_at timestamp with time zone default now()
);

-- QUIZ RESULTS
create table user_preferences (
  id bigint generated always as identity primary key,
  user_id uuid references users(id) on delete cascade,

  -- TODO: replace these with real quiz fields
  birthdate date,
  weight_kg NUMERIC(5,2), -- up to 999.99
  height_cm NUMERIC(5,2),
  goal text,
  activity_level text,
  dietary_preference text,
  allergies text[],
  
  nutrition_goals jsonb, -- will be suggested by AI based on user's data
  
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- FOOD LOGS
create table food_logs (
  id bigint generated always as identity primary key,
  user_id uuid references users(id) on delete cascade,
  image_url text,
  record_date date not null default current_date,
  record_time time not null default current_time,
  food_type text, -- snack, breakfast, lunch, dinner

  ingredients jsonb, -- structured data: [{"name": "egg", "grams": 50}]
  nutrition jsonb,   -- structured data: {"calories": 150, "protein": 12}

  created_at timestamp with time zone default now()
);

-- NOTIFICATION SETTINGS
create table notification_settings (
  id bigint generated always as identity primary key,
  user_id uuid references users(id) on delete cascade,
  enable_daily_reminder boolean default false,
  reminder_time time,
  created_at timestamp with time zone default now()
);

-- INDEXES
create index idx_food_logs_user on food_logs(user_id);
create index idx_notif_user on notification_settings(user_id);