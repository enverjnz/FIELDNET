import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { ArrowLeft, Users, Check, Plus } from 'lucide-react-native';
import { fetchLeagueChatOptions, joinLeagueConversation } from '../lib/chat';
import { useTheme } from '../context/ThemeContext';
import { createLeagueChatJoinStyles } from '../theme/chatStyles';

const GREEN = '#10B981';

export default function LeagueChatJoinScreen({ onBack, onJoined }) {
  const { colors } = useTheme();
  const styles = useMemo(() => createLeagueChatJoinStyles(colors), [colors]);

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
      <StatusBar barStyle={colors.statusBarStyle} backgroundColor={colors.background} />

      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack} activeOpacity={0.75}>
          <ArrowLeft size={20} color={colors.text} />
          <Text style={styles.backBtnText}>Zurück</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Liga-Chat beitreten</Text>
        <View style={{ width: 72 }} />
      </View>

      <Text style={styles.hint}>
        Wähle eine Liga — du kannst jederzeit beitreten und mit anderen Fans chatten.
      </Text>

      {loading ? (
        <ActivityIndicator color={colors.text} style={{ marginTop: 32 }} />
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
                  <Users size={20} color={colors.text} />
                </View>
                <View style={styles.cardBody}>
                  <Text style={styles.cardTitle}>{opt.league_name}</Text>
                  <Text style={styles.cardMeta}>{opt.member_count} Mitglieder</Text>
                </View>
                {busy ? (
                  <ActivityIndicator color={colors.text} size="small" />
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
