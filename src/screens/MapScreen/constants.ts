import { POICategory } from '../../types';

export const ROUTE_COLORS = {
  primary: '#2196F3',
  alternative1: '#9C27B0',
  alternative2: '#FF9800',
};

export const ALL_CATEGORIES = Object.values(POICategory);

export const INITIAL_ZOOM = 15;
export const MIN_ZOOM_FOR_POIS = 13;

// Helper to create a geohash-like key for an area
export const getAreaKey = (lat: number, lng: number): string => {
  const latKey = Math.floor(lat * 20) / 20;
  const lngKey = Math.floor(lng * 20) / 20;
  return `${latKey.toFixed(2)}_${lngKey.toFixed(2)}`;
};

// Format duration
export const formatDuration = (seconds: number): string => {
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}h ${mins}m`;
};

// Format distance
export const formatDistance = (meters: number): string => {
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(1)} km`;
};
