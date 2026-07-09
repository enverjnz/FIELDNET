import React, { useState, useEffect } from 'react';

//Component import
import { 
  Text, View, 
  ScrollView, TouchableOpacity, SafeAreaView, 
  StatusBar, Alert, ActivityIndicator, Keyboard } from 'react-native';

// Alle benötigten Icons in einem einzigen Import zusammengefasst
import { Trophy, Bell, Search, 
  User, ChevronRight, Home, 
  LayoutGrid, CalendarDays, 
  MessageSquare, Users, 
  PlusCircle, Menu, X, LogOut, Zap } from 'lucide-react-native';

//Screen imports
import styles from './HomeScreen.styles';
import LigenScreen from './screens/LigenScreen.js';
import TermineScreen from './screens/TermineScreen';
import ChatScreen from './screens/ChatScreen.js';
import SucheScreen from './screens/SucheScreen.js';
import TickerScreen from './screens/TickerScreen';
import TickerCodeScreen from './screens/TickerCodeScreen';
import { fetchTickerGameById } from './lib/validateTickerAccess';
import TimelineScreen from './screens/TimelineScreen.js';
import ProfilScreen from './screens/ProfilScreen.js';
import CoachOnboardingWizard from './screens/onboarding/CoachOnboardingWizard';
import InvoiceCodeScreen from './screens/InvoiceCodeScreen';
import TeamDashboardScreen from './screens/TeamDashboardScreen.js';
import PlayerOnboardingFlow from './screens/onboarding/PlayerOnboardingFlow';
import LandingScreen from './screens/auth/LandingScreen';
import LoginScreen from './screens/auth/LoginScreen';
import SettingsScreen from './screens/SettingsScreen';
import DeleteProfileScreen from './screens/DeleteProfileScreen';
import ReportProblemScreen from './screens/ReportProblemScreen';
import { supabase } from './lib/supabase';
import { getCoachVerwaltungState, CoachPendingError } from './lib/invoiceCode';
import HomeFeed from './components/HomeFeed';
import MasterFilterBar from './components/MasterFilterBar';


export default function App() {
  
  const [activeTab, setActiveTab] = useState(0); // 0 bedeutet 'NEWS' ist am Anfang aktiv
  const [selectedGame, setSelectedGame] = useState(null); // kein Spiel ausgewählt
  const [showTeamCreation, setShowTeamCreation]   = useState(false);
  const [showInvoiceCode, setShowInvoiceCode]     = useState(false);
  const [pendingInviteCodeId, setPendingInviteCodeId] = useState(null);
  const [showTeamDashboard, setShowTeamDashboard] = useState(false);
  const [dashboardTeamId, setDashboardTeamId]     = useState(null);
  const [userRole, setUserRole]                   = useState(null);
  const [authState, setAuthState]                 = useState('landing');
  const [authReady, setAuthReady]                 = useState(false);
  const [showSettings, setShowSettings]           = useState(false);
  const [showReportProblem, setShowReportProblem] = useState(false);
  const [showDeleteProfile, setShowDeleteProfile] = useState(false);
  const [showTickerFlow, setShowTickerFlow]       = useState(false);
  const [tickerGame, setTickerGame]               = useState(null);
  const [tickerSessionGame, setTickerSessionGame] = useState(null);
  const [profileRefreshKey, setProfileRefreshKey] = useState(0);
  const [sucheResetKey, setSucheResetKey]         = useState(0);
  const [profilResetKey, setProfilResetKey]         = useState(0);
  const [isMenuOpen, setIsMenuOpen]                 = useState(false);
  const [pendingChatConversationId, setPendingChatConversationId] = useState(null);

  const bumpProfileRefresh = () => setProfileRefreshKey((k) => k + 1);

  const openChatConversation = (conversationId) => {
    if (!conversationId) return;
    Keyboard.dismiss();
    setPendingChatConversationId(conversationId);
    setActiveTab(2);
    setSelectedGame(null);
    setIsMenuOpen(false);
    setShowSettings(false);
    setShowReportProblem(false);
    setShowDeleteProfile(false);
    setShowTeamDashboard(false);
    setDashboardTeamId(null);
    setShowInvoiceCode(false);
    setShowTeamCreation(false);
    setPendingInviteCodeId(null);
    setShowTickerFlow(false);
    setTickerGame(null);
  };

  const goToTab = (index) => {
    const reselect = index === activeTab && !selectedGame;
    Keyboard.dismiss();
    setActiveTab(index);
    setSelectedGame(null);
    setIsMenuOpen(false);
    setShowSettings(false);
    setShowReportProblem(false);
    setShowDeleteProfile(false);
    setShowTeamDashboard(false);
    setDashboardTeamId(null);
    setShowInvoiceCode(false);
    setShowTeamCreation(false);
    setPendingInviteCodeId(null);
    setShowTickerFlow(false);
    setTickerGame(null);
    if (reselect && index === 3) setSucheResetKey((k) => k + 1);
    if (reselect && index === 4) setProfilResetKey((k) => k + 1);
  };

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
    setShowReportProblem(false);
    setIsMenuOpen(false);
    setActiveTab(0);
    setSelectedGame(null);
    setShowTeamDashboard(false);
    setShowTeamCreation(false);
    setShowInvoiceCode(false);
    setPendingInviteCodeId(null);
    setDashboardTeamId(null);
    setUserRole(null);
    setShowTickerFlow(false);
    setTickerGame(null);
    setTickerSessionGame(null);
    setAuthState('landing');
  };

  const refreshTickerSessionGame = async (gameHint) => {
    if (!gameHint?.id) return gameHint ?? null;
    const fresh = await fetchTickerGameById(gameHint.id);
    return fresh ?? gameHint;
  };

  const isGameFinished = (game) => (game?.status ?? '').toLowerCase() === 'finished';

  const syncTickerSessionGame = (game) => {
    if (game && !isGameFinished(game)) {
      setTickerSessionGame(game);
      return game;
    }
    setTickerSessionGame(null);
    return null;
  };

  const openTickerFlow = async () => {
    setIsMenuOpen(false);
    setShowTickerFlow(true);
    if (tickerSessionGame?.id) {
      const game = await refreshTickerSessionGame(tickerSessionGame);
      const session = syncTickerSessionGame(game);
      setTickerGame(session);
    } else {
      setTickerGame(null);
    }
  };

  const openTickerForGame = async (gameId) => {
    const game = await fetchTickerGameById(gameId);
    if (!game) {
      Alert.alert('Fehler', 'Spiel konnte nicht geladen werden.');
      return;
    }
    syncTickerSessionGame(game);
    setTickerGame(game);
    setShowTeamDashboard(false);
    setDashboardTeamId(null);
    setShowTickerFlow(true);
  };

  const leaveTickerMask = async () => {
    setShowTickerFlow(false);
    setTickerGame(null);
    if (tickerSessionGame?.id) {
      const fresh = await refreshTickerSessionGame(tickerSessionGame);
      syncTickerSessionGame(fresh);
    }
  };

  const closeTickerFlow = () => {
    setShowTickerFlow(false);
    setTickerGame(null);
  };

  const handleTickerValidated = (game) => {
    setTickerGame(game);
    syncTickerSessionGame(game);
  };

  const resumeTickerSession = async () => {
    if (!tickerSessionGame) return;
    const game = await refreshTickerSessionGame(tickerSessionGame);
    const session = syncTickerSessionGame(game);
    if (!session) return;
    setTickerGame(session);
    setShowTickerFlow(true);
  };

  const handleTickerGameUpdated = (updatedGame) => {
    if (!updatedGame) return;
    setTickerGame(updatedGame);
    if (isGameFinished(updatedGame)) {
      setTickerSessionGame(null);
    } else {
      setTickerSessionGame(updatedGame);
    }
  };

  const dismissTickerSession = () => {
    setTickerSessionGame(null);
    setTickerGame(null);
  };

  const confirmDismissTickerSession = () => {
    Alert.alert(
      'Ticker schließen',
      'Möchtest du die Ticker-Session wirklich beenden? Du musst den Code erneut eingeben, um wieder zuzugreifen.',
      [
        { text: 'Abbrechen', style: 'cancel' },
        { text: 'Schließen', style: 'destructive', onPress: dismissTickerSession },
      ],
    );
  };

  const tickerSessionLabel = (game) => {
    if (!game) return 'Live-Ticker';
    const home = game.home_team?.name ?? game.home_team?.short_name ?? 'Heim';
    const away = game.away_team_name ?? 'Gast';
    return `${home} vs ${away}`;
  };

  const showTickerReturnBanner = Boolean(
    tickerSessionGame
    && !isGameFinished(tickerSessionGame)
    && !showTickerFlow
    && !showSettings
    && !showReportProblem
    && !showDeleteProfile
    && !showTeamDashboard
    && !showInvoiceCode
    && !showTeamCreation
    && !selectedGame,
  );

  const handleSignOut = () => {
    Alert.alert('Abmelden', 'Möchtest du dich wirklich abmelden?', [
      { text: 'Abbrechen', style: 'cancel' },
      {
        text: 'Abmelden', style: 'destructive',
        onPress: async () => {
          setIsMenuOpen(false);
          setShowTickerFlow(false);
          setTickerGame(null);
          setTickerSessionGame(null);
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

      const state = await getCoachVerwaltungState(user.id);

      if (state.route === 'dashboard') {
        setDashboardTeamId(state.teamId);
        setShowTeamDashboard(true);
      } else if (state.route === 'wizard') {
        setPendingInviteCodeId(state.inviteCodeId);
        setShowTeamCreation(true);
      } else {
        setShowInvoiceCode(true);
      }
    } catch (e) {
      if (e instanceof CoachPendingError) {
        Alert.alert(
          'Anfrage läuft',
          'Deine Trainer-Anfrage wartet auf Freigabe durch den Verein. Du erhältst Zugriff, sobald du angenommen wurdest.',
        );
        return;
      }
      console.warn('Vereinsverwaltung check fehlgeschlagen:', e?.message);
    }
  };

  const showMasterFilter = !selectedGame && (activeTab === 0 || activeTab === 1 || activeTab === 2);

  const renderHomeTab = () => <HomeFeed />;

  const renderActiveTab = () => {
    switch (activeTab) {
      case 0:
        return renderHomeTab();
      case 1:
        return <LigenScreen />;
      case 2:
        return (
          <ChatScreen
            initialConversationId={pendingChatConversationId}
            onInitialConversationHandled={() => setPendingChatConversationId(null)}
          />
        );
      case 3:
        return (
          <SucheScreen
            key={sucheResetKey}
            onOpenChat={openChatConversation}
          />
        );
      case 4:
        return <ProfilScreen key={profilResetKey} refreshKey={profileRefreshKey} />;
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

      {/* TICKER-SESSION: Zurück zur Maske ohne Code */}
      {showTickerReturnBanner && (
        <TouchableOpacity
          style={styles.tickerReturnBanner}
          onPress={resumeTickerSession}
          activeOpacity={0.88}
        >
          <View style={styles.tickerReturnBannerIcon}>
            <Zap size={18} color="#FFFFFF" />
          </View>
          <View style={styles.tickerReturnBannerTextWrap}>
            <Text style={styles.tickerReturnBannerTitle}>Live-Ticker fortsetzen</Text>
            <Text style={styles.tickerReturnBannerSub} numberOfLines={1}>
              {tickerSessionLabel(tickerSessionGame)}
              {tickerSessionGame?.game_code ? ` · ${tickerSessionGame.game_code}` : ''}
            </Text>
          </View>
          <ChevronRight size={20} color="#FFFFFF" />
          <TouchableOpacity
            onPress={(e) => {
              e?.stopPropagation?.();
              confirmDismissTickerSession();
            }}
            hitSlop={10}
            style={styles.tickerReturnBannerClose}
          >
            <X size={18} color="#FFFFFF" />
          </TouchableOpacity>
        </TouchableOpacity>
      )}

      {showMasterFilter ? <MasterFilterBar compact /> : null}

      {/* DYNAMISCHER INHALT JE NACH AKTIVEM TAB ODER AUSGEWÄHLTEM SPIEL */}
      <View style={{ flex: 1, overflow: 'hidden' }}>
        {selectedGame ? (
          <TimelineScreen gameId={selectedGame.id} onBack={() => setSelectedGame(null)} />
        ) : (
          renderActiveTab()
        )}
      </View>
      

      {/* SCHWEBENDE BOTTOM NAVIGATION BAR + BANNER */}
      <View style={styles.navBarWrapper}>
      

        {/* DIE KORRIGIERTE 5-TAB NAVBAR */}
        <View style={styles.navBar}>
          <TouchableOpacity
            style={[styles.navTabItem, activeTab === 0 && styles.navTabItemActive]}
            onPress={() => goToTab(0)}
            activeOpacity={0.75}
          >
            <Home size={22} color={activeTab === 0 ? '#FFFFFF' : '#A0AFCF'} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.navTabItem, activeTab === 1 && styles.navTabItemActive]}
            onPress={() => goToTab(1)}
            activeOpacity={0.75}
          >
            <LayoutGrid size={22} color={activeTab === 1 ? '#FFFFFF' : '#A0AFCF'} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.navTabItem, activeTab === 2 && styles.navTabItemActive]}
            onPress={() => goToTab(2)}
            activeOpacity={0.75}
          >
            <MessageSquare size={22} color={activeTab === 2 ? '#FFFFFF' : '#A0AFCF'} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.navTabItem, activeTab === 3 && styles.navTabItemActive]}
            onPress={() => goToTab(3)}
            activeOpacity={0.75}
          >
            <Search size={22} color={activeTab === 3 ? '#FFFFFF' : '#A0AFCF'} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.navTabItem, activeTab === 4 && styles.navTabItemActive]}
            onPress={() => goToTab(4)}
            activeOpacity={0.75}
          >
            <User size={22} color={activeTab === 4 ? '#FFFFFF' : '#A0AFCF'} />
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

      {/* PROBLEM MELDEN */}
      {showReportProblem && (
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#FFFFFF', zIndex: 205 }}>
          <ReportProblemScreen onBack={() => setShowReportProblem(false)} />
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
              key={tickerGame.id}
              game={tickerGame}
              onBack={leaveTickerMask}
              onExit={leaveTickerMask}
              onGameUpdated={handleTickerGameUpdated}
            />
          ) : (
            <TickerCodeScreen
              onBack={closeTickerFlow}
              onSuccess={handleTickerValidated}
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
            onOpenLiveTicker={(gameId) => openTickerForGame(gameId)}
          />
        </View>
      )}

      {/* VEREINSVERWALTUNG – RECHNUNGSCODE (Gründungs-Coach ohne Code) */}
      {showInvoiceCode && (
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#FFFFFF', zIndex: 200 }}>
          <InvoiceCodeScreen
            onBack={() => setShowInvoiceCode(false)}
            onSuccess={(inviteCodeId) => {
              setPendingInviteCodeId(inviteCodeId);
              setShowInvoiceCode(false);
              setShowTeamCreation(true);
            }}
          />
        </View>
      )}

      {/* VEREINSVERWALTUNG – COACH ONBOARDING (Code eingelöst, Team anlegen) */}
      {showTeamCreation && pendingInviteCodeId && (
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#FFFFFF', zIndex: 200 }}>
          <CoachOnboardingWizard
            inviteCodeId={pendingInviteCodeId}
            onBack={() => setShowTeamCreation(false)}
            onSuccess={(teamId) => {
              setShowTeamCreation(false);
              setPendingInviteCodeId(null);
              setDashboardTeamId(teamId);
              setShowTeamDashboard(true);
              setUserRole('coach');
              bumpProfileRefresh();
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
                { label: 'Problem melden', icon: <Bell size={20} color="#1A2F6E" />, action: () => setShowReportProblem(true) },
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