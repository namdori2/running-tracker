# 앵그리러너스 (Run Tracker)

지도와 현재 위치를 불러와 러닝 경로를 기록·시각화하고, 카카오 로그인 + 레벨/XP 게임화 요소를
더한 러닝 앱입니다. 장기 제품 기획은 [CLAUDE.md](CLAUDE.md) 참고.

- `mobile/` — React Native(Expo) 앱. Leaflet(OpenStreetMap) 지도를 WebView에 띄워 실시간 위치와 러닝 경로를 표시합니다.
- `server/` — Node.js + Express + SQLite 백엔드. 카카오 로그인, 러닝 기록, XP/레벨 계산을 담당합니다.

## 1. 서버 실행 및 카카오 로그인 설정

```powershell
cd server
npm install       # 최초 1회
Copy-Item .env.example .env
npm start
```

기본적으로 `http://0.0.0.0:4000` 에서 실행됩니다. 기록은 `server/runs.sqlite` 파일에 저장됩니다.

**카카오 로그인을 쓰려면 `.env` 에 키를 채워야 합니다**:

1. Windows에서 `ipconfig` → PC의 **LAN IP 주소** 확인 (예: `192.168.0.5`)
2. [카카오 개발자 콘솔](https://developers.kakao.com) → 애플리케이션 추가
3. **앱 키 > REST API 키** 복사 → `server/.env` 의 `KAKAO_REST_API_KEY` 에 입력
4. **제품 설정 > 카카오 로그인** 활성화 → **Redirect URI** 에 아래를 정확히 등록:
   ```
   http://<LAN IP>:4000/auth/kakao/callback
   ```
5. `server/.env` 의 `KAKAO_REDIRECT_URI` 도 동일한 값으로 수정
6. `JWT_SECRET` 도 임의의 긴 문자열로 바꿔주세요 (보안용)

> 구글 로그인은 아직 없습니다. 구글 OAuth는 리다이렉트 URI로 보통 `localhost`/HTTPS만 허용해서
> 사설 LAN IP로는 등록이 막힐 수 있습니다 (ngrok 등 HTTPS 터널 필요, 추후 과제). 자세한 내용은
> [CLAUDE.md](CLAUDE.md)의 "결정된 사항" 참고.

## 2. 모바일 앱에 서버 주소 연결

휴대폰(Expo Go 앱)은 PC와 같은 Wi-Fi에 연결되어 있어야 하며, PC의 **LAN IP 주소**로 접속해야 합니다.

1. Windows에서 `ipconfig` 실행 → "IPv4 주소" 확인 (예: `192.168.0.5`)
2. `mobile/src/config.js` 파일의 `API_BASE_URL` 을 해당 IP로 수정:
   ```js
   export const API_BASE_URL = "http://192.168.0.5:4000";
   ```
   - Android 에뮬레이터를 쓴다면 `http://10.0.2.2:4000` 사용
   - PC 방화벽이 4000번 포트를 막고 있다면 인바운드 규칙을 허용해야 합니다.

## 3. 모바일 앱 실행

```powershell
cd mobile
npm install       # 최초 1회
npm start
```

터미널에 뜨는 QR 코드를 휴대폰의 **Expo Go** 앱(App Store/Play Store에서 설치)으로 스캔하면 앱이 실행됩니다.

## 주요 기능

- **로그인 화면**: 카카오 로그인 (앱 → 브라우저 오픈 → 서버가 OAuth 처리 → 앱이 폴링해서 로그인 완료 감지)
- **홈 화면**: 로그인한 유저의 레벨/XP 바 표시, 현재 위치를 지도에 표시, "시작" 버튼으로 러닝 기록 시작 → 실시간 경로/거리/시간/페이스 표시 → "정지"로 종료 및 서버 저장 (XP 획득)
- **기록 화면**: 저장된 러닝 기록 목록 + 최근 거리 추이 막대그래프
- **상세 화면**: 특정 러닝의 전체 경로를 지도에 다시 그려서 확인(리플레이), 기록 삭제

## XP / 레벨 규칙

- 러닝 1회 완료 시 `거리(km) × 10 + 시간(분) × 1` XP 획득
- 하루 첫 러닝은 "일간 퀘스트" 보너스 +50 XP
- 레벨업 임계값(누적 XP): `100 × 레벨²`

## 기술 스택

- 지도: Leaflet.js + OpenStreetMap 타일 (무료, API 키 불필요), `react-native-webview`로 임베드
- 위치: `expo-location` (foreground 권한, `watchPositionAsync`)
- 내비게이션: `@react-navigation/native` (native-stack)
- 인증: 카카오 OAuth2 (서버가 처리) + JWT (`expo-secure-store`에 저장) + `expo-web-browser`
- 백엔드: Express + `better-sqlite3` + `jsonwebtoken`
