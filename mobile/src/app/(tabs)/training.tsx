import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
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
import API from '../../services/api';
import { 
  BookOpen,
  CheckCircle2,
  ArrowLeft,
  Search,
  Lock
} from 'lucide-react-native';

export default function TrainingScreen() {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const muted = '#64748B';
  const primary = '#6366F1';
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  
  const [batches, setBatches] = useState<any[]>([]);
  const [availableBatches, setAvailableBatches] = useState<any[]>([]);
  
  // Modals
  const [techModalVisible, setTechModalVisible] = useState(false);
  const [aptiModalVisible, setAptiModalVisible] = useState(false);
  
  // Selected IDs
  const [selectedTechIds, setSelectedTechIds] = useState<string[]>([]);
  const [selectedAptiId, setSelectedAptiId] = useState<string | null>(null);

  // Search State
  const [techSearchQuery, setTechSearchQuery] = useState('');
  const [aptiSearchQuery, setAptiSearchQuery] = useState('');
  
  // Lock States (Strictly Independent)
  const [isTechLocked, setIsTechLocked] = useState(false);
  const [isAptiLocked, setIsAptiLocked] = useState(false);

  // Separate Loading States
  const [savingTechTemp, setSavingTechTemp] = useState(false);
  const [lockingTech, setLockingTech] = useState(false);
  const [savingAptiTemp, setSavingAptiTemp] = useState(false);
  const [lockingApti, setLockingApti] = useState(false);

  const loadData = async () => {
    try {
      const [dashRes, batchRes] = await Promise.all([
        API.get('/student/dashboard'),
        API.get('/student/batches')
      ]);
      
      const myBatches = dashRes.data?.batches || [];
      setBatches(myBatches);
      setAvailableBatches(batchRes.data || []);

      const uObj = dashRes.data?.user || dashRes.data?.profile?.user || {};
      setIsTechLocked(!!uObj.isTechnicalLocked);
      setIsAptiLocked(!!uObj.isAptitudeLocked);
      
      // Initialize selected tech ids
      const tech = myBatches.filter((b: any) => b.course?.includes('Technical'));
      setSelectedTechIds(tech.map((b: any) => b._id));
      
      // Initialize selected apti id
      const apti = myBatches.find((b: any) => b.course?.includes('Aptitude'));
      setSelectedAptiId(apti ? apti._id : null);
      
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

  // Technical Save Temp / Lock Handlers
  const handleSaveTech = async (isPermanent = false) => {
    if (isPermanent) {
      setLockingTech(true);
    } else {
      setSavingTechTemp(true);
    }
    try {
      await API.post('/student/enrollments', {
        technicalBatchIds: selectedTechIds,
        isPermanent,
        targetDomain: 'Technical'
      });
      setTechModalVisible(false);
      if (isPermanent) setIsTechLocked(true);
      Toast.show({
        type: 'success',
        text1: isPermanent ? 'Technical Batches Locked' : 'Technical Batches Saved',
        text2: 'Your technical batch selections have been updated.',
      });
      loadData();
    } catch (error: any) {
      const msg = error?.response?.data?.message || 'Failed to update technical batches';
      Toast.show({ type: 'error', text1: 'Error', text2: msg });
    } finally {
      setSavingTechTemp(false);
      setLockingTech(false);
    }
  };

  const handleLockTech = () => {
    Alert.alert(
      "Lock Technical Batches?",
      "Once you lock your technical batch selection, you will NOT be able to change it later. Are you sure?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Lock Technical", style: "destructive", onPress: () => handleSaveTech(true) }
      ]
    );
  };

  // Aptitude Save Temp / Lock Handlers
  const handleSaveApti = async (isPermanent = false) => {
    if (isPermanent) {
      setLockingApti(true);
    } else {
      setSavingAptiTemp(true);
    }
    try {
      await API.post('/student/enrollments', {
        aptitudeBatchId: selectedAptiId,
        isPermanent,
        targetDomain: 'Aptitude'
      });
      setAptiModalVisible(false);
      if (isPermanent) setIsAptiLocked(true);
      Toast.show({
        type: 'success',
        text1: isPermanent ? 'Aptitude Batch Locked' : 'Aptitude Batch Saved',
        text2: 'Your aptitude batch selection has been updated.',
      });
      loadData();
    } catch (error: any) {
      const msg = error?.response?.data?.message || 'Failed to update aptitude batch';
      Toast.show({ type: 'error', text1: 'Error', text2: msg });
    } finally {
      setSavingAptiTemp(false);
      setLockingApti(false);
    }
  };

  const handleLockApti = () => {
    Alert.alert(
      "Lock Aptitude Batch?",
      "Once you lock your aptitude batch selection, you will NOT be able to change it later. Are you sure?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Lock Aptitude", style: "destructive", onPress: () => handleSaveApti(true) }
      ]
    );
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
      <View className="flex-1 bg-[#F8FAFC] items-center justify-center">
        <ActivityIndicator size="large" color={primary} />
      </View>
    );
  }

  const techBatches = batches.filter(b => b.course?.includes('Technical'));
  const commBatch = batches.find(b => b.course?.includes('Communication'));
  const aptiBatch = batches.find(b => b.course?.includes('Aptitude'));

  const availTechBatches = availableBatches
    .filter(b => b.course?.includes('Technical'))
    .filter(b => b.name?.toLowerCase().includes(techSearchQuery.toLowerCase()) || (b.trainers && b.trainers[0]?.name.toLowerCase().includes(techSearchQuery.toLowerCase())));
    
  const availAptiBatches = availableBatches
    .filter(b => b.course?.includes('Aptitude'))
    .filter(b => b.name?.toLowerCase().includes(aptiSearchQuery.toLowerCase()) || (b.trainers && b.trainers[0]?.name.toLowerCase().includes(aptiSearchQuery.toLowerCase())));

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
        <Text className="text-[10px] font-black text-[#64748B] uppercase tracking-wider mb-4 mt-2">ASSIGNED BATCHS & TRAINERS</Text>

        {/* 1. TECHNICAL TRAINING CARD */}
        <View className="mb-4 bg-white border border-[#E2E8F0] rounded-3xl p-5 shadow-sm">
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-[#0F172A] font-extrabold text-sm uppercase tracking-wide">TECHNICAL TRAINING</Text>
            {isTechLocked ? (
              <View className="bg-[#F3E8FF] px-3 py-1 rounded-xl flex-row items-center">
                <Lock size={12} color="#8B5CF6" />
                <Text className="text-[#8B5CF6] text-[10px] font-extrabold uppercase tracking-wider ml-1">Locked</Text>
              </View>
            ) : (
              <TouchableOpacity onPress={() => setTechModalVisible(true)} className="bg-[#F3E8FF] px-3.5 py-1.5 rounded-xl">
                <Text className="text-[#8B5CF6] text-[11px] font-black">Manage</Text>
              </TouchableOpacity>
            )}
          </View>
          
          <View className="space-y-4">
            <View>
              <Text className="text-[#64748B] text-[11px] font-semibold">Assigned Batch</Text>
              <Text className="text-[#0F172A] text-xs font-black mt-1">
                {techBatches.length > 0 ? techBatches[0].name : 'Unassigned'}
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
            <View className="bg-[#EEF2F6] px-3.5 py-1.5 rounded-xl">
              <Text className="text-[#64748B] text-[10px] font-black uppercase tracking-wider">READ ONLY</Text>
            </View>
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
            {isAptiLocked ? (
              <View className="bg-[#F3E8FF] px-3 py-1 rounded-xl flex-row items-center">
                <Lock size={12} color="#8B5CF6" />
                <Text className="text-[#8B5CF6] text-[10px] font-extrabold uppercase tracking-wider ml-1">Locked</Text>
              </View>
            ) : (
              <TouchableOpacity onPress={() => setAptiModalVisible(true)} className="bg-[#4F46E5] px-3.5 py-1.5 rounded-xl">
                <Text className="text-white text-[11px] font-black">Change</Text>
              </TouchableOpacity>
            )}
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
                    onPress={() => !isTechLocked && toggleTechBatch(b._id)}
                    disabled={isTechLocked}
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
            <View className="flex-row gap-4 mt-4">
              <TouchableOpacity onPress={() => handleSaveTech(false)} disabled={savingTechTemp || lockingTech || isTechLocked} className="flex-1 bg-[#EEF2F6] py-3 rounded-xl items-center disabled:opacity-50">
                {savingTechTemp ? <ActivityIndicator size="small" color="#0F172A" /> : <Text className="text-[#0F172A] text-xs font-bold">Save Temp</Text>}
              </TouchableOpacity>
              <TouchableOpacity onPress={handleLockTech} disabled={savingTechTemp || lockingTech || isTechLocked} className="flex-1 bg-[#4F46E5] py-3 rounded-xl items-center flex-row justify-center disabled:opacity-50">
                {lockingTech ? <ActivityIndicator size="small" color="#fff" /> : (
                  <>
                    <Lock size={14} color="#fff" />
                    <Text className="text-white text-xs font-black ml-1.5">{isTechLocked ? 'Locked' : 'Lock Selection'}</Text>
                  </>
                )}
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
                    onPress={() => !isAptiLocked && setSelectedAptiId(b._id)}
                    disabled={isAptiLocked}
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
            <View className="flex-row gap-4 mt-4">
              <TouchableOpacity onPress={() => handleSaveApti(false)} disabled={savingAptiTemp || lockingApti || isAptiLocked} className="flex-1 bg-[#EEF2F6] py-3 rounded-xl items-center disabled:opacity-50">
                {savingAptiTemp ? <ActivityIndicator size="small" color="#0F172A" /> : <Text className="text-[#0F172A] text-xs font-bold">Save Temp</Text>}
              </TouchableOpacity>
              <TouchableOpacity onPress={handleLockApti} disabled={savingAptiTemp || lockingApti || isAptiLocked} className="flex-1 bg-[#4F46E5] py-3 rounded-xl items-center flex-row justify-center disabled:opacity-50">
                {lockingApti ? <ActivityIndicator size="small" color="#fff" /> : (
                  <>
                    <Lock size={14} color="#fff" />
                    <Text className="text-white text-xs font-black ml-1.5">{isAptiLocked ? 'Locked' : 'Lock Selection'}</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>
      </Modal>

    </SafeAreaView>
  );
}
