import React, { useState, useEffect, useRef } from 'react';
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
import { Search, X, Clock, TrendingUp, Users, User, Trophy } from 'lucide-react-native';
import { supabase } from '../lib/supabase';
import TeamProfileScreen from './TeamProfileScreen';

const CATEGORIES = [
  { key: 'all',     label: 'Alle'           },
  { key: 'teams',   label: 'Teams'          },
  { key: 'players', label: 'Spieler'        },
  { key: 'leagues', label: 'Ligen'          },
  { key: 'news',    label: 'News'           },
  { key: 'media',   label: 'Fotos & Videos' },
];

const TRENDING = [
  { tag: 'Saisonauftakt 2026',         count: '4.2k Klicks' },
  { tag: 'ELF Gewinner',               count: '2.8k Klicks' },
  { tag: 'Stuttgart Scorpions Roster', count: '1.9k Klicks' },
];

export default function SucheScreen() {
  const [searchQuery, setSearchQuery]       = useState('');
  const [isFocused, setIsFocused]           = useState(false);
  const [activeCategory, setActiveCategory] = useState('all');
  const [suggestions, setSuggestions]       = useState([]);
  const [isSearching, setIsSearching]       = useState(false);
  const [recentSearches, setRecentSearches] = useState([]);
  const [viewTeamId, setViewTeamId]         = useState(null);
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
            results.push({
              id:       `t_${t.id}`,
              type:     'team',
              teamId:   t.id,
              name:     t.name,
              meta:     [t.leagues?.name, t.town, t.short_name].filter(Boolean).join(' · '),
              logoUrl:  t.avatar_teamlogo || t.leagues?.league_logo_url || null,
            });
          });
        }

        // Spieler
        if (activeCategory === 'all' || activeCategory === 'players') {
          const { data: players } = await supabase
            .from('profiles')
            .select('id, first_name, last_name, position, jersey_number')
            .eq('role', 'player')
            .or(`first_name.ilike.%${q}%,last_name.ilike.%${q}%`)
            .limit(activeCategory === 'players' ? 15 : 5);

          (players || []).forEach(p => {
            const name = [p.first_name, p.last_name].filter(Boolean).join(' ');
            if (!name) return;
            results.push({
              id:   `p_${p.id}`,
              type: 'player',
              name,
              meta: [p.position, p.jersey_number ? `#${p.jersey_number}` : null]
                .filter(Boolean)
                .join(' - '),
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
      setViewTeamId(item.teamId);
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
      return <ActivityIndicator size="small" color="#1A2F6E" style={{ marginRight: 4 }} />;
    }
    if (searchQuery.length > 0) {
      return (
        <TouchableOpacity onPress={handleClear} hitSlop={8}>
          <X size={18} color="#1A2F6E" />
        </TouchableOpacity>
      );
    }
    return null;
  };

  const renderSuggestionIcon = (item) => {
    if (item.type === 'team' && item.logoUrl) {
      return (
        <Image source={{ uri: item.logoUrl }} style={styles.suggestionLogo} resizeMode="contain" />
      );
    }
    if (item.type === 'player') return <User size={15} color="#C01830" />;
    if (item.type === 'league') return <Trophy size={15} color="#1A2F6E" />;
    return <Users size={15} color="#1A2F6E" />;
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
          <Search size={18} color="#1A2F6E" style={{ marginRight: 8 }} />
          <TextInput
            ref={inputRef}
            style={styles.searchInput}
            placeholder="Teams, Spieler oder Ligen suchen..."
            placeholderTextColor="#9CA3AF"
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
                <ActivityIndicator size="small" color="#1A2F6E" />
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
                    <Text style={[
                      styles.typeBadgeText,
                      item.type === 'player' ? styles.badgePlayerText : styles.badgeTeamText,
                    ]}>
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
                    <Clock size={14} color="#1A2F6E" style={{ marginRight: 10 }} />
                    <Text style={styles.recentText} numberOfLines={1}>{item}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.deleteItemButton}
                    onPress={() => removeRecent(item)}
                  >
                    <X size={14} color="#1A2F6E" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>

            <View style={styles.divider} />
          </View>
        )}

        {/* GERADE ANGESAGT */}
        <Text style={styles.sectionTitle}>GERADE ANGESAGT</Text>
        <View style={styles.trendingContainer}>
          {TRENDING.map((topic, index) => (
            <TouchableOpacity key={index} style={styles.trendingRow} activeOpacity={0.7}>
              <View style={styles.trendingIconCircle}>
                <TrendingUp size={16} color="#C01830" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.trendingTagText}>{topic.tag}</Text>
                <Text style={styles.trendingCountText}>{topic.count}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <View style={{ height: 150 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const B      = '#1A2F6E';
const R      = '#C01830';
const BG     = '#F0F4FF';
const BORDER = '#D1D8F0';
const MUTED  = '#6B7280';

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },

  searchSection: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
    zIndex: 100,
  },
  searchBarWrapper: {
    flexDirection: 'row',
    backgroundColor: BG,
    borderColor: BORDER,
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    alignItems: 'center',
  },
  searchBarFocused: {
    borderColor: B,
    backgroundColor: '#FFFFFF',
    shadowColor: B,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 3,
  },
  searchInput: { flex: 1, color: B, fontSize: 14, fontWeight: '600' },

  suggestionsBox: {
    position: 'absolute',
    top: 68,
    left: 16,
    right: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: BORDER,
    shadowColor: B,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.14,
    shadowRadius: 12,
    elevation: 8,
    zIndex: 200,
    overflow: 'hidden',
  },
  dropdownCenter: { paddingVertical: 18, alignItems: 'center' },
  dropdownHint:  { color: MUTED, fontSize: 12, marginTop: 6 },

  suggestionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 11,
    gap: 10,
  },
  suggestionBorder:   { borderBottomWidth: 1, borderBottomColor: BG },
  suggestionIcon:     { width: 34, height: 34, borderRadius: 10, justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
  suggestionLogo:     { width: 34, height: 34, borderRadius: 10 },
  iconTeam:           { backgroundColor: '#E8EDF8' },
  iconPlayer:         { backgroundColor: '#FFF0F2' },
  suggestionName:     { color: B, fontSize: 14, fontWeight: '700' },
  suggestionMeta:     { color: MUTED, fontSize: 11, fontWeight: '500', marginTop: 1 },
  typeBadge:          { borderRadius: 6, paddingHorizontal: 7, paddingVertical: 3 },
  badgeTeam:          { backgroundColor: '#E8EDF8' },
  badgePlayer:        { backgroundColor: '#FFF0F2' },
  badgeTeamText:      { color: B, fontSize: 9, fontWeight: '800', letterSpacing: 0.4 },
  badgePlayerText:    { color: R, fontSize: 9, fontWeight: '800', letterSpacing: 0.4 },

  scrollContainer:    { flex: 1, paddingTop: 16 },
  sectionTitle:       { color: MUTED, fontSize: 10, fontWeight: '800', letterSpacing: 1, marginLeft: 16, marginBottom: 12 },
  sectionTitleSmall:  { color: MUTED, fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  sectionHeaderRow:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, marginBottom: 8 },
  clearAllText:       { color: R, fontSize: 11, fontWeight: '700' },
  divider:            { height: 1, backgroundColor: BORDER, marginHorizontal: 16, marginVertical: 16 },

  categoriesScroll:      { paddingLeft: 16 },
  categoryBadge: {
    backgroundColor: BG,
    borderColor: BORDER,
    borderWidth: 1.5,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  categoryBadgeActive:   { backgroundColor: B, borderColor: B },
  categoryText:          { color: B, fontSize: 12, fontWeight: '700' },
  categoryTextActive:    { color: '#FFFFFF' },

  comingSoonBox: {
    marginHorizontal: 16,
    marginTop: 12,
    backgroundColor: BG,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: BORDER,
    alignItems: 'center',
  },
  comingSoonText: { color: B, fontSize: 14, fontWeight: '800', marginBottom: 4 },
  comingSoonSub:  { color: MUTED, fontSize: 12 },

  recentSection:        { width: '100%' },
  recentList:           { paddingHorizontal: 16 },
  recentItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: BG,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginTop: 6,
  },
  recentItemClickable:  { flex: 1, flexDirection: 'row', alignItems: 'center' },
  recentText:           { color: B, fontSize: 13, fontWeight: '600' },
  deleteItemButton:     { paddingLeft: 10, paddingVertical: 4 },

  trendingContainer:    { paddingHorizontal: 16 },
  trendingRow: {
    flexDirection: 'row',
    backgroundColor: BG,
    borderColor: BORDER,
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    alignItems: 'center',
    marginBottom: 8,
  },
  trendingIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E8EDF8',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  trendingTagText:   { color: B, fontSize: 13, fontWeight: '800' },
  trendingCountText: { color: MUTED, fontSize: 11, fontWeight: '500', marginTop: 2 },
});
