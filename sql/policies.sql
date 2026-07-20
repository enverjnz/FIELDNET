Schema,Tabelle,Policy Name,Typ,Rollen,Operation,USING (Check für bestehende Zeilen),WITH CHECK (Check für neue Zeilen)
public,conversation_members,Users can add DM partner,PERMISSIVE,{authenticated},INSERT,null,"((user_id = auth.uid()) OR ((user_id <> auth.uid()) AND (EXISTS ( SELECT 1
   FROM conversations c
  WHERE ((c.id = conversation_members.conversation_id) AND (c.type = 'direct'::text)))) AND is_conversation_member(conversation_id)))"
public,conversation_members,Users can join conversations,PERMISSIVE,{authenticated},INSERT,null,(user_id = auth.uid())
public,conversation_members,Users can leave conversations,PERMISSIVE,{authenticated},DELETE,(user_id = auth.uid()),null
public,conversation_members,Users can read conversation memberships,PERMISSIVE,{authenticated},SELECT,"((user_id = auth.uid()) OR is_conversation_member(conversation_id) OR (conversation_id IN ( SELECT conversations.id
   FROM conversations
  WHERE (conversations.type = 'league'::text))))",null
public,conversation_members,Users can update own membership,PERMISSIVE,{authenticated},UPDATE,(user_id = auth.uid()),(user_id = auth.uid())
public,conversations,Authenticated can create conversations,PERMISSIVE,{authenticated},INSERT,null,true
public,conversations,Members can read conversations,PERMISSIVE,{authenticated},SELECT,((type = 'league'::text) OR is_conversation_member(id)),null
public,delete_profiles,delete_profiles_insert_authenticated,PERMISSIVE,{authenticated},INSERT,null,(auth.uid() IS NOT NULL)
public,delete_profiles,delete_profiles_insert_public_session,PERMISSIVE,{public},INSERT,null,(auth.uid() IS NOT NULL)
public,feedback_reports,Users can insert own feedback,PERMISSIVE,{authenticated},INSERT,null,(auth.uid() = user_id)
public,feedback_reports,Users can read own feedback,PERMISSIVE,{authenticated},SELECT,(auth.uid() = user_id),null
public,followers,Eingeloggte User dürfen folgen,PERMISSIVE,{public},INSERT,null,(auth.uid() = user_id)
public,followers,Jeder darf Follower sehen,PERMISSIVE,{public},SELECT,true,null
public,followers,User dürfen Entfolgen,PERMISSIVE,{public},DELETE,(auth.uid() = user_id),null
public,followers,Users can follow teams,PERMISSIVE,{authenticated},INSERT,null,(user_id = auth.uid())
public,followers,Users can read own follows,PERMISSIVE,{authenticated},SELECT,(user_id = auth.uid()),null
public,followers,Users can unfollow teams,PERMISSIVE,{authenticated},DELETE,(user_id = auth.uid()),null
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
public,messages,Members can read messages,PERMISSIVE,{authenticated},SELECT,is_conversation_member(conversation_id),null
public,messages,Members can send messages,PERMISSIVE,{authenticated},INSERT,null,((sender_id = auth.uid()) AND is_conversation_member(conversation_id))
public,post_comments,Anyone can read post comments,PERMISSIVE,{public},SELECT,true,null
public,post_comments,Authenticated users can comment,PERMISSIVE,{authenticated},INSERT,null,(user_id = auth.uid())
public,post_comments,Users can delete own comments,PERMISSIVE,{authenticated},DELETE,(user_id = auth.uid()),null
public,post_comments,Users can update own comments,PERMISSIVE,{authenticated},UPDATE,(user_id = auth.uid()),(user_id = auth.uid())
public,post_likes,Anyone can read post likes,PERMISSIVE,{public},SELECT,true,null
public,post_likes,Authenticated users can like posts,PERMISSIVE,{authenticated},INSERT,null,(user_id = auth.uid())
public,post_likes,Users can unlike own likes,PERMISSIVE,{authenticated},DELETE,(user_id = auth.uid()),null
public,posts,Anyone can read posts,PERMISSIVE,{public},SELECT,true,null
public,posts,Coach can create posts for own team,PERMISSIVE,{authenticated},INSERT,null,"((author_id = auth.uid()) AND (team_id IN ( SELECT team_managers.team_id
   FROM team_managers
  WHERE (team_managers.profile_id = auth.uid()))))"
public,posts,Coach can delete own team posts,PERMISSIVE,{authenticated},DELETE,"(team_id IN ( SELECT team_managers.team_id
   FROM team_managers
  WHERE (team_managers.profile_id = auth.uid())))",null
public,posts,Coach can update own team posts,PERMISSIVE,{authenticated},UPDATE,"(team_id IN ( SELECT team_managers.team_id
   FROM team_managers
  WHERE (team_managers.profile_id = auth.uid())))","(team_id IN ( SELECT team_managers.team_id
   FROM team_managers
  WHERE (team_managers.profile_id = auth.uid())))"
public,problem_reports,Authenticated can insert own problem reports,PERMISSIVE,{authenticated},INSERT,null,(user_id = auth.uid())
public,problem_reports,Users can read own problem reports,PERMISSIVE,{authenticated},SELECT,(user_id = auth.uid()),null
public,profiles,Authenticated read profiles for search,PERMISSIVE,{authenticated},SELECT,true,null
public,profiles,Dev Allow All Profiles,PERMISSIVE,{public},ALL,true,true
public,profiles,Users insert own profile,PERMISSIVE,{authenticated},INSERT,null,(id = auth.uid())
public,profiles,Users read own profile,PERMISSIVE,{authenticated},SELECT,(id = auth.uid()),null
public,profiles,Users update own profile,PERMISSIVE,{authenticated},UPDATE,(id = auth.uid()),(id = auth.uid())
public,regions,Dev Allow All Regions,PERMISSIVE,{public},ALL,true,true
public,seasons,Enable read access for all users,PERMISSIVE,{public},SELECT,true,null
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