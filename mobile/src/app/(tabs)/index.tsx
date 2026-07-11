import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  ActivityIndicator, 
  RefreshControl,
  StatusBar
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useNavigation } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import API from '../../services/api';
import { 
  CalendarDays, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  Camera, 
  LogOut, 
  Sparkles,
  Users2,
  Bookmark
} from 'lucide-react-native';

export default function DashboardScreen() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadDashboardData = async () => {
    try {
      const { data: dashboardData } = await API.get('/student/dashboard');
      setData(dashboardData);
    } catch (error: any) {
      console.error('Failed to load student dashboard', error?.message);
      if (error?.response?.status === 401) {
        router.replace('/login');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadDashboardData();
  };

  const handleSignOut = async () => {
    await AsyncStorage.removeItem('student_token');
    await AsyncStorage.removeItem('student_profile');
    router.replace('/login');
  };

  if (loading) {
    return (
      <View className="flex-1 bg-slate-950 items-center justify-center">
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  const profile = data?.profile?.user || {};
  const batch = data?.batch || {};
  const todayRecord = data?.attendance?.todayRecord || null;

  return (
    <SafeAreaView className="flex-1 bg-slate-950">
      <StatusBar barStyle="light-content" />
      
      {/* Top Header Row */}
      <View className="flex-row justify-between items-center px-6 py-4 border-b border-slate-900 bg-slate-950">
        <View className="flex-row items-center space-x-2">
          <Sparkles size={16} color="#f59e0b" style={{ marginRight: 4 }} />
          <Text className="text-sm font-black text-white tracking-wide uppercase">LCP Student Space</Text>
        </View>
        <TouchableOpacity 
          onPress={handleSignOut}
          className="p-2 bg-red-500/10 border border-red-500/20 rounded-xl"
        >
          <LogOut size={16} color="#ef4444" />
        </TouchableOpacity>
      </View>

      <ScrollView 
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#6366f1" />
        }
        className="flex-1 px-6 py-4"
      >
        
        {/* 1. Welcoming Header Banner */}
        <View className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-sm mb-6 flex-row items-center justify-between">
          <View className="flex-1 pr-4">
            <View className="flex-row items-center space-x-1.5 mb-1">
              <Sparkles size={12} color="#f59e0b" style={{ marginRight: 4 }} />
              <Text className="text-[9px] uppercase tracking-widest font-black text-amber-400">STUDENT PORTAL</Text>
            </View>
            <Text className="text-2xl font-black text-white">Hello, {profile.name || 'Student'}!</Text>
            <Text className="text-xs text-slate-400 mt-1 font-semibold leading-relaxed">
              {batch.name ? `Cohort: ${batch.name} • ${batch.course}` : 'Unassigned Batch. Contact admin.'}
            </Text>
          </View>
          <View className="w-12 h-12 bg-indigo-500/10 rounded-full items-center justify-center border border-indigo-500/20">
            <Text className="text-lg font-black text-indigo-400">
              {profile.name?.charAt(0).toUpperCase() || 'S'}
            </Text>
          </View>
        </View>

        {/* 2. Today's Roll Call Check-in Card */}
        <View className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-sm mb-6">
          <View className="flex-row items-center space-x-3 mb-4">
            <View className="p-2 bg-purple-500/10 border border-purple-500/20 rounded-xl mr-2.5">
              <Clock size={18} color="#c084fc" />
            </View>
            <View>
              <Text className="font-extrabold text-sm text-slate-200">Daily Attendance Roll Call</Text>
              <Text className="text-[10px] text-slate-500">
                Today is: {new Date().toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
              </Text>
            </View>
          </View>

          {todayRecord ? (
            /* CASE: MARKED PRESENT / LATE */
            <View className="items-center py-4 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl p-4">
              <View className="w-10 h-10 bg-emerald-500/20 rounded-full items-center justify-center mb-2.5">
                <CheckCircle2 size={20} color="#34d399" />
              </View>
              <Text className="text-xs font-bold text-emerald-400 uppercase tracking-widest bg-emerald-500/10 px-3 py-1 rounded-full">
                {todayRecord.status}
              </Text>
              <Text className="text-[11px] text-slate-400 mt-2 font-medium">
                Verified today at {new Date(todayRecord.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Text>
              <Text className="text-[9px] text-slate-500 mt-1">Daily check-in logged successfully.</Text>
            </View>
          ) : (
            /* CASE: PENDING */
            <View className="items-center py-4 bg-amber-500/5 border border-amber-500/10 rounded-2xl p-4">
              <View className="w-10 h-10 bg-amber-500/20 rounded-full items-center justify-center mb-2.5">
                <AlertTriangle size={20} color="#f59e0b" />
              </View>
              <Text className="text-xs font-bold text-amber-400 uppercase tracking-widest bg-amber-500/10 px-3 py-1 rounded-full">
                Pending
              </Text>
              <Text className="text-[11px] text-slate-400 mt-2 font-medium text-center">
                You have not checked in for today's sessions yet.
              </Text>
              
              <TouchableOpacity
                onPress={() => router.push('/(tabs)/scanner')}
                activeOpacity={0.8}
                className="mt-4 w-full py-3.5 bg-indigo-600 rounded-xl flex-row items-center justify-center space-x-1.5 shadow-md shadow-indigo-600/20"
              >
                <Camera size={14} color="#ffffff" style={{ marginRight: 6 }} />
                <Text className="text-white font-bold text-xs">Scan Attendance QR</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* 3. Active Training Batches */}
        {data?.batches && data.batches.length > 0 ? (
          data.batches.map((b: any) => (
            <View key={b._id} className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-sm mb-6">
              <View className="flex-row items-center space-x-3 mb-4">
                <View className="p-2 bg-indigo-500/10 border border-indigo-500/20 rounded-xl mr-2.5">
                  <CalendarDays size={18} color="#818cf8" />
                </View>
                <View>
                  <Text className="font-extrabold text-sm text-slate-200">Active Training Batch</Text>
                  <Text className="text-[10px] text-slate-500">Duration & syllabus schedule</Text>
                </View>
              </View>

              <View className="space-y-2.5 pt-1 text-xs">
                <View className="flex-row justify-between border-b pb-2.5 border-slate-800 mb-2">
                  <Text className="font-semibold text-slate-400">Batch Code:</Text>
                  <Text className="font-bold text-white">{b.name || 'N/A'}</Text>
                </View>
                <View className="flex-row justify-between border-b pb-2.5 border-slate-800 mb-2">
                  <Text className="font-semibold text-slate-400">Course Syllabus:</Text>
                  <Text className="font-bold text-indigo-400">{b.course || 'Full Stack Placement Prep'}</Text>
                </View>
                <View className="flex-row justify-between pb-1">
                  <Text className="font-semibold text-slate-400">Schedules:</Text>
                  <Text className="font-bold text-slate-200">
                    {b.startDate ? new Date(b.startDate).toLocaleDateString() : 'N/A'}
                    {' — '}
                    {b.endDate ? new Date(b.endDate).toLocaleDateString() : 'N/A'}
                  </Text>
                </View>
              </View>

              {/* Trainers Row */}
              <View className="mt-4 pt-3 border-t border-slate-800">
                <Text className="text-[9px] text-slate-500 font-extrabold uppercase tracking-wider mb-2">Assigned Staff Trainers</Text>
                <View className="space-y-2">
                  {b.trainers && b.trainers.length > 0 ? (
                    b.trainers.map((tr: any) => (
                      <View 
                        key={tr._id} 
                        className="flex-row justify-between items-center p-2.5 bg-slate-950/60 border border-slate-800 rounded-xl mb-1.5"
                      >
                        <View>
                          <Text className="text-[9px] font-bold text-indigo-400 uppercase tracking-wide">{tr.role}</Text>
                          <Text className="font-bold text-xs text-slate-200 mt-0.5">{tr.name}</Text>
                        </View>
                        <Text className="text-[9px] text-slate-500 font-medium">{tr.email}</Text>
                      </View>
                    ))
                  ) : (
                    <Text className="text-[10px] text-slate-500 italic py-1">No trainers assigned yet.</Text>
                  )}
                </View>
              </View>
            </View>
          ))
        ) : (
          <View className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-sm mb-10">
            <View className="flex-row items-center space-x-3 mb-4">
              <View className="p-2 bg-indigo-500/10 border border-indigo-500/20 rounded-xl mr-2.5">
                <CalendarDays size={18} color="#818cf8" />
              </View>
              <View>
                <Text className="font-extrabold text-sm text-slate-200">Active Training Batch</Text>
                <Text className="text-[10px] text-slate-500">Duration & syllabus schedule</Text>
              </View>
            </View>

            <View className="space-y-2.5 pt-1 text-xs">
              <View className="flex-row justify-between border-b pb-2.5 border-slate-800 mb-2">
                <Text className="font-semibold text-slate-400">Batch Code:</Text>
                <Text className="font-bold text-white">N/A</Text>
              </View>
              <View className="flex-row justify-between border-b pb-2.5 border-slate-800 mb-2">
                <Text className="font-semibold text-slate-400">Course Syllabus:</Text>
                <Text className="font-bold text-indigo-400">Full Stack Placement Prep</Text>
              </View>
              <View className="flex-row justify-between pb-1">
                <Text className="font-semibold text-slate-400">Schedules:</Text>
                <Text className="font-bold text-slate-200">N/A — N/A</Text>
              </View>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
