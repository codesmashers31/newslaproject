import React, { useState, useCallback } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  RefreshControl,
  StatusBar,
  TextInput,
  Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import API from '../../services/api';
import { ScreenSkeleton } from '../../components/Skeleton';
import { 
  Clock, 
  CheckCircle2, 
  Camera, 
  LogOut, 
  Sparkles,
  Search,
  Mic,
  Compass,
  Award,
  History,
  User,
  ChevronRight,
  BookOpen,
  Phone,
  MessageCircle,
  Languages,
  Bell
} from 'lucide-react-native';
import { Image } from 'expo-image';
import Svg, { Defs, LinearGradient, Stop, Rect } from 'react-native-svg';
import ProgressRing from '../../components/ProgressRing';

const { width } = Dimensions.get('window');
const CAROUSEL_WIDTH = width - 48;

export default function DashboardScreen() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
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
      <ScreenSkeleton variant="dashboard" />
    );
  }

  const profile = data?.profile?.user || {};
  const studentProfile = data?.profile || {};
  const userPhoto = studentProfile.photo || profile.photo;
  
  const getServerRoot = () => {
    const base = API.defaults.baseURL;
    if (base) {
      const root = base.replace('/api', '');
      return root.endsWith('/') ? root.slice(0, -1) : root;
    }
    return 'https://newslaproject.onrender.com';
  };

  const photoUri = userPhoto ? (userPhoto.startsWith('http') ? userPhoto : `${getServerRoot()}${userPhoto.startsWith('/') ? '' : '/'}${userPhoto}`) : null;

  const batch = data?.batch || {};
  const todayRecords = data?.attendance?.todayRecords || [];
  const progress = data?.progress || { aptitude: 0, communication: 0, technical: 0 };

  // Calculate profile completeness
  let completedFields = 0;
  const totalFields = 8;
  if (studentProfile.collegeName) completedFields++;
  if (studentProfile.degree) completedFields++;
  if (studentProfile.department) completedFields++;
  if (studentProfile.yearOfPassing) completedFields++;
  if (studentProfile.photo || profile.photo) completedFields++;
  if (studentProfile.resumeUrl) completedFields++;
  if (studentProfile.linkedin) completedFields++;
  if (studentProfile.github) completedFields++;

  // Interactive Banners data for horizontal scroll
  const banners = [
    {
      id: 1,
      title: 'Complete Profile',
      desc: 'Unlock placement opportunities by keeping your profile updated.',
      bgClass: 'bg-indigo-600',
      btnText: 'Edit Profile',
      tag: 'PLACEMENT READY',
      icon: <User size={24} color="#ffffff" />,
      onPress: () => router.push('/(tabs)/profile')
    },
    {
      id: 2,
      title: 'AI Career Coach',
      desc: 'Get your custom training roadmaps and career benchmarks.',
      bgClass: 'bg-violet-700',
      btnText: 'View Roadmap',
      tag: 'NEW FEATURE',
      icon: <Compass size={24} color="#ffffff" />,
      onPress: () => router.push('/(tabs)/career')
    },
    {
      id: 3,
      title: 'Digital Attendance',
      desc: 'Check in to training lectures by scanning room QR codes.',
      bgClass: 'bg-emerald-600',
      btnText: 'Scan Attendance',
      tag: 'DAILY ROLL CALL',
      icon: <Camera size={24} color="#ffffff" />,
      onPress: () => router.push('/(tabs)/scanner')
    }
  ];

  return (
    <SafeAreaView className="flex-1 bg-[#F8FAFC]">
      <StatusBar barStyle="dark-content" translucent backgroundColor="transparent" />
      
      <ScrollView 
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={primaryColor} />
        }
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        
        {/* 2. Top Fluid Pastel Gradient Aura (SVG based for max compatibility) */}
        <View className="absolute top-0 left-0 right-0 h-[280px]">
          <Svg height="100%" width="100%">
            <Defs>
              <LinearGradient id="topGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <Stop offset="0%" stopColor="#DDEBFC" stopOpacity="1" />
                <Stop offset="50%" stopColor="#ECE9FD" stopOpacity="1" />
                <Stop offset="100%" stopColor="#FDE6F2" stopOpacity="1" />
              </LinearGradient>
            </Defs>
            <Rect width="100%" height="100%" fill="url(#topGradient)" />
          </Svg>
        </View>

        {/* 3. Top Header Row (Transparent to let gradient show through) */}
        <View className="flex-row justify-between items-center px-6 pt-4 pb-2 z-10">
          <View className="flex-row items-center gap-2">
            <Image
              source={require('../../../assets/images/branding/logo-buildx.png')}
              style={{ height: 44, width: 44 }}
              contentFit="contain"
            />
            <Text className="text-xl font-black text-slate-800 tracking-tight">SLA Portal</Text>
          </View>
          
          {/* Quick Utility Icon Row (WhatsApp, Language, Bell, Sign Out) */}
          <View className="flex-row items-center gap-3">
            {/* WhatsApp */}
            <TouchableOpacity className="w-8 h-8 bg-[#25D366]/10 rounded-full items-center justify-center border border-[#25D366]/20">
              <MessageCircle size={16} color="#25D366" />
            </TouchableOpacity>

            {/* Language */}
            <TouchableOpacity className="w-8 h-8 bg-white/40 rounded-full items-center justify-center border border-white/60">
              <Languages size={16} color="#475569" />
            </TouchableOpacity>

            {/* Bell/Notification */}
            <TouchableOpacity className="w-8 h-8 bg-white/40 rounded-full items-center justify-center border border-white/60 relative">
              <Bell size={16} color="#475569" />
              <View className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white" />
            </TouchableOpacity>

            {/* Sign Out */}
            <TouchableOpacity 
              onPress={handleSignOut}
              className="w-8 h-8 bg-red-500/10 rounded-full items-center justify-center border border-red-500/20"
            >
              <LogOut size={14} color="#EF4444" />
            </TouchableOpacity>
          </View>
        </View>

        {/* 4. Top Interactive Search Bar (matching Aadhaar search bar) */}
        <View className="px-6 mt-3 z-10">
          <View className="flex-row items-center bg-white border border-white/40 rounded-2xl px-4 py-3.5 shadow-md shadow-slate-200/50">
            <Search size={18} color="#94A3B8" style={{ marginRight: 10 }} />
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder='Search for training topics, tests or history...'
              placeholderTextColor="#94A3B8"
              className="flex-1 text-slate-800 text-xs font-semibold"
            />
            <Mic size={18} color="#4F46E5" />
          </View>
        </View>

        {/* 5. Greeting Row */}
        <View className="px-6 mt-5 flex-row justify-between items-center z-10">
          <View>
            <Text className="text-slate-500 text-[10px] font-black uppercase tracking-wider">Welcome Back</Text>
            <Text className="text-xl font-black text-slate-800 mt-0.5">👋 Hey, {profile.name || profile.mobile || 'Student'}</Text>
          </View>
          <View className="w-11 h-11 bg-white rounded-full items-center justify-center border border-white/80 overflow-hidden relative shadow-md shadow-indigo-600/5">
            {photoUri ? (
              <Image source={{ uri: photoUri }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
            ) : (
              <Text className="text-base font-black text-indigo-700">
                {(profile.name || 'S').charAt(0).toUpperCase()}
              </Text>
            )}
          </View>
        </View>

        {/* 6. Horizontal Paged Carousel Banners */}
        <View className="mt-5 z-10">
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 24, gap: 16 }}
            snapToInterval={CAROUSEL_WIDTH + 16}
            decelerationRate="fast"
          >
            {banners.map((item) => (
              <TouchableOpacity
                key={item.id}
                onPress={item.onPress}
                activeOpacity={0.95}
                style={{ width: CAROUSEL_WIDTH }}
                className={`rounded-3xl p-5 ${item.bgClass} shadow-md overflow-hidden relative min-h-[145px]`}
              >
                {/* Decorative absolute background shape */}
                <View className="absolute -right-6 -top-6 w-28 h-28 bg-white/10 rounded-full" />
                <View className="absolute -left-6 -bottom-6 w-20 h-20 bg-black/10 rounded-full" />

                <View className="flex-1 pr-6 justify-between">
                  <View>
                    <View className="bg-white/20 self-start px-2.5 py-0.5 rounded-full mb-2.5">
                      <Text className="text-white text-[9px] font-black tracking-widest uppercase">{item.tag}</Text>
                    </View>
                    <Text className="text-white text-base font-black leading-tight">{item.title}</Text>
                    <Text className="text-white/80 text-[11px] font-semibold mt-1 leading-normal">{item.desc}</Text>
                  </View>

                  <View className="flex-row justify-between items-center mt-4">
                    <View className="bg-white px-4 py-2 rounded-xl">
                      <Text className={`text-[10px] font-black uppercase tracking-wider text-slate-800`}>{item.btnText}</Text>
                    </View>
                    <View className="w-9 h-9 bg-white/20 rounded-xl items-center justify-center">
                      {item.icon}
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* 8. Main Feature List Cards */}
        <View className="px-6 mt-7 gap-6">
          
          {/* Card A: Complete Profile Progress Card (Pink-Purple Gradient Style) */}
          <TouchableOpacity 
            onPress={() => router.push('/(tabs)/profile')}
            activeOpacity={0.9} 
            className="bg-white border border-[#E2E8F0] rounded-3xl p-5 shadow-sm overflow-hidden relative flex flex-row items-center"
          >
            {/* Soft pink gradient absolute background styling using SVG */}
            <View className="absolute top-0 bottom-0 left-0 right-0">
              <Svg height="100%" width="100%">
                <Defs>
                  <LinearGradient id="pinkGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <Stop offset="0%" stopColor="#FFF1F2" stopOpacity="1" />
                    <Stop offset="100%" stopColor="#F5F3FF" stopOpacity="0.8" />
                  </LinearGradient>
                </Defs>
                <Rect width="100%" height="100%" fill="url(#pinkGrad)" />
              </Svg>
            </View>
            
            <View className="flex-1 pr-4 z-10">
              <View className="flex-row items-center mb-1">
                <Sparkles size={11} color="#EC4899" style={{ marginRight: 4 }} />
                <Text className="text-[9px] font-black uppercase tracking-widest text-[#EC4899]">Profile Completeness</Text>
              </View>
              <Text className="text-base font-black text-slate-800 leading-tight">Complete Placement Profile</Text>
              <Text className="text-slate-500 text-[11px] font-semibold mt-1 leading-normal">
                Finish all sections to share your details with recruiters.
              </Text>
              
              <TouchableOpacity 
                onPress={() => router.push('/(tabs)/profile')}
                className="bg-white border border-[#E2E8F0] px-4 py-2 rounded-xl self-start mt-4 shadow-xs"
              >
                <Text className="text-[#EC4899] text-[10px] font-extrabold uppercase tracking-wider">Update Profile</Text>
              </TouchableOpacity>
            </View>

            {/* Circular Progress Ring Mockup */}
            <View className="w-[72px] h-[72px] rounded-full border-[6px] border-slate-100 items-center justify-center relative z-10">
              <View className="absolute top-0 bottom-0 left-0 right-0 rounded-full border-[6px] border-[#EC4899] opacity-20" />
              <Text className="text-base font-black text-[#EC4899]">{completedFields}/{totalFields}</Text>
            </View>
          </TouchableOpacity>

          {/* Card B: Daily Attendance Roll Call Status Card (EPFO Passbook Style) */}
          <View className="bg-slate-900 rounded-3xl p-5 shadow-sm overflow-hidden relative min-h-[150px]">
            <View className="absolute -right-8 -bottom-8 w-28 h-28 bg-[#4F46E5]/20 rounded-full" />
            
            <View className="flex-1 justify-between">
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center">
                  <View className="w-8 h-8 bg-white/10 rounded-xl items-center justify-center mr-3">
                    <Clock size={16} color="#ffffff" />
                  </View>
                  <View>
                    <Text className="text-white text-xs font-black uppercase tracking-wider">Daily Attendance Check-In</Text>
                    <Text className="text-slate-400 text-[9px] font-bold uppercase tracking-wider mt-0.5">
                      Today: {new Date().toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity onPress={() => router.push('/(tabs)/history')}>
                  <Text className="text-[10px] font-extrabold text-[#4F46E5] bg-indigo-50 px-2.5 py-1 rounded-full">View Logs</Text>
                </TouchableOpacity>
              </View>

              {todayRecords.length > 0 ? (
                <View className="mt-4 gap-2.5">
                  {todayRecords.map((record: any, index: number) => (
                    <View key={index} className="flex-row items-center justify-between py-2 px-3.5 bg-white/5 border border-white/10 rounded-xl">
                      <View className="flex-row items-center">
                        <CheckCircle2 size={13} color="#10B981" style={{ marginRight: 8 }} />
                        <Text className="text-white text-xs font-bold uppercase tracking-wider">{record.subject || 'Class'}</Text>
                      </View>
                      <Text className="text-[9px] font-black text-emerald-400 uppercase tracking-widest bg-emerald-500/10 px-2 py-0.5 rounded">
                        {record.status}
                      </Text>
                    </View>
                  ))}
                </View>
              ) : (
                <View className="mt-4">
                  <Text className="text-slate-300 text-[11px] font-semibold leading-relaxed">
                    Check-in is required to track your training sessions. Scan the room QR code to begin.
                  </Text>
                  
                  <TouchableOpacity
                    onPress={() => router.push('/(tabs)/scanner')}
                    activeOpacity={0.8}
                    className="mt-4 w-full py-3.5 bg-[#4F46E5] rounded-xl flex-row items-center justify-center shadow-lg shadow-indigo-600/10"
                  >
                    <Camera size={14} color="#ffffff" style={{ marginRight: 6 }} />
                    <Text className="text-white font-black text-[10px] uppercase tracking-widest">Scan Attendance QR</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>

          {/* Card C: Assigned Training Cohorts Info */}
          <View className="bg-white border border-[#E2E8F0] rounded-3xl p-5 shadow-sm">
            <View className="flex-row items-center mb-4 border-b border-[#F1F5F9] pb-3">
              <BookOpen size={16} color={primaryColor} style={{ marginRight: 8 }} />
              <Text className="font-extrabold text-sm text-[#0F172A]">Assigned Cohorts & Trainers</Text>
            </View>

            <View className="gap-3 text-xs">
              {/* Technical Domain */}
              <View className="flex-row justify-between items-center py-2 border-b border-[#F1F5F9]/50">
                <View>
                  <Text className="font-extrabold text-[11px] text-slate-800">Technical Training</Text>
                  <Text className="text-[10px] text-slate-400 mt-0.5">Trainer: {profile.technicalTrainer || 'Unassigned'}</Text>
                </View>
                <Text className="font-bold text-[10px] text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-xl">
                  {profile.technicalBatch || 'Unassigned'}
                </Text>
              </View>

              {/* Communication Domain */}
              <View className="flex-row justify-between items-center py-2 border-b border-[#F1F5F9]/50">
                <View>
                  <Text className="font-extrabold text-[11px] text-slate-800">Communication Skills</Text>
                  <Text className="text-[10px] text-slate-400 mt-0.5">Trainer: {profile.communicationTrainer || 'Unassigned'}</Text>
                </View>
                <Text className="font-bold text-[10px] text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-xl">
                  {profile.communicationBatch || 'Unassigned'}
                </Text>
              </View>

              {/* Aptitude Domain */}
              <View className="flex-row justify-between items-center py-2">
                <View>
                  <Text className="font-extrabold text-[11px] text-slate-800">Aptitude & Reasoning</Text>
                  <Text className="text-[10px] text-slate-400 mt-0.5">Trainer: {profile.aptitudeTrainer || 'Unassigned'}</Text>
                </View>
                <Text className="font-bold text-[10px] text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-xl">
                  {profile.aptitudeBatch || 'Unassigned'}
                </Text>
              </View>
            </View>
          </View>

          {/* Card D: Module Progress Stats */}
          <View className="bg-white border border-[#E2E8F0] rounded-3xl p-5 shadow-sm">
            <Text className="font-extrabold text-sm text-[#0F172A] mb-4">Module Progress Ring Checks</Text>
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

          {/* Helpline/essential numbers section */}
          <View className="bg-white border border-[#E2E8F0] rounded-3xl p-5 shadow-sm flex-row items-center justify-between">
            <View className="flex-row items-center">
              <View className="p-2.5 bg-slate-50 border border-slate-100 rounded-xl mr-3">
                <Phone size={16} color="#64748B" />
              </View>
              <View>
                <Text className="font-extrabold text-xs text-slate-800">Essential Help Desk Numbers</Text>
                <Text className="text-[10px] text-slate-400 mt-0.5">Reach placement coordinators</Text>
              </View>
            </View>
            <ChevronRight size={18} color="#94A3B8" />
          </View>

        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
