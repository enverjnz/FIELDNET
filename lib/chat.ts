import { supabase } from './supabase';

export type ConversationType = 'direct' | 'league';

export type ChatProfile = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  avatar: string | null;
};

export type ChatMessage = {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  sender?: ChatProfile | null;
};

export type ConversationListItem = {
  id: string;
  type: ConversationType;
  title: string | null;
  league_id: string | null;
  created_at: string;
  last_message: string | null;
  last_message_at: string | null;
  other_user: ChatProfile | null;
  member_count: number;
};

async function requireUserId(): Promise<string> {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) throw new Error('Bitte melde dich an.');
  return user.id;
}

async function fetchProfilesMap(userIds: string[]): Promise<Map<string, ChatProfile>> {
  const unique = [...new Set(userIds.filter(Boolean))];
  if (unique.length === 0) return new Map();

  const { data, error } = await supabase
    .from('profiles')
    .select('id, first_name, last_name, avatar')
    .in('id', unique);

  if (error) throw error;

  const map = new Map<string, ChatProfile>();
  for (const row of data ?? []) {
    map.set(row.id, row as ChatProfile);
  }
  return map;
}

export function formatChatName(profile: ChatProfile | null | undefined): string {
  if (!profile) return 'Unbekannt';
  const name = [profile.first_name, profile.last_name].filter(Boolean).join(' ').trim();
  return name || 'FIELDNET User';
}

export async function getOrCreateDirectConversation(otherUserId: string): Promise<string> {
  const userId = await requireUserId();
  if (userId === otherUserId) {
    throw new Error('Du kannst dir nicht selbst schreiben.');
  }

  const { data: myMemberships } = await supabase
    .from('conversation_members')
    .select('conversation_id')
    .eq('user_id', userId);

  const myConvIds = (myMemberships ?? []).map((r) => r.conversation_id);

  if (myConvIds.length > 0) {
    const { data: directConvs } = await supabase
      .from('conversations')
      .select('id')
      .eq('type', 'direct')
      .in('id', myConvIds);

    for (const conv of directConvs ?? []) {
      const { data: members } = await supabase
        .from('conversation_members')
        .select('user_id')
        .eq('conversation_id', conv.id);

      const memberIds = (members ?? []).map((m) => m.user_id).sort();
      const expected = [userId, otherUserId].sort();
      if (
        memberIds.length === 2
        && memberIds[0] === expected[0]
        && memberIds[1] === expected[1]
      ) {
        return conv.id;
      }
    }
  }

  const { data: conv, error: convErr } = await supabase
    .from('conversations')
    .insert({ type: 'direct' })
    .select('id')
    .single();

  if (convErr || !conv?.id) throw convErr ?? new Error('Chat konnte nicht erstellt werden.');

  const { error: selfMemberErr } = await supabase.from('conversation_members').insert({
    conversation_id: conv.id,
    user_id: userId,
  });

  if (selfMemberErr) throw selfMemberErr;

  const { error: partnerMemberErr } = await supabase.from('conversation_members').insert({
    conversation_id: conv.id,
    user_id: otherUserId,
  });

  if (partnerMemberErr) throw partnerMemberErr;
  return conv.id;
}

export async function ensureLeagueConversation(leagueId: string): Promise<string> {
  const { data: existing } = await supabase
    .from('conversations')
    .select('id')
    .eq('type', 'league')
    .eq('league_id', leagueId)
    .maybeSingle();

  if (existing?.id) return existing.id;

  const { data: league } = await supabase
    .from('leagues')
    .select('name')
    .eq('id', leagueId)
    .maybeSingle();

  const { data: conv, error } = await supabase
    .from('conversations')
    .insert({
      type: 'league',
      league_id: leagueId,
      title: league?.name ? `${league.name} Chat` : 'Liga-Chat',
    })
    .select('id')
    .single();

  if (error?.code === '23505') {
    const { data: retry } = await supabase
      .from('conversations')
      .select('id')
      .eq('type', 'league')
      .eq('league_id', leagueId)
      .maybeSingle();
    if (retry?.id) return retry.id;
  }

  if (error || !conv?.id) throw error ?? new Error('Liga-Chat konnte nicht erstellt werden.');
  return conv.id;
}

export async function joinLeagueConversation(leagueId: string): Promise<string> {
  const userId = await requireUserId();
  const conversationId = await ensureLeagueConversation(leagueId);

  const { error } = await supabase
    .from('conversation_members')
    .upsert(
      { conversation_id: conversationId, user_id: userId },
      { onConflict: 'conversation_id,user_id' },
    );

  if (error) throw error;
  return conversationId;
}

async function enrichConversations(
  conversations: Array<{
    id: string;
    type: ConversationType;
    title: string | null;
    league_id: string | null;
    created_at: string;
  }>,
  userId: string,
): Promise<ConversationListItem[]> {
  if (conversations.length === 0) return [];

  const convIds = conversations.map((c) => c.id);

  const [{ data: allMembers }, { data: recentMessages }] = await Promise.all([
    supabase
      .from('conversation_members')
      .select('conversation_id, user_id')
      .in('conversation_id', convIds),
    supabase
      .from('messages')
      .select('conversation_id, content, created_at')
      .in('conversation_id', convIds)
      .order('created_at', { ascending: false }),
  ]);

  const memberCountMap = new Map<string, number>();
  const otherUserMap = new Map<string, string>();
  for (const conv of conversations) {
    const members = (allMembers ?? []).filter((m) => m.conversation_id === conv.id);
    memberCountMap.set(conv.id, members.length);
    if (conv.type === 'direct') {
      const other = members.find((m) => m.user_id !== userId);
      if (other) otherUserMap.set(conv.id, other.user_id);
    }
  }

  const lastMsgMap = new Map<string, { content: string; created_at: string }>();
  for (const msg of recentMessages ?? []) {
    if (!lastMsgMap.has(msg.conversation_id)) {
      lastMsgMap.set(msg.conversation_id, { content: msg.content, created_at: msg.created_at });
    }
  }

  const profileMap = await fetchProfilesMap([...otherUserMap.values()]);

  return conversations.map((conv) => {
    const otherId = otherUserMap.get(conv.id);
    const last = lastMsgMap.get(conv.id);
    return {
      id: conv.id,
      type: conv.type as ConversationType,
      title: conv.title,
      league_id: conv.league_id,
      created_at: conv.created_at,
      last_message: last?.content ?? null,
      last_message_at: last?.created_at ?? null,
      other_user: otherId ? profileMap.get(otherId) ?? null : null,
      member_count: memberCountMap.get(conv.id) ?? 0,
    };
  });
}

export async function fetchMyConversations(): Promise<ConversationListItem[]> {
  const userId = await requireUserId();

  const { data: memberships, error: memErr } = await supabase
    .from('conversation_members')
    .select('conversation_id')
    .eq('user_id', userId);

  if (memErr) throw memErr;

  const convIds = (memberships ?? []).map((m) => m.conversation_id);
  if (convIds.length === 0) return [];

  const { data: conversations, error } = await supabase
    .from('conversations')
    .select('id, type, title, league_id, created_at')
    .in('id', convIds)
    .order('created_at', { ascending: false });

  if (error) throw error;

  const enriched = await enrichConversations(conversations ?? [], userId);

  return enriched.sort((a, b) => {
    const aTime = a.last_message_at ?? a.created_at;
    const bTime = b.last_message_at ?? b.created_at;
    return bTime.localeCompare(aTime);
  });
}

export type LeagueChatOption = {
  league_id: string;
  league_name: string;
  conversation_id: string | null;
  member_count: number;
  is_joined: boolean;
};

export async function fetchLeagueChatOptions(): Promise<LeagueChatOption[]> {
  const userId = await requireUserId();

  const { data: leagues, error: leagueErr } = await supabase
    .from('leagues')
    .select('id, name')
    .in('division', ['Herren', 'Damen', 'Flag'])
    .order('name', { ascending: true });

  if (leagueErr) throw leagueErr;

  const { data: leagueConvs } = await supabase
    .from('conversations')
    .select('id, league_id')
    .eq('type', 'league');

  const convByLeague = new Map(
    (leagueConvs ?? []).map((c) => [c.league_id, c.id]),
  );

  const { data: myMemberships } = await supabase
    .from('conversation_members')
    .select('conversation_id')
    .eq('user_id', userId);

  const joinedSet = new Set((myMemberships ?? []).map((m) => m.conversation_id));

  const options: LeagueChatOption[] = [];

  for (const league of leagues ?? []) {
    let conversationId = convByLeague.get(league.id) ?? null;
    let memberCount = 0;

    if (!conversationId) {
      try {
        conversationId = await ensureLeagueConversation(league.id);
        convByLeague.set(league.id, conversationId);
      } catch {
        conversationId = null;
      }
    }

    if (conversationId) {
      const { count } = await supabase
        .from('conversation_members')
        .select('user_id', { count: 'exact', head: true })
        .eq('conversation_id', conversationId);
      memberCount = count ?? 0;
    }

    options.push({
      league_id: league.id,
      league_name: league.name,
      conversation_id: conversationId,
      member_count: memberCount,
      is_joined: conversationId ? joinedSet.has(conversationId) : false,
    });
  }

  return options;
}

export async function fetchMessages(conversationId: string): Promise<ChatMessage[]> {
  await requireUserId();

  const { data, error } = await supabase
    .from('messages')
    .select('id, conversation_id, sender_id, content, created_at')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })
    .limit(200);

  if (error) throw error;

  const profileMap = await fetchProfilesMap((data ?? []).map((m) => m.sender_id));

  return (data ?? []).map((msg) => ({
    ...msg,
    sender: profileMap.get(msg.sender_id) ?? null,
  })) as ChatMessage[];
}

export async function sendMessage(conversationId: string, content: string): Promise<ChatMessage> {
  const userId = await requireUserId();
  const trimmed = content.trim();
  if (!trimmed) throw new Error('Nachricht darf nicht leer sein.');

  const { data, error } = await supabase
    .from('messages')
    .insert({
      conversation_id: conversationId,
      sender_id: userId,
      content: trimmed,
    })
    .select('id, conversation_id, sender_id, content, created_at')
    .single();

  if (error) throw error;

  const profileMap = await fetchProfilesMap([userId]);
  return {
    ...data,
    sender: profileMap.get(userId) ?? null,
  } as ChatMessage;
}

export async function markConversationRead(conversationId: string): Promise<void> {
  const userId = await requireUserId();
  await supabase
    .from('conversation_members')
    .update({ last_read_at: new Date().toISOString() })
    .eq('conversation_id', conversationId)
    .eq('user_id', userId);
}

export async function getConversationTitle(
  conversationId: string,
  userId: string,
): Promise<string> {
  const { data: conv } = await supabase
    .from('conversations')
    .select('type, title, league_id')
    .eq('id', conversationId)
    .maybeSingle();

  if (!conv) return 'Chat';

  if (conv.type === 'league') {
    return conv.title ?? 'Liga-Chat';
  }

  const { data: members } = await supabase
    .from('conversation_members')
    .select('user_id')
    .eq('conversation_id', conversationId);

  const otherId = (members ?? []).find((m) => m.user_id !== userId)?.user_id;
  if (!otherId) return 'Direktnachricht';

  const profileMap = await fetchProfilesMap([otherId]);
  return formatChatName(profileMap.get(otherId));
}

export function subscribeToMessages(
  conversationId: string,
  onInsert: (message: ChatMessage) => void,
) {
  const channel = supabase
    .channel(`messages:${conversationId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${conversationId}`,
      },
      async (payload) => {
        const row = payload.new as ChatMessage;
        const profileMap = await fetchProfilesMap([row.sender_id]);
        onInsert({
          ...row,
          sender: profileMap.get(row.sender_id) ?? null,
        });
      },
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
