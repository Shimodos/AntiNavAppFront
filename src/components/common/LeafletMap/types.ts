import { Coordinates, POI, Route } from '../../../types';

export interface MapBounds {
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
}

export interface RouteDisplay {
  route: Route;
  color: string;
  isSelected: boolean;
}

export interface LeafletMapProps {
  center: Coordinates;
  zoom?: number;
  pois?: POI[];
  routes?: RouteDisplay[];
  userLocation?: Coordinates | null;
  userHeading?: number | null; // Direction user is facing (degrees, 0 = north)
  isNavigating?: boolean; // Navigation mode active
  mapBearing?: number; // Map rotation (degrees, 0 = north up)
  onMapMove?: (center: Coordinates, zoom: number, bounds: MapBounds) => void;
  onMarkerPress?: (poi: POI) => void;
  onRoutePress?: (routeId: string) => void;
  onMapReady?: (bounds: MapBounds) => void;
  onBearingChange?: (bearing: number) => void; // Called when user rotates map
}

export interface LeafletMapRef {
  centerOnLocation: (lat: number, lng: number, zoom?: number) => void;
  fitRouteBounds: (coordinates: [number, number][]) => void;
  clearRoutes: () => void;
  setBearing: (bearing: number) => void; // Set map rotation
  setNavigationView: (lat: number, lng: number, heading: number, zoom?: number) => void;
}
