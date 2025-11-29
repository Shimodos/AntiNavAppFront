import React, { useEffect, useRef, useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Alert, ScrollView } from 'react-native';
import * as Location from 'expo-location';

import { useAppStore } from '../../store';
import { api } from '../../api';
import { POI, POICategory, Coordinates, Route, TransportMode } from '../../types';
import LeafletMap from '../../components/common/LeafletMap';
import { LeafletMapRef, MapBounds, RouteDisplay } from '../../components/common/LeafletMap/types';
import SideMenu from '../../components/common/SideMenu';

import { styles } from './styles';
import {
  ROUTE_COLORS,
  ALL_CATEGORIES,
  INITIAL_ZOOM,
  MIN_ZOOM_FOR_POIS,
  getAreaKey,
  formatDuration,
  formatDistance,
} from './constants';

export default function MapScreen() {
  const mapRef = useRef<LeafletMapRef>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(true);
  const [mapReady, setMapReady] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [currentBounds, setCurrentBounds] = useState<MapBounds | null>(null);
  const [currentZoom, setCurrentZoom] = useState(INITIAL_ZOOM);
  const [isImporting, setIsImporting] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const [availableRoutes, setAvailableRoutes] = useState<Route[]>([]);
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);
  const loadTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const importedAreasRef = useRef<Set<string>>(new Set());

  const {
    currentLocation,
    setCurrentLocation,
    pois,
    setPOIs,
    selectedPOI,
    setSelectedPOI,
    mapRegion,
    setMapRegion,
    isLoading,
    setIsLoading,
    setError,
    selectedCategories,
    setSelectedCategories,
  } = useAppStore();

  useEffect(() => {
    requestLocationPermission();
    return () => {
      if (loadTimeoutRef.current) {
        clearTimeout(loadTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (currentBounds && mapReady) {
      loadPOIsForBounds(currentBounds, selectedCategories, currentZoom);
    }
  }, [selectedCategories]);

  const requestLocationPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location permission is required for navigation');
        setIsLoadingLocation(false);
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const coords: Coordinates = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };

      setCurrentLocation(coords);
      setMapRegion({
        ...coords,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
      });
    } catch (error) {
      console.error('Error getting location:', error);
      setError('Failed to get location');
    } finally {
      setIsLoadingLocation(false);
    }
  };

  const loadPOIsForBounds = useCallback(async (bounds: MapBounds, categories: POICategory[], zoom: number) => {
    if (categories.length === 0) {
      setPOIs([]);
      return;
    }

    if (zoom < MIN_ZOOM_FOR_POIS) {
      setPOIs([]);
      return;
    }

    try {
      setIsLoading(true);

      let newPois = await api.getPOIsByBbox(
        bounds.minLat,
        bounds.maxLat,
        bounds.minLng,
        bounds.maxLng,
        categories,
        200
      );

      if (newPois.length === 0) {
        const centerLat = (bounds.minLat + bounds.maxLat) / 2;
        const centerLng = (bounds.minLng + bounds.maxLng) / 2;
        const areaKey = getAreaKey(centerLat, centerLng);

        if (!importedAreasRef.current.has(areaKey)) {
          console.log(`No POIs found, importing from OSM for area: ${areaKey}`);
          setIsImporting(true);

          try {
            const latDiff = bounds.maxLat - bounds.minLat;
            const lngDiff = bounds.maxLng - bounds.minLng;
            const radiusKm = Math.max(latDiff, lngDiff) * 111 / 2;
            const radius = Math.min(Math.max(radiusKm * 1000, 2000), 10000);

            const result = await api.importPOIsFromOSM(centerLat, centerLng, radius);
            console.log(`Imported ${result.count} POIs for area: ${areaKey}`);

            newPois = await api.getPOIsByBbox(
              bounds.minLat,
              bounds.maxLat,
              bounds.minLng,
              bounds.maxLng,
              categories,
              200
            );
          } catch (importError) {
            console.error('Error importing POIs from OSM:', importError);
          } finally {
            importedAreasRef.current.add(areaKey);
            setIsImporting(false);
          }
        }
      }

      setPOIs(newPois);
    } catch (error) {
      console.error('Error loading POIs for bounds:', error);
    } finally {
      setIsLoading(false);
    }
  }, [setPOIs, setIsLoading]);

  const handleMapMove = useCallback((center: Coordinates, zoom: number, bounds: MapBounds) => {
    setMapRegion({
      ...center,
      latitudeDelta: 0.02,
      longitudeDelta: 0.02,
    });

    setCurrentBounds(bounds);
    setCurrentZoom(zoom);

    if (loadTimeoutRef.current) {
      clearTimeout(loadTimeoutRef.current);
    }

    loadTimeoutRef.current = setTimeout(() => {
      loadPOIsForBounds(bounds, selectedCategories, zoom);
    }, 500);
  }, [setMapRegion, loadPOIsForBounds, selectedCategories]);

  const handleMarkerPress = (poi: POI) => {
    setSelectedPOI(poi);
  };

  const handleMapReady = useCallback((bounds: MapBounds) => {
    setMapReady(true);
    setCurrentBounds(bounds);
  }, []);

  const centerOnCurrentLocation = () => {
    if (currentLocation && mapRef.current) {
      mapRef.current.centerOnLocation(
        currentLocation.latitude,
        currentLocation.longitude,
        16
      );
    }
  };

  const handleToggleCategory = (category: POICategory) => {
    if (selectedCategories.includes(category)) {
      setSelectedCategories(selectedCategories.filter((c) => c !== category));
    } else {
      setSelectedCategories([...selectedCategories, category]);
    }
  };

  const handleClearAllCategories = () => {
    setSelectedCategories([]);
  };

  const handleSelectAllCategories = () => {
    setSelectedCategories([...ALL_CATEGORIES]);
  };

  const handleNavigate = async () => {
    if (!selectedPOI || !currentLocation) return;

    setIsNavigating(true);
    try {
      const response = await api.createRoute({
        origin: currentLocation,
        destination: selectedPOI.coordinates,
        settings: {
          transportMode: TransportMode.PEDESTRIAN,
          adventureLevel: 0,
          avoidHighways: false,
          avoidTolls: false,
        },
      });

      const allRoutes = [response.route];
      if (response.alternativeRoutes) {
        allRoutes.push(...response.alternativeRoutes);
      }

      setAvailableRoutes(allRoutes);
      setSelectedRouteId(response.route.id);
      setSelectedPOI(null);

      if (response.route.geometry.coordinates.length > 0) {
        mapRef.current?.fitRouteBounds(response.route.geometry.coordinates);
      }
    } catch (error) {
      console.error('Error creating route:', error);
      Alert.alert('Navigation Error', 'Failed to create route. Please try again.');
    } finally {
      setIsNavigating(false);
    }
  };

  const handleRouteSelect = (routeId: string) => {
    setSelectedRouteId(routeId);
    const route = availableRoutes.find(r => r.id === routeId);
    if (route && route.geometry.coordinates.length > 0) {
      mapRef.current?.fitRouteBounds(route.geometry.coordinates);
    }
  };

  const handleCancelNavigation = () => {
    setAvailableRoutes([]);
    setSelectedRouteId(null);
    mapRef.current?.clearRoutes();
  };

  const routeDisplays: RouteDisplay[] = availableRoutes.map((route, index) => ({
    route,
    color: index === 0 ? ROUTE_COLORS.primary :
           index === 1 ? ROUTE_COLORS.alternative1 : ROUTE_COLORS.alternative2,
    isSelected: route.id === selectedRouteId,
  }));

  if (isLoadingLocation || !currentLocation) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={styles.loadingText}>Getting your location...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LeafletMap
        ref={mapRef}
        center={currentLocation}
        zoom={INITIAL_ZOOM}
        pois={pois}
        routes={routeDisplays}
        userLocation={currentLocation}
        onMapMove={handleMapMove}
        onMarkerPress={handleMarkerPress}
        onRoutePress={handleRouteSelect}
        onMapReady={handleMapReady}
      />

      <TouchableOpacity
        style={styles.menuButton}
        onPress={() => setIsMenuOpen(true)}
      >
        <View style={styles.burgerLine} />
        <View style={styles.burgerLine} />
        <View style={styles.burgerLine} />
        {selectedCategories.length > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{selectedCategories.length}</Text>
          </View>
        )}
      </TouchableOpacity>

      <SideMenu
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        selectedCategories={selectedCategories}
        onToggleCategory={handleToggleCategory}
        onClearAll={handleClearAllCategories}
        onSelectAll={handleSelectAllCategories}
      />

      <TouchableOpacity
        style={styles.myLocationButton}
        onPress={centerOnCurrentLocation}
      >
        <Text style={styles.myLocationIcon}>📍</Text>
      </TouchableOpacity>

      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="small" color="#2196F3" />
        </View>
      )}

      {isImporting && (
        <View style={styles.importingOverlay}>
          <ActivityIndicator size="small" color="#4CAF50" />
          <Text style={styles.importingText}>Importing POIs...</Text>
        </View>
      )}

      <View style={styles.poiCountBadge}>
        <Text style={styles.poiCountText}>
          {currentZoom < MIN_ZOOM_FOR_POIS
            ? 'Zoom in to see POIs'
            : `${pois.length} POI${pois.length !== 1 ? 's' : ''}`}
        </Text>
      </View>

      {selectedPOI && (
        <View style={styles.poiCard}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setSelectedPOI(null)}
          >
            <Text style={styles.closeButtonText}>×</Text>
          </TouchableOpacity>
          <Text style={styles.poiName}>{selectedPOI.name}</Text>
          <Text style={styles.poiCategory}>{selectedPOI.category}</Text>
          {selectedPOI.description && (
            <Text style={styles.poiDescription} numberOfLines={2}>
              {selectedPOI.description}
            </Text>
          )}
          {selectedPOI.rating && (
            <Text style={styles.poiRating}>
              Rating: {selectedPOI.rating.toFixed(1)}
            </Text>
          )}
          <TouchableOpacity
            style={[styles.navigateButton, isNavigating && styles.navigateButtonDisabled]}
            onPress={handleNavigate}
            disabled={isNavigating}
          >
            {isNavigating ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Text style={styles.navigateButtonText}>Navigate</Text>
            )}
          </TouchableOpacity>
        </View>
      )}

      {availableRoutes.length > 0 && (
        <View style={styles.routePanel}>
          <View style={styles.routePanelHeader}>
            <Text style={styles.routePanelTitle}>Route Options</Text>
            <TouchableOpacity onPress={handleCancelNavigation}>
              <Text style={styles.cancelButton}>Cancel</Text>
            </TouchableOpacity>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.routeList}>
            {availableRoutes.map((route, index) => (
              <TouchableOpacity
                key={route.id}
                style={[
                  styles.routeOption,
                  route.id === selectedRouteId && styles.routeOptionSelected,
                  { borderColor: index === 0 ? ROUTE_COLORS.primary :
                                 index === 1 ? ROUTE_COLORS.alternative1 : ROUTE_COLORS.alternative2 }
                ]}
                onPress={() => handleRouteSelect(route.id)}
              >
                <Text style={styles.routeOptionLabel}>
                  {index === 0 ? 'Optimal' : `Alt ${index}`}
                </Text>
                <Text style={styles.routeOptionDistance}>
                  {formatDistance(route.distance)}
                </Text>
                <Text style={styles.routeOptionDuration}>
                  {formatDuration(route.duration)}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          <TouchableOpacity style={styles.startNavigationButton}>
            <Text style={styles.startNavigationButtonText}>Start Navigation</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}
