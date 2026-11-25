-- =====================================================================
-- RonyIA — schéma initial
-- À exécuter une fois dans Supabase : SQL Editor > New query > Run
-- =====================================================================

-- ---------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------

create table if not exists public.settings (
  user_id               uuid primary key default auth.uid() references auth.users (id) on delete cascade,
  stages                jsonb not null default '[
    {"key":"nouveau","label":"Nouveau lead","color":"slate","type":"open"},
    {"key":"contacte","label":"Contacté","color":"sky","type":"open"},
    {"key":"discussion","label":"En discussion","color":"violet","type":"open"},
    {"key":"call","label":"Call / Démo prévu","color":"amber","type":"open"},
    {"key":"devis","label":"Devis envoyé","color":"orange","type":"open"},
    {"key":"negociation","label":"Négociation","color":"rose","type":"open"},
    {"key":"signe","label":"Signé","color":"emerald","type":"won"},
    {"key":"perdu","label":"Perdu","color":"zinc","type":"lost"}
  ]'::jsonb,
  sources               jsonb not null default '["LinkedIn","Bouche-à-oreille","Cold email","Réseau","Événement","Site web","Autre"]'::jsonb,
  monthly_goal_deals    integer not null default 4 check (monthly_goal_deals >= 0),
  monthly_goal_revenue  numeric(12, 2) not null default 15000 check (monthly_goal_revenue >= 0),
  updated_at            timestamptz not null default now()
);

create table if not exists public.prospects (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null default auth.uid() references auth.users (id) on delete cascade,
  company           text not null check (char_length(company) between 1 and 200),
  contact_name      text,
  job_title         text,
  email             text,
  phone             text,
  linkedin_url      text,
  website           text,
  city              text,
  sector            text,
  source            text,
  stage             text not null default 'nouveau',
  estimated_amount  numeric(12, 2) not null default 0 check (estimated_amount >= 0),
  priority          text not null default 'moyenne' check (priority in ('haute', 'moyenne', 'basse')),
  next_follow_up    date,
  next_call_at      timestamptz,
  needs             text,
  lost_reason       text,
  signed_at         timestamptz,
  is_demo           boolean not null default false,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create table if not exists public.interactions (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null default auth.uid() references auth.users (id) on delete cascade,
  prospect_id  uuid not null references public.prospects (id) on delete cascade,
  type         text not null check (type in ('call', 'email', 'linkedin', 'rdv')),
  occurred_at  timestamptz not null default now(),
  notes        text,
  created_at   timestamptz not null default now()
);

create index if not exists prospects_user_stage_idx     on public.prospects (user_id, stage);
create index if not exists prospects_user_follow_up_idx on public.prospects (user_id, next_follow_up);
create index if not exists prospects_user_call_idx      on public.prospects (user_id, next_call_at);
create index if not exists interactions_prospect_idx    on public.interactions (prospect_id, occurred_at desc);
create index if not exists interactions_user_idx        on public.interactions (user_id);

-- ---------------------------------------------------------------------
-- Row Level Security : chaque utilisateur ne voit que ses données
-- ---------------------------------------------------------------------

alter table public.settings     enable row level security;
alter table public.prospects    enable row level security;
alter table public.interactions enable row level security;

drop policy if exists "settings_owner" on public.settings;
create policy "settings_owner" on public.settings
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

drop policy if exists "prospects_owner" on public.prospects;
create policy "prospects_owner" on public.prospects
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

drop policy if exists "interactions_owner" on public.interactions;
create policy "interactions_owner" on public.interactions
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (
    user_id = (select auth.uid())
    and exists (
      select 1 from public.prospects p
      where p.id = prospect_id and p.user_id = (select auth.uid())
    )
  );

-- ---------------------------------------------------------------------
-- Triggers
-- ---------------------------------------------------------------------

-- updated_at automatique
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists prospects_updated_at on public.prospects;
create trigger prospects_updated_at
  before update on public.prospects
  for each row execute function public.set_updated_at();

drop trigger if exists settings_updated_at on public.settings;
create trigger settings_updated_at
  before update on public.settings
  for each row execute function public.set_updated_at();

-- signed_at rempli au passage dans une étape « gagnée », vidé sinon.
-- lost_reason vidé quand le prospect sort de l'étape « perdue ».
create or replace function public.handle_prospect_stage()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  stage_type text;
begin
  select e ->> 'type' into stage_type
  from public.settings s, jsonb_array_elements(s.stages) e
  where s.user_id = new.user_id and e ->> 'key' = new.stage
  limit 1;

  if stage_type is null then
    stage_type := case new.stage when 'signe' then 'won' when 'perdu' then 'lost' else 'open' end;
  end if;

  if stage_type = 'won' then
    if new.signed_at is null then
      new.signed_at := now();
    end if;
  else
    new.signed_at := null;
  end if;

  if stage_type <> 'lost' then
    new.lost_reason := null;
  end if;

  return new;
end;
$$;

drop trigger if exists prospects_stage on public.prospects;
create trigger prospects_stage
  before insert or update of stage, signed_at, lost_reason on public.prospects
  for each row execute function public.handle_prospect_stage();

-- Ligne settings créée automatiquement à l'inscription
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.settings (user_id) values (new.id) on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Comptes créés avant la migration
insert into public.settings (user_id)
select id from auth.users
on conflict (user_id) do nothing;
