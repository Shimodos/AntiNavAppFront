import { create } from 'zustand';
import { Coordinates, POI, Route, POICategory, TransportMode } from '../types';

interface AppState {
  // Location
  currentLocation: Coordinates | null;
  setCurrentLocation: (location: Coordinates | null) => void;

  // POIs
  pois: POI[];
  selectedPOI: POI | null;
  setPOIs: (pois: POI[]) => void;
  setSelectedPOI: (poi: POI | null) => void;
  addPOIs: (pois: POI[]) => void;

  // Route
  currentRoute: Route | null;
  destination: Coordinates | null;
  isNavigating: boolean;
  setCurrentRoute: (route: Route | null) => void;
  setDestination: (destination: Coordinates | null) => void;
  setIsNavigating: (isNavigating: boolean) => void;

  // Settings
  selectedCategories: POICategory[];
  transportMode: TransportMode;
  adventureLevel: number;
  setSelectedCategories: (categories: POICategory[]) => void;
  setTransportMode: (mode: TransportMode) => void;
  setAdventureLevel: (level: number) => void;

  // UI
  isLoading: boolean;
  error: string | null;
  setIsLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;

  // Map
  mapRegion: {
    latitude: number;
    longitude: number;
    latitudeDelta: number;
    longitudeDelta: number;
  };
  setMapRegion: (region: AppState['mapRegion']) => void;
}

export const useAppStore = create<AppState>((set) => ({
  // Location
  currentLocation: null,
  setCurrentLocation: (location) => set({ currentLocation: location }),

  // POIs
  pois: [],
  selectedPOI: null,
  setPOIs: (pois) => set({ pois }),
  setSelectedPOI: (poi) => set({ selectedPOI: poi }),
  addPOIs: (newPois) =>
    set((state) => {
      const existingIds = new Set(state.pois.map((p) => p.id));
      const uniqueNew = newPois.filter((p) => !existingIds.has(p.id));
      return { pois: [...state.pois, ...uniqueNew] };
    }),

  // Route
  currentRoute: null,
  destination: null,
  isNavigating: false,
  setCurrentRoute: (route) => set({ currentRoute: route }),
  setDestination: (destination) => set({ destination }),
  setIsNavigating: (isNavigating) => set({ isNavigating }),

  // Settings
  selectedCategories: [],
  transportMode: TransportMode.CAR,
  adventureLevel: 0.5,
  setSelectedCategories: (categories) => set({ selectedCategories: categories }),
  setTransportMode: (mode) => set({ transportMode: mode }),
  setAdventureLevel: (level) => set({ adventureLevel: level }),

  // UI
  isLoading: false,
  error: null,
  setIsLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),

  // Map - default to somewhere (will be updated by location)
  mapRegion: {
    latitude: 52.52,
    longitude: 13.405,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  },
  setMapRegion: (region) => set({ mapRegion: region }),
}));
