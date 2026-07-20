import { StyleSheet } from 'react-native';

export function createTeamProfileStyles(c) {
  const isDark = c.mode === 'dark';
  const brandBlue = isDark ? '#3B5080' : '#1A2F6E';

  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: c.background },
    scroll: { paddingHorizontal: 20, paddingBottom: 20 },

    header: {
      flexDirection: 'row', justifyContent: 'space-between',
      alignItems: 'center', paddingRight: 16,
    },
    backBtn: {
      flexDirection: 'row', alignItems: 'center', gap: 6,
      paddingHorizontal: 20, paddingVertical: 14,
    },
    backBtnText: { color: c.text, fontSize: 14, fontWeight: '700' },

    editBtn: {
      flexDirection: 'row', alignItems: 'center', gap: 6,
      backgroundColor: c.card, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 9,
      borderWidth: 1.5, borderColor: c.border,
    },
    editBtnText: { color: c.text, fontSize: 13, fontWeight: '700' },

    saveBtn: {
      flexDirection: 'row', alignItems: 'center', gap: 6,
      backgroundColor: brandBlue, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 9,
    },
    saveBtnText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },

    logoSection: { alignItems: 'center', paddingVertical: 20 },
    logoPicker: { marginBottom: 8 },
    logoPickerHint: { color: '#FFFFFF', fontSize: 10, fontWeight: '600', marginTop: 6 },
    removeLogoBtn: { marginBottom: 8 },
    removeLogoText: { color: c.accent, fontSize: 12, fontWeight: '600' },
    teamLogo: { width: 120, height: 120, borderRadius: 24, marginBottom: 8, backgroundColor: c.card },
    teamLogoPlaceholder: {
      width: 120, height: 120, borderRadius: 24, marginBottom: 8,
      backgroundColor: brandBlue, justifyContent: 'center', alignItems: 'center',
    },

    sectionTitle: {
      color: c.textMuted, fontSize: 10, fontWeight: '800',
      letterSpacing: 1.2, marginBottom: 10, marginTop: 6,
    },
    card: {
      backgroundColor: c.card, borderRadius: 16,
      borderWidth: 1, borderColor: c.border,
      padding: 16, marginBottom: 18,
    },

    infoRow: {
      flexDirection: 'row', alignItems: 'flex-start',
      paddingVertical: 8, gap: 12,
      borderBottomWidth: 1, borderBottomColor: c.border,
    },
    infoIcon: { width: 28, alignItems: 'center', paddingTop: 2 },
    infoLabel: { color: c.textMuted, fontSize: 10, fontWeight: '700', letterSpacing: 0.5, marginBottom: 2 },
    infoValue: { color: c.text, fontSize: 14, fontWeight: '600' },

    fieldWrap: { marginBottom: 12 },
    fieldLabel: { color: c.text, fontSize: 10, fontWeight: '800', letterSpacing: 0.8, marginBottom: 6 },
    fieldInput: {
      backgroundColor: c.surface, borderRadius: 10,
      borderWidth: 1.5, borderColor: c.border,
      paddingHorizontal: 12, paddingVertical: 11,
      color: c.text, fontSize: 14,
    },
    fieldInputMulti: { height: 72, textAlignVertical: 'top' },

    leagueTrigger: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      backgroundColor: c.surface, borderRadius: 10,
      borderWidth: 1.5, borderColor: c.border,
      paddingHorizontal: 12, paddingVertical: 11, minHeight: 44,
    },
    leagueTriggerError: { borderColor: c.accent },
    leagueTriggerDisabled: { opacity: 0.55 },
    leagueTriggerText: { flex: 1, color: c.text, fontSize: 14, fontWeight: '600', marginRight: 8 },
    leaguePlaceholder: { color: c.textMuted, fontWeight: '400' },
    leagueError: { color: c.accent, fontSize: 11, marginTop: 4 },
    leagueOverlay: { flex: 1, justifyContent: 'flex-end' },
    leagueBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: isDark ? 'rgba(0,0,0,0.6)' : 'rgba(26,47,110,0.4)' },
    leagueSheet: {
      backgroundColor: c.surface, borderTopLeftRadius: 20, borderTopRightRadius: 20,
      maxHeight: '60%', paddingBottom: 24,
    },
    leagueSheetHeader: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      paddingHorizontal: 20, paddingVertical: 16,
      borderBottomWidth: 1, borderBottomColor: c.border,
    },
    leagueSheetTitle: { color: c.text, fontSize: 16, fontWeight: '800' },
    leagueList: { maxHeight: 320 },
    leagueItem: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      paddingHorizontal: 20, paddingVertical: 16,
      borderBottomWidth: 1, borderBottomColor: c.border,
    },
    leagueItemActive: { backgroundColor: c.card },
    leagueItemText: { color: c.text, fontSize: 15, fontWeight: '500', flex: 1 },
    leagueItemTextActive: { fontWeight: '800' },
    leagueEmpty: { color: c.textMuted, fontSize: 14, textAlign: 'center', padding: 24 },

    leagueSectionHint: {
      color: c.textMuted, fontSize: 12, fontWeight: '600',
      marginBottom: 12, lineHeight: 18,
    },
    enrollModeWrap: { marginTop: 4, marginBottom: 12, gap: 8 },
    enrollModeOption: {
      flexDirection: 'row', alignItems: 'flex-start', gap: 12,
      backgroundColor: c.surface, borderRadius: 12,
      borderWidth: 1.5, borderColor: c.border,
      padding: 12,
    },
    enrollModeOptionActive: { borderColor: brandBlue, backgroundColor: c.surface },
    enrollModeOptionDisabled: { opacity: 0.5 },
    enrollRadio: {
      width: 18, height: 18, borderRadius: 9,
      borderWidth: 2, borderColor: c.border, marginTop: 2,
    },
    enrollRadioActive: { borderColor: c.accent, backgroundColor: c.accent },
    enrollModeTitle: { color: c.text, fontSize: 13, fontWeight: '800', marginBottom: 2 },
    enrollModeSub: { color: c.textMuted, fontSize: 11, lineHeight: 16 },
    leagueSaveBtn: {
      backgroundColor: c.accent, borderRadius: 12,
      paddingVertical: 14, alignItems: 'center', justifyContent: 'center',
      minHeight: 48,
    },
    leagueSaveBtnDisabled: { opacity: 0.7 },
    leagueSaveBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '800' },

    successToast: {
      flexDirection: 'row', alignItems: 'center', gap: 8,
      backgroundColor: '#10B981', borderRadius: 12,
      paddingHorizontal: 14, paddingVertical: 12,
      marginBottom: 12,
    },
    successToastText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700', flex: 1 },

    kaderHeader: {
      flexDirection: 'row', justifyContent: 'space-between',
      alignItems: 'center', marginBottom: 10, marginTop: 6,
    },
    kaderCount: { color: c.textMuted, fontSize: 12, fontWeight: '600' },

    emptyKader: {
      alignItems: 'center', paddingVertical: 32, gap: 10,
      backgroundColor: c.card, borderRadius: 16,
      borderWidth: 1, borderColor: c.border,
    },
    emptyKaderText: { color: c.textMuted, fontSize: 13 },

    playerRow: {
      flexDirection: 'row', alignItems: 'center', gap: 12,
      backgroundColor: c.card, borderRadius: 14,
      padding: 12, marginBottom: 8,
      borderWidth: 1, borderColor: c.border,
    },
    playerAvatar: {
      width: 56, height: 56, borderRadius: 28,
      backgroundColor: brandBlue, justifyContent: 'center', alignItems: 'center',
    },
    playerAvatarImg: { width: 56, height: 56, borderRadius: 28 },
    playerAvatarText: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' },
    playerInfo: { flex: 1 },
    playerName: { color: c.text, fontSize: 14, fontWeight: '700' },
    playerMeta: { color: c.textMuted, fontSize: 11, marginTop: 2 },
    statusBadge: {
      borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3,
      borderWidth: 1.5,
    },
    statusText: { fontSize: 9, fontWeight: '800', letterSpacing: 0.3 },
    acceptBtn: {
      width: 30, height: 30, borderRadius: 10,
      backgroundColor: isDark ? '#0F2A22' : '#D1FAE5', justifyContent: 'center', alignItems: 'center',
    },
    rejectBtn: {
      width: 30, height: 30, borderRadius: 10,
      backgroundColor: c.signOutBg, justifyContent: 'center', alignItems: 'center',
    },
    removeBtn: {
      width: 30, height: 30, borderRadius: 10,
      backgroundColor: c.signOutBg, justifyContent: 'center', alignItems: 'center',
    },

    modalHeader: {
      flexDirection: 'row', justifyContent: 'space-between',
      alignItems: 'center', paddingHorizontal: 20, paddingVertical: 18,
      borderBottomWidth: 1, borderBottomColor: c.border,
    },
    modalTitle: { color: c.text, fontSize: 18, fontWeight: '900' },
    modalScroll: { paddingHorizontal: 20, paddingBottom: 40 },

    modalAvatarWrap: { alignItems: 'center', paddingVertical: 28 },
    modalAvatarImg: {
      width: 128, height: 128, borderRadius: 64,
      borderWidth: 3, borderColor: brandBlue, marginBottom: 12,
    },
    modalAvatarPlaceholder: {
      width: 128, height: 128, borderRadius: 64,
      backgroundColor: brandBlue, justifyContent: 'center', alignItems: 'center',
      marginBottom: 12,
    },
    modalAvatarInitials: { color: '#FFFFFF', fontSize: 42, fontWeight: '900' },
    modalName: { color: c.text, fontSize: 22, fontWeight: '900', marginBottom: 8 },
    modalPosPill: {
      backgroundColor: c.card, borderRadius: 20,
      paddingHorizontal: 14, paddingVertical: 5,
      borderWidth: 1.5, borderColor: c.border,
    },
    modalPosPillText: { color: c.text, fontSize: 12, fontWeight: '800' },

    modalStatsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    modalStatCard: {
      width: '47%', backgroundColor: c.card,
      borderRadius: 14, borderWidth: 1, borderColor: c.border,
      padding: 14,
    },
    modalStatLabel: { color: c.textMuted, fontSize: 10, fontWeight: '700', letterSpacing: 0.8, marginBottom: 6 },
    modalStatValue: { color: c.text, fontSize: 18, fontWeight: '900' },

    joinBtn: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
      backgroundColor: c.accent, borderRadius: 14, paddingVertical: 16, marginTop: 8,
    },
    joinBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '800' },
    leaveTeamBtn: {
      alignSelf: 'center',
      marginTop: 12,
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 10,
      backgroundColor: c.mode === 'dark' ? '#1F2937' : '#E5E7EB',
      borderWidth: 1,
      borderColor: c.mode === 'dark' ? '#374151' : '#D1D5DB',
      minHeight: 36,
      minWidth: 140,
      alignItems: 'center',
      justifyContent: 'center',
    },
    leaveTeamBtnText: {
      color: c.textMuted,
      fontSize: 12,
      fontWeight: '700',
    },

    followBtn: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
      backgroundColor: brandBlue, borderRadius: 14, paddingVertical: 14,
      marginBottom: 18, minHeight: 50,
    },
    followBtnOutline: {
      backgroundColor: c.background,
      borderWidth: 2, borderColor: brandBlue,
    },
    followBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '800' },
    followBtnTextOutline: { color: c.text },

    emptyGames: {
      alignItems: 'center', paddingVertical: 28, gap: 10,
      backgroundColor: c.card, borderRadius: 16,
      borderWidth: 1, borderColor: c.border, marginBottom: 18,
    },
    emptyGamesText: { color: c.textMuted, fontSize: 13 },

    gamesCarousel: { marginHorizontal: -20, marginBottom: 18 },
    gamesCarouselContent: { paddingHorizontal: 20 },

    scoreCard: {
      backgroundColor: c.surface,
      borderColor: c.border,
      borderWidth: 1,
      borderRadius: 16,
      padding: 16,
      width: 240,
      marginRight: 14,
      shadowColor: isDark ? '#000' : brandBlue,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: isDark ? 0.3 : 0.08,
      shadowRadius: 5,
      elevation: 3,
    },
    scoreLeague: {
      color: c.textMuted, fontSize: 10, fontWeight: '800',
      letterSpacing: 0.8, marginBottom: 12,
    },
    scoreRow: {
      flexDirection: 'row', justifyContent: 'space-between',
      alignItems: 'center', marginBottom: 6,
    },
    scoreTeamContainer: {
      flexDirection: 'row', alignItems: 'center',
      flex: 1, marginRight: 8,
    },
    scoreTeamLogo: {
      width: 24, height: 24, borderRadius: 12,
      marginRight: 10, backgroundColor: c.card,
    },
    scoreTeamLogoPlaceholder: {
      width: 24, height: 24, borderRadius: 12,
      marginRight: 10, backgroundColor: brandBlue,
      justifyContent: 'center', alignItems: 'center',
    },
    scoreTeamLogoText: { color: '#FFFFFF', fontSize: 10, fontWeight: '800' },
    scoreTeamName: { color: c.textMuted, fontSize: 14, fontWeight: '600', flex: 1 },
    scoreTeamScore: { color: c.textMuted, fontSize: 15, fontWeight: '600' },
    scoreWinnerName: { color: c.text, fontWeight: '800' },
    scoreWinnerScore: { color: c.accent, fontWeight: '800', fontSize: 16 },
    scoreCardFooter: {
      flexDirection: 'row', justifyContent: 'space-between',
      alignItems: 'center', marginTop: 10, paddingTop: 8,
      borderTopWidth: 1, borderTopColor: c.border,
    },
    scoreStatusTag: { color: c.textMuted, fontSize: 9, fontWeight: '700' },
    scoreTimelineLink: { color: c.accent, fontSize: 9, fontWeight: '800', letterSpacing: 0.4 },
    statsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
      marginBottom: 18,
    },
    statTile: {
      width: '47%',
      backgroundColor: c.card,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: c.border,
      padding: 14,
      alignItems: 'center',
    },
    statTileValue: { color: c.text, fontSize: 22, fontWeight: '900' },
    statTileLabel: { color: c.textMuted, fontSize: 11, fontWeight: '700', marginTop: 4 },
    scoreLocationRow: {
      flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8,
    },
    scoreLocationText: { color: c.textMuted, fontSize: 11, flex: 1 },
  });
}
