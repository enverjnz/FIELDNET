import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { ArrowLeft, Users, Check, Plus } from 'lucide-react-native';
import { fetchLeagueChatOptions, joinLeagueConversation } from '../lib/chat';

const B = '#1A2F6E';
const R = '#C01830';
const BG = '#F0F4FF';
const BORDER = '#D1D8F0';
const MUTED = '#6B7280';
const GREEN = '#10B981';

export default function LeagueChatJoinScreen({ onBack, onJoined }) {
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [joiningId, setJoiningId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const list = await fetchLeagueChatOptions();
      setOptions(list);
    } catch (e) {
      Alert.alert('Fehler', e?.message ?? 'Ligen konnten nicht geladen werden.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleJoin = async (leagueId, alreadyJoined, conversationId) => {
    if (alreadyJoined && conversationId) {
      onJoined?.(conversationId);
      return;
    }

    setJoiningId(leagueId);
    try {
      const convId = await joinLeagueConversation(leagueId);
      onJoined?.(convId);
    } catch (e) {
      Alert.alert('Fehler', e?.message ?? 'Beitritt fehlgeschlagen.');
    } finally {
      setJoiningId(null);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack} activeOpacity={0.75}>
          <ArrowLeft size={20} color={B} />
          <Text style={styles.backBtnText}>Zurück</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Liga-Chat beitreten</Text>
        <View style={{ width: 72 }} />
      </View>

      <Text style={styles.hint}>
        Wähle eine Liga — du kannst jederzeit beitreten und mit anderen Fans chatten.
      </Text>

      {loading ? (
        <ActivityIndicator color={B} style={{ marginTop: 32 }} />
      ) : (
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {options.map((opt) => {
            const busy = joiningId === opt.league_id;
            return (
              <TouchableOpacity
                key={opt.league_id}
                style={styles.card}
                onPress={() => handleJoin(opt.league_id, opt.is_joined, opt.conversation_id)}
                disabled={busy}
                activeOpacity={0.85}
              >
                <View style={styles.cardIcon}>
                  <Users size={20} color={B} />
                </View>
                <View style={styles.cardBody}>
                  <Text style={styles.cardTitle}>{opt.league_name}</Text>
                  <Text style={styles.cardMeta}>{opt.member_count} Mitglieder</Text>
                </View>
                {busy ? (
                  <ActivityIndicator color={B} size="small" />
                ) : opt.is_joined ? (
                  <View style={styles.joinedBadge}>
                    <Check size={14} color={GREEN} />
                    <Text style={styles.joinedText}>Offen</Text>
                  </View>
                ) : (
                  <View style={styles.joinBadge}>
                    <Plus size={14} color="#FFFFFF" />
                    <Text style={styles.joinText}>Beitreten</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
          <View style={{ height: 40 }} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FFFFFF' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, width: 72 },
  backBtnText: { color: B, fontSize: 14, fontWeight: '700' },
  headerTitle: { color: B, fontSize: 16, fontWeight: '900' },
  hint: {
    color: MUTED,
    fontSize: 13,
    lineHeight: 18,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontWeight: '500',
  },
  scroll: { paddingHorizontal: 16 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: BG,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 14,
    marginBottom: 10,
  },
  cardIcon: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center',
  },
  cardBody: { flex: 1 },
  cardTitle: { color: B, fontSize: 15, fontWeight: '800' },
  cardMeta: { color: MUTED, fontSize: 12, marginTop: 2 },
  joinBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: R,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  joinText: { color: '#FFFFFF', fontSize: 11, fontWeight: '800' },
  joinedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ECFDF5',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  joinedText: { color: GREEN, fontSize: 11, fontWeight: '800' },
});
