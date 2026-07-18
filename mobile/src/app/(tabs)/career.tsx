import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { useColorScheme } from 'nativewind';
import API from '../../services/api';
import {
  Briefcase,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Sparkles,
  User,
  Code2,
  Link as LinkIcon,
  FileText,
  Check,
} from 'lucide-react-native';
import ProgressRing from '../../components/ProgressRing';

const STATUS_CONFIG: Record<string, { color: string; icon: any }> = {
  'Ready': { color: '#16A34A', icon: CheckCircle },
  'Almost Ready': { color: '#2563EB', icon: CheckCircle },
  'Needs Improvement': { color: '#D97706', icon: AlertTriangle },
  'Critical': { color: '#DC2626', icon: XCircle },
};

export default function CareerScreen() {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const trackColor = isDark ? '#251C3D' : '#F1EBFB';

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    try {
      const { data: dashboardData } = await API.get('/student/dashboard');
      setData(dashboardData);
    } catch (error: any) {
      console.error('Failed to load career data', error?.message);
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
      loadData();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  if (loading) {
    return (
      <View className="flex-1 bg-[#F8F6FC] dark:bg-[#0E0A18] items-center justify-center">
        <ActivityIndicator size="large" color="#5B21B6" />
      </View>
    );
  }

  const readiness = data?.placementReadiness || { percentage: 0, status: 'Critical', breakdown: {}, recommendations: [] };
  const { percentage, status, breakdown, recommendations } = readiness;
  const statusInfo = STATUS_CONFIG[status] || STATUS_CONFIG['Critical'];
  const StatusIcon = statusInfo.icon;

  const criteria = [
    { icon: FileText, label: 'Resume Uploaded', value: breakdown.resume, max: 15 },
    { icon: LinkIcon, label: 'LinkedIn Updated', value: breakdown.linkedin, max: 10 },
    { icon: Code2, label: 'GitHub Updated', value: breakdown.github, max: 10 },
    { icon: Briefcase, label: 'Mock Interview', value: breakdown.mockInterview, max: 15 },
    { icon: Check, label: 'Technical Mock Panel', value: breakdown.technicalInterview, max: 15 },
    { icon: User, label: 'HR Interview Panel', value: breakdown.hrInterview, max: 10 },
  ];

  return (
    <SafeAreaView className="flex-1 bg-[#F8F6FC] dark:bg-[#0E0A18]">
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      <View className="px-6 py-4 border-b border-[#510089]/[0.12] dark:border-[#C4A3FF]/[0.16] bg-white dark:bg-[#0E0A18] flex-row items-center">
        <View className="p-2 bg-violet-500/10 rounded-xl border border-violet-500/20 mr-3">
          <Briefcase size={20} color="#a78bfa" />
        </View>
        <View>
          <Text className="text-xl font-black text-[#1A1325] dark:text-[#F6F3FC]">Career Readiness</Text>
          <Text className="text-xs text-[#6B6478] dark:text-[#A79AC2]">Track your placement preparation progress</Text>
        </View>
      </View>

      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#5B21B6" />}
        className="flex-1 px-6 py-4"
      >
        {/* Readiness ring + status */}
        <View className="items-center py-4 mb-6">
          <ProgressRing
            percent={percentage}
            label="Readiness"
            color="#5B21B6"
            trackColor={trackColor}
            size={132}
            strokeWidth={10}
          />
          <View
            className="flex-row items-center mt-4 px-4 py-2 rounded-full border"
            style={{ backgroundColor: `${statusInfo.color}1A`, borderColor: `${statusInfo.color}40` }}
          >
            <StatusIcon size={16} color={statusInfo.color} style={{ marginRight: 6 }} />
            <Text className="text-xs font-bold" style={{ color: statusInfo.color }}>Status: {status}</Text>
          </View>
        </View>

        {/* Readiness criteria */}
        <Text className="text-[11px] font-black text-[#6B6478] dark:text-[#A79AC2] uppercase tracking-wider mb-3">Readiness Criteria</Text>
        <View className="flex-row flex-wrap gap-2.5 mb-6">
          {criteria.map((c) => (
            <View
              key={c.label}
              className="bg-white dark:bg-[#1C1530] border border-[#510089]/[0.12] dark:border-[#C4A3FF]/[0.16] rounded-xl px-3.5 py-3"
              style={{ width: '48%' }}
            >
              <View className="flex-row items-center mb-1.5">
                <c.icon size={14} color="#a78bfa" style={{ marginRight: 6 }} />
                <Text className="text-[11px] font-semibold text-[#1A1325] dark:text-[#F6F3FC] flex-1" numberOfLines={1}>{c.label}</Text>
              </View>
              <Text className="text-[10px] font-bold text-[#6B6478] dark:text-[#A79AC2]">{c.value ?? 0}% / {c.max}%</Text>
            </View>
          ))}
        </View>

        {/* AI Recommendations */}
        <View className="bg-white dark:bg-[#1C1530] border border-[#510089]/[0.12] dark:border-[#C4A3FF]/[0.16] rounded-3xl p-5 mb-10">
          <View className="flex-row items-center mb-2">
            <Sparkles size={16} color="#a78bfa" style={{ marginRight: 8 }} />
            <Text className="font-extrabold text-sm text-[#1A1325] dark:text-[#F6F3FC]">Recommendations</Text>
          </View>
          <Text className="text-[11px] text-[#6B6478] dark:text-[#A79AC2] mb-4">
            Personalized guidance to improve your placement readiness.
          </Text>
          <View className="gap-2.5">
            {recommendations.map((rec: string, idx: number) => (
              <View key={idx} className="flex-row bg-[#F1EBFB] dark:bg-black/20 border border-[#510089]/[0.12] dark:border-[#C4A3FF]/[0.16] rounded-2xl p-3.5 mb-1">
                <View className="w-5 h-5 rounded-full bg-violet-100 dark:bg-violet-900/40 items-center justify-center mr-3 mt-0.5">
                  <Text className="text-[10px] font-bold text-violet-800 dark:text-violet-400">{idx + 1}</Text>
                </View>
                <Text className="flex-1 text-xs font-medium text-[#1A1325] dark:text-[#F6F3FC]">{rec}</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
