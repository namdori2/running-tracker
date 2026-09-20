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
import * as Location from "expo-location";
import RunMap from "../components/RunMap";
import LevelBar from "../components/LevelBar";
import { useAuth } from "../context/AuthContext";
import { haversineDistance } from "../utils/geo";
import { formatDistance, formatDuration, formatPace } from "../utils/format";
import { createRun } from "../services/api";

export default function HomeScreen({ navigation }) {
  const { refreshMe } = useAuth();
  const mapRef = useRef(null);
  const pointsRef = useRef([]);
  const watchSubRef = useRef(null);
  const timerRef = useRef(null);
  const startedAtRef = useRef(null);

  const [hasPermission, setHasPermission] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [saving, setSaving] = useState(false);
  const [distance, setDistance] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      setHasPermission(status === "granted");
      if (status === "granted") {
        const pos = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });
        mapRef.current?.initLocation(
          pos.coords.latitude,
          pos.coords.longitude
        );
      }
    })();

    return () => {
      watchSubRef.current?.remove();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  async function handleStart() {
    if (!hasPermission) {
      Alert.alert("위치 권한 필요", "설정에서 위치 권한을 허용해주세요.");
      return;
    }

    pointsRef.current = [];
    setDistance(0);
    setDuration(0);
    mapRef.current?.resetRoute();

    startedAtRef.current = Date.now();
    timerRef.current = setInterval(() => {
      setDuration((Date.now() - startedAtRef.current) / 1000);
    }, 1000);

    watchSubRef.current = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.High,
        timeInterval: 2000,
        distanceInterval: 5,
      },
      (loc) => {
        const point = {
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
          timestamp: loc.timestamp,
        };
        const prev = pointsRef.current;
        if (prev.length > 0) {
          const d = haversineDistance(prev[prev.length - 1], point);
          setDistance((cur) => cur + d);
        }
        pointsRef.current = [...prev, point];
        mapRef.current?.addRoutePoint(point.latitude, point.longitude);
      }
    );

    setIsRunning(true);
  }

  async function handleStop() {
    watchSubRef.current?.remove();
    watchSubRef.current = null;
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setIsRunning(false);

    const points = pointsRef.current;
    if (points.length < 2) {
      Alert.alert("기록 없음", "기록하기엔 이동 거리가 너무 짧아요.");
      return;
    }

    const finalDuration = (Date.now() - startedAtRef.current) / 1000;
    const finalDistance = distance;

    try {
      setSaving(true);
      const run = await createRun({
        startedAt: new Date(startedAtRef.current).toISOString(),
        durationSec: Math.round(finalDuration),
        distanceMeters: Math.round(finalDistance),
        points,
      });
      await refreshMe();
      const bonusText = run.dailyQuestCompleted ? " (일간 퀘스트 +50 XP 포함)" : "";
      Alert.alert(
        "러닝 기록 저장 완료",
        `${formatDistance(finalDistance)} · ${formatDuration(finalDuration)}\n+${run.xpEarned} XP${bonusText}`,
        [
          { text: "확인" },
          {
            text: "기록 보기",
            onPress: () => navigation.navigate("History"),
          },
        ]
      );
    } catch (e) {
      Alert.alert(
        "저장 실패",
        `서버에 저장하지 못했습니다.\n${e.message}\n\n서버 주소(src/config.js)를 확인해주세요.`
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <LevelBar />
      <View style={styles.mapWrap}>
        <RunMap ref={mapRef} />
      </View>

      <View style={styles.statsBar}>
        <Stat label="거리" value={formatDistance(distance)} />
        <Stat label="시간" value={formatDuration(duration)} />
        <Stat label="페이스" value={formatPace(distance, duration)} />
      </View>

      <View style={styles.controls}>
        {hasPermission === false && (
          <Text style={styles.warning}>위치 권한이 필요합니다.</Text>
        )}
        {saving ? (
          <ActivityIndicator size="large" />
        ) : (
          <TouchableOpacity
            style={[styles.button, isRunning ? styles.stopButton : styles.startButton]}
            onPress={isRunning ? handleStop : handleStart}
          >
            <Text style={styles.buttonText}>{isRunning ? "정지" : "시작"}</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={styles.historyLink}
          onPress={() => navigation.navigate("History")}
        >
          <Text style={styles.historyLinkText}>기록 보기</Text>
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
  mapWrap: { flex: 1 },
  statsBar: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 16,
    borderTopWidth: 1,
    borderColor: "#eee",
  },
  stat: { alignItems: "center" },
  statValue: { fontSize: 20, fontWeight: "700", color: "#111" },
  statLabel: { fontSize: 12, color: "#888", marginTop: 2 },
  controls: { alignItems: "center", paddingBottom: 20 },
  warning: { color: "#e53935", marginBottom: 8 },
  button: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  startButton: { backgroundColor: "#2f6bff" },
  stopButton: { backgroundColor: "#e53935" },
  buttonText: { color: "#fff", fontSize: 18, fontWeight: "700" },
  historyLink: { marginTop: 14 },
  historyLinkText: { color: "#2f6bff", fontSize: 14, fontWeight: "600" },
});
