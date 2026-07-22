import React, { useEffect, useState } from 'react';
import { View, StyleProp, ViewStyle, LayoutChangeEvent, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
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
 * Full-screen loading state. `variant` picks a shape matching the screen
 * layout exactly to ensure zero visual jump or shift on load.
 */
export function ScreenSkeleton({ variant = 'dashboard' }: { variant?: 'dashboard' | 'career' | 'scorecard' | 'profile' | 'training' | 'default' | 'form' | 'list' }) {
  
  // 1. Dashboard Home Screen Skeleton
  if (variant === 'dashboard' || variant === 'default') {
    return (
      <SafeAreaView className="flex-1 bg-[#F8FAFC]">
        {/* Top Header Row Replica */}
        <View className="flex-row justify-between items-center px-8 py-4 border-b border-[#E2E8F0] bg-white shadow-sm">
          <Skeleton width={52} height={52} radius={16} />
          <Skeleton width={40} height={40} radius={12} />
        </View>

        <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
          {/* BannerCarousel Mock */}
          <View className="px-6 mt-4">
            <Skeleton height={140} radius={24} style={{ marginBottom: 16 }} />

            {/* Welcoming Header Banner Mock */}
            <View className="bg-white border border-[#E2E8F0] rounded-3xl p-6 shadow-sm mb-6 flex-row items-center justify-between">
              <View className="flex-1 pr-4" style={{ gap: 8 }}>
                <Skeleton height={8} width="30%" />
                <Skeleton height={20} width="70%" />
                <Skeleton height={10} width="90%" />
              </View>
              <Skeleton width={56} height={56} radius={28} />
            </View>

            {/* Today's Roll Call Check-in Card Mock */}
            <View className="bg-white border border-[#E2E8F0] rounded-3xl p-5 shadow-sm mb-6">
              <View className="flex-row items-center justify-between mb-4">
                <View className="flex-row items-center" style={{ gap: 12 }}>
                  <Skeleton width={40} height={40} radius={12} />
                  <View style={{ gap: 6 }}>
                    <Skeleton height={12} width={150} />
                    <Skeleton height={8} width={100} />
                  </View>
                </View>
                <Skeleton height={10} width={60} />
              </View>
              <Skeleton height={80} radius={16} />
            </View>

            {/* Module Progress Rings Mock */}
            <View className="bg-white border border-[#E2E8F0] rounded-3xl p-5 shadow-sm mb-6">
              <Skeleton height={12} width="40%" style={{ marginBottom: 16 }} />
              <View className="flex-row justify-between">
                {[0, 1, 2].map((i) => (
                  <View key={i} className="items-center" style={{ gap: 8 }}>
                    <Skeleton width={72} height={72} radius={36} />
                    <Skeleton height={8} width={50} />
                  </View>
                ))}
              </View>
            </View>

            {/* Assigned Cohorts header & list */}
            <Skeleton height={10} width="50%" style={{ marginBottom: 16, marginTop: 8 }} />
            {[0, 1, 2].map((i) => (
              <View key={i} className="bg-white border border-[#E2E8F0] rounded-3xl p-5 shadow-sm mb-4" style={{ gap: 12 }}>
                <View className="flex-row items-center" style={{ gap: 12 }}>
                  <Skeleton width={40} height={40} radius={12} />
                  <View style={{ gap: 6 }}>
                    <Skeleton height={12} width={120} />
                    <Skeleton height={8} width={80} />
                  </View>
                </View>
                <View className="border-t border-[#F1F5F9] pt-3" style={{ gap: 10 }}>
                  <View className="flex-row justify-between"><Skeleton height={10} width="35%" /><Skeleton height={10} width="45%" /></View>
                  <View className="flex-row justify-between"><Skeleton height={10} width="35%" /><Skeleton height={10} width="40%" /></View>
                </View>
              </View>
            ))}
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // 2. Career Screen Skeleton
  if (variant === 'career' || variant === 'list') {
    return (
      <SafeAreaView className="flex-1 bg-[#F8FAFC]">
        {/* Header Bar */}
        <View className="px-6 py-5 border-b border-[#E2E8F0] bg-white flex-row items-center" style={{ gap: 14 }}>
          <Skeleton width={40} height={40} radius={12} />
          <View style={{ gap: 6 }}>
            <Skeleton height={18} width={140} />
            <Skeleton height={10} width={220} />
          </View>
        </View>

        <ScrollView className="flex-1 px-6 py-4" showsVerticalScrollIndicator={false}>
          {/* Announcement Mock */}
          <View className="bg-slate-350 border border-slate-400 rounded-3xl p-5 mb-6" style={{ gap: 12 }}>
            <Skeleton height={8} width="25%" />
            <Skeleton height={20} width="80%" />
            <Skeleton height={10} width="95%" />
            <View className="border-t border-[#F1F5F9]/30 pt-3 flex-row justify-between">
              <View style={{ gap: 4 }}><Skeleton height={8} width={100} /><Skeleton height={12} width={80} /></View>
              <Skeleton width={90} height={32} radius={10} />
            </View>
          </View>

          {/* AI Tools Header + 6 Cards Grid */}
          <Skeleton height={16} width="45%" style={{ marginBottom: 16 }} />
          <View className="flex-row flex-wrap justify-between gap-y-4 mb-6">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <View key={i} className="bg-white border border-[#E2E8F0] rounded-3xl p-4 shadow-sm items-center min-h-[142px]" style={{ width: '48%', gap: 10 }}>
                <Skeleton width={40} height={40} radius={16} />
                <Skeleton height={10} width="70%" />
                <Skeleton height={8} width="90%" />
                <Skeleton width={70} height={16} radius={8} />
              </View>
            ))}
          </View>

          {/* Placed Students Horizontal List */}
          <Skeleton height={16} width="55%" style={{ marginBottom: 16 }} />
          <View className="flex-row mb-6" style={{ gap: 16 }}>
            {[0, 1].map((i) => (
              <View key={i} className="bg-white border border-[#E2E8F0] rounded-3xl p-4 shadow-sm min-w-[200px]" style={{ gap: 12 }}>
                <View className="flex-row items-center" style={{ gap: 10 }}>
                  <Skeleton width={36} height={36} radius={18} />
                  <View style={{ gap: 6 }}><Skeleton height={10} width={80} /><Skeleton height={8} width={100} /></View>
                </View>
                <View className="border-t border-[#F1F5F9] pt-2.5 flex-row justify-between">
                  <View style={{ gap: 4 }}><Skeleton height={6} width={40} /><Skeleton height={10} width={50} /></View>
                  <View style={{ gap: 4 }}><Skeleton height={6} width={40} /><Skeleton height={10} width={60} /></View>
                </View>
              </View>
            ))}
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // 3. Scorecard / Ledger Screen Skeleton
  if (variant === 'scorecard') {
    return (
      <SafeAreaView className="flex-1 bg-[#F8FAFC]">
        {/* Header Bar */}
        <View className="px-6 py-5 border-b border-[#E2E8F0] bg-white flex-row items-center" style={{ gap: 14 }}>
          <Skeleton width={40} height={40} radius={12} />
          <View style={{ gap: 6 }}>
            <Skeleton height={18} width={150} />
            <Skeleton height={10} width={240} />
          </View>
        </View>

        <ScrollView className="flex-1 px-6 py-4" showsVerticalScrollIndicator={false}>
          {/* Progress Ring Circular Card */}
          <View className="bg-white border border-[#E2E8F0] rounded-3xl p-6 items-center mb-6 shadow-sm" style={{ gap: 16 }}>
            <Skeleton width={132} height={132} radius={66} />
            <Skeleton height={8} width="60%" />
          </View>

          {/* 3 Progress Cards */}
          <View style={{ gap: 16 }} className="mb-6">
            {[0, 1, 2].map((i) => (
              <View key={i} className="bg-white border border-[#E2E8F0] rounded-3xl p-5 shadow-sm" style={{ gap: 12 }}>
                <View className="flex-row justify-between items-center">
                  <View className="flex-row items-center" style={{ gap: 10 }}>
                    <Skeleton width={32} height={32} radius={10} />
                    <Skeleton height={12} width={100} />
                  </View>
                  <Skeleton height={12} width={40} />
                </View>
                <Skeleton height={8} radius={4} />
                <Skeleton height={8} width="60%" />
              </View>
            ))}
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // 4. Edit Profile Screen Skeleton
  if (variant === 'profile' || variant === 'form') {
    return (
      <SafeAreaView className="flex-1 bg-[#F8FAFC]">
        {/* Header Bar */}
        <View className="px-6 py-5 border-b border-[#E2E8F0] bg-white flex-row justify-between items-center">
          <View className="flex-row items-center" style={{ gap: 14 }}>
            <Skeleton width={40} height={40} radius={12} />
            <View style={{ gap: 6 }}>
              <Skeleton height={18} width={120} />
              <Skeleton height={10} width={180} />
            </View>
          </View>
          <Skeleton width={76} height={36} radius={10} />
        </View>

        <ScrollView className="flex-1 px-6 py-4" showsVerticalScrollIndicator={false}>
          {/* Avatar Picture Card */}
          <View className="bg-white border border-[#E2E8F0] rounded-3xl p-6 items-center mb-6 shadow-sm" style={{ gap: 12 }}>
            <Skeleton width={112} height={112} radius={56} />
            <Skeleton height={14} width="40%" />
            <Skeleton height={10} width="60%" />
          </View>

          {/* Form Rows */}
          <View style={{ gap: 20 }} className="mb-10">
            {[0, 1, 2, 3, 4].map((i) => (
              <View key={i} style={{ gap: 8 }}>
                <Skeleton height={8} width="30%" />
                <Skeleton height={44} radius={14} />
              </View>
            ))}
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // 5. My Training Screen Skeleton
  if (variant === 'training') {
    return (
      <SafeAreaView className="flex-1 bg-[#F8FAFC]">
        {/* Header Bar */}
        <View className="px-6 py-5 border-b border-[#E2E8F0] bg-white flex-row items-center" style={{ gap: 14 }}>
          <Skeleton width={40} height={40} radius={12} />
          <View style={{ gap: 6 }}>
            <Skeleton height={18} width={130} />
            <Skeleton height={10} width={200} />
          </View>
        </View>

        <ScrollView className="flex-1 px-6 py-4" showsVerticalScrollIndicator={false}>
          <Skeleton height={10} width="50%" style={{ marginBottom: 16, marginTop: 8 }} />

          {/* 3 Training Cards (Tech, Comm, Apti) */}
          {[0, 1, 2].map((i) => (
            <View key={i} className="bg-white border border-[#E2E8F0] rounded-3xl p-5 shadow-sm mb-4" style={{ gap: 14 }}>
              <View className="flex-row justify-between items-center">
                <Skeleton height={12} width="45%" />
                <Skeleton width={68} height={28} radius={10} />
              </View>
              <View className="space-y-4 pt-1" style={{ gap: 12 }}>
                <View><Skeleton height={8} width="30%" /><Skeleton height={10} width="50%" style={{ marginTop: 6 }} /></View>
                <View className="border-t border-[#F1F5F9] pt-3"><Skeleton height={8} width="30%" /><Skeleton height={10} width="60%" style={{ marginTop: 6 }} /></View>
                <View className="border-t border-[#F1F5F9] pt-3"><Skeleton height={8} width="30%" /><Skeleton height={10} width="70%" style={{ marginTop: 6 }} /></View>
              </View>
            </View>
          ))}
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Fallback default
  return (
    <SafeAreaView className="flex-1 bg-[#F8FAFC] px-6 py-4" style={{ gap: 24 }}>
      <Skeleton height={140} radius={24} />
      <SkeletonCard lines={2} />
      <SkeletonCard lines={1} />
    </SafeAreaView>
  );
}

export default Skeleton;
