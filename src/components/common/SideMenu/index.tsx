import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Animated,
  TouchableWithoutFeedback,
} from 'react-native';

import { POICategory } from '../../../types';
import { SideMenuProps } from './types';
import { MENU_WIDTH, POI_CATEGORIES } from './constants';
import { styles } from './styles';

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
