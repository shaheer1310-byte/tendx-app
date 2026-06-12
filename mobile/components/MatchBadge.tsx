import { View, Text, StyleSheet } from "react-native";
import { matchColor } from "../lib/theme";

/** Compact match-score pill, mirroring the web MatchScoreChip. */
export function MatchBadge({ score }: { score: number }) {
  const color = matchColor(score);
  return (
    <View style={[styles.pill, { backgroundColor: color + "1A", borderColor: color }]}>
      <Text style={[styles.text, { color }]}>{score}%</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  text: { fontSize: 13, fontWeight: "700" },
});
