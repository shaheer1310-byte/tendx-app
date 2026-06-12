import { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { TenderCard } from "../../components/TenderCard";
import { colors, API_URL } from "../../lib/theme";
import { fetchTenders, type Tender } from "../../lib/api";

export default function TendersScreen() {
  const insets = useSafeAreaInsets();
  const [tenders, setTenders] = useState<Tender[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      setTenders(await fetchTenders());
    } catch {
      setError(`Could not reach the API at ${API_URL}.`);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <View style={[styles.screen, { paddingTop: insets.top + 8 }]}>
      <Text style={styles.heading}>Tender Feed</Text>
      {error && <Text style={styles.error}>{error}</Text>}
      {!tenders && !error && (
        <ActivityIndicator color={colors.teal} style={{ marginTop: 40 }} />
      )}
      <FlatList
        data={tenders ?? []}
        keyExtractor={(t) => t.id}
        renderItem={({ item }) => <TenderCard tender={item} />}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg, paddingHorizontal: 16 },
  heading: {
    fontSize: 20,
    fontWeight: "800",
    color: colors.ink,
    marginBottom: 12,
  },
  list: { paddingBottom: 24 },
  error: { color: colors.red, fontSize: 13, marginBottom: 12 },
});
