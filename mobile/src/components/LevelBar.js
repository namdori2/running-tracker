import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useAuth } from "../context/AuthContext";

export default function LevelBar() {
  const { me, logout } = useAuth();
  if (!me) return null;

  const progress =
    me.xpNeededForLevel > 0 ? me.xpIntoLevel / me.xpNeededForLevel : 0;

  return (
    <View style={styles.container}>
      <View style={styles.left}>
        <Text style={styles.level}>Lv.{me.level}</Text>
        <View style={styles.info}>
          <Text style={styles.nickname}>{me.nickname}</Text>
          <View style={styles.barTrack}>
            <View style={[styles.barFill, { width: `${Math.min(progress, 1) * 100}%` }]} />
          </View>
          <Text style={styles.xpText}>
            {me.xpIntoLevel} / {me.xpNeededForLevel} XP
          </Text>
        </View>
      </View>
      <TouchableOpacity onPress={logout}>
        <Text style={styles.logout}>로그아웃</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderColor: "#eee",
  },
  left: { flexDirection: "row", alignItems: "center", flex: 1 },
  level: {
    fontSize: 14,
    fontWeight: "800",
    color: "#fff",
    backgroundColor: "#2f6bff",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    overflow: "hidden",
    marginRight: 10,
  },
  info: { flex: 1 },
  nickname: { fontSize: 13, fontWeight: "700", color: "#111" },
  barTrack: {
    height: 6,
    backgroundColor: "#eee",
    borderRadius: 3,
    marginTop: 4,
    overflow: "hidden",
  },
  barFill: { height: 6, backgroundColor: "#2f6bff" },
  xpText: { fontSize: 10, color: "#999", marginTop: 2 },
  logout: { fontSize: 12, color: "#999", marginLeft: 12 },
});
