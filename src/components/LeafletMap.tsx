import React, { useRef, useEffect, useCallback, forwardRef, useImperativeHandle, useState } from 'react';
import { StyleSheet } from 'react-native';
import { WebView, WebViewMessageEvent } from 'react-native-webview';
import { Coordinates, POI, POICategory } from '../types';

const CATEGORY_COLORS: Record<string, string> = {
  museum: '#9C27B0',
  gallery: '#673AB7',
  park: '#4CAF50',
  garden: '#8BC34A',
  viewpoint: '#FF9800',
  restaurant: '#F44336',
  cafe: '#795548',
  bar: '#E91E63',
  monument: '#607D8B',
  historical: '#3F51B5',
  default: '#2196F3',
};

export interface MapBounds {
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
}

interface LeafletMapProps {
  center: Coordinates;
  zoom?: number;
  pois?: POI[];
  userLocation?: Coordinates | null;
  onMapMove?: (center: Coordinates, zoom: number, bounds: MapBounds) => void;
  onMarkerPress?: (poi: POI) => void;
  onMapReady?: (bounds: MapBounds) => void;
}

export interface LeafletMapRef {
  centerOnLocation: (lat: number, lng: number, zoom?: number) => void;
}

const LeafletMap = forwardRef<LeafletMapRef, LeafletMapProps>(({
  center,
  zoom = 15,
  pois = [],
  userLocation,
  onMapMove,
  onMarkerPress,
  onMapReady,
}, ref) => {
  const webViewRef = useRef<WebView>(null);
  const poisRef = useRef<POI[]>(pois);
  const mapReadyRef = useRef(false);
  const [isMapReady, setIsMapReady] = useState(false);

  // Keep poisRef updated for message handler
  useEffect(() => {
    poisRef.current = pois;
  }, [pois]);

  const getMarkerColor = (category: POICategory): string => {
    return CATEGORY_COLORS[category] || CATEGORY_COLORS.default;
  };

  // Expose methods via ref
  useImperativeHandle(ref, () => ({
    centerOnLocation: (lat: number, lng: number, newZoom?: number) => {
      webViewRef.current?.injectJavaScript(
        `window.setCenter(${lat}, ${lng}, ${newZoom || zoom}); true;`
      );
    },
  }));

  // Generate HTML only once (no pois dependency)
  const generateHTML = useCallback(() => {
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
    }).setView([${center.latitude}, ${center.longitude}], ${zoom});

    L.control.zoom({ position: 'topright' }).addTo(map);

    // OpenStreetMap tiles (free!)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(map);

    var markers = {};
    var userMarker = null;

    // Helper to get bounds
    function getBoundsData() {
      var bounds = map.getBounds();
      return {
        minLat: bounds.getSouth(),
        maxLat: bounds.getNorth(),
        minLng: bounds.getWest(),
        maxLng: bounds.getEast()
      };
    }

    // Map events
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

    // Map ready - send after tiles load
    map.whenReady(function() {
      var bounds = getBoundsData();
      window.ReactNativeWebView.postMessage(JSON.stringify({
        type: 'mapReady',
        bounds: bounds
      }));
    });

    // Functions callable from React Native
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
      // Remove markers that are no longer in the list
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

      // Add new markers
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
  </script>
</body>
</html>
    `;
  }, [center.latitude, center.longitude, zoom]); // Only depend on initial center/zoom

  const handleMessage = (event: WebViewMessageEvent) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);

      switch (data.type) {
        case 'mapReady':
          mapReadyRef.current = true;
          setIsMapReady(true);
          // Immediately update user location when map is ready
          if (userLocation && webViewRef.current) {
            webViewRef.current.injectJavaScript(
              `window.updateUserLocation(${userLocation.latitude}, ${userLocation.longitude}); true;`
            );
          }
          onMapReady?.(data.bounds);
          break;
        case 'mapMove':
          onMapMove?.({ latitude: data.lat, longitude: data.lng }, data.zoom, data.bounds);
          break;
        case 'markerPress':
          const poi = poisRef.current.find((p) => p.id === data.poiId);
          if (poi) {
            onMarkerPress?.(poi);
          }
          break;
      }
    } catch (e) {
      console.error('Error parsing WebView message:', e);
    }
  };

  // Update user location
  useEffect(() => {
    if (userLocation && webViewRef.current && isMapReady) {
      webViewRef.current.injectJavaScript(
        `window.updateUserLocation(${userLocation.latitude}, ${userLocation.longitude}); true;`
      );
    }
  }, [userLocation, isMapReady]);

  // Update POI markers via JavaScript injection (NOT re-rendering WebView)
  useEffect(() => {
    if (webViewRef.current && isMapReady) {
      const poisData = pois.map((poi) => ({
        id: poi.id,
        lat: poi.coordinates.latitude,
        lng: poi.coordinates.longitude,
        color: getMarkerColor(poi.category),
      }));

      webViewRef.current.injectJavaScript(
        `window.updateMarkers(${JSON.stringify(poisData)}); true;`
      );
    }
  }, [pois, isMapReady]);

  return (
    <WebView
      ref={webViewRef}
      style={styles.webview}
      source={{ html: generateHTML() }}
      onMessage={handleMessage}
      javaScriptEnabled
      domStorageEnabled
      startInLoadingState
      scalesPageToFit={false}
      scrollEnabled={false}
      bounces={false}
      overScrollMode="never"
    />
  );
});

export default LeafletMap;

const styles = StyleSheet.create({
  webview: {
    flex: 1,
  },
});
