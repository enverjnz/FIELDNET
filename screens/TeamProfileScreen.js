import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  SafeAreaView, StatusBar, ScrollView, ActivityIndicator,
  Alert, Image, Modal, RefreshControl,
} from 'react-native';
import {
  ArrowLeft, Edit2, Save, X, Users, Phone,
  Mail, Globe, Instagram, MapPin, Clock, Trophy,
  Check, Trash2, ChevronDown,
} from 'lucide-react-native';
import { supabase } from '../lib/supabase';

const B      = '#1A2F6E';
const R      = '#C01830';
const BG     = '#F0F4FF';
const BORDER = '#D1D8F0';
const MUTED  = '#6B7280';
const GREEN  = '#10B981';

// ─── Helper ──────────────────────────────────────────────────────────────────

const STATUS_LABELS = {
  pending:       { label: 'Ausstehend',  color: '#F59E0B' },
  approved:      { label: 'Aktiv',       color: GREEN     },
  coach_pending: { label: 'Trainer',     color: B         },
  declined:      { label: 'Abgelehnt',   color: '#EF4444' },
};

function EditField({ label, value, onChangeText, placeholder, keyboardType = 'default', multiline = false }) {
  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        style={[styles.fieldInput, multiline && styles.fieldInputMulti]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder ?? ''}
        placeholderTextColor="#9CA3AF"
        keyboardType={keyboardType}
        multiline={multiline}
        numberOfLines={multiline ? 3 : 1}
      />
    </View>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function TeamProfileScreen({ teamId, onBack, readOnly = false, onRequestJoin }) {
  const [team, setTeam]       = useState(null);
  const [kader, setKader]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving]   = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft]     = useState({});
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [leagues, setLeagues] = useState([]);
  const [leaguesLoading, setLeaguesLoading] = useState(false);
  const [leaguesError, setLeaguesError] = useState(null);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  useEffect(() => { loadData(); }, [teamId]);

  useEffect(() => {
    if (!isEditing) return;

    let cancelled = false;
    (async () => {
      setLeaguesLoading(true);
      setLeaguesError(null);
      try {
        const regionId = team?.regions_idregion ?? team?.regions?.id ?? null;
        let query = supabase.from('leagues').select('id, name').order('name', { ascending: true });
        if (regionId) query = query.eq('region_id', regionId);
        const { data, error } = await query;
        if (error) throw error;
        let leagueList = data ?? [];
        if (regionId && leagueList.length === 0) {
          const { data: allLeagues } = await supabase
            .from('leagues')
            .select('id, name')
            .order('name', { ascending: true });
          leagueList = allLeagues ?? [];
        }
        const currentId = team?.leagues?.id ?? team?.leagues_idleague;
        if (currentId && team?.leagues?.name && !leagueList.some((l) => l.id === currentId)) {
          leagueList = [{ id: currentId, name: team.leagues.name }, ...leagueList];
        }
        if (!cancelled) setLeagues(leagueList);
      } catch (e) {
        if (!cancelled) {
          setLeaguesError(e?.message ?? 'Ligen konnten nicht geladen werden.');
          setLeagues([]);
        }
      } finally {
        if (!cancelled) setLeaguesLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [isEditing, team]);

  const loadData = async () => {
    setLoading(true);
    const [{ data: teamData }, { data: kaderData }] = await Promise.all([
      supabase
        .from('teams')
        .select('id, name, short_name, town, founding_year, avatar_teamlogo, training_location, training_times, website, tel, email, instagram, primary_colour, secondary_colour, leagues_idleague, regions_idregion, leagues:leagues_idleague(id, name), regions:regions_idregion(id, name)')
        .eq('id', teamId)
        .maybeSingle(),
      supabase
        .from('team_memberships')
        .select('id, status, player_id, profiles(id, first_name, last_name, position, jersey_number, avatar, age, nationality)')
        .eq('team_id', teamId),
    ]);
    setTeam(teamData ?? null);
    setKader(kaderData ?? []);
    setLoading(false);
  };

  const startEditing = () => {
    if (!team) return;
    setDraft({
      name:              team.name              ?? '',
      short_name:        team.short_name        ?? '',
      town:              team.town              ?? '',
      founding_year:     team.founding_year     ? String(team.founding_year) : '',
      training_location: team.training_location ?? '',
      training_times:    team.training_times    ?? '',
      website:           team.website           ?? '',
      tel:               team.tel               ?? '',
      email:             team.email             ?? '',
      instagram:         team.instagram         ?? '',
      avatar_teamlogo:   team.avatar_teamlogo   ?? '',
      leagueId:          team.leagues?.id ?? team.leagues_idleague ?? null,
    });
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setIsEditing(false);
    setDraft({});
  };

  const saveProfile = async () => {
    if (!draft.name?.trim()) {
      Alert.alert('Fehler', 'Teamname ist Pflichtfeld.');
      return;
    }
    setSaving(true);
    const { error } = await supabase
      .from('teams')
      .update({
        name:              draft.name.trim(),
        short_name:        draft.short_name.trim()        || null,
        town:              draft.town.trim()              || null,
        founding_year:     draft.founding_year ? parseInt(draft.founding_year, 10) : null,
        training_location: draft.training_location.trim() || null,
        training_times:    draft.training_times.trim()    || null,
        website:           draft.website.trim()           || null,
        tel:               draft.tel.trim()               || null,
        email:             draft.email.trim()             || null,
        instagram:         draft.instagram.trim()         || null,
        avatar_teamlogo:   draft.avatar_teamlogo.trim()   || null,
        leagues_idleague:  draft.leagueId || null,
      })
      .eq('id', teamId);

    setSaving(false);

    if (error) {
      Alert.alert('Fehler', error.message);
    } else {
      Alert.alert('Gespeichert', 'Teamprofil wurde aktualisiert.');
      setIsEditing(false);
      loadData();
    }
  };

  const removePlayer = (membershipId, playerName) => {
    Alert.alert(
      'Spieler entfernen',
      `${playerName} wirklich aus dem Kader entfernen?`,
      [
        { text: 'Abbrechen', style: 'cancel' },
        {
          text: 'Entfernen', style: 'destructive',
          onPress: async () => {
            await supabase.from('team_memberships').delete().eq('id', membershipId);
            loadData();
          },
        },
      ],
    );
  };

  const acceptPlayer = async (membershipId) => {
    const { error } = await supabase
      .from('team_memberships')
      .update({ status: 'approved' })
      .eq('id', membershipId);
    if (error) {
      console.warn('acceptPlayer error:', JSON.stringify(error));
      Alert.alert('Fehler', error.message);
    } else {
      loadData();
    }
  };

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

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={isEditing ? cancelEditing : onBack} activeOpacity={0.75}>
          <ArrowLeft size={20} color={B} />
          <Text style={styles.backBtnText}>{isEditing ? 'Abbrechen' : 'Zurück'}</Text>
        </TouchableOpacity>

        {isEditing ? (
          <TouchableOpacity style={styles.saveBtn} onPress={saveProfile} disabled={saving} activeOpacity={0.85}>
            {saving
              ? <ActivityIndicator size="small" color="#FFFFFF" />
              : <>
                  <Save size={16} color="#FFFFFF" />
                  <Text style={styles.saveBtnText}>Speichern</Text>
                </>
            }
          </TouchableOpacity>
        ) : !readOnly ? (
          <TouchableOpacity style={styles.editBtn} onPress={startEditing} activeOpacity={0.85}>
            <Edit2 size={16} color={B} />
            <Text style={styles.editBtnText}>Bearbeiten</Text>
          </TouchableOpacity>
        ) : (
          <View style={{ width: 80 }} />
        )}
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        refreshControl={!isEditing ? <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={B} colors={[B]} /> : undefined}
      >
        {/* TEAM LOGO */}
        <View style={styles.logoSection}>
          {(isEditing ? draft.avatar_teamlogo : team?.avatar_teamlogo) ? (
            <Image
              source={{ uri: isEditing ? draft.avatar_teamlogo : team.avatar_teamlogo }}
              style={styles.teamLogo}
              resizeMode="contain"
            />
          ) : (
            <View style={styles.teamLogoPlaceholder}>
              <Trophy size={36} color="#FFFFFF" />
            </View>
          )}
          {isEditing && (
            <View style={styles.fieldWrap}>
              <Text style={styles.fieldLabel}>TEAM LOGO URL</Text>
              <TextInput
                style={styles.fieldInput}
                value={draft.avatar_teamlogo}
                onChangeText={(v) => setDraft(p => ({ ...p, avatar_teamlogo: v }))}
                placeholder="https://..."
                placeholderTextColor="#9CA3AF"
                autoCapitalize="none"
              />
            </View>
          )}
        </View>

        {/* ALLGEMEINE INFOS */}
        <Text style={styles.sectionTitle}>ALLGEMEINE INFOS</Text>
        <View style={styles.card}>
          {isEditing ? (
            <>
              <EditField label="TEAMNAME *" value={draft.name} onChangeText={(v) => setDraft(p => ({ ...p, name: v }))} placeholder="z. B. Nürnberg Rams" />
              <EditField label="KURZNAME" value={draft.short_name} onChangeText={(v) => setDraft(p => ({ ...p, short_name: v }))} placeholder="z. B. RAMS" />
              <EditField label="STADT" value={draft.town} onChangeText={(v) => setDraft(p => ({ ...p, town: v }))} placeholder="z. B. Nürnberg" />
              <EditField label="GRÜNDUNGSJAHR" value={draft.founding_year} onChangeText={(v) => setDraft(p => ({ ...p, founding_year: v }))} placeholder="z. B. 2005" keyboardType="numeric" />
              <LeagueSelect
                value={draft.leagueId}
                onChange={(id) => setDraft((p) => ({ ...p, leagueId: id }))}
                options={leagues.map((l) => ({ value: l.id, label: l.name }))}
                loading={leaguesLoading}
                error={leaguesError}
              />
            </>
          ) : (
            <>
              <InfoRow icon={<Trophy size={16} color={B} />} label="Teamname" value={team?.name} />
              <InfoRow icon={<Trophy size={16} color={B} />} label="Kurzname" value={team?.short_name} />
              <InfoRow icon={<MapPin size={16} color={B} />} label="Stadt" value={team?.town} />
              <InfoRow icon={<Clock size={16} color={B} />} label="Gründungsjahr" value={team?.founding_year ? String(team.founding_year) : null} />
              <InfoRow icon={<Users size={16} color={B} />} label="Liga" value={team?.leagues?.name} />
              <InfoRow icon={<MapPin size={16} color={B} />} label="Landesverband" value={team?.regions?.name} />
            </>
          )}
        </View>

        {/* TRAINING */}
        <Text style={styles.sectionTitle}>TRAINING</Text>
        <View style={styles.card}>
          {isEditing ? (
            <>
              <EditField label="TRAININGSORT" value={draft.training_location} onChangeText={(v) => setDraft(p => ({ ...p, training_location: v }))} placeholder="z. B. Sportpark Nord" />
              <EditField label="TRAININGSZEITEN" value={draft.training_times} onChangeText={(v) => setDraft(p => ({ ...p, training_times: v }))} placeholder="z. B. Di & Do 19:00 Uhr" multiline />
            </>
          ) : (
            <>
              <InfoRow icon={<MapPin size={16} color={B} />} label="Trainingsort" value={team?.training_location} />
              <InfoRow icon={<Clock size={16} color={B} />} label="Trainingszeiten" value={team?.training_times} />
            </>
          )}
        </View>

        {/* KONTAKT */}
        <Text style={styles.sectionTitle}>KONTAKT</Text>
        <View style={styles.card}>
          {isEditing ? (
            <>
              <EditField label="TELEFON" value={draft.tel} onChangeText={(v) => setDraft(p => ({ ...p, tel: v }))} placeholder="+49 123 456789" keyboardType="phone-pad" />
              <EditField label="E-MAIL" value={draft.email} onChangeText={(v) => setDraft(p => ({ ...p, email: v }))} placeholder="info@meinteam.de" keyboardType="email-address" />
              <EditField label="WEBSEITE" value={draft.website} onChangeText={(v) => setDraft(p => ({ ...p, website: v }))} placeholder="https://meinteam.de" autoCapitalize="none" />
              <EditField label="INSTAGRAM" value={draft.instagram} onChangeText={(v) => setDraft(p => ({ ...p, instagram: v }))} placeholder="@meinteam" autoCapitalize="none" />
            </>
          ) : (
            <>
              <InfoRow icon={<Phone size={16} color={B} />} label="Telefon" value={team?.tel} />
              <InfoRow icon={<Mail size={16} color={B} />} label="E-Mail" value={team?.email} />
              <InfoRow icon={<Globe size={16} color={B} />} label="Webseite" value={team?.website} />
              <InfoRow icon={<Instagram size={16} color={B} />} label="Instagram" value={team?.instagram} />
            </>
          )}
        </View>

        {/* KADER */}
        <View style={styles.kaderHeader}>
          <Text style={styles.sectionTitle}>KADER</Text>
          <Text style={styles.kaderCount}>{(readOnly ? kader.filter((m) => m.status === 'approved') : kader).length} Mitglieder</Text>
        </View>

        {(() => {
          const visibleKader = readOnly
            ? kader.filter((m) => m.status === 'approved')
            : kader;
          return visibleKader.length === 0 ? (
          <View style={styles.emptyKader}>
            <Users size={28} color={MUTED} />
            <Text style={styles.emptyKaderText}>Noch keine Spieler im Kader</Text>
          </View>
        ) : (
          visibleKader.map((member) => {
            const p      = member.profiles;
            const name   = p ? [p.first_name, p.last_name].filter(Boolean).join(' ') : 'Unbekannt';
            const initials = name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
            const status = STATUS_LABELS[member.status] ?? { label: member.status, color: MUTED };
            return (
              <View key={member.id} style={styles.playerRow}>
                {/* Avatar — klickbar */}
                <TouchableOpacity onPress={() => setSelectedPlayer({ ...p, name, status: member.status })} activeOpacity={0.75}>
                  {p?.avatar
                    ? <Image source={{ uri: p.avatar }} style={styles.playerAvatarImg} />
                    : (
                      <View style={styles.playerAvatar}>
                        <Text style={styles.playerAvatarText}>{initials}</Text>
                      </View>
                    )
                  }
                </TouchableOpacity>

                {/* Name + Meta — klickbar */}
                <TouchableOpacity style={styles.playerInfo} onPress={() => setSelectedPlayer({ ...p, name, status: member.status })} activeOpacity={0.75}>
                  <Text style={styles.playerName}>{name}</Text>
                  <Text style={styles.playerMeta}>
                    {[p?.position, p?.jersey_number ? `#${p.jersey_number}` : null].filter(Boolean).join('  ·  ') || 'Keine Position'}
                  </Text>
                </TouchableOpacity>

                <View style={[styles.statusBadge, { borderColor: status.color }]}>
                  <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
                </View>

                {member.status === 'pending' && !readOnly && (
                  <TouchableOpacity
                    style={styles.acceptBtn}
                    onPress={() => acceptPlayer(member.id)}
                    hitSlop={6}
                  >
                    <Check size={16} color={GREEN} />
                  </TouchableOpacity>
                )}
                {!readOnly && (
                  <TouchableOpacity
                    style={styles.removeBtn}
                    onPress={() => removePlayer(member.id, name)}
                    hitSlop={6}
                  >
                    <Trash2 size={16} color={R} />
                  </TouchableOpacity>
                )}
              </View>
            );
          })
        );
        })()}

        {readOnly && onRequestJoin && team && (
          <TouchableOpacity
            style={styles.joinBtn}
            onPress={() => onRequestJoin(team)}
            activeOpacity={0.85}
          >
            <Users size={18} color="#FFFFFF" />
            <Text style={styles.joinBtnText}>Beitrittsanfrage senden</Text>
          </TouchableOpacity>
        )}

        <View style={{ height: 60 }} />
      </ScrollView>

      {/* SPIELER PROFIL MODAL */}
      <Modal
        visible={!!selectedPlayer}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setSelectedPlayer(null)}
      >
        {selectedPlayer && (
          <SafeAreaView style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Spielerprofil</Text>
              <TouchableOpacity onPress={() => setSelectedPlayer(null)} hitSlop={8}>
                <X size={22} color={B} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.modalScroll} showsVerticalScrollIndicator={false}>
              {/* Avatar */}
              <View style={styles.modalAvatarWrap}>
                {selectedPlayer.avatar
                  ? <Image source={{ uri: selectedPlayer.avatar }} style={styles.modalAvatarImg} />
                  : (
                    <View style={styles.modalAvatarPlaceholder}>
                      <Text style={styles.modalAvatarInitials}>
                        {selectedPlayer.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                      </Text>
                    </View>
                  )
                }
                <Text style={styles.modalName}>{selectedPlayer.name}</Text>
                {selectedPlayer.position && (
                  <View style={styles.modalPosPill}>
                    <Text style={styles.modalPosPillText}>{selectedPlayer.position}</Text>
                  </View>
                )}
              </View>

              {/* Stats */}
              <View style={styles.modalStatsGrid}>
                {selectedPlayer.jersey_number && (
                  <View style={styles.modalStatCard}>
                    <Text style={styles.modalStatLabel}>TRIKOTNUMMER</Text>
                    <Text style={styles.modalStatValue}>#{selectedPlayer.jersey_number}</Text>
                  </View>
                )}
                {selectedPlayer.age && (
                  <View style={styles.modalStatCard}>
                    <Text style={styles.modalStatLabel}>ALTER</Text>
                    <Text style={styles.modalStatValue}>{selectedPlayer.age} J.</Text>
                  </View>
                )}
                {selectedPlayer.nationality && (
                  <View style={styles.modalStatCard}>
                    <Text style={styles.modalStatLabel}>NATIONALITÄT</Text>
                    <Text style={styles.modalStatValue}>{selectedPlayer.nationality}</Text>
                  </View>
                )}
                <View style={styles.modalStatCard}>
                  <Text style={styles.modalStatLabel}>STATUS</Text>
                  <Text style={[styles.modalStatValue, { color: STATUS_LABELS[selectedPlayer.status]?.color ?? MUTED }]}>
                    {STATUS_LABELS[selectedPlayer.status]?.label ?? selectedPlayer.status}
                  </Text>
                </View>
              </View>
            </ScrollView>
          </SafeAreaView>
        )}
      </Modal>
    </SafeAreaView>
  );
}

function LeagueSelect({ value, onChange, options, loading, error }) {
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => o.value === value);

  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.fieldLabel}>LIGA</Text>
      <TouchableOpacity
        style={[styles.leagueTrigger, error && styles.leagueTriggerError]}
        onPress={() => !loading && setOpen(true)}
        activeOpacity={0.8}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator size="small" color={B} style={{ flex: 1 }} />
        ) : (
          <Text style={[styles.leagueTriggerText, !selected && styles.leaguePlaceholder]} numberOfLines={1}>
            {selected?.label ?? 'Liga auswählen…'}
          </Text>
        )}
        <ChevronDown size={18} color={MUTED} />
      </TouchableOpacity>
      {!!error && <Text style={styles.leagueError}>{error}</Text>}

      <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
        <View style={styles.leagueOverlay}>
          <TouchableOpacity style={styles.leagueBackdrop} activeOpacity={1} onPress={() => setOpen(false)} />
          <View style={styles.leagueSheet}>
            <View style={styles.leagueSheetHeader}>
              <Text style={styles.leagueSheetTitle}>Liga wählen</Text>
              <TouchableOpacity onPress={() => setOpen(false)} hitSlop={8}>
                <X size={22} color={B} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.leagueList} keyboardShouldPersistTaps="handled">
              {options.length === 0 ? (
                <Text style={styles.leagueEmpty}>Keine Ligen verfügbar.</Text>
              ) : (
                options.map((option) => {
                  const active = option.value === value;
                  return (
                    <TouchableOpacity
                      key={String(option.value)}
                      style={[styles.leagueItem, active && styles.leagueItemActive]}
                      onPress={() => { onChange(option.value); setOpen(false); }}
                      activeOpacity={0.75}
                    >
                      <Text style={[styles.leagueItemText, active && styles.leagueItemTextActive]}>
                        {option.label}
                      </Text>
                      {active && <Check size={18} color={R} />}
                    </TouchableOpacity>
                  );
                })
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ─── Info Row (View mode) ─────────────────────────────────────────────────────

function InfoRow({ icon, label, value }) {
  if (!value) return null;
  return (
    <View style={styles.infoRow}>
      <View style={styles.infoIcon}>{icon}</View>
      <View style={{ flex: 1 }}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value}</Text>
      </View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: '#FFFFFF' },
  scroll: { paddingHorizontal: 20, paddingBottom: 20 },

  header: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', paddingRight: 16,
  },
  backBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 20, paddingVertical: 14,
  },
  backBtnText: { color: B, fontSize: 14, fontWeight: '700' },

  editBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: BG, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 9,
    borderWidth: 1.5, borderColor: BORDER,
  },
  editBtnText: { color: B, fontSize: 13, fontWeight: '700' },

  saveBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: B, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 9,
  },
  saveBtnText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },

  logoSection:       { alignItems: 'center', paddingVertical: 20 },
  teamLogo:          { width: 90, height: 90, borderRadius: 18, marginBottom: 8, backgroundColor: BG },
  teamLogoPlaceholder: {
    width: 90, height: 90, borderRadius: 18, marginBottom: 8,
    backgroundColor: B, justifyContent: 'center', alignItems: 'center',
  },

  sectionTitle: {
    color: MUTED, fontSize: 10, fontWeight: '800',
    letterSpacing: 1.2, marginBottom: 10, marginTop: 6,
  },
  card: {
    backgroundColor: BG, borderRadius: 16,
    borderWidth: 1, borderColor: BORDER,
    padding: 16, marginBottom: 18,
  },

  infoRow: {
    flexDirection: 'row', alignItems: 'flex-start',
    paddingVertical: 8, gap: 12,
    borderBottomWidth: 1, borderBottomColor: BORDER,
  },
  infoIcon: { width: 28, alignItems: 'center', paddingTop: 2 },
  infoLabel: { color: MUTED, fontSize: 10, fontWeight: '700', letterSpacing: 0.5, marginBottom: 2 },
  infoValue: { color: B, fontSize: 14, fontWeight: '600' },

  fieldWrap:  { marginBottom: 12 },
  fieldLabel: { color: B, fontSize: 10, fontWeight: '800', letterSpacing: 0.8, marginBottom: 6 },
  fieldInput: {
    backgroundColor: '#FFFFFF', borderRadius: 10,
    borderWidth: 1.5, borderColor: BORDER,
    paddingHorizontal: 12, paddingVertical: 11,
    color: B, fontSize: 14,
  },
  fieldInputMulti: { height: 72, textAlignVertical: 'top' },

  leagueTrigger: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#FFFFFF', borderRadius: 10,
    borderWidth: 1.5, borderColor: BORDER,
    paddingHorizontal: 12, paddingVertical: 11, minHeight: 44,
  },
  leagueTriggerError: { borderColor: R },
  leagueTriggerText: { flex: 1, color: B, fontSize: 14, fontWeight: '600', marginRight: 8 },
  leaguePlaceholder: { color: '#9CA3AF', fontWeight: '400' },
  leagueError: { color: R, fontSize: 11, marginTop: 4 },
  leagueOverlay: { flex: 1, justifyContent: 'flex-end' },
  leagueBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(26,47,110,0.4)' },
  leagueSheet: {
    backgroundColor: '#FFFFFF', borderTopLeftRadius: 20, borderTopRightRadius: 20,
    maxHeight: '60%', paddingBottom: 24,
  },
  leagueSheetHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 16,
    borderBottomWidth: 1, borderBottomColor: BORDER,
  },
  leagueSheetTitle: { color: B, fontSize: 16, fontWeight: '800' },
  leagueList: { maxHeight: 320 },
  leagueItem: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 16,
    borderBottomWidth: 1, borderBottomColor: BORDER,
  },
  leagueItemActive: { backgroundColor: BG },
  leagueItemText: { color: B, fontSize: 15, fontWeight: '500', flex: 1 },
  leagueItemTextActive: { fontWeight: '800' },
  leagueEmpty: { color: MUTED, fontSize: 14, textAlign: 'center', padding: 24 },

  kaderHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 10, marginTop: 6,
  },
  kaderCount: { color: MUTED, fontSize: 12, fontWeight: '600' },

  emptyKader: {
    alignItems: 'center', paddingVertical: 32, gap: 10,
    backgroundColor: BG, borderRadius: 16,
    borderWidth: 1, borderColor: BORDER,
  },
  emptyKaderText: { color: MUTED, fontSize: 13 },

  playerRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: BG, borderRadius: 14,
    padding: 12, marginBottom: 8,
    borderWidth: 1, borderColor: BORDER,
  },
  playerAvatar: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: B, justifyContent: 'center', alignItems: 'center',
  },
  playerAvatarImg: { width: 42, height: 42, borderRadius: 21 },
  playerAvatarText: { color: '#FFFFFF', fontSize: 13, fontWeight: '800' },
  playerInfo:  { flex: 1 },
  playerName:  { color: B, fontSize: 14, fontWeight: '700' },
  playerMeta:  { color: MUTED, fontSize: 11, marginTop: 2 },
  statusBadge: {
    borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3,
    borderWidth: 1.5,
  },
  statusText: { fontSize: 9, fontWeight: '800', letterSpacing: 0.3 },
  acceptBtn: {
    width: 30, height: 30, borderRadius: 10,
    backgroundColor: '#D1FAE5', justifyContent: 'center', alignItems: 'center',
  },
  removeBtn: {
    width: 30, height: 30, borderRadius: 10,
    backgroundColor: '#FFF0F2', justifyContent: 'center', alignItems: 'center',
  },

  // Player profile modal
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', paddingHorizontal: 20, paddingVertical: 18,
    borderBottomWidth: 1, borderBottomColor: BORDER,
  },
  modalTitle: { color: B, fontSize: 18, fontWeight: '900' },
  modalScroll: { paddingHorizontal: 20, paddingBottom: 40 },

  modalAvatarWrap: { alignItems: 'center', paddingVertical: 28 },
  modalAvatarImg: {
    width: 96, height: 96, borderRadius: 48,
    borderWidth: 3, borderColor: B, marginBottom: 12,
  },
  modalAvatarPlaceholder: {
    width: 96, height: 96, borderRadius: 48,
    backgroundColor: B, justifyContent: 'center', alignItems: 'center',
    marginBottom: 12,
  },
  modalAvatarInitials: { color: '#FFFFFF', fontSize: 32, fontWeight: '900' },
  modalName: { color: B, fontSize: 22, fontWeight: '900', marginBottom: 8 },
  modalPosPill: {
    backgroundColor: BG, borderRadius: 20,
    paddingHorizontal: 14, paddingVertical: 5,
    borderWidth: 1.5, borderColor: BORDER,
  },
  modalPosPillText: { color: B, fontSize: 12, fontWeight: '800' },

  modalStatsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  modalStatCard: {
    width: '47%', backgroundColor: BG,
    borderRadius: 14, borderWidth: 1, borderColor: BORDER,
    padding: 14,
  },
  modalStatLabel: { color: MUTED, fontSize: 10, fontWeight: '700', letterSpacing: 0.8, marginBottom: 6 },
  modalStatValue: { color: B, fontSize: 18, fontWeight: '900' },

  joinBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: R, borderRadius: 14, paddingVertical: 16, marginTop: 8,
  },
  joinBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '800' },
});
