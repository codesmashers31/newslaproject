import React, { useState, useEffect } from 'react';
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
import API from '../../services/api';
import { 
  BookOpen,
  CheckCircle2,
  X,
  Search,
  Lock
} from 'lucide-react-native';

export default function TrainingScreen() {
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
      Alert.alert('Error', 'Could not load your training data.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

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
      Alert.alert('Success', 'Your enrollments have been updated successfully.');
      loadData();
    } catch (error: any) {
      const msg = error?.response?.data?.message || 'Failed to update enrollments';
      Alert.alert('Error', msg);
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
      <View className="flex-1 bg-slate-950 items-center justify-center">
        <ActivityIndicator size="large" color="#6366f1" />
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
    <SafeAreaView className="flex-1 bg-slate-950">
      <StatusBar barStyle="light-content" />
      
      <View className="px-6 py-4 border-b border-slate-900 bg-slate-950 flex-row items-center space-x-3">
        <View className="p-2 bg-indigo-500/10 rounded-xl border border-indigo-500/20">
          <BookOpen size={20} color="#818cf8" />
        </View>
        <View>
          <Text className="text-xl font-black text-white">My Training</Text>
          <Text className="text-xs text-slate-500">Manage your batch enrollments</Text>
        </View>
      </View>

      <ScrollView 
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#6366f1" />}
        className="flex-1 px-6 py-4"
      >
        <Text className="text-[10px] font-black text-slate-500 uppercase tracking-wider mb-4 mt-2">Assigned Cohorts & Trainers</Text>

        {/* Technical Domain */}
        <View className="mb-4 bg-slate-900/40 border border-slate-900 rounded-3xl p-5">
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-white font-extrabold text-xs text-indigo-400 uppercase tracking-wide">Technical Training</Text>
            {isLocked ? (
              <View className="bg-slate-800/50 px-3 py-1.5 rounded-lg flex-row items-center">
                <Lock size={12} color="#94a3b8" />
                <Text className="text-slate-400 text-[10px] font-bold uppercase tracking-wider ml-1">Locked</Text>
              </View>
            ) : (
              <TouchableOpacity onPress={() => setTechModalVisible(true)} className="bg-indigo-500/10 px-3 py-1.5 rounded-lg border border-indigo-500/20">
                <Text className="text-indigo-400 text-xs font-bold">Manage</Text>
              </TouchableOpacity>
            )}
          </View>
          
          {techBatches.length > 0 ? techBatches.map((b, idx) => (
            <View key={b._id} className={idx < techBatches.length - 1 ? "mb-4 border-b border-slate-800 pb-4" : ""}>
              <View className="flex-row justify-between mb-2">
                <Text className="text-slate-400 text-xs font-semibold">Assigned Batch:</Text>
                <Text className="text-white text-xs font-bold">{b.name}</Text>
              </View>
              <View className="flex-row justify-between">
                <Text className="text-slate-400 text-xs font-semibold">Trainer:</Text>
                <Text className="text-white text-xs font-bold">{b.trainers && b.trainers.length > 0 ? b.trainers[0].name : 'Auto-Assigned'}</Text>
              </View>
            </View>
          )) : (
            <Text className="text-slate-500 text-xs italic text-center py-2">No technical batches selected.</Text>
          )}
        </View>

        {/* Communication Domain */}
        <View className="mb-4 bg-slate-900/40 border border-slate-900 rounded-3xl p-5">
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-white font-extrabold text-xs text-emerald-400 uppercase tracking-wide">Communication Skills</Text>
            <View className="bg-slate-800/50 px-3 py-1.5 rounded-lg border border-slate-700/50">
              <Text className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Read Only</Text>
            </View>
          </View>
          <View className="flex-row justify-between mb-2">
            <Text className="text-slate-400 text-xs font-semibold">Assigned Batch:</Text>
            <Text className="text-white text-xs font-bold">{commBatch ? commBatch.name : 'Unassigned'}</Text>
          </View>
          <View className="flex-row justify-between">
            <Text className="text-slate-400 text-xs font-semibold">Trainer:</Text>
            <Text className="text-white text-xs font-bold">{commBatch && commBatch.trainers && commBatch.trainers.length > 0 ? commBatch.trainers[0].name : 'Auto-Assigned'}</Text>
          </View>
        </View>

        {/* Aptitude Domain */}
        <View className="mb-8 bg-slate-900/40 border border-slate-900 rounded-3xl p-5">
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-white font-extrabold text-xs text-fuchsia-400 uppercase tracking-wide">Aptitude & Reasoning</Text>
            {isLocked ? (
              <View className="bg-slate-800/50 px-3 py-1.5 rounded-lg flex-row items-center">
                <Lock size={12} color="#94a3b8" />
                <Text className="text-slate-400 text-[10px] font-bold uppercase tracking-wider ml-1">Locked</Text>
              </View>
            ) : (
              <TouchableOpacity onPress={() => setAptiModalVisible(true)} className="bg-fuchsia-500/10 px-3 py-1.5 rounded-lg border border-fuchsia-500/20">
                <Text className="text-fuchsia-400 text-xs font-bold">Change</Text>
              </TouchableOpacity>
            )}
          </View>
          <View className="flex-row justify-between mb-2">
            <Text className="text-slate-400 text-xs font-semibold">Assigned Batch:</Text>
            <Text className="text-white text-xs font-bold">{aptiBatch ? aptiBatch.name : 'Unassigned'}</Text>
          </View>
          <View className="flex-row justify-between">
            <Text className="text-slate-400 text-xs font-semibold">Trainer:</Text>
            <Text className="text-white text-xs font-bold">{aptiBatch && aptiBatch.trainers && aptiBatch.trainers.length > 0 ? aptiBatch.trainers[0].name : 'Auto-Assigned'}</Text>
          </View>
        </View>

        <View className="h-10" />
      </ScrollView>

      {/* Tech Batches Modal */}
      <Modal visible={techModalVisible} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setTechModalVisible(false)}>
        <View className="flex-1 bg-slate-950 p-6">
          <View className="flex-row justify-between items-center mb-6">
            <Text className="text-lg font-black text-white">Manage Technical Batches</Text>
            <TouchableOpacity onPress={() => {
              setTechModalVisible(false);
              setSelectedTechIds(techBatches.map(b => b._id));
            }}>
              <X size={24} color="#94a3b8" />
            </TouchableOpacity>
          </View>
          
          <View className="flex-row items-center bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 mb-4">
            <Search size={18} color="#94a3b8" />
            <TextInput 
              placeholder="Search batches by name or trainer..."
              placeholderTextColor="#64748b"
              value={techSearchQuery}
              onChangeText={setTechSearchQuery}
              className="flex-1 text-white ml-3"
            />
          </View>
          
          <Text className="text-slate-400 text-xs mb-4">You can select multiple technical batches. Trainers will be assigned automatically.</Text>
          
          <ScrollView className="flex-1">
            {availTechBatches.map(b => {
              const isSelected = selectedTechIds.includes(b._id);
              return (
                <TouchableOpacity 
                  key={b._id} 
                  onPress={() => toggleTechBatch(b._id)}
                  className={`flex-row items-center p-4 mb-3 rounded-2xl border ${isSelected ? 'bg-indigo-500/10 border-indigo-500/30' : 'bg-slate-900 border-slate-800'}`}
                >
                  <View className={`w-6 h-6 rounded-full border items-center justify-center mr-4 ${isSelected ? 'bg-indigo-500 border-indigo-500' : 'border-slate-600'}`}>
                    {isSelected && <CheckCircle2 size={14} color="#fff" />}
                  </View>
                  <View className="flex-1">
                    <Text className="text-white font-bold">{b.name}</Text>
                    <Text className="text-slate-400 text-xs mt-1">Trainer: {b.trainers && b.trainers.length > 0 ? b.trainers[0].name : 'N/A'}</Text>
                  </View>
                </TouchableOpacity>
              )
            })}
          </ScrollView>
          <View className="flex-row space-x-3 mt-4">
            <TouchableOpacity onPress={() => handleSaveBatches(false)} disabled={saving} className="flex-1 bg-slate-800 border border-slate-700 p-4 rounded-xl items-center">
              {saving ? <ActivityIndicator color="#fff" /> : <Text className="text-white font-bold">Save Temporarily</Text>}
            </TouchableOpacity>
            <TouchableOpacity onPress={handleLockBatches} disabled={saving} className="flex-1 bg-indigo-500 p-4 rounded-xl items-center flex-row justify-center">
              {saving ? <ActivityIndicator color="#fff" /> : (
                <>
                  <Lock size={16} color="#fff" />
                  <Text className="text-white font-black ml-2">Lock Selection</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Aptitude Batch Modal */}
      <Modal visible={aptiModalVisible} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setAptiModalVisible(false)}>
        <View className="flex-1 bg-slate-950 p-6">
          <View className="flex-row justify-between items-center mb-6">
            <Text className="text-lg font-black text-white">Select Aptitude Batch</Text>
            <TouchableOpacity onPress={() => {
              setAptiModalVisible(false);
              setSelectedAptiId(aptiBatch ? aptiBatch._id : null);
            }}>
              <X size={24} color="#94a3b8" />
            </TouchableOpacity>
          </View>
          
          <View className="flex-row items-center bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 mb-4">
            <Search size={18} color="#94a3b8" />
            <TextInput 
              placeholder="Search batches by name or trainer..."
              placeholderTextColor="#64748b"
              value={aptiSearchQuery}
              onChangeText={setAptiSearchQuery}
              className="flex-1 text-white ml-3"
            />
          </View>
          
          <Text className="text-slate-400 text-xs mb-4">You can only select one aptitude batch at a time. Selecting a new one will replace the current one.</Text>
          
          <ScrollView className="flex-1">
            {availAptiBatches.map(b => {
              const isSelected = selectedAptiId === b._id;
              return (
                <TouchableOpacity 
                  key={b._id} 
                  onPress={() => setSelectedAptiId(b._id)}
                  className={`flex-row items-center p-4 mb-3 rounded-2xl border ${isSelected ? 'bg-fuchsia-500/10 border-fuchsia-500/30' : 'bg-slate-900 border-slate-800'}`}
                >
                  <View className={`w-6 h-6 rounded-full border items-center justify-center mr-4 ${isSelected ? 'bg-fuchsia-500 border-fuchsia-500' : 'border-slate-600'}`}>
                    {isSelected && <CheckCircle2 size={14} color="#fff" />}
                  </View>
                  <View className="flex-1">
                    <Text className="text-white font-bold">{b.name}</Text>
                    <Text className="text-slate-400 text-xs mt-1">Trainer: {b.trainers && b.trainers.length > 0 ? b.trainers[0].name : 'N/A'}</Text>
                  </View>
                </TouchableOpacity>
              )
            })}
          </ScrollView>
          <View className="flex-row space-x-3 mt-4">
            <TouchableOpacity onPress={() => handleSaveBatches(false)} disabled={saving} className="flex-1 bg-slate-800 border border-slate-700 p-4 rounded-xl items-center">
              {saving ? <ActivityIndicator color="#fff" /> : <Text className="text-white font-bold">Save Temporarily</Text>}
            </TouchableOpacity>
            <TouchableOpacity onPress={handleLockBatches} disabled={saving} className="flex-1 bg-fuchsia-500 p-4 rounded-xl items-center flex-row justify-center">
              {saving ? <ActivityIndicator color="#fff" /> : (
                <>
                  <Lock size={16} color="#fff" />
                  <Text className="text-white font-black ml-2">Lock Selection</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}
