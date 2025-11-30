export interface CompassProps {
  bearing: number; // Current map bearing in degrees (0 = north)
  onPress: () => void; // Called when compass is pressed (reset to north)
  visible?: boolean; // Show/hide compass
}
