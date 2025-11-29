export const generateMapHTML = (lat: number, lng: number, zoom: number): string => {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { width: 100%; height: 100%; overflow: hidden; }
    #map { width: 100%; height: 100%; }
    .custom-marker {
      width: 24px;
      height: 24px;
      border-radius: 50%;
      border: 2px solid white;
      box-shadow: 0 2px 4px rgba(0,0,0,0.3);
    }
    .user-marker {
      width: 16px;
      height: 16px;
      background: #4285F4;
      border-radius: 50%;
      border: 3px solid white;
      box-shadow: 0 2px 6px rgba(66,133,244,0.5);
    }
    .user-marker-pulse {
      width: 40px;
      height: 40px;
      background: rgba(66,133,244,0.2);
      border-radius: 50%;
      position: absolute;
      top: -12px;
      left: -12px;
      animation: pulse 2s infinite;
    }
    @keyframes pulse {
      0% { transform: scale(0.5); opacity: 1; }
      100% { transform: scale(1.5); opacity: 0; }
    }
    .leaflet-control-attribution { font-size: 10px; }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    var map = L.map('map', {
      zoomControl: false,
      attributionControl: true
    }).setView([${lat}, ${lng}], ${zoom});

    L.control.zoom({ position: 'topright' }).addTo(map);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(map);

    var markers = {};
    var userMarker = null;
    var routePolylines = {};
    var destinationMarker = null;

    function getBoundsData() {
      var bounds = map.getBounds();
      return {
        minLat: bounds.getSouth(),
        maxLat: bounds.getNorth(),
        minLng: bounds.getWest(),
        maxLng: bounds.getEast()
      };
    }

    map.on('moveend', function() {
      var center = map.getCenter();
      var bounds = getBoundsData();
      window.ReactNativeWebView.postMessage(JSON.stringify({
        type: 'mapMove',
        lat: center.lat,
        lng: center.lng,
        zoom: map.getZoom(),
        bounds: bounds
      }));
    });

    map.whenReady(function() {
      var bounds = getBoundsData();
      window.ReactNativeWebView.postMessage(JSON.stringify({
        type: 'mapReady',
        bounds: bounds
      }));
    });

    window.setCenter = function(lat, lng, zoom) {
      map.setView([lat, lng], zoom || map.getZoom(), { animate: true });
    };

    window.updateUserLocation = function(lat, lng) {
      if (userMarker) {
        userMarker.setLatLng([lat, lng]);
      } else {
        var userIcon = L.divIcon({
          className: 'user-location',
          html: '<div class="user-marker-pulse"></div><div class="user-marker"></div>',
          iconSize: [16, 16],
          iconAnchor: [8, 8]
        });
        userMarker = L.marker([lat, lng], {
          icon: userIcon,
          zIndexOffset: 1000
        }).addTo(map);
      }
    };

    window.updateMarkers = function(poisData) {
      var newIds = {};
      poisData.forEach(function(poi) {
        newIds[poi.id] = true;
      });

      Object.keys(markers).forEach(function(id) {
        if (!newIds[id]) {
          map.removeLayer(markers[id]);
          delete markers[id];
        }
      });

      poisData.forEach(function(poi) {
        if (!markers[poi.id]) {
          var icon = L.divIcon({
            className: 'marker-container',
            html: '<div class="custom-marker" style="background-color: ' + poi.color + '"></div>',
            iconSize: [24, 24],
            iconAnchor: [12, 12]
          });

          var marker = L.marker([poi.lat, poi.lng], { icon: icon })
            .addTo(map)
            .on('click', function() {
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'markerPress',
                poiId: poi.id
              }));
            });

          markers[poi.id] = marker;
        }
      });
    };

    window.clearMarkers = function() {
      Object.values(markers).forEach(function(marker) {
        map.removeLayer(marker);
      });
      markers = {};
    };

    window.updateRoutes = function(routesData) {
      Object.values(routePolylines).forEach(function(polyline) {
        map.removeLayer(polyline);
      });
      routePolylines = {};

      if (destinationMarker) {
        map.removeLayer(destinationMarker);
        destinationMarker = null;
      }

      if (!routesData || routesData.length === 0) return;

      var sortedRoutes = routesData.slice().sort(function(a, b) {
        return a.isSelected ? 1 : -1;
      });

      sortedRoutes.forEach(function(routeData) {
        var coords = routeData.coordinates.map(function(c) {
          return [c[1], c[0]];
        });

        var polyline = L.polyline(coords, {
          color: routeData.color,
          weight: routeData.isSelected ? 6 : 4,
          opacity: routeData.isSelected ? 1 : 0.6,
          lineCap: 'round',
          lineJoin: 'round'
        }).addTo(map);

        polyline.on('click', function() {
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'routePress',
            routeId: routeData.id
          }));
        });

        routePolylines[routeData.id] = polyline;
      });

      var selectedRoute = routesData.find(function(r) { return r.isSelected; });
      if (selectedRoute && selectedRoute.coordinates.length > 0) {
        var destCoord = selectedRoute.coordinates[selectedRoute.coordinates.length - 1];
        var destIcon = L.divIcon({
          className: 'destination-marker',
          html: '<div style="width:24px;height:24px;background:#F44336;border-radius:50%;border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);"></div>',
          iconSize: [24, 24],
          iconAnchor: [12, 12]
        });
        destinationMarker = L.marker([destCoord[1], destCoord[0]], {
          icon: destIcon,
          zIndexOffset: 900
        }).addTo(map);
      }
    };

    window.clearRoutes = function() {
      Object.values(routePolylines).forEach(function(polyline) {
        map.removeLayer(polyline);
      });
      routePolylines = {};
      if (destinationMarker) {
        map.removeLayer(destinationMarker);
        destinationMarker = null;
      }
    };

    window.fitRouteBounds = function(coordinates) {
      if (!coordinates || coordinates.length === 0) return;
      var bounds = L.latLngBounds(coordinates.map(function(c) {
        return [c[1], c[0]];
      }));
      map.fitBounds(bounds, { padding: [50, 50] });
    };
  </script>
</body>
</html>
  `;
};
