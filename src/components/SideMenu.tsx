import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Animated,
  Dimensions,
  TouchableWithoutFeedback,
} from 'react-native';
import { POICategory } from '../types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const MENU_WIDTH = SCREEN_WIDTH * 0.5;

interface CategoryInfo {
  key: POICategory;
  label: string;
  icon: string;
}

const POI_CATEGORIES: CategoryInfo[] = [
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

interface SideMenuProps {
  isOpen: boolean;
  onClose: () => void;
  selectedCategories: POICategory[];
  onToggleCategory: (category: POICategory) => void;
  onClearAll: () => void;
  onSelectAll: () => void;
}

export default function SideMenu({
  isOpen,
  onClose,
  selectedCategories,
  onToggleCategory,
  onClearAll,
  onSelectAll,
}: SideMenuProps) {
  const translateX = React.useRef(new Animated.Value(-MENU_WIDTH)).current;
  const overlayOpacity = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (isOpen) {
      Animated.parallel([
        Animated.timing(translateX, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(overlayOpacity, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(translateX, {
          toValue: -MENU_WIDTH,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(overlayOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const isSelected = (category: POICategory) => selectedCategories.includes(category);

  return (
    <View style={styles.container}>
      <TouchableWithoutFeedback onPress={onClose}>
        <Animated.View style={[styles.overlay, { opacity: overlayOpacity }]} />
      </TouchableWithoutFeedback>

      <Animated.View style={[styles.menu, { transform: [{ translateX }] }]}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>POI Filters</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Text style={styles.closeBtnText}>×</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity style={styles.actionBtn} onPress={onSelectAll}>
            <Text style={styles.actionBtnText}>Select All</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn} onPress={onClearAll}>
            <Text style={styles.actionBtnText}>Clear All</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.selectedCount}>
          {selectedCategories.length} selected
        </Text>

        <ScrollView style={styles.categoriesList} showsVerticalScrollIndicator={false}>
          {POI_CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat.key}
              style={[
                styles.categoryItem,
                isSelected(cat.key) && styles.categoryItemSelected,
              ]}
              onPress={() => onToggleCategory(cat.key)}
            >
              <Text style={styles.categoryIcon}>{cat.icon}</Text>
              <Text
                style={[
                  styles.categoryLabel,
                  isSelected(cat.key) && styles.categoryLabelSelected,
                ]}
              >
                {cat.label}
              </Text>
              {isSelected(cat.key) && (
                <Text style={styles.checkmark}>✓</Text>
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1000,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  menu: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: MENU_WIDTH,
    backgroundColor: '#fff',
    paddingTop: 50,
    elevation: 16,
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  closeBtn: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeBtnText: {
    fontSize: 28,
    color: '#666',
  },
  actions: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 6,
    paddingHorizontal: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 6,
    alignItems: 'center',
  },
  actionBtnText: {
    fontSize: 12,
    color: '#666',
  },
  selectedCount: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    fontSize: 13,
    color: '#888',
  },
  categoriesList: {
    flex: 1,
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  categoryItemSelected: {
    backgroundColor: '#e3f2fd',
  },
  categoryIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  categoryLabel: {
    flex: 1,
    fontSize: 14,
    color: '#333',
  },
  categoryLabelSelected: {
    fontWeight: '600',
    color: '#1976D2',
  },
  checkmark: {
    fontSize: 16,
    color: '#1976D2',
    fontWeight: 'bold',
  },
});
