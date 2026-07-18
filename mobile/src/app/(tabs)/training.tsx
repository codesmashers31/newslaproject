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
  const muted = isDark ? '#A79AC2' : '#6B6478';
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
  
  // Lock State
  const [isLocked, setIsLocked] = useState(false);

  const loadData = async () => {
    try {
      const [dashRes, batchRes] = await Promise.all([
        API.get('/student/dashboard'),
        API.get('/student/batches')
      ]);
      
      const myBatches = dashRes.data?.batches || [];
      setBatches(myBatches);
      setAvailableBatches(batchRes.data || []);
      setIsLocked(dashRes.data?.user?.isBatchesLocked || false);
      
      // Initialize selected tech ids
      const tech = myBatches.filter((b: any) => b.course?.includes('Technical'));
      setSelectedTechIds(tech.map((b: any) => b._id));
      
      // Initialize selected apti id
      const apti = myBatches.find((b: any) => b.course?.includes('Aptitude'));
      setSelectedAptiId(apti ? apti._id : null);
      
    } catch (error) {
      console.error('Failed to load training data', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Could not load your training data.',
      });
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

  const handleSaveBatches = async (isPermanent = false) => {
    setSaving(true);
    try {
      await API.post('/student/enrollments', {
        technicalBatchIds: selectedTechIds,
        aptitudeBatchId: selectedAptiId,
        isPermanent
      });
      setTechModalVisible(false);
      setAptiModalVisible(false);
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Your enrollments have been updated successfully.',
      });
      loadData();
    } catch (error: any) {
      const msg = error?.response?.data?.message || 'Failed to update enrollments';
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: msg,
      });
    } finally {
      setSaving(false);
    }
  };

  const handleLockBatches = () => {
    Alert.alert(
      "Lock Batches?",
      "Once you lock your batch selection, you will NOT be able to change it later. Are you sure you want to proceed?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Lock Forever", style: "destructive", onPress: () => handleSaveBatches(true) }
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
      <View className="flex-1 bg-[#F8F6FC] dark:bg-[#0E0A18] items-center justify-center">
        <ActivityIndicator size="large" color="#7c3aed" />
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
    <SafeAreaView className="flex-1 bg-[#F8F6FC] dark:bg-[#0E0A18]">
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      
      <View className="px-6 py-4 border-b border-[#510089]/[0.12] dark:border-[#C4A3FF]/[0.16] bg-white dark:bg-[#0E0A18] flex-row items-center space-x-3">
        <View className="p-2 bg-violet-500/10 rounded-xl border border-violet-500/20">
          <BookOpen size={20} color="#a78bfa" />
        </View>
        <View>
          <Text className="text-xl font-black text-[#1A1325] dark:text-[#F6F3FC]">My Training</Text>
          <Text className="text-xs text-[#6B6478] dark:text-[#A79AC2]">Manage your batch enrollments</Text>
        </View>
      </View>

      <ScrollView 
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#7c3aed" />}
        className="flex-1 px-6 py-4"
      >
        <Text className="text-[10px] font-black text-[#6B6478] dark:text-[#A79AC2] uppercase tracking-wider mb-4 mt-2">Assigned Cohorts & Trainers</Text>

        {/* Technical Domain */}
        <View className="mb-4 bg-white dark:bg-[#1C1530] border border-[#510089]/[0.12] dark:border-[#C4A3FF]/[0.16] rounded-3xl p-5">
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-[#1A1325] dark:text-[#F6F3FC] font-extrabold text-xs text-violet-400 uppercase tracking-wide">Technical Training</Text>
            {isLocked ? (
              <View className="bg-[#F1EBFB] dark:bg-[#251C3D] px-3 py-1.5 rounded-lg flex-row items-center">
                <Lock size={12} color={muted} />
                <Text className="text-[#6B6478] dark:text-[#A79AC2] text-[10px] font-bold uppercase tracking-wider ml-1">Locked</Text>
              </View>
            ) : (
              <TouchableOpacity onPress={() => setTechModalVisible(true)} className="bg-violet-500/10 px-3 py-1.5 rounded-lg border border-violet-500/20">
                <Text className="text-violet-400 text-xs font-bold">Manage</Text>
              </TouchableOpacity>
            )}
          </View>
          
          {techBatches.length > 0 ? techBatches.map((b, idx) => (
            <View key={b._id} className={idx < techBatches.length - 1 ? "mb-4 border-b border-[#510089]/[0.12] dark:border-[#C4A3FF]/[0.16] pb-4" : ""}>
              <View className="flex-row justify-between mb-2">
                <Text className="text-[#6B6478] dark:text-[#A79AC2] text-xs font-semibold">Assigned Batch:</Text>
                <Text className="text-[#1A1325] dark:text-[#F6F3FC] text-xs font-bold">{b.name}</Text>
              </View>
              <View className="flex-row justify-between">
                <Text className="text-[#6B6478] dark:text-[#A79AC2] text-xs font-semibold">Trainer:</Text>
                <Text className="text-[#1A1325] dark:text-[#F6F3FC] text-xs font-bold">{b.trainers && b.trainers.length > 0 ? b.trainers[0].name : 'Auto-Assigned'}</Text>
              </View>
            </View>
          )) : (
            <Text className="text-[#6B6478] dark:text-[#A79AC2] text-xs italic text-center py-2">No technical batches selected.</Text>
          )}
        </View>

        {/* Communication Domain */}
        <View className="mb-4 bg-white dark:bg-[#1C1530] border border-[#510089]/[0.12] dark:border-[#C4A3FF]/[0.16] rounded-3xl p-5">
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-[#1A1325] dark:text-[#F6F3FC] font-extrabold text-xs text-emerald-400 uppercase tracking-wide">Communication Skills</Text>
            <View className="bg-[#F1EBFB] dark:bg-[#251C3D] px-3 py-1.5 rounded-lg border border-[#510089]/[0.12] dark:border-[#C4A3FF]/[0.16]">
              <Text className="text-[#6B6478] dark:text-[#A79AC2] text-[10px] font-bold uppercase tracking-wider">Read Only</Text>
            </View>
          </View>
          <View className="flex-row justify-between mb-2">
            <Text className="text-[#6B6478] dark:text-[#A79AC2] text-xs font-semibold">Assigned Batch:</Text>
            <Text className="text-[#1A1325] dark:text-[#F6F3FC] text-xs font-bold">{commBatch ? commBatch.name : 'Unassigned'}</Text>
          </View>
          <View className="flex-row justify-between">
            <Text className="text-[#6B6478] dark:text-[#A79AC2] text-xs font-semibold">Trainer:</Text>
            <Text className="text-[#1A1325] dark:text-[#F6F3FC] text-xs font-bold">{commBatch && commBatch.trainers && commBatch.trainers.length > 0 ? commBatch.trainers[0].name : 'Auto-Assigned'}</Text>
          </View>
        </View>

        {/* Aptitude Domain */}
        <View className="mb-8 bg-white dark:bg-[#1C1530] border border-[#510089]/[0.12] dark:border-[#C4A3FF]/[0.16] rounded-3xl p-5">
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-[#1A1325] dark:text-[#F6F3FC] font-extrabold text-xs text-fuchsia-400 uppercase tracking-wide">Aptitude & Reasoning</Text>
            {isLocked ? (
              <View className="bg-[#F1EBFB] dark:bg-[#251C3D] px-3 py-1.5 rounded-lg flex-row items-center">
                <Lock size={12} color={muted} />
                <Text className="text-[#6B6478] dark:text-[#A79AC2] text-[10px] font-bold uppercase tracking-wider ml-1">Locked</Text>
              </View>
            ) : (
              <TouchableOpacity onPress={() => setAptiModalVisible(true)} className="bg-fuchsia-500/10 px-3 py-1.5 rounded-lg border border-fuchsia-500/20">
                <Text className="text-fuchsia-400 text-xs font-bold">Change</Text>
              </TouchableOpacity>
            )}
          </View>
          <View className="flex-row justify-between mb-2">
            <Text className="text-[#6B6478] dark:text-[#A79AC2] text-xs font-semibold">Assigned Batch:</Text>
            <Text className="text-[#1A1325] dark:text-[#F6F3FC] text-xs font-bold">{aptiBatch ? aptiBatch.name : 'Unassigned'}</Text>
          </View>
          <View className="flex-row justify-between">
            <Text className="text-[#6B6478] dark:text-[#A79AC2] text-xs font-semibold">Trainer:</Text>
            <Text className="text-[#1A1325] dark:text-[#F6F3FC] text-xs font-bold">{aptiBatch && aptiBatch.trainers && aptiBatch.trainers.length > 0 ? aptiBatch.trainers[0].name : 'Auto-Assigned'}</Text>
          </View>
        </View>

        <View className="h-10" />
      </ScrollView>

      {/* Tech Batches Modal */}
      <Modal visible={techModalVisible} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setTechModalVisible(false)}>
        <SafeAreaView className="flex-1 bg-[#F8F6FC] dark:bg-[#0E0A18]">
          <View className="flex-1 px-6 pt-4 pb-6">
            <View className="flex-row items-center mb-6">
              <TouchableOpacity onPress={() => {
                setTechModalVisible(false);
                setSelectedTechIds(techBatches.map(b => b._id));
              }} className="mr-4">
                <ArrowLeft size={24} color={muted} />
              </TouchableOpacity>
              <Text className="text-lg font-black text-[#1A1325] dark:text-[#F6F3FC] flex-1">Manage Technical Batches</Text>
            </View>
          
          <View className="flex-row items-center bg-white dark:bg-[#1C1530] border border-[#510089]/[0.12] dark:border-[#C4A3FF]/[0.16] rounded-lg px-3 py-2 mb-4">
            <Search size={14} color={muted} />
            <TextInput 
              placeholder="Search batches by name or trainer..."
              placeholderTextColor={muted}
              value={techSearchQuery}
              onChangeText={setTechSearchQuery}
              className="flex-1 text-[#1A1325] dark:text-[#F6F3FC] text-xs ml-2"
            />
          </View>
          
          <Text className="text-[#6B6478] dark:text-[#A79AC2] text-xs mb-4">You can select multiple technical batches. Trainers will be assigned automatically.</Text>
          
          <ScrollView className="flex-1">
            {availTechBatches.map(b => {
              const isSelected = selectedTechIds.includes(b._id);
              return (
                <TouchableOpacity 
                  key={b._id} 
                  onPress={() => toggleTechBatch(b._id)}
                  className={`flex-row items-center p-4 mb-3 rounded-2xl border ${isSelected ? 'bg-violet-500/10 border-violet-500/30' : 'bg-white dark:bg-[#1C1530] border-[#510089]/[0.12] dark:border-[#C4A3FF]/[0.16]'}`}
                >
                  <View className={`w-6 h-6 rounded-full border items-center justify-center mr-4 ${isSelected ? 'bg-violet-500 border-violet-500' : 'border-[#6B6478]/40 dark:border-[#A79AC2]/40'}`}>
                    {isSelected && <CheckCircle2 size={14} color="#fff" />}
                  </View>
                  <View className="flex-1">
                    <Text className="text-[#1A1325] dark:text-[#F6F3FC] font-bold">{b.name}</Text>
                    <Text className="text-[#6B6478] dark:text-[#A79AC2] text-xs mt-1">Trainer: {b.trainers && b.trainers.length > 0 ? b.trainers[0].name : 'N/A'}</Text>
                  </View>
                </TouchableOpacity>
              )
            })}
          </ScrollView>
          <View className="flex-row gap-4 mt-4">
            <TouchableOpacity onPress={() => handleSaveBatches(false)} disabled={saving} className="flex-1 bg-[#F1EBFB] dark:bg-[#251C3D] border border-[#510089]/[0.12] dark:border-[#C4A3FF]/[0.16] py-3 rounded-xl items-center">
              {saving ? <ActivityIndicator size="small" color="#fff" /> : <Text className="text-[#1A1325] dark:text-[#F6F3FC] text-xs font-bold">Save Temporarily</Text>}
            </TouchableOpacity>
            <TouchableOpacity onPress={handleLockBatches} disabled={saving} className="flex-1 bg-violet-500 py-3 rounded-xl items-center flex-row justify-center">
              {saving ? <ActivityIndicator size="small" color="#fff" /> : (
                <>
                  <Lock size={14} color="#fff" />
                  <Text className="text-white text-xs font-black ml-1.5">Lock Selection</Text>
                </>
              )}
            </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>
      </Modal>

      {/* Aptitude Batch Modal */}
      <Modal visible={aptiModalVisible} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setAptiModalVisible(false)}>
        <SafeAreaView className="flex-1 bg-[#F8F6FC] dark:bg-[#0E0A18]">
          <View className="flex-1 px-6 pt-4 pb-6">
            <View className="flex-row items-center mb-6">
              <TouchableOpacity onPress={() => {
                setAptiModalVisible(false);
                setSelectedAptiId(aptiBatch ? aptiBatch._id : null);
              }} className="mr-4">
                <ArrowLeft size={24} color={muted} />
              </TouchableOpacity>
              <Text className="text-lg font-black text-[#1A1325] dark:text-[#F6F3FC] flex-1">Select Aptitude Batch</Text>
            </View>
          
          <View className="flex-row items-center bg-white dark:bg-[#1C1530] border border-[#510089]/[0.12] dark:border-[#C4A3FF]/[0.16] rounded-lg px-3 py-2 mb-4">
            <Search size={14} color={muted} />
            <TextInput 
              placeholder="Search batches by name or trainer..."
              placeholderTextColor={muted}
              value={aptiSearchQuery}
              onChangeText={setAptiSearchQuery}
              className="flex-1 text-[#1A1325] dark:text-[#F6F3FC] text-xs ml-2"
            />
          </View>
          
          <Text className="text-[#6B6478] dark:text-[#A79AC2] text-xs mb-4">You can only select one aptitude batch at a time. Selecting a new one will replace the current one.</Text>
          
          <ScrollView className="flex-1">
            {availAptiBatches.map(b => {
              const isSelected = selectedAptiId === b._id;
              return (
                <TouchableOpacity 
                  key={b._id} 
                  onPress={() => setSelectedAptiId(b._id)}
                  className={`flex-row items-center p-4 mb-3 rounded-2xl border ${isSelected ? 'bg-fuchsia-500/10 border-fuchsia-500/30' : 'bg-white dark:bg-[#1C1530] border-[#510089]/[0.12] dark:border-[#C4A3FF]/[0.16]'}`}
                >
                  <View className={`w-6 h-6 rounded-full border items-center justify-center mr-4 ${isSelected ? 'bg-fuchsia-500 border-fuchsia-500' : 'border-[#6B6478]/40 dark:border-[#A79AC2]/40'}`}>
                    {isSelected && <CheckCircle2 size={14} color="#fff" />}
                  </View>
                  <View className="flex-1">
                    <Text className="text-[#1A1325] dark:text-[#F6F3FC] font-bold">{b.name}</Text>
                    <Text className="text-[#6B6478] dark:text-[#A79AC2] text-xs mt-1">Trainer: {b.trainers && b.trainers.length > 0 ? b.trainers[0].name : 'N/A'}</Text>
                  </View>
                </TouchableOpacity>
              )
            })}
          </ScrollView>
          <View className="flex-row gap-4 mt-4">
            <TouchableOpacity onPress={() => handleSaveBatches(false)} disabled={saving} className="flex-1 bg-[#F1EBFB] dark:bg-[#251C3D] border border-[#510089]/[0.12] dark:border-[#C4A3FF]/[0.16] py-3 rounded-xl items-center">
              {saving ? <ActivityIndicator size="small" color="#fff" /> : <Text className="text-[#1A1325] dark:text-[#F6F3FC] text-xs font-bold">Save Temporarily</Text>}
            </TouchableOpacity>
            <TouchableOpacity onPress={handleLockBatches} disabled={saving} className="flex-1 bg-fuchsia-500 py-3 rounded-xl items-center flex-row justify-center">
              {saving ? <ActivityIndicator size="small" color="#fff" /> : (
                <>
                  <Lock size={14} color="#fff" />
                  <Text className="text-white text-xs font-black ml-1.5">Lock Selection</Text>
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
