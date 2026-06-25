import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ScrollView,
  ActivityIndicator,
  Image,
} from 'react-native';
import {
  ArrowLeft,
  Shield,
  Hash,
  Calendar,
  User,
  Ruler,
  Weight,
  Flag,
  Users,
  Trophy,
} from 'lucide-react-native';
import { supabase } from '../lib/supabase';
import FullscreenImageModal from '../components/FullscreenImageModal';

const B = '#1A2F6E';
const R = '#C01830';
const BG = '#F0F4FF';
const BORDER = '#D1D8F0';
const MUTED = '#6B7280';

function StatCard({ icon, label, value }) {
  if (value == null || value === '') return null;
  return (
    <View style={styles.statCard}>
      <View style={styles.statIcon}>{icon}</View>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );
}

function StatNumCard({ label, value }) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value ?? 0}</Text>
    </View>
  );
}

export default function PlayerProfileScreen({ profileId, onBack }) {
  const [profile, setProfile] = useState(null);
  const [teams, setTeams] = useState([]);
  const [playerStats, setPlayerStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [fullscreenImage, setFullscreenImage] = useState(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      const [{ data: prof }, { data: memberships }, { data: stats }] = await Promise.all([
        supabase
          .from('profiles')
          .select('*')
          .eq('id', profileId)
          .maybeSingle(),
        supabase
          .from('team_memberships')
          .select('status, teams(id, name, short_name, town, avatar_teamlogo)')
          .eq('player_id', profileId)
          .eq('status', 'approved'),
        supabase
          .from('profile_stats')
          .select('*')
          .eq('profile_id', profileId)
          .maybeSingle(),
      ]);

      if (!cancelled) {
        setProfile(prof ?? null);
        setTeams((memberships ?? []).map((m) => m.teams).filter(Boolean));
        setPlayerStats(stats ?? null);
        setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [profileId]);

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
        <TouchableOpacity style={styles.backBtn} onPress={onBack}>
          <ArrowLeft size={20} color={B} />
          <Text style={styles.backBtnText}>Zurück</Text>
        </TouchableOpacity>
        <ActivityIndicator color={B} style={{ marginTop: 60 }} />
      </SafeAreaView>
    );
  }

  if (!profile) {
    return (
      <SafeAreaView style={styles.safe}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
        <TouchableOpacity style={styles.backBtn} onPress={onBack}>
          <ArrowLeft size={20} color={B} />
          <Text style={styles.backBtnText}>Zurück</Text>
        </TouchableOpacity>
        <Text style={styles.emptyText}>Profil nicht gefunden.</Text>
      </SafeAreaView>
    );
  }

  const fullName = [profile.first_name, profile.last_name].filter(Boolean).join(' ') || 'Unbekannt';
  const initials = fullName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();
  const memberSince = profile.created_at
    ? new Date(profile.created_at).toLocaleDateString('de-DE', { month: 'long', year: 'numeric' })
    : null;

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <TouchableOpacity style={styles.backBtn} onPress={onBack} activeOpacity={0.75}>
        <ArrowLeft size={20} color={B} />
        <Text style={styles.backBtnText}>Zurück</Text>
      </TouchableOpacity>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.headerSection}>
          {profile.avatar ? (
            <TouchableOpacity onPress={() => setFullscreenImage(profile.avatar)} activeOpacity={0.85}>
              <Image source={{ uri: profile.avatar }} style={styles.avatar} />
            </TouchableOpacity>
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarInitials}>{initials}</Text>
            </View>
          )}
          <Text style={styles.fullName}>{fullName}</Text>
          {profile.position ? (
            <View style={styles.positionPill}>
              <Text style={styles.positionPillText}>{profile.position}</Text>
            </View>
          ) : null}
          {profile.bio ? <Text style={styles.bio}>{profile.bio}</Text> : null}
        </View>

        {teams.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>TEAM</Text>
            {teams.map((team) => (
              <View key={team.id} style={styles.teamRow}>
                {team.avatar_teamlogo ? (
                  <Image source={{ uri: team.avatar_teamlogo }} style={styles.teamLogo} resizeMode="contain" />
                ) : (
                  <View style={styles.teamLogoPlaceholder}>
                    <Trophy size={16} color={B} />
                  </View>
                )}
                <View style={{ flex: 1 }}>
                  <Text style={styles.teamName}>{team.name}</Text>
                  <Text style={styles.teamMeta}>
                    {[team.town, team.short_name].filter(Boolean).join(' · ') || 'Team'}
                  </Text>
                </View>
              </View>
            ))}
          </>
        )}

        {playerStats && (
          <>
            <Text style={styles.sectionTitle}>STATISTIKEN</Text>
            <View style={styles.statsGrid}>
              <StatNumCard label="Spiele" value={playerStats.games_played} />
              <StatNumCard label="Touchdowns" value={playerStats.touchdowns} />
              <StatNumCard label="Field Goals" value={playerStats.field_goals} />
              <StatNumCard label="Extra Points" value={playerStats.extra_points} />
              <StatNumCard label="2-PT Conv." value={playerStats.two_point_conversions} />
              <StatNumCard label="Interceptions" value={playerStats.interceptions} />
              <StatNumCard label="Sacks" value={playerStats.sacks} />
            </View>
          </>
        )}

        <Text style={styles.sectionTitle}>SPIELERINFORMATIONEN</Text>
        <View style={styles.statsGrid}>
          <StatCard icon={<Shield size={18} color={B} />} label="Position" value={profile.position} />
          <StatCard icon={<Hash size={18} color={B} />} label="Trikotnummer" value={profile.jersey_number ? `#${profile.jersey_number}` : null} />
          <StatCard icon={<Calendar size={18} color={B} />} label="Alter" value={profile.age ? `${profile.age} Jahre` : null} />
          <StatCard icon={<User size={18} color={B} />} label="Geschlecht" value={profile.gender} />
          <StatCard icon={<Ruler size={18} color={B} />} label="Größe" value={profile.height ? `${profile.height} cm` : null} />
          <StatCard icon={<Weight size={18} color={B} />} label="Gewicht" value={profile.weight ? `${profile.weight} kg` : null} />
          <StatCard icon={<Flag size={18} color={B} />} label="Nationalität" value={profile.nationality} />
          <StatCard icon={<Users size={18} color={B} />} label="Mitglied seit" value={memberSince} />
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      <FullscreenImageModal uri={fullscreenImage} onClose={() => setFullscreenImage(null)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FFFFFF' },
  scroll: { paddingHorizontal: 20, paddingBottom: 24 },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  backBtnText: { color: B, fontSize: 14, fontWeight: '700' },
  emptyText: { color: MUTED, fontSize: 14, textAlign: 'center', marginTop: 40 },

  headerSection: { alignItems: 'center', paddingVertical: 24 },
  avatar: { width: 110, height: 110, borderRadius: 28, marginBottom: 14 },
  avatarPlaceholder: {
    width: 110,
    height: 110,
    borderRadius: 28,
    backgroundColor: BG,
    borderWidth: 2,
    borderColor: BORDER,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  avatarInitials: { color: B, fontSize: 32, fontWeight: '900' },
  fullName: { color: B, fontSize: 24, fontWeight: '900', textAlign: 'center' },
  positionPill: {
    marginTop: 8,
    backgroundColor: BG,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: BORDER,
  },
  positionPillText: { color: B, fontSize: 12, fontWeight: '700' },
  bio: { color: MUTED, fontSize: 14, lineHeight: 20, textAlign: 'center', marginTop: 12, paddingHorizontal: 8 },

  sectionTitle: {
    color: MUTED,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 10,
    marginTop: 8,
  },
  teamRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: BG,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 12,
    marginBottom: 8,
  },
  teamLogo: { width: 44, height: 44, borderRadius: 12 },
  teamLogoPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: BORDER,
    alignItems: 'center',
    justifyContent: 'center',
  },
  teamName: { color: B, fontSize: 15, fontWeight: '700' },
  teamMeta: { color: MUTED, fontSize: 12, marginTop: 2 },

  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  statCard: {
    width: '47%',
    backgroundColor: BG,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 12,
  },
  statIcon: { marginBottom: 6 },
  statLabel: { color: MUTED, fontSize: 9, fontWeight: '800', letterSpacing: 0.5, marginBottom: 4 },
  statValue: { color: B, fontSize: 14, fontWeight: '700' },
});
