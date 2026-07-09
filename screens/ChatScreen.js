import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Image,
  Alert,
} from 'react-native';
import { MessageSquare, Users, MessageCirclePlus, Trophy } from 'lucide-react-native';
import {
  fetchMyConversations,
  formatChatName,
  joinLeagueConversation,
} from '../lib/chat';
import { useFilter } from '../context/FilterContext';
import { useTheme } from '../context/ThemeContext';
import { FilterEmptyPrompt } from '../components/MasterFilterBar';
import ChatRoomScreen from './ChatRoomScreen';
import LeagueChatJoinScreen from './LeagueChatJoinScreen';

const B = '#1A2F6E';
const R = '#C01830';
const BG = '#F0F4FF';
const BORDER = '#D1D8F0';
const MUTED = '#6B7280';
// Floating nav: bottom 30 + bar ~58 + Abstand 12
const BOTTOM_NAV_INSET = 100;

function Avatar({ uri, label, size = 52 }) {
  if (uri) {
    return (
      <Image
        source={{ uri }}
        style={{ width: size, height: size, borderRadius: size / 2 }}
      />
    );
  }
  return (
    <View style={[styles.avatarCircle, { width: size, height: size, borderRadius: size / 2 }]}>
      <Text style={[styles.avatarLetter, size < 52 && { fontSize: 12 }]}>
        {(label ?? '?').slice(0, 1).toUpperCase()}
      </Text>
    </View>
  );
}

function formatPreviewTime(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  if (isToday) {
    return d.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
  }
  return d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' });
}

export default function ChatScreen({ initialConversationId, onInitialConversationHandled }) {
  const { colors } = useTheme();
  const {
    selectedLeagueId,
    isFilterReady,
    catalogLoading,
    selectedLeague,
  } = useFilter();

  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeConversationId, setActiveConversationId] = useState(null);
  const [showLeagueJoin, setShowLeagueJoin] = useState(false);
  const [highlightedLeagueId, setHighlightedLeagueId] = useState(null);
  const [joiningLeague, setJoiningLeague] = useState(false);
  const prevLeagueFilterRef = useRef(null);
  const pendingLeagueOpenRef = useRef(false);

  const load = useCallback(async () => {
    try {
      const list = await fetchMyConversations();
      setConversations(list);
    } catch (e) {
      if (e?.message !== 'Bitte melde dich an.') {
        Alert.alert('Fehler', e?.message ?? 'Chats konnten nicht geladen werden.');
      }
      setConversations([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (initialConversationId) {
      setActiveConversationId(initialConversationId);
      onInitialConversationHandled?.();
    }
  }, [initialConversationId, onInitialConversationHandled]);

  const directChats = conversations.filter((c) => c.type === 'direct');
  const leagueChats = conversations.filter((c) => c.type === 'league');
  const selectedLeagueChat = leagueChats.find((c) => c.league_id === selectedLeagueId);

  useEffect(() => {
    if (!selectedLeagueId) return;
    setHighlightedLeagueId(selectedLeagueId);
    if (prevLeagueFilterRef.current !== selectedLeagueId) {
      prevLeagueFilterRef.current = selectedLeagueId;
      pendingLeagueOpenRef.current = true;
    }
  }, [selectedLeagueId]);

  useEffect(() => {
    if (!pendingLeagueOpenRef.current || loading || !selectedLeagueId) return;
    pendingLeagueOpenRef.current = false;
    if (selectedLeagueChat) {
      setActiveConversationId(selectedLeagueChat.id);
    }
  }, [loading, selectedLeagueChat, selectedLeagueId]);

  const handleJoinSelectedLeague = async () => {
    if (!selectedLeagueId || joiningLeague) return;
    setJoiningLeague(true);
    try {
      const convId = await joinLeagueConversation(selectedLeagueId);
      await load();
      setActiveConversationId(convId);
    } catch (e) {
      Alert.alert('Fehler', e?.message ?? 'Beitritt fehlgeschlagen.');
    } finally {
      setJoiningLeague(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    load();
  };

  if (!isFilterReady && !catalogLoading && !activeConversationId && !showLeagueJoin) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <FilterEmptyPrompt style={{ marginTop: 16 }} />
      </View>
    );
  }

  if (activeConversationId) {
    return (
      <View style={[styles.container, { paddingBottom: BOTTOM_NAV_INSET }]}>
        <ChatRoomScreen
          conversationId={activeConversationId}
          onBack={() => {
            setActiveConversationId(null);
            load();
          }}
        />
      </View>
    );
  }

  if (showLeagueJoin) {
    return (
      <View style={[styles.container, { paddingBottom: BOTTOM_NAV_INSET }]}>
        <LeagueChatJoinScreen
          onBack={() => setShowLeagueJoin(false)}
          onJoined={(convId) => {
            setShowLeagueJoin(false);
            setActiveConversationId(convId);
          }}
        />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.dmSection}>
        <Text style={styles.sectionTitle}>💬 DIREKTNACHRICHTEN</Text>
        {loading ? (
          <ActivityIndicator color={B} style={{ marginVertical: 20 }} />
        ) : directChats.length === 0 ? (
          <View style={styles.emptyBox}>
            <MessageSquare size={28} color={MUTED} />
            <Text style={styles.emptyTitle}>Noch keine Nachrichten</Text>
            <Text style={styles.emptySub}>
              Schreib anderen Spielern über deren Profil eine Nachricht.
            </Text>
          </View>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dmScroll}>
            {directChats.map((dm) => {
              const name = formatChatName(dm.other_user);
              return (
                <TouchableOpacity
                  key={dm.id}
                  style={styles.dmAvatarWrapper}
                  onPress={() => setActiveConversationId(dm.id)}
                  activeOpacity={0.75}
                >
                  <Avatar uri={dm.other_user?.avatar} label={name} />
                  <Text style={styles.dmName} numberOfLines={1}>{name}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}
      </View>

      <View style={styles.divider} />

      <View style={styles.channelSection}>
        <View style={styles.channelHeader}>
          <Text style={styles.sectionTitle}>👥 LIGA-CHATS</Text>
          <TouchableOpacity onPress={() => setShowLeagueJoin(true)} hitSlop={8}>
            <MessageCirclePlus size={20} color={R} />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.channelScroll}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={B} colors={[B]} />
          }
        >
          {loading || catalogLoading ? (
            <ActivityIndicator color={B} style={{ marginVertical: 24 }} />
          ) : null}

          {!loading && isFilterReady && selectedLeagueId && !selectedLeagueChat ? (
            <View style={styles.selectedLeagueBanner}>
              <Text style={styles.selectedLeagueTitle}>
                {selectedLeague?.name ?? 'Deine Liga'}
              </Text>
              <Text style={styles.selectedLeagueSub}>
                Du bist diesem Liga-Chat noch nicht beigetreten.
              </Text>
              <TouchableOpacity
                style={styles.joinCta}
                onPress={handleJoinSelectedLeague}
                disabled={joiningLeague}
              >
                {joiningLeague
                  ? <ActivityIndicator size="small" color="#FFFFFF" />
                  : <Text style={styles.joinCtaText}>Liga-Chat beitreten</Text>
                }
              </TouchableOpacity>
            </View>
          ) : null}

          {!loading ? (
            leagueChats.length === 0 && !(isFilterReady && selectedLeagueId && !selectedLeagueChat) ? (
            <View style={styles.emptyBox}>
              <Users size={28} color={MUTED} />
              <Text style={styles.emptyTitle}>Noch kein Liga-Chat</Text>
              <Text style={styles.emptySub}>
                Tippe auf + und tritt einer Liga-Gruppe freiwillig bei.
              </Text>
              <TouchableOpacity style={styles.joinCta} onPress={() => setShowLeagueJoin(true)}>
                <Text style={styles.joinCtaText}>Liga-Chat finden</Text>
              </TouchableOpacity>
            </View>
          ) : (
            leagueChats.map((channel) => {
              const isHighlighted = channel.league_id === highlightedLeagueId;
              return (
              <TouchableOpacity
                key={channel.id}
                style={[styles.channelCard, isHighlighted && styles.channelCardHighlighted]}
                onPress={() => setActiveConversationId(channel.id)}
                activeOpacity={0.85}
              >
                <View style={styles.channelIconCircle}>
                  <Trophy size={20} color={B} />
                </View>
                <View style={styles.channelInfo}>
                  <View style={styles.channelMetaRow}>
                    <Text style={styles.channelName} numberOfLines={1}>
                      {channel.title ?? 'Liga-Chat'}
                    </Text>
                    {channel.last_message_at ? (
                      <Text style={styles.channelTime}>
                        {formatPreviewTime(channel.last_message_at)}
                      </Text>
                    ) : null}
                  </View>
                  <Text style={styles.channelSubText}>{channel.member_count} Mitglieder</Text>
                  {channel.last_message ? (
                    <Text style={styles.channelLastMsg} numberOfLines={1}>
                      {channel.last_message}
                    </Text>
                  ) : null}
                </View>
              </TouchableOpacity>
              );
            })
          )
          ) : null}
          <View style={{ height: BOTTOM_NAV_INSET }} />
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  sectionTitle: {
    color: MUTED, fontSize: 10, fontWeight: '800', letterSpacing: 1,
    marginLeft: 16, marginBottom: 10,
  },
  dmSection: { marginTop: 16, paddingBottom: 4 },
  dmScroll: { paddingLeft: 16 },
  dmAvatarWrapper: { alignItems: 'center', marginRight: 16, width: 65 },
  avatarCircle: {
    backgroundColor: BG, borderColor: BORDER, borderWidth: 1.5,
    justifyContent: 'center', alignItems: 'center',
  },
  avatarLetter: { color: B, fontSize: 16, fontWeight: '800' },
  dmName: {
    color: MUTED, fontSize: 10, fontWeight: '600',
    marginTop: 6, textAlign: 'center', width: '100%',
  },
  divider: { height: 1, backgroundColor: BORDER, marginHorizontal: 16, marginVertical: 16 },
  channelSection: { flex: 1 },
  channelHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', paddingRight: 16,
  },
  channelScroll: { flex: 1, paddingHorizontal: 16 },
  channelCard: {
    flexDirection: 'row', backgroundColor: BG,
    borderColor: BORDER, borderWidth: 1, borderRadius: 14,
    padding: 12, marginBottom: 10, alignItems: 'center', gap: 12,
  },
  channelCardHighlighted: {
    borderColor: R,
    borderWidth: 2,
    backgroundColor: '#FFF5F7',
  },
  selectedLeagueBanner: {
    backgroundColor: BG,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: R,
    padding: 14,
    marginBottom: 12,
    gap: 6,
  },
  selectedLeagueTitle: { color: B, fontSize: 14, fontWeight: '800' },
  selectedLeagueSub: { color: MUTED, fontSize: 12, lineHeight: 17 },
  channelIconCircle: {
    width: 44, height: 44, borderRadius: 12,
    backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center',
  },
  channelInfo: { flex: 1 },
  channelMetaRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  channelName: { color: B, fontSize: 14, fontWeight: '800', flex: 1 },
  channelTime: { color: MUTED, fontSize: 10, fontWeight: '600' },
  channelSubText: { color: MUTED, fontSize: 11, marginTop: 2 },
  channelLastMsg: { color: B, fontSize: 12, marginTop: 4, opacity: 0.75 },
  emptyBox: {
    alignItems: 'center', justifyContent: 'center',
    paddingVertical: 32, paddingHorizontal: 24,
    backgroundColor: BG, borderRadius: 16,
    borderWidth: 1, borderColor: BORDER, gap: 8,
  },
  emptyTitle: { color: B, fontSize: 15, fontWeight: '800', textAlign: 'center' },
  emptySub: { color: MUTED, fontSize: 13, fontWeight: '500', textAlign: 'center', lineHeight: 18 },
  joinCta: {
    marginTop: 8, backgroundColor: R, borderRadius: 12,
    paddingHorizontal: 16, paddingVertical: 10,
  },
  joinCtaText: { color: '#FFFFFF', fontSize: 13, fontWeight: '800' },
});
