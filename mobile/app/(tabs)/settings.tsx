import { View, Text, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, API_URL } from "../../lib/theme";

/** Placeholder tab; full profile/plan editing lives on web (Build Spec 6.7). */
export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <Text style={styles.title}>Settings</Text>
      <Text style={styles.body}>Connected to the TendX API at:</Text>
      <Text style={styles.api}>{API_URL}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: "center",
    justifyContent: "center",
    padding: 28,
  },
  title: { fontSize: 18, fontWeight: "800", color: colors.ink, marginBottom: 8 },
  body: { fontSize: 14, color: colors.slate, textAlign: "center" },
  api: { fontSize: 13, color: colors.teal2, fontWeight: "700", marginTop: 6 },
});
