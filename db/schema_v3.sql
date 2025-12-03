create table public.users (
  id uuid not null,
  full_name text null,
  avatar_url text null,
  telegram_chat_id text null,
  created_at timestamp with time zone null default now(),
  telegram_verified boolean not null default false,
  telegram_otp text null,
  google_fit_verified boolean null default false,
  google_fit_access_token text null,
  google_fit_refresh_token text null,
  google_fit_token_expires_at timestamp with time zone null,
  constraint users_pkey primary key (id),
  constraint users_id_fkey foreign KEY (id) references auth.users (id) on delete CASCADE
) TABLESPACE pg_default;

create table public.user_preferences (
  id bigint generated always as identity not null,
  user_id uuid null,
  birth_date date null,
  weight_kg numeric(5, 2) null,
  height_cm numeric(5, 2) null,
  goal text null,
  activity_level text null,
  dietary_preference text null,
  allergies text[] null,
  nutrition_goals jsonb null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  gender text null,
  habits text[] null default '{}'::text[],
  constraint user_preferences_pkey primary key (id),
  constraint user_preferences_user_id_fkey foreign KEY (user_id) references users (id) on delete CASCADE
) TABLESPACE pg_default;

create table public.progress_record (
  id bigint generated always as identity not null,
  user_id uuid null,
  record_date date not null default CURRENT_DATE,
  record_time time without time zone not null default CURRENT_TIME,
  weight_kg numeric(5, 2) null,
  height_cm numeric(5, 2) null,
  notes text null,
  created_at timestamp with time zone null default now(),
  constraint progress_record_pkey primary key (id),
  constraint progress_record_user_id_fkey foreign KEY (user_id) references users (id) on delete CASCADE
) TABLESPACE pg_default;

create table public.notification_settings (
  id bigint generated always as identity not null,
  user_id uuid null,
  enable_daily_reminder boolean null default false,
  reminder_time time without time zone null,
  created_at timestamp with time zone null default now(),
  constraint notification_settings_pkey primary key (id),
  constraint notification_settings_user_id_fkey foreign KEY (user_id) references users (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_notif_user on public.notification_settings using btree (user_id) TABLESPACE pg_default;

create table public.food_logs (
  id bigint generated always as identity not null,
  user_id uuid null,
  image_url text null,
  record_date date not null default CURRENT_DATE,
  record_time time without time zone not null default CURRENT_TIME,
  food_type text null,
  ingredients jsonb null,
  nutrition jsonb null,
  created_at timestamp with time zone null default now(),
  food_name text null,
  food_description text null,
  healthy_level numeric null,
  constraint food_logs_pkey primary key (id),
  constraint food_logs_user_id_fkey foreign KEY (user_id) references users (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_food_logs_user on public.food_logs using btree (user_id) TABLESPACE pg_default;

create table public.chat_messages (
  id bigint generated always as identity not null,
  user_id uuid not null,
  role text not null, -- 'user' or 'ai'
  message text not null,
  image_url text null, -- URL to image if message includes an image
  metadata jsonb null, -- Store additional data like citations, comparison data, etc.
  created_at timestamp with time zone not null default now(),
  constraint chat_messages_pkey primary key (id),
  constraint chat_messages_user_id_fkey foreign key (user_id) references users (id) on delete cascade
) TABLESPACE pg_default;

create index if not exists idx_chat_messages_user_created on public.chat_messages using btree (user_id, created_at desc) TABLESPACE pg_default;
