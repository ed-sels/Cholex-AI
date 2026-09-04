import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

type Language = 'tw' | 'en';

interface TrackerScreenProps {
  language: Language;
  darkMode?: boolean;
}

interface SymptomLog {
  id: string;
  date: string;
  waterIntake: number;
  stoolFrequency: number;
  temperature: string;
  notes: string;
}

export default function TrackerScreen({ language, darkMode = true }: TrackerScreenProps) {
  const isEnglish = language === 'en';
  const theme = darkMode
    ? { safe: '#121214', container: '#121214', card: '#1C1C1F', text: '#e4e4e7', muted: '#a1a1aa', border: '#2a2a2e', alt: '#0f0f11', panel: 'rgba(255,90,54,0.08)' }
    : { safe: '#f5f5f5', container: '#f5f5f5', card: '#ffffff', text: '#18181b', muted: '#52525b', border: '#e4e4e7', alt: '#f3f4f6', panel: '#fff7ed' };

  const [waterIntake, setWaterIntake] = useState(0);
  const [stoolFrequency, setStoolFrequency] = useState(0);
  const [temperature, setTemperature] = useState('37.0');
  const [notes, setNotes] = useState('');
  const [logs, setLogs] = useState<SymptomLog[]>([]);

  const handleSave = () => {
    const newLog: SymptomLog = {
      id: 'log-' + Date.now(),
      date: new Date().toLocaleDateString(undefined, {
        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
      }),
      waterIntake,
      stoolFrequency,
      temperature,
      notes,
    };
    const updated = [newLog, ...logs];
    setLogs(updated);
    setNotes('');
    Alert.alert(
      isEnglish ? '✅ Saved!' : '✅ Asie yie!',
      isEnglish ? 'Your symptom log has been saved.' : 'Yɛasiesie wo yareɛ ho nkyerɛkee asie yie.'
    );
  };

  const handleDelete = (id: string) => {
    setLogs(logs.filter(l => l.id !== id));
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.safe }]} edges={['bottom']}>
      <ScrollView style={[styles.container, { backgroundColor: theme.container }]} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">

        {/* Header banner */}
        <View style={[styles.introBanner, { backgroundColor: theme.panel, borderColor: 'rgba(255,90,54,0.2)' }]}>
          <Ionicons name="calendar" size={18} color="#FF5A36" />
          <View style={{ flex: 1 }}>
            <Text style={[styles.introTitle, { color: theme.text }]}>
              {isEnglish ? 'Personal Hydration & Symptom Tracker' : 'Ahotew ne Yareɛ Tracker'}
            </Text>
            <Text style={[styles.introDesc, { color: theme.muted }]}>
              {isEnglish
                ? 'Track your daily water intake, stool frequency, temperature, and notes.'
                : 'Kyerɛ wo nsuo nom, ayamtuo, oha, ne nkyerɛkee da biara.'}
            </Text>
          </View>
        </View>

        {/* Form */}
        <View style={[styles.formCard, { backgroundColor: theme.card, borderColor: theme.border }]}>

          {/* Water intake */}
          <View style={styles.formRow}>
            <View style={styles.formLabelRow}>
              <Ionicons name="water" size={15} color="#3b82f6" />
              <Text style={styles.formLabel}>
                {isEnglish ? 'Water Intake (cups)' : 'Nsuo a wonom (cups)'}
              </Text>
            </View>
            <View style={styles.counterRow}>
              <TouchableOpacity
                style={styles.counterBtn}
                onPress={() => setWaterIntake(Math.max(0, waterIntake - 1))}
              >
                <Ionicons name="remove" size={18} color="#e4e4e7" />
              </TouchableOpacity>
              <Text style={[styles.counterVal, { color: theme.text }]}>{waterIntake}</Text>
              <TouchableOpacity
                style={[styles.counterBtn, styles.counterBtnAdd]}
                onPress={() => setWaterIntake(waterIntake + 1)}
              >
                <Ionicons name="add" size={18} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.divider} />

          {/* Stool frequency */}
          <View style={styles.formRow}>
            <View style={styles.formLabelRow}>
              <Ionicons name="alert-circle" size={15} color="#f59e0b" />
              <Text style={styles.formLabel}>
                {isEnglish ? 'Stool Frequency (times/day)' : 'Ayamtuo mpɛn (da mu)'}
              </Text>
            </View>
            <View style={styles.counterRow}>
              <TouchableOpacity
                style={styles.counterBtn}
                onPress={() => setStoolFrequency(Math.max(0, stoolFrequency - 1))}
              >
                <Ionicons name="remove" size={18} color="#e4e4e7" />
              </TouchableOpacity>
              <Text style={[styles.counterVal, { color: theme.text }]}>{stoolFrequency}</Text>
              <TouchableOpacity
                style={[styles.counterBtn, styles.counterBtnAdd]}
                onPress={() => setStoolFrequency(stoolFrequency + 1)}
              >
                <Ionicons name="add" size={18} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.divider} />

          {/* Temperature */}
          <View style={styles.formRow}>
            <View style={styles.formLabelRow}>
              <Ionicons name="thermometer" size={15} color="#ef4444" />
              <Text style={styles.formLabel}>
                {isEnglish ? 'Body Temperature (°C)' : 'Oha (°C)'}
              </Text>
            </View>
            <TextInput
              style={[styles.tempInput, { backgroundColor: theme.alt, borderColor: theme.border, color: theme.text }]}
              value={temperature}
              onChangeText={setTemperature}
              keyboardType="decimal-pad"
              placeholderTextColor="#52525b"
            />
          </View>

          <View style={styles.divider} />

          {/* Notes */}
          <View style={styles.notesSection}>
            <View style={styles.formLabelRow}>
              <Ionicons name="document-text" size={15} color="#a78bfa" />
              <Text style={styles.formLabel}>
                {isEnglish ? 'Additional Notes' : 'Nsɛm Foforɔ'}
              </Text>
            </View>
            <TextInput
              style={[styles.notesInput, { backgroundColor: theme.alt, borderColor: theme.border, color: theme.text }]}
              value={notes}
              onChangeText={setNotes}
              placeholder={isEnglish ? 'Describe any other symptoms or observations...' : 'Ka nsɛm foforɔ...'}
              placeholderTextColor="#52525b"
              multiline
              numberOfLines={3}
            />
          </View>

          {/* Save button */}
          <TouchableOpacity style={styles.saveBtn} onPress={handleSave} activeOpacity={0.85}>
            <Ionicons name="save" size={16} color="#fff" />
            <Text style={styles.saveBtnText}>
              {isEnglish ? 'Save Daily Log' : 'Sie Nnɛ Ho Nkyerɛkee'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Saved Logs */}
        {logs.length > 0 && (
          <View style={styles.logsSection}>
            <Text style={[styles.logsTitle, { color: '#FF5A36' }]}>
              {isEnglish ? 'SAVED LOGS' : 'NKYERƐKEE A WƆASIE'}
            </Text>
            {logs.map((log) => (
              <View key={log.id} style={[styles.logCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
                <View style={styles.logHeader}>
                  <Text style={[styles.logDate, { color: theme.muted }]}>{log.date}</Text>
                  <TouchableOpacity onPress={() => handleDelete(log.id)}>
                    <Ionicons name="trash-outline" size={15} color="#ef4444" />
                  </TouchableOpacity>
                </View>
                <View style={styles.logStats}>
                  <View style={styles.logStat}>
                    <Ionicons name="water" size={12} color="#3b82f6" />
                    <Text style={[styles.logStatText, { color: theme.text }]}>{log.waterIntake} cups</Text>
                  </View>
                  <View style={styles.logStat}>
                    <Ionicons name="alert-circle" size={12} color="#f59e0b" />
                    <Text style={[styles.logStatText, { color: theme.text }]}>{log.stoolFrequency}x</Text>
                  </View>
                  <View style={styles.logStat}>
                    <Ionicons name="thermometer" size={12} color="#ef4444" />
                    <Text style={[styles.logStatText, { color: theme.text }]}>{log.temperature}°C</Text>
                  </View>
                </View>
                {log.notes ? <Text style={[styles.logNotes, { color: theme.muted }]}>{log.notes}</Text> : null}
              </View>
            ))}
          </View>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#121214' },
  container: { flex: 1, backgroundColor: '#121214' },
  content: { padding: 16, gap: 16, paddingBottom: 40 },

  introBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: 'rgba(255,90,54,0.08)',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,90,54,0.2)',
  },
  introTitle: { color: '#e4e4e7', fontWeight: '700', fontSize: 13, marginBottom: 4 },
  introDesc: { color: '#a1a1aa', fontSize: 12, lineHeight: 17 },

  formCard: {
    backgroundColor: '#1C1C1F',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#2a2a2e',
    gap: 0,
  },
  formRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  formLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 },
  formLabel: { color: '#a1a1aa', fontSize: 12, fontWeight: '600', flex: 1 },
  divider: { height: 1, backgroundColor: '#2a2a2e' },

  counterRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  counterBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#2a2a2e',
    alignItems: 'center',
    justifyContent: 'center',
  },
  counterBtnAdd: { backgroundColor: '#FF5A36' },
  counterVal: { color: '#fff', fontWeight: '800', fontSize: 18, minWidth: 28, textAlign: 'center' },

  tempInput: {
    color: '#e4e4e7',
    backgroundColor: '#0f0f11',
    borderWidth: 1,
    borderColor: '#3f3f46',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 14,
    fontWeight: '700',
    width: 80,
    textAlign: 'center',
  },

  notesSection: { paddingTop: 12, gap: 8 },
  notesInput: {
    color: '#e4e4e7',
    backgroundColor: '#0f0f11',
    borderWidth: 1,
    borderColor: '#3f3f46',
    borderRadius: 10,
    padding: 10,
    fontSize: 13,
    textAlignVertical: 'top',
    minHeight: 72,
    marginTop: 6,
  },

  saveBtn: {
    backgroundColor: '#FF5A36',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 13,
    borderRadius: 12,
    marginTop: 14,
    shadowColor: '#FF5A36',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
  saveBtnText: { color: '#fff', fontWeight: '800', fontSize: 14 },

  logsSection: { gap: 10 },
  logsTitle: {
    color: '#FF5A36',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.5,
    paddingLeft: 4,
  },
  logCard: {
    backgroundColor: '#1C1C1F',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#2a2a2e',
    gap: 8,
  },
  logHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  logDate: { color: '#71717a', fontSize: 11, fontWeight: '600' },
  logStats: { flexDirection: 'row', gap: 12 },
  logStat: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  logStatText: { color: '#a1a1aa', fontSize: 11, fontWeight: '600' },
  logNotes: { color: '#71717a', fontSize: 11, fontStyle: 'italic' },
});
