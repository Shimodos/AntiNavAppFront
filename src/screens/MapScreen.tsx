import React, { useEffect, useRef, useState, useCallback } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import * as Location from 'expo-location';
import { useAppStore } from '../store';
import { api } from '../api';
import { POI, POICategory, Coordinates } from '../types';
import LeafletMap, { LeafletMapRef, MapBounds } from '../components/LeafletMap';
import SideMenu from '../components/SideMenu';

const ALL_CATEGORIES = Object.values(POICategory);

// Zoom threshold - POIs won't load when zoomed out beyond this level
const INITIAL_ZOOM = 15;
const MIN_ZOOM_FOR_POIS = 13; // Hide POIs when zoomed out too much

// Helper to create a geohash-like key for an area (to track imported regions)
const getAreaKey = (lat: number, lng: number): string => {
  // Round to ~5km grid
  const latKey = Math.floor(lat * 20) / 20;
  const lngKey = Math.floor(lng * 20) / 20;
  return `${latKey.toFixed(2)}_${lngKey.toFixed(2)}`;
};

export default function MapScreen() {
  const mapRef = useRef<LeafletMapRef>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(true);
  const [mapReady, setMapReady] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [currentBounds, setCurrentBounds] = useState<MapBounds | null>(null);
  const [currentZoom, setCurrentZoom] = useState(INITIAL_ZOOM);
  const [isImporting, setIsImporting] = useState(false);
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

  // Reload POIs when categories change (not on bounds change - that's handled by handleMapMove)
  useEffect(() => {
    if (currentBounds && mapReady) {
      loadPOIsForBounds(currentBounds, selectedCategories, currentZoom);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCategories]); // Only trigger on category change

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

  // Load POIs for visible map area, auto-import from OSM if none found
  const loadPOIsForBounds = useCallback(async (bounds: MapBounds, categories: POICategory[], zoom: number) => {
    // Don't load if no categories selected
    if (categories.length === 0) {
      setPOIs([]);
      return;
    }

    // Don't load POIs if zoomed out too much
    if (zoom < MIN_ZOOM_FOR_POIS) {
      setPOIs([]);
      return;
    }

    try {
      setIsLoading(true);

      // Get POIs for bounds
      let newPois = await api.getPOIsByBbox(
        bounds.minLat,
        bounds.maxLat,
        bounds.minLng,
        bounds.maxLng,
        categories,
        200
      );

      // If no POIs found, try to import from OpenStreetMap
      if (newPois.length === 0) {
        const centerLat = (bounds.minLat + bounds.maxLat) / 2;
        const centerLng = (bounds.minLng + bounds.maxLng) / 2;
        const areaKey = getAreaKey(centerLat, centerLng);

        // Only import if we haven't already imported this area
        if (!importedAreasRef.current.has(areaKey)) {
          console.log(`No POIs found, importing from OSM for area: ${areaKey}`);
          setIsImporting(true);

          try {
            // Calculate radius based on bounds (approximate)
            const latDiff = bounds.maxLat - bounds.minLat;
            const lngDiff = bounds.maxLng - bounds.minLng;
            const radiusKm = Math.max(latDiff, lngDiff) * 111 / 2; // ~111km per degree
            const radius = Math.min(Math.max(radiusKm * 1000, 2000), 10000); // 2-10km

            const result = await api.importPOIsFromOSM(centerLat, centerLng, radius);
            console.log(`Imported ${result.count} POIs for area: ${areaKey}`);

            // Retry fetching POIs after import
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
            // Don't retry failed areas for this session
          } finally {
            // Mark area as attempted (even if failed) to prevent repeated requests
            importedAreasRef.current.add(areaKey);
            setIsImporting(false);
          }
        }
      }

      // Replace POIs with ones from current viewport
      setPOIs(newPois);
    } catch (error) {
      console.error('Error loading POIs for bounds:', error);
    } finally {
      setIsLoading(false);
    }
  }, [setPOIs, setIsLoading]);

  // Debounced load on map move
  const handleMapMove = useCallback((center: Coordinates, zoom: number, bounds: MapBounds) => {
    setMapRegion({
      ...center,
      latitudeDelta: 0.02,
      longitudeDelta: 0.02,
    });

    // Save current bounds and zoom for category change reloads
    setCurrentBounds(bounds);
    setCurrentZoom(zoom);

    // Debounce POI loading
    if (loadTimeoutRef.current) {
      clearTimeout(loadTimeoutRef.current);
    }

    loadTimeoutRef.current = setTimeout(() => {
      loadPOIsForBounds(bounds, selectedCategories, zoom);
    }, 500); // Wait 500ms after map stops moving
  }, [setMapRegion, loadPOIsForBounds, selectedCategories]);

  const handleMarkerPress = (poi: POI) => {
    setSelectedPOI(poi);
  };

  const handleMapReady = useCallback((bounds: MapBounds) => {
    setMapReady(true);
    setCurrentBounds(bounds);
    // Don't load POIs initially - wait for category selection
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
        userLocation={currentLocation}
        onMapMove={handleMapMove}
        onMarkerPress={handleMarkerPress}
        onMapReady={handleMapReady}
      />

      {/* Burger Menu Button */}
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

      {/* Side Menu */}
      <SideMenu
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        selectedCategories={selectedCategories}
        onToggleCategory={handleToggleCategory}
        onClearAll={handleClearAllCategories}
        onSelectAll={handleSelectAllCategories}
      />

      {/* My Location Button */}
      <TouchableOpacity
        style={styles.myLocationButton}
        onPress={centerOnCurrentLocation}
      >
        <Text style={styles.myLocationIcon}>📍</Text>
      </TouchableOpacity>

      {/* Loading indicator */}
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="small" color="#2196F3" />
        </View>
      )}

      {/* Importing indicator */}
      {isImporting && (
        <View style={styles.importingOverlay}>
          <ActivityIndicator size="small" color="#4CAF50" />
          <Text style={styles.importingText}>Importing POIs...</Text>
        </View>
      )}

      {/* POI count indicator */}
      <View style={styles.poiCountBadge}>
        <Text style={styles.poiCountText}>
          {currentZoom < MIN_ZOOM_FOR_POIS
            ? 'Zoom in to see POIs'
            : `${pois.length} POI${pois.length !== 1 ? 's' : ''}`}
        </Text>
      </View>

      {/* Selected POI Card */}
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
          <TouchableOpacity style={styles.navigateButton}>
            <Text style={styles.navigateButtonText}>Navigate</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  menuButton: {
    position: 'absolute',
    top: 50,
    left: 16,
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    gap: 4,
  },
  burgerLine: {
    width: 22,
    height: 3,
    backgroundColor: '#333',
    borderRadius: 1.5,
  },
  badge: {
    position: 'absolute',
    top: -6,
    right: -6,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#2196F3',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: 'white',
    fontSize: 11,
    fontWeight: 'bold',
  },
  myLocationButton: {
    position: 'absolute',
    bottom: 200,
    right: 16,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  myLocationIcon: {
    fontSize: 24,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 60,
    alignSelf: 'center',
    backgroundColor: 'white',
    padding: 8,
    borderRadius: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  importingOverlay: {
    position: 'absolute',
    top: 100,
    alignSelf: 'center',
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  importingText: {
    fontSize: 13,
    color: '#4CAF50',
    fontWeight: '500',
  },
  poiCountBadge: {
    position: 'absolute',
    top: 50,
    alignSelf: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  poiCountText: {
    fontSize: 13,
    color: '#666',
    fontWeight: '500',
  },
  poiCard: {
    position: 'absolute',
    bottom: 32,
    left: 16,
    right: 16,
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  closeButton: {
    position: 'absolute',
    top: 8,
    right: 12,
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 24,
    color: '#999',
  },
  poiName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginRight: 32,
  },
  poiCategory: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
    textTransform: 'capitalize',
  },
  poiDescription: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
  },
  poiRating: {
    fontSize: 14,
    marginTop: 8,
    color: '#FF9800',
  },
  navigateButton: {
    backgroundColor: '#2196F3',
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
    alignItems: 'center',
  },
  navigateButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
