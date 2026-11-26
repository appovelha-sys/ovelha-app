-- Tabela de perfis (complementa auth.users)
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  nome text,
  avatar_url text,
  plano text default 'free',
  created_at timestamptz default now()
);
alter table public.profiles enable row level security;
create policy "Usuário vê só o próprio perfil" on public.profiles
  for all using (auth.uid() = id);

-- Trigger: cria perfil automaticamente ao criar usuário
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, nome)
  values (new.id, new.raw_user_meta_data->>'nome');
  return new;
end;
$$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Versículos do cérebro (admin-only write, public read)
create table if not exists public.brain_entries (
  id text primary key,
  ref text not null,
  text text not null,
  context text,
  tags text,
  active boolean default true,
  interpretacao text,
  crencas text,
  valores text,
  principios text,
  prioridade text default 'contextual',
  validacao text default 'rascunho',
  updated_at timestamptz default now()
);
alter table public.brain_entries enable row level security;
create policy "Leitura pública dos versículos" on public.brain_entries
  for select using (true);
create policy "Apenas admin escreve versículos" on public.brain_entries
  for all using (auth.jwt() ->> 'email' = 'sarahstefhani1999@gmail.com');

-- Assuntos dos versículos
create table if not exists public.brain_subjects (
  id text primary key,
  label text not null,
  tags text[] default '{}',
  synonyms text[] default '{}',
  related_ids text[] default '{}',
  updated_at timestamptz default now()
);
alter table public.brain_subjects enable row level security;
create policy "Leitura pública dos assuntos" on public.brain_subjects
  for select using (true);
create policy "Apenas admin escreve assuntos" on public.brain_subjects
  for all using (auth.jwt() ->> 'email' = 'sarahstefhani1999@gmail.com');

-- Pilares do cérebro (Identidade, Personalidade, Comunicação)
create table if not exists public.brain_pillars (
  id text primary key,
  draft text,
  published text,
  published_at timestamptz,
  updated_at timestamptz default now()
);
alter table public.brain_pillars enable row level security;
create policy "Leitura pública dos pilares" on public.brain_pillars
  for select using (true);
create policy "Apenas admin escreve pilares" on public.brain_pillars
  for all using (auth.jwt() ->> 'email' = 'sarahstefhani1999@gmail.com');

-- Histórico de conversas dos usuários
create table if not exists public.conversations (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade,
  role text not null,
  content text not null,
  tokens int,
  created_at timestamptz default now()
);
alter table public.conversations enable row level security;
create policy "Usuário vê só suas conversas" on public.conversations
  for all using (auth.uid() = user_id);
