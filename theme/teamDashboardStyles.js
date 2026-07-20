import { StyleSheet } from 'react-native';

export function getGameStatusConfig(c) {
  const isDark = c.mode === 'dark';
  return {
    scheduled: { label: 'Geplant', color: '#F59E0B', bg: isDark ? '#2A2410' : '#FFFBEB' },
    live: { label: 'LIVE', color: '#10B981', bg: isDark ? '#142A1F' : '#ECFDF5' },
    finished: { label: 'Beendet', color: c.textMuted, bg: c.card },
    cancelled: { label: 'Abgesagt', color: c.accent, bg: isDark ? '#2A1520' : '#FFF0F2' },
  };
}

export function createTeamDashboardStyles(c) {
  const isDark = c.mode === 'dark';
  const iconAccentBg = isDark ? '#2A1520' : '#FFF0F2';
  const deleteBtnBorder = isDark ? '#4A2030' : '#FECDD3';
  const primaryCardBg = isDark ? '#3B5080' : c.primary;

  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: c.background },
    scroll: { paddingHorizontal: 20, paddingBottom: 20 },

    backBtn: {
      flexDirection: 'row', alignItems: 'center', gap: 6,
      paddingHorizontal: 20, paddingVertical: 14,
    },
    backBtnText: { color: c.text, fontSize: 14, fontWeight: '700' },

    teamHeader: {
      alignItems: 'center',
      paddingVertical: 28,
    },
    teamLogo: {
      width: 120, height: 120, borderRadius: 24, marginBottom: 14,
      backgroundColor: c.card,
    },
    teamLogoPlaceholder: {
      width: 120, height: 120, borderRadius: 24, marginBottom: 14,
      backgroundColor: primaryCardBg, justifyContent: 'center', alignItems: 'center',
      shadowColor: primaryCardBg, shadowOffset: { width: 0, height: 6 },
      shadowOpacity: isDark ? 0.4 : 0.25, shadowRadius: 12, elevation: 8,
    },
    teamLogoInitials: { color: '#FFFFFF', fontSize: 36, fontWeight: '900' },
    teamName: {
      color: c.text, fontSize: 24, fontWeight: '900', textAlign: 'center', marginBottom: 4,
    },
    teamMeta: {
      color: c.textMuted, fontSize: 13, fontWeight: '500', textAlign: 'center',
    },

    sectionLabel: {
      color: c.textMuted, fontSize: 10, fontWeight: '800',
      letterSpacing: 1.2, marginBottom: 14,
    },

    actionCard: {
      flexDirection: 'row', alignItems: 'center', gap: 14,
      backgroundColor: c.card, borderRadius: 18,
      borderWidth: 1, borderColor: c.border,
      padding: 18, marginBottom: 14,
    },
    actionCardPrimary: {
      backgroundColor: primaryCardBg, borderColor: primaryCardBg,
      shadowColor: primaryCardBg, shadowOffset: { width: 0, height: 6 },
      shadowOpacity: isDark ? 0.4 : 0.25, shadowRadius: 12, elevation: 6,
    },
    actionIcon: {
      width: 52, height: 52, borderRadius: 14,
      justifyContent: 'center', alignItems: 'center',
    },
    actionTeamLogo: { width: 52, height: 52, borderRadius: 14 },
    actionText: { flex: 1 },
    actionTitle: { color: c.text, fontSize: 16, fontWeight: '800', marginBottom: 3 },
    actionSub: { color: c.textMuted, fontSize: 12, lineHeight: 17 },

    leaveBtn: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
      gap: 6, paddingVertical: 14, marginTop: 28,
    },
    leaveBtnText: { color: c.textMuted, fontSize: 13, fontWeight: '600' },

    gamesHeader: {
      flexDirection: 'row', justifyContent: 'space-between',
      alignItems: 'center', marginTop: 6, marginBottom: 12,
    },
    addGameLink: { color: c.accent, fontSize: 13, fontWeight: '700' },

    emptyGames: {
      alignItems: 'center', paddingVertical: 28, gap: 10,
      backgroundColor: c.card, borderRadius: 16,
      borderWidth: 1, borderColor: c.border,
    },
    emptyGamesText: { color: c.textMuted, fontSize: 13 },

    gameCard: {
      backgroundColor: c.card, borderRadius: 16,
      borderWidth: 1, borderColor: c.border,
      padding: 14, marginBottom: 10,
    },
    gameCardLive: {
      borderColor: '#10B981',
      borderWidth: 2,
      backgroundColor: isDark ? '#111827' : '#FFFFFF',
    },
    gameCardTop: {
      flexDirection: 'row', alignItems: 'center',
      justifyContent: 'space-between', marginBottom: 10,
    },
    deleteGameBtn: {
      width: 36, height: 36, borderRadius: 10,
      backgroundColor: iconAccentBg, borderWidth: 1, borderColor: deleteBtnBorder,
      justifyContent: 'center', alignItems: 'center',
    },
    gameBadge: {
      flexDirection: 'row', alignItems: 'center', gap: 5,
      borderRadius: 8,
      paddingHorizontal: 8, paddingVertical: 3,
    },
    liveDot: {
      width: 6, height: 6, borderRadius: 3, backgroundColor: '#10B981',
    },
    gameBadgeText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },

    gameTeamsRow: {
      flexDirection: 'row', alignItems: 'center',
      justifyContent: 'space-between', marginBottom: 10, gap: 8,
    },
    gameTeam: { flex: 1, color: c.text, fontSize: 15, fontWeight: '800' },
    vsText: { color: c.textMuted, fontSize: 13, fontWeight: '600', paddingHorizontal: 4 },
    scoreBox: {
      backgroundColor: primaryCardBg, borderRadius: 8,
      paddingHorizontal: 10, paddingVertical: 4,
    },
    scoreText: { color: '#FFFFFF', fontSize: 14, fontWeight: '900', letterSpacing: 1 },

    gameMeta: { gap: 4 },
    gameMetaItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
    gameMetaText: { color: c.textMuted, fontSize: 12 },
    copyBtn: {
      width: 20, height: 20, borderRadius: 6,
      backgroundColor: c.card, borderWidth: 1, borderColor: c.border,
      justifyContent: 'center', alignItems: 'center',
    },
    copyBtnDone: { backgroundColor: isDark ? '#142A1F' : '#ECFDF5', borderColor: '#10B981' },

    requestCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      backgroundColor: c.card,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: c.border,
      padding: 12,
      marginBottom: 8,
    },
    requestAvatar: { width: 44, height: 44, borderRadius: 12 },
    requestAvatarPlaceholder: {
      width: 44, height: 44, borderRadius: 12,
      backgroundColor: c.surface, borderWidth: 1, borderColor: c.border,
      alignItems: 'center', justifyContent: 'center',
    },
    requestAvatarText: { color: c.text, fontSize: 14, fontWeight: '800' },
    requestInfo: { flex: 1 },
    requestName: { color: c.text, fontSize: 15, fontWeight: '700' },
    requestMeta: { color: c.textMuted, fontSize: 12, marginTop: 2 },
    requestActions: { flexDirection: 'row', gap: 8 },
    requestAcceptBtn: {
      width: 34, height: 34, borderRadius: 10,
      backgroundColor: isDark ? '#142A1F' : '#D1FAE5', alignItems: 'center', justifyContent: 'center',
    },
    requestRejectBtn: {
      width: 34, height: 34, borderRadius: 10,
      backgroundColor: iconAccentBg, alignItems: 'center', justifyContent: 'center',
    },

    timelineLink: {
      marginTop: 10,
      paddingTop: 8,
      borderTopWidth: 1,
      borderTopColor: c.border,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    timelineLinkSecondary: {
      marginTop: 4,
      paddingTop: 4,
      borderTopWidth: 0,
    },
    timelineLinkText: { color: c.accent, fontSize: 11, fontWeight: '800', letterSpacing: 0.4 },
    timelineLinkTextMuted: { color: c.textMuted },
  });
}
