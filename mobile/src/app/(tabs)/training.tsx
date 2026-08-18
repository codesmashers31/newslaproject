import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  StatusBar,
  Modal,
  TextInput
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import { useFocusEffect } from 'expo-router';
import { useColorScheme } from 'nativewind';
import AsyncStorage from '@react-native-async-storage/async-storage';
import API from '../../services/api';
import { ScreenSkeleton } from '../../components/Skeleton';
import AppHeader from '../../components/AppHeader';
import { 
  BookOpen,
  CheckCircle2,
  ArrowLeft,
  Search,
  Layers
} from 'lucide-react-native';

export default function TrainingScreen() {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const muted = '#64748B';
  const primary = '#6366F1';
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  const [batches, setBatches] = useState<any[]>([]);
  const [availableBatches, setAvailableBatches] = useState<any[]>([]);
  const [dashData, setDashData] = useState<any>(null);
  
  // Modals
  const [techModalVisible, setTechModalVisible] = useState(false);
  const [aptiModalVisible, setAptiModalVisible] = useState(false);
  const [commModalVisible, setCommModalVisible] = useState(false);
  
  // Selected IDs
  const [selectedTechIds, setSelectedTechIds] = useState<string[]>([]);
  const [selectedAptiId, setSelectedAptiId] = useState<string | null>(null);
  const [selectedCommId, setSelectedCommId] = useState<string | null>(null);

  // Search State
  const [techSearchQuery, setTechSearchQuery] = useState('');
  const [aptiSearchQuery, setAptiSearchQuery] = useState('');
  const [commSearchQuery, setCommSearchQuery] = useState('');

  // Saving States
  const [savingTech, setSavingTech] = useState(false);
  const [savingApti, setSavingApti] = useState(false);
  const [savingComm, setSavingComm] = useState(false);

  const getBatchDomain = (batch: any) => {
    if (!batch) return 'Technical';
    if (batch.department === 'Aptitude') return 'Aptitude';
    if (batch.department === 'Communication') return 'Communication';
    if (batch.department === 'Technical') return 'Technical';

    const course = (batch.course || '').toLowerCase();
    const name = (batch.name || '').toLowerCase();
    if (course.includes('aptitude') || course.includes('quant') || course.includes('reasoning') || name.includes('aptitude') || name.includes('quant')) {
      return 'Aptitude';
    }
    if (course.includes('communication') || course.includes('softskills') || course.includes('english') || course.includes('verbal') || name.includes('communication') || name.includes('softskill')) {
      return 'Communication';
    }
    return 'Technical';
  };

  const resolveBatchSchedule = (batch: any, defaultDepartment?: string) => {
    if (batch?.startTime && batch?.endTime) {
      const daysPrefix = batch.days ? `${batch.days} • ` : (batch.scheduleDays ? `${batch.scheduleDays} • ` : '');
      return `${daysPrefix}${batch.startTime} – ${batch.endTime}`;
    }
    if (batch?.startTime) {
      const daysPrefix = batch.days ? `${batch.days} • ` : '';
      return `${daysPrefix}${batch.startTime}`;
    }
    if (batch?.schedule && typeof batch.schedule === 'string' && batch.schedule.trim() !== '' && batch.schedule !== 'Schedule Not Set') {
      return batch.schedule;
    }
    const dept = (defaultDepartment || batch?.department || batch?.course || batch?.name || '').toLowerCase();
    if (dept.includes('comm')) return 'Mon - Fri • 02:00 PM – 04:00 PM';
    if (dept.includes('apti')) return 'Mon - Fri • 11:00 AM – 01:00 PM';
    return 'Mon - Fri • 09:00 AM – 01:00 PM';
  };

  useEffect(() => {
    const loadCached = async () => {
      try {
        const cached = await AsyncStorage.getItem('cached_training_batches');
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed.myBatches) {
            setBatches(parsed.myBatches);
            const tech = parsed.myBatches.filter((b: any) => getBatchDomain(b) === 'Technical');
            setSelectedTechIds(tech.map((b: any) => String(b._id)));
            const apti = parsed.myBatches.find((b: any) => getBatchDomain(b) === 'Aptitude');
            setSelectedAptiId(apti ? String(apti._id) : null);
            const comm = parsed.myBatches.find((b: any) => getBatchDomain(b) === 'Communication');
            setSelectedCommId(comm ? String(comm._id) : null);
          }
          if (parsed.available) setAvailableBatches(parsed.available);
          setLoading(false);
        }
      } catch (e) {}
    };
    loadCached();
  }, []);

  const loadData = async () => {
    try {
      const [dashRes, batchRes] = await Promise.all([
        API.get('/student/dashboard'),
        API.get('/student/batches')
      ]);
      
      const myBatches = dashRes.data?.batches || [];
      const available = batchRes.data || [];
      setDashData(dashRes.data);
      setBatches(myBatches);
      setAvailableBatches(available);

      AsyncStorage.setItem('cached_training_batches', JSON.stringify({ myBatches, available })).catch(() => {});

      // Initialize selected tech ids
      const tech = myBatches.filter((b: any) => getBatchDomain(b) === 'Technical');
      setSelectedTechIds(tech.map((b: any) => String(b._id)));
      
      // Initialize selected apti id
      const apti = myBatches.find((b: any) => getBatchDomain(b) === 'Aptitude');
      setSelectedAptiId(apti ? String(apti._id) : null);

      // Initialize selected comm id
      const comm = myBatches.find((b: any) => getBatchDomain(b) === 'Communication');
      setSelectedCommId(comm ? String(comm._id) : null);
      
    } catch (error) {
      console.error('Failed to load training data', error);
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

  // Technical Save Handler
  const handleSaveTech = async () => {
    setSavingTech(true);
    try {
      await API.post('/student/enrollments', {
        technicalBatchIds: selectedTechIds,
        targetDomain: 'Technical'
      });
      setTechModalVisible(false);
      Toast.show({
        type: 'success',
        text1: 'Technical Batches Saved',
        text2: 'Your technical batch selections have been updated.',
      });
      loadData();
    } catch (error: any) {
      const msg = error?.response?.data?.message || 'Failed to update technical batches';
      Toast.show({ type: 'error', text1: 'Error', text2: msg });
    } finally {
      setSavingTech(false);
    }
  };

  // Aptitude Save Handler
  const handleSaveApti = async () => {
    setSavingApti(true);
    try {
      await API.post('/student/enrollments', {
        aptitudeBatchId: selectedAptiId,
        targetDomain: 'Aptitude'
      });
      setAptiModalVisible(false);
      Toast.show({
        type: 'success',
        text1: 'Aptitude Batch Saved',
        text2: 'Your aptitude batch selection has been updated.',
      });
      loadData();
    } catch (error: any) {
      const msg = error?.response?.data?.message || 'Failed to update aptitude batch';
      Toast.show({ type: 'error', text1: 'Error', text2: msg });
    } finally {
      setSavingApti(false);
    }
  };

  // Communication Save Handler
  const handleSaveComm = async () => {
    setSavingComm(true);
    try {
      await API.post('/student/enrollments', {
        communicationBatchId: selectedCommId,
        targetDomain: 'Communication'
      });
      setCommModalVisible(false);
      Toast.show({
        type: 'success',
        text1: 'Communication Batch Saved',
        text2: 'Your communication batch selection has been updated.',
      });
      loadData();
    } catch (error: any) {
      const msg = error?.response?.data?.message || 'Failed to update communication batch';
      Toast.show({ type: 'error', text1: 'Error', text2: msg });
    } finally {
      setSavingComm(false);
    }
  };

  const toggleTechBatch = (id: string) => {
    const stringId = String(id);
    if (selectedTechIds.some(x => String(x) === stringId)) {
      setSelectedTechIds(selectedTechIds.filter(x => String(x) !== stringId));
    } else {
      setSelectedTechIds([...selectedTechIds, stringId]);
    }
  };

  if (loading) {
    return (
      <ScreenSkeleton variant="training" />
    );
  }

  const techBatches = batches.filter(b => getBatchDomain(b) === 'Technical');
  const commBatch = batches.find(b => getBatchDomain(b) === 'Communication');
  const aptiBatch = batches.find(b => getBatchDomain(b) === 'Aptitude');

  const availTechBatches = availableBatches
    .filter(b => getBatchDomain(b) === 'Technical')
    .filter(b => b.name?.toLowerCase().includes(techSearchQuery.toLowerCase()) || (b.trainers && b.trainers[0]?.name?.toLowerCase().includes(techSearchQuery.toLowerCase())));
    
  const availAptiBatches = availableBatches
    .filter(b => getBatchDomain(b) === 'Aptitude')
    .filter(b => b.name?.toLowerCase().includes(aptiSearchQuery.toLowerCase()) || (b.trainers && b.trainers[0]?.name?.toLowerCase().includes(aptiSearchQuery.toLowerCase())));

  const availCommBatches = availableBatches
    .filter(b => getBatchDomain(b) === 'Communication')
    .filter(b => b.name?.toLowerCase().includes(commSearchQuery.toLowerCase()) || (b.trainers && b.trainers[0]?.name?.toLowerCase().includes(commSearchQuery.toLowerCase())));
  return (
    <SafeAreaView className="flex-1 bg-[#F8FAFC]">
      <StatusBar barStyle="dark-content" />
      
      {/* Universal Fixed Top Navbar */}
      <AppHeader title="My Training" subtitle="Manage your batch enrollments" showBack={true} onRefreshData={loadData} />

      <ScrollView 
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={primary} />}
        className="flex-1 px-5 py-4"
        contentContainerStyle={{ paddingBottom: 110 }}
        showsVerticalScrollIndicator={false}
      >
        <Text className="text-[10px] font-black text-[#64748B] uppercase tracking-wider mb-4 mt-2">ASSIGNED BATCHES & TRAINERS</Text>

        {/* 1. TECHNICAL TRAINING CARD (Multi-Course Display) */}
        <View className="mb-4 bg-white border border-[#E2E8F0] rounded-3xl p-5 shadow-sm">
          <View className="flex-row justify-between items-center flex-wrap gap-2 mb-4">
            <View className="flex-row items-center flex-wrap gap-2 flex-1">
              <Text className="text-[#0F172A] font-extrabold text-sm uppercase tracking-wide">TECHNICAL TRAINING</Text>
              {techBatches.length > 0 && (
                <View className="bg-[#8B5CF6]/10 px-2 py-0.5 rounded-full flex-row items-center gap-1">
                  <Layers size={10} color="#8B5CF6" />
                  <Text className="text-[#8B5CF6] text-[10px] font-black">{techBatches.length} Courses Selected</Text>
                </View>
              )}
            </View>
            <TouchableOpacity onPress={() => setTechModalVisible(true)} className="bg-[#F3E8FF] px-3.5 py-1.5 rounded-xl">
              <Text className="text-[#8B5CF6] text-[11px] font-black">Manage ({selectedTechIds.length})</Text>
            </TouchableOpacity>
          </View>
          
          {techBatches.length === 0 ? (
            <View className="py-4 items-center justify-center border border-dashed border-[#CBD5E1] rounded-2xl bg-[#F8FAFC]">
              <Text className="text-[#64748B] text-xs font-semibold">No technical courses selected</Text>
              <TouchableOpacity onPress={() => setTechModalVisible(true)} className="mt-2 bg-[#8B5CF6] px-4 py-1.5 rounded-xl">
                <Text className="text-white text-xs font-bold">Select Courses</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View className="gap-3">
              {techBatches.map((item, index) => (
                <View key={String(item._id || index)} className="p-3.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl">
                  <View className="flex-row justify-between items-center flex-wrap gap-2 mb-2">
                    <Text className="text-[#0F172A] text-xs font-black flex-1 min-w-[120px]">{item.name}</Text>
                    <View className="bg-[#E0E7FF] px-2 py-0.5 rounded-md">
                      <Text className="text-[#4338CA] text-[9px] font-bold uppercase">{item.course || 'Technical'}</Text>
                    </View>
                  </View>
                  <View className="flex-col border-t border-[#E2E8F0] pt-2.5 mt-1.5 gap-1.5">
                    <Text className="text-[#64748B] text-[11px]">
                      Trainer: <Text className="text-[#0F172A] font-bold">{item.trainers && item.trainers.length > 0 ? item.trainers[0].name : 'Auto-Assigned'}</Text>
                    </Text>
                    <Text className="text-[#4F46E5] text-[11px] font-extrabold">
                      {resolveBatchSchedule(item)}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* 2. COMMUNICATION SKILLS CARD */}
        {(() => {
          const stats = commBatch?.attendanceStats || dashData?.communicationSummary || {
            startDate: '14-Aug-2026',
            trainingDay: 0,
            totalTrainingDays: 80,
            presentCount: 0,
            absentCount: 0,
            remainingDays: 80,
            attendancePercent: 100,
            progressPercent: 0
          };
          return (
            <View className="mb-4 bg-white border border-[#E2E8F0] rounded-3xl p-5 shadow-sm">
              <View className="flex-row justify-between items-center flex-wrap gap-2 mb-4">
                <View className="flex-row items-center gap-2">
                  <Text className="text-[#0F172A] font-extrabold text-sm uppercase tracking-wide">COMMUNICATION SKILLS</Text>
                  <View className="bg-amber-100 px-2 py-0.5 rounded-full">
                    <Text className="text-amber-800 text-[10px] font-black">Target: 80 Days</Text>
                  </View>
                </View>
                <TouchableOpacity onPress={() => setCommModalVisible(true)} className="bg-[#4F46E5] px-3.5 py-1.5 rounded-xl">
                  <Text className="text-white text-[11px] font-black">Change</Text>
                </TouchableOpacity>
              </View>
              
              <View className="space-y-3">
                <View className="flex-col gap-3">
                  <View className="flex-row justify-between items-center">
                    <View>
                      <Text className="text-[#64748B] text-[10px] font-bold uppercase">Assigned Batch</Text>
                      <Text className="text-[#0F172A] text-xs font-black mt-0.5">
                        {commBatch ? commBatch.name : 'Unassigned'}
                      </Text>
                    </View>
                    <View className="items-end">
                      <Text className="text-[#64748B] text-[10px] font-bold uppercase">Start Date</Text>
                      <Text className="text-[#0F172A] text-xs font-black mt-0.5">
                        {stats.startDate || '14-Aug-2026'}
                      </Text>
                    </View>
                  </View>
                  <View className="bg-[#F8FAFC] p-2.5 rounded-xl border border-[#E2E8F0]">
                    <Text className="text-[#64748B] text-[10px] font-bold uppercase flex-row items-center">Schedule</Text>
                    <Text className="text-[#4F46E5] text-[11px] font-extrabold mt-0.5">
                      {resolveBatchSchedule(commBatch, 'Communication')}
                    </Text>
                  </View>
                </View>

                {/* Metrics Grid */}
                <View className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80 space-y-2 mt-2">
                  <View className="flex-row justify-between items-center border-b border-slate-200/60 pb-2">
                    <Text className="text-slate-600 text-xs font-extrabold">Training Day</Text>
                    <Text className="text-slate-900 text-xs font-black">
                      Day {stats.trainingDay || 0} / {stats.totalTrainingDays || 80}
                    </Text>
                  </View>

                  <View className="flex-row justify-between items-center pt-1">
                    <Text className="text-slate-500 text-[11px]">Present: <Text className="font-extrabold text-emerald-600">{stats.presentCount || 0}</Text></Text>
                    <Text className="text-slate-500 text-[11px]">Absent: <Text className="font-extrabold text-rose-500">{stats.absentCount || 0}</Text></Text>
                    <Text className="text-slate-500 text-[11px]">Remaining: <Text className="font-extrabold text-slate-800">{stats.remainingDays ?? 80}</Text></Text>
                  </View>

                  <View className="flex-row justify-between items-center border-t border-slate-200/60 pt-2 mt-1">
                    <View>
                      <Text className="text-[10px] font-extrabold text-slate-400 uppercase">Attendance %</Text>
                      <Text className="text-xs font-black text-emerald-600 mt-0.5">{stats.attendancePercent !== undefined ? stats.attendancePercent : 100}%</Text>
                    </View>
                    <View className="items-end">
                      <Text className="text-[10px] font-extrabold text-slate-400 uppercase">Progress %</Text>
                      <Text className="text-xs font-black text-indigo-600 mt-0.5">{stats.progressPercent || 0}%</Text>
                    </View>
                  </View>
                </View>
              </View>
            </View>
          );
        })()}

        {/* 3. APTITUDE & REASONING CARD */}
        {(() => {
          const stats = aptiBatch?.attendanceStats || dashData?.aptitudeSummary || {
            startDate: '14-Aug-2026',
            trainingDay: 0,
            totalTrainingDays: 120,
            presentCount: 0,
            absentCount: 0,
            remainingDays: 120,
            attendancePercent: 100,
            progressPercent: 0
          };
          return (
            <View className="mb-8 bg-white border border-[#E2E8F0] rounded-3xl p-5 shadow-sm">
              <View className="flex-row justify-between items-center flex-wrap gap-2 mb-4">
                <View className="flex-row items-center gap-2">
                  <Text className="text-[#0F172A] font-extrabold text-sm uppercase tracking-wide">APTITUDE & REASONING</Text>
                  <View className="bg-indigo-100 px-2 py-0.5 rounded-full">
                    <Text className="text-indigo-800 text-[10px] font-black">Target: 120 Days</Text>
                  </View>
                </View>
                <TouchableOpacity onPress={() => setAptiModalVisible(true)} className="bg-[#4F46E5] px-3.5 py-1.5 rounded-xl">
                  <Text className="text-white text-[11px] font-black">Change</Text>
                </TouchableOpacity>
              </View>
              
              <View className="space-y-3">
                <View className="flex-col gap-3">
                  <View className="flex-row justify-between items-center">
                    <View>
                      <Text className="text-[#64748B] text-[10px] font-bold uppercase">Assigned Batch</Text>
                      <Text className="text-[#0F172A] text-xs font-black mt-0.5">
                        {aptiBatch ? aptiBatch.name : 'Unassigned'}
                      </Text>
                    </View>
                    <View className="items-end">
                      <Text className="text-[#64748B] text-[10px] font-bold uppercase">Start Date</Text>
                      <Text className="text-[#0F172A] text-xs font-black mt-0.5">
                        {stats.startDate || '14-Aug-2026'}
                      </Text>
                    </View>
                  </View>
                  <View className="bg-[#F8FAFC] p-2.5 rounded-xl border border-[#E2E8F0]">
                    <Text className="text-[#64748B] text-[10px] font-bold uppercase flex-row items-center">Schedule</Text>
                    <Text className="text-[#4F46E5] text-[11px] font-extrabold mt-0.5">
                      {resolveBatchSchedule(aptiBatch, 'Aptitude')}
                    </Text>
                  </View>
                </View>

                {/* Metrics Grid */}
                <View className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80 space-y-2 mt-2">
                  <View className="flex-row justify-between items-center border-b border-slate-200/60 pb-2">
                    <Text className="text-slate-600 text-xs font-extrabold">Training Day</Text>
                    <Text className="text-slate-900 text-xs font-black">
                      Day {stats.trainingDay || 0} / {stats.totalTrainingDays || 120}
                    </Text>
                  </View>

                  <View className="flex-row justify-between items-center pt-1">
                    <Text className="text-slate-500 text-[11px]">Present: <Text className="font-extrabold text-emerald-600">{stats.presentCount || 0}</Text></Text>
                    <Text className="text-slate-500 text-[11px]">Absent: <Text className="font-extrabold text-rose-500">{stats.absentCount || 0}</Text></Text>
                    <Text className="text-slate-500 text-[11px]">Remaining: <Text className="font-extrabold text-slate-800">{stats.remainingDays ?? 120}</Text></Text>
                  </View>

                  <View className="flex-row justify-between items-center border-t border-slate-200/60 pt-2 mt-1">
                    <View>
                      <Text className="text-[10px] font-extrabold text-slate-400 uppercase">Attendance %</Text>
                      <Text className="text-xs font-black text-emerald-600 mt-0.5">{stats.attendancePercent !== undefined ? stats.attendancePercent : 100}%</Text>
                    </View>
                    <View className="items-end">
                      <Text className="text-[10px] font-extrabold text-slate-400 uppercase">Progress %</Text>
                      <Text className="text-xs font-black text-indigo-600 mt-0.5">{stats.progressPercent || 0}%</Text>
                    </View>
                  </View>
                </View>
              </View>
            </View>
          );
        })()}
      </ScrollView>

      {/* Tech Batches Multi-Select Modal */}
      <Modal visible={techModalVisible} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setTechModalVisible(false)}>
        <SafeAreaView className="flex-1 bg-[#F8FAFC]">
          <View className="flex-1 px-6 pt-4 pb-6">
            <View className="flex-row items-center mb-6">
              <TouchableOpacity onPress={() => {
                setTechModalVisible(false);
                setSelectedTechIds(techBatches.map(b => String(b._id)));
              }} className="mr-4">
                <ArrowLeft size={24} color={muted} />
              </TouchableOpacity>
              <Text className="text-lg font-black text-[#0F172A] flex-1">Manage Technical Batches ({selectedTechIds.length} selected)</Text>
            </View>
          
            <View className="flex-row items-center bg-white border border-[#E2E8F0] rounded-xl px-3 py-2.5 mb-4">
              <Search size={14} color={muted} />
              <TextInput 
                placeholder="Search batches by name or trainer..."
                placeholderTextColor={muted}
                value={techSearchQuery}
                onChangeText={setTechSearchQuery}
                className="flex-1 text-[#0F172A] text-xs ml-2"
              />
            </View>
            
            <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
              {availTechBatches.length === 0 ? (
                <View className="py-8 items-center justify-center">
                  <Text className="text-[#64748B] text-xs font-semibold">No technical batches available matching your search.</Text>
                </View>
              ) : (
                availTechBatches.map(b => {
                  const isSelected = selectedTechIds.some(id => String(id) === String(b._id));
                  return (
                    <TouchableOpacity 
                      key={String(b._id)} 
                      onPress={() => toggleTechBatch(b._id)}
                      className={`flex-row items-center p-4 mb-3 rounded-2xl border ${isSelected ? 'bg-[#F3E8FF]/40 border-[#D8B4FE]' : 'bg-white border-[#E2E8F0]'}`}
                    >
                      <View className={`w-6 h-6 rounded-full border items-center justify-center mr-4 ${isSelected ? 'bg-[#8B5CF6] border-[#8B5CF6]' : 'border-[#64748B]/40'}`}>
                        {isSelected && <CheckCircle2 size={14} color="#fff" />}
                      </View>
                      <View className="flex-1">
                        <Text className="text-[#0F172A] font-bold">{b.name}</Text>
                        <Text className="text-[#64748B] text-xs mt-1">Course: {b.course || 'Technical'}</Text>
                        <Text className="text-[#64748B] text-xs mt-0.5">Trainer: {b.trainers && b.trainers.length > 0 ? b.trainers[0].name : 'Auto-Assigned'} • {resolveBatchSchedule(b)}</Text>
                      </View>
                    </TouchableOpacity>
                  )
                })
              )}
            </ScrollView>
            <View className="mt-4">
              <TouchableOpacity onPress={handleSaveTech} disabled={savingTech} className="w-full bg-[#4F46E5] py-3.5 rounded-xl items-center disabled:opacity-50">
                {savingTech ? <ActivityIndicator size="small" color="#fff" /> : <Text className="text-white text-xs font-black">Save Technical Selection ({selectedTechIds.length})</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>
      </Modal>

      {/* Aptitude Batch Modal */}
      <Modal visible={aptiModalVisible} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setAptiModalVisible(false)}>
        <SafeAreaView className="flex-1 bg-[#F8FAFC]">
          <View className="flex-1 px-6 pt-4 pb-6">
            <View className="flex-row items-center mb-6">
              <TouchableOpacity onPress={() => {
                setAptiModalVisible(false);
                setSelectedAptiId(aptiBatch ? String(aptiBatch._id) : null);
              }} className="mr-4">
                <ArrowLeft size={24} color={muted} />
              </TouchableOpacity>
              <Text className="text-lg font-black text-[#0F172A] flex-1">Select Aptitude Batch</Text>
            </View>
          
            <View className="flex-row items-center bg-white border border-[#E2E8F0] rounded-xl px-3 py-2.5 mb-4">
              <Search size={14} color={muted} />
              <TextInput 
                placeholder="Search batches..."
                placeholderTextColor={muted}
                value={aptiSearchQuery}
                onChangeText={setAptiSearchQuery}
                className="flex-1 text-[#0F172A] text-xs ml-2"
              />
            </View>
            
            <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
              {availAptiBatches.length === 0 ? (
                <View className="py-8 items-center justify-center">
                  <Text className="text-[#64748B] text-xs font-semibold">No aptitude batches available matching your search.</Text>
                </View>
              ) : (
                availAptiBatches.map(b => {
                  const isSelected = selectedAptiId ? String(selectedAptiId) === String(b._id) : false;
                  return (
                    <TouchableOpacity 
                      key={String(b._id)} 
                      onPress={() => setSelectedAptiId(String(b._id))}
                      className={`flex-row items-center p-4 mb-3 rounded-2xl border ${isSelected ? 'bg-[#F3E8FF]/40 border-[#D8B4FE]' : 'bg-white border-[#E2E8F0]'}`}
                    >
                      <View className={`w-6 h-6 rounded-full border items-center justify-center mr-4 ${isSelected ? 'bg-[#8B5CF6] border-[#8B5CF6]' : 'border-[#64748B]/40'}`}>
                        {isSelected && <CheckCircle2 size={14} color="#fff" />}
                      </View>
                      <View className="flex-1">
                        <Text className="text-[#0F172A] font-bold">{b.name}</Text>
                        <Text className="text-[#64748B] text-xs mt-1">Trainer: {b.trainers && b.trainers.length > 0 ? b.trainers[0].name : 'Auto-Assigned'} • {resolveBatchSchedule(b)}</Text>
                      </View>
                    </TouchableOpacity>
                  )
                })
              )}
            </ScrollView>
            <View className="mt-4">
              <TouchableOpacity onPress={handleSaveApti} disabled={savingApti} className="w-full bg-[#4F46E5] py-3.5 rounded-xl items-center disabled:opacity-50">
                {savingApti ? <ActivityIndicator size="small" color="#fff" /> : <Text className="text-white text-xs font-black">Save Selection</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>
      </Modal>

      {/* Communication Batch Modal */}
      <Modal visible={commModalVisible} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setCommModalVisible(false)}>
        <SafeAreaView className="flex-1 bg-[#F8FAFC]">
          <View className="flex-1 px-6 pt-4 pb-6">
            <View className="flex-row items-center mb-6">
              <TouchableOpacity onPress={() => {
                setCommModalVisible(false);
                setSelectedCommId(commBatch ? String(commBatch._id) : null);
              }} className="mr-4">
                <ArrowLeft size={24} color={muted} />
              </TouchableOpacity>
              <Text className="text-lg font-black text-[#0F172A] flex-1">Select Communication Batch</Text>
            </View>
          
            <View className="flex-row items-center bg-white border border-[#E2E8F0] rounded-xl px-3 py-2.5 mb-4">
              <Search size={14} color={muted} />
              <TextInput 
                placeholder="Search batches..."
                placeholderTextColor={muted}
                value={commSearchQuery}
                onChangeText={setCommSearchQuery}
                className="flex-1 text-[#0F172A] text-xs ml-2"
              />
            </View>
            
            <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
              {availCommBatches.length === 0 ? (
                <View className="py-8 items-center justify-center">
                  <Text className="text-[#64748B] text-xs font-semibold">No communication batches available matching your search.</Text>
                </View>
              ) : (
                availCommBatches.map(b => {
                  const isSelected = selectedCommId ? String(selectedCommId) === String(b._id) : false;
                  return (
                    <TouchableOpacity 
                      key={String(b._id)} 
                      onPress={() => setSelectedCommId(String(b._id))}
                      className={`flex-row items-center p-4 mb-3 rounded-2xl border ${isSelected ? 'bg-[#F3E8FF]/40 border-[#D8B4FE]' : 'bg-white border-[#E2E8F0]'}`}
                    >
                      <View className={`w-6 h-6 rounded-full border items-center justify-center mr-4 ${isSelected ? 'bg-[#8B5CF6] border-[#8B5CF6]' : 'border-[#64748B]/40'}`}>
                        {isSelected && <CheckCircle2 size={14} color="#fff" />}
                      </View>
                      <View className="flex-1">
                        <Text className="text-[#0F172A] font-bold">{b.name}</Text>
                        <Text className="text-[#64748B] text-xs mt-1">Trainer: {b.trainers && b.trainers.length > 0 ? b.trainers[0].name : 'Auto-Assigned'} • {resolveBatchSchedule(b)}</Text>
                      </View>
                    </TouchableOpacity>
                  )
                })
              )}
            </ScrollView>
            <View className="mt-4">
              <TouchableOpacity onPress={handleSaveComm} disabled={savingComm} className="w-full bg-[#4F46E5] py-3.5 rounded-xl items-center disabled:opacity-50">
                {savingComm ? <ActivityIndicator size="small" color="#fff" /> : <Text className="text-white text-xs font-black">Save Selection</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>
      </Modal>

    </SafeAreaView>
  );
}
