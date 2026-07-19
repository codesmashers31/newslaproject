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
import Svg, { Circle } from 'react-native-svg';
import { Video, Code2, MessageSquare, Brain } from 'lucide-react-native';
import API from '../../services/api';

export default function LedgerScreen() {
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

  // Helper to count modules
  const getModuleCounts = (list: any[] | undefined) => {
    const arr = list || [];
    const completed = arr.filter((s) => s.status === 'Completed').length;
    return { completed, total: arr.length || 10 };
  };

  const scorecards = data?.scorecards || {};
  const aptCount = getModuleCounts(scorecards.aptitude);
  const commCount = getModuleCounts(scorecards.communication);
  const techCount = getModuleCounts(scorecards.technical);

  // Dynamic values from backend API
  const overallVal = data?.progress?.overall ?? 0;
  const aptiVal = data?.progress?.aptitude ?? 0;
  const commVal = data?.progress?.communication ?? 0;
  const techVal = data?.progress?.technical ?? 0;

  const aptMock = data?.calculatedScores?.aptitudeScore ?? 0;
  const commMock = data?.calculatedScores?.communicationScore ?? 0;
  const techMock = data?.calculatedScores?.technicalScore ?? 0;

  const radius = 56;
  const strokeWidth = 12;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - overallVal / 100);

  const placement = data?.placement || {};

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
        
        {/* 1. Elevated circular progress card */}
        <View className="bg-white border border-[#E2E8F0] rounded-3xl p-6 items-center mb-6 shadow-sm">
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
              <Text className="text-[10px] font-black text-[#64748B] uppercase tracking-wider mt-0.5">Overall</Text>
            </View>
          </View>
          <Text className="text-[10px] text-[#64748B] mt-4 font-extrabold uppercase tracking-wider">Updated by trainers after each session</Text>
        </View>

        {/* 2. Horizontal progress bars with theme colors and icons */}
        <View className="gap-4 mb-8">
          
          {/* Technical Card */}
          <View className="bg-white border border-[#E2E8F0] rounded-3xl p-5 shadow-sm">
            <View className="flex-row justify-between items-center mb-3">
              <View className="flex-row items-center gap-2.5">
                <View className="p-2 bg-violet-50 rounded-xl border border-violet-100/50">
                  <Code2 size={16} color="#8B5CF6" />
                </View>
                <Text className="text-sm font-black text-[#0F172A]">Technical</Text>
              </View>
              <Text className="text-xs font-black text-[#8B5CF6]">{techVal}%</Text>
            </View>
            <View className="h-2 rounded-full bg-slate-100 mb-2.5 overflow-hidden">
              <View className="h-full rounded-full bg-[#8B5CF6]" style={{ width: `${techVal}%` }} />
            </View>
            <Text className="text-[10px] font-extrabold text-[#64748B]">
              {techCount.completed}/{techCount.total} modules • Mock Average: {Number(techMock).toFixed(1)}/10
            </Text>
          </View>

          {/* Communication Card */}
          <View className="bg-white border border-[#E2E8F0] rounded-3xl p-5 shadow-sm">
            <View className="flex-row justify-between items-center mb-3">
              <View className="flex-row items-center gap-2.5">
                <View className="p-2 bg-amber-50 rounded-xl border border-amber-100/50">
                  <MessageSquare size={16} color="#D97706" />
                </View>
                <Text className="text-sm font-black text-[#0F172A]">Communication</Text>
              </View>
              <Text className="text-xs font-black text-[#D97706]">{commVal}%</Text>
            </View>
            <View className="h-2 rounded-full bg-slate-100 mb-2.5 overflow-hidden">
              <View className="h-full rounded-full bg-[#D97706]" style={{ width: `${commVal}%` }} />
            </View>
            <Text className="text-[10px] font-extrabold text-[#64748B]">
              {commCount.completed}/{commCount.total} modules • Mock Average: {Number(commMock).toFixed(1)}/10
            </Text>
          </View>

          {/* Aptitude Card */}
          <View className="bg-white border border-[#E2E8F0] rounded-3xl p-5 shadow-sm">
            <View className="flex-row justify-between items-center mb-3">
              <View className="flex-row items-center gap-2.5">
                <View className="p-2 bg-indigo-50 rounded-xl border border-indigo-100/50">
                  <Brain size={16} color={primary} />
                </View>
                <Text className="text-sm font-black text-[#0F172A]">Aptitude</Text>
              </View>
              <Text className="text-xs font-black" style={{ color: primary }}>{aptiVal}%</Text>
            </View>
            <View className="h-2 rounded-full bg-slate-100 mb-2.5 overflow-hidden">
              <View className="h-full rounded-full bg-[#4F46E5]" style={{ width: `${aptiVal}%` }} />
            </View>
            <Text className="text-[10px] font-extrabold text-[#64748B]">
              {aptCount.completed}/{aptCount.total} modules • Mock Average: {Number(aptMock).toFixed(1)}/10
            </Text>
          </View>

        </View>

        {/* 3. Mock Interview Updates Section */}
        <View className="mb-10">
          <Text className="text-sm font-black text-[#0F172A] mb-4">Mock Interview Updates</Text>

          <View className="bg-white border border-[#E2E8F0] rounded-3xl overflow-hidden shadow-sm">
            
            {/* Technical Mock row */}
            <View className="flex-row items-center p-4 border-b border-[#F1F5F9] gap-4">
              <View className="p-3 bg-violet-50 rounded-2xl border border-violet-100/50">
                <Video size={16} color="#8B5CF6" />
              </View>
              <View className="flex-1">
                <Text className="text-[#0F172A] font-extrabold text-xs">Technical Mock Interview</Text>
                <Text className="text-[10px] text-[#64748B] mt-0.5">
                  {placement.technicalInterviewCompleted 
                    ? `Score ${Number(techMock).toFixed(1)}/10 • Completed` 
                    : `Score ${Number(techMock).toFixed(1)}/10 • Sync Completed`}
                </Text>
              </View>
            </View>

            {/* Comm Mock row */}
            <View className="flex-row items-center p-4 border-b border-[#F1F5F9] gap-4">
              <View className="p-3 bg-amber-50 rounded-2xl border border-amber-100/50">
                <Video size={16} color="#D97706" />
              </View>
              <View className="flex-1">
                <Text className="text-[#0F172A] font-extrabold text-xs">Communication Mock</Text>
                <Text className="text-[10px] text-[#64748B] mt-0.5">
                  {placement.mockInterviewCompleted 
                    ? `Score ${Number(commMock).toFixed(1)}/10 • Completed` 
                    : `Score ${Number(commMock).toFixed(1)}/10 • Sync Completed`}
                </Text>
              </View>
            </View>

            {/* Aptitude Mock row */}
            <View className="flex-row items-center p-4 gap-4">
              <View className="p-3 bg-indigo-50 rounded-2xl border border-indigo-100/50">
                <Video size={16} color={primary} />
              </View>
              <View className="flex-1">
                <Text className="text-[#0F172A] font-extrabold text-xs">Aptitude Mock Test</Text>
                <Text className="text-[10px] text-[#64748B] mt-0.5">
                  Score {Number(aptMock).toFixed(1)}/10 • Sync Completed
                </Text>
              </View>
            </View>

          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}
