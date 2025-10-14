import { useTranslation } from '@/contexts/TranslationContext';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Heart } from 'lucide-react-native';
import React, { useState, useCallback } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';

export default function FavoritesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { getFavoriteWords } = useTranslation();
  const [favoriteWords, setFavoriteWords] = useState(getFavoriteWords());

  useFocusEffect(
    useCallback(() => {
      setFavoriteWords(getFavoriteWords());
    }, [getFavoriteWords])
  );

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#FFD54F', '#FF9800']} style={styles.gradient}>
        <View style={[styles.header, { paddingTop: insets.top + 20 }]}>
          <Text style={styles.headerTitle}>Sevimlilar</Text>
        </View>

        {favoriteWords.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Heart size={64} color="#fff" strokeWidth={1.5} />
            <Text style={styles.emptyTitle}>Sevimlilar bo&apos;sh</Text>
            <Text style={styles.emptySubtitle}>
              Sevimli so&apos;zlaringizni bu yerga qo&apos;shing
            </Text>
          </View>
        ) : (
          <FlatList
            data={favoriteWords}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            numColumns={2}
            renderItem={({ item }) => (
              <Pressable
                style={styles.favoriteItem}
                onPress={() => {
                  router.push({
                    pathname: '/translation-result',
                    params: { wordId: item.id },
                  });
                }}
              >
                <View style={styles.favoriteContent}>
                  <Text style={styles.favoriteEnglish}>{item.english}</Text>
                  <Text style={styles.favoriteUzbek}>{item.uzbek}</Text>
                  <View style={styles.favoriteIcon}>
                    <Heart size={20} color="#FF9800" fill="#FF9800" />
                  </View>
                </View>
              </Pressable>
            )}
          />
        )}
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
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold' as const,
    color: '#fff',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold' as const,
    color: '#fff',
    marginTop: 24,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#fff',
    textAlign: 'center',
    opacity: 0.9,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  favoriteItem: {
    flex: 1,
    margin: 6,
    maxWidth: '47%',
  },
  favoriteContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    minHeight: 120,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  favoriteEnglish: {
    fontSize: 18,
    fontWeight: 'bold' as const,
    color: '#333',
    marginBottom: 8,
  },
  favoriteUzbek: {
    fontSize: 16,
    color: '#FF9800',
    fontWeight: '600' as const,
    marginBottom: 12,
  },
  favoriteIcon: {
    position: 'absolute' as const,
    bottom: 12,
    right: 12,
  },
});
