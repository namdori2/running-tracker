const REST_API_KEY = process.env.KAKAO_REST_API_KEY;
const REDIRECT_URI = process.env.KAKAO_REDIRECT_URI;

function getAuthorizeUrl(state) {
  const params = new URLSearchParams({
    client_id: REST_API_KEY,
    redirect_uri: REDIRECT_URI,
    response_type: "code",
    state,
  });
  return `https://kauth.kakao.com/oauth/authorize?${params.toString()}`;
}

async function exchangeCodeForToken(code) {
  const params = new URLSearchParams({
    grant_type: "authorization_code",
    client_id: REST_API_KEY,
    redirect_uri: REDIRECT_URI,
    code,
  });
  const res = await fetch("https://kauth.kakao.com/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded;charset=utf-8" },
    body: params.toString(),
  });
  if (!res.ok) {
    throw new Error(`kakao token exchange failed: ${res.status} ${await res.text()}`);
  }
  return res.json(); // { access_token, ... }
}

async function fetchProfile(accessToken) {
  const res = await fetch("https://kapi.kakao.com/v2/user/me", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    throw new Error(`kakao profile fetch failed: ${res.status} ${await res.text()}`);
  }
  const data = await res.json();
  return {
    providerUserId: String(data.id),
    nickname: data.kakao_account?.profile?.nickname || `러너${data.id}`,
    profileImageUrl: data.kakao_account?.profile?.profile_image_url || null,
  };
}

module.exports = { getAuthorizeUrl, exchangeCodeForToken, fetchProfile };
