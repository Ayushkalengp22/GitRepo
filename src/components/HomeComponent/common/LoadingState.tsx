import React, {useEffect, useRef} from 'react';
import {View, Animated, Text, StyleSheet} from 'react-native';

interface LoadingStateProps {
  message?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  message = 'Loading...',
}) => {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim1 = useRef(new Animated.Value(0.3)).current;
  const fadeAnim2 = useRef(new Animated.Value(0.3)).current;
  const fadeAnim3 = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    // Pulse animation for the main donation icon
    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]),
    );

    // Rotation animation for the surrounding icons
    const rotateAnimation = Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 3000,
        useNativeDriver: true,
      }),
    );

    // Sequential fade animations for dots
    const createFadeAnimation = (animValue: Animated.Value, delay: number) => {
      return Animated.loop(
        Animated.sequence([
          Animated.timing(animValue, {
            toValue: 1,
            duration: 600,
            delay,
            useNativeDriver: true,
          }),
          Animated.timing(animValue, {
            toValue: 0.3,
            duration: 600,
            useNativeDriver: true,
          }),
        ]),
      );
    };

    const fade1 = createFadeAnimation(fadeAnim1, 0);
    const fade2 = createFadeAnimation(fadeAnim2, 200);
    const fade3 = createFadeAnimation(fadeAnim3, 400);

    // Start all animations
    pulseAnimation.start();
    rotateAnimation.start();
    fade1.start();
    fade2.start();
    fade3.start();

    // Cleanup function
    return () => {
      pulseAnimation.stop();
      rotateAnimation.stop();
      fade1.stop();
      fade2.stop();
      fade3.stop();
    };
  }, [pulseAnim, rotateAnim, fadeAnim1, fadeAnim2, fadeAnim3]);

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {/* Main animation container */}
        <View style={styles.animationContainer}>
          {/* Rotating outer icons */}
          <Animated.View
            style={[
              styles.rotatingContainer,
              {
                transform: [{rotate}],
              },
            ]}>
            <Text style={[styles.outerIcon, styles.topIcon]}>💰</Text>
            <Text style={[styles.outerIcon, styles.rightIcon]}>❤️</Text>
            <Text style={[styles.outerIcon, styles.bottomIcon]}>🤝</Text>
            <Text style={[styles.outerIcon, styles.leftIcon]}>📊</Text>
          </Animated.View>

          {/* Pulsing center donation icon */}
          <Animated.View
            style={[
              styles.centerContainer,
              {
                transform: [{scale: pulseAnim}],
              },
            ]}>
            <View style={styles.centerIconWrapper}>
              <Text style={styles.centerIcon}>💝</Text>
            </View>
          </Animated.View>
        </View>

        {/* Loading text */}
        <Text style={styles.text}>{message}</Text>

        {/* Animated dots */}
        <View style={styles.dotsContainer}>
          <Animated.View style={[styles.dot, {opacity: fadeAnim1}]} />
          <Animated.View style={[styles.dot, {opacity: fadeAnim2}]} />
          <Animated.View style={[styles.dot, {opacity: fadeAnim3}]} />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    // backgroundColor: 'rgba(30, 41, 59, 0.8)',
    paddingHorizontal: 32,
    paddingVertical: 32,
    borderRadius: 20,
    // borderWidth: 1,
    // borderColor: 'rgba(100, 116, 139, 0.2)',
  },
  animationContainer: {
    width: 100,
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    position: 'relative',
  },
  rotatingContainer: {
    position: 'absolute',
    width: 100,
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  outerIcon: {
    position: 'absolute',
    fontSize: 18,
  },
  topIcon: {
    top: 0,
    left: '50%',
    marginLeft: -9,
  },
  rightIcon: {
    right: 0,
    top: '50%',
    marginTop: -9,
  },
  bottomIcon: {
    bottom: 0,
    left: '50%',
    marginLeft: -9,
  },
  leftIcon: {
    left: 0,
    top: '50%',
    marginTop: -9,
  },
  centerContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  centerIconWrapper: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(96, 165, 250, 0.15)',
    borderWidth: 2,
    borderColor: 'rgba(96, 165, 250, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerIcon: {
    fontSize: 24,
  },
  text: {
    fontSize: 18,
    fontWeight: '600',
    color: '#E2E8F0',
    marginBottom: 16,
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#60A5FA',
  },
});
