import { StyleSheet } from 'react-native';
import { COMPASS_SIZE, COMPASS_ICON_SIZE } from './constants';

export const styles = StyleSheet.create({
  container: {
    width: COMPASS_SIZE,
    height: COMPASS_SIZE,
    borderRadius: COMPASS_SIZE / 2,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  needle: {
    width: COMPASS_ICON_SIZE,
    height: COMPASS_ICON_SIZE,
    justifyContent: 'center',
    alignItems: 'center',
  },
  northIndicator: {
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderBottomWidth: 14,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: '#F44336', // Red for north
  },
  southIndicator: {
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 14,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#9E9E9E', // Gray for south
  },
});
