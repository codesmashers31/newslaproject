import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  StatusBar,
  TouchableOpacity
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { 
  Briefcase, 
  MapPin, 
  ChevronRight, 
  Sparkles, 
  Brain, 
  MessageSquare, 
  Cpu, 
  FileCheck, 
  Code2, 
  Gamepad2, 
  Award,
  Bell
} from 'lucide-react-native';
import API from '../../services/api';
import { ScreenSkeleton } from '../../components/Skeleton';

export default function CareerScreen() {
  const primary = '#4F46E5';
  const muted = '#64748B';

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
      <ScreenSkeleton variant="career" />
    );
  }

  const readinessPercent = data?.placementReadiness?.percentage ?? 0;

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

  // AI & learning tools list (6 small cards)
  const aiTools = [
    { id: 'ai-apt', name: 'AI Aptitude', desc: 'Quantitative mock tests', color: '#4F46E5', bgColor: '#EEF2F6', icon: Brain },
    { id: 'ai-comm', name: 'AI Communication', desc: 'Speech & tone analysis', color: '#D97706', bgColor: '#FEF3C7', icon: MessageSquare },
    { id: 'ai-tech', name: 'Technical AI', desc: 'Code review assistant', color: '#7C3AED', bgColor: '#F5F3FF', icon: Cpu },
    { id: 'ai-ats', name: 'Resume ATS Checker', desc: 'Match resume keywords', color: '#0D9488', bgColor: '#F0FDFA', icon: FileCheck },
    { id: 'ai-code', name: 'Code Challenging', desc: 'Interactive coding battles', color: '#E11D48', bgColor: '#FFF1F2', icon: Code2 },
    { id: 'ai-game', name: 'Game Zone', desc: 'Logic & IQ puzzles', color: '#2563EB', bgColor: '#EFF6FF', icon: Gamepad2 }
  ];

  // Recent placed students
  const placedStudents = [
    { id: 1, name: 'Sakthi S', company: 'Zoho Corp', pkg: '₹8.5 LPA', role: 'Associate Developer', batch: 'Batch 14', init: 'S', color: '#F5F3FF', textColor: '#7C3AED' },
    { id: 2, name: 'Janani K', company: 'Accenture', pkg: '₹6.5 LPA', role: 'System Engineer', batch: 'Batch 12', init: 'J', color: '#EEF2F6', textColor: '#4F46E5' },
    { id: 3, name: 'Arun Kumar', company: 'TCS', pkg: '₹5.5 LPA', role: 'System Engineer', batch: 'Batch 11', init: 'A', color: '#FEF3C7', textColor: '#D97706' },
    { id: 4, name: 'Naveen R', company: 'Cognizant', pkg: '₹4.8 LPA', role: 'Analyst', batch: 'Batch 10', init: 'N', color: '#F0FDFA', textColor: '#0D9488' }
  ];

  return (
    <SafeAreaView className="flex-1 bg-[#F8FAFC]">
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View className="px-6 py-5 border-b border-[#E2E8F0] bg-white flex-row items-center gap-3.5">
        <View className="p-2.5 bg-emerald-50 rounded-2xl border border-emerald-100/50">
          <Briefcase size={20} color="#0D9488" />
        </View>
        <View>
          <Text className="text-2xl font-black text-[#0F172A]">Career Portal</Text>
          <Text className="text-xs text-[#64748B] mt-0.5">Explore placements, mock tests, and AI tools</Text>
        </View>
      </View>

      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={primary} />}
        className="flex-1 px-6 py-4"
        showsVerticalScrollIndicator={false}
      >
        
        {/* 1. Announcements Ads Card */}
        <View className="bg-[#4F46E5] rounded-3xl p-5 mb-6 shadow-md shadow-indigo-600/10 relative overflow-hidden">
          <View className="flex-row items-center gap-2">
            <Bell size={14} color="#C7D2FE" />
            <Text className="text-[10px] font-black text-[#C7D2FE] uppercase tracking-widest">PLACEMENT AD & NEWS</Text>
          </View>
          <Text className="text-lg font-black text-white mt-1.5 leading-snug">
            Campus Hiring Drive starts this week!
          </Text>
          <Text className="text-xs text-[#E0E7FF] mt-2 font-semibold leading-relaxed">
            Over 12 companies are recruiting for Frontend, QA, and backend developer tracks. Set up your resume now!
          </Text>
          
          <View className="flex-row items-center justify-between mt-4 border-t border-indigo-400/30 pt-3">
            <View>
              <Text className="text-[10px] text-[#C7D2FE] font-bold">Your Readiness Score</Text>
              <Text className="text-base font-black text-white mt-0.5">{readinessPercent}% Ready</Text>
            </View>
            <TouchableOpacity className="bg-white/10 px-4 py-2 rounded-xl border border-white/20">
              <Text className="text-white text-xs font-black">View Calendar</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 2. 6 AI & Learning Tools Cards */}
        <View className="mb-6">
          <Text className="text-base font-black text-[#0F172A] mb-4">AI & Learning Tools</Text>
          
          <View className="flex-row flex-wrap justify-between gap-y-4">
            {aiTools.map((tool) => {
              const IconComp = tool.icon;
              return (
                <TouchableOpacity
                  key={tool.id}
                  style={{ width: '48%' }}
                  className="bg-white border border-[#E2E8F0] rounded-3xl p-4 shadow-sm items-center text-center justify-between min-h-[142px]"
                >
                  <View 
                    style={{ backgroundColor: tool.bgColor }} 
                    className="w-10 h-10 rounded-2xl items-center justify-center mb-3 border border-slate-100"
                  >
                    <IconComp size={20} color={tool.color} />
                  </View>
                  <View className="items-center">
                    <Text className="text-xs font-black text-[#0F172A] text-center">{tool.name}</Text>
                    <Text className="text-[9px] text-[#64748B] font-semibold text-center mt-1 leading-normal">
                      {tool.desc}
                    </Text>
                  </View>
                  <View className="bg-slate-100 border border-slate-200/50 px-2 py-0.5 rounded-full mt-2.5">
                    <Text className="text-[#64748B] text-[8px] font-black uppercase tracking-wider">Coming Soon</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* 3. Recent Placed Students Cards */}
        <View className="mb-6">
          <Text className="text-base font-black text-[#0F172A] mb-4">Recent Placed Students</Text>
          
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 16, paddingRight: 20 }}
          >
            {placedStudents.map((stud) => (
              <View 
                key={stud.id} 
                className="bg-white border border-[#E2E8F0] rounded-3xl p-4 shadow-sm min-w-[200px]"
              >
                <View className="flex-row items-center gap-3 mb-3">
                  <View 
                    style={{ backgroundColor: stud.color }} 
                    className="w-9 h-9 rounded-full items-center justify-center border border-slate-100"
                  >
                    <Text style={{ color: stud.textColor }} className="text-sm font-black">{stud.init}</Text>
                  </View>
                  <View>
                    <Text className="text-xs font-black text-[#0F172A]">{stud.name}</Text>
                    <Text className="text-[9px] text-[#64748B] font-semibold">{stud.role} • {stud.batch}</Text>
                  </View>
                </View>
                <View className="border-t border-[#F1F5F9] pt-2.5 flex-row justify-between items-center">
                  <View>
                    <Text className="text-[8px] text-[#64748B] font-bold uppercase tracking-wider">Company</Text>
                    <Text className="text-[11px] font-black text-[#0F172A] mt-0.5">{stud.company}</Text>
                  </View>
                  <View className="items-end">
                    <Text className="text-[8px] text-[#64748B] font-bold uppercase tracking-wider">Package</Text>
                    <Text className="text-[11px] font-black text-emerald-700 mt-0.5">{stud.pkg}</Text>
                  </View>
                </View>
              </View>
            ))}
          </ScrollView>
        </View>

        {/* 4. Job Listings List */}
        <View className="mb-10">
          <Text className="text-base font-black text-[#0F172A] mb-4">Job Listings</Text>

          <View className="gap-4">
            {jobs.map((job) => (
              <View key={job.id} className="bg-white border border-[#E2E8F0] rounded-3xl p-5 shadow-sm">
                {/* Header row with Title & Badge */}
                <View className="flex-row justify-between items-start mb-2.5">
                  <Text className="text-sm font-black text-[#0F172A] flex-1 pr-4">{job.title}</Text>
                  <Text className="text-[9px] font-black text-emerald-700 uppercase tracking-widest bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100">
                    {job.status}
                  </Text>
                </View>

                {/* Company & Details */}
                <Text className="text-xs font-extrabold text-[#64748B]">{job.company}</Text>
                
                <View className="flex-row items-center gap-4 mt-3 pb-3 border-b border-[#F1F5F9]">
                  <View className="flex-row items-center gap-1">
                    <MapPin size={12} color={muted} />
                    <Text className="text-[10px] font-semibold text-[#64748B]">{job.location}</Text>
                  </View>
                  <View className="flex-row items-center gap-1">
                    <Briefcase size={12} color={muted} />
                    <Text className="text-[10px] font-semibold text-[#64748B]">{job.salary}</Text>
                  </View>
                </View>

                {/* Bottom row with deadline and Apply button */}
                <View className="flex-row justify-between items-center mt-3">
                  <Text className="text-[10px] font-bold text-[#64748B]">{job.deadline}</Text>
                  <TouchableOpacity 
                    className={`px-4.5 py-2 rounded-xl ${job.actionType === 'primary' ? 'bg-[#4F46E5]' : 'border border-[#E2E8F0] bg-white'}`}
                  >
                    <Text className={`text-xs font-black ${job.actionType === 'primary' ? 'text-white' : 'text-[#64748B]'}`}>
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
