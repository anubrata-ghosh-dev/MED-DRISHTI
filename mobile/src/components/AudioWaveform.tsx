import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet } from 'react-native';

interface AudioWaveformProps {
  isRecording: boolean;
}

export const AudioWaveform: React.FC<AudioWaveformProps> = ({ isRecording }) => {
  const anim1 = useRef(new Animated.Value(15)).current;
  const anim2 = useRef(new Animated.Value(25)).current;
  const anim3 = useRef(new Animated.Value(40)).current;
  const anim4 = useRef(new Animated.Value(20)).current;
  const anim5 = useRef(new Animated.Value(15)).current;

  useEffect(() => {
    if (isRecording) {
      const createPulse = (anim: Animated.Value, maxVal: number) => {
        return Animated.loop(
          Animated.sequence([
            Animated.timing(anim, {
              toValue: maxVal,
              duration: 300 + Math.random() * 200,
              useNativeDriver: false,
            }),
            Animated.timing(anim, {
              toValue: 12,
              duration: 300 + Math.random() * 200,
              useNativeDriver: false,
            }),
          ])
        );
      };

      const pulses = [
        createPulse(anim1, 35),
        createPulse(anim2, 50),
        createPulse(anim3, 65),
        createPulse(anim4, 45),
        createPulse(anim5, 30),
      ];

      pulses.forEach((p) => p.start());
      return () => pulses.forEach((p) => p.stop());
    } else {
      anim1.setValue(15);
      anim2.setValue(20);
      anim3.setValue(25);
      anim4.setValue(18);
      anim5.setValue(15);
    }
  }, [isRecording]);

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.bar, { height: anim1 }]} />
      <Animated.View style={[styles.bar, { height: anim2 }]} />
      <Animated.View style={[styles.bar, { height: anim3, backgroundColor: '#DC2626' }]} />
      <Animated.View style={[styles.bar, { height: anim4 }]} />
      <Animated.View style={[styles.bar, { height: anim5 }]} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 80,
    gap: 6,
  },
  bar: {
    width: 8,
    backgroundColor: '#2563EB',
    borderRadius: 4,
  },
});
