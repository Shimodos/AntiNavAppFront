import { POICategory } from '../../../types';

export interface CategoryInfo {
  key: POICategory;
  label: string;
  icon: string;
}

export interface SideMenuProps {
  isOpen: boolean;
  onClose: () => void;
  selectedCategories: POICategory[];
  onToggleCategory: (category: POICategory) => void;
  onClearAll: () => void;
  onSelectAll: () => void;
}
