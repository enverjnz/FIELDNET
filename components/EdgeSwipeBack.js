import React, { useRef, useMemo } from 'react';
import { Animated, PanResponder, Dimensions, StyleSheet } from 'react-native';

const EDGE_WIDTH = 28;
const SWIPE_THRESHOLD = 72;
const { width: SCREEN_WIDTH } = Dimensions.get('window');

/**
 * iOS-style edge swipe: drag from the left screen edge to go back.
 */
export default function EdgeSwipeBack({ onBack, enabled = true, children, style }) {
  const translateX = useRef(new Animated.Value(0)).current;
  const isActive = useRef(false);

  const panResponder = useMemo(
    () => PanResponder.create({
      onStartShouldSetPanResponder: (evt) => {
        if (!enabled || !onBack) return false;
        return evt.nativeEvent.pageX <= EDGE_WIDTH;
      },
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        if (!enabled || !onBack) return false;
        const fromEdge = evt.nativeEvent.pageX <= EDGE_WIDTH + gestureState.dx + 8;
        return fromEdge && gestureState.dx > 10 && Math.abs(gestureState.dy) < 28;
      },
      onPanResponderGrant: () => {
        isActive.current = true;
      },
      onPanResponderMove: (_, gestureState) => {
        if (!isActive.current) return;
        if (gestureState.dx > 0) {
          translateX.setValue(Math.min(gestureState.dx, SCREEN_WIDTH * 0.45));
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        isActive.current = false;
        const shouldGoBack = gestureState.dx > SWIPE_THRESHOLD || gestureState.vx > 0.65;
        if (shouldGoBack) {
          Animated.timing(translateX, {
            toValue: SCREEN_WIDTH,
            duration: 180,
            useNativeDriver: true,
          }).start(() => {
            translateX.setValue(0);
            onBack?.();
          });
          return;
        }
        Animated.spring(translateX, {
          toValue: 0,
          useNativeDriver: true,
          bounciness: 0,
        }).start();
      },
      onPanResponderTerminate: () => {
        isActive.current = false;
        Animated.spring(translateX, {
          toValue: 0,
          useNativeDriver: true,
          bounciness: 0,
        }).start();
      },
    }),
    [enabled, onBack, translateX],
  );

  return (
    <Animated.View
      style={[styles.container, style, { transform: [{ translateX }] }]}
      {...(enabled && onBack ? panResponder.panHandlers : {})}
    >
      {children}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
