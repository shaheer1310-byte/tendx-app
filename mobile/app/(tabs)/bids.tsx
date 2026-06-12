import { View, Text, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors } from "../../lib/theme";

/** Placeholder tab; the bid pack lives on web in Phase 2 (Build Spec 6.4). */
export default function BidsScreen() {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <Text style={styles.title}>Bid Generator</Text>
      <Text style={styles.body}>
        Draft and track bids here. The full AI bid pack and PDF export are on the
        web app today; the mobile flow lands in a later phase.
      </Text>
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
  body: { fontSize: 14, color: colors.slate, textAlign: "center", lineHeight: 20 },
});
