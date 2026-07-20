import { StyleSheet } from 'react-native';

export function createProfilStyles(c) {
  const isDark = c.mode === 'dark';
  const iconBg = isDark ? '#243049' : '#E8EDF8';
  const joinBorder = isDark ? '#4A2030' : '#FECDD3';

  return StyleSheet.create({
    safe:     { flex: 1, backgroundColor: c.background },
    scroll:   { paddingHorizontal: 20, paddingTop: 24, paddingBottom: 20 },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },

    headerSection: { alignItems: 'center', marginBottom: 32 },
    editBtn: {
      flexDirection: 'row', alignItems: 'center', gap: 6,
      alignSelf: 'flex-end', marginBottom: 16,
      backgroundColor: c.card, borderRadius: 20,
      paddingHorizontal: 12, paddingVertical: 6,
      borderWidth: 1.5, borderColor: c.border,
    },
    editBtnText: { color: c.text, fontSize: 12, fontWeight: '800' },

    avatarImg: {
      width: 140, height: 140, borderRadius: 70,
      borderWidth: 3, borderColor: isDark ? c.border : c.primary, marginBottom: 12,
    },
    avatarPlaceholder: {
      width: 140, height: 140, borderRadius: 70,
      backgroundColor: c.card, borderWidth: 2, borderColor: c.border,
      justifyContent: 'center', alignItems: 'center', marginBottom: 12,
    },
    avatarInitials: { color: c.text, fontSize: 42, fontWeight: '900' },
    rolePill: {
      backgroundColor: c.card, borderRadius: 20,
      paddingHorizontal: 12, paddingVertical: 4,
      borderWidth: 1.5, borderColor: c.border, marginBottom: 10,
    },
    rolePillText: { color: c.text, fontSize: 11, fontWeight: '800', letterSpacing: 0.5 },
    fullName: { color: c.text, fontSize: 24, fontWeight: '900', marginBottom: 8, textAlign: 'center' },
    bio:      { color: c.textMuted, fontSize: 13, lineHeight: 20, textAlign: 'center', maxWidth: 300 },

    profileTabs: {
      flexDirection: 'row',
      gap: 8,
      marginBottom: 20,
      backgroundColor: c.card,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: c.border,
      padding: 4,
    },
    profileTab: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      paddingVertical: 10,
      borderRadius: 10,
    },
    profileTabActive: {
      backgroundColor: c.accent,
    },
    profileTabText: {
      color: c.textMuted,
      fontSize: 13,
      fontWeight: '700',
    },
    profileTabTextActive: {
      color: '#FFFFFF',
    },

    sectionTitle: {
      color: c.textMuted, fontSize: 10, fontWeight: '800',
      letterSpacing: 1.2, marginBottom: 10, marginTop: 4,
    },

    card: {
      backgroundColor: c.card, borderRadius: 16,
      borderWidth: 1, borderColor: c.border,
      marginBottom: 24, overflow: 'hidden',
    },
    emptyCardText: { color: c.textMuted, fontSize: 13, padding: 16, textAlign: 'center' },

    teamRow: {
      flexDirection: 'row', alignItems: 'center',
      paddingHorizontal: 16, paddingVertical: 14, gap: 12,
    },
    teamRowWithAction: {
      paddingRight: 8,
      paddingVertical: 0,
      paddingHorizontal: 0,
      gap: 0,
    },
    teamRowMain: {
      flex: 1,
      flexDirection: 'row', alignItems: 'center',
      paddingHorizontal: 16, paddingVertical: 14, gap: 12,
    },
    teamRowBorder: { borderTopWidth: 1, borderTopColor: c.border },
    teamLogo:      { width: 36, height: 36, borderRadius: 8 },
    teamLogoPlaceholder: {
      width: 36, height: 36, borderRadius: 8,
      backgroundColor: iconBg, justifyContent: 'center', alignItems: 'center',
    },
    teamName: { flex: 1, color: c.text, fontSize: 14, fontWeight: '700' },
    coachTeamBadge: {
      backgroundColor: iconBg, borderRadius: 8,
      paddingHorizontal: 8, paddingVertical: 3,
    },
    coachTeamBadgeText: { color: c.text, fontSize: 10, fontWeight: '800', letterSpacing: 0.4 },
    followBadge: {
      backgroundColor: iconBg, borderRadius: 8,
      paddingHorizontal: 8, paddingVertical: 3,
    },
    followBadgeText: { color: c.text, fontSize: 10, fontWeight: '800', letterSpacing: 0.4 },
    unfollowBtn: {
      width: 32, height: 32, borderRadius: 8,
      alignItems: 'center', justifyContent: 'center',
    },

    badge: { borderRadius: 8, borderWidth: 1, paddingHorizontal: 8, paddingVertical: 3 },
    badgeText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.4 },

    statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 24 },
    statCard: {
      width: '47%', backgroundColor: c.card,
      borderRadius: 14, borderWidth: 1, borderColor: c.border,
      padding: 14, gap: 6,
    },
    statIcon:  { marginBottom: 2 },
    statLabel: { color: c.textMuted, fontSize: 10, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase' },
    statValue: { color: c.text, fontSize: 15, fontWeight: '800' },

    infoRow: {
      flexDirection: 'row', justifyContent: 'space-between',
      alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14,
    },
    infoRowBorder: { borderTopWidth: 1, borderTopColor: c.border },
    infoLabel: { color: c.textMuted, fontSize: 13, fontWeight: '600' },
    infoValue: { color: c.text, fontSize: 13, fontWeight: '700', maxWidth: '60%', textAlign: 'right' },

    emptyTitle:    { color: c.text, fontSize: 18, fontWeight: '800', marginTop: 8 },
    emptySubtitle: { color: c.textMuted, fontSize: 13, textAlign: 'center', maxWidth: 260 },

    sectionRow: {
      flexDirection: 'row', justifyContent: 'space-between',
      alignItems: 'center', marginBottom: 10, marginTop: 4,
    },
    joinBtn: {
      flexDirection: 'row', alignItems: 'center', gap: 5,
      backgroundColor: c.signOutBg, borderRadius: 12,
      paddingHorizontal: 10, paddingVertical: 6,
      borderWidth: 1.5, borderColor: joinBorder,
    },
    joinBtnText: { color: c.accent, fontSize: 11, fontWeight: '800' },

    emptyTeamBtn: {
      flexDirection: 'row', alignItems: 'center', gap: 12,
      padding: 16,
    },
    emptyTeamIcon: {
      width: 40, height: 40, borderRadius: 12,
      backgroundColor: c.card, borderWidth: 1, borderColor: c.border,
      justifyContent: 'center', alignItems: 'center',
    },
    emptyTeamTitle: { color: c.text, fontSize: 14, fontWeight: '700' },
    emptyTeamSub:   { color: c.textMuted, fontSize: 11, marginTop: 2 },

    modalHeader: {
      flexDirection: 'row', justifyContent: 'space-between',
      alignItems: 'center', paddingHorizontal: 20, paddingVertical: 18,
      borderBottomWidth: 1, borderBottomColor: c.border,
    },
    modalTitle: { color: c.text, fontSize: 18, fontWeight: '900' },

    modalSearchBar: {
      flexDirection: 'row', alignItems: 'center', gap: 10,
      backgroundColor: c.card, borderRadius: 14,
      borderWidth: 1.5, borderColor: c.border,
      paddingHorizontal: 14, marginHorizontal: 16, marginVertical: 12,
    },
    modalSearchInput: {
      flex: 1, color: c.text, fontSize: 15, paddingVertical: 13,
    },
    modalResults: { paddingHorizontal: 16, paddingBottom: 40 },
    modalEmpty: {
      alignItems: 'center', paddingTop: 60,
    },
    modalEmptyText: { color: c.textMuted, fontSize: 14, textAlign: 'center' },

    resultRow: {
      flexDirection: 'row', alignItems: 'center', gap: 12,
      paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: c.border,
    },
    resultLogo: { width: 44, height: 44, borderRadius: 10, backgroundColor: c.card },
    resultLogoPlaceholder: {
      width: 44, height: 44, borderRadius: 10,
      backgroundColor: c.card, borderWidth: 1, borderColor: c.border,
      justifyContent: 'center', alignItems: 'center',
    },
    resultName: { color: c.text, fontSize: 14, fontWeight: '700' },
    resultMeta: { color: c.textMuted, fontSize: 11, marginTop: 2 },
    joinPill: {
      flexDirection: 'row', alignItems: 'center', gap: 4,
      backgroundColor: c.chipSelectedBg, borderRadius: 10,
      paddingHorizontal: 10, paddingVertical: 7,
    },
    joinPillText: { color: '#FFFFFF', fontSize: 11, fontWeight: '800' },

    editHeader: {
      flexDirection: 'row', justifyContent: 'space-between',
      alignItems: 'center', marginBottom: 24,
    },
    editTitle:  { color: c.text, fontSize: 22, fontWeight: '900' },
    cancelIcon: { padding: 4 },

    avatarEditWrap:  { alignItems: 'center', marginBottom: 28 },
    avatarEditTouch: { position: 'relative' },
    avatarEditOverlay: {
      position: 'absolute', bottom: 4, right: 4,
      width: 38, height: 38, borderRadius: 19,
      backgroundColor: isDark ? c.accent : c.primary, justifyContent: 'center', alignItems: 'center',
      borderWidth: 2, borderColor: c.background,
    },
    avatarEditHint: { color: c.textMuted, fontSize: 11, fontWeight: '600', marginTop: 8 },
    removeAvatarBtn: { marginTop: 10, paddingVertical: 6, paddingHorizontal: 12 },
    removeAvatarText: { color: c.accent, fontSize: 13, fontWeight: '600' },

    editCard: {
      backgroundColor: c.card, borderRadius: 16,
      borderWidth: 1, borderColor: c.border,
      padding: 16, marginBottom: 24, gap: 4,
    },

    editField: { marginBottom: 14 },
    editLabel: {
      color: c.text, fontSize: 10, fontWeight: '700',
      letterSpacing: 0.8, marginBottom: 6, textTransform: 'uppercase',
    },
    editInput: {
      backgroundColor: c.surface, borderRadius: 10,
      paddingHorizontal: 12, paddingVertical: 12,
      color: c.text, fontSize: 14, borderWidth: 1.5, borderColor: c.border,
    },
    editInputMulti: { height: 80, textAlignVertical: 'top' },

    chipScroll: { marginBottom: 16 },
    chipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
    chip: {
      paddingHorizontal: 14, paddingVertical: 8,
      backgroundColor: c.surface, borderRadius: 20, marginRight: 8,
      borderWidth: 1.5, borderColor: c.border,
    },
    chipActive:     { backgroundColor: c.chipSelectedBg, borderColor: c.chipSelectedBg },
    chipText:       { color: c.textMuted, fontSize: 13, fontWeight: '700' },
    chipTextActive: { color: c.chipTextSelected },
    genderRow:      { flexDirection: 'row', gap: 8, marginBottom: 14 },
    genderChip: {
      flex: 1, paddingVertical: 10, alignItems: 'center',
      backgroundColor: c.surface, borderRadius: 10, borderWidth: 1.5, borderColor: c.border,
    },
    twoCol: { flexDirection: 'row', gap: 12 },

    saveRow:      { flexDirection: 'row', gap: 12, marginTop: 8 },
    btnCancel: {
      flex: 1, backgroundColor: c.card, borderRadius: 14,
      paddingVertical: 16, alignItems: 'center', borderWidth: 1.5, borderColor: c.border,
    },
    btnCancelText: { color: c.text, fontSize: 15, fontWeight: '700' },
    btnSave: {
      flex: 2, backgroundColor: c.accent, borderRadius: 14,
      paddingVertical: 16, alignItems: 'center',
      flexDirection: 'row', justifyContent: 'center', gap: 8,
    },
    btnDisabled:  { opacity: 0.6 },
    btnSaveText:  { color: '#FFFFFF', fontSize: 15, fontWeight: '900' },
  });
}
