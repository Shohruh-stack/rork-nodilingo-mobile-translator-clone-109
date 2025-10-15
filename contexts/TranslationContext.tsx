import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useMemo, useState } from 'react';
import vocabularyData from '@/assets/vocabulary_extended.json';
import NetInfo from '@react-native-community/netinfo';

export type Language = 'uzbek' | 'english' | 'urdu' | 'hindi' | 'russian';

export interface Example {
  english: string;
  uzbek: string;
}

export interface VocabularyEntry {
  id: string;
  english: string;
  uzbek: string;
  urdu?: string;
  hindi?: string;
  russian?: string;
  pronunciation: string;
  examples: Example[];
  partOfSpeech: string;
  audio?: string;
}

interface RawVocabularyEntry {
  english: string;
  transcription?: string;
  translations: {
    uz?: string;
    ur?: string;
    hi?: string;
    ru?: string;
  };
  audio?: string;
  examples?: { english: string; uzbek: string }[];
  partOfSpeech?: string;
}

export interface HistoryEntry {
  id: string;
  query: string;
  result: VocabularyEntry;
  timestamp: number;
  fromLanguage: Language;
  toLanguage: Language;
}

const FAVORITES_KEY = '@nodilingo_favorites';
const HISTORY_KEY = '@nodilingo_history';

export const [TranslationProvider, useTranslation] = createContextHook(() => {
  const rawData = vocabularyData as RawVocabularyEntry[];
  
  const [vocabulary] = useState<VocabularyEntry[]>(
    rawData.map((entry, index) => ({
      id: `word-${index}`,
      english: entry.english,
      uzbek: entry.translations.uz || '',
      urdu: entry.translations.ur,
      hindi: entry.translations.hi,
      russian: entry.translations.ru,
      pronunciation: entry.transcription || '',
      examples: entry.examples || [],
      partOfSpeech: entry.partOfSpeech || '',
      audio: entry.audio,
    }))
  );
  const [favorites, setFavorites] = useState<string[]>([]);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [fromLanguage, setFromLanguage] = useState<Language>('english');
  const [toLanguage, setToLanguage] = useState<Language>('uzbek');
  const [isLoading, setIsLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    loadStoredData();
    
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsOnline(state.isConnected ?? false);
    });

    return () => unsubscribe();
  }, []);

  const loadStoredData = async () => {
    try {
      const [storedFavorites, storedHistory] = await Promise.all([
        AsyncStorage.getItem(FAVORITES_KEY),
        AsyncStorage.getItem(HISTORY_KEY),
      ]);

      if (storedFavorites) {
        setFavorites(JSON.parse(storedFavorites));
      }
      if (storedHistory) {
        setHistory(JSON.parse(storedHistory));
      }
    } catch (error) {
      console.error('Error loading stored data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const addToHistory = useCallback(async (query: string, result: VocabularyEntry) => {
    try {
      const newEntry: HistoryEntry = {
        id: `${Date.now()}-${Math.random()}`,
        query,
        result,
        timestamp: Date.now(),
        fromLanguage,
        toLanguage,
      };

      setHistory((prevHistory) => {
        const updatedHistory = [newEntry, ...prevHistory.filter(h => h.result.id !== result.id)].slice(0, 50);
        AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(updatedHistory)).catch(error => {
          console.error('Error saving history:', error);
        });
        return updatedHistory;
      });
    } catch (error) {
      console.error('Error adding to history:', error);
    }
  }, [fromLanguage, toLanguage]);

  const searchWord = useCallback((query: string, exactMatchOnly: boolean = false): VocabularyEntry | null => {
    const normalizedQuery = query.toLowerCase().trim();
    
    let result: VocabularyEntry | undefined;
    
    if (exactMatchOnly) {
      result = vocabulary.find((entry) => {
        const searchField = entry[fromLanguage as keyof VocabularyEntry];
        if (typeof searchField === 'string') {
          const normalizedField = searchField.toLowerCase();
          return normalizedField === normalizedQuery;
        }
        return false;
      });
    } else {
      result = vocabulary.find((entry) => {
        const searchField = entry[fromLanguage as keyof VocabularyEntry];
        if (typeof searchField === 'string') {
          const normalizedField = searchField.toLowerCase();
          return normalizedField === normalizedQuery || normalizedField.includes(normalizedQuery);
        }
        return false;
      });
    }

    if (result) {
      addToHistory(query, result);
    }

    return result || null;
  }, [vocabulary, fromLanguage, addToHistory]);

  const translateOnline = useCallback(async (query: string): Promise<VocabularyEntry | null> => {
    try {
      const sourceLang = getLanguageCode(fromLanguage);
      const targetLang = getLanguageCode(toLanguage);

      console.log(`Online tarjima: "${query}" (${sourceLang} -> ${targetLang})`);

      const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sourceLang}&tl=${targetLang}&dt=t&q=${encodeURIComponent(query)}`;
      
      const response = await fetch(url);

      if (!response.ok) {
        console.error('Translation API error:', response.status);
        throw new Error(`API xatolik: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data || !data[0] || !data[0][0] || !data[0][0][0]) {
        console.error('Tarjima natijasi topilmadi');
        throw new Error('Tarjima natijasi topilmadi');
      }

      const translatedText = data[0][0][0];
      console.log(`Tarjima natijasi: "${translatedText}"`);

      const onlineResult: VocabularyEntry = {
        id: `online-${Date.now()}`,
        english: fromLanguage === 'english' ? query : translatedText,
        uzbek: fromLanguage === 'uzbek' ? query : translatedText,
        urdu: fromLanguage === 'urdu' ? query : undefined,
        hindi: fromLanguage === 'hindi' ? query : undefined,
        russian: fromLanguage === 'russian' ? query : undefined,
        pronunciation: '',
        examples: [],
        partOfSpeech: '',
      };

      if (toLanguage === 'urdu') onlineResult.urdu = translatedText;
      if (toLanguage === 'hindi') onlineResult.hindi = translatedText;
      if (toLanguage === 'russian') onlineResult.russian = translatedText;
      if (toLanguage === 'uzbek') onlineResult.uzbek = translatedText;
      if (toLanguage === 'english') onlineResult.english = translatedText;

      addToHistory(query, onlineResult);
      return onlineResult;
    } catch (error) {
      console.error('Online tarjima xatolik:', error);
      throw error;
    }
  }, [fromLanguage, toLanguage, addToHistory]);

  const getLanguageCode = (lang: Language): string => {
    const codes: Record<Language, string> = {
      english: 'en',
      uzbek: 'uz',
      urdu: 'ur',
      hindi: 'hi',
      russian: 'ru',
    };
    return codes[lang];
  };

  const searchWordWithFallback = useCallback(async (query: string, exactMatchOnly: boolean = false): Promise<VocabularyEntry | null> => {
    console.log(`So'z qidirilmoqda: "${query}"`);
    console.log(`Offline lug'atda so'zlar soni: ${vocabulary.length}`);
    console.log(`Exact match only: ${exactMatchOnly}`);
    
    const offlineResult = searchWord(query, exactMatchOnly);
    
    if (offlineResult) {
      console.log('So\'z offline lug\'atda topildi!');
      return offlineResult;
    }

    console.log('So\'z offline lug\'atda topilmadi');

    if (isOnline && !exactMatchOnly) {
      console.log('Internet mavjud, online tarjima qilinmoqda...');
      try {
        return await translateOnline(query);
      } catch (error) {
        console.error('Online tarjima xatolik:', error);
        return null;
      }
    } else {
      console.log('Internet yo\'q yoki exact match talab qilingan, tarjima qilib bo\'lmadi');
    }

    return null;
  }, [searchWord, translateOnline, isOnline, vocabulary.length]);

  const clearHistory = useCallback(async () => {
    try {
      setHistory([]);
      await AsyncStorage.removeItem(HISTORY_KEY);
    } catch (error) {
      console.error('Error clearing history:', error);
    }
  }, []);

  const toggleFavorite = useCallback(async (wordId: string) => {
    try {
      console.log('Sevimli o\'zgartirish:', wordId);
      setFavorites((prevFavorites) => {
        const updatedFavorites = prevFavorites.includes(wordId)
          ? prevFavorites.filter((id) => id !== wordId)
          : [...prevFavorites, wordId];

        console.log('Yangilangan sevimlilar:', updatedFavorites);
        AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(updatedFavorites)).catch(error => {
          console.error('Error saving favorites:', error);
        });
        return updatedFavorites;
      });
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  }, []);

  const isFavorite = useCallback((wordId: string): boolean => {
    return favorites.includes(wordId);
  }, [favorites]);

  const getFavoriteWords = useCallback((): VocabularyEntry[] => {
    console.log('Sevimlilar soni:', favorites.length);
    const favoriteWords = vocabulary.filter((entry) => favorites.includes(entry.id));
    console.log('Sevimli so\'zlar:', favoriteWords.length);
    return favoriteWords;
  }, [vocabulary, favorites]);

  const swapLanguages = useCallback(() => {
    setFromLanguage(toLanguage);
    setToLanguage(fromLanguage);
  }, [fromLanguage, toLanguage]);

  return useMemo(() => ({
    vocabulary,
    favorites,
    history,
    fromLanguage,
    toLanguage,
    isLoading,
    isOnline,
    searchWord,
    searchWordWithFallback,
    translateOnline,
    addToHistory,
    clearHistory,
    toggleFavorite,
    isFavorite,
    getFavoriteWords,
    setFromLanguage,
    setToLanguage,
    setIsOnline,
    swapLanguages,
  }), [
    vocabulary,
    favorites,
    history,
    fromLanguage,
    toLanguage,
    isLoading,
    isOnline,
    searchWord,
    searchWordWithFallback,
    translateOnline,
    addToHistory,
    clearHistory,
    toggleFavorite,
    isFavorite,
    getFavoriteWords,
    swapLanguages,
  ]);
});
