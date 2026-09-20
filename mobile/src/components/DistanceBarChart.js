import React from "react";
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { formatDate, formatDistance, formatDuration } from "../utils/format";

const BAR_COLOR = "#2f6bff";
const MAX_BAR_HEIGHT = 110;

// 최근 러닝 기록들의 거리를 막대그래프로 시각화 (단일 시리즈 -> 단색, 값은 직접 라벨링)
export default function DistanceBarChart({ runs }) {
  if (!runs || runs.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>아직 기록이 없어요. 첫 러닝을 시작해보세요!</Text>
      </View>
    );
  }

  const chronological = [...runs].reverse();
  const maxDistance = Math.max(...chronological.map((r) => r.distanceMeters), 1);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>최근 거리 추이</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.row}>
          {chronological.map((run) => {
            const height = Math.max(
              6,
              (run.distanceMeters / maxDistance) * MAX_BAR_HEIGHT
            );
            const d = new Date(run.startedAt);
            const label = `${d.getMonth() + 1}/${d.getDate()}`;
            return (
              <TouchableOpacity
                key={run.id}
                style={styles.barItem}
                activeOpacity={0.7}
                onPress={() =>
                  Alert.alert(
                    formatDate(run.startedAt),
                    `${formatDistance(run.distanceMeters)} · ${formatDuration(
                      run.durationSec
                    )}`
                  )
                }
              >
                <Text style={styles.valueLabel}>
                  {(run.distanceMeters / 1000).toFixed(1)}
                </Text>
                <View style={[styles.bar, { height, backgroundColor: BAR_COLOR }]} />
                <Text style={styles.dateLabel}>{label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingVertical: 16, paddingHorizontal: 16 },
  title: { fontSize: 14, fontWeight: "700", color: "#333", marginBottom: 12 },
  row: { flexDirection: "row", alignItems: "flex-end" },
  barItem: { alignItems: "center", marginRight: 14, width: 34 },
  bar: { width: 20, borderRadius: 4 },
  valueLabel: { fontSize: 10, color: "#555", marginBottom: 4 },
  dateLabel: { fontSize: 10, color: "#999", marginTop: 6 },
  empty: { padding: 24, alignItems: "center" },
  emptyText: { color: "#888", fontSize: 13 },
});
