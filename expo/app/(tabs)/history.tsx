import { useTranslation } from '@/contexts/TranslationContext';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Clock, Trash2 } from 'lucide-react-native';
import React from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function HistoryScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { history, clearHistory } = useTranslation();

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Hozir';
    if (diffMins < 60) return `${diffMins} daqiqa oldin`;
    if (diffHours < 24) return `${diffHours} soat oldin`;
    if (diffDays === 1) return 'Kecha';
    return date.toLocaleDateString('uz-UZ');
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#FFD54F', '#FF9800']} style={styles.gradient}>
        <View style={[styles.header, { paddingTop: insets.top + 20 }]}>
          <Text style={styles.headerTitle}>Tarix</Text>
          {history.length > 0 && (
            <Pressable style={styles.clearButton} onPress={clearHistory}>
              <Trash2 size={24} color="#fff" />
            </Pressable>
          )}
        </View>

        {history.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Clock size={64} color="#fff" strokeWidth={1.5} />
            <Text style={styles.emptyTitle}>Tarix bo&apos;sh</Text>
            <Text style={styles.emptySubtitle}>
              Siz qidirgan so&apos;zlar bu yerda ko&apos;rinadi
            </Text>
          </View>
        ) : (
          <FlatList
            data={history}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => (
              <Pressable
                style={styles.historyItem}
                onPress={() => {
                  router.push({
                    pathname: '/translation-result',
                    params: { wordId: item.result.id },
                  });
                }}
              >
                <View style={styles.historyContent}>
                  <View style={styles.historyWords}>
                    <Text style={styles.historyQuery}>{item.query}</Text>
                    <Text style={styles.historyArrow}>→</Text>
                    <Text style={styles.historyTranslation}>
                      {item.fromLanguage === 'english'
                        ? item.result.uzbek
                        : item.result.english}
                    </Text>
                  </View>
                  <Text style={styles.historyTime}>{formatDate(item.timestamp)}</Text>
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
  clearButton: {
    padding: 8,
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
  historyItem: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  historyContent: {
    gap: 8,
  },
  historyWords: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  historyQuery: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: '#333',
  },
  historyArrow: {
    fontSize: 18,
    color: '#FF9800',
  },
  historyTranslation: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: '#FF9800',
  },
  historyTime: {
    fontSize: 14,
    color: '#999',
  },
});
