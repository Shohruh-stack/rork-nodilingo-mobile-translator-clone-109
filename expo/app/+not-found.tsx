import { Link, Stack } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: "Xato!" }} />
      <LinearGradient colors={['#FFD54F', '#FF9800']} style={styles.gradient}>
        <View style={styles.container}>
          <Text style={styles.title}>Bu sahifa topilmadi</Text>

          <Link href="/" style={styles.link}>
            <Text style={styles.linkText}>Bosh sahifaga qaytish</Text>
          </Link>
        </View>
      </LinearGradient>
    </>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold" as const,
    color: "#fff",
    textAlign: "center",
    marginBottom: 20,
  },
  link: {
    backgroundColor: "#fff",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
  },
  linkText: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: "#FF9800",
  },
});
