import React, { useRef, useEffect, useCallback, forwardRef, useImperativeHandle, useState } from 'react';
import { WebView, WebViewMessageEvent } from 'react-native-webview';

import { Coordinates, POI } from '../../../types';
import { LeafletMapProps, LeafletMapRef, RouteDisplay } from './types';
import { getMarkerColor } from './constants';
import { styles } from './styles';
import { generateMapHTML } from './html';

const LeafletMap = forwardRef<LeafletMapRef, LeafletMapProps>(({
  center,
  zoom = 15,
  pois = [],
  routes = [],
  userLocation,
  onMapMove,
  onMarkerPress,
  onRoutePress,
  onMapReady,
}, ref) => {
  const webViewRef = useRef<WebView>(null);
  const poisRef = useRef<POI[]>(pois);
  const routesRef = useRef<RouteDisplay[]>(routes);
  const mapReadyRef = useRef(false);
  const [isMapReady, setIsMapReady] = useState(false);

  // Keep refs updated for message handler
  useEffect(() => {
    poisRef.current = pois;
  }, [pois]);

  useEffect(() => {
    routesRef.current = routes;
  }, [routes]);

  // Expose methods via ref
  useImperativeHandle(ref, () => ({
    centerOnLocation: (lat: number, lng: number, newZoom?: number) => {
      webViewRef.current?.injectJavaScript(
        `window.setCenter(${lat}, ${lng}, ${newZoom || zoom}); true;`
      );
    },
    fitRouteBounds: (coordinates: [number, number][]) => {
      webViewRef.current?.injectJavaScript(
        `window.fitRouteBounds(${JSON.stringify(coordinates)}); true;`
      );
    },
    clearRoutes: () => {
      webViewRef.current?.injectJavaScript(`window.clearRoutes(); true;`);
    },
  }));

  // Generate HTML only once
  const html = useCallback(() => {
    return generateMapHTML(center.latitude, center.longitude, zoom);
  }, [center.latitude, center.longitude, zoom]);

  const handleMessage = (event: WebViewMessageEvent) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);

      switch (data.type) {
        case 'mapReady':
          mapReadyRef.current = true;
          setIsMapReady(true);
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
        case 'routePress':
          onRoutePress?.(data.routeId);
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

  // Update POI markers
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

  // Update routes
  useEffect(() => {
    if (webViewRef.current && isMapReady) {
      const routesData = routes.map((rd) => ({
        id: rd.route.id,
        coordinates: rd.route.geometry.coordinates,
        color: rd.color,
        isSelected: rd.isSelected,
      }));

      webViewRef.current.injectJavaScript(
        `window.updateRoutes(${JSON.stringify(routesData)}); true;`
      );
    }
  }, [routes, isMapReady]);

  return (
    <WebView
      ref={webViewRef}
      style={styles.webview}
      source={{ html: html() }}
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
