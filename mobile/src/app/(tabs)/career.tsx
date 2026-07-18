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

export default function CareerScreen() {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const primary = '#4F46E5';

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
      <View className="flex-1 bg-[#F8FAFC] items-center justify-center">
        <ActivityIndicator size="large" color={primary} />
      </View>
    );
  }

  // Predefined job list matching the screenshot
  const jobs = [
    {
      id: 1,
      title: 'Frontend Developer',
      company: 'Zenith Technologies',
      location: 'Bengaluru',
      salary: '₹6–8 LPA',
      deadline: 'Apply by Jul 28',
      status: 'New',
      actionText: 'Apply',
      actionType: 'primary'
    },
    {
      id: 2,
      title: 'QA Engineer',
      company: 'NovaSoft Pvt Ltd',
      location: 'Pune',
      salary: '₹4.5–6 LPA',
      deadline: 'Apply by Jul 30',
      status: 'Applied',
      actionText: 'View',
      actionType: 'outline'
    },
    {
      id: 3,
      title: 'Backend Developer (Node.js)',
      company: 'Clearwave Systems',
      location: 'Hyderabad',
      salary: '₹7–9 LPA',
      deadline: 'Apply by Aug 2',
      status: 'New',
      actionText: 'Apply',
      actionType: 'primary'
    }
  ];

  return (
    <SafeAreaView className="flex-1 bg-[#F8FAFC]">
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View className="px-6 py-5 border-b border-[#E2E8F0] bg-white">
        <Text className="text-2xl font-black text-[#0F172A]">Career</Text>
        <Text className="text-xs text-[#64748B] mt-0.5">Placement drives & job openings</Text>
      </View>

      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={primary} />}
        className="flex-1 px-6 py-4"
        showsVerticalScrollIndicator={false}
      >
        
        {/* 1. Large Live Placement Drive Banner */}
        <View className="bg-[#4F46E5] rounded-3xl p-6 mb-6 shadow-md shadow-indigo-600/10">
          <Text className="text-[10px] font-black text-[#C7D2FE] uppercase tracking-widest">PLACEMENT DRIVE - LIVE</Text>
          <Text className="text-xl font-black text-white mt-1.5">Campus Hiring Week 2026</Text>
          <Text className="text-xs text-[#E0E7FF] mt-2.5 leading-relaxed font-semibold">
            12 companies - 340+ openings - Ends Aug 5
          </Text>
        </View>

        {/* 2. Three Column Metrics Row */}
        <View className="flex-row gap-3 mb-6">
          <View className="flex-1 bg-white border border-[#E2E8F0] rounded-2xl p-4 items-center shadow-sm">
            <Text className="text-xl font-black text-[#0F172A]">18</Text>
            <Text className="text-[10px] text-[#64748B] font-extrabold uppercase mt-1">Open Jobs</Text>
          </View>
          <View className="flex-1 bg-white border border-[#E2E8F0] rounded-2xl p-4 items-center shadow-sm">
            <Text className="text-xl font-black text-[#0F172A]">6</Text>
            <Text className="text-[10px] text-[#64748B] font-extrabold uppercase mt-1">Applied</Text>
          </View>
          <View className="flex-1 bg-white border border-[#E2E8F0] rounded-2xl p-4 items-center shadow-sm">
            <Text className="text-xl font-black text-[#0F172A]">82%</Text>
            <Text className="text-[10px] text-[#64748B] font-extrabold uppercase mt-1">Readiness</Text>
          </View>
        </View>

        {/* 3. Job Listings List */}
        <View className="mb-10">
          <Text className="text-base font-black text-[#0F172A] mb-4">Job Listings</Text>

          <View className="space-y-4">
            {jobs.map((job) => (
              <View key={job.id} className="bg-white border border-[#E2E8F0] rounded-3xl p-5 shadow-sm">
                
                {/* Header row with Title & Badge */}
                <View className="flex-row justify-between items-start mb-2.5">
                  <Text className="text-sm font-black text-[#0F172A] flex-1 pr-4">{job.title}</Text>
                  
                  <View className={`px-2.5 py-1 rounded-full ${
                    job.status === 'New' 
                      ? 'bg-[#F3E8FF] border border-[#E9D5FF]/30' 
                      : 'bg-[#EEF2F6] border border-[#E2E8F0]'
                  }`}>
                    <Text className={`text-[9px] font-black uppercase tracking-wider ${
                      job.status === 'New' ? 'text-[#8B5CF6]' : 'text-[#64748B]'
                    }`}>
                      {job.status}
                    </Text>
                  </View>
                </View>

                {/* Subtext info */}
                <Text className="text-[11px] text-[#64748B] font-semibold leading-relaxed">
                  {job.company} • {job.location} • {job.salary}
                </Text>
                
                {/* Action button & Deadline Row */}
                <View className="flex-row justify-between items-center mt-4 pt-4 border-t border-[#F1F5F9]">
                  <Text className="text-[10px] text-[#94A3B8] font-bold">{job.deadline}</Text>
                  
                  <TouchableOpacity className={`px-4.5 py-2.5 rounded-xl ${
                    job.actionType === 'primary' 
                      ? 'bg-[#4F46E5]' 
                      : 'bg-white border border-[#E2E8F0]'
                  }`}>
                    <Text className={`text-xs font-black ${
                      job.actionType === 'primary' ? 'white' : '#0F172A'
                    }`} style={{ color: job.actionType === 'primary' ? '#FFF' : '#0F172A' }}>
                      {job.actionText}
                    </Text>
                  </TouchableOpacity>
                </View>

              </View>
            ))}
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}
