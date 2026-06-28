table_name,column_name,data_type,is_nullable,column_default
XXXads,id,integer,NO,nextval('ads_idad_seq1'::regclass)
XXXads,company,character varying,YES,null
XXXads,ad_type,character varying,YES,null
XXXapp_admins,id,integer,NO,nextval('app_admins_idapp_admin_seq1'::regclass)
XXXarticles,id,integer,NO,nextval('articles_idarticle_seq1'::regclass)
XXXchat_participants,id,integer,NO,nextval('chat_participants_idchat_participant_seq1'::regclass)
XXXdm_chats,id,integer,NO,nextval('dm_chats_iddm_chat_seq1'::regclass)
XXXgroup_chats,id,integer,NO,nextval('group_chats_idgroup_chat_seq1'::regclass)
XXXlineup_players,id,integer,NO,nextval('lineup_players_idlineup_players_seq1'::regclass)
XXXlineups,id,integer,NO,nextval('lineups_idlineup_seq1'::regclass)
XXXvotings,id,integer,NO,nextval('votings_idvoting_seq1'::regclass)
XXXvotings,status,character varying,YES,null
clubs,id,uuid,NO,gen_random_uuid()
clubs,name,character varying,NO,null
clubs,created_at,timestamp with time zone,NO,"timezone('utc'::text, now())"
delete_profiles,id,bigint,NO,null
delete_profiles,created_at,timestamp with time zone,NO,"timezone('utc'::text, now())"
delete_profiles,reason,text,NO,null
delete_profiles,feedback,text,YES,null
games,id,integer,NO,nextval('games_idgame_seq'::regclass)
games,status,character varying,YES,'SCHEDULED'::character varying
games,home_score,integer,YES,0
games,away_score,integer,YES,0
games,home_team_id,uuid,YES,null
games,away_team_name,text,YES,null
games,game_date,date,YES,null
games,game_time,text,YES,null
games,location,text,YES,null
games,is_home_game,boolean,YES,true
games,game_code,text,YES,null
games,created_by,uuid,YES,null
leagues,id,uuid,NO,gen_random_uuid()
leagues,name,text,NO,null
leagues,created_at,timestamp with time zone,NO,"timezone('utc'::text, now())"
leagues,league_logo_url,text,YES,null
leagues,region_id,integer,YES,null
leagues,division,character varying,NO,'Herren'::character varying
leagues,season_id,bigint,YES,null
profile_stats,id,bigint,NO,null
profile_stats,profile_id,uuid,NO,null
profile_stats,seasons_played,integer,NO,1
profile_stats,games_played,integer,NO,0
profile_stats,touchdowns,integer,NO,0
profile_stats,field_goals,integer,NO,0
profile_stats,extra_points,integer,NO,0
profile_stats,two_point_conversions,integer,NO,0
profile_stats,interceptions,integer,NO,0
profile_stats,sacks,integer,NO,0
profile_stats,count_mvp,integer,NO,0
profiles,id,uuid,NO,null
profiles,role,text,NO,null
profiles,avatar,text,YES,null
profiles,first_name,text,YES,null
profiles,last_name,text,YES,null
profiles,bio,text,YES,null
profiles,favourite_team_id,uuid,YES,null
profiles,position,text,YES,null
profiles,jersey_number,text,YES,null
profiles,age,integer,YES,null
profiles,gender,text,YES,null
profiles,weight,numeric,YES,null
profiles,height,numeric,YES,null
profiles,nationality,text,YES,null
profiles,created_at,timestamp with time zone,NO,"timezone('utc'::text, now())"
profiles,coaching_experience,integer,YES,null
profiles,coaching_role,text,YES,null
profiles,coaching_license,text,YES,null
profiles,coaching_specialization,text,YES,null
profiles,birth_date,date,YES,null
regions,id,integer,NO,nextval('regions_idregion_seq'::regclass)
regions,name,character varying,NO,null
regions,country_unit,text,YES,null
regions,region_logo_url,text,YES,null
seasons,id,bigint,NO,null
seasons,created_at,timestamp with time zone,NO,"timezone('utc'::text, now())"
seasons,year_label,character varying,NO,null
seasons,is_current,boolean,NO,false
team_invite_codes,id,uuid,NO,gen_random_uuid()
team_invite_codes,code,text,NO,null
team_invite_codes,is_used,boolean,NO,false
team_invite_codes,used_by_user_id,uuid,YES,null
team_invite_codes,team_id,uuid,YES,null
team_invite_codes,created_at,timestamp with time zone,NO,"timezone('utc'::text, now())"
team_managers,id,integer,NO,nextval('team_managers_idteam_manager_seq'::regclass)
team_managers,profile_id,uuid,NO,null
team_managers,team_id,uuid,NO,null
team_memberships,id,uuid,NO,gen_random_uuid()
team_memberships,player_id,uuid,NO,null
team_memberships,team_id,uuid,NO,null
team_memberships,status,text,NO,'pending'::text
team_memberships,created_at,timestamp with time zone,NO,"timezone('utc'::text, now())"
team_stats,id,bigint,NO,null
team_stats,team_id,uuid,NO,null
team_stats,seasons_played,integer,NO,1
team_stats,games_played,integer,NO,0
team_stats,wins,integer,NO,0
team_stats,losses,integer,NO,0
team_stats,ties,integer,NO,0
team_stats,points_for,integer,NO,0
team_stats,points_against,integer,NO,0

--Policies
Schema,Tabelle,Policy Name,Typ,Rollen,Operation,USING (Check für bestehende Zeilen),WITH CHECK (Check für neue Zeilen)
public,games,Dev Allow All Games,PERMISSIVE,{public},ALL,true,true
public,leagues,Dev Allow All Leagues,PERMISSIVE,{public},ALL,true,true
public,profiles,Dev Allow All Profiles,PERMISSIVE,{public},ALL,true,true
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
public,teams,Dev Allow All Teams,PERMISSIVE,{public},ALL,true,true
public,ticker_events,Anyone can read ticker events,PERMISSIVE,{public},SELECT,true,null
public,ticker_events,Authenticated can insert ticker events,PERMISSIVE,{authenticated},INSERT,null,(created_by = auth.uid())
public,ticker_events,Coach can update own ticker events,PERMISSIVE,{authenticated},UPDATE,(created_by = auth.uid()),(created_by = auth.uid())