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
  role text not null,
  message text not null,
  image_url text null,
  metadata jsonb null,
  created_at timestamp with time zone not null default now(),
  chat_session_id bigint null,
  constraint chat_messages_pkey primary key (id),
  constraint chat_messages_chat_session_id_fkey foreign KEY (chat_session_id) references chat_sessions (id) on delete CASCADE,
  constraint chat_messages_user_id_fkey foreign KEY (user_id) references users (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_chat_messages_user_created on public.chat_messages using btree (user_id, created_at desc) TABLESPACE pg_default;

create index IF not exists idx_chat_messages_session on public.chat_messages using btree (chat_session_id, created_at) TABLESPACE pg_default;

-- Table to store user documents
create table public.user_sources (
  id bigint generated always as identity not null,
  user_id uuid not null,
  title text not null,
  file_name text not null,
  file_type text not null, -- 'PDF', 'DOC', 'DOCX', 'TXT', etc.
  file_url text null, -- URL to stored file in Supabase Storage
  file_path text null, -- Path in Supabase Storage
  file_size bigint null, -- File size in bytes
  extracted_text text null, -- Full extracted text content
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint user_sources_pkey primary key (id),
  constraint user_sources_user_id_fkey foreign key (user_id) references users (id) on delete cascade
) TABLESPACE pg_default;

-- Table to store text chunks from documents for RAG
create table public.source_chunks (
  id bigint generated always as identity not null,
  source_id bigint not null,
  chunk_index integer not null, -- Order of chunk in document
  content text not null, -- The text chunk content
  embedding vector(768) null, -- Vector embedding for semantic search (using 768-dim for text-embedding-004 or similar)
  metadata jsonb null, -- Additional metadata (page number, section, etc.)
  created_at timestamp with time zone not null default now(),
  constraint source_chunks_pkey primary key (id),
  constraint source_chunks_source_id_fkey foreign key (source_id) references user_sources (id) on delete cascade
) TABLESPACE pg_default;

-- Indexes for efficient querying
create index if not exists idx_user_sources_user on public.user_sources using btree (user_id, created_at desc) TABLESPACE pg_default;
create index if not exists idx_source_chunks_source on public.source_chunks using btree (source_id, chunk_index) TABLESPACE pg_default;

create table if not exists public.chat_sessions (
  id bigint generated always as identity not null,
  user_id uuid not null,
  title text null, -- Auto-generated or user-provided title for the chat
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint chat_sessions_pkey primary key (id),
  constraint chat_sessions_user_id_fkey foreign key (user_id) references users (id) on delete cascade
) TABLESPACE pg_default;

