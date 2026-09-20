import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import RunMap from "../components/RunMap";
import { deleteRun, getRun } from "../services/api";
import { formatDate, formatDistance, formatDuration, formatPace } from "../utils/format";

export default function RunDetailScreen({ route, navigation }) {
  const { runId } = route.params;
  const mapRef = useRef(null);
  const [run, setRun] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mapReady, setMapReady] = useState(false);

  useEffect(() => {
    getRun(runId)
      .then(setRun)
      .catch((e) => Alert.alert("불러오기 실패", e.message))
      .finally(() => setLoading(false));
  }, [runId]);

  useEffect(() => {
    if (run && mapReady) {
      mapRef.current?.drawRoute(run.points);
    }
  }, [run, mapReady]);

  function handleDelete() {
    Alert.alert("기록 삭제", "이 러닝 기록을 삭제할까요?", [
      { text: "취소", style: "cancel" },
      {
        text: "삭제",
        style: "destructive",
        onPress: async () => {
          await deleteRun(runId);
          navigation.goBack();
        },
      },
    ]);
  }

  if (loading || !run) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.mapWrap}>
        <RunMap ref={mapRef} onReady={() => setMapReady(true)} />
      </View>
      <View style={styles.info}>
        <Text style={styles.date}>{formatDate(run.startedAt)}</Text>
        <View style={styles.statsRow}>
          <Stat label="거리" value={formatDistance(run.distanceMeters)} />
          <Stat label="시간" value={formatDuration(run.durationSec)} />
          <Stat label="페이스" value={formatPace(run.distanceMeters, run.durationSec)} />
        </View>
        <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
          <Text style={styles.deleteButtonText}>기록 삭제</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

function Stat({ label, value }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  mapWrap: { flex: 1 },
  info: { padding: 16, borderTopWidth: 1, borderColor: "#eee" },
  date: { fontSize: 14, color: "#888", marginBottom: 10 },
  statsRow: { flexDirection: "row", justifyContent: "space-around", marginBottom: 14 },
  stat: { alignItems: "center" },
  statValue: { fontSize: 18, fontWeight: "700", color: "#111" },
  statLabel: { fontSize: 12, color: "#888", marginTop: 2 },
  deleteButton: {
    alignSelf: "center",
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  deleteButtonText: { color: "#e53935", fontWeight: "600" },
});
