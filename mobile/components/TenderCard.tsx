import { View, Text, StyleSheet } from "react-native";
import { MatchBadge } from "./MatchBadge";
import { colors, formatPkr, daysUntil } from "../lib/theme";
import type { Tender } from "../lib/api";

/** A matched-tender row (sector tag, match %, title, value, city, days left). */
export function TenderCard({ tender }: { tender: Tender }) {
  const days = daysUntil(tender.closesAt);
  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        <Text style={styles.sector}>{tender.sector.toUpperCase()}</Text>
        <MatchBadge score={tender.match.score} />
      </View>
      <Text style={styles.title} numberOfLines={2}>
        {tender.title}
      </Text>
      <View style={styles.metaRow}>
        <Text style={styles.value}>{formatPkr(tender.valuePkr)}</Text>
        <Text style={styles.meta}>{tender.city}</Text>
        <Text style={[styles.meta, days <= 7 && styles.urgent]}>
          {days >= 0 ? `${days} days left` : "Closed"}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 14,
    marginBottom: 12,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  sector: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.6,
    color: colors.teal2,
  },
  title: { fontSize: 15, fontWeight: "700", color: colors.ink, lineHeight: 20 },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 8,
  },
  value: { fontSize: 13, fontWeight: "700", color: colors.navy },
  meta: { fontSize: 12, color: colors.slate },
  urgent: { color: colors.red, fontWeight: "600" },
});
