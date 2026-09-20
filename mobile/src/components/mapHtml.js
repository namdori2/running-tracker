// WebView에 로드할 Leaflet 지도 HTML.
// react-native-webview는 로컬 .html 애셋 번들링이 번거로우므로,
// HTML 전체를 문자열로 인라인해서 source={{ html: MAP_HTML }} 로 넘긴다.
export const MAP_HTML = `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta
      name="viewport"
      content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"
    />
    <link
      rel="stylesheet"
      href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
    />
    <style>
      html,
      body,
      #map {
        height: 100%;
        width: 100%;
        margin: 0;
        padding: 0;
      }
      .current-dot {
        width: 16px;
        height: 16px;
        border-radius: 50%;
        background: #2f6bff;
        border: 3px solid #ffffff;
        box-shadow: 0 0 4px rgba(0, 0, 0, 0.5);
      }
    </style>
  </head>
  <body>
    <div id="map"></div>
    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
    <script>
      var map = L.map("map", { zoomControl: false, attributionControl: false }).setView(
        [37.5665, 126.978],
        16
      );

      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
      }).addTo(map);

      var currentIcon = L.divIcon({
        className: "",
        html: '<div class="current-dot"></div>',
        iconSize: [16, 16],
      });

      var currentMarker = null;
      var routeLine = L.polyline([], { color: "#2f6bff", weight: 5 }).addTo(map);
      var startMarker = null;
      var endMarker = null;

      function post(type, payload) {
        if (window.ReactNativeWebView) {
          window.ReactNativeWebView.postMessage(JSON.stringify({ type: type, payload: payload }));
        }
      }

      window.initLocation = function (lat, lng) {
        var latlng = [lat, lng];
        if (!currentMarker) {
          currentMarker = L.marker(latlng, { icon: currentIcon }).addTo(map);
        } else {
          currentMarker.setLatLng(latlng);
        }
        map.setView(latlng, 17);
      };

      window.updateLocation = function (lat, lng) {
        var latlng = [lat, lng];
        if (!currentMarker) {
          currentMarker = L.marker(latlng, { icon: currentIcon }).addTo(map);
        } else {
          currentMarker.setLatLng(latlng);
        }
      };

      window.addRoutePoint = function (lat, lng) {
        var latlng = [lat, lng];
        routeLine.addLatLng(latlng);
        window.updateLocation(lat, lng);
        map.panTo(latlng, { animate: true });
      };

      window.resetRoute = function () {
        routeLine.setLatLngs([]);
        if (startMarker) {
          map.removeLayer(startMarker);
          startMarker = null;
        }
        if (endMarker) {
          map.removeLayer(endMarker);
          endMarker = null;
        }
      };

      window.drawRoute = function (pointsJson) {
        var points = JSON.parse(pointsJson);
        var latlngs = points.map(function (p) {
          return [p.latitude, p.longitude];
        });
        routeLine.setLatLngs(latlngs);
        if (latlngs.length > 0) {
          if (startMarker) map.removeLayer(startMarker);
          if (endMarker) map.removeLayer(endMarker);
          startMarker = L.circleMarker(latlngs[0], {
            radius: 7,
            color: "#1fa34a",
            fillColor: "#1fa34a",
            fillOpacity: 1,
          }).addTo(map);
          endMarker = L.circleMarker(latlngs[latlngs.length - 1], {
            radius: 7,
            color: "#e53935",
            fillColor: "#e53935",
            fillOpacity: 1,
          }).addTo(map);
          map.fitBounds(routeLine.getBounds(), { padding: [30, 30] });
        }
      };

      post("ready", {});
    </script>
  </body>
</html>
`;
