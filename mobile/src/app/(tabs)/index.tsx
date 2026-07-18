import React, { useState, useCallback } from 'react';
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
import { router, useFocusEffect } from 'expo-router';
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
  Moon,
  Sun
} from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import BannerCarousel from '../../components/BannerCarousel';

export default function DashboardScreen() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  const { colorScheme, setColorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

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

  useFocusEffect(
    useCallback(() => {
      loadDashboardData();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadDashboardData();
  };

  const handleSignOut = async () => {
    await AsyncStorage.removeItem('student_token');
    await AsyncStorage.removeItem('student_profile');
    router.replace('/login');
  };

  const handleToggleTheme = async () => {
    const newTheme = isDark ? 'light' : 'dark';
    setColorScheme(newTheme);
    await AsyncStorage.setItem('app_theme', newTheme);
  };

  if (loading) {
    return (
      <View className="flex-1 bg-slate-50 dark:bg-slate-950 items-center justify-center">
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  const profile = data?.profile?.user || {};
  const batch = data?.batch || {};
  const todayRecords = data?.attendance?.todayRecords || [];

  return (
    <SafeAreaView className="flex-1 bg-slate-50 dark:bg-slate-950">
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      
      {/* Top Header Row */}
      <View className="flex-row justify-between items-center px-6 py-4 border-b border-slate-200 dark:border-slate-900 bg-white dark:bg-slate-950 shadow-sm z-10">
        <View className="flex-row items-center space-x-2">
          <Sparkles size={18} color="#4f46e5" style={{ marginRight: 6 }} />
          <Text className="text-sm font-black text-slate-900 dark:text-white tracking-wide uppercase">Informatics</Text>
        </View>
        
        <View className="flex-row space-x-3">
          <TouchableOpacity 
            onPress={handleToggleTheme}
            className="p-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl"
          >
            {isDark ? <Sun size={16} color="#f59e0b" /> : <Moon size={16} color="#64748b" />}
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={handleSignOut}
            className="p-2.5 bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 rounded-xl"
          >
            <LogOut size={16} color="#ef4444" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView 
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#6366f1" />
        }
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        <BannerCarousel />

        <View className="px-6 mt-2">
          {/* 1. Welcoming Header Banner */}
          <View className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 shadow-sm mb-6 flex-row items-center justify-between">
            <View className="flex-1 pr-4">
              <View className="flex-row items-center space-x-1.5 mb-1">
                <Sparkles size={12} color="#f59e0b" style={{ marginRight: 4 }} />
                <Text className="text-[9px] uppercase tracking-widest font-black text-amber-500">STUDENT PORTAL</Text>
              </View>
              <Text className="text-2xl font-black text-slate-900 dark:text-white">Hello, {profile.name || 'Student'}!</Text>
              <Text className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-semibold leading-relaxed">
                {batch.name ? `Cohort: ${batch.name} • ${batch.course}` : 'Unassigned Batch. Contact admin.'}
              </Text>
            </View>
            <View className="w-14 h-14 bg-indigo-50 dark:bg-indigo-500/10 rounded-full items-center justify-center border border-indigo-100 dark:border-indigo-500/20">
              <Text className="text-xl font-black text-indigo-600 dark:text-indigo-400">
                {profile.name?.charAt(0).toUpperCase() || 'S'}
              </Text>
            </View>
          </View>

          {/* 2. Today's Roll Call Check-in Card */}
          <View className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-5 shadow-sm mb-6">
            <View className="flex-row items-center space-x-3 mb-4">
              <View className="p-2.5 bg-purple-50 dark:bg-purple-500/10 border border-purple-100 dark:border-purple-500/20 rounded-xl mr-2.5">
                <Clock size={18} color="#c084fc" />
              </View>
              <View>
                <Text className="font-extrabold text-sm text-slate-800 dark:text-slate-200">Daily Attendance Roll Call</Text>
                <Text className="text-[10px] text-slate-500 dark:text-slate-500">
                  Today is: {new Date().toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                </Text>
              </View>
            </View>

            {todayRecords.length > 0 ? (
              <View className="space-y-3">
                {todayRecords.map((record: any, index: number) => (
                  <View key={index} className="flex-row items-center justify-between py-3.5 px-4 bg-emerald-50 dark:bg-emerald-500/5 border border-emerald-100 dark:border-emerald-500/10 rounded-2xl">
                    <View className="flex-row items-center">
                      <View className="w-8 h-8 bg-emerald-100 dark:bg-emerald-500/20 rounded-full items-center justify-center mr-3">
                        <CheckCircle2 size={16} color="#059669" />
                      </View>
                      <View>
                        <Text className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider">{record.subject || 'Class'}</Text>
                        <Text className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                          {new Date(record.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </Text>
                      </View>
                    </View>
                    <Text className="text-[10px] font-black text-emerald-700 dark:text-emerald-400 uppercase tracking-widest bg-emerald-100 dark:bg-emerald-500/10 px-2.5 py-1 rounded-full">
                      {record.status}
                    </Text>
                  </View>
                ))}
              </View>
            ) : (
              <View className="items-center py-4 bg-amber-50 dark:bg-amber-500/5 border border-amber-100 dark:border-amber-500/10 rounded-2xl p-5">
                <View className="w-12 h-12 bg-amber-100 dark:bg-amber-500/20 rounded-full items-center justify-center mb-3">
                  <AlertTriangle size={24} color="#f59e0b" />
                </View>
                <Text className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-widest bg-amber-100 dark:bg-amber-500/10 px-3 py-1 rounded-full">
                  Pending
                </Text>
                <Text className="text-xs text-slate-600 dark:text-slate-400 mt-2.5 font-medium text-center">
                  You have not checked in for today's sessions yet.
                </Text>
                
                <TouchableOpacity
                  onPress={() => router.push('/(tabs)/scanner')}
                  activeOpacity={0.8}
                  className="mt-5 w-full py-4 bg-indigo-600 rounded-xl flex-row items-center justify-center space-x-2 shadow-md shadow-indigo-600/20"
                >
                  <Camera size={16} color="#ffffff" style={{ marginRight: 6 }} />
                  <Text className="text-white font-bold text-sm">Scan Attendance QR</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* 3. Assigned Cohorts & Trainers */}
          <Text className="text-[11px] font-black text-slate-500 uppercase tracking-wider mb-4 mt-2">Assigned Cohorts & Trainers</Text>

          {/* Technical Domain */}
          <View className="mb-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-5 shadow-sm">
            <View className="flex-row items-center space-x-3 mb-4">
              <View className="p-2 bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 rounded-xl mr-2.5">
                <CalendarDays size={18} color="#6366f1" />
              </View>
              <View className="flex-1">
                <Text className="font-extrabold text-sm text-slate-800 dark:text-slate-200">Technical Training</Text>
                <Text className="text-[10px] text-slate-500">Core technology track</Text>
              </View>
            </View>
            <View className="space-y-2.5 pt-1 text-xs">
              <View className="flex-row justify-between items-start border-b pb-2.5 border-slate-100 dark:border-slate-800 mb-2">
                <Text className="font-semibold text-slate-500 dark:text-slate-400 mt-0.5">Assigned Batch:</Text>
                <Text className="font-bold text-slate-800 dark:text-white flex-1 text-right ml-4">{profile.technicalBatch || 'Unassigned'}</Text>
              </View>
              <View className="flex-row justify-between items-start pb-1">
                <Text className="font-semibold text-slate-500 dark:text-slate-400 mt-0.5">Trainer:</Text>
                <Text className="font-bold text-indigo-600 dark:text-indigo-400 flex-1 text-right ml-4">{profile.technicalTrainer || 'Unassigned'}</Text>
              </View>
            </View>
          </View>

          {/* Communication Domain */}
          <View className="mb-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-5 shadow-sm">
            <View className="flex-row items-center space-x-3 mb-4">
              <View className="p-2 bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 rounded-xl mr-2.5">
                <CalendarDays size={18} color="#6366f1" />
              </View>
              <View className="flex-1">
                <Text className="font-extrabold text-sm text-slate-800 dark:text-slate-200">Communication Skills</Text>
                <Text className="text-[10px] text-slate-500">Soft skills & interview prep</Text>
              </View>
            </View>
            <View className="space-y-2.5 pt-1 text-xs">
              <View className="flex-row justify-between items-start border-b pb-2.5 border-slate-100 dark:border-slate-800 mb-2">
                <Text className="font-semibold text-slate-500 dark:text-slate-400 mt-0.5">Assigned Batch:</Text>
                <Text className="font-bold text-slate-800 dark:text-white flex-1 text-right ml-4">{profile.communicationBatch || 'Unassigned'}</Text>
              </View>
              <View className="flex-row justify-between items-start pb-1">
                <Text className="font-semibold text-slate-500 dark:text-slate-400 mt-0.5">Trainer:</Text>
                <Text className="font-bold text-indigo-600 dark:text-indigo-400 flex-1 text-right ml-4">{profile.communicationTrainer || 'Unassigned'}</Text>
              </View>
            </View>
          </View>

          {/* Aptitude Domain */}
          <View className="mb-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-5 shadow-sm">
            <View className="flex-row items-center space-x-3 mb-4">
              <View className="p-2 bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 rounded-xl mr-2.5">
                <CalendarDays size={18} color="#6366f1" />
              </View>
              <View className="flex-1">
                <Text className="font-extrabold text-sm text-slate-800 dark:text-slate-200">Aptitude & Reasoning</Text>
                <Text className="text-[10px] text-slate-500">Quantitative & analytical prep</Text>
              </View>
            </View>
            <View className="space-y-2.5 pt-1 text-xs">
              <View className="flex-row justify-between items-start border-b pb-2.5 border-slate-100 dark:border-slate-800 mb-2">
                <Text className="font-semibold text-slate-500 dark:text-slate-400 mt-0.5">Assigned Batch:</Text>
                <Text className="font-bold text-slate-800 dark:text-white flex-1 text-right ml-4">{profile.aptitudeBatch || 'Unassigned'}</Text>
              </View>
              <View className="flex-row justify-between items-start pb-1">
                <Text className="font-semibold text-slate-500 dark:text-slate-400 mt-0.5">Trainer:</Text>
                <Text className="font-bold text-indigo-600 dark:text-indigo-400 flex-1 text-right ml-4">{profile.aptitudeTrainer || 'Unassigned'}</Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
