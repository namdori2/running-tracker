import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useAuth } from "../context/AuthContext";

export default function LoginScreen() {
  const { login } = useAuth();
  const [loggingIn, setLoggingIn] = useState(false);

  async function handleLogin(provider) {
    try {
      setLoggingIn(true);
      await login(provider);
    } catch (e) {
      Alert.alert("로그인 실패", e.message);
    } finally {
      setLoggingIn(false);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.center}>
        <Text style={styles.title}>앵그리러너스</Text>
        <Text style={styles.subtitle}>뛰고, 레벨업하고, 랭킹에 도전하세요</Text>

        {loggingIn ? (
          <ActivityIndicator size="large" style={{ marginTop: 40 }} />
        ) : (
          <TouchableOpacity
            style={styles.kakaoButton}
            onPress={() => handleLogin("kakao")}
          >
            <Text style={styles.kakaoButtonText}>카카오로 시작하기</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  title: { fontSize: 28, fontWeight: "800", color: "#111" },
  subtitle: { fontSize: 14, color: "#888", marginTop: 8, marginBottom: 48 },
  kakaoButton: {
    backgroundColor: "#FEE500",
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 8,
    width: "100%",
    alignItems: "center",
  },
  kakaoButtonText: { color: "#191919", fontSize: 16, fontWeight: "700" },
});
