import { StyleSheet } from 'react-native';

export function createGameCreateStyles(c) {
  const isDark = c.mode === 'dark';
  const brandBlue = isDark ? '#3B5080' : '#1A2F6E';

  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: c.background },
    scroll: { paddingHorizontal: 20, paddingBottom: 20 },

    backBtn: {
      flexDirection: 'row', alignItems: 'center', gap: 6,
      paddingHorizontal: 20, paddingVertical: 14,
    },
    backBtnText: { color: c.text, fontSize: 14, fontWeight: '700' },

    headerSection: { alignItems: 'center', marginBottom: 28, paddingTop: 8 },
    headerIcon: {
      width: 72, height: 72, borderRadius: 36, backgroundColor: c.accent,
      justifyContent: 'center', alignItems: 'center', marginBottom: 16,
      shadowColor: c.accent, shadowOffset: { width: 0, height: 6 }, shadowOpacity: isDark ? 0.35 : 0.25, shadowRadius: 12, elevation: 8,
    },
    headerTitle: { color: c.text, fontSize: 26, fontWeight: '900', marginBottom: 8 },
    headerSub: { color: c.textMuted, fontSize: 14, textAlign: 'center', lineHeight: 21 },
    highlight: { color: c.accent, fontWeight: '700' },

    sectionLabel: {
      color: c.textMuted, fontSize: 10, fontWeight: '800',
      letterSpacing: 1.2, marginBottom: 10,
    },

    toggleRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
    toggleBtn: {
      flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: 'center',
      backgroundColor: c.card, borderWidth: 1.5, borderColor: c.border,
    },
    toggleBtnActive: { backgroundColor: brandBlue, borderColor: brandBlue },
    toggleBtnActiveRed: { backgroundColor: c.accent, borderColor: c.accent },
    toggleText: { color: c.textMuted, fontSize: 14, fontWeight: '700' },
    toggleTextActive: { color: '#FFFFFF' },

    card: {
      backgroundColor: c.card, borderRadius: 16,
      borderWidth: 1, borderColor: c.border,
      padding: 16, marginBottom: 20,
    },
    fieldWrap: { marginBottom: 14 },
    fieldLabel: { color: c.text, fontSize: 10, fontWeight: '800', letterSpacing: 0.8, marginBottom: 6 },
    fieldError: { color: c.accent, fontSize: 11, marginTop: 4 },

    inputRow: {
      flexDirection: 'row', alignItems: 'center',
      backgroundColor: c.surface, borderRadius: 10,
      borderWidth: 1.5, borderColor: c.border, paddingHorizontal: 10,
    },
    inputRowFocused: {
      borderColor: brandBlue,
      shadowColor: brandBlue,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: isDark ? 0.2 : 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
    inputRowPressable: { cursor: 'pointer' },
    inputRowError: { borderColor: c.accent },
    inputIcon: { marginRight: 8 },
    inputField: { flex: 1, color: c.text, fontSize: 14, paddingVertical: 12 },

    opponentLogo: {
      width: 28,
      height: 28,
      borderRadius: 8,
      marginRight: 8,
    },
    opponentLogoPlaceholder: {
      width: 28,
      height: 28,
      borderRadius: 8,
      backgroundColor: c.card,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 8,
    },
    opponentInitials: { color: c.text, fontSize: 10, fontWeight: '800' },

    suggestionsBox: {
      marginTop: 6,
      backgroundColor: c.surface,
      borderRadius: 12,
      borderWidth: 1.5,
      borderColor: c.border,
      overflow: 'hidden',
    },
    suggestionEmpty: {
      paddingVertical: 16,
      paddingHorizontal: 14,
      alignItems: 'center',
      gap: 6,
    },
    suggestionEmptyText: { color: c.text, fontSize: 13, fontWeight: '600' },
    suggestionEmptySub: { color: c.textMuted, fontSize: 11, textAlign: 'center' },
    suggestionRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 12,
      paddingVertical: 10,
      gap: 10,
    },
    suggestionBorder: { borderBottomWidth: 1, borderBottomColor: c.border },
    suggestionIcon: {
      width: 38,
      height: 38,
      borderRadius: 10,
      backgroundColor: c.card,
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
    },
    suggestionAvatar: { width: 38, height: 38, borderRadius: 10 },
    suggestionInitials: { color: c.text, fontSize: 12, fontWeight: '800' },
    suggestionName: { color: c.text, fontSize: 14, fontWeight: '700' },
    suggestionMeta: { color: c.textMuted, fontSize: 11, marginTop: 1 },

    pickerModal: {
      flex: 1, justifyContent: 'flex-end',
      backgroundColor: 'rgba(0,0,0,0.4)',
    },
    pickerSheet: {
      backgroundColor: c.surface,
      borderTopLeftRadius: 24, borderTopRightRadius: 24,
      paddingBottom: 36,
    },
    pickerSheetHeader: {
      flexDirection: 'row', justifyContent: 'space-between',
      alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16,
      borderBottomWidth: 1, borderBottomColor: c.border,
    },
    pickerTitle: { color: c.text, fontSize: 15, fontWeight: '700' },
    pickerCancel: { color: c.textMuted, fontSize: 15 },
    pickerDone: { color: c.text, fontSize: 15, fontWeight: '700' },

    createBtn: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
      backgroundColor: c.accent, borderRadius: 16, paddingVertical: 18,
      shadowColor: c.accent, shadowOffset: { width: 0, height: 4 }, shadowOpacity: isDark ? 0.35 : 0.3, shadowRadius: 8, elevation: 6,
    },
    createBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '900' },

    successCard: {
      flex: 1, alignItems: 'center', paddingTop: 40, paddingHorizontal: 8,
    },
    successIcon: {
      width: 88, height: 88, borderRadius: 44, backgroundColor: '#10B981',
      justifyContent: 'center', alignItems: 'center', marginBottom: 20,
      shadowColor: '#10B981', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 8,
    },
    successTitle: { color: c.text, fontSize: 26, fontWeight: '900', marginBottom: 8 },
    successSub: { color: c.textMuted, fontSize: 14, marginBottom: 24 },
    codeBox: {
      backgroundColor: brandBlue, borderRadius: 18, paddingHorizontal: 32, paddingVertical: 20,
      marginBottom: 16, width: '100%', alignItems: 'center',
      shadowColor: brandBlue, shadowOffset: { width: 0, height: 6 }, shadowOpacity: isDark ? 0.35 : 0.25, shadowRadius: 12, elevation: 8,
    },
    codeText: { color: '#FFFFFF', fontSize: 30, fontWeight: '900', letterSpacing: 4 },
    codeHint: {
      color: c.textMuted, fontSize: 13, textAlign: 'center', lineHeight: 20,
      marginBottom: 24, paddingHorizontal: 8,
    },
    copyBtn: {
      flexDirection: 'row', alignItems: 'center', gap: 8,
      backgroundColor: c.card, borderRadius: 14, paddingHorizontal: 24, paddingVertical: 14,
      borderWidth: 1.5, borderColor: c.border, marginBottom: 12, width: '100%', justifyContent: 'center',
    },
    copyBtnText: { color: c.text, fontSize: 14, fontWeight: '700' },
    doneBtn: {
      backgroundColor: c.accent, borderRadius: 14, paddingVertical: 16,
      width: '100%', alignItems: 'center',
    },
    doneBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '800' },
  });
}
