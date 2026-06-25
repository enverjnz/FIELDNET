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
regions,id,integer,NO,nextval('regions_idregion_seq'::regclass)
regions,name,character varying,NO,null
regions,country_unit,text,YES,null
regions,region_logo_url,text,YES,null
team_managers,id,integer,NO,nextval('team_managers_idteam_manager_seq'::regclass)
team_managers,profile_id,uuid,NO,null
team_managers,team_id,uuid,NO,null
team_memberships,id,uuid,NO,gen_random_uuid()
team_memberships,player_id,uuid,NO,null
team_memberships,team_id,uuid,NO,null
team_memberships,status,text,NO,'pending'::text
team_memberships,created_at,timestamp with time zone,NO,"timezone('utc'::text, now())"
teams,id,uuid,NO,gen_random_uuid()
teams,name,character varying,NO,null
teams,avatar_teamlogo,text,YES,null
teams,primary_colour,text,YES,null
teams,secondary_colour,text,YES,null
teams,town,text,YES,null
teams,founding_year,integer,YES,null
teams,number_of_members,integer,YES,null
teams,training_location,text,YES,null
teams,training_times,text,YES,null
teams,clubs_idclub,uuid,YES,null
teams,leagues_idleague,uuid,YES,null
teams,website,text,YES,null
teams,tel,text,YES,null
teams,email,text,YES,null
teams,instagram,text,YES,null
teams,created_at,timestamp with time zone,NO,"timezone('utc'::text, now())"
teams,regions_idregion,integer,YES,null
teams,short_name,character varying,NO,null
ticker_events,id,integer,NO,nextval('ticker_events_idticker_event_seq'::regclass)
ticker_events,quarter,character varying,YES,null
ticker_events,games_idgame,integer,NO,null

//Alle RLS Policies
schemaname,tablename,policyname,permissive,roles,cmd,qual,with_check
public,games,Dev Allow All Games,PERMISSIVE,{public},ALL,true,true
public,profiles,Dev Allow All Profiles,PERMISSIVE,{public},ALL,true,true
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
public,team_memberships,User kann eigene Mitgliedschaften lesen,PERMISSIVE,{public},SELECT,(player_id = auth.uid()),null
public,teams,Dev Allow All Teams,PERMISSIVE,{public},ALL,true,true

//Foreign Keys
table_name,column_name,foreign_table,foreign_column
teams,clubs_idclub,clubs,id
teams,leagues_idleague,leagues,id
ticker_events,games_idgame,games,id
profiles,favourite_team_id,teams,id
team_managers,profile_id,profiles,id
team_managers,team_id,teams,id
team_memberships,player_id,profiles,id
team_memberships,team_id,teams,id
teams,regions_idregion,regions,id
games,home_team_id,teams,id
games,created_by,profiles,id