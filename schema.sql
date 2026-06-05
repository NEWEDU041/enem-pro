-- ENEM Pro — Schema Supabase
-- Executar no SQL Editor do Supabase

-- Tabela de assinaturas
create table if not exists subscriptions (
  user_id uuid primary key references auth.users on delete cascade,
  plan text default 'free' check (plan in ('free', 'pro')),
  expires_at timestamptz,
  stripe_subscription_id text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Migration: adicionar coluna stripe_subscription_id se não existir
alter table subscriptions add column if not exists stripe_subscription_id text;

-- Tabela de uso diário (controle limite free)
create table if not exists daily_usage (
  user_id uuid references auth.users on delete cascade,
  date date not null default current_date,
  count integer default 0,
  primary key (user_id, date)
);

-- Tabela de respostas do usuário
create table if not exists user_answers (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade,
  question_id text not null,
  selected_alternative text not null,
  is_correct boolean not null,
  discipline text,
  year integer,
  answered_at timestamptz default now()
);

-- Migration: adicionar colunas discipline e year se não existirem
alter table user_answers add column if not exists discipline text;
alter table user_answers add column if not exists year integer;

-- Cache de questões (opcional — para reduzir chamadas à API externa)
create table if not exists questions_cache (
  id text primary key,
  year integer not null,
  discipline text,
  data jsonb not null,
  cached_at timestamptz default now()
);

-- RLS policies
alter table subscriptions enable row level security;
alter table daily_usage enable row level security;
alter table user_answers enable row level security;

-- Subscriptions: usuário lê/edita os próprios dados
create policy "users_own_subscription" on subscriptions
  for all using (auth.uid() = user_id);

-- Daily usage: service role gerencia (API routes usam service role)
create policy "service_manages_daily_usage" on daily_usage
  for all using (true);

-- Answers: usuário lê as próprias, service role insere
create policy "users_read_own_answers" on user_answers
  for select using (auth.uid() = user_id);

create policy "service_inserts_answers" on user_answers
  for insert with check (true);

-- Função: criar registro de assinatura grátis para novos usuários
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into public.subscriptions (user_id, plan)
  values (new.id, 'free')
  on conflict (user_id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

-- Trigger: executar ao criar usuário
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();
