import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';

interface SmoothCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  variant?: 'white' | 'blue' | 'red' | 'amber';
}

export const SmoothCard: React.FC<SmoothCardProps> = ({
  children,
  style,
  variant = 'white',
}) => {
  const getBackgroundColor = () => {
    switch (variant) {
      case 'blue':
        return '#EFF6FF';
      case 'red':
        return '#FEF2F2';
      case 'amber':
        return '#FFFBEB';
      default:
        return '#FFFFFF';
    }
  };

  const getBorderColor = () => {
    switch (variant) {
      case 'blue':
        return '#BFDBFE';
      case 'red':
        return '#FECACA';
      case 'amber':
        return '#FDE68A';
      default:
        return '#E2E8F0';
    }
  };

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: getBackgroundColor(),
          borderColor: getBorderColor(),
        },
        style,
      ]}
    >
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 20,
    marginVertical: 8,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
});
