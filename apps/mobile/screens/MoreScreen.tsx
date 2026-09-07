import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Linking,
  Alert,
  ScrollView,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import type { AudioPlayer } from 'expo-audio';
import {
  getKhayaAudioSettings,
  setKhayaAudioSettings,
  subscribeToAudioSettings,
  loadKhayaAudioSettings,
  type KhayaAudioSettings,
  type KhayaSpeaker,
} from '../constants/audioSettings';
import { previewKhayaVoice, stopAndUnloadSpeech } from '../constants/tts';

type Language = 'tw' | 'en';

interface MoreScreenProps {
  language: Language;
  darkMode: boolean;
  onDarkModeChange: (value: boolean) => void;
  textScale: number;
  onTextScaleChange: (value: number) => void;
  onLanguageChange: (lang: Language) => void;
  onResetChat: () => void;
}

export default function MoreScreen({
  language,
  darkMode,
  onDarkModeChange,
  textScale,
  onTextScaleChange,
  onLanguageChange,
  onResetChat,
}: MoreScreenProps) {
  const isEnglish = language === 'en';
  const themeColors = darkMode
    ? {
        safe: '#121214',
        container: '#121214',
        card: '#1C1C1F',
        cardAlt: '#151518',
        text: '#e4e4e7',
        muted: '#a1a1aa',
        border: '#2a2a2e',
        subCard: '#101013',
      }
    : {
        safe: '#f5f5f5',
        container: '#f5f5f5',
        card: '#ffffff',
        cardAlt: '#f9fafb',
        text: '#18181b',
        muted: '#52525b',
        border: '#e4e4e7',
        subCard: '#f3f4f6',
      };

  const faqs = isEnglish ? [
    {
      q: 'What is cholera?',
      a: 'Cholera is an acute diarrheal illness caused by infection with the Vibrio cholerae bacterium. It spreads through contaminated water and food.',
    },
    {
      q: 'How do I prepare ORS at home?',
      a: 'Mix 1 litre of clean water with 6 level teaspoons of sugar and half a level teaspoon of salt. Stir until dissolved and drink throughout the day.',
    },
    {
      q: 'When should I go to the hospital?',
      a: 'Go immediately if you experience severe vomiting, sunken eyes, extreme weakness, or cannot keep any fluids down.',
    },
    {
      q: 'How does cholera spread?',
      a: 'Cholera spreads through drinking contaminated water, eating raw or undercooked seafood, and poor hand hygiene.',
    },
    {
      q: 'Is cholera treatable?',
      a: 'Yes! With prompt ORS treatment and medical care, most patients recover fully. Early treatment is essential.',
    },
  ] : [
    {
      q: 'Cholera yɛ dɛn?',
      a: 'Cholera yɛ ayamtuo yareɛ a ɛba ntɛm a wɔde Vibrio cholerae bacteria na ɛba. Ɛtwa nsuo a ɛhaw ne aduane a ɛhaw mu.',
    },
    {
      q: 'Sɛn na meyɛ ORS wo fie?',
      a: 'Fa nsuo litre baako na bɔ nkyɛnkyɛn teaspoon 6 ho na bɔ nkyɛnkyɛ sen faako. Twa ntɛm na nom da nyinaa.',
    },
    {
      q: 'Bere bɛn na mɛkɔ ayaresabea?',
      a: 'Kɔ ntɛm sɛ wowɔ afefeɔ a ɛyɛ hu, aniwa a ɛtim, mmerɛw kɛseɛ, anaa nsuo biara ntumi ntena wo mu.',
    },
    {
      q: 'Sɛn na cholera twa?',
      a: 'Cholera twa de nsuo a ɛhaw nom, nam a wɔante yie di, ne nsa mu ahotew a ɛnhia.',
    },
    {
      q: 'Wotumi sa cholera?',
      a: 'Aane! ORS aduru ne ayaresabea mmoa mu, yarefoɔ pii nyaa yie. Ntɛm ano aduru ho hia kɛseɛ.',
    },
  ];

  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const [audioSettings, setAudioSettingsState] = useState<KhayaAudioSettings>(getKhayaAudioSettings());
  const [isTestingAudio, setIsTestingAudio] = useState(false);
  const testAudioRef = useRef<AudioPlayer | null>(null);

  useEffect(() => {
    void loadKhayaAudioSettings().then((loaded) => setAudioSettingsState(loaded));
    const unsubscribe = subscribeToAudioSettings((updated) => setAudioSettingsState(updated));
    return () => {
      unsubscribe();
      stopAndUnloadSpeech(testAudioRef.current);
      testAudioRef.current = null;
    };
  }, []);

  const handleTestVoice = async () => {
    if (isTestingAudio) {
      stopAndUnloadSpeech(testAudioRef.current);
      testAudioRef.current = null;
      setIsTestingAudio(false);
      return;
    }

    setIsTestingAudio(true);
    try {
      const player = await previewKhayaVoice(language, () => {
        setIsTestingAudio(false);
        testAudioRef.current = null;
      });
      testAudioRef.current = player;
      if (!player) {
        setIsTestingAudio(false);
      }
    } catch (err) {
      console.warn('Audio preview failed:', err);
      setIsTestingAudio(false);
    }
  };

  const updateSpeaker = (speaker: KhayaSpeaker) => {
    void setKhayaAudioSettings({ speaker });
  };

  const updateRate = (rate: number) => {
    void setKhayaAudioSettings({ speakingRate: rate });
  };

  const applyScale = (size: number) => size * textScale;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: themeColors.safe }]} edges={['bottom']}>
      <ScrollView style={[styles.container, { backgroundColor: themeColors.container }]} contentContainerStyle={styles.content}>

        {/* Appearance Controls */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>{isEnglish ? 'APPEARANCE' : 'NWOMA'}</Text>
          <View style={[styles.card, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
            <View style={styles.settingRow}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.settingTitle, { color: themeColors.text, fontSize: applyScale(14) }]}>
                  {isEnglish ? 'Dark mode' : 'Mode dɛɛm'}
                </Text>
                <Text style={[styles.settingSubtitle, { color: themeColors.muted, fontSize: applyScale(11) }]}>
                  {isEnglish ? 'Use a darker interface for low-light viewing.' : 'Fa mode dɛɛm ma nhwɛ a ɛyɛ mmerɛ.'}
                </Text>
              </View>
              <Switch
                value={darkMode}
                onValueChange={onDarkModeChange}
                thumbColor={darkMode ? '#fff' : '#f5f5f5'}
                trackColor={{ false: '#d4d4d8', true: '#FF5A36' }}
              />
            </View>

            <View style={styles.divider} />

            <View style={styles.settingRow}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.settingTitle, { color: themeColors.text, fontSize: applyScale(14) }]}>
                  {isEnglish ? 'Text size' : 'Nnipa nkyerɛ'}
                </Text>
                <Text style={[styles.settingSubtitle, { color: themeColors.muted, fontSize: applyScale(11) }]}>
                  {isEnglish ? `Current: ${textScale.toFixed(1)}x` : `Seesei: ${textScale.toFixed(1)}x`}
                </Text>
              </View>
              <View style={styles.textSizeControls}>
                <TouchableOpacity
                  style={[styles.sizeBtn, { borderColor: themeColors.border, backgroundColor: themeColors.cardAlt }]}
                  onPress={() => onTextScaleChange(Math.max(0.8, Number((textScale - 0.1).toFixed(1))))}
                  activeOpacity={0.8}
                >
                  <Text style={{ color: themeColors.text, fontWeight: '700' }}>A</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.sizeBtn, { borderColor: themeColors.border, backgroundColor: themeColors.cardAlt }]}
                  onPress={() => onTextScaleChange(Math.min(1.6, Number((textScale + 0.1).toFixed(1))))}
                  activeOpacity={0.8}
                >
                  <Text style={{ color: themeColors.text, fontWeight: '700', fontSize: 18 }}>A</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>

        {/* Language Toggle */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>{isEnglish ? 'LANGUAGE' : 'KASA'}</Text>
          <View style={[styles.card, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}> 
            <View style={styles.langRow}>
              <TouchableOpacity
                style={[styles.langBtn, language === 'tw' && styles.langBtnActive]}
                onPress={() => onLanguageChange('tw')}
                activeOpacity={0.8}
              >
                <Text style={[styles.langText, language === 'tw' && styles.langTextActive, { fontSize: applyScale(13) }]}>
                   Asante Twi
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.langBtn, language === 'en' && styles.langBtnActive]}
                onPress={() => onLanguageChange('en')}
                activeOpacity={0.8}
              >
                <Text style={[styles.langText, language === 'en' && styles.langTextActive, { fontSize: applyScale(13) }]}>
                   English
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Audio & Khaya AI Settings */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionLabel}>
              {isEnglish ? 'AUDIO & TTS (KHAYA AI)' : 'NNYIGYEI NE KHAYA AI'}
            </Text>
            <View style={styles.sampleRateBadge}>
              <Text style={styles.sampleRateBadgeText}>16 kHz • Khaya Audio</Text>
            </View>
          </View>

          <View style={[styles.card, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
            {/* Speaker selection */}
            <View style={styles.settingCol}>
              <Text style={[styles.settingTitle, { color: themeColors.text, fontSize: applyScale(14) }]}>
                {isEnglish ? 'Khaya AI Voice' : 'Khaya AI Nne'}
              </Text>
              <Text style={[styles.settingSubtitle, { color: themeColors.muted, fontSize: applyScale(11), marginBottom: 10 }]}>
                {isEnglish ? 'Choose the Ghanaian speech synthesis voice model.' : 'Paw nne a Khaya AI de bɛkasa ama wo.'}
              </Text>

              <View style={styles.voiceSelectorRow}>
                <TouchableOpacity
                  style={[
                    styles.voiceOptionBtn,
                    { borderColor: themeColors.border, backgroundColor: themeColors.cardAlt },
                    audioSettings.speaker === 'female' && styles.voiceOptionBtnActive,
                  ]}
                  onPress={() => updateSpeaker('female')}
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name="woman"
                    size={16}
                    color={audioSettings.speaker === 'female' ? '#fff' : themeColors.text}
                  />
                  <Text
                    style={[
                      styles.voiceOptionText,
                      { color: themeColors.text, fontSize: applyScale(12) },
                      audioSettings.speaker === 'female' && styles.voiceOptionTextActive,
                    ]}
                  >
                    {isEnglish ? 'Female' : 'Ɔbaa'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.voiceOptionBtn,
                    { borderColor: themeColors.border, backgroundColor: themeColors.cardAlt },
                    audioSettings.speaker === 'male_low' && styles.voiceOptionBtnActive,
                  ]}
                  onPress={() => updateSpeaker('male_low')}
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name="man"
                    size={16}
                    color={audioSettings.speaker === 'male_low' ? '#fff' : themeColors.text}
                  />
                  <Text
                    style={[
                      styles.voiceOptionText,
                      { color: themeColors.text, fontSize: applyScale(12) },
                      audioSettings.speaker === 'male_low' && styles.voiceOptionTextActive,
                    ]}
                  >
                    {isEnglish ? 'Male (Deep)' : 'Ɔbarima (Low)'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.voiceOptionBtn,
                    { borderColor: themeColors.border, backgroundColor: themeColors.cardAlt },
                    audioSettings.speaker === 'male_high' && styles.voiceOptionBtnActive,
                  ]}
                  onPress={() => updateSpeaker('male_high')}
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name="man-outline"
                    size={16}
                    color={audioSettings.speaker === 'male_high' ? '#fff' : themeColors.text}
                  />
                  <Text
                    style={[
                      styles.voiceOptionText,
                      { color: themeColors.text, fontSize: applyScale(12) },
                      audioSettings.speaker === 'male_high' && styles.voiceOptionTextActive,
                    ]}
                  >
                    {isEnglish ? 'Male (High)' : 'Ɔbarima (High)'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.divider} />

            {/* Speaking Rate selection */}
            <View style={styles.settingRow}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.settingTitle, { color: themeColors.text, fontSize: applyScale(14) }]}>
                  {isEnglish ? 'Speaking Speed' : 'Kasa Ntɛmntɛm'}
                </Text>
                <Text style={[styles.settingSubtitle, { color: themeColors.muted, fontSize: applyScale(11) }]}>
                  {isEnglish
                    ? `Current: ${audioSettings.speakingRate.toFixed(1)}x (${audioSettings.speakingRate === 1.0 ? 'Khaya AI Natural' : audioSettings.speakingRate < 1.0 ? 'Slower' : 'Faster'})`
                    : `Seesei: ${audioSettings.speakingRate.toFixed(1)}x (${audioSettings.speakingRate === 1.0 ? 'Khaya Nnyigyei Pa' : audioSettings.speakingRate < 1.0 ? 'Nkekaho' : 'Ntɛm'})`}
                </Text>
              </View>

              <View style={styles.rateSelectorRow}>
                {[0.8, 1.0, 1.2].map((rate) => (
                  <TouchableOpacity
                    key={rate}
                    style={[
                      styles.rateBtn,
                      { borderColor: themeColors.border, backgroundColor: themeColors.cardAlt },
                      audioSettings.speakingRate === rate && styles.rateBtnActive,
                    ]}
                    onPress={() => updateRate(rate)}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[
                        styles.rateBtnText,
                        { color: themeColors.text },
                        audioSettings.speakingRate === rate && styles.rateBtnTextActive,
                      ]}
                    >
                      {rate.toFixed(1)}x
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.divider} />

            {/* Test Voice preview button */}
            <View style={styles.settingRow}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.settingTitle, { color: themeColors.text, fontSize: applyScale(14) }]}>
                  {isEnglish ? 'Test Khaya AI Voice' : 'Sɔ Khaya Nne Hwɛ'}
                </Text>
                <Text style={[styles.settingSubtitle, { color: themeColors.muted, fontSize: applyScale(11) }]}>
                  {isEnglish ? 'Hear a sample with current audio settings.' : 'Tie sɛnea nne no bɛyɛ adwuma.'}
                </Text>
              </View>

              <TouchableOpacity
                style={[styles.previewBtn, isTestingAudio && styles.previewBtnActive]}
                onPress={handleTestVoice}
                activeOpacity={0.8}
              >
                <Ionicons
                  name={isTestingAudio ? 'stop' : 'volume-high'}
                  size={16}
                  color="#fff"
                />
                <Text style={styles.previewBtnText}>
                  {isTestingAudio
                    ? (isEnglish ? 'Stop' : 'Gyae')
                    : (isEnglish ? 'Play' : 'Bɔ')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* National Helpline */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>{isEnglish ? 'EMERGENCY' : 'MMOA NTƐM'}</Text>
          <View style={[styles.helplineCard, { backgroundColor: darkMode ? '#7c1a00' : '#fef2f2' }] }>
            <View style={styles.helplineHeader}>
              <Ionicons name="call" size={18} color="#fff" />
              <Text style={[styles.helplineTitle, { fontSize: applyScale(13) }]}>
                {isEnglish ? 'National Cholera Helpline' : 'National Helpline'}
              </Text>
            </View>
            <Text style={[styles.helplineDesc, { color: darkMode ? 'rgba(255,255,255,0.85)' : '#7c2d12', fontSize: applyScale(12) }]}>
              {isEnglish
                ? 'Call 112 or 0302-661-122 for immediate cholera emergency help from Ghana Health Service.'
                : 'Frɛ 112 anaa 0302-661-122 ntɛm ara ma cholera ho mmoa wɔ Ghana Health Service.'}
            </Text>
            <TouchableOpacity
              style={[styles.callBtn, { backgroundColor: darkMode ? '#fff' : '#fff7ed' }]}
              onPress={() => Linking.openURL('tel:112')}
              activeOpacity={0.8}
            >
              <Text style={styles.callBtnText}>
                {isEnglish ? '📞 Call 112 Now' : '📞 Frɛ 112 Seesei'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* FAQs */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>{isEnglish ? 'FAQS & ADVISORIES' : 'NSƐMMISA NE NYANSAHYƐ'}</Text>
          <View style={[styles.card, { backgroundColor: themeColors.card, borderColor: themeColors.border }] }>
            {faqs.map((faq, idx) => (
              <View key={idx}>
                <TouchableOpacity
                  style={styles.faqRow}
                  onPress={() => setExpandedFaq(expandedFaq === idx ? null : idx)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.faqQ, { color: themeColors.text, fontSize: applyScale(13) }]} numberOfLines={2}>{faq.q}</Text>
                  <Ionicons
                    name={expandedFaq === idx ? 'chevron-up' : 'chevron-down'}
                    size={16}
                    color="#FF5A36"
                  />
                </TouchableOpacity>
                {expandedFaq === idx && (
                  <View style={styles.faqAnswer}>
                    <Text style={[styles.faqA, { color: themeColors.muted, fontSize: applyScale(12) }]}>{faq.a}</Text>
                  </View>
                )}
                {idx < faqs.length - 1 && <View style={[styles.divider, { backgroundColor: themeColors.border }]} />}
              </View>
            ))}
          </View>
        </View>

        {/* Reset Chat */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>{isEnglish ? 'DANGER ZONE' : 'SESA'}</Text>
          <View style={[styles.card, { backgroundColor: themeColors.card, borderColor: themeColors.border }] }>
            <TouchableOpacity
              style={styles.resetBtn}
              onPress={() => {
                Alert.alert(
                  isEnglish ? 'Reset Chat?' : 'Sesa nkɔmmɔbɔ?',
                  isEnglish
                    ? 'This will clear all messages and start a new session.'
                    : 'Yɛbɛyira nsɛm nyinaa na yɛbɛhyɛ aseɛ foforɔ.',
                  [
                    { text: isEnglish ? 'Cancel' : 'Gyae', style: 'cancel' },
                    { text: isEnglish ? 'Reset' : 'Sesa', style: 'destructive', onPress: onResetChat },
                  ]
                );
              }}
              activeOpacity={0.8}
            >
              <Ionicons name="refresh" size={16} color="#ef4444" />
              <Text style={[styles.resetText, { fontSize: applyScale(13) }]}>
                {isEnglish ? 'Reset & Clear Chat History' : 'Sesa ne Yi nkɔmmɔbɔ Nyinaa'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* App Info */}
        <View style={styles.footer}>
          <Text style={[styles.footerText, { fontSize: applyScale(11) }]}>Cholex AI · Ghana Health NLP · v1.4.0</Text>
          <Text style={[styles.footerSub, { fontSize: applyScale(10) }]}>
            {isEnglish ? 'Built for Ghanaian Communities' : 'Yɛyɛɛ ma Amanaman Ghana'}
          </Text>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#121214' },
  container: { flex: 1, backgroundColor: '#121214' },
  content: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 40 },

  section: { marginBottom: 24 },
  sectionLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FF5A36',
    letterSpacing: 1.5,
    marginBottom: 8,
    paddingLeft: 4,
  },

  card: {
    backgroundColor: '#1C1C1F',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#2a2a2e',
    overflow: 'hidden',
  },

  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 14,
    gap: 12,
  },
  settingTitle: {
    fontWeight: '700',
    marginBottom: 2,
  },
  settingSubtitle: {
    fontWeight: '500',
    lineHeight: 16,
  },
  textSizeControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sizeBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Language
  langRow: { flexDirection: 'row', padding: 6, gap: 6 },
  langBtn: {
    flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10,
  },
  langBtnActive: { backgroundColor: '#FF5A36' },
  langText: { color: '#888', fontSize: 13, fontWeight: '600' },
  langTextActive: { color: '#fff', fontWeight: '700' },

  // Helpline
  helplineCard: {
    backgroundColor: '#7c1a00',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#FF5A36',
  },
  helplineHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  helplineTitle: { color: '#fff', fontWeight: '800', fontSize: 13, letterSpacing: 0.5 },
  helplineDesc: { color: 'rgba(255,255,255,0.85)', fontSize: 12, lineHeight: 18, marginBottom: 12 },
  callBtn: {
    backgroundColor: '#fff',
    paddingVertical: 11,
    borderRadius: 10,
    alignItems: 'center',
  },
  callBtnText: { color: '#FF5A36', fontWeight: '800', fontSize: 13 },

  // FAQs
  faqRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 13,
    gap: 8,
  },
  faqQ: { flex: 1, color: '#e4e4e7', fontSize: 13, fontWeight: '600' },
  faqAnswer: {
    paddingHorizontal: 14,
    paddingBottom: 13,
  },
  faqA: { color: '#a1a1aa', fontSize: 12, lineHeight: 18 },
  divider: { height: 1, backgroundColor: '#2a2a2e', marginHorizontal: 14 },

  // Audio / Khaya Settings
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  sampleRateBadge: {
    backgroundColor: '#FF5A3622',
    borderColor: '#FF5A3666',
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  sampleRateBadgeText: {
    color: '#FF5A36',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  settingCol: {
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  voiceSelectorRow: {
    flexDirection: 'row',
    gap: 8,
  },
  voiceOptionBtn: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 6,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  voiceOptionBtnActive: {
    backgroundColor: '#FF5A36',
    borderColor: '#FF5A36',
  },
  voiceOptionText: {
    fontWeight: '600',
  },
  voiceOptionTextActive: {
    color: '#fff',
    fontWeight: '700',
  },
  rateSelectorRow: {
    flexDirection: 'row',
    gap: 6,
  },
  rateBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rateBtnActive: {
    backgroundColor: '#FF5A36',
    borderColor: '#FF5A36',
  },
  rateBtnText: {
    fontWeight: '600',
    fontSize: 12,
  },
  rateBtnTextActive: {
    color: '#fff',
    fontWeight: '700',
  },
  previewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FF5A36',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
  },
  previewBtnActive: {
    backgroundColor: '#dc2626',
  },
  previewBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 12,
  },

  // Reset
  resetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  resetText: { color: '#ef4444', fontWeight: '700', fontSize: 13 },

  // Footer
  footer: { alignItems: 'center', paddingTop: 8 },
  footerText: { color: '#52525b', fontSize: 11, fontWeight: '600' },
  footerSub: { color: '#3f3f46', fontSize: 10, marginTop: 4 },
});
