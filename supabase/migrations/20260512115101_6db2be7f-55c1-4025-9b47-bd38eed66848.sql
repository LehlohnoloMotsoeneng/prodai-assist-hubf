
-- profiles
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.profiles enable row level security;
create policy "Profiles are viewable by owner" on public.profiles for select using (auth.uid() = id);
create policy "Users can insert their profile" on public.profiles for insert with check (auth.uid() = id);
create policy "Users can update their profile" on public.profiles for update using (auth.uid() = id);

-- auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)));
  return new;
end; $$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- updated_at helper
create or replace function public.tg_set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;

-- chat threads
create table public.chat_threads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null default 'New conversation',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.chat_threads enable row level security;
create policy "Owners view threads" on public.chat_threads for select using (auth.uid() = user_id);
create policy "Owners insert threads" on public.chat_threads for insert with check (auth.uid() = user_id);
create policy "Owners update threads" on public.chat_threads for update using (auth.uid() = user_id);
create policy "Owners delete threads" on public.chat_threads for delete using (auth.uid() = user_id);
create trigger trg_threads_updated before update on public.chat_threads for each row execute function public.tg_set_updated_at();
create index on public.chat_threads (user_id, updated_at desc);

-- chat messages
create table public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.chat_threads(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('user','assistant','system')),
  content text not null default '',
  created_at timestamptz not null default now()
);
alter table public.chat_messages enable row level security;
create policy "Owners view messages" on public.chat_messages for select using (auth.uid() = user_id);
create policy "Owners insert messages" on public.chat_messages for insert with check (auth.uid() = user_id);
create policy "Owners delete messages" on public.chat_messages for delete using (auth.uid() = user_id);
create index on public.chat_messages (thread_id, created_at);

-- tool sessions (email, meeting, task)
create table public.tool_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  tool text not null check (tool in ('email','meeting','task')),
  title text not null default 'Untitled',
  input jsonb not null default '{}'::jsonb,
  output text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.tool_sessions enable row level security;
create policy "Owners view tool sessions" on public.tool_sessions for select using (auth.uid() = user_id);
create policy "Owners insert tool sessions" on public.tool_sessions for insert with check (auth.uid() = user_id);
create policy "Owners update tool sessions" on public.tool_sessions for update using (auth.uid() = user_id);
create policy "Owners delete tool sessions" on public.tool_sessions for delete using (auth.uid() = user_id);
create trigger trg_tool_sessions_updated before update on public.tool_sessions for each row execute function public.tg_set_updated_at();
create index on public.tool_sessions (user_id, tool, updated_at desc);
