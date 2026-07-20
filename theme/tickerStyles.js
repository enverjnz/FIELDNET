import { StyleSheet } from 'react-native';

export function createTickerStyles(c, teamSide = 'home') {
  const isDark = c.mode === 'dark';
  const isHome = teamSide === 'home';

  // Heim = Blau (primary), Auswärts = Rot (accent)
  const teamColor = isHome ? c.primary : c.accent;
  const activeTeamBg = isHome
    ? (isDark ? '#15202A' : '#F0F4FF')
    : (isDark ? '#2A1520' : '#FFF0F2');
  const queueBg = activeTeamBg;
  const queueBorder = isHome
    ? (isDark ? '#20304A' : '#D1D8F0')
    : (isDark ? '#4A2030' : '#FECDD3');
  const sendBtnBg = isDark
    ? (isHome ? '#3B5080' : '#8B2030')
    : teamColor;
  const chipSelectedBg = teamColor;
  const chipTextSelected = '#FFFFFF';

  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: c.background },
    topBar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: c.border,
    },
    backBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, minWidth: 72 },
    backText: { color: c.text, fontSize: 14, fontWeight: '700' },
    topBarCenter: { flex: 1, alignItems: 'center', paddingHorizontal: 8 },
    topBarTitle: { color: c.text, fontSize: 15, fontWeight: '900' },
    topBarCode: { color: c.textMuted, fontSize: 10, fontWeight: '700', marginTop: 2, letterSpacing: 0.5 },
    exitText: { color: teamColor, fontSize: 13, fontWeight: '800', minWidth: 72, textAlign: 'right' },
    container: { flex: 1, backgroundColor: c.background, padding: 16 },
    matchTitle: {
      color: c.text, fontSize: 16, fontWeight: '900', textAlign: 'center', marginBottom: 4,
    },
    matchMeta: {
      color: c.textMuted, fontSize: 12, textAlign: 'center', marginBottom: 12, fontWeight: '500',
    },
    finishedBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      backgroundColor: c.card,
      borderRadius: 12,
      padding: 12,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: c.border,
    },
    finishedBannerText: { color: c.text, fontSize: 13, fontWeight: '700' },
    scoreboard: {
      flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
      backgroundColor: c.card, borderRadius: 20, padding: 16,
      borderWidth: 1, borderColor: c.border, marginBottom: 16, marginTop: 8,
    },
    teamScoreBox: {
      flex: 1, alignItems: 'center', paddingVertical: 12,
      borderRadius: 14, backgroundColor: c.surface, borderWidth: 1.5, borderColor: c.border,
    },
    activeTeamBox: { borderColor: teamColor, backgroundColor: activeTeamBg },
    teamLabel: { color: c.textMuted, fontSize: 10, fontWeight: '700', letterSpacing: 0.5, marginBottom: 4, textAlign: 'center' },
    scoreRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
    },
    scoreNumber: { color: c.text, fontSize: 36, fontWeight: '900' },
    scoreTeamLogo: {
      width: 36,
      height: 36,
      borderRadius: 10,
    },
    scoreTeamLogoPlaceholder: {
      width: 36,
      height: 36,
      borderRadius: 10,
      backgroundColor: c.background,
      borderWidth: 1,
      borderColor: c.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    scoreTeamLogoText: {
      color: c.text,
      fontSize: 14,
      fontWeight: '900',
    },
    vsContainer: { width: 50, alignItems: 'center' },
    vsText: { color: c.textMuted, fontSize: 14, fontWeight: '800', fontStyle: 'italic' },
    resetButton: { marginTop: 10, padding: 6, backgroundColor: c.card, borderRadius: 8 },
    infoText: { color: c.textMuted, fontSize: 13, textAlign: 'center', marginBottom: 12, fontWeight: '600' },
    infoTeamText: { color: teamColor, fontWeight: '800' },
    quarterRow: {
      flexDirection: 'row',
      gap: 8,
      marginBottom: 16,
      width: '100%',
    },
    quarterBtn: {
      flex: 1,
      paddingVertical: 10,
      borderRadius: 10,
      alignItems: 'center',
      backgroundColor: c.chipBg,
      borderWidth: 1.5,
      borderColor: c.border,
    },
    quarterBtnActive: {
      backgroundColor: chipSelectedBg,
      borderColor: chipSelectedBg,
    },
    quarterBtnText: {
      color: c.chipText,
      fontSize: 13,
      fontWeight: '800',
      letterSpacing: 0.5,
    },
    quarterBtnTextActive: {
      color: chipTextSelected,
    },
    queueBanner: {
      backgroundColor: queueBg,
      borderRadius: 10,
      padding: 10,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: queueBorder,
    },
    queueBannerText: { color: teamColor, fontSize: 12, fontWeight: '700', textAlign: 'center' },
    buttonGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
    scoreButton: {
      backgroundColor: c.card, borderWidth: 1.5, borderColor: c.border,
      borderRadius: 16, padding: 16, width: '48%', marginBottom: 16,
    },
    tdButton: { width: '100%', backgroundColor: teamColor, borderColor: teamColor },
    statButton: {
      width: '48%',
      backgroundColor: c.surface,
      borderWidth: 1.5,
      borderColor: c.border,
      borderRadius: 12,
      padding: 14,
      marginBottom: 16,
      alignItems: 'center',
    },
    statButtonText: { color: c.text, fontSize: 11, fontWeight: '800', letterSpacing: 0.3 },
    buttonHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    buttonPoints: { color: '#FFFFFF', fontSize: 24, fontWeight: '900' },
    buttonPointsGreen: { color: teamColor, fontSize: 24, fontWeight: '900' },
    buttonLabel: { color: '#FFFFFF', fontSize: 14, fontWeight: '800', letterSpacing: 0.5 },
    buttonLabelSub: { color: c.text, fontSize: 13, fontWeight: '700', letterSpacing: 0.5 },
    sendUpdateButton: {
      backgroundColor: sendBtnBg, borderColor: sendBtnBg, borderWidth: 2,
      borderRadius: 16, padding: 18, width: '100%', marginTop: 16,
      alignItems: 'center', justifyContent: 'center',
      shadowColor: sendBtnBg, shadowOffset: { width: 0, height: 4 },
      shadowOpacity: isDark ? 0.35 : 0.2, shadowRadius: 10, elevation: 4,
    },
    finishButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 10,
      backgroundColor: c.surface,
      borderColor: teamColor,
      borderWidth: 2,
      borderRadius: 16,
      padding: 16,
      width: '100%',
      marginTop: 12,
    },
    finishButtonText: { color: teamColor, fontSize: 14, fontWeight: '900', letterSpacing: 0.5 },
    sendUpdateDisabled: { opacity: 0.6 },
    sendUpdateDataText: { color: 'rgba(255,255,255,0.7)', fontSize: 11, fontWeight: '800', letterSpacing: 1, marginBottom: 4 },
    sendUpdateButtonText: { color: '#FFFFFF', fontSize: 14, fontWeight: '900', letterSpacing: 0.5 },
    inputLabel: { color: c.text, fontSize: 12, fontWeight: '700', marginBottom: 8, letterSpacing: 0.5, width: '100%' },
    emptyRoster: { color: c.textMuted, fontSize: 13, marginBottom: 16, fontStyle: 'italic', width: '100%' },
    dropdownButton: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      backgroundColor: c.card, borderColor: c.border, borderWidth: 1.5,
      borderRadius: 12, paddingHorizontal: 16, height: 52, width: '100%',
    },
    dropdownButtonContent: { flexDirection: 'row', alignItems: 'center', flex: 1 },
    dropdownPlaceholderText: { color: c.textMuted, fontSize: 14, fontWeight: '500' },
    dropdownSelectedText: { color: c.text, fontSize: 14, fontWeight: '600' },
    dropdownList: {
      backgroundColor: c.surface, borderColor: c.border, borderWidth: 1,
      borderRadius: 12, marginTop: 4, marginBottom: 8, overflow: 'hidden', width: '100%',
    },
    dropdownItem: { flexDirection: 'row', alignItems: 'center', padding: 14, borderBottomWidth: 1, borderBottomColor: c.border },
    playerNumber: { color: teamColor, fontWeight: '800', width: 40, fontSize: 14 },
    playerName: { color: c.text, flex: 1, fontSize: 14, fontWeight: '500' },
    playerPos: { color: c.textMuted, fontSize: 12, fontWeight: '700' },
  });
}
