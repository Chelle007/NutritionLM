-- version 5.0.0
-- Add chat sessions table for multiple chat history support

-- Create chat_sessions table
create table if not exists public.chat_sessions (
  id bigint generated always as identity not null,
  user_id uuid not null,
  title text null, -- Auto-generated or user-provided title for the chat
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint chat_sessions_pkey primary key (id),
  constraint chat_sessions_user_id_fkey foreign key (user_id) references users (id) on delete cascade
) TABLESPACE pg_default;

-- Add chat_session_id to chat_messages table
alter table public.chat_messages 
  add column if not exists chat_session_id bigint null,
  add constraint chat_messages_chat_session_id_fkey 
    foreign key (chat_session_id) references chat_sessions (id) on delete cascade;

create index if not exists idx_chat_sessions_user on public.chat_sessions 
  using btree (user_id, updated_at desc) TABLESPACE pg_default;

create index if not exists idx_chat_messages_session on public.chat_messages 
  using btree (chat_session_id, created_at asc) TABLESPACE pg_default;
