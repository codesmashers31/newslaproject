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
import { 
  BookOpen,
  CheckCircle2,
  ArrowLeft,
  Search
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

  useEffect(() => {
    const loadCached = async () => {
      try {
        const cached = await AsyncStorage.getItem('cached_training_batches');
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed.myBatches) {
            setBatches(parsed.myBatches);
            const tech = parsed.myBatches.filter((b: any) => getBatchDomain(b) === 'Technical');
            setSelectedTechIds(tech.map((b: any) => b._id));
            const apti = parsed.myBatches.find((b: any) => getBatchDomain(b) === 'Aptitude');
            setSelectedAptiId(apti ? apti._id : null);
            const comm = parsed.myBatches.find((b: any) => getBatchDomain(b) === 'Communication');
            setSelectedCommId(comm ? comm._id : null);
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
      setBatches(myBatches);
      setAvailableBatches(available);

      AsyncStorage.setItem('cached_training_batches', JSON.stringify({ myBatches, available })).catch(() => {});

      // Initialize selected tech ids
      const tech = myBatches.filter((b: any) => getBatchDomain(b) === 'Technical');
      setSelectedTechIds(tech.map((b: any) => b._id));
      
      // Initialize selected apti id
      const apti = myBatches.find((b: any) => getBatchDomain(b) === 'Aptitude');
      setSelectedAptiId(apti ? apti._id : null);

      // Initialize selected comm id
      const comm = myBatches.find((b: any) => getBatchDomain(b) === 'Communication');
      setSelectedCommId(comm ? comm._id : null);
      
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
    if (selectedTechIds.includes(id)) {
      setSelectedTechIds(selectedTechIds.filter(x => x !== id));
    } else {
      setSelectedTechIds([...selectedTechIds, id]);
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
      
      {/* Header */}
      <View className="px-6 py-5 border-b border-[#E2E8F0] bg-white flex-row items-center gap-3.5">
        <View className="p-2.5 bg-[#F3E8FF] rounded-2xl border border-[#D8B4FE]/30">
          <BookOpen size={20} color="#8B5CF6" />
        </View>
        <View>
          <Text className="text-2xl font-black text-[#0F172A]">My Training</Text>
          <Text className="text-xs text-[#64748B] mt-0.5">Manage your batch enrollments</Text>
        </View>
      </View>

      <ScrollView 
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={primary} />}
        className="flex-1 px-6 py-4"
        showsVerticalScrollIndicator={false}
      >
        <Text className="text-[10px] font-black text-[#64748B] uppercase tracking-wider mb-4 mt-2">ASSIGNED BATCHES & TRAINERS</Text>

        {/* 1. TECHNICAL TRAINING CARD */}
        <View className="mb-4 bg-white border border-[#E2E8F0] rounded-3xl p-5 shadow-sm">
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-[#0F172A] font-extrabold text-sm uppercase tracking-wide">TECHNICAL TRAINING</Text>
            <TouchableOpacity onPress={() => setTechModalVisible(true)} className="bg-[#F3E8FF] px-3.5 py-1.5 rounded-xl">
              <Text className="text-[#8B5CF6] text-[11px] font-black">Manage</Text>
            </TouchableOpacity>
          </View>
          
          <View className="space-y-4">
            <View>
              <Text className="text-[#64748B] text-[11px] font-semibold">Assigned Batch</Text>
              <Text className="text-[#0F172A] text-xs font-black mt-1">
                {techBatches.length > 0 ? techBatches.map(b => b.name).join(', ') : 'Unassigned'}
              </Text>
            </View>
            <View className="border-t border-[#F1F5F9] pt-3">
              <Text className="text-[#64748B] text-[11px] font-semibold">Trainer</Text>
              <Text className="text-[#0F172A] text-xs font-black mt-1">
                {techBatches.length > 0 && techBatches[0].trainers && techBatches[0].trainers.length > 0 
                  ? techBatches[0].trainers[0].name 
                  : 'Auto-Assigned'}
              </Text>
            </View>
            <View className="border-t border-[#F1F5F9] pt-3">
              <Text className="text-[#64748B] text-[11px] font-semibold">Schedule</Text>
              <Text className="text-[#0F172A] text-xs font-black mt-1">
                {techBatches.length > 0 ? techBatches[0].schedule || 'Mon-Fri • 9:00 AM' : 'N/A'}
              </Text>
            </View>
          </View>
        </View>

        {/* 2. COMMUNICATION SKILLS CARD */}
        <View className="mb-4 bg-white border border-[#E2E8F0] rounded-3xl p-5 shadow-sm">
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-[#0F172A] font-extrabold text-sm uppercase tracking-wide">COMMUNICATION SKILLS</Text>
            <TouchableOpacity onPress={() => setCommModalVisible(true)} className="bg-[#4F46E5] px-3.5 py-1.5 rounded-xl">
              <Text className="text-white text-[11px] font-black">Change</Text>
            </TouchableOpacity>
          </View>
          
          <View className="space-y-4">
            <View>
              <Text className="text-[#64748B] text-[11px] font-semibold">Assigned Batch</Text>
              <Text className="text-[#0F172A] text-xs font-black mt-1">
                {commBatch ? commBatch.name : 'Unassigned'}
              </Text>
            </View>
            <View className="border-t border-[#F1F5F9] pt-3">
              <Text className="text-[#64748B] text-[11px] font-semibold">Trainer</Text>
              <Text className="text-[#0F172A] text-xs font-black mt-1">
                {commBatch && commBatch.trainers && commBatch.trainers.length > 0 
                  ? commBatch.trainers[0].name 
                  : 'Auto-Assigned'}
              </Text>
            </View>
            <View className="border-t border-[#F1F5F9] pt-3">
              <Text className="text-[#64748B] text-[11px] font-semibold">Schedule</Text>
              <Text className="text-[#0F172A] text-xs font-black mt-1">
                {commBatch ? commBatch.schedule || 'Tue & Thu • 2:00 PM' : 'N/A'}
              </Text>
            </View>
          </View>
        </View>

        {/* 3. APTITUDE & REASONING CARD */}
        <View className="mb-8 bg-white border border-[#E2E8F0] rounded-3xl p-5 shadow-sm">
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-[#0F172A] font-extrabold text-sm uppercase tracking-wide">APTITUDE & REASONING</Text>
            <TouchableOpacity onPress={() => setAptiModalVisible(true)} className="bg-[#4F46E5] px-3.5 py-1.5 rounded-xl">
              <Text className="text-white text-[11px] font-black">Change</Text>
            </TouchableOpacity>
          </View>
          
          <View className="space-y-4">
            <View>
              <Text className="text-[#64748B] text-[11px] font-semibold">Assigned Batch</Text>
              <Text className="text-[#0F172A] text-xs font-black mt-1">
                {aptiBatch ? aptiBatch.name : 'Unassigned'}
              </Text>
            </View>
            <View className="border-t border-[#F1F5F9] pt-3">
              <Text className="text-[#64748B] text-[11px] font-semibold">Trainer</Text>
              <Text className="text-[#0F172A] text-xs font-black mt-1">
                {aptiBatch && aptiBatch.trainers && aptiBatch.trainers.length > 0 
                  ? aptiBatch.trainers[0].name 
                  : 'Auto-Assigned'}
              </Text>
            </View>
            <View className="border-t border-[#F1F5F9] pt-3">
              <Text className="text-[#64748B] text-[11px] font-semibold">Schedule</Text>
              <Text className="text-[#0F172A] text-xs font-black mt-1">
                {aptiBatch ? aptiBatch.schedule || 'Mon-Fri • 11:00 AM' : 'N/A'}
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Tech Batches Modal */}
      <Modal visible={techModalVisible} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setTechModalVisible(false)}>
        <SafeAreaView className="flex-1 bg-[#F8FAFC]">
          <View className="flex-1 px-6 pt-4 pb-6">
            <View className="flex-row items-center mb-6">
              <TouchableOpacity onPress={() => {
                setTechModalVisible(false);
                setSelectedTechIds(techBatches.map(b => b._id));
              }} className="mr-4">
                <ArrowLeft size={24} color={muted} />
              </TouchableOpacity>
              <Text className="text-lg font-black text-[#0F172A] flex-1">Manage Technical Batches</Text>
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
              {availTechBatches.map(b => {
                const isSelected = selectedTechIds.includes(b._id);
                return (
                  <TouchableOpacity 
                    key={b._id} 
                    onPress={() => toggleTechBatch(b._id)}
                    className={`flex-row items-center p-4 mb-3 rounded-2xl border ${isSelected ? 'bg-[#F3E8FF]/40 border-[#D8B4FE]' : 'bg-white border-[#E2E8F0]'}`}
                  >
                    <View className={`w-6 h-6 rounded-full border items-center justify-center mr-4 ${isSelected ? 'bg-[#8B5CF6] border-[#8B5CF6]' : 'border-[#64748B]/40'}`}>
                      {isSelected && <CheckCircle2 size={14} color="#fff" />}
                    </View>
                    <View className="flex-1">
                      <Text className="text-[#0F172A] font-bold">{b.name}</Text>
                      <Text className="text-[#64748B] text-xs mt-1">Trainer: {b.trainers && b.trainers.length > 0 ? b.trainers[0].name : 'N/A'}</Text>
                    </View>
                  </TouchableOpacity>
                )
              })}
            </ScrollView>
            <View className="mt-4">
              <TouchableOpacity onPress={handleSaveTech} disabled={savingTech} className="w-full bg-[#4F46E5] py-3.5 rounded-xl items-center disabled:opacity-50">
                {savingTech ? <ActivityIndicator size="small" color="#fff" /> : <Text className="text-white text-xs font-black">Save Selection</Text>}
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
                setSelectedAptiId(aptiBatch ? aptiBatch._id : null);
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
              {availAptiBatches.map(b => {
                const isSelected = selectedAptiId === b._id;
                return (
                  <TouchableOpacity 
                    key={b._id} 
                    onPress={() => setSelectedAptiId(b._id)}
                    className={`flex-row items-center p-4 mb-3 rounded-2xl border ${isSelected ? 'bg-[#F3E8FF]/40 border-[#D8B4FE]' : 'bg-white border-[#E2E8F0]'}`}
                  >
                    <View className={`w-6 h-6 rounded-full border items-center justify-center mr-4 ${isSelected ? 'bg-[#8B5CF6] border-[#8B5CF6]' : 'border-[#64748B]/40'}`}>
                      {isSelected && <CheckCircle2 size={14} color="#fff" />}
                    </View>
                    <View className="flex-1">
                      <Text className="text-[#0F172A] font-bold">{b.name}</Text>
                      <Text className="text-[#64748B] text-xs mt-1">Trainer: {b.trainers && b.trainers.length > 0 ? b.trainers[0].name : 'N/A'}</Text>
                    </View>
                  </TouchableOpacity>
                )
              })}
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
                setSelectedCommId(commBatch ? commBatch._id : null);
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
              {availCommBatches.map(b => {
                const isSelected = selectedCommId === b._id;
                return (
                  <TouchableOpacity 
                    key={b._id} 
                    onPress={() => setSelectedCommId(b._id)}
                    className={`flex-row items-center p-4 mb-3 rounded-2xl border ${isSelected ? 'bg-[#F3E8FF]/40 border-[#D8B4FE]' : 'bg-white border-[#E2E8F0]'}`}
                  >
                    <View className={`w-6 h-6 rounded-full border items-center justify-center mr-4 ${isSelected ? 'bg-[#8B5CF6] border-[#8B5CF6]' : 'border-[#64748B]/40'}`}>
                      {isSelected && <CheckCircle2 size={14} color="#fff" />}
                    </View>
                    <View className="flex-1">
                      <Text className="text-[#0F172A] font-bold">{b.name}</Text>
                      <Text className="text-[#64748B] text-xs mt-1">Trainer: {b.trainers && b.trainers.length > 0 ? b.trainers[0].name : 'N/A'}</Text>
                    </View>
                  </TouchableOpacity>
                )
              })}
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
