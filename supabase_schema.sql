-- 날씨 월드컵: 소나기 & 소낙눈 & 돌풍
-- Supabase SQL Schema

-- ─── Tournaments ──────────────────────────────────────────────────────────────
CREATE TABLE tournaments (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL,
  phase       text NOT NULL DEFAULT 'group', -- 'group' | 'knockout'
  status      text NOT NULL DEFAULT 'active', -- 'active' | 'completed'
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- ─── Weather Teams ────────────────────────────────────────────────────────────
CREATE TABLE weather_teams (
  id            serial PRIMARY KEY,
  name          text NOT NULL,
  emoji         text NOT NULL,
  category      text NOT NULL,
  created_at    timestamptz NOT NULL DEFAULT now()
);

-- ─── Groups ───────────────────────────────────────────────────────────────────
CREATE TABLE groups (
  id              serial PRIMARY KEY,
  tournament_id   uuid NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  name            text NOT NULL, -- 'A조', 'B조', ...
  created_at      timestamptz NOT NULL DEFAULT now()
);

-- ─── Group Members ────────────────────────────────────────────────────────────
CREATE TABLE group_members (
  id            serial PRIMARY KEY,
  group_id      int NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  team_id       int NOT NULL REFERENCES weather_teams(id),
  played        int NOT NULL DEFAULT 0,
  wins          int NOT NULL DEFAULT 0,
  losses        int NOT NULL DEFAULT 0,
  total_votes   int NOT NULL DEFAULT 0
);

-- ─── Matches ──────────────────────────────────────────────────────────────────
CREATE TABLE matches (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id uuid NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  group_id      int REFERENCES groups(id),        -- null for knockout
  round         text NOT NULL,                    -- 'group' | '32' | '16' | '8' | '4' | 'final'
  match_order   int NOT NULL DEFAULT 0,
  team1_id      int NOT NULL REFERENCES weather_teams(id),
  team2_id      int NOT NULL REFERENCES weather_teams(id),
  votes1        int NOT NULL DEFAULT 0,
  votes2        int NOT NULL DEFAULT 0,
  winner_side   text,                             -- 'team1' | 'team2'
  status        text NOT NULL DEFAULT 'pending',  -- 'pending' | 'voting' | 'done'
  created_at    timestamptz NOT NULL DEFAULT now()
);

-- ─── Chat Messages ────────────────────────────────────────────────────────────
CREATE TABLE chat_messages (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id uuid NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  username      text NOT NULL,
  message       text NOT NULL,
  created_at    timestamptz NOT NULL DEFAULT now()
);

-- ─── Vote Function ────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION cast_vote(p_match_id uuid, p_side text)
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  IF p_side = 'team1' THEN
    UPDATE matches SET votes1 = votes1 + 1 WHERE id = p_match_id;
  ELSIF p_side = 'team2' THEN
    UPDATE matches SET votes2 = votes2 + 1 WHERE id = p_match_id;
  END IF;
END;
$$;

-- ─── RLS (Row Level Security) ─────────────────────────────────────────────────
ALTER TABLE tournaments    ENABLE ROW LEVEL SECURITY;
ALTER TABLE weather_teams  ENABLE ROW LEVEL SECURITY;
ALTER TABLE groups         ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members  ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches        ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages  ENABLE ROW LEVEL SECURITY;

-- Public read
CREATE POLICY "public read tournaments"   ON tournaments    FOR SELECT USING (true);
CREATE POLICY "public read weather_teams" ON weather_teams  FOR SELECT USING (true);
CREATE POLICY "public read groups"        ON groups         FOR SELECT USING (true);
CREATE POLICY "public read group_members" ON group_members  FOR SELECT USING (true);
CREATE POLICY "public read matches"       ON matches        FOR SELECT USING (true);
CREATE POLICY "public read chat"          ON chat_messages  FOR SELECT USING (true);

-- Public insert for chat
CREATE POLICY "public insert chat" ON chat_messages FOR INSERT WITH CHECK (true);

-- ─── Realtime ─────────────────────────────────────────────────────────────────
-- Supabase 대시보드에서 matches, chat_messages 테이블의 Replication을 활성화하세요.

-- ─── Seed: Weather Teams (48팀) ───────────────────────────────────────────────
INSERT INTO weather_teams (name, emoji, category) VALUES
  -- 강수 계열
  ('비', '🌧️', '강수 계열'),
  ('소나기', '🌦️', '강수 계열'),
  ('폭우', '⛈️', '강수 계열'),
  ('비와눈', '🌨️', '강수 계열'),
  ('진눈깨비', '🌨️', '강수 계열'),
  ('소낙눈', '❄️', '강수 계열'),
  ('눈꽃', '🌸', '강수 계열'),
  ('함박눈', '🌨️', '강수 계열'),
  ('가랑비', '🌦️', '강수 계열'),
  ('찬비', '🌧️', '강수 계열'),
  ('안개비', '🌫️', '강수 계열'),
  ('우박', '🌨️', '강수 계열'),
  ('인공뇌우', '⚡', '강수 계열'),
  ('산성비', '☣️', '강수 계열'),
  ('홍수', '🌊', '강수 계열'),
  ('폭설', '❄️', '강수 계열'),
  -- 맑음 계열
  ('맑음', '☀️', '맑음 계열'),
  ('폭염', '🔥', '맑음 계열'),
  ('열대야', '🌙', '맑음 계열'),
  ('혹서', '🥵', '맑음 계열'),
  ('오로라', '🌌', '맑음 계열'),
  ('엘니뇨', '🌡️', '맑음 계열'),
  ('맑으나때때로구름', '⛅', '맑음 계열'),
  ('구름조금', '🌤️', '맑음 계열'),
  ('맑고비', '🌈', '맑음 계열'),
  ('맑으면서눈', '🌨️', '맑음 계열'),
  -- 흐림 계열
  ('흐림', '☁️', '흐림 계열'),
  ('스모그', '🏭', '흐림 계열'),
  ('안개', '🌫️', '흐림 계열'),
  ('미세먼지', '😷', '흐림 계열'),
  ('초미세먼지', '🫁', '흐림 계열'),
  ('황사', '🏜️', '흐림 계열'),
  ('연기', '💨', '흐림 계열'),
  ('엷은안개', '🌁', '흐림 계열'),
  -- 바람 계열
  ('태풍', '🌀', '바람 계열'),
  ('토네이도', '🌪️', '바람 계열'),
  ('돌풍', '💨', '바람 계열'),
  ('비바람', '🌬️', '바람 계열'),
  ('열대저기압', '🌀', '바람 계열'),
  ('사이클론', '🌀', '바람 계열'),
  ('라니냐', '🌊', '바람 계열'),
  ('대기', '🌬️', '바람 계열'),
  -- 재해 계열
  ('마그마', '🌋', '재해 계열'),
  ('운석', '☄️', '재해 계열'),
  ('화산재', '🌋', '재해 계열'),
  ('해일', '🌊', '재해 계열'),
  ('가뭄', '🏜️', '재해 계열'),
  ('쓰나미', '🌊', '재해 계열');
