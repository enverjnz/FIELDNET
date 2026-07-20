import { StyleSheet } from 'react-native';

export function createTickerCodeStyles(c) {
  const isDark = c.mode === 'dark';

  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: c.background },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: c.border,
    },
    headerTitle: { color: c.text, fontSize: 16, fontWeight: '800' },
    container: {
      flexGrow: 1,
      paddingHorizontal: 24,
      paddingTop: 40,
      paddingBottom: 40,
    },
    iconWrap: {
      width: 72,
      height: 72,
      borderRadius: 20,
      backgroundColor: isDark ? '#2A1520' : '#FFF0F2',
      borderWidth: 1,
      borderColor: isDark ? '#4A2030' : '#FECDD3',
      justifyContent: 'center',
      alignItems: 'center',
      alignSelf: 'center',
      marginBottom: 24,
    },
    title: {
      color: c.text,
      fontSize: 26,
      fontWeight: '900',
      textAlign: 'center',
      marginBottom: 12,
    },
    subtitle: {
      color: c.textMuted,
      fontSize: 14,
      lineHeight: 21,
      textAlign: 'center',
      marginBottom: 32,
    },
    label: {
      color: c.text,
      fontSize: 11,
      fontWeight: '700',
      letterSpacing: 0.8,
      marginBottom: 8,
    },
    inputWrap: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      backgroundColor: c.card,
      borderRadius: 14,
      borderWidth: 1.5,
      borderColor: c.border,
      paddingHorizontal: 14,
      marginBottom: 8,
    },
    inputWrapError: { borderColor: c.accent },
    input: {
      flex: 1,
      color: c.text,
      fontSize: 16,
      fontWeight: '700',
      paddingVertical: 14,
      letterSpacing: 0.5,
    },
    errorText: { color: c.accent, fontSize: 12, marginBottom: 12, fontWeight: '600' },
    btnPrimary: {
      backgroundColor: c.accent,
      borderRadius: 16,
      paddingVertical: 18,
      alignItems: 'center',
      marginTop: 16,
      shadowColor: c.accent,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: isDark ? 0.35 : 0.3,
      shadowRadius: 8,
      elevation: 4,
    },
    btnDisabled: { opacity: 0.6 },
    btnPrimaryText: { color: '#FFFFFF', fontSize: 16, fontWeight: '900' },
  });
}

export function createTimelineStyles(c) {
  const isDark = c.mode === 'dark';
  const awayColor = isDark ? '#93B4FF' : '#1A2F6E';
  const pointsBg = isDark ? '#3B5080' : '#1A2F6E';

  return StyleSheet.create({
    container: { flex: 1, backgroundColor: c.background },
    header: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      paddingHorizontal: 16, paddingVertical: 12,
      borderBottomWidth: 1, borderBottomColor: c.border, backgroundColor: c.background,
    },
    backButton: { flexDirection: 'row', alignItems: 'center', width: 80 },
    backText: { color: c.accent, fontSize: 14, fontWeight: '600', marginLeft: 2 },
    headerTitle: { color: c.text, fontSize: 16, fontWeight: '800', letterSpacing: 0.5 },
    matchBar: {
      backgroundColor: c.card, paddingVertical: 14, alignItems: 'center',
      borderBottomWidth: 1, borderBottomColor: c.border,
    },
    teamsText: { color: c.text, fontSize: 16, fontWeight: '900', letterSpacing: 0.5, textAlign: 'center' },
    dateText: { color: c.textMuted, fontSize: 11, fontWeight: '600', marginTop: 2, textAlign: 'center', paddingHorizontal: 16 },
    scrollContainer: { flex: 1, paddingHorizontal: 16, paddingTop: 20 },
    timelineWrapper: { position: 'relative', width: '100%' },
    verticalLine: {
      position: 'absolute', left: 60, top: 10, bottom: 10,
      width: 2, backgroundColor: c.border,
    },
    quarterRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 16 },
    quarterBadge: {
      backgroundColor: isDark ? '#3B5080' : '#1A2F6E',
      paddingHorizontal: 10, paddingVertical: 4,
      borderRadius: 6, minWidth: 85, alignItems: 'center', zIndex: 2,
    },
    quarterBadgeText: { color: '#FFFFFF', fontSize: 9, fontWeight: '900' },
    quarterInfo: { marginLeft: 16 },
    quarterScore: { color: c.text, fontSize: 13, fontWeight: '800' },
    eventRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 10, paddingLeft: 4 },
    timeWrapper: { width: 45, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', marginRight: 11 },
    timeText: { color: c.textMuted, fontSize: 11, fontWeight: '700' },
    dot: { width: 14, height: 14, borderRadius: 7, justifyContent: 'center', alignItems: 'center', zIndex: 2 },
    dotHome: { backgroundColor: c.accent },
    dotAway: { backgroundColor: isDark ? '#3B5080' : '#1A2F6E' },
    innerDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#FFFFFF' },
    eventCard: {
      flex: 1, backgroundColor: c.card, borderColor: c.border,
      borderWidth: 1, borderRadius: 12, padding: 12, marginLeft: 16,
    },
    eventCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
    eventName: { fontSize: 12, fontWeight: '800', letterSpacing: 0.5, flex: 1 },
    textHome: { color: c.accent },
    textAway: { color: awayColor },
    pointsText: {
      color: '#FFFFFF', fontSize: 12, fontWeight: '800',
      backgroundColor: pointsBg, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4,
    },
    playerText: { color: c.text, fontSize: 13, fontWeight: '600', marginTop: 4 },
    currentScoreText: { color: c.textMuted, fontSize: 11, fontWeight: '500', marginTop: 6 },
    emptyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
    emptyText: { color: c.textMuted, fontSize: 14, textAlign: 'center' },
    errorText: { color: c.accent, fontSize: 14, textAlign: 'center', marginTop: 40, paddingHorizontal: 24 },
  });
}
