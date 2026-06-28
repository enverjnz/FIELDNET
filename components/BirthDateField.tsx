import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, Modal, Platform, StyleSheet,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Calendar, X } from 'lucide-react-native';
import { formatDisplayDate } from '../lib/profileDates';

const B = '#1A2F6E';
const R = '#C01830';
const BORDER = '#D1D8F0';
const MUTED = '#6B7280';

type Props = {
  label?: string;
  value: Date | null;
  onChange: (date: Date | null) => void;
  error?: string;
  optional?: boolean;
};

const MIN_BIRTH_DATE = new Date(new Date().getFullYear() - 100, 0, 1);

export default function BirthDateField({
  label = 'GEBURTSDATUM',
  value,
  onChange,
  error,
  optional = true,
}: Props) {
  const [showPicker, setShowPicker] = useState(false);

  const labelText = optional ? label : `${label} *`;

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{labelText}</Text>
      <TouchableOpacity
        style={[styles.trigger, !!error && styles.triggerError]}
        onPress={() => setShowPicker(true)}
        activeOpacity={0.7}
      >
        <Calendar size={17} color={value ? B : MUTED} style={styles.icon} />
        <Text style={[styles.triggerText, !value && styles.placeholder]}>
          {value ? formatDisplayDate(value) : 'Datum auswählen'}
        </Text>
        {value ? (
          <TouchableOpacity
            onPress={(e) => {
              e.stopPropagation?.();
              onChange(null);
            }}
            hitSlop={8}
          >
            <X size={16} color={MUTED} />
          </TouchableOpacity>
        ) : null}
      </TouchableOpacity>
      {!!error && <Text style={styles.error}>{error}</Text>}

      {showPicker && (
        Platform.OS === 'ios' ? (
          <Modal transparent animationType="slide" visible={showPicker}>
            <View style={styles.modal}>
              <View style={styles.sheet}>
                <View style={styles.sheetHeader}>
                  <TouchableOpacity onPress={() => setShowPicker(false)}>
                    <Text style={styles.cancel}>Abbrechen</Text>
                  </TouchableOpacity>
                  <Text style={styles.sheetTitle}>Geburtsdatum</Text>
                  <TouchableOpacity onPress={() => setShowPicker(false)}>
                    <Text style={styles.done}>Fertig</Text>
                  </TouchableOpacity>
                </View>
                <DateTimePicker
                  value={value ?? new Date(2000, 0, 1)}
                  mode="date"
                  display="spinner"
                  maximumDate={new Date()}
                  minimumDate={MIN_BIRTH_DATE}
                  onChange={(_, d) => { if (d) onChange(d); }}
                  locale="de-DE"
                  style={{ alignSelf: 'center' }}
                />
              </View>
            </View>
          </Modal>
        ) : (
          <DateTimePicker
            value={value ?? new Date(2000, 0, 1)}
            mode="date"
            display="calendar"
            maximumDate={new Date()}
            minimumDate={MIN_BIRTH_DATE}
            onChange={(_, d) => {
              setShowPicker(false);
              if (d) onChange(d);
            }}
          />
        )
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 16 },
  label: {
    color: B, fontSize: 11, fontWeight: '700',
    letterSpacing: 0.8, marginBottom: 6, textTransform: 'uppercase',
  },
  trigger: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#F0F4FF', borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 13,
    borderWidth: 1.5, borderColor: BORDER,
  },
  triggerError: { borderColor: R },
  icon: { marginRight: 8 },
  triggerText: { flex: 1, color: B, fontSize: 15 },
  placeholder: { color: '#4A5568' },
  error: { color: R, fontSize: 11, marginTop: 4 },
  modal: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingBottom: 36,
  },
  sheetHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 16,
    borderBottomWidth: 1, borderBottomColor: BORDER,
  },
  sheetTitle: { color: B, fontSize: 15, fontWeight: '700' },
  cancel: { color: MUTED, fontSize: 15 },
  done: { color: B, fontSize: 15, fontWeight: '700' },
});
