import React, { useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

import ChatScreen, { Message } from '../screens/ChatScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import TemplatesScreen from '../screens/TemplatesScreen';
import TrackerScreen from '../screens/TrackerScreen';
import MoreScreen from '../screens/MoreScreen';

type Language = 'tw' | 'en';

interface MainNavigatorProps {
  language: Language;
  darkMode: boolean;
  onDarkModeChange: (value: boolean) => void;
  textScale: number;
  onTextScaleChange: (value: number) => void;
  onLanguageChange: (lang: Language) => void;
  messages: Message[];
  onMessagesUpdate: (msgs: Message[]) => void;
  sessionId: string;
  onResetChat: () => void;
  onSendToChat: (query: string) => void;
  pendingQuery: string | null;
  onPendingQueryHandled: () => void;
}

const Tab = createBottomTabNavigator();

export default function MainNavigator({
  language,
  darkMode,
  onDarkModeChange,
  textScale,
  onTextScaleChange,
  onLanguageChange,
  messages,
  onMessagesUpdate,
  sessionId,
  onResetChat,
  onSendToChat,
  pendingQuery,
  onPendingQueryHandled,
}: MainNavigatorProps) {
  const isEnglish = language === 'en';
  const shellBackground = darkMode ? '#121214' : '#f4f4f5';
  const shellCard = darkMode ? '#1C1C1F' : '#ffffff';
  const shellText = darkMode ? '#e4e4e7' : '#18181b';
  const shellMuted = darkMode ? '#a1a1aa' : '#52525b';
  const shellBorder = darkMode ? '#2a2a2e' : '#e4e4e7';

  return (
    <Tab.Navigator
      id="main-tabs"
      screenOptions={({ route }) => ({
        headerShown: true,
        headerStyle: [{ ...styles.header, backgroundColor: shellBackground, borderBottomColor: shellBorder }],
        headerTitleStyle: [{ ...styles.headerTitle, color: shellText }],
        headerTintColor: shellText,
        headerLeft: () => (
          <View style={styles.headerBrand}>
            <View style={styles.headerIcon}>
              <Ionicons name="pulse" size={14} color="#fff" />
            </View>
            <View>
              <Text style={styles.headerBadge}>GHANA HEALTH NLP</Text>
              <Text style={styles.headerName}>Cholex AI</Text>
            </View>
          </View>
        ),
        headerRight: () => (
          <View style={styles.langPill}>
            <TouchableOpacity
              style={[styles.langBtn, language === 'tw' && styles.langBtnActive]}
              onPress={() => onLanguageChange('tw')}
              activeOpacity={0.8}
            >
              <Text style={[styles.langBtnText, language === 'tw' && styles.langBtnTextActive]}>Twi</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.langBtn, language === 'en' && styles.langBtnActive]}
              onPress={() => onLanguageChange('en')}
              activeOpacity={0.8}
            >
              <Text style={[styles.langBtnText, language === 'en' && styles.langBtnTextActive]}>ENG</Text>
            </TouchableOpacity>
          </View>
        ),
        tabBarStyle: [{ ...styles.tabBar, backgroundColor: shellBackground, borderTopColor: shellBorder }],
        tabBarActiveTintColor: '#FF5A36',
        tabBarInactiveTintColor: shellMuted,
        tabBarLabelStyle: [{ ...styles.tabLabel, color: shellText }],
      })}
    >
      <Tab.Screen
        name="Chat"
        options={{
          title: isEnglish ? 'AI Chat' : 'AI Chat',
          tabBarLabel: isEnglish ? 'Chat' : 'Chat',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="chatbubble-ellipses" size={size} color={color} />
          ),
          tabBarBadge: undefined,
        }}
      >
        {() => (
          <ChatScreen
            language={language}
            darkMode={darkMode}
            initialMessages={messages}
            onMessagesUpdate={onMessagesUpdate}
            sessionId={sessionId}
            pendingQuery={pendingQuery}
            onPendingQueryHandled={onPendingQueryHandled}
          />
        )}
      </Tab.Screen>

      <Tab.Screen
        name="Notifications"
        options={{
          title: isEnglish ? 'Alerts' : 'Kɔkɔbɔ',
          tabBarLabel: isEnglish ? 'Alerts' : 'Kɔkɔbɔ',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="notifications" size={size} color={color} />
          ),
          tabBarBadge: '!',
          tabBarBadgeStyle: styles.alertBadge,
        }}
      >
        {() => <NotificationsScreen language={language} darkMode={darkMode} />}
      </Tab.Screen>

      <Tab.Screen
        name="Templates"
        options={{
          title: isEnglish ? 'Symptoms' : 'Nsenkyerɛne',
          tabBarLabel: isEnglish ? 'Symptoms' : 'Nsenkyerɛne',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="document-text" size={size} color={color} />
          ),
        }}
      >
        {() => <TemplatesScreen language={language} darkMode={darkMode} onSendToChat={onSendToChat} />}
      </Tab.Screen>

      <Tab.Screen
        name="Tracker"
        options={{
          title: isEnglish ? 'Tracker' : 'Tracker',
          tabBarLabel: isEnglish ? 'Tracker' : 'Tracker',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="calendar" size={size} color={color} />
          ),
        }}
      >
        {() => <TrackerScreen language={language} darkMode={darkMode} />}
      </Tab.Screen>

      <Tab.Screen
        name="More"
        options={{
          title: isEnglish ? 'More' : 'Nsɛm Foforɔ',
          tabBarLabel: isEnglish ? 'More' : 'Nsɛm',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="ellipsis-horizontal-circle" size={size} color={color} />
          ),
        }}
      >
        {() => (
          <MoreScreen
            language={language}
            darkMode={darkMode}
            onDarkModeChange={onDarkModeChange}
            textScale={textScale}
            onTextScaleChange={onTextScaleChange}
            onLanguageChange={onLanguageChange}
            onResetChat={onResetChat}
          />
        )}
      </Tab.Screen>
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: '#181A20',
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a2e',
    elevation: 0,
    shadowOpacity: 0,
  },
  headerTitle: {
    color: '#e4e4e7',
    fontSize: 13,
    fontWeight: '700',
  },
  headerBrand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingLeft: 12,
  },
  headerIcon: {
    backgroundColor: '#FF5A36',
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerBadge: {
    color: '#FF5A36',
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  headerName: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '800',
    lineHeight: 14,
  },
  langPill: {
    flexDirection: 'row',
    backgroundColor: '#0f0f11',
    borderRadius: 8,
    padding: 3,
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#2a2a2e',
  },
  langBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  langBtnActive: { backgroundColor: '#FF5A36' },
  langBtnText: { color: '#52525b', fontSize: 10, fontWeight: '800' },
  langBtnTextActive: { color: '#fff' },

  tabBar: {
    backgroundColor: '#181A20',
    borderTopWidth: 1,
    borderTopColor: '#2a2a2e',
    height: Platform.OS === 'ios' ? 78 : 60,
    paddingTop: 6,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '700',
    marginBottom: Platform.OS === 'ios' ? 0 : 4,
  },
  alertBadge: {
    backgroundColor: '#ef4444',
    fontSize: 8,
    minWidth: 14,
    height: 14,
    lineHeight: 14,
  },
});
