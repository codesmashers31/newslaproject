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
  Sparkles
} from 'lucide-react-native';
import { Image } from 'expo-image';
import BannerCarousel from '../../components/BannerCarousel';
import ProgressRing from '../../components/ProgressRing';

export default function DashboardScreen() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const primaryColor = '#4F46E5';

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

  if (loading) {
    return (
      <View className="flex-1 bg-[#F8FAFC] items-center justify-center">
        <ActivityIndicator size="large" color={primaryColor} />
      </View>
    );
  }

  const profile = data?.profile?.user || {};
  const batch = data?.batch || {};
  const todayRecords = data?.attendance?.todayRecords || [];
  const progress = data?.progress || { aptitude: 0, communication: 0, technical: 0 };

  return (
    <SafeAreaView className="flex-1 bg-[#F8FAFC]">
      <StatusBar barStyle="dark-content" />
      
      {/* Top Header Row */}
      <View className="flex-row justify-between items-center px-8 py-4 border-b border-[#E2E8F0] bg-white shadow-sm z-10">
        <View className="flex-row items-center">
          <Image
            source={require('../../../assets/images/branding/logo-buildx.png')}
            style={{ height: 52, width: 52 }}
            contentFit="contain"
          />
        </View>
        
        <TouchableOpacity 
          onPress={handleSignOut}
          className="p-2.5 bg-red-50 border border-red-100 rounded-xl"
        >
          <LogOut size={16} color="#ef4444" />
        </TouchableOpacity>
      </View>

      <ScrollView 
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={primaryColor} />
        }
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        <BannerCarousel />

        <View className="px-6 mt-4">
          
          {/* 1. Welcoming Header Banner */}
          <View className="bg-white border border-[#E2E8F0] rounded-3xl p-6 shadow-sm mb-6 flex-row items-center justify-between">
            <View className="flex-1 pr-4">
              <View className="flex-row items-center mb-1">
                <Sparkles size={12} color="#f59e0b" style={{ marginRight: 4 }} />
                <Text className="text-[9px] uppercase tracking-widest font-black text-amber-500">STUDENT PORTAL</Text>
              </View>
              <Text className="text-2xl font-black text-[#0F172A]">Hello, {profile.name || 'Student'}!</Text>
              <Text className="text-xs text-[#64748B] mt-1 font-semibold leading-relaxed">
                {batch.name ? `Cohort: ${batch.name} • ${batch.course}` : 'Unassigned Batch. Contact admin.'}
              </Text>
            </View>
            <View className="w-14 h-14 bg-indigo-50 rounded-full items-center justify-center border border-indigo-100">
              <Text className="text-xl font-black text-indigo-700">
                {profile.name?.charAt(0).toUpperCase() || 'S'}
              </Text>
            </View>
          </View>

          {/* 2. Today's Roll Call Check-in Card */}
          <View className="bg-white border border-[#E2E8F0] rounded-3xl p-5 shadow-sm mb-6">
            <View className="flex-row items-center justify-between mb-4">
              <View className="flex-row items-center">
                <View className="p-2.5 bg-indigo-50 border border-indigo-100 rounded-xl mr-3">
                  <Clock size={18} color={primaryColor} />
                </View>
                <View>
                  <Text className="font-extrabold text-sm text-[#0F172A]">Daily Attendance Roll Call</Text>
                  <Text className="text-[10px] text-[#64748B] mt-0.5">
                    Today: {new Date().toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                  </Text>
                </View>
              </View>
              <TouchableOpacity onPress={() => router.push('/(tabs)/history')}>
                <Text className="text-[10px] font-black text-[#4F46E5]">View Logs</Text>
              </TouchableOpacity>
            </View>

            {todayRecords.length > 0 ? (
              <View className="space-y-3">
                {todayRecords.map((record: any, index: number) => (
                  <View key={index} className="flex-row items-center justify-between py-3.5 px-4 bg-emerald-50/50 border border-emerald-100 rounded-2xl">
                    <View className="flex-row items-center">
                      <View className="w-8 h-8 bg-emerald-100/50 rounded-full items-center justify-center mr-3">
                        <CheckCircle2 size={16} color="#059669" />
                      </View>
                      <View>
                        <Text className="text-xs font-bold text-[#0F172A] uppercase tracking-wider">{record.subject || 'Class'}</Text>
                        <Text className="text-[10px] text-[#64748B] mt-0.5">
                          {new Date(record.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </Text>
                      </View>
                    </View>
                    <Text className="text-[10px] font-black text-emerald-700 uppercase tracking-widest bg-emerald-100 px-2.5 py-1 rounded-full">
                      {record.status}
                    </Text>
                  </View>
                ))}
              </View>
            ) : (
              <View className="items-center py-4 bg-amber-50/40 border border-amber-100 rounded-2xl p-5">
                <View className="w-12 h-12 bg-amber-100/50 rounded-full items-center justify-center mb-3">
                  <AlertTriangle size={24} color="#f59e0b" />
                </View>
                <Text className="text-xs font-bold text-amber-700 uppercase tracking-widest bg-amber-100 px-3 py-1 rounded-full">
                  Pending
                </Text>
                <Text className="text-xs text-[#64748B] mt-2.5 font-semibold text-center leading-relaxed">
                  You have not checked in for today's sessions yet.
                </Text>
                
                <TouchableOpacity
                  onPress={() => router.push('/(tabs)/scanner')}
                  activeOpacity={0.8}
                  className="mt-5 w-full py-3.5 bg-[#4F46E5] rounded-xl flex-row items-center justify-center shadow-md shadow-indigo-600/10"
                >
                  <Camera size={16} color="#ffffff" style={{ marginRight: 6 }} />
                  <Text className="text-white font-black text-xs uppercase tracking-wider">Scan Attendance QR</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* 3. Module Progress Rings */}
          <View className="bg-white border border-[#E2E8F0] rounded-3xl p-5 shadow-sm mb-6">
            <Text className="font-extrabold text-sm text-[#0F172A] mb-4">Module Progress</Text>
            <View className="flex-row justify-between">
              <ProgressRing
                percent={progress.aptitude}
                label="Aptitude"
                color={primaryColor}
                trackColor="#F1EBFB"
              />
              <ProgressRing
                percent={progress.communication}
                label="Comms"
                color="#F59E0B"
                trackColor="#FEF3C7"
              />
              <ProgressRing
                percent={progress.technical}
                label="Technical"
                color="#8B5CF6"
                trackColor="#EDE9FE"
              />
            </View>
          </View>

          {/* 4. Assigned Cohorts & Trainers */}
          <Text className="text-[10px] font-black text-[#64748B] uppercase tracking-wider mb-4 mt-2">Assigned Cohorts & Trainers</Text>

          {/* Technical Domain */}
          <View className="mb-4 bg-white border border-[#E2E8F0] rounded-3xl p-5 shadow-sm">
            <View className="flex-row items-center mb-4">
              <View className="p-2.5 bg-indigo-50 border border-indigo-100 rounded-xl mr-3">
                <CalendarDays size={18} color={primaryColor} />
              </View>
              <View className="flex-1">
                <Text className="font-extrabold text-sm text-[#0F172A]">Technical Training</Text>
                <Text className="text-[10px] text-[#64748B]">Core technology track</Text>
              </View>
            </View>
            <View className="space-y-2.5 pt-1 text-xs">
              <View className="flex-row justify-between items-start border-b pb-2.5 border-[#F1F5F9] mb-2">
                <Text className="font-semibold text-[#64748B] mt-0.5">Assigned Batch:</Text>
                <Text className="font-bold text-[#0F172A] flex-1 text-right ml-4">{profile.technicalBatch || 'Unassigned'}</Text>
              </View>
              <View className="flex-row justify-between items-start pb-1">
                <Text className="font-semibold text-[#64748B] mt-0.5">Trainer:</Text>
                <Text className="font-bold text-indigo-700 flex-1 text-right ml-4">{profile.technicalTrainer || 'Unassigned'}</Text>
              </View>
            </View>
          </View>

          {/* Communication Domain */}
          <View className="mb-4 bg-white border border-[#E2E8F0] rounded-3xl p-5 shadow-sm">
            <View className="flex-row items-center mb-4">
              <View className="p-2.5 bg-indigo-50 border border-indigo-100 rounded-xl mr-3">
                <CalendarDays size={18} color={primaryColor} />
              </View>
              <View className="flex-1">
                <Text className="font-extrabold text-sm text-[#0F172A]">Communication Skills</Text>
                <Text className="text-[10px] text-[#64748B]">Soft skills & interview prep</Text>
              </View>
            </View>
            <View className="space-y-2.5 pt-1 text-xs">
              <View className="flex-row justify-between items-start border-b pb-2.5 border-[#F1F5F9] mb-2">
                <Text className="font-semibold text-[#64748B] mt-0.5">Assigned Batch:</Text>
                <Text className="font-bold text-[#0F172A] flex-1 text-right ml-4">{profile.communicationBatch || 'Unassigned'}</Text>
              </View>
              <View className="flex-row justify-between items-start pb-1">
                <Text className="font-semibold text-[#64748B] mt-0.5">Trainer:</Text>
                <Text className="font-bold text-indigo-700 flex-1 text-right ml-4">{profile.communicationTrainer || 'Unassigned'}</Text>
              </View>
            </View>
          </View>

          {/* Aptitude Domain */}
          <View className="mb-4 bg-white border border-[#E2E8F0] rounded-3xl p-5 shadow-sm">
            <View className="flex-row items-center mb-4">
              <View className="p-2.5 bg-indigo-50 border border-indigo-100 rounded-xl mr-3">
                <CalendarDays size={18} color={primaryColor} />
              </View>
              <View className="flex-1">
                <Text className="font-extrabold text-sm text-[#0F172A]">Aptitude & Reasoning</Text>
                <Text className="text-[10px] text-[#64748B]">Quantitative & analytical prep</Text>
              </View>
            </View>
            <View className="space-y-2.5 pt-1 text-xs">
              <View className="flex-row justify-between items-start border-b pb-2.5 border-[#F1F5F9] mb-2">
                <Text className="font-semibold text-[#64748B] mt-0.5">Assigned Batch:</Text>
                <Text className="font-bold text-[#0F172A] flex-1 text-right ml-4">{profile.aptitudeBatch || 'Unassigned'}</Text>
              </View>
              <View className="flex-row justify-between items-start pb-1">
                <Text className="font-semibold text-[#64748B] mt-0.5">Trainer:</Text>
                <Text className="font-bold text-indigo-700 flex-1 text-right ml-4">{profile.aptitudeTrainer || 'Unassigned'}</Text>
              </View>
            </View>
          </View>
          
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
