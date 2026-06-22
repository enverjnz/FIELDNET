-- ====================================================================
-- 0. CLEANUP (Alte Tabellen löschen, falls vorhanden)
-- ====================================================================
-- Child-Tabellen zuerst löschen wegen Fremdschlüssel-Abhängigkeiten
DROP TABLE IF EXISTS team_memberships CASCADE;
DROP TABLE IF EXISTS team_managers CASCADE;
DROP TABLE IF EXISTS ticker_events CASCADE;
DROP TABLE IF EXISTS lineup_players CASCADE;
DROP TABLE IF EXISTS lineups CASCADE;
DROP TABLE IF EXISTS chat_participants CASCADE;
DROP TABLE IF EXISTS group_chats CASCADE;
DROP TABLE IF EXISTS dm_chats CASCADE;
DROP TABLE IF EXISTS ticker_events CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;
DROP TABLE IF EXISTS games CASCADE;
DROP TABLE IF EXISTS teams CASCADE;
DROP TABLE IF EXISTS leagues CASCADE;
DROP TABLE IF EXISTS clubs CASCADE;
DROP TABLE IF EXISTS regions CASCADE;
DROP TABLE IF EXISTS articles CASCADE;
DROP TABLE IF EXISTS app_admins CASCADE;
DROP TABLE IF EXISTS votings CASCADE;
DROP TABLE IF EXISTS ads CASCADE;

-- Alte Bezeichnungen aus vorherigen Versionen (Sicherheitshalber)
DROP TABLE IF EXISTS app_user CASCADE;
DROP TABLE IF EXISTS app_users CASCADE;
DROP TABLE IF EXISTS coach_details CASCADE;
DROP TABLE IF EXISTS player_details CASCADE;
DROP TABLE IF EXISTS team_admins CASCADE;
DROP TABLE IF EXISTS team CASCADE;

-- ====================================================================
-- 1. STRUKTUR-TABELLEN
-- ====================================================================
CREATE TABLE regions (
  idregion SERIAL PRIMARY KEY,
  name VARCHAR(45) NOT NULL
);

CREATE TABLE clubs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE TABLE leagues (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE TABLE teams (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    avatar_teamlogo TEXT,
    primary_colour TEXT,    -- Speichert HEX-Codes, z.B. '#FF5733'
    secondary_colour TEXT,
    town TEXT,
    founding_year INT,
    number_of_members INT,
    training_location TEXT,
    training_times TEXT,
    clubs_idclub UUID REFERENCES clubs(id) ON DELETE SET NULL,
    leagues_idleague UUID REFERENCES leagues(id) ON DELETE SET NULL,
    website TEXT,
    tel TEXT,
    email TEXT,
    instagram TEXT,         -- Einfacher Link / Username
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- ====================================================================
-- 2. SPIELE & TICKER
-- ====================================================================
CREATE TABLE games (
  idgame SERIAL PRIMARY KEY,
  status VARCHAR(45) NULL DEFAULT 'SCHEDULED',
  home_score INTEGER NULL DEFAULT 0,
  away_score INTEGER NULL DEFAULT 0
);

CREATE TABLE ticker_events (
  idticker_event SERIAL PRIMARY KEY,
  quarter VARCHAR(10) NULL,
  games_idgame INTEGER NOT NULL REFERENCES games (idgame) ON DELETE CASCADE
);

-- ====================================================================
-- 3. USER, RECHTE & MITGLIEDSCHAFTEN
-- ====================================================================
CREATE TABLE profiles (
    id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    role TEXT CHECK (role IN ('player', 'team', 'fan')) NOT NULL,
    avatar TEXT,
    first_name TEXT,
    last_name TEXT,
    bio TEXT,
    favourite_team_id UUID REFERENCES teams(id) ON DELETE SET NULL, -- Für Fans
    -- Spezifische Spieler-Daten:
    position TEXT,
    jersey_number TEXT,     
    age INT,
    gender TEXT,
    weight DECIMAL,
    height DECIMAL,
    nationality TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Korrigiert: Nutzt jetzt UUIDs passend zu profiles und teams
CREATE TABLE team_managers (
  idteam_manager SERIAL PRIMARY KEY,
  profile_id UUID NOT NULL REFERENCES profiles (id) ON DELETE CASCADE,
  team_id UUID NOT NULL REFERENCES teams (id) ON DELETE CASCADE,
  CONSTRAINT unique_manager UNIQUE (profile_id, team_id)
);

-- Zwischentabelle für Team-Mitgliedschaften & Beitrittsanfragen
CREATE TABLE team_memberships (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    player_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    team_id UUID REFERENCES teams(id) ON DELETE CASCADE NOT NULL,
    status TEXT CHECK (status IN ('pending', 'approved', 'declined')) DEFAULT 'pending' NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    
    -- Verhindert doppelte Bewerbungen
    UNIQUE (player_id, team_id) 
);

-- ====================================================================
-- 4. IDEEN-STUBS (Platzhalter)
-- ====================================================================
CREATE TABLE app_admins ( idapp_admin SERIAL PRIMARY KEY );
CREATE TABLE articles ( idarticle SERIAL PRIMARY KEY );
CREATE TABLE dm_chats ( iddm_chat SERIAL PRIMARY KEY );
CREATE TABLE group_chats ( idgroup_chat SERIAL PRIMARY KEY );
CREATE TABLE chat_participants ( idchat_participant SERIAL PRIMARY KEY );
CREATE TABLE ads ( idad SERIAL PRIMARY KEY, company VARCHAR(45), ad_type VARCHAR(45) );
CREATE TABLE votings ( idvoting SERIAL PRIMARY KEY, status VARCHAR(45) );
CREATE TABLE lineups ( idlineup SERIAL PRIMARY KEY );
CREATE TABLE lineup_players ( idlineup_players SERIAL PRIMARY KEY );


-- RLS aktivieren
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_memberships ENABLE ROW LEVEL SECURITY;

-- Policies für profiles
CREATE POLICY "insert_own_profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "select_own_profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "update_own_profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Policies für team_memberships
CREATE POLICY "insert_own_membership" ON team_memberships FOR INSERT WITH CHECK (auth.uid() = player_id);
CREATE POLICY "select_own_memberships" ON team_memberships FOR SELECT USING (auth.uid() = player_id);