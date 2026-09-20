import * as SecureStore from "expo-secure-store";
import * as WebBrowser from "expo-web-browser";
import { API_BASE_URL } from "../config";

const TOKEN_KEY = "run_tracker_token";
const POLL_INTERVAL_MS = 1500;
const POLL_TIMEOUT_MS = 2 * 60 * 1000;

function randomSessionId() {
  return "xxxxxxxxyxxxyxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// 브라우저로 소셜 로그인을 열고, 완료될 때까지 폴링한 뒤 { token, user } 반환
export async function loginWithProvider(provider) {
  const session = randomSessionId();
  const authUrl = `${API_BASE_URL}/auth/${provider}/start?session=${session}`;

  WebBrowser.openBrowserAsync(authUrl);

  const deadline = Date.now() + POLL_TIMEOUT_MS;
  try {
    while (Date.now() < deadline) {
      await sleep(POLL_INTERVAL_MS);
      const res = await fetch(`${API_BASE_URL}/auth/session/${session}`);
      const data = await res.json();

      if (data.status === "done") {
        return { token: data.token, user: data.user };
      }
      if (data.status === "error" || data.status === "not_found") {
        throw new Error("로그인이 취소되었거나 실패했습니다.");
      }
      // status === 'pending' -> 계속 폴링
    }
    throw new Error("로그인 시간이 초과되었습니다. 다시 시도해주세요.");
  } finally {
    WebBrowser.dismissBrowser();
  }
}

export async function saveToken(token) {
  await SecureStore.setItemAsync(TOKEN_KEY, token);
}

export async function getToken() {
  return SecureStore.getItemAsync(TOKEN_KEY);
}

export async function clearToken() {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
}
