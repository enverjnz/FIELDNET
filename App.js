import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import * as Linking from 'expo-linking';

//Component import
import { 
  Text, View, Image,
  ScrollView, TouchableOpacity, SafeAreaView, 
  StatusBar, Alert, ActivityIndicator, Keyboard } from 'react-native';

// Alle benötigten Icons in einem einzigen Import zusammengefasst
import { Trophy, Bell, Search, 
  User, ChevronRight, Home, 
  LayoutGrid, CalendarDays, 
  MessageSquare, Users, 
  PlusCircle, Menu, X, LogOut } from 'lucide-react-native';

//Screen imports
import { createAppStyles } from './theme/appStyles';
import { useTheme } from './context/ThemeContext';
import { useFilter } from './context/FilterContext';
import LigenScreen from './screens/LigenScreen.js';
import TermineScreen from './screens/TermineScreen';
import ChatScreen from './screens/ChatScreen.js';
import SucheScreen from './screens/SucheScreen.js';
import TickerScreen from './screens/TickerScreen';
import TickerCodeScreen from './screens/TickerCodeScreen';
import { fetchTickerGameById } from './lib/validateTickerAccess';
import TimelineScreen from './screens/TimelineScreen.js';
import ProfilScreen from './screens/ProfilScreen.js';
import LivePulseDot from './components/LivePulseDot';
import CoachOnboardingWizard from './screens/onboarding/CoachOnboardingWizard';
import InvoiceCodeScreen from './screens/InvoiceCodeScreen';
import TeamDashboardScreen from './screens/TeamDashboardScreen.js';
import PlayerOnboardingFlow from './screens/onboarding/PlayerOnboardingFlow';
import LandingScreen from './screens/auth/LandingScreen';
import LoginScreen from './screens/auth/LoginScreen';
import VerifyEmailScreen from './screens/auth/VerifyEmailScreen';
import ForgotPasswordScreen from './screens/auth/ForgotPasswordScreen';
import ResetPasswordScreen from './screens/auth/ResetPasswordScreen';
import SettingsScreen from './screens/SettingsScreen';
import AccountInfoScreen from './screens/AccountInfoScreen';
import DeleteProfileScreen from './screens/DeleteProfileScreen';
import ReportProblemScreen from './screens/ReportProblemScreen';
import FeedbackScreen from './screens/FeedbackScreen';
import DatenschutzScreen from './screens/DatenschutzScreen';
import ImpressumScreen from './screens/ImpressumScreen';
import { supabase } from './lib/supabase';
import { handleAuthRedirectUrl, isEmailConfirmed } from './lib/authRedirect';
import { finishPendingOnboardingIfNeeded } from './lib/completeOnboarding';
import { getCoachVerwaltungState, CoachPendingError } from './lib/invoiceCode';
import { hasUnreadChats, subscribeToIncomingMessages } from './lib/chat';
import HomeFeed from './components/HomeFeed';
import MasterFilterBar from './components/MasterFilterBar';
import PostCreateScreen from './screens/PostCreateScreen';


export default function App() {
  const { colors } = useTheme();
  const { refreshCatalog } = useFilter();
  const styles = useMemo(() => createAppStyles(colors), [colors]);

  const [activeTab, setActiveTab] = useState(0); // 0 bedeutet 'NEWS' ist am Anfang aktiv
  const [selectedGame, setSelectedGame] = useState(null); // kein Spiel ausgewählt
  const [showTeamCreation, setShowTeamCreation]   = useState(false);
  const [showInvoiceCode, setShowInvoiceCode]     = useState(false);
  const [pendingInviteCodeId, setPendingInviteCodeId] = useState(null);
  const [showTeamDashboard, setShowTeamDashboard] = useState(false);
  const [dashboardTeamId, setDashboardTeamId]     = useState(null);
  const [userRole, setUserRole]                   = useState(null);
  const [headerAvatarUrl, setHeaderAvatarUrl]     = useState(null);
  const [headerInitials, setHeaderInitials]       = useState('?');
  const [headerAvatarKey, setHeaderAvatarKey]     = useState(0);
  const [authState, setAuthState]                 = useState('landing');
  const [verifyEmail, setVerifyEmail]             = useState('');
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');
  const [authReady, setAuthReady]                 = useState(false);
  const [showSettings, setShowSettings]           = useState(false);
  const [showAccountInfo, setShowAccountInfo]     = useState(false);
  const [showReportProblem, setShowReportProblem] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [showDatenschutz, setShowDatenschutz] = useState(false);
  const [showImpressum, setShowImpressum] = useState(false);
  const [showDeleteProfile, setShowDeleteProfile] = useState(false);
  const [showTickerFlow, setShowTickerFlow]       = useState(false);
  const [tickerGame, setTickerGame]               = useState(null);
  const [tickerSessionGame, setTickerSessionGame] = useState(null);
  const [profileRefreshKey, setProfileRefreshKey] = useState(0);
  const [sucheResetKey, setSucheResetKey]         = useState(0);
  const [profilResetKey, setProfilResetKey]         = useState(0);
  const [homeFeedRefreshKey, setHomeFeedRefreshKey] = useState(0);
  const [editingHomePost, setEditingHomePost]       = useState(null);
  const [isMenuOpen, setIsMenuOpen]                 = useState(false);
  const [pendingChatConversationId, setPendingChatConversationId] = useState(null);
  const [dmChatOpen, setDmChatOpen] = useState(false);
  const [hasUnreadChat, setHasUnreadChat] = useState(false);
  const lastHeaderAvatarRef = useRef(null);
  const passwordRecoveryRef = useRef(false);
  const authStateRef = useRef(authState);
  authStateRef.current = authState;

  const bumpProfileRefresh = () => setProfileRefreshKey((k) => k + 1);

  const closeAppOverlays = useCallback(() => {
    setIsMenuOpen(false);
    setShowSettings(false);
    setShowAccountInfo(false);
    setShowReportProblem(false);
    setShowFeedback(false);
    setShowDatenschutz(false);
    setShowImpressum(false);
    setShowDeleteProfile(false);
    setShowTeamDashboard(false);
    setDashboardTeamId(null);
    setShowInvoiceCode(false);
    setShowTeamCreation(false);
    setPendingInviteCodeId(null);
    setShowTickerFlow(false);
    setTickerGame(null);
  }, []);

  const enterAppIfReady = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setAuthState('landing');
      return false;
    }

    if (!isEmailConfirmed(user)) {
      if (user.email) setVerifyEmail(user.email);
      setAuthState('verify-email');
      return false;
    }

    await finishPendingOnboardingIfNeeded();
    setAuthState('app');
    return true;
  }, []);

  const handleAuthRedirect = useCallback(async (url) => {
    if (!url) return;

    const result = await handleAuthRedirectUrl(url);
    if (result.error) {
      Alert.alert(
        result.passwordRecovery ? 'Passwort-Link ungültig' : 'E-Mail-Bestätigung fehlgeschlagen',
        result.error,
      );
      return;
    }

    if (!result.sessionCreated) return;

    if (result.passwordRecovery) {
      passwordRecoveryRef.current = true;
      closeAppOverlays();
      setAuthState('reset-password');
      return;
    }

    if (result.emailChange) {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      Alert.alert(
        'E-Mail bestätigt',
        user?.email
          ? `Deine neue E-Mail-Adresse ${user.email} ist jetzt aktiv.`
          : 'Deine neue E-Mail-Adresse ist jetzt aktiv.',
      );
      setAuthState('app');
      return;
    }

    const entered = await enterAppIfReady();
    if (!entered) {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user?.email) {
        setVerifyEmail(user.email);
        setAuthState('verify-email');
      }
    }
  }, [enterAppIfReady, closeAppOverlays]);

  const applyHeaderProfile = useCallback((profile, { bustCache = false } = {}) => {
    const rawAvatar = profile?.avatar?.trim() || null;
    const initials = `${profile?.first_name?.[0] ?? ''}${profile?.last_name?.[0] ?? ''}`.toUpperCase() || '?';
    const avatarChanged = lastHeaderAvatarRef.current !== rawAvatar;

    if (avatarChanged) {
      lastHeaderAvatarRef.current = rawAvatar;
    }
    if (bustCache || avatarChanged) {
      setHeaderAvatarKey((k) => k + 1);
    }

    setHeaderAvatarUrl(rawAvatar);
    setHeaderInitials(initials);
  }, []);

  const openChatConversation = (conversationId) => {
    if (!conversationId) return;
    Keyboard.dismiss();
    setPendingChatConversationId(conversationId);
    setActiveTab(2);
    setSelectedGame(null);
    setIsMenuOpen(false);
    setShowSettings(false);
    setShowAccountInfo(false);
    setShowReportProblem(false);
    setShowFeedback(false);
    setShowDatenschutz(false);
    setShowImpressum(false);
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
    setShowAccountInfo(false);
    setShowReportProblem(false);
    setShowFeedback(false);
    setShowDatenschutz(false);
    setShowImpressum(false);
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
    if (index !== 2) setDmChatOpen(false);
  };

  useEffect(() => {
    const loadRole = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setUserRole(null);
        setHeaderAvatarUrl(null);
        setHeaderInitials('?');
        lastHeaderAvatarRef.current = null;
        return;
      }
      const role = user.user_metadata?.role;
      if (role) setUserRole(role);

      const { data } = await supabase
        .from('profiles')
        .select('role, avatar, first_name, last_name')
        .eq('id', user.id)
        .maybeSingle();

      if (!role) setUserRole(data?.role ?? null);
      applyHeaderProfile(data);
    };

    const bootstrapAuth = async () => {
      const initialUrl = await Linking.getInitialURL();
      if (initialUrl) {
        const result = await handleAuthRedirectUrl(initialUrl);
        if (result.error) {
          Alert.alert(
            result.passwordRecovery ? 'Passwort-Link ungültig' : 'E-Mail-Bestätigung fehlgeschlagen',
            result.error,
          );
        } else if (result.sessionCreated && result.passwordRecovery) {
          passwordRecoveryRef.current = true;
          setAuthState('reset-password');
          await loadRole();
          setAuthReady(true);
          return;
        } else if (result.sessionCreated) {
          const entered = await enterAppIfReady();
          if (!entered) {
            const { data: { user } } = await supabase.auth.getUser();
            if (user?.email) {
              setVerifyEmail(user.email);
              setAuthState('verify-email');
            }
          }
          await loadRole();
          setAuthReady(true);
          return;
        }
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user && isEmailConfirmed(session.user)) {
        await finishPendingOnboardingIfNeeded();
        setAuthState('app');
      } else if (session?.user?.email) {
        setVerifyEmail(session.user.email);
        setAuthState('verify-email');
      }
      await loadRole();
      setAuthReady(true);
    };

    bootstrapAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'PASSWORD_RECOVERY' && session?.user) {
        passwordRecoveryRef.current = true;
        closeAppOverlays();
        setAuthState('reset-password');
      } else if (event === 'USER_UPDATED' && session?.user) {
        // Email change confirmation via deep link often lands here.
        if (authStateRef.current === 'app' || isEmailConfirmed(session.user)) {
          setAuthState('app');
        }
      } else if (event === 'SIGNED_IN' && session?.user) {
        if (passwordRecoveryRef.current) {
          setAuthState('reset-password');
          return;
        }
        if (isEmailConfirmed(session.user)) {
          await finishPendingOnboardingIfNeeded();
          setAuthState('app');
        } else if (session.user.email) {
          setVerifyEmail(session.user.email);
          setAuthState('verify-email');
        } else {
          await supabase.auth.signOut();
          setAuthState('landing');
        }
      } else if (event === 'SIGNED_OUT') {
        passwordRecoveryRef.current = false;
        setAuthState('landing');
        setVerifyEmail('');
        setUserRole(null);
        setHeaderAvatarUrl(null);
        setHeaderInitials('?');
        setHeaderAvatarKey(0);
        lastHeaderAvatarRef.current = null;
        setHasUnreadChat(false);
      }
      loadRole();
    });
    return () => subscription.unsubscribe();
  }, [applyHeaderProfile, closeAppOverlays]);

  useEffect(() => {
    const subscription = Linking.addEventListener('url', ({ url }) => {
      handleAuthRedirect(url);
    });

    return () => subscription.remove();
  }, [handleAuthRedirect]);

  useEffect(() => {
    if (authState !== 'app' || !authReady) return undefined;

    let active = true;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!active) return;
      if (!user) {
        setAuthState('landing');
        return;
      }
      if (!isEmailConfirmed(user)) {
        if (user.email) setVerifyEmail(user.email);
        setAuthState('verify-email');
      }
    })();

    return () => {
      active = false;
    };
  }, [authState, authReady]);

  useEffect(() => {
    if (authState !== 'app') return;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from('profiles')
        .select('avatar, first_name, last_name')
        .eq('id', user.id)
        .maybeSingle();
      applyHeaderProfile(data);
    })();
  }, [authState, profileRefreshKey, applyHeaderProfile]);

  const refreshUnreadChat = useCallback(async () => {
    try {
      const unread = await hasUnreadChats();
      setHasUnreadChat(unread);
    } catch {
      setHasUnreadChat(false);
    }
  }, []);

  const handleHomeRefresh = useCallback(async () => {
    await Promise.all([
      refreshCatalog(),
      refreshUnreadChat(),
      (async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const { data } = await supabase
          .from('profiles')
          .select('avatar, first_name, last_name')
          .eq('id', user.id)
          .maybeSingle();
        applyHeaderProfile(data);
      })(),
    ]);
  }, [refreshCatalog, refreshUnreadChat, applyHeaderProfile]);

  useEffect(() => {
    if (authState !== 'app') return undefined;

    refreshUnreadChat();
    const unsubscribe = subscribeToIncomingMessages(() => {
      refreshUnreadChat();
    });
    return unsubscribe;
  }, [authState, refreshUnreadChat]);

  const handleAccountDeleted = () => {
    setShowDeleteProfile(false);
    setShowSettings(false);
    setShowAccountInfo(false);
    setShowReportProblem(false);
    setShowFeedback(false);
    setShowDatenschutz(false);
    setShowImpressum(false);
    setIsMenuOpen(false);
    setActiveTab(0);
    setSelectedGame(null);
    setShowTeamDashboard(false);
    setShowTeamCreation(false);
    setShowInvoiceCode(false);
    setPendingInviteCodeId(null);
    setDashboardTeamId(null);
    setUserRole(null);
    setHasUnreadChat(false);
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
    && !showAccountInfo
    && !showReportProblem
    && !showFeedback
    && !showDatenschutz
    && !showImpressum
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

  const renderHomeTab = () => (
    <HomeFeed
      key={homeFeedRefreshKey}
      onOpenTimeline={(game) => setSelectedGame(game)}
      onPullRefresh={handleHomeRefresh}
      onEditPost={setEditingHomePost}
    />
  );

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
            onDmChatOpenChange={setDmChatOpen}
            onUnreadChange={refreshUnreadChat}
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
        return (
          <ProfilScreen
            key={profilResetKey}
            refreshKey={profileRefreshKey}
            onProfileSaved={(profile) => {
              applyHeaderProfile(profile, { bustCache: true });
              bumpProfileRefresh();
            }}
          />
        );
      default:
        return null;
    }
  };
  if (!authReady) {
    return (
      <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFFFFF' }}>
        <ActivityIndicator size="large" color={colors.primary} />
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
        onSuccess={() => {
          enterAppIfReady();
        }}
        onNeedsVerification={(email) => {
          setVerifyEmail(email);
          setAuthState('verify-email');
        }}
        onForgotPassword={(email) => {
          setForgotPasswordEmail(email);
          setAuthState('forgot-password');
        }}
      />
    );
  }

  if (authState === 'verify-email') {
    return (
      <VerifyEmailScreen
        email={verifyEmail}
        onBack={() => setAuthState('login')}
        onVerified={() => {
          enterAppIfReady();
        }}
      />
    );
  }

  if (authState === 'forgot-password') {
    return (
      <ForgotPasswordScreen
        initialEmail={forgotPasswordEmail}
        onBack={() => setAuthState('login')}
      />
    );
  }

  if (authState === 'reset-password') {
    return (
      <ResetPasswordScreen
        onComplete={() => {
          passwordRecoveryRef.current = false;
          enterAppIfReady();
        }}
      />
    );
  }

  if (authState === 'register') {
    return (
      <PlayerOnboardingFlow
        onComplete={() => {
          enterAppIfReady();
        }}
        onBack={() => setAuthState('landing')}
      />
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle={colors.statusBarStyle} backgroundColor={colors.background} />
      
      {/* TOP BAR (HEADER) */}
      <View style={styles.header}>
        <View style={styles.headerSide}>
          <TouchableOpacity
            style={[
              styles.headerAvatarBtn,
              activeTab === 4 && styles.headerAvatarBtnActive,
            ]}
            onPress={() => goToTab(4)}
            activeOpacity={0.8}
          >
            {headerAvatarUrl ? (
              <Image
                source={{
                  uri: headerAvatarUrl.includes('?')
                    ? `${headerAvatarUrl}&v=${headerAvatarKey}`
                    : `${headerAvatarUrl}?v=${headerAvatarKey}`,
                }}
                style={styles.headerAvatar}
              />
            ) : (
              <View style={styles.headerAvatarPlaceholder}>
                <Text style={styles.headerAvatarInitials}>{headerInitials}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.headerCenter} pointerEvents="none">
          <Image
            source={require('./assets/fieldnet_logo.png')}
            style={styles.logoImage}
            resizeMode="contain"
          />
        </View>

        <View style={[styles.headerSide, styles.headerSideRight]}>
          <TouchableOpacity
            style={styles.burgerButton}
            onPress={() => {
              Keyboard.dismiss();
              setIsMenuOpen(true);
            }}
          >
            <Menu size={24} color={colors.text} />
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
            <LivePulseDot size={10} color="#EF4444" />
          </View>
          <View style={styles.tickerReturnBannerTextWrap}>
            <Text style={styles.tickerReturnBannerTitle}>Live-Ticker fortsetzen</Text>
            <Text style={styles.tickerReturnBannerSub} numberOfLines={1}>
              {tickerSessionLabel(tickerSessionGame)}
              {tickerSessionGame?.game_code ? ` · ${tickerSessionGame.game_code}` : ''}
            </Text>
          </View>
          <ChevronRight size={20} color="#FFFFFF" />
        </TouchableOpacity>
      )}

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
            <Home size={22} color={activeTab === 0 ? '#FFFFFF' : colors.navInactive} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.navTabItem, activeTab === 1 && styles.navTabItemActive]}
            onPress={() => goToTab(1)}
            activeOpacity={0.75}
          >
            <LayoutGrid size={22} color={activeTab === 1 ? '#FFFFFF' : colors.navInactive} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.navTabItem, activeTab === 2 && styles.navTabItemActive]}
            onPress={() => goToTab(2)}
            activeOpacity={0.75}
          >
            <View style={styles.navIconWrap}>
              <MessageSquare size={22} color={activeTab === 2 ? '#FFFFFF' : colors.navInactive} />
              {hasUnreadChat ? <View style={styles.navUnreadDot} /> : null}
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.navTabItem, activeTab === 3 && styles.navTabItemActive]}
            onPress={() => goToTab(3)}
            activeOpacity={0.75}
          >
            <Search size={22} color={activeTab === 3 ? '#FFFFFF' : colors.navInactive} />
          </TouchableOpacity>
        </View>
      </View>

      {/* BEITRAG BEARBEITEN (HOME) */}
      {editingHomePost && (
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: colors.background, zIndex: 210 }}>
          <PostCreateScreen
            teamId={editingHomePost.team_id}
            post={editingHomePost}
            onBack={() => setEditingHomePost(null)}
            onSuccess={() => {
              setEditingHomePost(null);
              setHomeFeedRefreshKey((k) => k + 1);
            }}
          />
        </View>
      )}

      {/* EINSTELLUNGEN */}
      {showSettings && !showDeleteProfile && (
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: colors.background, zIndex: 200 }}>
          <SettingsScreen
            onBack={() => setShowSettings(false)}
            onDeleteAccount={() => setShowDeleteProfile(true)}
            onTeamLeft={bumpProfileRefresh}
          />
        </View>
      )}

      {/* KONTO */}
      {showAccountInfo && (
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: colors.background, zIndex: 201 }}>
          <AccountInfoScreen
            onBack={() => setShowAccountInfo(false)}
            onRoleChanged={(role) => {
              setUserRole(role);
              bumpProfileRefresh();
            }}
            onTeamsChanged={bumpProfileRefresh}
          />
        </View>
      )}

      {/* IMPRESSUM */}
      {showImpressum && (
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: colors.background, zIndex: 202 }}>
          <ImpressumScreen onBack={() => setShowImpressum(false)} />
        </View>
      )}

      {/* DATENSCHUTZ */}
      {showDatenschutz && (
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: colors.background, zIndex: 203 }}>
          <DatenschutzScreen onBack={() => setShowDatenschutz(false)} />
        </View>
      )}

      {/* FEEDBACK */}
      {showFeedback && (
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: colors.background, zIndex: 204 }}>
          <FeedbackScreen onBack={() => setShowFeedback(false)} />
        </View>
      )}

      {/* PROBLEM MELDEN */}
      {showReportProblem && (
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: colors.background, zIndex: 205 }}>
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
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: colors.background, zIndex: 220 }}>
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
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: colors.background, zIndex: 200 }}>
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
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: colors.background, zIndex: 200 }}>
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
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: colors.background, zIndex: 200 }}>
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
                <X size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            {/* Menüpunkte im Seitenmenü */}
            <ScrollView
              style={styles.drawerMenuScroll}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              <MasterFilterBar menu />

              {[
                { label: 'Live-Ticker starten', icon: <PlusCircle size={20} color="#C01830" />, action: openTickerFlow },
                userRole === 'coach' ? { label: 'Vereinsverwaltung', icon: <Trophy size={20} color={colors.text} />, action: handleVerwaltung } : null,
                { label: 'Konto', icon: <User size={20} color={colors.text} />, action: () => setShowAccountInfo(true) },
                { label: 'Einstellungen', icon: <LayoutGrid size={20} color={colors.text} />, action: () => setShowSettings(true) },
                { label: 'Feedback geben', icon: <MessageSquare size={20} color={colors.text} />, action: () => setShowFeedback(true) },
                { label: 'Problem melden', icon: <Bell size={20} color={colors.text} />, action: () => setShowReportProblem(true) },
                { label: 'Über Fieldnet', icon: <Trophy size={20} color={colors.text} /> },
                { label: 'Datenschutz', icon: <Users size={20} color={colors.text} />, action: () => setShowDatenschutz(true) },
                { label: 'Impressum', icon: <Users size={20} color={colors.text} />, action: () => setShowImpressum(true) },
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