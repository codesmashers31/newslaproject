import React, { useEffect, useState } from 'react';
import { View, StyleProp, ViewStyle, LayoutChangeEvent } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import Svg, { Defs, LinearGradient, Stop, Rect } from 'react-native-svg';

/**
 * Shimmering placeholder block, the mobile counterpart of the web `.skeleton`
 * utility. Compose these into screen-shaped skeletons instead of showing an
 * ActivityIndicator while data loads.
 *
 * The sweep is a translucent white gradient (react-native-svg) translated
 * across the block by Reanimated. Both libraries are already dependencies, so
 * this needs no additional packages.
 */

const BASE = '#E2E8F0';
const SWEEP_DURATION = 1600;

type SkeletonProps = {
  width?: number | `${number}%`;
  height?: number;
  radius?: number;
  style?: StyleProp<ViewStyle>;
};

export function Skeleton({ width = '100%', height = 12, radius = 8, style }: SkeletonProps) {
  const progress = useSharedValue(0);
  // The sweep needs a pixel width to travel across, so measure on layout.
  const [measured, setMeasured] = useState(0);

  useEffect(() => {
    progress.value = withRepeat(
      withTiming(1, { duration: SWEEP_DURATION, easing: Easing.linear }),
      -1,
      false
    );
  }, [progress]);

  const sweepStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: -measured + progress.value * (measured * 2) }],
  }));

  const onLayout = (e: LayoutChangeEvent) => {
    const w = e.nativeEvent.layout.width;
    if (w && w !== measured) setMeasured(w);
  };

  return (
    <View
      onLayout={onLayout}
      style={[
        { width, height, borderRadius: radius, backgroundColor: BASE, overflow: 'hidden' },
        style,
      ]}
    >
      {measured > 0 && (
        <Animated.View style={[{ width: measured, height }, sweepStyle]}>
          <Svg width={measured} height={height}>
            <Defs>
              <LinearGradient id="skeletonSweep" x1="0" y1="0" x2="1" y2="0">
                <Stop offset="0" stopColor="#FFFFFF" stopOpacity="0" />
                <Stop offset="0.5" stopColor="#FFFFFF" stopOpacity="0.65" />
                <Stop offset="1" stopColor="#FFFFFF" stopOpacity="0" />
              </LinearGradient>
            </Defs>
            <Rect x="0" y="0" width={measured} height={height} fill="url(#skeletonSweep)" />
          </Svg>
        </Animated.View>
      )}
    </View>
  );
}

/** A few skeleton lines standing in for a paragraph. */
export function SkeletonText({ lines = 3 }: { lines?: number }) {
  return (
    <View style={{ gap: 8 }}>
      {Array.from({ length: lines }).map((_, i) => (
        // Last line runs short, the way real wrapped text does.
        <Skeleton key={i} height={10} width={i === lines - 1 ? '60%' : '100%'} />
      ))}
    </View>
  );
}

/** Card-shaped skeleton matching the standard mobile card. */
export function SkeletonCard({ lines = 2, withIcon = true }: { lines?: number; withIcon?: boolean }) {
  return (
    <View className="bg-white border border-[#E2E8F0] rounded-3xl p-5 shadow-sm">
      <View className="flex-row items-center mb-4" style={{ gap: 12 }}>
        {withIcon && <Skeleton width={44} height={44} radius={14} />}
        <View style={{ flex: 1, gap: 8 }}>
          <Skeleton height={12} width="40%" />
          <Skeleton height={10} width="60%" />
        </View>
      </View>
      {lines > 0 && <SkeletonText lines={lines} />}
    </View>
  );
}

/**
 * Full-screen loading state. `variant` picks a shape roughly matching the
 * screen being loaded so the skeleton does not jump when content arrives.
 */
export function ScreenSkeleton({ variant = 'default' }: { variant?: 'default' | 'form' | 'list' }) {
  if (variant === 'form') {
    return (
      <View className="flex-1 bg-[#F8FAFC] px-6 py-4" style={{ gap: 24 }}>
        <SkeletonCard lines={0} />
        <View className="bg-white border border-[#E2E8F0] rounded-3xl p-6 items-center" style={{ gap: 12 }}>
          <Skeleton width={112} height={112} radius={56} />
          <Skeleton height={14} width="40%" />
          <Skeleton height={10} width="55%" />
        </View>
        {[0, 1].map((i) => (
          <View key={i} className="bg-white border border-[#E2E8F0] rounded-3xl p-5" style={{ gap: 14 }}>
            <Skeleton height={10} width="35%" />
            <Skeleton height={44} radius={14} />
            <Skeleton height={44} radius={14} />
          </View>
        ))}
      </View>
    );
  }

  if (variant === 'list') {
    return (
      <View className="flex-1 bg-[#F8FAFC] px-6 py-4" style={{ gap: 16 }}>
        <SkeletonCard lines={0} />
        {[0, 1, 2, 3].map((i) => (
          <SkeletonCard key={i} lines={1} />
        ))}
      </View>
    );
  }

  return (
    <View className="flex-1 bg-[#F8FAFC] px-6 py-4" style={{ gap: 24 }}>
      <Skeleton height={140} radius={24} />
      <SkeletonCard lines={2} />
      <SkeletonCard lines={1} />
    </View>
  );
}

export default Skeleton;
