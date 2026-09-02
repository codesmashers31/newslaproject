import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  StatusBar,
  TouchableOpacity,
  Modal,
  TextInput,
  ActivityIndicator
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
  Bell,
  Calendar,
  Zap,
  CheckCircle2,
  X,
  Clock,
  RotateCcw
} from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';
import API from '../../services/api';
import { ScreenSkeleton } from '../../components/Skeleton';
import AppHeader from '../../components/AppHeader';

export default function CareerScreen() {
  const primary = '#4F46E5';
  const muted = '#64748B';

  const [data, setData] = useState<any>(null);
  const [readiness, setReadiness] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Active Interactive Modal
  const [activeModal, setActiveModal] = useState<string | null>(null);

  // Aptitude Solver State
  const [solverQuestion, setSolverQuestion] = useState('');
  const [solving, setSolving] = useState(false);
  const [solverResult, setSolverResult] = useState<any>(null);

  // Timetable State
  const [timetable, setTimetable] = useState<any>(null);

  React.useEffect(() => {
    const loadCache = async () => {
      try {
        const cached = await AsyncStorage.getItem('cached_career_data');
        if (cached) {
          setData(JSON.parse(cached));
          setLoading(false);
        }
      } catch (e) {}
    };
    loadCache();
  }, []);

  const loadData = async () => {
    try {
      const [dashRes, readRes, timeRes] = await Promise.all([
        API.get('/student/dashboard'),
        API.get('/ai/readiness-score'),
        API.get('/timetable/my')
      ]);

      if (dashRes.data) {
        setData(dashRes.data);
        AsyncStorage.setItem('cached_career_data', JSON.stringify(dashRes.data)).catch(() => {});
      }
      if (readRes.data?.data) setReadiness(readRes.data.data);
      if (timeRes.data?.data) setTimetable(timeRes.data.data);
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

  const handleSolveAptitude = async () => {
    if (!solverQuestion.trim()) {
      Toast.show({ type: 'error', text1: 'Missing Input', text2: 'Please enter a math question.' });
      return;
    }
    setSolving(true);
    try {
      const { data } = await API.post('/aptitude/solve-question', { questionText: solverQuestion });
      if (data?.data) {
        setSolverResult(data.data);
        Toast.show({ type: 'success', text1: 'Deconstructed!', text2: 'Root-cause analysis ready.' });
      }
    } catch (err: any) {
      Toast.show({ type: 'error', text1: 'Error', text2: 'Failed to solve question.' });
    } finally {
      setSolving(false);
    }
  };

  const handleMarkAllSlots = async () => {
    try {
      const todayStr = new Date().toISOString().split('T')[0];
      const { data } = await API.post('/timetable/my/check-all', { date: todayStr });
      if (data?.data) {
        setTimetable(data.data);
        Toast.show({ type: 'success', text1: 'Routine Completed!', text2: '+25 Bonus XP Earned!' });
      }
    } catch (err: any) {
      Toast.show({ type: 'error', text1: 'Error', text2: 'Failed to update slots.' });
    }
  };

  if (loading) {
    return <ScreenSkeleton variant="career" />;
  }

  const readinessPercent = readiness?.overallScore ?? (data?.placementReadiness?.percentage ?? 50);

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

  const aiTools = [
    { id: 'ai-timetable', name: 'Study Timetable', desc: 'Routines & streak rewards', color: '#4F46E5', bgColor: '#EEF2F6', icon: Calendar, tag: 'LIVE' },
    { id: 'ai-apt', name: 'AI Aptitude', desc: 'Root-cause math solver', color: '#059669', bgColor: '#ECFDF5', icon: Brain, tag: 'LIVE' },
    { id: 'ai-comm', name: 'AI Communication', desc: 'Speech & tone analysis', color: '#D97706', bgColor: '#FEF3C7', icon: MessageSquare, tag: 'LIVE' },
    { id: 'ai-mock', name: 'Mock Simulator', desc: 'Role-based interview drills', color: '#7C3AED', bgColor: '#F5F3FF', icon: Cpu, tag: 'LIVE' },
    { id: 'ai-ats', name: 'Resume ATS Checker', desc: 'Match resume keywords', color: '#0D9488', bgColor: '#F0FDFA', icon: FileCheck, tag: 'V2' },
    { id: 'ai-code', name: 'Code Challenging', desc: 'Interactive coding battles', color: '#E11D48', bgColor: '#FFF1F2', icon: Code2, tag: 'V2' }
  ];

  const placedStudents = [
    { id: 1, name: 'Sakthi S', company: 'Zoho Corp', pkg: '₹8.5 LPA', role: 'Associate Developer', batch: 'Batch 14', init: 'S', color: '#F5F3FF', textColor: '#7C3AED' },
    { id: 2, name: 'Janani K', company: 'Accenture', pkg: '₹6.5 LPA', role: 'System Engineer', batch: 'Batch 12', init: 'J', color: '#EEF2F6', textColor: '#4F46E5' },
    { id: 3, name: 'Arun Kumar', company: 'TCS', pkg: '₹5.5 LPA', role: 'System Engineer', batch: 'Batch 11', init: 'A', color: '#FEF3C7', textColor: '#D97706' },
    { id: 4, name: 'Naveen R', company: 'Cognizant', pkg: '₹4.8 LPA', role: 'Analyst', batch: 'Batch 10', init: 'N', color: '#F0FDFA', textColor: '#0D9488' }
  ];

  return (
    <SafeAreaView className="flex-1 bg-[#F8FAFC]">
      <StatusBar barStyle="dark-content" />

      {/* Universal Fixed Top Navbar */}
      <AppHeader title="Career Portal" subtitle="Explore placements, mock tests, and AI tools" showBack={true} onRefreshData={loadData} />

      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={primary} />}
        className="flex-1 px-5 py-4"
        contentContainerStyle={{ paddingBottom: 110 }}
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
            <View className="bg-white/10 px-3 py-1.5 rounded-xl border border-white/20">
              <Text className="text-white text-xs font-black">{readiness?.tierEligibility || 'Placement Sprint'}</Text>
            </View>
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
                  onPress={() => setActiveModal(tool.id)}
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
                  <View className="bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-full mt-2.5">
                    <Text className="text-indigo-700 text-[8px] font-black uppercase tracking-wider">{tool.tag}</Text>
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
                <View className="flex-row justify-between items-start mb-2.5">
                  <Text className="text-sm font-black text-[#0F172A] flex-1 pr-4">{job.title}</Text>
                  <Text className="text-[9px] font-black text-emerald-700 uppercase tracking-widest bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100">
                    {job.status}
                  </Text>
                </View>

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

      {/* AI APTITUDE MODAL */}
      <Modal visible={activeModal === 'ai-apt'} animationType="slide" transparent>
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-white rounded-t-[32px] p-6 max-h-[85%]">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-lg font-black text-slate-900">AI Root-Cause Aptitude Solver</Text>
              <TouchableOpacity onPress={() => setActiveModal(null)} className="p-2">
                <X size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <TextInput
              multiline
              numberOfLines={3}
              value={solverQuestion}
              onChangeText={setSolverQuestion}
              placeholder="Paste any aptitude problem (e.g. A takes 10 days, B takes 15 days...)"
              className="border border-slate-200 rounded-2xl p-4 text-xs font-medium text-slate-800 mb-3"
            />

            <TouchableOpacity
              onPress={handleSolveAptitude}
              disabled={solving}
              className="bg-indigo-600 rounded-2xl py-3.5 items-center justify-center mb-4"
            >
              {solving ? <ActivityIndicator color="#fff" /> : <Text className="text-white text-xs font-black">Deconstruct Math with AI</Text>}
            </TouchableOpacity>

            {solverResult && (
              <ScrollView className="max-h-64 border-t border-slate-100 pt-3">
                <Text className="text-xs font-black text-indigo-700 uppercase">{solverResult.topicIdentified}</Text>
                <Text className="text-xs font-bold text-slate-800 mt-1">Formula: {solverResult.formulaUsed}</Text>
                <Text className="text-xs text-amber-900 font-bold mt-2 bg-amber-50 p-2.5 rounded-xl">⚡ Shortcut: {solverResult.shortcutTrick}</Text>
                <Text className="text-xs text-emerald-800 font-black mt-2">Final Answer: {solverResult.finalAnswer}</Text>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* STUDY TIMETABLE MODAL */}
      <Modal visible={activeModal === 'ai-timetable'} animationType="slide" transparent>
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-white rounded-t-[32px] p-6 max-h-[85%]">
            <View className="flex-row justify-between items-center mb-4">
              <View>
                <Text className="text-lg font-black text-slate-900">Daily Study Timetable</Text>
                <Text className="text-xs text-indigo-600 font-bold">{timetable?.xpPoints || 0} XP • {timetable?.streak || 0} Day Streak</Text>
              </View>
              <TouchableOpacity onPress={() => setActiveModal(null)} className="p-2">
                <X size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              onPress={handleMarkAllSlots}
              className="bg-indigo-600 rounded-2xl py-3 items-center justify-center mb-4 flex-row gap-2"
            >
              <Zap size={16} color="#fff" />
              <Text className="text-white text-xs font-black">1-Click Mark All Routine (+25 XP)</Text>
            </TouchableOpacity>

            <ScrollView className="max-h-80">
              {timetable?.slots?.map((s: any) => (
                <View key={s.slotId} className="p-3.5 border border-slate-100 rounded-2xl mb-2 bg-slate-50 flex-row justify-between items-center">
                  <View>
                    <Text className="text-[10px] font-black uppercase text-indigo-600">{s.category} • {s.startTime}-{s.endTime}</Text>
                    <Text className="text-xs font-bold text-slate-800 mt-0.5">{s.activity}</Text>
                  </View>
                  <Text className="text-xs font-black text-slate-400">10 XP</Text>
                </View>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}
