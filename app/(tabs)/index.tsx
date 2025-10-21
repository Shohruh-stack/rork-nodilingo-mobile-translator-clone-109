import { useTranslation, VocabularyEntry } from '@/contexts/TranslationContext';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Mic, Search, Settings, ArrowLeftRight, Heart } from 'lucide-react-native';
import React, { useState } from 'react';
import {
  Animated,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Speech from 'expo-speech';
import { Audio } from 'expo-av';

export default function SearchScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { fromLanguage, toLanguage, searchWordWithFallback, swapLanguages, isOnline, isFavorite, toggleFavorite, getSuggestions } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [micScale] = useState(new Animated.Value(1));
  const [translationResult, setTranslationResult] = useState<VocabularyEntry | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [suggestions, setSuggestions] = useState<VocabularyEntry[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const handleSearch = async (query?: string) => {
    const searchText = query || searchQuery.trim();
    if (searchText) {
      setErrorMessage('');
      setShowResult(false);
      setShowSuggestions(false);
      setSuggestions([]);
      try {
        const result = await searchWordWithFallback(searchText);
        setTranslationResult(result);
        setShowResult(true);
        if (!result) {
          setErrorMessage(isOnline ? 'So\'z topilmadi. Boshqa so\'z bilan urinib ko\'ring.' : 'So\'z offline lug\'atda topilmadi. Internet ulanishini tekshiring.');
        }
      } catch (error) {
        console.error('Qidiruv xatolik:', error);
        setErrorMessage('Tarjima qilishda xatolik yuz berdi. Qaytadan urinib ko\'ring.');
        setTranslationResult(null);
        setShowResult(true);
      }
    }
  };

  const handleTextChange = (text: string) => {
    setSearchQuery(text);
    
    if (text.trim().length > 0) {
      const newSuggestions = getSuggestions(text.trim(), 8);
      setSuggestions(newSuggestions);
      setShowSuggestions(newSuggestions.length > 0);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
    
    setShowResult(false);
  };

  const handleSuggestionPress = (entry: VocabularyEntry) => {
    const searchField = entry[fromLanguage as keyof VocabularyEntry];
    if (typeof searchField === 'string') {
      setSearchQuery(searchField);
      setShowSuggestions(false);
      setSuggestions([]);
      handleSearch(searchField);
    }
  };

  const startRecording = async () => {
    try {
      console.log('Requesting permissions..');
      const permission = await Audio.requestPermissionsAsync();

      if (permission.status !== 'granted') {
        console.log('Permission to access microphone was denied');
        return;
      }

      if (Platform.OS !== 'web') {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: true,
          playsInSilentModeIOS: true,
        });
      }

      console.log('Starting recording..');
      const { recording: newRecording } = await Audio.Recording.createAsync({
        android: {
          extension: '.m4a',
          outputFormat: Audio.AndroidOutputFormat.MPEG_4,
          audioEncoder: Audio.AndroidAudioEncoder.AAC,
          sampleRate: 44100,
          numberOfChannels: 2,
          bitRate: 128000,
        },
        ios: {
          extension: '.wav',
          outputFormat: Audio.IOSOutputFormat.LINEARPCM,
          audioQuality: Audio.IOSAudioQuality.HIGH,
          sampleRate: 44100,
          numberOfChannels: 2,
          bitRate: 128000,
          linearPCMBitDepth: 16,
          linearPCMIsBigEndian: false,
          linearPCMIsFloat: false,
        },
        web: {
          mimeType: 'audio/webm',
          bitsPerSecond: 128000,
        },
      });
      setRecording(newRecording);
      setIsRecording(true);

      Animated.loop(
        Animated.sequence([
          Animated.timing(micScale, {
            toValue: 1.2,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(micScale, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } catch (err) {
      console.error('Failed to start recording', err);
    }
  };

  const stopRecording = async () => {
    console.log('Stopping recording..');
    if (!recording) return;

    setIsRecording(false);
    micScale.setValue(1);

    try {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      
      if (Platform.OS !== 'web') {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
        });
      }
      setRecording(null);

      if (uri && isOnline) {
        console.log('Audio fayl URI:', uri);
        await transcribeAudio(uri);
      } else if (!isOnline) {
        setSearchQuery('');
        setErrorMessage('Audio qidiruv uchun internet kerak');
        setShowResult(true);
      }
    } catch (error) {
      console.error('Failed to stop recording', error);
      setErrorMessage('Audio yozishda xatolik yuz berdi');
    }
  };

  const transcribeAudio = async (uri: string) => {
    try {
      console.log('Audio transkripsiya qilinmoqda...');
      console.log('Audio URI:', uri);
      console.log('Platform:', Platform.OS);
      setSearchQuery('Ovoz tanilmoqda...');
      setErrorMessage('');
      setShowResult(false);
      
      const formData = new FormData();
      
      const uriParts = uri.split('.');
      const fileType = uriParts[uriParts.length - 1];
      console.log('File type:', fileType);
      
      if (Platform.OS === 'web') {
        const response = await fetch(uri);
        const blob = await response.blob();
        formData.append('audio', blob, `recording.${fileType}`);
        console.log('Web: Audio blob qo\'shildi');
      } else {
        const audioFile = {
          uri,
          name: `recording.${fileType}`,
          type: `audio/${fileType}`,
        } as any;
        formData.append('audio', audioFile);
        console.log('Mobile: Audio file info:', { name: audioFile.name, type: audioFile.type });
      }
      const langCode = fromLanguage === 'english' ? 'en' : fromLanguage === 'uzbek' ? 'uz' : 'en';
      formData.append('language', langCode);
      
      console.log('STT API ga so\'rov yuborilmoqda...');
      console.log('Language:', langCode);
      
      const response = await fetch('https://toolkit.rork.com/stt/transcribe/', {
        method: 'POST',
        body: formData,
      });
      
      console.log('STT API javob statusi:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('STT API xatolik:', response.status);
        console.error('STT API xatolik matni:', errorText);
        throw new Error(`STT API xatolik: ${response.status} - ${errorText}`);
      }
      
      const data = await response.json();
      console.log('Transkripsiya natijasi:', JSON.stringify(data));
      
      if (data.text && data.text.trim()) {
        const transcribedText = data.text.trim();
        console.log('Tanilgan matn:', transcribedText);
        setSearchQuery(transcribedText);
        
        const result = await searchWordWithFallback(transcribedText, true);
        setTranslationResult(result);
        setShowResult(true);
        
        if (!result) {
          setErrorMessage(`"${transcribedText}" so'zi topilmadi. Boshqa so'z bilan urinib ko'ring.`);
        }
      } else {
        console.log('Ovoz tanilmadi yoki bo\'sh matn');
        setSearchQuery('');
        setErrorMessage('Ovoz tanilmadi. Iltimos, aniqroq va balandroq gapiring.');
        setShowResult(true);
      }
    } catch (error: any) {
      console.error('Transkripsiya xatolik:', error?.message || error);
      if (error?.message) {
        console.error('Xatolik xabari:', error.message);
      }
      setSearchQuery('');
      setErrorMessage('Ovoz tanishda xatolik yuz berdi. Internet ulanishini tekshiring va qaytadan urinib ko\'ring.');
      setShowResult(true);
    }
  };

  const handleMicPress = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const getLanguageLabel = (lang: 'uzbek' | 'english' | 'urdu' | 'hindi' | 'russian') => {
    const labels: Record<string, string> = {
      uzbek: "O'zbekcha",
      english: 'Inglizcha',
      urdu: 'Urdu',
      hindi: 'Hindi',
      russian: 'Ruscha',
    };
    return labels[lang] || lang;
  };

  const getLanguageFlag = (lang: 'uzbek' | 'english' | 'urdu' | 'hindi' | 'russian') => {
    const flags: Record<string, string> = {
      uzbek: '🇺🇿',
      english: '🇬🇧',
      urdu: '🇵🇰',
      hindi: '🇮🇳',
      russian: '🇷🇺',
    };
    return flags[lang] || '🌐';
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#FFD54F', '#FF9800']} style={styles.gradient}>
        <View style={[styles.content, { paddingTop: insets.top + 20 }]}>
        <View style={styles.header}>
          <View style={styles.statusIndicator}>
            <View style={[styles.statusDot, { backgroundColor: isOnline ? '#4CAF50' : '#FF5252' }]} />
            <Text style={styles.statusText}>{isOnline ? 'Online' : 'Offline'}</Text>
          </View>
          <Pressable
            style={styles.settingsButton}
            onPress={() => router.push('/language-select')}
          >
            <Settings size={24} color="#fff" />
          </Pressable>
        </View>

        <Pressable
          style={styles.languageSelector}
          onPress={() => router.push('/language-select')}
        >
          <View style={styles.languageItem}>
            <Text style={styles.languageFlag}>{getLanguageFlag(fromLanguage)}</Text>
            <Text style={styles.languageText}>{getLanguageLabel(fromLanguage)}</Text>
          </View>

          <Pressable style={styles.swapButton} onPress={swapLanguages}>
            <ArrowLeftRight size={20} color="#FF9800" />
          </Pressable>

          <View style={styles.languageItem}>
            <Text style={styles.languageFlag}>{getLanguageFlag(toLanguage)}</Text>
            <Text style={styles.languageText}>{getLanguageLabel(toLanguage)}</Text>
          </View>
        </Pressable>

        <Animated.View style={[styles.micContainer, { transform: [{ scale: micScale }] }]}>
          <Pressable
            style={[styles.micButton, isRecording && styles.micButtonActive]}
            onPress={handleMicPress}
            disabled={!isOnline}
          >
            <Mic size={48} color={isRecording ? '#FF5252' : isOnline ? '#4CAF50' : '#999'} />
          </Pressable>
          {!isOnline && (
            <Text style={styles.micHint}>Audio qidiruv uchun internet kerak</Text>
          )}
        </Animated.View>

        <View style={styles.searchWrapper}>
          <View style={styles.searchContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder="So&apos;z kiriting"
              placeholderTextColor="#999"
              value={searchQuery}
              onChangeText={handleTextChange}
              onSubmitEditing={() => handleSearch()}
              onFocus={() => {
                if (searchQuery.trim().length > 0 && suggestions.length > 0) {
                  setShowSuggestions(true);
                }
              }}
            />
            <Pressable style={styles.searchButton} onPress={() => handleSearch()}>
              <Search size={24} color="#FF9800" />
            </Pressable>
          </View>

          {showSuggestions && suggestions.length > 0 && (
            <View style={styles.suggestionsContainer}>
              <ScrollView
                style={styles.suggestionsList}
                keyboardShouldPersistTaps="handled"
                nestedScrollEnabled={true}
              >
                {suggestions.map((entry) => {
                  const displayText = entry[fromLanguage as keyof VocabularyEntry];
                  const translationText = entry[toLanguage as keyof VocabularyEntry];
                  
                  return (
                    <Pressable
                      key={entry.id}
                      style={styles.suggestionItem}
                      onPress={() => handleSuggestionPress(entry)}
                    >
                      <View style={styles.suggestionContent}>
                        <Text style={styles.suggestionWord}>
                          {typeof displayText === 'string' ? displayText : ''}
                        </Text>
                        <Text style={styles.suggestionTranslation}>
                          {typeof translationText === 'string' ? translationText : ''}
                        </Text>
                      </View>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>
          )}
        </View>

        {showResult && (
          <View style={styles.resultContainer}>
            {translationResult ? (
              <View style={styles.resultCard}>
                <Pressable
                  style={styles.resultContent}
                  onPress={() => {
                    router.push({
                      pathname: '/translation-result',
                      params: { wordId: translationResult.id },
                    });
                  }}
                >
                  <View style={styles.resultHeader}>
                    <Text style={styles.resultWord}>
                      {fromLanguage === 'english'
                        ? translationResult.english
                        : fromLanguage === 'uzbek'
                        ? translationResult.uzbek
                        : fromLanguage === 'urdu'
                        ? translationResult.urdu || translationResult.english
                        : fromLanguage === 'hindi'
                        ? translationResult.hindi || translationResult.english
                        : translationResult.russian || translationResult.english}
                    </Text>
                    <Pressable
                      onPress={(e) => {
                        e.stopPropagation();
                        const textToSpeak =
                          fromLanguage === 'english'
                            ? translationResult.english
                            : translationResult.uzbek;
                        Speech.speak(textToSpeak, {
                          language: fromLanguage === 'english' ? 'en' : 'uz',
                        });
                      }}
                    >
                      <View style={styles.speakerButton}>
                        <Text style={styles.speakerIcon}>🔊</Text>
                      </View>
                    </Pressable>
                  </View>
                  {translationResult.pronunciation ? (
                    <Text style={styles.pronunciation}>{translationResult.pronunciation}</Text>
                  ) : null}
                  <Text style={styles.translation}>
                    {toLanguage === 'english'
                      ? translationResult.english
                      : toLanguage === 'uzbek'
                      ? translationResult.uzbek
                      : toLanguage === 'urdu'
                      ? translationResult.urdu || translationResult.uzbek
                      : toLanguage === 'hindi'
                      ? translationResult.hindi || translationResult.uzbek
                      : translationResult.russian || translationResult.uzbek}
                  </Text>
                  {translationResult.partOfSpeech ? (
                    <Text style={styles.partOfSpeech}>{translationResult.partOfSpeech}</Text>
                  ) : null}
                </Pressable>
                <Pressable
                  style={styles.favoriteButtonInResult}
                  onPress={() => {
                    toggleFavorite(translationResult.id);
                  }}
                >
                  <Heart
                    size={24}
                    color="#FF9800"
                    fill={isFavorite(translationResult.id) ? '#FF9800' : 'transparent'}
                  />
                  <Text style={styles.favoriteButtonText}>
                    {isFavorite(translationResult.id) ? 'Sevimlilardan olib tashlash' : 'Sevimlilarga qo\'shish'}
                  </Text>
                </Pressable>
              </View>
            ) : (
              <View style={styles.resultCard}>
                <Text style={styles.noResultText}>So&apos;z topilmadi</Text>
                <Text style={styles.noResultSubtext}>
                  {errorMessage || "Boshqa so'z bilan urinib ko'ring"}
                </Text>
              </View>
            )}
          </View>
        )}
        </View>
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
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600' as const,
  },
  settingsButton: {
    padding: 8,
  },
  languageSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderRadius: 25,
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginBottom: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  languageItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  languageFlag: {
    fontSize: 28,
  },
  languageText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#333',
  },
  swapButton: {
    padding: 8,
    backgroundColor: '#FFF3E0',
    borderRadius: 20,
  },
  micContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  micButton: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  micButtonActive: {
    backgroundColor: '#FFEBEE',
  },
  searchWrapper: {
    position: 'relative' as const,
    zIndex: 1000,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 25,
    paddingHorizontal: 20,
    paddingVertical: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  suggestionsContainer: {
    position: 'absolute' as const,
    top: 60,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderRadius: 20,
    maxHeight: 300,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
    overflow: 'hidden',
  },
  suggestionsList: {
    maxHeight: 300,
  },
  suggestionItem: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  suggestionContent: {
    flexDirection: 'column',
    gap: 4,
  },
  suggestionWord: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#333',
  },
  suggestionTranslation: {
    fontSize: 14,
    color: '#FF9800',
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 12,
    color: '#333',
  },
  searchButton: {
    padding: 8,
  },
  resultContainer: {
    marginTop: 20,
  },
  resultCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  resultContent: {
    padding: 20,
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  resultWord: {
    fontSize: 28,
    fontWeight: 'bold' as const,
    color: '#333',
  },
  speakerButton: {
    padding: 8,
  },
  speakerIcon: {
    fontSize: 24,
  },
  pronunciation: {
    fontSize: 16,
    color: '#666',
    marginBottom: 12,
  },
  translation: {
    fontSize: 20,
    color: '#FF9800',
    fontWeight: '600' as const,
    marginBottom: 16,
  },

  noResultText: {
    fontSize: 20,
    fontWeight: 'bold' as const,
    color: '#333',
    textAlign: 'center',
    marginBottom: 8,
  },
  noResultSubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  partOfSpeech: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic' as const,
    marginBottom: 12,
  },
  micHint: {
    fontSize: 12,
    color: '#fff',
    marginTop: 8,
    textAlign: 'center' as const,
  },
  favoriteButtonInResult: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  favoriteButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#FF9800',
  },
});
