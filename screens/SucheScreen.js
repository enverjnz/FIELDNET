import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ActivityIndicator,
  Image,
} from 'react-native';
import { Search, X, Clock, Users, Trophy } from 'lucide-react-native';
import { supabase } from '../lib/supabase';
import { useTheme } from '../context/ThemeContext';
import TeamProfileScreen from './TeamProfileScreen';
import PlayerProfileScreen from './PlayerProfileScreen';

const CATEGORIES = [
  { key: 'all',     label: 'Alle'           },
  { key: 'teams',   label: 'Teams'          },
  { key: 'players', label: 'Spieler'        },
  { key: 'leagues', label: 'Ligen'          },
  { key: 'news',    label: 'News'           },
  { key: 'media',   label: 'Fotos & Videos' },
];

function createStyles(c) {
  const isDark = c.mode === 'dark';
  const iconTeamBg = isDark ? '#243049' : '#E8EDF8';
  const iconPlayerBg = isDark ? '#3A2430' : '#FFF0F2';

  return StyleSheet.create({
    container: { flex: 1, backgroundColor: c.background },

    searchSection: {
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: c.border,
      zIndex: 100,
    },
    searchBarWrapper: {
      flexDirection: 'row',
      backgroundColor: c.card,
      borderColor: c.border,
      borderWidth: 1.5,
      borderRadius: 12,
      paddingHorizontal: 12,
      height: 44,
      alignItems: 'center',
    },
    searchBarFocused: {
      borderColor: isDark ? c.textMuted : c.primary,
      backgroundColor: c.surface,
      shadowColor: isDark ? '#000' : c.primary,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: isDark ? 0.3 : 0.12,
      shadowRadius: 6,
      elevation: 3,
    },
    searchInput: { flex: 1, color: c.text, fontSize: 14, fontWeight: '600' },

    suggestionsBox: {
      position: 'absolute',
      top: 68,
      left: 16,
      right: 16,
      backgroundColor: c.surface,
      borderRadius: 14,
      borderWidth: 1.5,
      borderColor: c.border,
      shadowColor: isDark ? '#000' : c.primary,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: isDark ? 0.35 : 0.14,
      shadowRadius: 12,
      elevation: 8,
      zIndex: 200,
      overflow: 'hidden',
    },
    dropdownCenter: { paddingVertical: 18, alignItems: 'center' },
    dropdownHint:  { color: c.textMuted, fontSize: 12, marginTop: 6 },

    suggestionRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 14,
      paddingVertical: 11,
      gap: 10,
    },
    suggestionBorder:   { borderBottomWidth: 1, borderBottomColor: c.border },
    suggestionIcon:     { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
    suggestionAvatar:   { width: 40, height: 40, borderRadius: 12 },
    suggestionInitials: { color: c.text, fontSize: 13, fontWeight: '800' },
    suggestionInitialsPlayer: { color: c.accent },
    iconTeam:           { backgroundColor: iconTeamBg },
    iconPlayer:         { backgroundColor: iconPlayerBg },
    suggestionName:     { color: c.text, fontSize: 14, fontWeight: '700' },
    suggestionMeta:     { color: c.textMuted, fontSize: 11, fontWeight: '500', marginTop: 1 },
    typeBadge:          { borderRadius: 6, paddingHorizontal: 7, paddingVertical: 3 },
    badgeTeam:          { backgroundColor: iconTeamBg },
    badgePlayer:        { backgroundColor: iconPlayerBg },
    badgeTeamText:      { color: c.text, fontSize: 9, fontWeight: '800', letterSpacing: 0.4 },
    badgePlayerText:    { color: c.accent, fontSize: 9, fontWeight: '800', letterSpacing: 0.4 },

    scrollContainer:    { flex: 1, paddingTop: 16 },
    sectionTitle:       { color: c.textMuted, fontSize: 10, fontWeight: '800', letterSpacing: 1, marginLeft: 16, marginBottom: 12 },
    sectionTitleSmall:  { color: c.textMuted, fontSize: 10, fontWeight: '800', letterSpacing: 1 },
    sectionHeaderRow:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, marginBottom: 8 },
    clearAllText:       { color: c.accent, fontSize: 11, fontWeight: '700' },
    divider:            { height: 1, backgroundColor: c.border, marginHorizontal: 16, marginVertical: 16 },

    categoriesScroll:      { paddingLeft: 16 },
    categoryBadge: {
      backgroundColor: c.chipBg,
      borderColor: c.border,
      borderWidth: 1.5,
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 20,
      marginRight: 8,
    },
    categoryBadgeActive:   { backgroundColor: c.chipSelectedBg, borderColor: c.chipSelectedBg },
    categoryText:          { color: c.chipText, fontSize: 12, fontWeight: '700' },
    categoryTextActive:    { color: c.chipTextSelected },

    comingSoonBox: {
      marginHorizontal: 16,
      marginTop: 12,
      backgroundColor: c.card,
      borderRadius: 12,
      padding: 16,
      borderWidth: 1,
      borderColor: c.border,
      alignItems: 'center',
    },
    comingSoonText: { color: c.text, fontSize: 14, fontWeight: '800', marginBottom: 4 },
    comingSoonSub:  { color: c.textMuted, fontSize: 12 },

    recentSection:        { width: '100%' },
    recentList:           { paddingHorizontal: 16 },
    recentItemRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: c.card,
      borderRadius: 10,
      paddingVertical: 10,
      paddingHorizontal: 12,
      marginTop: 6,
    },
    recentItemClickable:  { flex: 1, flexDirection: 'row', alignItems: 'center' },
    recentText:           { color: c.text, fontSize: 13, fontWeight: '600' },
    deleteItemButton:     { paddingLeft: 10, paddingVertical: 4 },
  });
}

export default function SucheScreen({ onOpenChat }) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [searchQuery, setSearchQuery]       = useState('');
  const [isFocused, setIsFocused]           = useState(false);
  const [activeCategory, setActiveCategory] = useState('all');
  const [suggestions, setSuggestions]       = useState([]);
  const [isSearching, setIsSearching]       = useState(false);
  const [recentSearches, setRecentSearches] = useState([]);
  const [viewTeamId, setViewTeamId]         = useState(null);
  const [viewPlayerId, setViewPlayerId]     = useState(null);
  const inputRef    = useRef(null);
  const debounceRef = useRef(null);

  // Supabase live-suche (debounced 300 ms)
  useEffect(() => {
    const q = searchQuery.trim();

    if (q.length < 2) {
      setSuggestions([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(async () => {
      const results = [];
      try {
        // Teams
        if (activeCategory === 'all' || activeCategory === 'teams') {
          const { data: teams } = await supabase
            .from('teams')
            .select('id, name, short_name, town, avatar_teamlogo, leagues(name, league_logo_url)')
            .or(`name.ilike.%${q}%,short_name.ilike.%${q}%,town.ilike.%${q}%`)
            .limit(activeCategory === 'teams' ? 15 : 5);

          (teams || []).forEach(t => {
            const teamInitials = (t.short_name || t.name || '?').slice(0, 2).toUpperCase();
            results.push({
              id:       `t_${t.id}`,
              type:     'team',
              teamId:   t.id,
              name:     t.name,
              meta:     [t.leagues?.name, t.town, t.short_name].filter(Boolean).join(' · '),
              logoUrl:  t.avatar_teamlogo || t.leagues?.league_logo_url || null,
              initials: teamInitials,
            });
          });
        }

        // Spieler
        if (activeCategory === 'all' || activeCategory === 'players') {
          const { data: players } = await supabase
            .from('profiles')
            .select('id, first_name, last_name, position, jersey_number, avatar')
            .eq('role', 'player')
            .or(`first_name.ilike.%${q}%,last_name.ilike.%${q}%`)
            .limit(activeCategory === 'players' ? 15 : 5);

          (players || []).forEach(p => {
            const name = [p.first_name, p.last_name].filter(Boolean).join(' ');
            if (!name) return;
            results.push({
              id:        `p_${p.id}`,
              type:      'player',
              playerId:  p.id,
              name,
              meta:      [p.position, p.jersey_number ? `#${p.jersey_number}` : null]
                .filter(Boolean)
                .join(' · '),
              avatarUrl: p.avatar || null,
              initials:  name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase(),
            });
          });
        }

        // Ligen
        if (activeCategory === 'all' || activeCategory === 'leagues') {
          const { data: leagues } = await supabase
            .from('leagues')
            .select('id, name')
            .ilike('name', `%${q}%`)
            .limit(activeCategory === 'leagues' ? 15 : 4);

          (leagues || []).forEach(l => {
            results.push({
              id:   `l_${l.id}`,
              type: 'league',
              name: l.name,
              meta: 'Liga',
            });
          });
        }
      } finally {
        setSuggestions(results);
        setIsSearching(false);
      }
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [searchQuery, activeCategory]);

  const showDropdown =
    isFocused &&
    searchQuery.trim().length >= 2 &&
    (isSearching || suggestions.length > 0);

  const isComingSoon = activeCategory === 'news' || activeCategory === 'media';

  const handleSelect = (item) => {
    if (item.type === 'team' && item.teamId) {
      setViewPlayerId(null);
      setViewTeamId(item.teamId);
      setIsFocused(false);
      inputRef.current?.blur();
      if (!recentSearches.includes(item.name)) {
        setRecentSearches(prev => [item.name, ...prev].slice(0, 6));
      }
      return;
    }

    if (item.type === 'player' && item.playerId) {
      setViewTeamId(null);
      setViewPlayerId(item.playerId);
      setIsFocused(false);
      inputRef.current?.blur();
      if (!recentSearches.includes(item.name)) {
        setRecentSearches(prev => [item.name, ...prev].slice(0, 6));
      }
      return;
    }

    setSearchQuery(item.name);
    setIsFocused(false);
    inputRef.current?.blur();
    if (!recentSearches.includes(item.name)) {
      setRecentSearches(prev => [item.name, ...prev].slice(0, 6));
    }
  };

  const handleClear = () => {
    setSearchQuery('');
    setSuggestions([]);
    inputRef.current?.focus();
  };

  const removeRecent = (text) => {
    setRecentSearches(prev => prev.filter(i => i !== text));
  };

  const renderSearchIcon = () => {
    if (isSearching) {
      return <ActivityIndicator size="small" color={colors.text} style={{ marginRight: 4 }} />;
    }
    if (searchQuery.length > 0) {
      return (
        <TouchableOpacity onPress={handleClear} hitSlop={8}>
          <X size={18} color={colors.text} />
        </TouchableOpacity>
      );
    }
    return null;
  };

  const renderSuggestionIcon = (item) => {
    if (item.type === 'team') {
      if (item.logoUrl) {
        return (
          <Image source={{ uri: item.logoUrl }} style={styles.suggestionAvatar} resizeMode="contain" />
        );
      }
      return <Text style={styles.suggestionInitials}>{item.initials}</Text>;
    }
    if (item.type === 'player') {
      if (item.avatarUrl) {
        return (
          <Image source={{ uri: item.avatarUrl }} style={styles.suggestionAvatar} />
        );
      }
      return <Text style={[styles.suggestionInitials, styles.suggestionInitialsPlayer]}>{item.initials}</Text>;
    }
    if (item.type === 'league') return <Trophy size={15} color={colors.text} />;
    return <Users size={15} color={colors.text} />;
  };

  const renderBadgeLabel = (type) => {
    if (type === 'player') return 'SPIELER';
    if (type === 'league') return 'LIGA';
    return 'TEAM';
  };

  if (viewTeamId) {
    return (
      <TeamProfileScreen
        teamId={viewTeamId}
        readOnly
        onBack={() => setViewTeamId(null)}
      />
    );
  }

  if (viewPlayerId) {
    return (
      <PlayerProfileScreen
        profileId={viewPlayerId}
        onBack={() => setViewPlayerId(null)}
        onOpenChat={(conversationId) => {
          setViewPlayerId(null);
          onOpenChat?.(conversationId);
        }}
      />
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* SEARCH BAR */}
      <View style={styles.searchSection}>
        <Pressable
          style={[styles.searchBarWrapper, isFocused && styles.searchBarFocused]}
          onPress={() => inputRef.current?.focus()}
        >
          <Search size={18} color={colors.text} style={{ marginRight: 8 }} />
          <TextInput
            ref={inputRef}
            style={styles.searchInput}
            placeholder="Teams, Spieler oder Ligen suchen..."
            placeholderTextColor={colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setTimeout(() => setIsFocused(false), 150)}
            returnKeyType="search"
            autoCorrect={false}
          />
          {renderSearchIcon()}
        </Pressable>

        {/* AUTOCOMPLETE DROPDOWN */}
        {showDropdown && (
          <View style={styles.suggestionsBox}>
            {isSearching && suggestions.length === 0 ? (
              <View style={styles.dropdownCenter}>
                <ActivityIndicator size="small" color={colors.text} />
                <Text style={styles.dropdownHint}>Suche laeuft...</Text>
              </View>
            ) : suggestions.length === 0 ? (
              <View style={styles.dropdownCenter}>
                <Text style={styles.dropdownHint}>Keine Ergebnisse gefunden</Text>
              </View>
            ) : (
              suggestions.map((item, index) => (
                <TouchableOpacity
                  key={item.id}
                  style={[
                    styles.suggestionRow,
                    index < suggestions.length - 1 && styles.suggestionBorder,
                  ]}
                  onPress={() => handleSelect(item)}
                  activeOpacity={0.7}
                >
                  <View style={[
                    styles.suggestionIcon,
                    item.type === 'player' ? styles.iconPlayer : styles.iconTeam,
                  ]}>
                    {renderSuggestionIcon(item)}
                  </View>

                  <View style={{ flex: 1 }}>
                    <Text style={styles.suggestionName} numberOfLines={1}>
                      {item.name}
                    </Text>
                    {!!item.meta && (
                      <Text style={styles.suggestionMeta}>{item.meta}</Text>
                    )}
                  </View>

                  <View style={[
                    styles.typeBadge,
                    item.type === 'player' ? styles.badgePlayer : styles.badgeTeam,
                  ]}>
                    <Text style={
                      item.type === 'player' ? styles.badgePlayerText : styles.badgeTeamText
                    }>
                      {renderBadgeLabel(item.type)}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))
            )}
          </View>
        )}
      </View>

      <ScrollView
        style={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* KATEGORIEN */}
        <Text style={styles.sectionTitle}>KATEGORIEN</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoriesScroll}
        >
          {CATEGORIES.map(cat => (
            <TouchableOpacity
              key={cat.key}
              style={[
                styles.categoryBadge,
                activeCategory === cat.key && styles.categoryBadgeActive,
              ]}
              onPress={() => setActiveCategory(cat.key)}
            >
              <Text style={[
                styles.categoryText,
                activeCategory === cat.key && styles.categoryTextActive,
              ]}>
                {cat.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {isComingSoon && (
          <View style={styles.comingSoonBox}>
            <Text style={styles.comingSoonText}>In Kuerze verfuegbar</Text>
            <Text style={styles.comingSoonSub}>
              {activeCategory === 'news' ? 'News-Suche' : 'Medien-Suche'} wird bald freigeschaltet.
            </Text>
          </View>
        )}

        <View style={styles.divider} />

        {/* LETZTE SUCHERGEBNISSE */}
        {recentSearches.length > 0 && (
          <View style={styles.recentSection}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitleSmall}>LETZTE SUCHERGEBNISSE</Text>
              <TouchableOpacity onPress={() => setRecentSearches([])}>
                <Text style={styles.clearAllText}>Alle loeschen</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.recentList}>
              {recentSearches.map((item, index) => (
                <View key={index} style={styles.recentItemRow}>
                  <TouchableOpacity
                    style={styles.recentItemClickable}
                    onPress={() => {
                      setSearchQuery(item);
                      inputRef.current?.focus();
                    }}
                  >
                    <Clock size={14} color={colors.text} style={{ marginRight: 10 }} />
                    <Text style={styles.recentText} numberOfLines={1}>{item}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.deleteItemButton}
                    onPress={() => removeRecent(item)}
                  >
                    <X size={14} color={colors.textMuted} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>

            <View style={styles.divider} />
          </View>
        )}

        <View style={{ height: 150 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
