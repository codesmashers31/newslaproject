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
import API from '../../services/api';
import {
  Trophy,
  Award,
  UserCheck
} from 'lucide-react-native';
import ProgressRing from '../../components/ProgressRing';

export default function LedgerScreen() {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const trackColor = isDark ? '#251C3D' : '#F1EBFB';

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeModule, setActiveModule] = useState<'aptitude' | 'communication' | 'technical'>('technical');

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
      <View className="flex-1 bg-[#F8F6FC] dark:bg-[#0E0A18] items-center justify-center">
        <ActivityIndicator size="large" color="#5B21B6" />
      </View>
    );
  }

  const scorecards = data?.scorecards || {};
  const progress = data?.progress || { overall: 0, aptitude: 0, communication: 0, technical: 0 };
  const leaderboardRank = data?.leaderboardRank || { institute: '—', batch: '—' };
  const placementReadiness = data?.placementReadiness || { status: 'Not Ready', percentage: 0 };

  const currentScorecard =
    activeModule === 'aptitude' ? scorecards.aptitude :
    activeModule === 'communication' ? scorecards.communication :
    scorecards.technical;

  const moduleCompletionCount = (list: any[] | undefined) => {
    const arr = list || [];
    const completed = arr.filter((s) => s.status === 'Completed').length;
    return { completed, total: arr.length };
  };

  const aptCount = moduleCompletionCount(scorecards.aptitude);
  const commCount = moduleCompletionCount(scorecards.communication);
  const techCount = moduleCompletionCount(scorecards.technical);

  return (
    <SafeAreaView className="flex-1 bg-[#F8F6FC] dark:bg-[#0E0A18]">
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      {/* Header */}
      <View className="px-6 py-4 border-b border-[#510089]/[0.12] dark:border-[#C4A3FF]/[0.16] bg-white dark:bg-[#0E0A18]">
        <Text className="text-xl font-black text-[#1A1325] dark:text-[#F6F3FC]">My Scorecard</Text>
        <Text className="text-xs text-[#6B6478] dark:text-[#A79AC2]">Module scores & academic progress</Text>
      </View>

      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#5B21B6" />
        }
        className="flex-1 px-6 py-4"
      >

        {/* 1. Overall Progress Ring */}
        <View className="items-center py-4 mb-2">
          <ProgressRing
            percent={progress.overall}
            label="Overall"
            color="#5B21B6"
            trackColor={trackColor}
            size={132}
            strokeWidth={10}
          />
          <Text className="text-xs text-[#6B6478] dark:text-[#A79AC2] mt-3">Updated by trainer after each module</Text>
        </View>

        {/* 2. Leaderboard & Placement KPI Summary */}
        <View className="flex-row mb-6">
          <View className="flex-1 bg-white dark:bg-[#1C1530] border border-[#510089]/[0.12] dark:border-[#C4A3FF]/[0.16] rounded-3xl p-4 mr-2">
            <View className="flex-row items-center mb-2">
              <Trophy size={16} color="#fbbf24" style={{ marginRight: 6 }} />
              <Text className="text-[10px] text-[#6B6478] dark:text-[#A79AC2] font-extrabold uppercase">Ranks</Text>
            </View>
            <View className="flex-row items-baseline">
              <Text className="text-2xl font-black text-[#1A1325] dark:text-[#F6F3FC] mr-2">#{leaderboardRank.institute || '—'}</Text>
              <Text className="text-[9px] text-[#6B6478] dark:text-[#A79AC2] mr-2">Inst.</Text>
              <Text className="text-md font-bold text-violet-400 mr-2">#{leaderboardRank.batch || '—'}</Text>
              <Text className="text-[9px] text-[#6B6478] dark:text-[#A79AC2]">Batch</Text>
            </View>
          </View>

          <View className="flex-1 bg-white dark:bg-[#1C1530] border border-[#510089]/[0.12] dark:border-[#C4A3FF]/[0.16] rounded-3xl p-4 ml-2">
            <View className="flex-row items-center mb-2">
              <UserCheck size={16} color="#34d399" style={{ marginRight: 6 }} />
              <Text className="text-[10px] text-[#6B6478] dark:text-[#A79AC2] font-extrabold uppercase">Placement</Text>
            </View>
            <View className="flex-row items-baseline">
              <Text className="text-2xl font-black text-[#1A1325] dark:text-[#F6F3FC] mr-2">{placementReadiness.percentage ?? placementReadiness.score ?? 0}%</Text>
              <Text className="text-[9px] text-emerald-400 font-extrabold">{placementReadiness.status}</Text>
            </View>
          </View>
        </View>

        {/* 3. Per-domain progress bars */}
        <View className="gap-3 mb-6">
          {[
            { label: 'Aptitude', percent: progress.aptitude, count: aptCount },
            { label: 'Communication', percent: progress.communication, count: commCount },
            { label: 'Technical', percent: progress.technical, count: techCount },
          ].map((row) => (
            <View key={row.label} className="bg-white dark:bg-[#1C1530] border border-[#510089]/[0.12] dark:border-[#C4A3FF]/[0.16] rounded-2xl p-4 mb-1">
              <View className="flex-row justify-between mb-2">
                <Text className="text-sm font-extrabold text-[#1A1325] dark:text-[#F6F3FC]">{row.label}</Text>
                <Text className="text-[13px] font-bold text-[#5B21B6] dark:text-violet-400">{Math.round(row.percent || 0)}%</Text>
              </View>
              <View className="h-2 rounded-full bg-[#F1EBFB] dark:bg-[#251C3D] mb-1.5">
                <View
                  className="h-full rounded-full bg-[#5B21B6]"
                  style={{ width: `${Math.max(0, Math.min(100, row.percent || 0))}%` }}
                />
              </View>
              <Text className="text-[11px] text-[#6B6478] dark:text-[#A79AC2]">{row.count.completed}/{row.count.total} modules completed</Text>
            </View>
          ))}
        </View>

        {/* 4. Domain selector buttons */}
        <View className="flex-row bg-white dark:bg-[#1C1530] border border-[#510089]/[0.12] dark:border-[#C4A3FF]/[0.16] p-1 rounded-2xl mb-6">
          {(['technical', 'communication', 'aptitude'] as const).map((module) => (
            <TouchableOpacity
              key={module}
              onPress={() => setActiveModule(module)}
              className={`flex-1 py-3.5 rounded-xl items-center justify-center ${activeModule === module ? 'bg-[#5B21B6]' : ''}`}
            >
              <Text className={`text-[10px] font-extrabold uppercase tracking-wide ${activeModule === module ? 'text-white' : 'text-[#6B6478] dark:text-[#A79AC2]'}`}>
                {module}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* 5. Score details list */}
        <View className="bg-white dark:bg-[#1C1530] border border-[#510089]/[0.12] dark:border-[#C4A3FF]/[0.16] rounded-3xl p-5 mb-10">
          <View className="flex-row justify-between items-center mb-4">
            <Text className="font-extrabold text-sm text-[#1A1325] dark:text-[#F6F3FC] capitalize">{activeModule} Scorecard</Text>
            <View className="flex-row items-center">
              <Award size={14} color="#a78bfa" style={{ marginRight: 4 }} />
              <Text className="text-xs font-bold text-[#1A1325] dark:text-[#F6F3FC]">{Math.round(progress[activeModule] || 0)}% Avg</Text>
            </View>
          </View>

          <View className="gap-3">
            {currentScorecard && currentScorecard.length > 0 ? (
              currentScorecard.map((score: any, idx: number) => (
                <View
                  key={idx}
                  className="bg-[#F1EBFB] dark:bg-black/20 border border-[#510089]/[0.12] dark:border-[#C4A3FF]/[0.16] p-4 rounded-2xl mb-1"
                >
                  <View className="flex-row justify-between items-center mb-2.5">
                    <Text className="font-bold text-xs text-[#1A1325] dark:text-[#F6F3FC] max-w-[70%]">{score.subject}</Text>
                    <View className="flex-row items-center">
                      <Text className="text-[10px] font-black text-violet-400 mr-1.5">{score.marks} / 100</Text>
                      <Text className={`text-[9px] font-extrabold uppercase tracking-wide px-2 py-0.5 rounded-full ${
                        score.status === 'Completed'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : score.status === 'In Progress'
                          ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20'
                          : 'bg-[#F1EBFB] dark:bg-[#251C3D] text-[#6B6478] dark:text-[#A79AC2]'
                      }`}>
                        {score.status}
                      </Text>
                    </View>
                  </View>
                  {score.remarks ? (
                    <Text className="text-[10px] text-[#6B6478] dark:text-[#A79AC2] leading-relaxed italic border-t border-[#510089]/[0.12] dark:border-[#C4A3FF]/[0.16] pt-2 mt-1">
                      Note: "{score.remarks}"
                    </Text>
                  ) : null}
                </View>
              ))
            ) : (
              <Text className="text-[10px] text-[#6B6478] dark:text-[#A79AC2] italic py-4 text-center">No grades evaluated for this module yet.</Text>
            )}
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}
