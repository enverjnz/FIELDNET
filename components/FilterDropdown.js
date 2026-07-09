import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
  Image,
  ActivityIndicator,
} from 'react-native';
import { ChevronDown, X, Check } from 'lucide-react-native';

const B = '#1A2F6E';
const R = '#C01830';
const BG = '#F0F4FF';
const BORDER = '#D1D8F0';
const MUTED = '#6B7280';

export default function FilterDropdown({
  label,
  placeholder,
  options,
  value,
  onChange,
  loading = false,
  disabled = false,
  emptyText = 'Keine Einträge verfügbar.',
  compact = false,
}) {
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => o.value === value);

  return (
    <View style={[styles.dropdownWrap, compact && styles.dropdownWrapCompact]}>
      {!compact ? <Text style={styles.dropdownLabel}>{label}</Text> : null}
      <TouchableOpacity
        style={[styles.dropdownTrigger, compact && styles.dropdownTriggerCompact, disabled && styles.dropdownDisabled]}
        onPress={() => !disabled && !loading && setOpen(true)}
        activeOpacity={0.8}
        disabled={disabled || loading}
      >
        {loading ? (
          <ActivityIndicator size="small" color={B} style={{ flex: 1 }} />
        ) : (
          <View style={styles.dropdownTriggerInner}>
            {selected?.imageUrl ? (
              <Image source={{ uri: selected.imageUrl }} style={styles.dropdownLogo} resizeMode="contain" />
            ) : null}
            <Text
              style={[styles.dropdownText, compact && styles.dropdownTextCompact, !selected && styles.dropdownPlaceholder]}
              numberOfLines={1}
            >
              {compact ? (selected?.label ?? placeholder) : (selected?.label ?? placeholder)}
            </Text>
          </View>
        )}
        <ChevronDown size={compact ? 16 : 18} color={disabled ? '#C4CAD4' : MUTED} />
      </TouchableOpacity>

      <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={() => setOpen(false)} />
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{label}</Text>
              <TouchableOpacity onPress={() => setOpen(false)} hitSlop={8}>
                <X size={22} color={B} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalList} keyboardShouldPersistTaps="handled">
              {options.length === 0 ? (
                <Text style={styles.modalEmpty}>{emptyText}</Text>
              ) : (
                options.map((option) => {
                  const active = option.value === value;
                  return (
                    <TouchableOpacity
                      key={String(option.value)}
                      style={[styles.modalItem, active && styles.modalItemActive]}
                      onPress={() => { onChange(option.value); setOpen(false); }}
                      activeOpacity={0.75}
                    >
                      <View style={styles.modalItemLeft}>
                        {option.imageUrl ? (
                          <Image source={{ uri: option.imageUrl }} style={styles.modalItemLogo} resizeMode="contain" />
                        ) : (
                          <View style={styles.modalItemLogoFallback}>
                            <Text style={styles.modalItemLogoLetter}>{option.label.charAt(0)}</Text>
                          </View>
                        )}
                        <Text style={[styles.modalItemText, active && styles.modalItemTextActive]} numberOfLines={2}>
                          {option.label}
                        </Text>
                      </View>
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

const styles = StyleSheet.create({
  dropdownWrap: { marginBottom: 2 },
  dropdownWrapCompact: { flex: 1, marginBottom: 0 },
  dropdownLabel: {
    color: MUTED,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  dropdownTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: BG,
    borderWidth: 1.5,
    borderColor: BORDER,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    minHeight: 48,
  },
  dropdownTriggerCompact: {
    minHeight: 40,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 10,
  },
  dropdownDisabled: { opacity: 0.55 },
  dropdownTriggerInner: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  dropdownLogo: { width: 24, height: 24, borderRadius: 6 },
  dropdownText: { flex: 1, color: B, fontSize: 14, fontWeight: '700' },
  dropdownTextCompact: { fontSize: 12, fontWeight: '700' },
  dropdownPlaceholder: { color: '#9CA3AF', fontWeight: '600' },

  modalOverlay: { flex: 1, justifyContent: 'flex-end' },
  modalBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.4)' },
  modalSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
    paddingBottom: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  modalTitle: { color: B, fontSize: 16, fontWeight: '800' },
  modalList: { paddingHorizontal: 12 },
  modalEmpty: { color: MUTED, fontSize: 14, textAlign: 'center', paddingVertical: 24 },
  modalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginTop: 4,
  },
  modalItemActive: { backgroundColor: BG },
  modalItemLeft: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 },
  modalItemLogo: { width: 32, height: 32, borderRadius: 8 },
  modalItemLogoFallback: {
    width: 32, height: 32, borderRadius: 8,
    backgroundColor: BG, alignItems: 'center', justifyContent: 'center',
  },
  modalItemLogoLetter: { color: B, fontSize: 14, fontWeight: '800' },
  modalItemText: { flex: 1, color: B, fontSize: 15, fontWeight: '600' },
  modalItemTextActive: { color: R, fontWeight: '800' },
});
