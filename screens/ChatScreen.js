import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Image,
  Alert,
} from 'react-native';
import { MessageSquare, Megaphone } from 'lucide-react-native';
import {
  fetchMyConversations,
  fetchUnreadCounts,
  formatChatName,
  subscribeToIncomingMessages,
} from '../lib/chat';
import { useFilter } from '../context/FilterContext';
import { useTheme } from '../context/ThemeContext';
import { FilterEmptyPrompt } from '../components/MasterFilterBar';
import ChatRoomScreen from './ChatRoomScreen';
import LeagueForum from '../components/LeagueForum';
import PlayerProfileScreen from './PlayerProfileScreen';
import { createChatListStyles } from '../theme/chatStyles';

// Floating nav: bottom 30 + bar ~58 + Abstand 12
const BOTTOM_NAV_INSET = 100;

function Avatar({ uri, label, size = 52, styles }) {
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

function UnreadBadge({ count, styles }) {
  if (!count || count < 1) return null;
  const label = count > 99 ? '99+' : String(count);
  return (
    <View style={styles.dmUnreadBadge}>
      <Text style={styles.dmUnreadBadgeText}>{label}</Text>
    </View>
  );
}

export default function ChatScreen({
  initialConversationId,
  onInitialConversationHandled,
  onDmChatOpenChange,
  onUnreadChange,
}) {
  const { colors } = useTheme();
  const styles = useMemo(() => createChatListStyles(colors), [colors]);
  const {
    selectedLeagueId,
    isFilterReady,
    catalogLoading,
    selectedLeague,
  } = useFilter();

  const [activeSubTab, setActiveSubTab] = useState(0); // 0 = DMs, 1 = Forum
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeConversationId, setActiveConversationId] = useState(null);
  const [viewProfileId, setViewProfileId] = useState(null);
  const openedAsDmRef = useRef(false);
  const onUnreadChangeRef = useRef(onUnreadChange);
  onUnreadChangeRef.current = onUnreadChange;

  const load = useCallback(async ({ silent = false } = {}) => {
    try {
      const list = await fetchMyConversations();
      setConversations(list);
    } catch (e) {
      if (e?.message !== 'Bitte melde dich an.') {
        Alert.alert('Fehler', e?.message ?? 'Chats konnten nicht geladen werden.');
      }
      if (!silent) setConversations([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  /** Update badge counts only — no list rebuild, no spinner. */
  const refreshUnreadBadges = useCallback(async () => {
    try {
      const counts = await fetchUnreadCounts();
      setConversations((prev) => {
        if (prev.length === 0) return prev;
        let changed = false;
        const next = prev.map((c) => {
          const unread = counts[c.id] ?? 0;
          if ((c.unread_count ?? 0) !== unread) {
            changed = true;
            return { ...c, unread_count: unread };
          }
          return c;
        });
        return changed ? next : prev;
      });
      onUnreadChangeRef.current?.();
    } catch {
      // ignore transient errors
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const unsubscribe = subscribeToIncomingMessages(() => {
      refreshUnreadBadges();
    });
    return unsubscribe;
  }, [refreshUnreadBadges]);

  useEffect(() => {
    if (initialConversationId) {
      openedAsDmRef.current = true;
      setActiveSubTab(0);
      setActiveConversationId(initialConversationId);
      onInitialConversationHandled?.();
    }
  }, [initialConversationId, onInitialConversationHandled]);

  const directChats = conversations.filter((c) => c.type === 'direct');
  const totalDmUnread = directChats.reduce((sum, c) => sum + (c.unread_count ?? 0), 0);

  useEffect(() => {
    if (!activeConversationId) {
      openedAsDmRef.current = false;
      onDmChatOpenChange?.(false);
      return;
    }

    const active = conversations.find((c) => c.id === activeConversationId);
    const isDm =
      active?.type === 'direct'
      || (!active && openedAsDmRef.current);

    onDmChatOpenChange?.(!!isDm);
  }, [activeConversationId, conversations, onDmChatOpenChange]);

  useEffect(() => () => {
    onDmChatOpenChange?.(false);
  }, [onDmChatOpenChange]);

  const onRefresh = () => {
    setRefreshing(true);
    load({ silent: true }).finally(() => setRefreshing(false));
  };

  if (viewProfileId) {
    return (
      <View style={[styles.container, { paddingBottom: BOTTOM_NAV_INSET, backgroundColor: colors.background }]}>
        <PlayerProfileScreen
          profileId={viewProfileId}
          onBack={() => setViewProfileId(null)}
          onOpenChat={(conversationId) => {
            setViewProfileId(null);
            setActiveSubTab(0);
            setActiveConversationId(conversationId);
          }}
        />
      </View>
    );
  }

  if (activeConversationId) {
    return (
      <View style={[styles.container, { paddingBottom: BOTTOM_NAV_INSET, backgroundColor: colors.background }]}>
        <ChatRoomScreen
          conversationId={activeConversationId}
          onRead={() => {
            setConversations((prev) =>
              prev.map((c) =>
                c.id === activeConversationId ? { ...c, unread_count: 0 } : c,
              ),
            );
            onUnreadChangeRef.current?.();
          }}
          onBack={() => {
            setActiveConversationId(null);
            setConversations((prev) =>
              prev.map((c) =>
                c.id === activeConversationId ? { ...c, unread_count: 0 } : c,
              ),
            );
            onUnreadChangeRef.current?.();
            load({ silent: true });
          }}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.subTabContainer}>
        <TouchableOpacity
          style={[styles.subTab, activeSubTab === 0 && styles.activeSubTab]}
          onPress={() => setActiveSubTab(0)}
          activeOpacity={0.8}
        >
          <MessageSquare
            size={16}
            color={activeSubTab === 0 ? colors.accent : colors.textMuted}
            style={{ marginRight: 6 }}
          />
          <Text style={[styles.subTabText, activeSubTab === 0 && styles.activeSubTabText]}>
            DMs
          </Text>
          {totalDmUnread > 0 ? (
            <View style={styles.subTabBadge}>
              <Text style={styles.subTabBadgeText}>
                {totalDmUnread > 99 ? '99+' : totalDmUnread}
              </Text>
            </View>
          ) : null}
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.subTab, activeSubTab === 1 && styles.activeSubTab]}
          onPress={() => setActiveSubTab(1)}
          activeOpacity={0.8}
        >
          <Megaphone
            size={16}
            color={activeSubTab === 1 ? colors.accent : colors.textMuted}
            style={{ marginRight: 6 }}
          />
          <Text style={[styles.subTabText, activeSubTab === 1 && styles.activeSubTabText]}>
            FORUM
          </Text>
        </TouchableOpacity>
      </View>

      {activeSubTab === 0 ? (
        <View style={styles.tabPane}>
          {loading ? (
            <ActivityIndicator color={colors.text} style={{ marginVertical: 40 }} />
          ) : directChats.length === 0 ? (
            <View style={[styles.emptyBox, { marginHorizontal: 16, marginTop: 24 }]}>
              <MessageSquare size={28} color={colors.textMuted} />
              <Text style={styles.emptyTitle}>Noch keine Nachrichten</Text>
              <Text style={styles.emptySub}>
                Schreib anderen Spielern über deren Profil eine Nachricht.
              </Text>
            </View>
          ) : (
            <ScrollView
              style={styles.dmList}
              contentContainerStyle={styles.dmListContent}
              showsVerticalScrollIndicator={false}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                  tintColor={colors.text}
                  colors={[colors.text]}
                />
              }
            >
              {directChats.map((dm) => {
                const name = formatChatName(dm.other_user);
                const unread = dm.unread_count ?? 0;
                return (
                  <TouchableOpacity
                    key={dm.id}
                    style={styles.dmRow}
                    onPress={() => setActiveConversationId(dm.id)}
                    activeOpacity={0.75}
                  >
                    <View style={styles.dmAvatarCircleWrap}>
                      <Avatar uri={dm.other_user?.avatar} label={name} styles={styles} />
                      <UnreadBadge count={unread} styles={styles} />
                    </View>
                    <View style={styles.dmRowInfo}>
                      <Text style={styles.dmRowName} numberOfLines={1}>{name}</Text>
                      {dm.last_message ? (
                        <Text style={styles.dmRowPreview} numberOfLines={1}>
                          {dm.last_message}
                        </Text>
                      ) : (
                        <Text style={styles.dmRowPreview}>Direktnachricht</Text>
                      )}
                    </View>
                  </TouchableOpacity>
                );
              })}
              <View style={{ height: BOTTOM_NAV_INSET }} />
            </ScrollView>
          )}
        </View>
      ) : (
        <View style={styles.tabPane}>
          {!isFilterReady && !catalogLoading ? (
            <FilterEmptyPrompt style={{ marginTop: 16, marginHorizontal: 16 }} />
          ) : catalogLoading && !selectedLeagueId ? (
            <ActivityIndicator color={colors.text} style={{ marginVertical: 40 }} />
          ) : selectedLeagueId ? (
            <LeagueForum
              key={selectedLeagueId}
              leagueId={selectedLeagueId}
              leagueName={selectedLeague?.name}
              bottomInset={BOTTOM_NAV_INSET}
              onUnreadChange={onUnreadChange}
              onOpenProfile={(profileId) => setViewProfileId(profileId)}
            />
          ) : (
            <View style={[styles.emptyBox, { marginHorizontal: 16, marginTop: 24 }]}>
              <Text style={styles.emptyTitle}>Liga wählen</Text>
              <Text style={styles.emptySub}>
                Wähle im Menü über den Master-Filter eine Liga, um das Forum zu sehen und Beiträge zu posten.
              </Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
}
