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
  onMapMove?: (center: Coordinates, zoom: number, bounds: MapBounds) => void;
  onMarkerPress?: (poi: POI) => void;
  onRoutePress?: (routeId: string) => void;
  onMapReady?: (bounds: MapBounds) => void;
}

export interface LeafletMapRef {
  centerOnLocation: (lat: number, lng: number, zoom?: number) => void;
  fitRouteBounds: (coordinates: [number, number][]) => void;
  clearRoutes: () => void;
}
