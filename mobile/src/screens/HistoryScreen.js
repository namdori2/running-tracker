import React, { useCallback, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { listRuns } from "../services/api";
import { formatDate, formatDistance, formatDuration, formatPace } from "../utils/format";
import DistanceBarChart from "../components/DistanceBarChart";

export default function HistoryScreen({ navigation }) {
  const [runs, setRuns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      const data = await listRuns();
      setRuns(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" />
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.center}>
        <Text style={styles.errorText}>기록을 불러오지 못했습니다.</Text>
        <Text style={styles.errorDetail}>{error}</Text>
        <Text style={styles.errorDetail}>서버 주소(mobile/src/config.js)를 확인해주세요.</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={runs}
        keyExtractor={(item) => String(item.id)}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              load();
            }}
          />
        }
        ListHeaderComponent={<DistanceBarChart runs={runs} />}
        ListEmptyComponent={
          <View style={styles.center}>
            <Text style={styles.emptyText}>아직 러닝 기록이 없어요.</Text>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.item}
            onPress={() => navigation.navigate("RunDetail", { runId: item.id })}
          >
            <View>
              <Text style={styles.itemDate}>{formatDate(item.startedAt)}</Text>
              <Text style={styles.itemSub}>
                {formatDistance(item.distanceMeters)} · {formatDuration(item.durationSec)} ·{" "}
                {formatPace(item.distanceMeters, item.durationSec)}
              </Text>
            </View>
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  item: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderColor: "#f0f0f0",
  },
  itemDate: { fontSize: 15, fontWeight: "700", color: "#111" },
  itemSub: { fontSize: 13, color: "#777", marginTop: 4 },
  emptyText: { color: "#888" },
  errorText: { color: "#e53935", fontWeight: "700", marginBottom: 6 },
  errorDetail: { color: "#888", fontSize: 12, textAlign: "center" },
});
