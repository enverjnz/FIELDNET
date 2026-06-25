import React, { useState, useEffect } from 'react';

//Component import
import { 
  Text, Image, View, ImageBackground, 
  ScrollView, TouchableOpacity, SafeAreaView, 
  StatusBar, Alert, ActivityIndicator } from 'react-native';

// Alle benötigten Icons in einem einzigen Import zusammengefasst
import { Trophy, Bell, Search, 
  User, ChevronRight, Home, 
  LayoutGrid, CalendarDays, 
  MessageSquare, Users, 
  PlusCircle, Menu, X, LogOut } from 'lucide-react-native';

//Screen imports
import styles from './HomeScreen.styles';
import LigenScreen from './screens/LigenScreen.js';
import TermineScreen from './screens/TermineScreen';
import ChatScreen from './screens/ChatScreen.js';
import SucheScreen from './screens/SucheScreen.js';
import TickerScreen from './screens/TickerScreen';
import TickerCodeScreen from './screens/TickerCodeScreen';
import TimelineScreen from './screens/TimelineScreen.js';
import ProfilScreen from './screens/ProfilScreen.js';
import CoachOnboardingWizard from './screens/onboarding/CoachOnboardingWizard';
import TeamDashboardScreen from './screens/TeamDashboardScreen.js';
import PlayerOnboardingFlow from './screens/onboarding/PlayerOnboardingFlow';
import LandingScreen from './screens/auth/LandingScreen';
import LoginScreen from './screens/auth/LoginScreen';
import SettingsScreen from './screens/SettingsScreen';
import DeleteProfileScreen from './screens/DeleteProfileScreen';
import { supabase } from './lib/supabase';


const REGIONS = ['ALLE REGIONEN', 'BAWÜ', 'BAYERN', 'NRW', 'HESSEN', 'NORD', 'OST', 'WEST'];
const LIGEN   = ['ALLE NEWS', 'GFL 1', 'GFL 2', 'ELF', 'DBFX (FRAUEN)', '2. DBL', 'REGIONAL', 'JUGEND'];

export default function App() {
  
  const [activeTab, setActiveTab] = useState(0); // 0 bedeutet 'NEWS' ist am Anfang aktiv
  const [activeRegion, setActiveRegion] = useState(0); //0 bedeutet 'ALLE RAGIONEN' sind aktiv
  const [activeLeague, setActiveLeague] = useState(0); // 0 bedeutet 'ALLE LIGEN' sind aktiv
  const [selectedGame, setSelectedGame] = useState(null); // kein Spiel ausgewählt
  const [showTeamCreation, setShowTeamCreation]   = useState(false);
  const [showTeamDashboard, setShowTeamDashboard] = useState(false);
  const [dashboardTeamId, setDashboardTeamId]     = useState(null);
  const [userRole, setUserRole]                   = useState(null);
  const [authState, setAuthState]                 = useState('landing');
  const [authReady, setAuthReady]                 = useState(false);
  const [showSettings, setShowSettings]           = useState(false);
  const [showDeleteProfile, setShowDeleteProfile] = useState(false);
  const [showTickerFlow, setShowTickerFlow]       = useState(false);
  const [tickerGame, setTickerGame]               = useState(null);
  const [profileRefreshKey, setProfileRefreshKey] = useState(0);

  const bumpProfileRefresh = () => setProfileRefreshKey((k) => k + 1);

  useEffect(() => {
    const loadRole = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setUserRole(null);
        return;
      }
      const role = user.user_metadata?.role;
      if (role) { setUserRole(role); return; }
      const { data } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle();
      setUserRole(data?.role ?? null);
    };

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setAuthState('app');
      loadRole();
    }).finally(() => setAuthReady(true));

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        setAuthState('app');
      } else if (event === 'SIGNED_OUT') {
        setAuthState('landing');
        setUserRole(null);
      }
      loadRole();
    });
    return () => subscription.unsubscribe();
  }, []);


  const handleAccountDeleted = () => {
    setShowDeleteProfile(false);
    setShowSettings(false);
    setIsMenuOpen(false);
    setActiveTab(0);
    setSelectedGame(null);
    setShowTeamDashboard(false);
    setShowTeamCreation(false);
    setDashboardTeamId(null);
    setUserRole(null);
    setShowTickerFlow(false);
    setTickerGame(null);
    setAuthState('landing');
  };

  const openTickerFlow = () => {
    setIsMenuOpen(false);
    setShowTickerFlow(true);
    setTickerGame(null);
  };

  const closeTickerFlow = () => {
    setShowTickerFlow(false);
    setTickerGame(null);
  };

  const handleSignOut = () => {
    Alert.alert('Abmelden', 'Möchtest du dich wirklich abmelden?', [
      { text: 'Abbrechen', style: 'cancel' },
      {
        text: 'Abmelden', style: 'destructive',
        onPress: async () => {
          setIsMenuOpen(false);
          setShowTickerFlow(false);
          setTickerGame(null);
          await supabase.auth.signOut();
          setAuthState('landing');
        },
      },
    ]);
  };

  const handleVerwaltung = async () => {
    setIsMenuOpen(false);
    try {
      const { data: { user }, error: authErr } = await supabase.auth.getUser();
      if (authErr || !user) return;

      // 1. Check auth metadata first (set during registration via signUp options.data)
      const metaRole = user.user_metadata?.role;

      // 2. Rolle prüfen: zuerst aus user_metadata, dann aus profiles
      let profileRole = metaRole;

      if (!metaRole) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role, coaching_role')
          .eq('id', user.id)
          .maybeSingle();

        profileRole = profile?.role || (profile?.coaching_role ? 'coach' : null);
      }

      if (profileRole !== 'coach') {
        Alert.alert('Nicht verfügbar', 'Die Vereinsverwaltung ist nur für Trainer zugänglich.');
        return;
      }

      // Team-Zuordnung nur über team_managers prüfen
      const { data: managerRow } = await supabase
        .from('team_managers')
        .select('team_id')
        .eq('profile_id', user.id)
        .maybeSingle();

      if (managerRow?.team_id) {
        setDashboardTeamId(managerRow.team_id);
        setShowTeamDashboard(true);
      } else {
        setShowTeamCreation(true);
      }
    } catch (e) {
      console.warn('Vereinsverwaltung check fehlgeschlagen:', e?.message);
    }
  };

  // 1. Hilfsfunktion zum Rendern der verschiedenen Tab-Inhalte
  const [isMenuOpen, setIsMenuOpen] = useState(false); // Steuert, ob das Menü offen ist
  const renderContent = () => {switch (activeTab) {

      //HOME BEREICH
      case 0:
        return (
          <ScrollView showsVerticalScrollIndicator={false} style={styles.feedScroll}>
            {/* HERO CARD (TOP STORY) */}
            <TouchableOpacity activeOpacity={0.9} style={styles.heroCard}>
              <ImageBackground 
                source={{ uri: 'https://images.unsplash.com/photo-1587280501635-68a0e82cd5ff?q=80&w=1000' }}
                style={styles.heroImage}
                imageStyle={{ borderRadius: 24 }}
              >
                <View style={styles.overlay}>
                  <View style={styles.tagContainer}>
                    <View style={styles.topStoryTag}>
                      <Text style={styles.topStoryTagText}>TOP STORY</Text>
                    </View>
                    <Text style={styles.leagueTag}>GFL</Text>
                  </View>
                  <Text style={styles.heroHeadline}>GFL 2026: SAISONAUFTAKT MIT PAUKENSCHLAG</Text>
                  <Text style={styles.heroTeaser} numberOfLines={2}>
                    Die Schwäbisch Hall Unicorns bezwingen den amtierenden Meister in einem dramatischen Finish...
                  </Text>
                  <View style={styles.ctaContainer}>
                    <Text style={styles.ctaText}>JETZT LESEN</Text>
                    <ChevronRight size={16} color="#9ef01a" />
                  </View>
                </View>
              </ImageBackground>
            </TouchableOpacity>

           {/* REGIONAL FILTER – aktiv = ROT */}
            <Text style={{ color: '#6B7280', fontSize: 10, fontWeight: '800', letterSpacing: 1, marginLeft: 16, marginBottom: 6 }}>
              📍 REGION AUSWÄHLEN
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={[styles.filterScroll, { marginBottom: 12 }]}>
              {REGIONS.map((region, index) => (
                <TouchableOpacity
                  key={index}
                  style={[styles.filterTab, activeRegion === index && { backgroundColor: '#C01830', borderColor: '#C01830' }]}
                  onPress={() => setActiveRegion(index)}
                >
                  <Text style={[styles.filterTabText, activeRegion === index && styles.activeFilterTabText]}>
                    {region}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* LIGEN FILTER – aktiv = BLAU */}
            <Text style={{ color: '#6B7280', fontSize: 10, fontWeight: '800', letterSpacing: 1, marginLeft: 16, marginBottom: 6, marginTop: 4 }}>
              🏈 LIGA AUSWÄHLEN
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
              {LIGEN.map((item, index) => (
                <TouchableOpacity
                  key={index}
                  style={[styles.filterTab, activeLeague === index && styles.activeFilterTab]}
                  onPress={() => setActiveLeague(index)}
                >
                  <Text style={[styles.filterTabText, activeLeague === index && styles.activeFilterTabText]}>
                    {item}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            
           {/* 3. BLOCK: ENDSTÄNDE VOM WOCHENENDE MIT WAPPEN */}
            <Text style={{ color: '#6B7280', fontSize: 10, fontWeight: '800', letterSpacing: 1, marginLeft: 16, marginBottom: 10, marginTop: 20 }}>
              🏁 ENDSTÄNDE VOM WOCHENENDE
            </Text>
            
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ paddingLeft: 16, flexDirection: 'row' }}>

              {/* Spiel 1 */}
              <View style={styles.scoreCard}>
                <Text style={styles.scoreLeague}>GFL 1 • REGION SÜD</Text>
                
                <View style={styles.scoreRow}>
                  <View style={styles.teamContainer}>
                    <Image source={{ uri: 'https://placehold.co/40/161F38/9ef01a?text=U' }} style={styles.teamLogo} />
                    <Text style={[styles.teamName, styles.winnerTeam]} numberOfLines={1}>Schw. Hall Unicorns</Text>
                  </View>
                  <Text style={[styles.teamScore, styles.winnerScore]}>34</Text>
                </View>
                
                <View style={styles.scoreRow}>
                  <View style={styles.teamContainer}>
                    <Image source={{ uri: 'https://placehold.co/40/161F38/7C8BA1?text=C' }} style={styles.teamLogo} />
                    <Text style={styles.teamName} numberOfLines={1}>Allgäu Comets</Text>
                  </View>
                  <Text style={styles.teamScore}>21</Text>
                </View>

                {/* Untere Zeile mit Status & klickbarem Spielverlauf */}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, paddingTop: 8, borderTopWidth: 1, borderTopColor: '#D1D8F0' }}>
                  <TouchableOpacity activeOpacity={0.7} onPress={() => setSelectedGame({ id: 1, name: 'Unicorns vs Comets' })}>
                    <Text style={{ color: '#C01830', fontSize: 10, fontWeight: '800', letterSpacing: 0.5 }}>SPIELVERLAUF ➔</Text>
                  </TouchableOpacity>
                  <Text style={{ color: '#6B7280', fontSize: 9, fontWeight: '700' }}>FT</Text>
                </View>
              </View>

              {/* Spiel 2 */}
              <View style={styles.scoreCard}>
                <Text style={styles.scoreLeague}>DBFX (FRAUEN)</Text>
                <View style={styles.scoreRow}>
                  <View style={styles.teamContainer}>
                    <Image source={{ uri: 'https://placehold.co/40/F0F4FF/1A2F6E?text=S' }} style={styles.teamLogo} />
                    <Text style={styles.teamName} numberOfLines={1}>Stuttgart Scorpions</Text>
                  </View>
                  <Text style={styles.teamScore}>12</Text>
                </View>
                <View style={styles.scoreRow}>
                  <View style={styles.teamContainer}>
                    <Image source={{ uri: 'https://placehold.co/40/F0F4FF/C01830?text=K' }} style={styles.teamLogo} />
                    <Text style={[styles.teamName, styles.winnerTeam]} numberOfLines={1}>Berlin Kobra Ladies</Text>
                  </View>
                  <Text style={[styles.teamScore, styles.winnerScore]}>28</Text>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, paddingTop: 8, borderTopWidth: 1, borderTopColor: '#D1D8F0' }}>
                  <TouchableOpacity activeOpacity={0.7} onPress={() => setSelectedGame({ id: 2, name: 'Scorpion vs Ladies' })}>
                    <Text style={{ color: '#C01830', fontSize: 10, fontWeight: '800', letterSpacing: 0.5 }}>SPIELVERLAUF ➔</Text>
                  </TouchableOpacity>
                  <Text style={{ color: '#6B7280', fontSize: 9, fontWeight: '700' }}>FT</Text>
                </View>
              </View>

              {/* Spiel 3 */}
              <View style={styles.scoreCard}>
                <Text style={styles.scoreLeague}>BAWÜ-LIGA</Text>
                <View style={styles.scoreRow}>
                  <View style={styles.teamContainer}>
                    <Image source={{ uri: 'https://placehold.co/40/F0F4FF/C01830?text=M' }} style={styles.teamLogo} />
                    <Text style={[styles.teamName, styles.winnerTeam]} numberOfLines={1}>Kuchen Mammuts</Text>
                  </View>
                  <Text style={[styles.teamScore, styles.winnerScore]}>14</Text>
                </View>
                <View style={styles.scoreRow}>
                  <View style={styles.teamContainer}>
                    <Image source={{ uri: 'https://placehold.co/40/F0F4FF/1A2F6E?text=S' }} style={styles.teamLogo} />
                    <Text style={styles.teamName} numberOfLines={1}>Freiburg Sacristans</Text>
                  </View>
                  <Text style={styles.teamScore}>07</Text>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, paddingTop: 8, borderTopWidth: 1, borderTopColor: '#D1D8F0' }}>
                  <TouchableOpacity activeOpacity={0.7} onPress={() => setSelectedGame({ id: 3, name: 'Mammuts vs Sancristans' })}>
                    <Text style={{ color: '#C01830', fontSize: 10, fontWeight: '800', letterSpacing: 0.5 }}>SPIELVERLAUF ➔</Text>
                  </TouchableOpacity>
                  <Text style={{ color: '#6B7280', fontSize: 9, fontWeight: '700' }}>FT</Text>
                </View>
              </View>
              
              <View style={{ width: 32 }} />
            </ScrollView>

            {/* 4. BLOCK: MEDIA BEITRÄGE (HERO-STYLE) */}
            <Text style={{ color: '#6B7280', fontSize: 10, fontWeight: '800', letterSpacing: 1, marginLeft: 16, marginBottom: 12, marginTop: 24 }}>
              📸 HIGHLIGHTS VOM SPIELFELDRAND
            </Text>

            <TouchableOpacity style={styles.mediaCard} activeOpacity={0.9}>
              <ImageBackground 
                source={{ uri: 'https://images.unsplash.com/photo-1566577739112-5180d4bf9390?auto=format&fit=crop&w=800&q=80' }} 
                style={{ height: 180, width: '100%', justifyContent: 'flex-start', alignItems: 'flex-start' }}
                imageStyle={{ borderTopLeftRadius: 16, borderTopRightRadius: 16 }}
              >
                <View style={{ backgroundColor: '#C01830', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6, marginTop: 12, marginLeft: 12 }}>
                  <Text style={{ color: '#FFFFFF', fontSize: 10, fontWeight: '900', letterSpacing: 1 }}>MEDIA</Text>
                </View>
              </ImageBackground>

              <View style={{ padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: '#1A2F6E', fontSize: 16, fontWeight: '800', letterSpacing: 0.5 }}>BILDER VOM LETZTEN GAMEDAY</Text>
                  <Text style={{ color: '#6B7280', fontSize: 12, fontWeight: '500', marginTop: 4, lineHeight: 16 }}>
                    Die besten Schnappschüsse, Touchdown-Momente und Fan-Choreos vom Wochenende in der Galerie.
                  </Text>
                </View>
                <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: '#F0F4FF', justifyContent: 'center', alignItems: 'center', marginLeft: 12 }}>
                  <Text style={{ color: '#C01830', fontSize: 14, fontWeight: 'bold' }}>➔</Text>
                </View>
              </View>
            </TouchableOpacity>

            <View style={{ height: 140 }} />
          </ScrollView>
        );
      case 1:
        return <LigenScreen />;
        
      case 2:
        return <ChatScreen />;
        
      case 3:
        return <SucheScreen />;

      case 4:
        return <ProfilScreen refreshKey={profileRefreshKey} />;

      default:
        return null;
    }
  };
  if (!authReady) {
    return (
      <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFFFFF' }}>
        <ActivityIndicator size="large" color="#1A2F6E" />
      </SafeAreaView>
    );
  }

  if (authState === 'landing') {
    return (
      <LandingScreen
        onLogin={() => setAuthState('login')}
        onRegister={() => setAuthState('register')}
      />
    );
  }

  if (authState === 'login') {
    return (
      <LoginScreen
        onBack={() => setAuthState('landing')}
        onSuccess={() => setAuthState('app')}
      />
    );
  }

  if (authState === 'register') {
    return (
      <PlayerOnboardingFlow onComplete={() => setAuthState('app')} />
    );
  }

  return (
    <SafeAreaView style={styles.container}><StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      {/* TOP BAR (HEADER) */}
      <View style={styles.header}>
        <View style={styles.logoContainer}>
          <View style={styles.logoBadge}>
            <Trophy size={20} color="#FFFFFF" />
          </View>
          
          <View>
            <Text style={styles.logoText}>FIELDNET<Text style={styles.logoGreen}> </Text></Text>
            <Text style={styles.subtitle}>TRACKER / COMMUNITY</Text>
          </View>
        </View>
        
        <View style={styles.headerActions}>
          <TouchableOpacity 
            style={styles.burgerButton}
            onPress={() => setIsMenuOpen(true)}
          >
            <Menu size={24} color="#1A2F6E" />
          </TouchableOpacity>
        </View>
      </View>

      {/* DYNAMISCHER INHALT JE NACH AKTIVEM TAB ODER AUSGEWÄHLTEM SPIEL */}
{selectedGame ? (
  <TimelineScreen onBack={() => setSelectedGame(null)} />
) : (
  renderContent()
)}
      

      {/* SCHWEBENDE BOTTOM NAVIGATION BAR + BANNER */}
      <View style={styles.navBarWrapper}>
      

        {/* DIE KORRIGIERTE 5-TAB NAVBAR */}
        <View style={styles.navBar}>
          {/* 0. HOME / NEWS TAB */}
          <TouchableOpacity 
            style={activeTab === 0 ? styles.activeNavTab : styles.navTab}
            onPress={() => { setActiveTab(0); setSelectedGame(null); }}
          >
            <Home size={20} color={activeTab === 0 ? "#FFFFFF" : "#A0AFCF"} />
            {activeTab === 0 && <Text style={styles.activeNavTabText}>NEWS</Text>}
          </TouchableOpacity>

          {/* 1. LIGEN TAB */}
          <TouchableOpacity 
            style={activeTab === 1 ? styles.activeNavTab : styles.navTab}
            onPress={() => { setActiveTab(1); setSelectedGame(null); }}
          >
            <LayoutGrid size={22} color={activeTab === 1 ? "#FFFFFF" : "#A0AFCF"} />
            {activeTab === 1 && <Text style={styles.activeNavTabText}>LIGEN</Text>}
          </TouchableOpacity>

          {/* 2. CHATS / COMMUNITY TAB */}
          <TouchableOpacity 
            style={activeTab === 2 ? styles.activeNavTab : styles.navTab}
            onPress={() => { setActiveTab(2); setSelectedGame(null); }}
          >
            <MessageSquare size={22} color={activeTab === 2 ? "#FFFFFF" : "#A0AFCF"} />
            {activeTab === 2 && <Text style={styles.activeNavTabText}>CHATS</Text>}
          </TouchableOpacity>

          {/* 3. SUCHE TAB */}
          <TouchableOpacity 
            style={activeTab === 3 ? styles.activeNavTab : styles.navTab}
            onPress={() => { setActiveTab(3); setSelectedGame(null); }}
          >
            <Search size={22} color={activeTab === 3 ? "#FFFFFF" : "#A0AFCF"} />
            {activeTab === 3 && <Text style={styles.activeNavTabText}>SUCHE</Text>}
          </TouchableOpacity>

          {/* 4. PROFIL TAB */}
          <TouchableOpacity 
            style={activeTab === 4 ? styles.activeNavTab : styles.navTab}
            onPress={() => { setActiveTab(4); setSelectedGame(null); }}
          >
            <User size={22} color={activeTab === 4 ? "#FFFFFF" : "#A0AFCF"} />
            {activeTab === 4 && <Text style={styles.activeNavTabText}>PROFIL</Text>}
          </TouchableOpacity>
        </View>
      </View>

      {/* EINSTELLUNGEN */}
      {showSettings && !showDeleteProfile && (
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#FFFFFF', zIndex: 200 }}>
          <SettingsScreen
            onBack={() => setShowSettings(false)}
            onDeleteAccount={() => setShowDeleteProfile(true)}
            onTeamLeft={bumpProfileRefresh}
          />
        </View>
      )}

      {/* KONTO LÖSCHEN */}
      {showDeleteProfile && (
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#FFFFFF', zIndex: 210 }}>
          <DeleteProfileScreen
            onBack={() => setShowDeleteProfile(false)}
            onDeleted={handleAccountDeleted}
          />
        </View>
      )}

      {/* LIVE-TICKER (Code-Gate → Ticker) */}
      {showTickerFlow && (
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#FFFFFF', zIndex: 220 }}>
          {tickerGame ? (
            <TickerScreen
              game={tickerGame}
              onBack={() => setTickerGame(null)}
              onExit={closeTickerFlow}
            />
          ) : (
            <TickerCodeScreen
              onBack={closeTickerFlow}
              onSuccess={(game) => setTickerGame(game)}
            />
          )}
        </View>
      )}

      {/* VEREINSVERWALTUNG – DASHBOARD (Trainer mit Team) */}
      {showTeamDashboard && dashboardTeamId && (
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#FFFFFF', zIndex: 200 }}>
          <TeamDashboardScreen
            teamId={dashboardTeamId}
            onBack={() => { setShowTeamDashboard(false); setDashboardTeamId(null); }}
            onTeamLeft={bumpProfileRefresh}
            onOpenTicker={() => {
              setShowTeamDashboard(false);
              setDashboardTeamId(null);
              openTickerFlow();
            }}
          />
        </View>
      )}

      {/* VEREINSVERWALTUNG – COACH ONBOARDING (Trainer ohne Team) */}
      {showTeamCreation && (
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#FFFFFF', zIndex: 200 }}>
          <CoachOnboardingWizard
            onBack={() => setShowTeamCreation(false)}
            onSuccess={(teamId) => {
              setShowTeamCreation(false);
              setDashboardTeamId(teamId);
              setShowTeamDashboard(true);
              setUserRole('coach');
            }}
          />
        </View>
      )}

      {/* SEITENMENÜ OVERLAY (DRAWER) */}
      {isMenuOpen && (
        <View style={styles.drawerOverlay}>
          <TouchableOpacity style={styles.drawerCloseDetector} activeOpacity={1} onPress={() => setIsMenuOpen(false)}/>
          
          <View style={styles.drawerContainer}>
            <View style={styles.drawerHeader}>
              <TouchableOpacity onPress={() => setIsMenuOpen(false)} style={styles.drawerCloseButton}>
                <X size={24} color="#1A2F6E" />
              </TouchableOpacity>
            </View>

            {/* Menüpunkte im Seitenmenü */}
            <ScrollView style={styles.drawerMenuScroll} showsVerticalScrollIndicator={false}>
              {[
                { label: 'Live-Ticker starten', icon: <PlusCircle size={20} color="#C01830" />, action: openTickerFlow },
                userRole === 'coach' ? { label: 'Vereinsverwaltung', icon: <Trophy size={20} color="#1A2F6E" />, action: handleVerwaltung } : null,
                { label: 'Einstellungen', icon: <LayoutGrid size={20} color="#1A2F6E" />, action: () => setShowSettings(true) },
                { label: 'Feedback geben', icon: <MessageSquare size={20} color="#1A2F6E" /> },
                { label: 'Problem melden', icon: <Bell size={20} color="#1A2F6E" /> },
                { label: 'Über Fieldnet', icon: <Trophy size={20} color="#1A2F6E" /> },
                { label: 'Datenschutz', icon: <Users size={20} color="#1A2F6E" /> },
                { label: 'Impressum', icon: <Users size={20} color="#1A2F6E" /> },
              ].filter(Boolean).map((item, index) => (
                <TouchableOpacity 
                  key={index} 
                  style={styles.drawerItem}
                  onPress={() => {
                    setIsMenuOpen(false);
                    if(item.action) {
                      item.action();
                    } else {
                      console.log(`${item.label} geklickt`);
                    }
                  }}
                >
                  <View style={styles.drawerItemIconWrapper}>{item.icon}</View>
                  <Text style={[
                    styles.drawerItemText,
                    item.label === 'Live-Ticker starten' && { color: '#C01830', fontWeight: '750' }
                  ]}>
                    {item.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* ABMELDEN */}
            <View style={styles.drawerSignOutWrap}>
              <TouchableOpacity style={styles.drawerSignOutBtn} onPress={handleSignOut} activeOpacity={0.85}>
                <LogOut size={18} color="#C01830" />
                <Text style={styles.drawerSignOutText}>Abmelden</Text>
              </TouchableOpacity>
            </View>

          </View>
        </View>
      )}
    </SafeAreaView>
  );
}