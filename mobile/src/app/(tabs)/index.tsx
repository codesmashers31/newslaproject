import React, { useState, useCallback, useEffect } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  RefreshControl,
  StatusBar,
  TextInput,
  Dimensions,
  Modal,
  Linking
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import API from '../../services/api';
import { ScreenSkeleton } from '../../components/Skeleton';
import AppHeader from '../../components/AppHeader';
import { 
  LANGUAGES, 
  LanguageCode, 
  getStoredLanguage, 
  setStoredLanguage, 
  getText 
} from '../../services/language';
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
  Bell,
  X
} from 'lucide-react-native';
import { Image } from 'expo-image';
import Svg, { Defs, LinearGradient, Stop, Rect } from 'react-native-svg';
import ProgressRing from '../../components/ProgressRing';

const { width } = Dimensions.get('window');
const CAROUSEL_WIDTH = width - 40;

export default function DashboardScreen() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [imageError, setImageError] = useState(false);
  const primaryColor = '#4F46E5';

  const resolveBatchSchedule = (batch: any) => {
    if (!batch) return 'Schedule Not Set';
    if (batch.startTime && batch.endTime) {
      const daysPrefix = batch.days ? `${batch.days} • ` : (batch.scheduleDays ? `${batch.scheduleDays} • ` : '');
      return `${daysPrefix}${batch.startTime} – ${batch.endTime}`;
    }
    if (batch.startTime) {
      const daysPrefix = batch.days ? `${batch.days} • ` : '';
      return `${daysPrefix}${batch.startTime}`;
    }
    if (batch.schedule && typeof batch.schedule === 'string') {
      return batch.schedule;
    }
    return 'Schedule Not Set';
  };

  // Language & Modals
  const [currentLang, setCurrentLang] = useState<LanguageCode>('en');
  const [langModalVisible, setLangModalVisible] = useState(false);
  const [notifModalVisible, setNotifModalVisible] = useState(false);

  useEffect(() => {
    getStoredLanguage().then(setCurrentLang);
  }, []);

  const changeLanguage = async (code: LanguageCode) => {
    setCurrentLang(code);
    await setStoredLanguage(code);
    setLangModalVisible(false);
  };

  // Load cached dashboard instantly for 0ms initial render speed
  useEffect(() => {
    const loadCache = async () => {
      try {
        const cached = await AsyncStorage.getItem('cached_dashboard_data');
        if (cached) {
          setData(JSON.parse(cached));
          setLoading(false);
        }
      } catch (e) {}
    };
    loadCache();
  }, []);

  const loadDashboardData = async () => {
    try {
      const { data: dashboardData } = await API.get('/student/dashboard');
      setData(dashboardData);
      AsyncStorage.setItem('cached_dashboard_data', JSON.stringify(dashboardData)).catch(() => {});
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

  const handleMarkAllRead = async () => {
    try {
      await API.put('/student/notifications/read');
      setData((prev: any) => {
        if (!prev) return prev;
        const updated = (prev.notifications || []).map((n: any) => ({ ...n, isRead: true }));
        const newObj = { ...prev, notifications: updated, unreadNotificationsCount: 0 };
        AsyncStorage.setItem('cached_dashboard_data', JSON.stringify(newObj)).catch(() => {});
        return newObj;
      });
    } catch (e) {}
  };

  const handleMarkSingleRead = async (notifId: string) => {
    try {
      await API.put('/student/notifications/read', { notificationId: notifId });
      setData((prev: any) => {
        if (!prev) return prev;
        const updated = (prev.notifications || []).map((n: any) => 
          n._id === notifId ? { ...n, isRead: true } : n
        );
        const count = updated.filter((n: any) => !n.isRead).length;
        const newObj = { ...prev, notifications: updated, unreadNotificationsCount: count };
        AsyncStorage.setItem('cached_dashboard_data', JSON.stringify(newObj)).catch(() => {});
        return newObj;
      });
    } catch (e) {}
  };

  const handleSignOut = async () => {
    await AsyncStorage.removeItem('student_token');
    await AsyncStorage.removeItem('student_profile');
    router.replace('/login');
  };

  const openWhatsAppSupport = () => {
    Linking.openURL('https://wa.me/919876543210?text=Hello%20SLA%20Portal%20Support').catch(() => {});
  };

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

  useEffect(() => {
    setImageError(false);
  }, [photoUri]);

  if (loading) {
    return (
      <ScreenSkeleton variant="dashboard" />
    );
  }

  const todayRecords = data?.attendance?.todayRecords || [];
  const progress = data?.progress || { aptitude: 0, communication: 0, technical: 0 };
  const notificationsList = data?.notifications || [];
  const unreadCount = data?.unreadNotificationsCount ?? notificationsList.filter((n: any) => !n.isRead).length;

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
      title: getText(currentLang, 'completeProfile'),
      desc: 'Unlock placement opportunities by keeping your profile updated.',
      bgClass: 'bg-indigo-600',
      btnText: getText(currentLang, 'editProfile'),
      tag: getText(currentLang, 'placementReady'),
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
      
      {/* Universal Fixed Top Navbar */}
      <AppHeader title={getText(currentLang, 'portalTitle')} onRefreshData={loadDashboardData} />

      <ScrollView 
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={primaryColor} />
        }
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 110 }}
        showsVerticalScrollIndicator={false}
      >
        
        {/* Top Fluid Pastel Gradient Aura */}
        <View className="absolute top-0 left-0 right-0 h-[280px]">
          <Svg height="100%" width="100%">
            <Defs>
              <LinearGradient id="topGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <Stop offset="0%" stopColor="#DDD6FE" stopOpacity="1" />
                <Stop offset="40%" stopColor="#EEF2FF" stopOpacity="0.8" />
                <Stop offset="100%" stopColor="#F8FAFC" stopOpacity="1" />
              </LinearGradient>
            </Defs>
            <Rect width="100%" height="100%" fill="url(#topGradient)" />
          </Svg>
        </View>

        {/* Greeting Row */}
        <View className="px-5 mt-4 flex-row justify-between items-center z-10">
          <View>
            <Text className="text-slate-500 text-[10px] font-black uppercase tracking-wider">{getText(currentLang, 'welcomeBack')}</Text>
            <Text className="text-xl font-black text-slate-800 mt-0.5">👋 {getText(currentLang, 'hey')}, {profile.name || profile.mobile || 'Student'}</Text>
          </View>
          <View className="w-11 h-11 bg-white rounded-full items-center justify-center border border-white/80 overflow-hidden relative shadow-md shadow-indigo-600/5">
            {photoUri && !imageError ? (
              <Image 
                source={{ uri: photoUri }} 
                style={{ width: '100%', height: '100%' }} 
                contentFit="cover" 
                onError={() => setImageError(true)}
              />
            ) : (
              <Text className="text-base font-black text-indigo-700">
                {(profile.name || 'S').charAt(0).toUpperCase()}
              </Text>
            )}
          </View>
        </View>

        {/* Horizontal Paged Carousel Banners */}
        <View className="mt-5 z-10">
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 20, gap: 14 }}
            snapToInterval={CAROUSEL_WIDTH + 14}
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

        {/* Main Feature Cards */}
        <View className="px-5 mt-6 gap-5">
          
          {/* Card A: Complete Profile Progress Card */}
          <TouchableOpacity 
            onPress={() => router.push('/(tabs)/profile')}
            activeOpacity={0.9} 
            className="bg-white border border-[#E2E8F0] rounded-3xl p-5 shadow-sm overflow-hidden relative flex flex-row items-center"
          >
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
              <Text className="text-base font-black text-slate-800 leading-tight">{getText(currentLang, 'completeProfile')}</Text>
              <Text className="text-slate-500 text-[11px] font-semibold mt-1 leading-normal">
                Finish all sections to share your details with recruiters.
              </Text>
              
              <TouchableOpacity 
                onPress={() => router.push('/(tabs)/profile')}
                className="bg-white border border-[#E2E8F0] px-4 py-2 rounded-xl self-start mt-4 shadow-xs"
              >
                <Text className="text-[#EC4899] text-[10px] font-extrabold uppercase tracking-wider">{getText(currentLang, 'updateProfile')}</Text>
              </TouchableOpacity>
            </View>

            {/* Circular Progress Ring */}
            <View className="w-[72px] h-[72px] rounded-full border-[6px] border-slate-100 items-center justify-center relative z-10">
              <View className="absolute top-0 bottom-0 left-0 right-0 rounded-full border-[6px] border-[#EC4899] opacity-20" />
              <Text className="text-base font-black text-[#EC4899]">{completedFields}/{totalFields}</Text>
            </View>
          </TouchableOpacity>

          {/* Card B: Daily Attendance Roll Call Status Card */}
          <View className="bg-slate-900 rounded-3xl p-5 shadow-sm overflow-hidden relative min-h-[150px]">
            <View className="absolute -right-8 -bottom-8 w-28 h-28 bg-[#4F46E5]/20 rounded-full" />
            
            <View className="flex-1 justify-between">
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center">
                  <View className="w-8 h-8 bg-white/10 rounded-xl items-center justify-center mr-3">
                    <Clock size={16} color="#ffffff" />
                  </View>
                  <View>
                    <Text className="text-white text-xs font-black uppercase tracking-wider">{getText(currentLang, 'dailyAttendance')}</Text>
                    <Text className="text-slate-400 text-[9px] font-bold uppercase tracking-wider mt-0.5">
                      Today: {new Date().toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity onPress={() => router.push('/(tabs)/history')}>
                  <Text className="text-[10px] font-extrabold text-[#4F46E5] bg-indigo-50 px-2.5 py-1 rounded-full">{getText(currentLang, 'viewLogs')}</Text>
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
                    <Text className="text-white font-black text-[10px] uppercase tracking-widest">{getText(currentLang, 'scanQr')}</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>

          {/* Card C: Assigned Training Cohorts Info */}
          <View className="bg-white border border-[#E2E8F0] rounded-3xl p-5 shadow-sm">
            <View className="flex-row items-center mb-4 border-b border-[#F1F5F9] pb-3">
              <BookOpen size={16} color={primaryColor} style={{ marginRight: 8 }} />
              <Text className="font-extrabold text-sm text-[#0F172A]">{getText(currentLang, 'assignedCohorts')}</Text>
            </View>

            <View className="gap-3 text-xs">
              {(data?.batches || []).length > 0 ? (
                (data?.batches || []).map((b: any) => (
                  <View key={b._id} className="py-2 border-b border-[#F1F5F9]/50">
                    <View className="flex-row justify-between items-center mb-1.5">
                      <View>
                        <Text className="font-extrabold text-[11px] text-slate-800">{b.department ? `${b.department} Training` : 'Training Module'}</Text>
                        <Text className="text-[10px] text-slate-400 mt-0.5">Trainer: {b.trainers && b.trainers.length > 0 ? b.trainers.map((t:any) => t.name).join(', ') : 'Unassigned'}</Text>
                        <Text className="text-[10px] text-indigo-600 font-extrabold mt-0.5">Schedule: {resolveBatchSchedule(b)}</Text>
                      </View>
                      <Text className="font-bold text-[10px] text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-xl">
                        {b.name}
                      </Text>
                    </View>
                    
                    {b.attendanceStats && (
                      <View className="flex-row items-center justify-between mt-1">
                        <View className="flex-row items-center">
                          <View className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5" />
                          <Text className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">
                            {b.attendanceStats.presentCount} / {b.attendanceStats.totalTrainingDays || b.attendanceStats.eligibleSessionsCount || 80} {getText(currentLang, 'daysAttended')}
                          </Text>
                        </View>
                        <Text className={`text-[10px] font-black ${(b.attendanceStats.attendancePercent ?? b.attendanceStats.percentage) >= 70 ? 'text-emerald-600' : 'text-rose-500'}`}>
                          {b.attendanceStats.attendancePercent ?? b.attendanceStats.percentage}%
                        </Text>
                      </View>
                    )}
                  </View>
                ))
              ) : (
                <Text className="text-[11px] text-slate-400 italic text-center py-2">No batches assigned yet.</Text>
              )}
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

          {/* Helpline */}
          <TouchableOpacity 
            onPress={openWhatsAppSupport}
            className="bg-white border border-[#E2E8F0] rounded-3xl p-5 shadow-sm flex-row items-center justify-between"
          >
            <View className="flex-row items-center">
              <View className="p-2.5 bg-emerald-50 border border-emerald-100 rounded-xl mr-3">
                <Phone size={16} color="#10B981" />
              </View>
              <View>
                <Text className="font-extrabold text-xs text-slate-800">Essential Help Desk & WhatsApp</Text>
                <Text className="text-[10px] text-slate-400 mt-0.5">Reach placement coordinators</Text>
              </View>
            </View>
            <ChevronRight size={18} color="#94A3B8" />
          </TouchableOpacity>

        </View>
      </ScrollView>

      {/* Language Selection Modal */}
      <Modal visible={langModalVisible} animationType="fade" transparent={true} onRequestClose={() => setLangModalVisible(false)}>
        <View className="flex-1 bg-black/50 justify-center items-center px-6">
          <View className="w-full bg-white rounded-3xl p-6 shadow-2xl">
            <View className="flex-row justify-between items-center mb-4">
              <View className="flex-row items-center gap-2">
                <View className="p-2 bg-indigo-50 rounded-xl">
                  <Languages size={20} color="#4F46E5" />
                </View>
                <Text className="text-lg font-black text-slate-800">{getText(currentLang, 'selectLanguage')}</Text>
              </View>
              <TouchableOpacity onPress={() => setLangModalVisible(false)} className="p-2 bg-slate-100 rounded-full">
                <X size={18} color="#64748B" />
              </TouchableOpacity>
            </View>

            <View className="gap-2.5 my-2">
              {LANGUAGES.map((lang) => {
                const isSelected = currentLang === lang.code;
                return (
                  <TouchableOpacity
                    key={lang.code}
                    onPress={() => changeLanguage(lang.code)}
                    className={`flex-row items-center justify-between p-3.5 rounded-2xl border ${isSelected ? 'bg-indigo-50/80 border-indigo-500' : 'bg-slate-50/60 border-slate-200'}`}
                  >
                    <View className="flex-row items-center gap-3">
                      <Text className="text-xl">{lang.flag}</Text>
                      <View>
                        <Text className="text-sm font-black text-slate-800">{lang.nativeName}</Text>
                        <Text className="text-[11px] text-slate-500 font-medium">{lang.name} • {lang.region}</Text>
                      </View>
                    </View>
                    {isSelected && <CheckCircle2 size={18} color="#4F46E5" />}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>
      </Modal>

      {/* Notifications Drawer / Modal */}
      <Modal visible={notifModalVisible} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setNotifModalVisible(false)}>
        <SafeAreaView className="flex-1 bg-[#F8FAFC]">
          <View className="flex-1 px-6 pt-4 pb-6">
            <View className="flex-row items-center justify-between mb-6">
              <View className="flex-row items-center gap-2.5">
                <View className="p-2.5 bg-amber-50 rounded-2xl border border-amber-200/50">
                  <Bell size={20} color="#D97706" />
                </View>
                <View>
                  <Text className="text-xl font-black text-slate-800">{getText(currentLang, 'notifications')}</Text>
                  {unreadCount > 0 && (
                    <Text className="text-[10px] text-rose-500 font-extrabold">{unreadCount} Unread</Text>
                  )}
                </View>
              </View>
              
              <View className="flex-row items-center gap-2">
                {unreadCount > 0 && (
                  <TouchableOpacity onPress={handleMarkAllRead} className="bg-indigo-50 px-3 py-1.5 rounded-xl border border-indigo-100">
                    <Text className="text-indigo-600 text-xs font-black">Mark All Read</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity onPress={() => setNotifModalVisible(false)} className="p-2 bg-slate-200/60 rounded-full">
                  <X size={20} color="#64748B" />
                </TouchableOpacity>
              </View>
            </View>

            <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
              {notificationsList.length === 0 ? (
                <View className="py-16 items-center justify-center">
                  <Bell size={40} color="#94A3B8" />
                  <Text className="text-slate-500 font-bold text-sm mt-3">{getText(currentLang, 'noNotifications')}</Text>
                </View>
              ) : (
                notificationsList.map((item: any, idx: number) => {
                  const isUnread = !item.isRead;
                  return (
                    <TouchableOpacity 
                      key={item._id || idx} 
                      onPress={() => isUnread && item._id && handleMarkSingleRead(item._id)}
                      activeOpacity={0.8}
                      className={`p-4 mb-3 rounded-2xl border ${isUnread ? 'bg-indigo-50/70 border-indigo-200 shadow-xs' : 'bg-white border-slate-200'}`}
                    >
                      <View className="flex-row justify-between items-start mb-1">
                        <View className="flex-row items-center flex-1 mr-2 gap-1.5">
                          {isUnread && <View className="w-2 h-2 rounded-full bg-indigo-600" />}
                          <Text className="text-slate-900 font-bold text-sm flex-1">{item.title || 'Notification'}</Text>
                        </View>
                        <Text className="text-[10px] text-slate-400 font-semibold">
                          {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'Today'}
                        </Text>
                      </View>
                      <Text className="text-slate-600 text-xs mt-1 leading-relaxed">{item.message}</Text>
                    </TouchableOpacity>
                  );
                })
              )}
            </ScrollView>
          </View>
        </SafeAreaView>
      </Modal>

    </SafeAreaView>
  );
}
