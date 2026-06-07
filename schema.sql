-- ============================================================
-- ENEM Pro — Schema Supabase
-- Executar no SQL Editor do Supabase (idempotente — rode quantas vezes quiser)
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- TABELAS
-- ────────────────────────────────────────────────────────────

-- Assinaturas
create table if not exists subscriptions (
  user_id              uuid primary key references auth.users on delete cascade,
  plan                 text not null default 'free' check (plan in ('free', 'pro')),
  expires_at           timestamptz,
  stripe_subscription_id text,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

-- Migrations de coluna (idempotentes)
alter table subscriptions add column if not exists stripe_subscription_id text;
alter table subscriptions add column if not exists updated_at timestamptz not null default now();

-- Uso diário (controle do limite free)
create table if not exists daily_usage (
  user_id             uuid not null references auth.users on delete cascade,
  date                date not null default current_date,
  count               integer not null default 0,        -- questões respondidas
  explanation_count   integer not null default 0,        -- explicações IA (free: máx 1/dia)
  primary key (user_id, date)
);

alter table daily_usage add column if not exists explanation_count integer not null default 0;

-- Respostas do usuário
create table if not exists user_answers (
  id                  uuid not null default gen_random_uuid() primary key,
  user_id             uuid not null references auth.users on delete cascade,
  question_id         text not null,
  selected_alternative text not null,
  is_correct          boolean not null,
  discipline          text,
  year                integer,
  answered_at         timestamptz not null default now()
);

alter table user_answers add column if not exists discipline text;
alter table user_answers add column if not exists year integer;

-- Cache de questões (reduz chamadas à api.enem.dev)
create table if not exists questions_cache (
  id          text primary key,
  year        integer not null,
  discipline  text,
  data        jsonb not null,
  cached_at   timestamptz not null default now()
);

-- ────────────────────────────────────────────────────────────
-- ÍNDICES DE PERFORMANCE
-- ────────────────────────────────────────────────────────────

create index if not exists idx_user_answers_user_id    on user_answers (user_id);
create index if not exists idx_user_answers_answered   on user_answers (user_id, answered_at desc);
create index if not exists idx_user_answers_disc_year  on user_answers (user_id, discipline, year);
create index if not exists idx_daily_usage_user_date   on daily_usage (user_id, date);
create index if not exists idx_subscriptions_plan      on subscriptions (plan, expires_at);
create index if not exists idx_questions_cache_year    on questions_cache (year);

-- ────────────────────────────────────────────────────────────
-- ROW LEVEL SECURITY
-- ────────────────────────────────────────────────────────────

alter table subscriptions   enable row level security;
alter table daily_usage     enable row level security;
alter table user_answers    enable row level security;

-- Subscriptions: usuário lê/edita apenas os próprios dados
drop policy if exists "users_own_subscription" on subscriptions;
create policy "users_own_subscription" on subscriptions
  for all using (auth.uid() = user_id);

-- Daily usage: usuário lê os próprios; service role (API routes) gerencia via bypass
drop policy if exists "service_manages_daily_usage" on daily_usage;
drop policy if exists "users_read_own_daily_usage" on daily_usage;
create policy "users_read_own_daily_usage" on daily_usage
  for select using (auth.uid() = user_id);

-- API routes usam service_role_key (bypassa RLS — correto para server-side)
-- As policies abaixo cobrem acesso via anon key (browser direto — não deve acontecer)
drop policy if exists "service_inserts_answers" on user_answers;
drop policy if exists "users_read_own_answers" on user_answers;
drop policy if exists "service_inserts_own_answers" on user_answers;

create policy "users_read_own_answers" on user_answers
  for select using (auth.uid() = user_id);

create policy "service_inserts_own_answers" on user_answers
  for insert with check (auth.uid() = user_id);

-- ────────────────────────────────────────────────────────────
-- TRIGGER: criar subscription free ao registrar usuário
-- ────────────────────────────────────────────────────────────

create or replace function handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.subscriptions (user_id, plan)
  values (new.id, 'free')
  on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- ────────────────────────────────────────────────────────────
-- TRIGGER: atualizar subscriptions.updated_at automaticamente
-- ────────────────────────────────────────────────────────────

create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists subscriptions_updated_at on subscriptions;
create trigger subscriptions_updated_at
  before update on subscriptions
  for each row execute procedure set_updated_at();

-- Redações enviadas para correção por IA
create table if not exists redacao_submissions (
  id           uuid not null default gen_random_uuid() primary key,
  user_id      uuid not null references auth.users on delete cascade,
  tema         text not null default '',
  texto        text not null,
  submitted_at timestamptz not null default now()
);

alter table redacao_submissions enable row level security;

drop policy if exists "users_read_own_redacoes" on redacao_submissions;
create policy "users_read_own_redacoes" on redacao_submissions
  for select using (auth.uid() = user_id);

drop policy if exists "service_inserts_redacoes" on redacao_submissions;
create policy "service_inserts_redacoes" on redacao_submissions
  for insert with check (auth.uid() = user_id);

create index if not exists idx_redacao_user on redacao_submissions (user_id, submitted_at desc);

-- ────────────────────────────────────────────────────────────
-- VERIFICAÇÃO FINAL
-- ────────────────────────────────────────────────────────────
-- Rodar após executar para confirmar:
-- select tablename, rowsecurity from pg_tables where schemaname = 'public';
-- select schemaname, tablename, policyname, cmd, qual from pg_policies where schemaname = 'public';
