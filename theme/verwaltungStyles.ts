import { StyleSheet } from 'react-native';
import type { ThemeColors } from './palettes';

export function createInvoiceCodeStyles(c: ThemeColors) {
  const isDark = c.mode === 'dark';

  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: c.background },
    backBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 20,
      paddingVertical: 12,
    },
    backBtnText: { color: c.text, fontSize: 15, fontWeight: '600' },
    container: {
      paddingHorizontal: 24,
      paddingBottom: 40,
      paddingTop: 8,
    },
    iconWrap: {
      width: 72,
      height: 72,
      borderRadius: 20,
      backgroundColor: c.card,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 20,
    },
    title: {
      fontSize: 24,
      fontWeight: '800',
      color: c.text,
      marginBottom: 10,
    },
    subtitle: {
      fontSize: 15,
      lineHeight: 22,
      color: c.textMuted,
      marginBottom: 28,
    },
    label: {
      fontSize: 11,
      fontWeight: '800',
      color: c.textMuted,
      letterSpacing: 0.8,
      marginBottom: 8,
    },
    inputWrap: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      borderWidth: 1.5,
      borderColor: c.border,
      borderRadius: 14,
      paddingHorizontal: 14,
      backgroundColor: c.card,
      marginBottom: 8,
    },
    inputWrapError: { borderColor: c.accent },
    input: {
      flex: 1,
      fontSize: 16,
      fontWeight: '600',
      color: c.text,
      paddingVertical: 14,
      letterSpacing: 1,
    },
    errorText: {
      color: c.accent,
      fontSize: 13,
      marginBottom: 12,
      lineHeight: 18,
    },
    btnPrimary: {
      backgroundColor: isDark ? '#3B5080' : c.primary,
      borderRadius: 14,
      paddingVertical: 16,
      alignItems: 'center',
      marginTop: 8,
      marginBottom: 24,
    },
    btnDisabled: { opacity: 0.7 },
    btnPrimaryText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '700',
    },
    hintCard: {
      backgroundColor: c.card,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: c.border,
      padding: 16,
    },
    hintTitle: {
      fontSize: 14,
      fontWeight: '700',
      color: c.text,
      marginBottom: 6,
    },
    hintText: {
      fontSize: 13,
      lineHeight: 19,
      color: c.textMuted,
    },
  });
}

export function createCoachOnboardingStyles(c: ThemeColors) {
  const isDark = c.mode === 'dark';
  const overlayBg = isDark ? 'rgba(0,0,0,0.65)' : 'rgba(26,47,110,0.45)';

  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: c.background },
    topBar: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      paddingHorizontal: 20, paddingVertical: 12,
    },
    backBtn: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    backBtnText: { color: c.text, fontSize: 14, fontWeight: '700' },
    stepIndicator: { color: c.textMuted, fontSize: 12, fontWeight: '600' },
    progressRow: { flexDirection: 'row', gap: 6, paddingHorizontal: 20, marginBottom: 8 },
    progressSeg: { flex: 1, height: 4, borderRadius: 2, backgroundColor: c.border },
    progressSegActive: { backgroundColor: c.accent },
    content: { flex: 1 },
    stepScroll: { flexGrow: 1, paddingHorizontal: 20, paddingTop: 16, paddingBottom: 40 },
    stepTitle: { color: c.text, fontSize: 26, fontWeight: '900', marginBottom: 8 },
    stepSub: { color: c.textMuted, fontSize: 14, lineHeight: 20, marginBottom: 24 },
    highlight: { color: c.text, fontWeight: '700' },
    dropdownTrigger: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      backgroundColor: c.card, borderRadius: 12,
      paddingHorizontal: 14, paddingVertical: 14,
      borderWidth: 1.5, borderColor: c.border, minHeight: 50,
    },
    dropdownDisabled: { opacity: 0.55, backgroundColor: c.surface },
    dropdownTriggerContent: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10, marginRight: 8 },
    dropdownTriggerLogo: { width: 28, height: 28, borderRadius: 6 },
    dropdownText: { flex: 1, color: c.text, fontSize: 15, fontWeight: '600' },
    dropdownPlaceholder: { color: c.textMuted, fontWeight: '400' },
    dropdownOverlay: { flex: 1, justifyContent: 'flex-end' },
    dropdownBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: overlayBg },
    dropdownSheet: {
      backgroundColor: c.surface, borderTopLeftRadius: 20, borderTopRightRadius: 20,
      maxHeight: '70%', paddingBottom: 24,
    },
    dropdownSheetHeader: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      paddingHorizontal: 20, paddingVertical: 16,
      borderBottomWidth: 1, borderBottomColor: c.border,
    },
    dropdownSheetTitle: { color: c.text, fontSize: 16, fontWeight: '800' },
    dropdownList: { maxHeight: 360 },
    dropdownItem: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      paddingHorizontal: 20, paddingVertical: 16,
      borderBottomWidth: 1, borderBottomColor: c.border,
    },
    dropdownItemActive: { backgroundColor: c.card },
    dropdownItemLeft: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 },
    dropdownItemLogo: { width: 36, height: 36, borderRadius: 8 },
    dropdownItemLogoPlaceholder: {
      width: 36, height: 36, borderRadius: 8,
      backgroundColor: c.border, alignItems: 'center', justifyContent: 'center',
    },
    dropdownItemLogoFallback: { color: c.text, fontSize: 14, fontWeight: '800' },
    dropdownItemText: { color: c.text, fontSize: 15, fontWeight: '500', flex: 1 },
    dropdownItemTextActive: { color: c.text, fontWeight: '800' },
    dropdownEmpty: { color: c.textMuted, fontSize: 14, textAlign: 'center', padding: 24 },
    fieldWrap: { marginBottom: 16 },
    fieldLabel: {
      color: c.text, fontSize: 11, fontWeight: '700',
      letterSpacing: 0.8, marginBottom: 6, textTransform: 'uppercase',
    },
    input: {
      backgroundColor: c.card, borderRadius: 12,
      paddingHorizontal: 14, paddingVertical: 14,
      color: c.text, fontSize: 15, borderWidth: 1.5, borderColor: c.border,
    },
    inputError: { borderColor: c.accent },
    fieldError: { color: c.accent, fontSize: 11, marginTop: 4 },
    primaryBtn: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
      backgroundColor: c.accent, borderRadius: 14, paddingVertical: 16,
      marginTop: 8,
    },
    btnDisabled: { opacity: 0.6 },
    primaryBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '800' },
    errorBox: {
      backgroundColor: isDark ? '#2A1520' : '#FFF0F2', borderRadius: 12, padding: 14,
      borderWidth: 1, borderColor: isDark ? '#4A2030' : '#FECDD3', marginBottom: 16,
    },
    errorText: { color: c.accent, fontSize: 13, lineHeight: 18 },
    retryBtn: { marginTop: 10, alignSelf: 'flex-start' },
    retryBtnText: { color: c.text, fontWeight: '700', fontSize: 13 },
    emptyBox: {
      backgroundColor: c.card, borderRadius: 12, padding: 16,
      borderWidth: 1, borderColor: c.border, marginBottom: 8,
    },
    emptyText: { color: c.textMuted, fontSize: 13, textAlign: 'center' },
    summaryCard: {
      backgroundColor: c.card, borderRadius: 16,
      borderWidth: 1, borderColor: c.border,
      paddingHorizontal: 16, marginBottom: 24,
    },
    summaryRow: {
      flexDirection: 'row', justifyContent: 'space-between',
      paddingVertical: 14, gap: 12,
    },
    summaryRowBorder: { borderBottomWidth: 1, borderBottomColor: c.border },
    summaryLabel: { color: c.textMuted, fontSize: 13, fontWeight: '600' },
    summaryValue: { color: c.text, fontSize: 14, fontWeight: '800', flex: 1, textAlign: 'right' },
    overlay: {
      flex: 1, backgroundColor: overlayBg,
      justifyContent: 'center', alignItems: 'center', padding: 24,
    },
    overlayCard: {
      backgroundColor: c.surface, borderRadius: 20, padding: 28,
      width: '100%', maxWidth: 340, alignItems: 'center',
      borderWidth: 1, borderColor: c.border,
    },
    overlayTitle: {
      color: c.text, fontSize: 16, fontWeight: '800',
      marginTop: 16, marginBottom: 20, textAlign: 'center',
    },
    pipelineSteps: { alignSelf: 'stretch', gap: 10 },
    pipelineRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    pipelineDot: {
      width: 10, height: 10, borderRadius: 5, backgroundColor: c.border,
    },
    pipelineDotActive: { backgroundColor: c.accent },
    pipelineDotDone: { backgroundColor: '#10B981' },
    pipelineLabel: { color: c.textMuted, fontSize: 13 },
    pipelineLabelActive: { color: c.text, fontWeight: '700' },
  });
}
