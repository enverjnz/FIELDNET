import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ScrollView,
  Alert,
  ActivityIndicator,
  Switch,
} from 'react-native';
import { ChevronRight, Trash2, UserMinus, X, Sun, Moon } from 'lucide-react-native';
import { supabase } from '../lib/supabase';
import { useTheme } from '../context/ThemeContext';

type Membership = {
  id: string;
  status: string;
  teams: { id: string; name: string } | null;
};

type Props = {
  onBack: () => void;
  onDeleteAccount: () => void;
  onTeamLeft?: () => void;
};

const STATUS_LABEL: Record<string, string> = {
  pending: 'Anfrage läuft',
  approved: 'Mitglied',
  declined: 'Abgelehnt',
  coach_pending: 'Trainer-Anfrage',
};

function createStyles(c: ReturnType<typeof useTheme>['colors']) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: c.background },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 18,
      borderBottomWidth: 1,
      borderBottomColor: c.border,
    },
    title: { color: c.text, fontSize: 22, fontWeight: '900' },
    scroll: { paddingHorizontal: 20, paddingTop: 24, paddingBottom: 40 },
    sectionTitle: {
      color: c.textMuted,
      fontSize: 10,
      fontWeight: '800',
      letterSpacing: 1.2,
      marginBottom: 10,
    },
    card: {
      backgroundColor: c.card,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: c.border,
      overflow: 'hidden',
      marginBottom: 24,
    },
    loadingWrap: { paddingVertical: 24, alignItems: 'center' },
    emptyWrap: { paddingHorizontal: 16, paddingVertical: 20 },
    emptyText: { color: c.textMuted, fontSize: 13, textAlign: 'center', lineHeight: 20 },
    appearanceRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingHorizontal: 16,
      paddingVertical: 16,
    },
    appearanceIconWrap: {
      width: 40,
      height: 40,
      borderRadius: 12,
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    appearanceLabel: { color: c.text, fontSize: 15, fontWeight: '800' },
    appearanceSub: { color: c.textMuted, fontSize: 11, marginTop: 3, lineHeight: 16 },
    themeOptions: {
      flexDirection: 'row',
      gap: 8,
      paddingHorizontal: 16,
      paddingBottom: 16,
    },
    themeOption: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      paddingVertical: 12,
      borderRadius: 12,
      borderWidth: 1.5,
      borderColor: c.border,
      backgroundColor: c.surface,
    },
    themeOptionActive: {
      backgroundColor: c.chipSelectedBg,
      borderColor: c.chipSelectedBg,
    },
    themeOptionText: { color: c.text, fontSize: 13, fontWeight: '700' },
    themeOptionTextActive: { color: '#FFFFFF' },
    teamRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingHorizontal: 16,
      paddingVertical: 16,
    },
    teamRowBorder: { borderTopWidth: 1, borderTopColor: c.border },
    teamIconWrap: {
      width: 40,
      height: 40,
      borderRadius: 12,
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.border,
      justifyContent: 'center',
      alignItems: 'center',
    },
    teamLabel: { color: c.text, fontSize: 15, fontWeight: '800' },
    teamName: { color: c.text, fontSize: 13, fontWeight: '600', marginTop: 2 },
    teamStatus: { color: c.textMuted, fontSize: 11, marginTop: 2 },
    dangerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingHorizontal: 16,
      paddingVertical: 16,
    },
    dangerIconWrap: {
      width: 40,
      height: 40,
      borderRadius: 12,
      backgroundColor: c.signOutBg,
      borderWidth: 1,
      borderColor: c.accent,
      justifyContent: 'center',
      alignItems: 'center',
    },
    dangerLabel: { color: c.accent, fontSize: 15, fontWeight: '800' },
    dangerSub: { color: c.textMuted, fontSize: 11, marginTop: 3, lineHeight: 16 },
  });
}

export default function SettingsScreen({ onBack, onDeleteAccount, onTeamLeft }: Props) {
  const { colors, isDark, setMode } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [loadingTeams, setLoadingTeams] = useState(true);
  const [leavingId, setLeavingId] = useState<string | null>(null);

  const loadMemberships = useCallback(async () => {
    setLoadingTeams(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setMemberships([]);
        return;
      }

      const { data, error } = await supabase
        .from('team_memberships')
        .select('id, status, teams(id, name)')
        .eq('player_id', user.id);

      if (error) throw error;
      setMemberships((data as unknown as Membership[]) ?? []);
    } catch (e) {
      console.warn('SettingsScreen loadMemberships:', (e as Error)?.message);
      setMemberships([]);
    } finally {
      setLoadingTeams(false);
    }
  }, []);

  useEffect(() => {
    loadMemberships();
  }, [loadMemberships]);

  const leaveTeam = (membership: Membership) => {
    const teamName = membership.teams?.name ?? 'dieses Team';
    Alert.alert(
      'Team verlassen',
      `Möchtest du ${teamName} wirklich verlassen?`,
      [
        { text: 'Abbrechen', style: 'cancel' },
        {
          text: 'Verlassen',
          style: 'destructive',
          onPress: async () => {
            setLeavingId(membership.id);
            try {
              const { data: { user } } = await supabase.auth.getUser();
              if (!user) throw new Error('Nicht eingeloggt.');

              const { error } = await supabase
                .from('team_memberships')
                .delete()
                .eq('id', membership.id)
                .eq('player_id', user.id);

              if (error) throw error;
              Alert.alert('Erledigt', `Du hast ${teamName} verlassen.`);
              await loadMemberships();
              onTeamLeft?.();
            } catch (err: unknown) {
              const message =
                err instanceof Error ? err.message : 'Team konnte nicht verlassen werden.';
              Alert.alert('Fehler', message);
            } finally {
              setLeavingId(null);
            }
          },
        },
      ],
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle={colors.statusBarStyle} backgroundColor={colors.background} />

      <View style={styles.header}>
        <Text style={styles.title}>Einstellungen</Text>
        <TouchableOpacity onPress={onBack} hitSlop={8} activeOpacity={0.7}>
          <X size={22} color={colors.text} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.sectionTitle}>DARSTELLUNG</Text>
        <View style={styles.card}>
          <View style={styles.appearanceRow}>
            <View style={styles.appearanceIconWrap}>
              {isDark ? <Moon size={18} color={colors.text} /> : <Sun size={18} color={colors.text} />}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.appearanceLabel}>Dunkler Modus</Text>
              <Text style={styles.appearanceSub}>
                {isDark ? 'Dunkle App-Oberfläche aktiv' : 'Helle App-Oberfläche aktiv'}
              </Text>
            </View>
            <Switch
              value={isDark}
              onValueChange={(value) => setMode(value ? 'dark' : 'light')}
              trackColor={{ false: colors.border, true: colors.accent }}
              thumbColor="#FFFFFF"
            />
          </View>
          <View style={styles.themeOptions}>
            <TouchableOpacity
              style={[styles.themeOption, !isDark && styles.themeOptionActive]}
              onPress={() => setMode('light')}
              activeOpacity={0.85}
            >
              <Sun size={16} color={!isDark ? '#FFFFFF' : colors.text} />
              <Text style={[styles.themeOptionText, !isDark && styles.themeOptionTextActive]}>
                Hell
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.themeOption, isDark && styles.themeOptionActive]}
              onPress={() => setMode('dark')}
              activeOpacity={0.85}
            >
              <Moon size={16} color={isDark ? '#FFFFFF' : colors.text} />
              <Text style={[styles.themeOptionText, isDark && styles.themeOptionTextActive]}>
                Dunkel
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <Text style={styles.sectionTitle}>TEAM</Text>
        <View style={styles.card}>
          {loadingTeams ? (
            <View style={styles.loadingWrap}>
              <ActivityIndicator color={colors.primary} />
            </View>
          ) : memberships.length === 0 ? (
            <View style={styles.emptyWrap}>
              <Text style={styles.emptyText}>Du bist keinem Team beigetreten.</Text>
            </View>
          ) : (
            memberships.map((membership, index) => {
              const teamName = membership.teams?.name ?? 'Unbekanntes Team';
              const statusLabel = STATUS_LABEL[membership.status] ?? membership.status;
              const isLeaving = leavingId === membership.id;

              return (
                <TouchableOpacity
                  key={membership.id}
                  style={[styles.teamRow, index > 0 && styles.teamRowBorder]}
                  onPress={() => leaveTeam(membership)}
                  activeOpacity={0.75}
                  disabled={isLeaving}
                >
                  <View style={styles.teamIconWrap}>
                    {isLeaving ? (
                      <ActivityIndicator size="small" color={colors.primary} />
                    ) : (
                      <UserMinus size={18} color={colors.text} />
                    )}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.teamLabel}>Team verlassen</Text>
                    <Text style={styles.teamName}>{teamName}</Text>
                    <Text style={styles.teamStatus}>{statusLabel}</Text>
                  </View>
                  <ChevronRight size={18} color={colors.textMuted} />
                </TouchableOpacity>
              );
            })
          )}
        </View>

        <Text style={[styles.sectionTitle, { marginTop: 8 }]}>KONTO</Text>
        <View style={styles.card}>
          <TouchableOpacity
            style={styles.dangerRow}
            onPress={onDeleteAccount}
            activeOpacity={0.75}
          >
            <View style={styles.dangerIconWrap}>
              <Trash2 size={18} color={colors.accent} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.dangerLabel}>Konto löschen</Text>
              <Text style={styles.dangerSub}>
                Dein Profil und alle Daten werden unwiderruflich entfernt
              </Text>
            </View>
            <ChevronRight size={18} color={colors.accent} />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
