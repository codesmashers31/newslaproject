import React, { useState, useEffect } from 'react';
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
import API from '../../services/api';
import { 
  Trophy, 
  Award, 
  BookOpen, 
  CheckCircle,
  FilePieChart,
  UserCheck
} from 'lucide-react-native';

export default function LedgerScreen() {
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

  useEffect(() => {
    loadLedgerData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadLedgerData();
  };

  if (loading) {
    return (
      <View className="flex-1 bg-slate-950 items-center justify-center">
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  const scorecards = data?.scorecards || {};
  const progress = data?.progress || { overall: 0, aptitude: 0, communication: 0, technical: 0 };
  const leaderboardRank = data?.leaderboardRank || { institute: '—', batch: '—' };
  const placementReadiness = data?.placementReadiness || { status: 'Not Ready', score: 0 };

  const currentScorecard = 
    activeModule === 'aptitude' ? scorecards.aptitude :
    activeModule === 'communication' ? scorecards.communication :
    scorecards.technical;

  return (
    <SafeAreaView className="flex-1 bg-slate-950">
      <StatusBar barStyle="light-content" />
      
      {/* Header */}
      <View className="px-6 py-4 border-b border-slate-900 bg-slate-950">
        <Text className="text-xl font-black text-white">Academic Scorecard</Text>
        <Text className="text-xs text-slate-500">Track module milestones & ranking stats</Text>
      </View>

      <ScrollView 
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#6366f1" />
        }
        className="flex-1 px-6 py-4"
      >
        
        {/* 1. Leaderboard & Placement KPI Summary */}
        <View className="grid-cols-2 gap-4 flex-row mb-6">
          
          {/* Leaderboard Card */}
          <View className="flex-1 bg-slate-900 border border-slate-800 rounded-3xl p-4 mr-2">
            <View className="flex-row items-center space-x-2 mb-2">
              <Trophy size={16} color="#fbbf24" style={{ marginRight: 6 }} />
              <Text className="text-[10px] text-slate-400 font-extrabold uppercase">Ranks</Text>
            </View>
            <View className="flex-row items-baseline space-x-2">
              <Text className="text-2xl font-black text-white">#{leaderboardRank.institute || '—'}</Text>
              <Text className="text-[9px] text-slate-500">Inst.</Text>
              <Text className="text-md font-bold text-indigo-400">#{leaderboardRank.batch || '—'}</Text>
              <Text className="text-[9px] text-slate-500">Batch</Text>
            </View>
          </View>

          {/* Placement Readiness Card */}
          <View className="flex-1 bg-slate-900 border border-slate-800 rounded-3xl p-4 ml-2">
            <View className="flex-row items-center space-x-2 mb-2">
              <UserCheck size={16} color="#34d399" style={{ marginRight: 6 }} />
              <Text className="text-[10px] text-slate-400 font-extrabold uppercase">Placement</Text>
            </View>
            <View className="flex-row items-baseline space-x-2">
              <Text className="text-2xl font-black text-white">{placementReadiness.score}%</Text>
              <Text className="text-[9px] text-emerald-400 font-extrabold">{placementReadiness.status}</Text>
            </View>
          </View>

        </View>

        {/* 2. Overall Progress Ring Mockup */}
        <View className="bg-slate-900 border border-slate-800 rounded-3xl p-5 mb-6 items-center flex-row justify-between">
          <View className="space-y-1">
            <Text className="text-[10px] text-slate-500 font-extrabold uppercase">Curriculum Progress</Text>
            <Text className="text-2xl font-black text-white">{progress.overall}% Overall</Text>
            <Text className="text-[9px] text-slate-400">Based on evaluated grading sheets</Text>
          </View>
          <View className="w-16 h-16 bg-slate-950 border-4 border-indigo-600/30 border-t-indigo-600 rounded-full items-center justify-center">
            <Text className="text-xs font-black text-white">{progress.overall}%</Text>
          </View>
        </View>

        {/* 3. Domain selector buttons */}
        <View className="flex-row bg-slate-900 border border-slate-800 p-1 rounded-2xl mb-6">
          {(['technical', 'communication', 'aptitude'] as const).map((module) => (
            <TouchableOpacity
              key={module}
              onPress={() => setActiveModule(module)}
              className={`flex-1 py-3.5 rounded-xl items-center justify-center ${activeModule === module ? 'bg-indigo-600' : ''}`}
            >
              <Text className={`text-[10px] font-extrabold uppercase tracking-wide ${activeModule === module ? 'text-white' : 'text-slate-500'}`}>
                {module}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* 4. Score details list */}
        <View className="bg-slate-900 border border-slate-800 rounded-3xl p-5 mb-10">
          <View className="flex-row justify-between items-center mb-4">
            <Text className="font-extrabold text-sm text-slate-200 capitalize">{activeModule} Scorecard</Text>
            <View className="flex-row items-center space-x-1">
              <Award size={14} color="#818cf8" style={{ marginRight: 4 }} />
              <Text className="text-xs font-bold text-white">{progress[activeModule]}% Avg</Text>
            </View>
          </View>

          <View className="space-y-3">
            {currentScorecard && currentScorecard.length > 0 ? (
              currentScorecard.map((score: any, idx: number) => (
                <View 
                  key={idx}
                  className="bg-slate-950/60 border border-slate-850 p-4 rounded-2xl"
                >
                  <View className="flex-row justify-between items-center mb-2.5">
                    <Text className="font-bold text-xs text-white max-w-[70%]">{score.subject}</Text>
                    <View className="flex-row items-center space-x-1.5">
                      <Text className="text-[10px] font-black text-indigo-400">{score.marks} / 100</Text>
                      <Text className={`text-[9px] font-extrabold uppercase tracking-wide px-2 py-0.5 rounded-full ${
                        score.status === 'Completed'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : score.status === 'In Progress'
                          ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20'
                          : 'bg-slate-800 text-slate-400'
                      }`}>
                        {score.status}
                      </Text>
                    </View>
                  </View>
                  {score.remarks ? (
                    <Text className="text-[10px] text-slate-400 leading-relaxed italic border-t border-slate-900 pt-2 mt-1">
                      Note: "{score.remarks}"
                    </Text>
                  ) : null}
                </View>
              ))
            ) : (
              <Text className="text-[10px] text-slate-500 italic py-4 text-center">No grades evaluated for this module yet.</Text>
            )}
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}
