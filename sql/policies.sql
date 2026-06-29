Schema,Tabelle,Policy Name,Typ,Rollen,Operation,USING (Check für bestehende Zeilen),WITH CHECK (Check für neue Zeilen)
public,delete_profiles,delete_profiles_insert_authenticated,PERMISSIVE,{authenticated},INSERT,null,(auth.uid() IS NOT NULL)
public,delete_profiles,delete_profiles_insert_public_session,PERMISSIVE,{public},INSERT,null,(auth.uid() IS NOT NULL)
public,games,Dev Allow All Games,PERMISSIVE,{public},ALL,true,true
public,league_teams,Anyone can read league_teams,PERMISSIVE,{public},SELECT,true,null
public,league_teams,Coach can insert league_teams for own team,PERMISSIVE,{authenticated},INSERT,null,"(team_id IN ( SELECT team_managers.team_id
   FROM team_managers
  WHERE (team_managers.profile_id = auth.uid())))"
public,league_teams,Coach can update league_teams for own team,PERMISSIVE,{authenticated},UPDATE,"(team_id IN ( SELECT team_managers.team_id
   FROM team_managers
  WHERE (team_managers.profile_id = auth.uid())))","(team_id IN ( SELECT team_managers.team_id
   FROM team_managers
  WHERE (team_managers.profile_id = auth.uid())))"
public,leagues,Dev Allow All Leagues,PERMISSIVE,{public},ALL,true,true
public,profiles,Authenticated read profiles for search,PERMISSIVE,{authenticated},SELECT,true,null
public,profiles,Dev Allow All Profiles,PERMISSIVE,{public},ALL,true,true
public,profiles,Users insert own profile,PERMISSIVE,{authenticated},INSERT,null,(id = auth.uid())
public,profiles,Users read own profile,PERMISSIVE,{authenticated},SELECT,(id = auth.uid()),null
public,profiles,Users update own profile,PERMISSIVE,{authenticated},UPDATE,(id = auth.uid()),(id = auth.uid())
public,regions,Dev Allow All Regions,PERMISSIVE,{public},ALL,true,true
public,team_invite_codes,Authenticated can read invite codes,PERMISSIVE,{authenticated},SELECT,true,null
public,team_invite_codes,Coach can redeem invite code,PERMISSIVE,{authenticated},UPDATE,((used_by_user_id IS NULL) OR (used_by_user_id = auth.uid())),(used_by_user_id = auth.uid())
public,team_managers,Coach can insert own manager row,PERMISSIVE,{authenticated},INSERT,null,(profile_id = auth.uid())
public,team_managers,Manager kann eigene Zuordnung löschen,PERMISSIVE,{authenticated},DELETE,(profile_id = auth.uid()),null
public,team_managers,managers_select_own,PERMISSIVE,{authenticated},SELECT,(profile_id = auth.uid()),null
public,team_memberships,Coach kann Kader seines Teams lesen,PERMISSIVE,{public},SELECT,"((team_id IN ( SELECT team_managers.team_id
   FROM team_managers
  WHERE (team_managers.profile_id = auth.uid()))) OR (player_id = auth.uid()))",null
public,team_memberships,Coach kann Kader-Einträge seines Teams löschen,PERMISSIVE,{public},DELETE,"(team_id IN ( SELECT team_managers.team_id
   FROM team_managers
  WHERE (team_managers.profile_id = auth.uid())))",null
public,team_memberships,Coach kann Kader-Status seines Teams aktualisieren,PERMISSIVE,{public},UPDATE,"(team_id IN ( SELECT team_managers.team_id
   FROM team_managers
  WHERE (team_managers.profile_id = auth.uid())))","(team_id IN ( SELECT team_managers.team_id
   FROM team_managers
  WHERE (team_managers.profile_id = auth.uid())))"
public,team_memberships,Dev Allow All Memberships,PERMISSIVE,{public},ALL,true,true
public,team_memberships,User kann Mitgliedschaft beantragen,PERMISSIVE,{authenticated},INSERT,null,(player_id = auth.uid())
public,team_memberships,User kann eigene Mitgliedschaft löschen,PERMISSIVE,{authenticated},DELETE,(player_id = auth.uid()),null
public,team_memberships,User kann eigene Mitgliedschaften lesen,PERMISSIVE,{public},SELECT,(player_id = auth.uid()),null
public,teams,Anon can search teams,PERMISSIVE,"{anon,authenticated}",SELECT,true,null
public,teams,Authenticated insert teams,PERMISSIVE,{authenticated},INSERT,null,true
public,teams,Dev Allow All Teams,PERMISSIVE,{public},ALL,true,true
public,teams,Managers update own team,PERMISSIVE,{authenticated},UPDATE,"(id IN ( SELECT team_managers.team_id
   FROM team_managers
  WHERE (team_managers.profile_id = auth.uid())))","(id IN ( SELECT team_managers.team_id
   FROM team_managers
  WHERE (team_managers.profile_id = auth.uid())))"
public,ticker_events,Anyone can read ticker events,PERMISSIVE,{public},SELECT,true,null
public,ticker_events,Authenticated can insert ticker events,PERMISSIVE,{authenticated},INSERT,null,(created_by = auth.uid())
public,ticker_events,Coach can update own ticker events,PERMISSIVE,{authenticated},UPDATE,(created_by = auth.uid()),(created_by = auth.uid())