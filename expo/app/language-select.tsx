import { useTranslation, Language } from '@/contexts/TranslationContext';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { ChevronLeft, Check } from 'lucide-react-native';
import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface LanguageOption {
  code: Language;
  name: string;
  flag: string;
}

const languages: LanguageOption[] = [
  { code: 'uzbek', name: "O'zbekcha", flag: '🇺🇿' },
  { code: 'english', name: 'English', flag: '🇬🇧' },
  { code: 'urdu', name: 'Urdu', flag: '🇵🇰' },
  { code: 'hindi', name: 'हिन्दी', flag: '🇮🇳' },
  { code: 'russian', name: 'Русский', flag: '🇷🇺' },
];

export default function LanguageSelectScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { fromLanguage, toLanguage, setFromLanguage, setToLanguage } = useTranslation();

  const handleLanguageSelect = (type: 'from' | 'to', language: Language) => {
    if (type === 'from') {
      if (language === toLanguage) {
        setToLanguage(fromLanguage);
      }
      setFromLanguage(language);
    } else {
      if (language === fromLanguage) {
        setFromLanguage(toLanguage);
      }
      setToLanguage(language);
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#FFD54F', '#FF9800']} style={styles.gradient}>
          <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
            <Pressable style={styles.backButton} onPress={() => router.back()}>
              <ChevronLeft size={28} color="#fff" />
            </Pressable>
            <Text style={styles.headerTitle}>Til tanlash</Text>
            <View style={styles.placeholder} />
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Qaysi tildan</Text>
              <View style={styles.languageList}>
                {languages.map((lang) => (
                  <Pressable
                    key={`from-${lang.code}`}
                    style={[
                      styles.languageItem,
                      fromLanguage === lang.code && styles.languageItemActive,
                    ]}
                    onPress={() => handleLanguageSelect('from', lang.code)}
                  >
                    <View style={styles.languageInfo}>
                      <Text style={styles.languageFlag}>{lang.flag}</Text>
                      <Text
                        style={[
                          styles.languageName,
                          fromLanguage === lang.code && styles.languageNameActive,
                        ]}
                      >
                        {lang.name}
                      </Text>
                    </View>
                    {fromLanguage === lang.code && (
                      <View style={styles.checkIcon}>
                        <Check size={24} color="#4CAF50" />
                      </View>
                    )}
                  </Pressable>
                ))}
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Qaysi tilga</Text>
              <View style={styles.languageList}>
                {languages.map((lang) => (
                  <Pressable
                    key={`to-${lang.code}`}
                    style={[
                      styles.languageItem,
                      toLanguage === lang.code && styles.languageItemActive,
                    ]}
                    onPress={() => handleLanguageSelect('to', lang.code)}
                  >
                    <View style={styles.languageInfo}>
                      <Text style={styles.languageFlag}>{lang.flag}</Text>
                      <Text
                        style={[
                          styles.languageName,
                          toLanguage === lang.code && styles.languageNameActive,
                        ]}
                      >
                        {lang.name}
                      </Text>
                    </View>
                    {toLanguage === lang.code && (
                      <View style={styles.checkIcon}>
                        <Check size={24} color="#4CAF50" />
                      </View>
                    )}
                  </Pressable>
                ))}
              </View>
            </View>
          </ScrollView>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold' as const,
    color: '#fff',
  },
  placeholder: {
    width: 36,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: '#fff',
    marginBottom: 16,
  },
  languageList: {
    gap: 12,
  },
  languageItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  languageItemActive: {
    backgroundColor: '#E8F5E9',
    borderWidth: 2,
    borderColor: '#4CAF50',
  },
  languageInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  languageFlag: {
    fontSize: 32,
  },
  languageName: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: '#333',
  },
  languageNameActive: {
    color: '#4CAF50',
  },
  checkIcon: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
