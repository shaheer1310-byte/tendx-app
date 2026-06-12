import { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Zap } from "lucide-react-native";
import { TenderCard } from "../../components/TenderCard";
import { colors, DEMO_FIRST_NAME, API_URL } from "../../lib/theme";
import { fetchDashboard, type DashboardSummary } from "../../lib/api";

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      setError(null);
      setData(await fetchDashboard());
    } catch {
      setError(`Could not reach the API at ${API_URL}.`);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const top = data?.matchedList?.[0];

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      {/* Navy header */}
      <View style={styles.header}>
        <Text style={styles.greeting}>Welcome back, {DEMO_FIRST_NAME}</Text>
        {data ? (
          <Text style={styles.subtitle}>
            {data.matchedDelta} new tenders match you
          </Text>
        ) : (
          <Text style={styles.subtitle}>Loading your matches...</Text>
        )}
      </View>

      <ScrollView
        contentContainerStyle={styles.body}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {error && <Text style={styles.error}>{error}</Text>}
        {!data && !error && (
          <ActivityIndicator color={colors.teal} style={{ marginTop: 40 }} />
        )}

        {/* High-match alert banner */}
        {top && (
          <View style={styles.alert}>
            <Zap color={colors.navy} size={18} />
            <Text style={styles.alertText} numberOfLines={1}>
              {top.title.replace(/^Supply of /, "")} · {top.match.score}% fit
            </Text>
          </View>
        )}

        {data && (
          <>
            <View style={styles.sectionRow}>
              <Text style={styles.sectionTitle}>Matched for you</Text>
              <Pressable onPress={() => router.push("/tenders")}>
                <Text style={styles.seeAll}>See all</Text>
              </Pressable>
            </View>
            {data.matchedList.map((t) => (
              <TenderCard key={t.id} tender={t} />
            ))}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.navy },
  header: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 20 },
  greeting: { color: colors.white, fontSize: 22, fontWeight: "800" },
  subtitle: { color: colors.mint, fontSize: 14, marginTop: 4, fontWeight: "600" },
  body: {
    backgroundColor: colors.bg,
    minHeight: "100%",
    padding: 16,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  alert: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: colors.gold2,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 18,
  },
  alertText: { flex: 1, color: colors.navy, fontWeight: "700", fontSize: 13 },
  sectionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: { fontSize: 16, fontWeight: "800", color: colors.ink },
  seeAll: { fontSize: 13, fontWeight: "700", color: colors.teal2 },
  error: { color: colors.red, fontSize: 13, marginBottom: 12 },
});
