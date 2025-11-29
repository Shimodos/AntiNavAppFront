import { Dimensions } from 'react-native';
import { POICategory } from '../../../types';
import { CategoryInfo } from './types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export const MENU_WIDTH = SCREEN_WIDTH * 0.5;

export const POI_CATEGORIES: CategoryInfo[] = [
  { key: POICategory.MUSEUM, label: 'Museums', icon: '🏛️' },
  { key: POICategory.GALLERY, label: 'Galleries', icon: '🖼️' },
  { key: POICategory.HISTORICAL, label: 'Historical', icon: '🏰' },
  { key: POICategory.MONUMENT, label: 'Monuments', icon: '🗿' },
  { key: POICategory.ARCHITECTURE, label: 'Architecture', icon: '🏗️' },
  { key: POICategory.RELIGIOUS, label: 'Religious', icon: '⛪' },
  { key: POICategory.PARK, label: 'Parks', icon: '🌳' },
  { key: POICategory.GARDEN, label: 'Gardens', icon: '🌷' },
  { key: POICategory.VIEWPOINT, label: 'Viewpoints', icon: '🌄' },
  { key: POICategory.BEACH, label: 'Beaches', icon: '🏖️' },
  { key: POICategory.RESTAURANT, label: 'Restaurants', icon: '🍽️' },
  { key: POICategory.CAFE, label: 'Cafes', icon: '☕' },
  { key: POICategory.BAR, label: 'Bars', icon: '🍺' },
  { key: POICategory.BAKERY, label: 'Bakeries', icon: '🥐' },
  { key: POICategory.THEATER, label: 'Theaters', icon: '🎭' },
  { key: POICategory.CINEMA, label: 'Cinemas', icon: '🎬' },
  { key: POICategory.ZOO, label: 'Zoos', icon: '🦁' },
  { key: POICategory.AQUARIUM, label: 'Aquariums', icon: '🐠' },
  { key: POICategory.MARKET, label: 'Markets', icon: '🛒' },
  { key: POICategory.SHOPPING, label: 'Shopping', icon: '🛍️' },
];
