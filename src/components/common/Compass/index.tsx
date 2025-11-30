import React from 'react';
import { TouchableOpacity, View, Animated } from 'react-native';

import { CompassProps } from './types';
import { styles } from './styles';

const Compass: React.FC<CompassProps> = ({
  bearing,
  onPress,
  visible = true,
}) => {
  if (!visible) {
    return null;
  }

  // Rotate the needle opposite to map bearing to always point north
  const rotation = -bearing;

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View
        style={[
          styles.needle,
          { transform: [{ rotate: `${rotation}deg` }] },
        ]}
      >
        <View style={styles.northIndicator} />
        <View style={styles.southIndicator} />
      </View>
    </TouchableOpacity>
  );
};

export default Compass;
