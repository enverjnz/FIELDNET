-- RLS for league_teams: coaches can manage their team's league enrollment.
-- Run in Supabase SQL editor after creating public.league_teams.

ALTER TABLE public.league_teams ENABLE ROW LEVEL SECURITY;

-- Everyone can read league assignments (needed for LigenScreen standings)
DROP POLICY IF EXISTS "Anyone can read league_teams" ON public.league_teams;
CREATE POLICY "Anyone can read league_teams"
  ON public.league_teams FOR SELECT
  TO public
  USING (true);

-- Coaches can insert/update rows for teams they manage
DROP POLICY IF EXISTS "Coach can insert league_teams for own team" ON public.league_teams;
CREATE POLICY "Coach can insert league_teams for own team"
  ON public.league_teams FOR INSERT
  TO authenticated
  WITH CHECK (
    team_id IN (
      SELECT team_managers.team_id FROM team_managers
      WHERE team_managers.profile_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Coach can update league_teams for own team" ON public.league_teams;
CREATE POLICY "Coach can update league_teams for own team"
  ON public.league_teams FOR UPDATE
  TO authenticated
  USING (
    team_id IN (
      SELECT team_managers.team_id FROM team_managers
      WHERE team_managers.profile_id = auth.uid()
    )
  )
  WITH CHECK (
    team_id IN (
      SELECT team_managers.team_id FROM team_managers
      WHERE team_managers.profile_id = auth.uid()
    )
  );

-- Optional: unique enrollment per team per season
-- ALTER TABLE public.league_teams ADD CONSTRAINT league_teams_team_season_unique UNIQUE (team_id, season_id);
