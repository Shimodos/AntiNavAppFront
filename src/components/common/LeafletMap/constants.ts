import { POICategory } from '../../../types';

export const CATEGORY_COLORS: Record<string, string> = {
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

export const getMarkerColor = (category: POICategory): string => {
  return CATEGORY_COLORS[category] || CATEGORY_COLORS.default;
};
