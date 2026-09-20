import React, { forwardRef, useImperativeHandle, useRef } from "react";
import { StyleSheet, View } from "react-native";
import { WebView } from "react-native-webview";
import { MAP_HTML } from "./mapHtml";

// 명령형 API를 노출하는 Leaflet 지도 래퍼.
// ref.current.initLocation(lat, lng) / addRoutePoint(lat, lng) / resetRoute() / drawRoute(points)
const RunMap = forwardRef(function RunMap({ onReady }, ref) {
  const webViewRef = useRef(null);

  function run(js) {
    webViewRef.current?.injectJavaScript(`${js}; true;`);
  }

  useImperativeHandle(ref, () => ({
    initLocation(lat, lng) {
      run(`window.initLocation(${lat}, ${lng})`);
    },
    updateLocation(lat, lng) {
      run(`window.updateLocation(${lat}, ${lng})`);
    },
    addRoutePoint(lat, lng) {
      run(`window.addRoutePoint(${lat}, ${lng})`);
    },
    resetRoute() {
      run(`window.resetRoute()`);
    },
    drawRoute(points) {
      run(`window.drawRoute(${JSON.stringify(JSON.stringify(points))})`);
    },
  }));

  function handleMessage(event) {
    try {
      const msg = JSON.parse(event.nativeEvent.data);
      if (msg.type === "ready") onReady?.();
    } catch {
      // ignore malformed messages
    }
  }

  return (
    <View style={styles.container}>
      <WebView
        ref={webViewRef}
        originWhitelist={["*"]}
        source={{ html: MAP_HTML }}
        style={styles.webview}
        javaScriptEnabled
        domStorageEnabled
        geolocationEnabled
        onMessage={handleMessage}
      />
    </View>
  );
});

export default RunMap;

const styles = StyleSheet.create({
  container: { flex: 1 },
  webview: { flex: 1 },
});
