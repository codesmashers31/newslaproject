import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  StatusBar,
  TouchableOpacity
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { useColorScheme } from 'nativewind';
import Svg, { Circle } from 'react-native-svg';
import { Video } from 'lucide-react-native';
import API from '../../services/api';

export default function LedgerScreen() {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const primary = '#4F46E5';

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadLedgerData = async () => {
    try {
      const { data: dashboardData } = await API.get('/student/dashboard');
      setData(dashboardData);
    } catch (error: any) {
      console.error('Failed to load ledger data', error?.message);
      if (error?.response?.status === 401) {
        router.replace('/login');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadLedgerData();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadLedgerData();
  };

  if (loading) {
    return (
      <View className="flex-1 bg-[#F8FAFC] items-center justify-center">
        <ActivityIndicator size="large" color={primary} />
      </View>
    );
  }

  // Progress metrics matching the screenshot (or synced with API if available)
  const overallVal = 82;
  const aptiVal = 90;
  const commVal = 68;
  const techVal = 74;

  const radius = 56;
  const strokeWidth = 12;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - overallVal / 100);

  return (
    <SafeAreaView className="flex-1 bg-[#F8FAFC]">
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View className="px-6 py-5 border-b border-[#E2E8F0] bg-white">
        <Text className="text-2xl font-black text-[#0F172A]">My Scorecard</Text>
        <Text className="text-xs text-[#64748B] mt-0.5">Module scores & mock interview progress</Text>
      </View>

      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={primary} />}
        className="flex-1 px-6 py-4"
        showsVerticalScrollIndicator={false}
      >
        
        {/* 1. Centered Circular Progress Ring */}
        <View className="items-center py-6 mb-2">
          <View style={{ width: 132, height: 132, position: 'relative' }}>
            <Svg width={132} height={132}>
              <Circle
                cx={66}
                cy={66}
                r={radius}
                stroke="#EEF2F6"
                strokeWidth={strokeWidth}
                fill="none"
              />
              <Circle
                cx={66}
                cy={66}
                r={radius}
                stroke={primary}
                strokeWidth={strokeWidth}
                fill="none"
                strokeDasharray={`${circumference} ${circumference}`}
                strokeDashoffset={dashOffset}
                strokeLinecap="round"
                transform="rotate(-90 66 66)"
              />
            </Svg>
            <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' }}>
              <Text className="text-3xl font-black text-[#0F172A]">{overallVal}%</Text>
              <Text className="text-[11px] font-semibold text-[#64748B] mt-0.5">Overall</Text>
            </View>
          </View>
          <Text className="text-xs text-[#64748B] mt-4 font-semibold">Updated by trainer after each module</Text>
        </View>

        {/* 2. Horizonal progress bars matching the screenshot design */}
        <View className="space-y-4 mb-8">
          {/* Aptitude Card */}
          <View className="bg-white border border-[#E2E8F0] rounded-3xl p-5 shadow-sm">
            <View className="flex-row justify-between items-center mb-2">
              <Text className="text-sm font-black text-[#0F172A]">Aptitude</Text>
              <Text className="text-xs font-black text-[#4F46E5]">{aptiVal}%</Text>
            </View>
            <View className="h-2 rounded-full bg-[#EEF2F6] mb-2.5 overflow-hidden">
              <View className="h-full rounded-full bg-[#4F46E5]" style={{ width: `${aptiVal}%` }} />
            </View>
            <Text className="text-[10px] font-extrabold text-[#64748B]">9/10 modules • Mock: 8.5/10</Text>
          </View>

          {/* Communication Card */}
          <View className="bg-white border border-[#E2E8F0] rounded-3xl p-5 shadow-sm">
            <View className="flex-row justify-between items-center mb-2">
              <Text className="text-sm font-black text-[#0F172A]">Communication</Text>
              <Text className="text-xs font-black text-[#4F46E5]">{commVal}%</Text>
            </View>
            <View className="h-2 rounded-full bg-[#EEF2F6] mb-2.5 overflow-hidden">
              <View className="h-full rounded-full bg-[#4F46E5]" style={{ width: `${commVal}%` }} />
            </View>
            <Text className="text-[10px] font-extrabold text-[#64748B]">7/10 modules • Mock: 6.0/10</Text>
          </View>

          {/* Technical Card */}
          <View className="bg-white border border-[#E2E8F0] rounded-3xl p-5 shadow-sm">
            <View className="flex-row justify-between items-center mb-2">
              <Text className="text-sm font-black text-[#0F172A]">Technical</Text>
              <Text className="text-xs font-black text-[#4F46E5]">{techVal}%</Text>
            </View>
            <View className="h-2 rounded-full bg-[#EEF2F6] mb-2.5 overflow-hidden">
              <View className="h-full rounded-full bg-[#4F46E5]" style={{ width: `${techVal}%` }} />
            </View>
            <Text className="text-[10px] font-extrabold text-[#64748B]">8/10 modules • Mock: 7.5/10</Text>
          </View>
        </View>

        {/* 3. Mock Interview Updates Section */}
        <View className="mb-10">
          <Text className="text-sm font-black text-[#0F172A] mb-4">Mock Interview Updates</Text>

          <View className="bg-white border border-[#E2E8F0] rounded-3xl overflow-hidden shadow-sm">
            {/* Technical Mock row */}
            <View className="flex-row items-center p-4 border-b border-[#F1F5F9]">
              <View className="p-3 bg-[#F3E8FF] rounded-2xl mr-4">
                <Video size={16} color="#8B5CF6" />
              </View>
              <View className="flex-1">
                <Text className="text-[#0F172A] font-extrabold text-xs">Technical Mock Interview</Text>
                <Text className="text-[10px] text-[#64748B] mt-0.5">Score 7.5/10 • 2 days ago</Text>
              </View>
            </View>

            {/* Comm Mock row */}
            <View className="flex-row items-center p-4">
              <View className="p-3 bg-[#F3E8FF] rounded-2xl mr-4">
                <Video size={16} color="#8B5CF6" />
              </View>
              <View className="flex-1">
                <Text className="text-[#0F172A] font-extrabold text-xs">Communication Mock</Text>
                <Text className="text-[10px] text-[#64748B] mt-0.5">Score 6.0/10 • 5 days ago</Text>
              </View>
            </View>
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}
