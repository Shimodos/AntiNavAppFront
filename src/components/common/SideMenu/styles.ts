import { StyleSheet } from 'react-native';
import { MENU_WIDTH } from './constants';

export const styles = StyleSheet.create({
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
