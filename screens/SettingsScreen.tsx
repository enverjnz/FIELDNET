import React, { useCallback, useEffect, useState } from 'react';
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
} from 'react-native';
import { ChevronRight, Trash2, UserMinus, X } from 'lucide-react-native';
import { supabase } from '../lib/supabase';

const B = '#1A2F6E';
const R = '#C01830';
const BG = '#F0F4FF';
const BORDER = '#D1D8F0';
const MUTED = '#6B7280';

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

export default function SettingsScreen({ onBack, onDeleteAccount, onTeamLeft }: Props) {
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
      setMemberships((data as Membership[]) ?? []);
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
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <View style={styles.header}>
        <Text style={styles.title}>Einstellungen</Text>
        <TouchableOpacity onPress={onBack} hitSlop={8} activeOpacity={0.7}>
          <X size={22} color={B} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.sectionTitle}>TEAM</Text>
        <View style={styles.card}>
          {loadingTeams ? (
            <View style={styles.loadingWrap}>
              <ActivityIndicator color={B} />
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
                      <ActivityIndicator size="small" color={B} />
                    ) : (
                      <UserMinus size={18} color={B} />
                    )}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.teamLabel}>Team verlassen</Text>
                    <Text style={styles.teamName}>{teamName}</Text>
                    <Text style={styles.teamStatus}>{statusLabel}</Text>
                  </View>
                  <ChevronRight size={18} color={MUTED} />
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
              <Trash2 size={18} color={R} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.dangerLabel}>Konto löschen</Text>
              <Text style={styles.dangerSub}>
                Dein Profil und alle Daten werden unwiderruflich entfernt
              </Text>
            </View>
            <ChevronRight size={18} color={R} />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FFFFFF' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  title: { color: B, fontSize: 22, fontWeight: '900' },
  scroll: { paddingHorizontal: 20, paddingTop: 24, paddingBottom: 40 },
  sectionTitle: {
    color: MUTED,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.2,
    marginBottom: 10,
  },
  card: {
    backgroundColor: BG,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: BORDER,
    overflow: 'hidden',
    marginBottom: 24,
  },
  loadingWrap: { paddingVertical: 24, alignItems: 'center' },
  emptyWrap: { paddingHorizontal: 16, paddingVertical: 20 },
  emptyText: { color: MUTED, fontSize: 13, textAlign: 'center', lineHeight: 20 },
  teamRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  teamRowBorder: { borderTopWidth: 1, borderTopColor: BORDER },
  teamIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: BORDER,
    justifyContent: 'center',
    alignItems: 'center',
  },
  teamLabel: { color: B, fontSize: 15, fontWeight: '800' },
  teamName: { color: B, fontSize: 13, fontWeight: '600', marginTop: 2 },
  teamStatus: { color: MUTED, fontSize: 11, marginTop: 2 },
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
    backgroundColor: '#FFF0F2',
    borderWidth: 1,
    borderColor: '#FECDD3',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dangerLabel: { color: R, fontSize: 15, fontWeight: '800' },
  dangerSub: { color: MUTED, fontSize: 11, marginTop: 3, lineHeight: 16 },
});
