import { useTranslation } from '@/contexts/TranslationContext';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronLeft, Heart, Volume2 } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Speech from 'expo-speech';
import { Audio } from 'expo-av';

export default function TranslationResultScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { wordId } = useLocalSearchParams<{ wordId: string }>();
  const { vocabulary, isFavorite, toggleFavorite } = useTranslation();
  const [word, setWord] = useState(vocabulary.find((w) => w.id === wordId));
  const [favorite, setFavorite] = useState(false);

  useEffect(() => {
    if (wordId) {
      const foundWord = vocabulary.find((w) => w.id === wordId);
      setWord(foundWord);
      setFavorite(isFavorite(wordId));
    }
  }, [wordId, vocabulary, isFavorite]);

  const handleToggleFavorite = () => {
    if (wordId) {
      toggleFavorite(wordId);
      setFavorite(!favorite);
    }
  };

  const handleSpeak = async (text: string, language: string, audioPath?: string) => {
    try {
      if (audioPath && language === 'en') {
        console.log(`${Platform.OS}: Audio fayl o'ynatilmoqda:`, audioPath);
        
        const sound = new Audio.Sound();
        try {
          let audioUri = '';
          
          if (audioPath.startsWith('http://') || audioPath.startsWith('https://')) {
            audioUri = audioPath;
          } else {
            const cleanPath = audioPath.replace(/^assets\/audio\//, '').replace(/^\//, '');
            audioUri = `https://raw.githubusercontent.com/Shohruh-stack/rork-nodilingo-mobile-translator-clone/main/assets/audio/${cleanPath}`;
          }
          
          console.log('Audio URL:', audioUri);
          console.log('Platform:', Platform.OS);
          
          await Audio.setAudioModeAsync({
            playsInSilentModeIOS: true,
            staysActiveInBackground: false,
            shouldDuckAndroid: true,
          });
          
          console.log('Audio yuklanmoqda...');
          const result = await sound.loadAsync(
            { uri: audioUri },
            { shouldPlay: false }
          );
          
          if (result.isLoaded) {
            console.log('Audio yuklandi');
            await sound.playAsync();
            console.log('Audio o\'ynatildi');
            
            sound.setOnPlaybackStatusUpdate((status) => {
              if (status.isLoaded && status.didJustFinish) {
                console.log('Audio tugadi');
                sound.unloadAsync();
              }
            });
          } else {
            throw new Error('Audio yuklanmadi');
          }
        } catch (audioError: any) {
          console.error('Audio fayl xatolik:', audioError?.message || audioError);
          console.log('Speech API ishlatilmoqda (fallback)');
          Speech.speak(text, { language });
        }
      } else {
        console.log('Speech API ishlatilmoqda');
        Speech.speak(text, { language });
      }
    } catch (error) {
      console.error('Audio o\'ynatishda xatolik:', error);
      Speech.speak(text, { language });
    }
  };

  if (!word) {
    return (
      <View style={styles.container}>
        <LinearGradient colors={['#FFD54F', '#FF9800']} style={styles.gradient}>
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>So&apos;z topilmadi</Text>
          </View>
        </LinearGradient>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#FFD54F', '#FF9800']} style={styles.gradient}>
        <View style={[styles.header, { paddingTop: insets.top + 20 }]}>
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <ChevronLeft size={28} color="#fff" />
          </Pressable>
          <Text style={styles.headerTitle}>Tarjima natijasi</Text>
          <Pressable style={styles.favoriteButton} onPress={handleToggleFavorite}>
            <Heart size={28} color="#fff" fill={favorite ? '#fff' : 'transparent'} />
          </Pressable>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.mainCard}>
            <View style={styles.wordHeader}>
              <View style={styles.wordInfo}>
                <Text style={styles.mainWord}>{word.english}</Text>
                {word.pronunciation && <Text style={styles.pronunciation}>{word.pronunciation}</Text>}
              </View>
              <Pressable
                style={styles.speakButton}
                onPress={() => handleSpeak(word.english, 'en', word.audio)}
              >
                <Volume2 size={28} color="#4CAF50" />
              </Pressable>
            </View>

            <View style={styles.divider} />

            <View style={styles.translationSection}>
              {word.uzbek && (
                <View style={styles.translationItem}>
                  <View style={styles.translationHeader}>
                    <View>
                      <Text style={styles.translationLabel}>O&apos;zbekcha</Text>
                      <Text style={styles.translationWord}>{word.uzbek}</Text>
                    </View>
                    <Pressable
                      style={styles.speakButton}
                      onPress={() => handleSpeak(word.uzbek, 'uz')}
                    >
                      <Volume2 size={24} color="#FF9800" />
                    </Pressable>
                  </View>
                </View>
              )}
              {word.urdu && (
                <View style={styles.translationItem}>
                  <View style={styles.translationHeader}>
                    <View>
                      <Text style={styles.translationLabel}>Urdu</Text>
                      <Text style={styles.translationWord}>{word.urdu}</Text>
                    </View>
                    <Pressable
                      style={styles.speakButton}
                      onPress={() => word.urdu && handleSpeak(word.urdu, 'ur')}
                    >
                      <Volume2 size={24} color="#FF9800" />
                    </Pressable>
                  </View>
                </View>
              )}
              {word.hindi && (
                <View style={styles.translationItem}>
                  <View style={styles.translationHeader}>
                    <View>
                      <Text style={styles.translationLabel}>Hindi</Text>
                      <Text style={styles.translationWord}>{word.hindi}</Text>
                    </View>
                    <Pressable
                      style={styles.speakButton}
                      onPress={() => word.hindi && handleSpeak(word.hindi, 'hi')}
                    >
                      <Volume2 size={24} color="#FF9800" />
                    </Pressable>
                  </View>
                </View>
              )}
              {word.russian && (
                <View style={styles.translationItem}>
                  <View style={styles.translationHeader}>
                    <View>
                      <Text style={styles.translationLabel}>Русский</Text>
                      <Text style={styles.translationWord}>{word.russian}</Text>
                    </View>
                    <Pressable
                      style={styles.speakButton}
                      onPress={() => word.russian && handleSpeak(word.russian, 'ru')}
                    >
                      <Volume2 size={24} color="#FF9800" />
                    </Pressable>
                  </View>
                </View>
              )}
              {word.partOfSpeech && <Text style={styles.partOfSpeech}>{word.partOfSpeech}</Text>}
            </View>
          </View>

          {word.examples && word.examples.length > 0 && (
            <View style={styles.examplesCard}>
              <Text style={styles.examplesTitle}>Misollar</Text>
              {word.examples.map((example, index) => (
                <View key={index} style={styles.exampleItem}>
                  <View style={styles.exampleRow}>
                    <Text style={styles.exampleBullet}>•</Text>
                    <View style={styles.exampleContent}>
                      <Text style={styles.exampleEnglish}>{example.english}</Text>
                      <Text style={styles.exampleUzbek}>{example.uzbek}</Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          )}

          <Pressable
            style={[styles.actionButton, favorite && styles.actionButtonActive]}
            onPress={handleToggleFavorite}
          >
            <Heart
              size={24}
              color={favorite ? '#fff' : '#FF9800'}
              fill={favorite ? '#fff' : 'transparent'}
            />
            <Text style={[styles.actionButtonText, favorite && styles.actionButtonTextActive]}>
              {favorite ? 'Sevimlilardan olib tashlash' : 'Sevimlilarga qo&apos;shish'}
            </Text>
          </Pressable>
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
    paddingBottom: 20,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold' as const,
    color: '#fff',
  },
  favoriteButton: {
    padding: 4,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  mainCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  wordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  wordInfo: {
    flex: 1,
  },
  mainWord: {
    fontSize: 32,
    fontWeight: 'bold' as const,
    color: '#333',
    marginBottom: 8,
  },
  pronunciation: {
    fontSize: 18,
    color: '#666',
  },
  speakButton: {
    padding: 8,
  },
  divider: {
    height: 1,
    backgroundColor: '#E0E0E0',
    marginVertical: 20,
  },
  translationSection: {
    gap: 16,
  },
  translationItem: {
    marginBottom: 8,
  },
  translationLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  translationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  translationWord: {
    fontSize: 28,
    fontWeight: '600' as const,
    color: '#FF9800',
  },
  partOfSpeech: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic' as const,
  },
  examplesCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  examplesTitle: {
    fontSize: 20,
    fontWeight: 'bold' as const,
    color: '#333',
    marginBottom: 16,
  },
  exampleItem: {
    marginBottom: 16,
  },
  exampleRow: {
    flexDirection: 'row',
    gap: 8,
  },
  exampleBullet: {
    fontSize: 20,
    color: '#FF9800',
    marginTop: 2,
  },
  exampleContent: {
    flex: 1,
    gap: 4,
  },
  exampleEnglish: {
    fontSize: 16,
    color: '#333',
    lineHeight: 24,
  },
  exampleUzbek: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: '#fff',
    borderRadius: 25,
    paddingVertical: 16,
    marginBottom: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionButtonActive: {
    backgroundColor: '#FF9800',
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#FF9800',
  },
  actionButtonTextActive: {
    color: '#fff',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 20,
    fontWeight: 'bold' as const,
    color: '#fff',
  },
});
