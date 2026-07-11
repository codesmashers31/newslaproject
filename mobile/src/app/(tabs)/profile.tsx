import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  RefreshControl,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import API from '../../services/api';
import { 
  User, 
  Mail, 
  Phone, 
  Briefcase, 
  Code2, 
  BookOpen, 
  MapPin, 
  Calendar,
  Sparkles,
  Camera,
  Save,
  GraduationCap
} from 'lucide-react-native';

export default function ProfileScreen() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [profileData, setProfileData] = useState({
    collegeName: '',
    degree: '',
    department: '',
    yearOfPassing: '',
    dob: '',
    gender: '',
    address: '',
    skills: '',
    linkedin: '',
    github: '',
    bio: '',
    name: '',
    mobile: '',
    email: '',
    technicalBatch: '',
    technicalTrainer: '',
    communicationBatch: '',
    communicationTrainer: '',
    aptitudeBatch: '',
    aptitudeTrainer: '',
  });

  const [availableBatches, setAvailableBatches] = useState<any[]>([]);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [currentPhotoPath, setCurrentPhotoPath] = useState<string>('');

  const getServerRoot = () => {
    const base = API.defaults.baseURL;
    if (base) {
      return base.replace('/api', '');
    }
    return 'http://172.17.1.232:5000';
  };

  const loadProfileData = async () => {
    try {
      const { data } = await API.get('/student/dashboard');
      const student = data?.profile?.user || {};
      const p = data?.profile || {};
      
      setProfileData({
        collegeName: p.collegeName || '',
        degree: p.degree || '',
        department: p.department || '',
        yearOfPassing: p.yearOfPassing || '',
        dob: p.dob ? new Date(p.dob).toISOString().split('T')[0] : '',
        gender: p.gender || '',
        address: p.address || '',
        skills: p.skills?.join(', ') || '',
        linkedin: p.linkedin || '',
        github: p.github || '',
        bio: p.bio || '',
        name: student.name || '',
        mobile: student.mobile || '',
        email: student.email || '',
        technicalBatch: student.technicalBatch || '',
        technicalTrainer: student.technicalTrainer || '',
        communicationBatch: student.communicationBatch || '',
        communicationTrainer: student.communicationTrainer || '',
        aptitudeBatch: student.aptitudeBatch || '',
        aptitudeTrainer: student.aptitudeTrainer || '',
      });
      setCurrentPhotoPath(p.photo || '');
      setSelectedPhoto(null);

      // Fetch active batches for selection dropdowns
      try {
        const { data: batchesData } = await API.get('/student/batches');
        setAvailableBatches(batchesData || []);
      } catch (err) {
        console.error('Failed to load available batches list', err);
      }

    } catch (error: any) {
      console.error('Failed to load profile details', error?.message);
      Alert.alert('Error', 'Could not load profile details.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadProfileData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadProfileData();
  };

  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'We need camera roll permissions to select a photo.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setSelectedPhoto(result.assets[0].uri);
    }
  };

  const handleSave = async () => {
    if (!profileData.name.trim() || !profileData.mobile.trim()) {
      Alert.alert('Validation Error', 'Name and Mobile Number are required.');
      return;
    }

    setSaving(true);
    try {
      // 1. Prepare FormData
      const formData = new FormData();
      
      // Append all profile data
      formData.append('collegeName', profileData.collegeName);
      formData.append('degree', profileData.degree);
      formData.append('department', profileData.department);
      formData.append('yearOfPassing', profileData.yearOfPassing);
      formData.append('dob', profileData.dob);
      formData.append('gender', profileData.gender);
      formData.append('address', profileData.address);
      formData.append('linkedin', profileData.linkedin);
      formData.append('github', profileData.github);
      formData.append('bio', profileData.bio);
      
      // Append batch updates
      formData.append('technicalBatch', profileData.technicalBatch);
      formData.append('technicalTrainer', profileData.technicalTrainer);
      formData.append('communicationBatch', profileData.communicationBatch);
      formData.append('communicationTrainer', profileData.communicationTrainer);
      formData.append('aptitudeBatch', profileData.aptitudeBatch);
      formData.append('aptitudeTrainer', profileData.aptitudeTrainer);
      
      // Handle skills array formatting
      const skillsArr = profileData.skills
        ? profileData.skills.split(',').map(s => s.trim()).filter(Boolean)
        : [];
      skillsArr.forEach(skill => {
        formData.append('skills[]', skill);
      });

      // Append photo if selected
      if (selectedPhoto) {
        const filename = selectedPhoto.split('/').pop() || 'photo.jpg';
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : `image/jpeg`;
        
        formData.append('photo', {
          uri: Platform.OS === 'ios' ? selectedPhoto.replace('file://', '') : selectedPhoto,
          name: filename,
          type: type,
        } as any);
      }

      // 2. Save via API (Profile details and trainers)
      await API.put('/student/profile', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      // 3. Sync user basic details (name, mobile) to the auth model
      await API.put('/auth/me', {
        name: profileData.name,
        mobile: profileData.mobile,
      });

      Alert.alert('Success', 'Your profile details have been saved successfully.');
      loadProfileData();
    } catch (error: any) {
      console.error('Failed to update student profile', error);
      const msg = error?.response?.data?.message || 'Error updating profile details.';
      Alert.alert('Error', msg);
    } finally {
      setSaving(false);
    }
  };

  const toggleBatchSelection = (category: 'technical' | 'communication' | 'aptitude', batchName: string, trainerName?: string) => {
    const batchKey = category === 'technical' ? 'technicalBatch' : category === 'communication' ? 'communicationBatch' : 'aptitudeBatch';
    const trainerKey = category === 'technical' ? 'technicalTrainer' : category === 'communication' ? 'communicationTrainer' : 'aptitudeTrainer';

    let currentBatches = profileData[batchKey].split(',').map(s => s.trim()).filter(Boolean);
    let currentTrainers = profileData[trainerKey].split(',').map(s => s.trim()).filter(Boolean);

    if (currentBatches.includes(batchName)) {
      currentBatches = currentBatches.filter(b => b !== batchName);
      if (trainerName) currentTrainers = currentTrainers.filter(t => t !== trainerName);
    } else {
      currentBatches.push(batchName);
      if (trainerName && !currentTrainers.includes(trainerName)) currentTrainers.push(trainerName);
    }

    setProfileData({
      ...profileData,
      [batchKey]: currentBatches.join(', '),
      [trainerKey]: currentTrainers.join(', ')
    });
  };

  if (loading) {
    return (
      <View className="flex-1 bg-slate-950 items-center justify-center">
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  const avatarSource = selectedPhoto 
    ? { uri: selectedPhoto } 
    : currentPhotoPath 
    ? { uri: `${getServerRoot()}${currentPhotoPath}` } 
    : null;

  // Filter batches by category
  const techBatches = availableBatches.filter(b => b.course === 'Technical Training' || (!b.course?.includes('Communication') && !b.course?.includes('Aptitude')));
  const commBatches = availableBatches.filter(b => b.course?.includes('Communication'));
  const aptiBatches = availableBatches.filter(b => b.course?.includes('Aptitude'));

  return (
    <SafeAreaView className="flex-1 bg-slate-950">
      <StatusBar barStyle="light-content" />
      
      {/* Header */}
      <View className="px-6 py-4 border-b border-slate-900 bg-slate-950 flex-row justify-between items-center">
        <View>
          <Text className="text-xl font-black text-white">Edit Profile</Text>
          <Text className="text-xs text-slate-500">Update academic info & details</Text>
        </View>
        <TouchableOpacity
          onPress={handleSave}
          disabled={saving}
          className="bg-indigo-600 px-4 py-2.5 rounded-xl flex-row items-center space-x-1.5 shadow-sm"
        >
          {saving ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <>
              <Save size={14} color="#ffffff" style={{ marginRight: 4 }} />
              <Text className="text-white text-xs font-bold">Save</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1"
      >
        <ScrollView
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#6366f1" />
          }
          className="flex-1 px-6 py-4"
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Avatar Picture Card */}
          <View className="bg-slate-900 border border-slate-800 rounded-3xl p-6 items-center mb-6">
            <TouchableOpacity onPress={handlePickImage} activeOpacity={0.8} className="relative">
              <View className="h-28 w-28 rounded-full border-2 border-indigo-500 overflow-hidden bg-slate-800 items-center justify-center shadow-lg relative">
                {avatarSource ? (
                  <Image source={avatarSource} className="h-full w-full" contentFit="cover" />
                ) : (
                  <User size={48} color="#64748b" />
                )}
              </View>
              <View className="absolute bottom-0 right-0 bg-indigo-600 p-2 rounded-full border-2 border-slate-950">
                <Camera size={14} color="#ffffff" />
              </View>
            </TouchableOpacity>
            
            <Text className="text-white font-extrabold text-base mt-4">{profileData.name || 'Student'}</Text>
            <Text className="text-slate-400 text-xs mt-0.5">{profileData.email}</Text>
          </View>

          {/* Form Content */}
          <View className="mb-12">
            
            {/* Bio */}
            <View className="mb-6">
              <Text className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Short Bio</Text>
              <TextInput
                multiline
                numberOfLines={3}
                value={profileData.bio}
                onChangeText={(text) => setProfileData({ ...profileData, bio: text })}
                placeholder="Tell us about yourself, career goals or specializations..."
                placeholderTextColor="#475569"
                className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-4 text-white text-xs font-semibold text-left"
                style={{ minHeight: 80, textAlignVertical: 'top' }}
              />
            </View>

            {/* Basic Info Header */}
            <Text className="text-[10px] font-black text-slate-500 uppercase tracking-wider mb-4 mt-2">Personal Info</Text>

            {/* Name */}
            <View className="mb-5">
              <Text className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Full Name</Text>
              <View className="flex-row items-center bg-slate-900 border border-slate-800 rounded-2xl px-4 h-12">
                <User size={16} color="#64748b" style={{ marginRight: 8 }} />
                <TextInput
                  value={profileData.name}
                  onChangeText={(text) => setProfileData({ ...profileData, name: text })}
                  placeholder="Enter full name"
                  placeholderTextColor="#475569"
                  className="flex-1 text-white text-xs font-semibold"
                />
              </View>
            </View>

            {/* Mobile */}
            <View className="mb-6">
              <Text className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Mobile Number</Text>
              <View className="flex-row items-center bg-slate-900 border border-slate-800 rounded-2xl px-4 h-12">
                <Phone size={16} color="#64748b" style={{ marginRight: 8 }} />
                <TextInput
                  value={profileData.mobile}
                  onChangeText={(text) => setProfileData({ ...profileData, mobile: text })}
                  placeholder="Enter mobile number"
                  placeholderTextColor="#475569"
                  keyboardType="phone-pad"
                  className="flex-1 text-white text-xs font-semibold"
                />
              </View>
            </View>

            {/* Assigned Cohort Batches & Trainers Header */}
            <Text className="text-[10px] font-black text-slate-500 uppercase tracking-wider mb-4 mt-2">Assigned Cohorts & Trainers</Text>

            {/* Technical Domain */}
            <View className="mb-6 bg-slate-900/40 border border-slate-900 rounded-3xl p-4">
              <Text className="text-white font-extrabold text-xs mb-3 text-indigo-400 uppercase tracking-wide">Technical Training</Text>
              {techBatches.length > 0 ? (
                <View className="space-y-2 mb-3">
                  {techBatches.map((b: any) => {
                    const trainerName = b.trainers && b.trainers.length > 0 ? b.trainers.map((t: any) => t.name).join(', ') : 'No Trainer';
                    const isSelected = profileData.technicalBatch.split(',').map(s => s.trim()).includes(b.name);
                    return (
                      <TouchableOpacity
                        key={b._id}
                        onPress={() => toggleBatchSelection('technical', b.name, b.trainers?.[0]?.name)}
                        className={`flex-row justify-between items-center p-3 rounded-2xl border mb-2 ${isSelected ? 'bg-indigo-600/10 border-indigo-500' : 'bg-slate-950/60 border-slate-800'}`}
                      >
                        <View className="flex-1 pr-3">
                          <Text className="text-white font-bold text-xs">{b.name}</Text>
                          <Text className="text-slate-400 text-[10px] mt-0.5">Trainer: {trainerName}</Text>
                        </View>
                        <View className={`h-5 w-5 rounded-md border items-center justify-center ${isSelected ? 'bg-indigo-600 border-indigo-500' : 'border-slate-700'}`}>
                          {isSelected && <Text className="text-white text-[10px] font-bold">✓</Text>}
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              ) : (
                <Text className="text-[10px] text-slate-500 italic mb-3">No active Technical batches found.</Text>
              )}
              {/* Fallback Text Fields */}
              <View className="mb-3">
                <Text className="text-[9px] font-bold text-slate-400 uppercase mb-1.5">Selected Technical Batches (Manual Override)</Text>
                <TextInput
                  value={profileData.technicalBatch}
                  onChangeText={(text) => setProfileData({ ...profileData, technicalBatch: text })}
                  placeholder="e.g. Batch A, Batch B"
                  placeholderTextColor="#475569"
                  className="bg-slate-950 border border-slate-800 rounded-xl px-3 h-10 text-white text-xs font-semibold"
                />
              </View>
              <View>
                <Text className="text-[9px] font-bold text-slate-400 uppercase mb-1.5">Selected Technical Trainers (Manual Override)</Text>
                <TextInput
                  value={profileData.technicalTrainer}
                  onChangeText={(text) => setProfileData({ ...profileData, technicalTrainer: text })}
                  placeholder="Trainer names"
                  placeholderTextColor="#475569"
                  className="bg-slate-950 border border-slate-800 rounded-xl px-3 h-10 text-white text-xs font-semibold"
                />
              </View>
            </View>

            {/* Communication Domain */}
            <View className="mb-6 bg-slate-900/40 border border-slate-900 rounded-3xl p-4">
              <Text className="text-white font-extrabold text-xs mb-3 text-indigo-400 uppercase tracking-wide">Communication Skills</Text>
              {commBatches.length > 0 ? (
                <View className="space-y-2 mb-3">
                  {commBatches.map((b: any) => {
                    const trainerName = b.trainers && b.trainers.length > 0 ? b.trainers.map((t: any) => t.name).join(', ') : 'No Trainer';
                    const isSelected = profileData.communicationBatch.split(',').map(s => s.trim()).includes(b.name);
                    return (
                      <TouchableOpacity
                        key={b._id}
                        onPress={() => toggleBatchSelection('communication', b.name, b.trainers?.[0]?.name)}
                        className={`flex-row justify-between items-center p-3 rounded-2xl border mb-2 ${isSelected ? 'bg-indigo-600/10 border-indigo-500' : 'bg-slate-950/60 border-slate-800'}`}
                      >
                        <View className="flex-1 pr-3">
                          <Text className="text-white font-bold text-xs">{b.name}</Text>
                          <Text className="text-slate-400 text-[10px] mt-0.5">Trainer: {trainerName}</Text>
                        </View>
                        <View className={`h-5 w-5 rounded-md border items-center justify-center ${isSelected ? 'bg-indigo-600 border-indigo-500' : 'border-slate-700'}`}>
                          {isSelected && <Text className="text-white text-[10px] font-bold">✓</Text>}
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              ) : (
                <Text className="text-[10px] text-slate-500 italic mb-3">No active Communication batches found.</Text>
              )}
              {/* Fallback Text Fields */}
              <View className="mb-3">
                <Text className="text-[9px] font-bold text-slate-400 uppercase mb-1.5">Selected Communication Batches (Manual Override)</Text>
                <TextInput
                  value={profileData.communicationBatch}
                  onChangeText={(text) => setProfileData({ ...profileData, communicationBatch: text })}
                  placeholder="e.g. Batch A"
                  placeholderTextColor="#475569"
                  className="bg-slate-950 border border-slate-800 rounded-xl px-3 h-10 text-white text-xs font-semibold"
                />
              </View>
              <View>
                <Text className="text-[9px] font-bold text-slate-400 uppercase mb-1.5">Selected Communication Trainers (Manual Override)</Text>
                <TextInput
                  value={profileData.communicationTrainer}
                  onChangeText={(text) => setProfileData({ ...profileData, communicationTrainer: text })}
                  placeholder="Trainer names"
                  placeholderTextColor="#475569"
                  className="bg-slate-950 border border-slate-800 rounded-xl px-3 h-10 text-white text-xs font-semibold"
                />
              </View>
            </View>

            {/* Aptitude Domain */}
            <View className="mb-6 bg-slate-900/40 border border-slate-900 rounded-3xl p-4">
              <Text className="text-white font-extrabold text-xs mb-3 text-indigo-400 uppercase tracking-wide">Aptitude & Reasoning</Text>
              {aptiBatches.length > 0 ? (
                <View className="space-y-2 mb-3">
                  {aptiBatches.map((b: any) => {
                    const trainerName = b.trainers && b.trainers.length > 0 ? b.trainers.map((t: any) => t.name).join(', ') : 'No Trainer';
                    const isSelected = profileData.aptitudeBatch.split(',').map(s => s.trim()).includes(b.name);
                    return (
                      <TouchableOpacity
                        key={b._id}
                        onPress={() => toggleBatchSelection('aptitude', b.name, b.trainers?.[0]?.name)}
                        className={`flex-row justify-between items-center p-3 rounded-2xl border mb-2 ${isSelected ? 'bg-indigo-600/10 border-indigo-500' : 'bg-slate-950/60 border-slate-800'}`}
                      >
                        <View className="flex-1 pr-3">
                          <Text className="text-white font-bold text-xs">{b.name}</Text>
                          <Text className="text-slate-400 text-[10px] mt-0.5">Trainer: {trainerName}</Text>
                        </View>
                        <View className={`h-5 w-5 rounded-md border items-center justify-center ${isSelected ? 'bg-indigo-600 border-indigo-500' : 'border-slate-700'}`}>
                          {isSelected && <Text className="text-white text-[10px] font-bold">✓</Text>}
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              ) : (
                <Text className="text-[10px] text-slate-500 italic mb-3">No active Aptitude batches found.</Text>
              )}
              {/* Fallback Text Fields */}
              <View className="mb-3">
                <Text className="text-[9px] font-bold text-slate-400 uppercase mb-1.5">Selected Aptitude Batches (Manual Override)</Text>
                <TextInput
                  value={profileData.aptitudeBatch}
                  onChangeText={(text) => setProfileData({ ...profileData, aptitudeBatch: text })}
                  placeholder="e.g. Batch A"
                  placeholderTextColor="#475569"
                  className="bg-slate-950 border border-slate-800 rounded-xl px-3 h-10 text-white text-xs font-semibold"
                />
              </View>
              <View>
                <Text className="text-[9px] font-bold text-slate-400 uppercase mb-1.5">Selected Aptitude Trainers (Manual Override)</Text>
                <TextInput
                  value={profileData.aptitudeTrainer}
                  onChangeText={(text) => setProfileData({ ...profileData, aptitudeTrainer: text })}
                  placeholder="Trainer names"
                  placeholderTextColor="#475569"
                  className="bg-slate-950 border border-slate-800 rounded-xl px-3 h-10 text-white text-xs font-semibold"
                />
              </View>
            </View>

            {/* Academic Info Header */}
            <Text className="text-[10px] font-black text-slate-500 uppercase tracking-wider mb-4 mt-2">Academic Details</Text>

            {/* College Name */}
            <View className="mb-5">
              <Text className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">College Name</Text>
              <View className="flex-row items-center bg-slate-900 border border-slate-800 rounded-2xl px-4 h-12">
                <GraduationCap size={16} color="#64748b" style={{ marginRight: 8 }} />
                <TextInput
                  value={profileData.collegeName}
                  onChangeText={(text) => setProfileData({ ...profileData, collegeName: text })}
                  placeholder="Enter college name"
                  placeholderTextColor="#475569"
                  className="flex-1 text-white text-xs font-semibold"
                />
              </View>
            </View>

            {/* Degree */}
            <View className="mb-5">
              <Text className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Degree</Text>
              <View className="flex-row items-center bg-slate-900 border border-slate-800 rounded-2xl px-4 h-12">
                <BookOpen size={16} color="#64748b" style={{ marginRight: 8 }} />
                <TextInput
                  value={profileData.degree}
                  onChangeText={(text) => setProfileData({ ...profileData, degree: text })}
                  placeholder="e.g. B.E, B.Tech, MCA, BSc"
                  placeholderTextColor="#475569"
                  className="flex-1 text-white text-xs font-semibold"
                />
              </View>
            </View>

            {/* Department */}
            <View className="mb-5">
              <Text className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Department</Text>
              <View className="flex-row items-center bg-slate-900 border border-slate-800 rounded-2xl px-4 h-12">
                <BookOpen size={16} color="#64748b" style={{ marginRight: 8 }} />
                <TextInput
                  value={profileData.department}
                  onChangeText={(text) => setProfileData({ ...profileData, department: text })}
                  placeholder="e.g. Computer Science, Information Technology"
                  placeholderTextColor="#475569"
                  className="flex-1 text-white text-xs font-semibold"
                />
              </View>
            </View>

            {/* Year of Passing */}
            <View className="mb-5">
              <Text className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Year of Passing</Text>
              <View className="flex-row items-center bg-slate-900 border border-slate-800 rounded-2xl px-4 h-12">
                <Calendar size={16} color="#64748b" style={{ marginRight: 8 }} />
                <TextInput
                  value={profileData.yearOfPassing}
                  onChangeText={(text) => setProfileData({ ...profileData, yearOfPassing: text })}
                  placeholder="e.g. 2024, 2025"
                  placeholderTextColor="#475569"
                  keyboardType="numeric"
                  className="flex-1 text-white text-xs font-semibold"
                />
              </View>
            </View>

            {/* Gender */}
            <View className="mb-5">
              <Text className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Gender</Text>
              <View className="flex-row items-center bg-slate-900 border border-slate-800 rounded-2xl px-4 h-12">
                <User size={16} color="#64748b" style={{ marginRight: 8 }} />
                <TextInput
                  value={profileData.gender}
                  onChangeText={(text) => setProfileData({ ...profileData, gender: text })}
                  placeholder="e.g. Male, Female, Other"
                  placeholderTextColor="#475569"
                  className="flex-1 text-white text-xs font-semibold"
                />
              </View>
            </View>

            {/* Date of Birth */}
            <View className="mb-5">
              <Text className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Date of Birth</Text>
              <View className="flex-row items-center bg-slate-900 border border-slate-800 rounded-2xl px-4 h-12">
                <Calendar size={16} color="#64748b" style={{ marginRight: 8 }} />
                <TextInput
                  value={profileData.dob}
                  onChangeText={(text) => setProfileData({ ...profileData, dob: text })}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor="#475569"
                  className="flex-1 text-white text-xs font-semibold"
                />
              </View>
            </View>

            {/* Skills */}
            <View className="mb-5">
              <Text className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Skills (comma-separated)</Text>
              <View className="flex-row items-center bg-slate-900 border border-slate-800 rounded-2xl px-4 h-12">
                <Sparkles size={16} color="#64748b" style={{ marginRight: 8 }} />
                <TextInput
                  value={profileData.skills}
                  onChangeText={(text) => setProfileData({ ...profileData, skills: text })}
                  placeholder="e.g. React, Node.js, Python, SQL"
                  placeholderTextColor="#475569"
                  className="flex-1 text-white text-xs font-semibold"
                />
              </View>
            </View>

            {/* Address */}
            <View className="mb-6">
              <Text className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Home Address</Text>
              <View className="flex-row items-center bg-slate-900 border border-slate-800 rounded-2xl px-4 h-12">
                <MapPin size={16} color="#64748b" style={{ marginRight: 8 }} />
                <TextInput
                  value={profileData.address}
                  onChangeText={(text) => setProfileData({ ...profileData, address: text })}
                  placeholder="Enter full address"
                  placeholderTextColor="#475569"
                  className="flex-1 text-white text-xs font-semibold"
                />
              </View>
            </View>

            {/* Professional Links Header */}
            <Text className="text-[10px] font-black text-slate-500 uppercase tracking-wider mb-4 mt-2">Professional Handles</Text>

            {/* LinkedIn */}
            <View className="mb-5">
              <Text className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">LinkedIn Profile Link</Text>
              <View className="flex-row items-center bg-slate-900 border border-slate-800 rounded-2xl px-4 h-12">
                <Briefcase size={16} color="#64748b" style={{ marginRight: 8 }} />
                <TextInput
                  value={profileData.linkedin}
                  onChangeText={(text) => setProfileData({ ...profileData, linkedin: text })}
                  placeholder="https://linkedin.com/in/username"
                  placeholderTextColor="#475569"
                  autoCapitalize="none"
                  className="flex-1 text-white text-xs font-semibold"
                />
              </View>
            </View>

            {/* GitHub */}
            <View className="mb-5">
              <Text className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">GitHub Profile Link</Text>
              <View className="flex-row items-center bg-slate-900 border border-slate-800 rounded-2xl px-4 h-12">
                <Code2 size={16} color="#64748b" style={{ marginRight: 8 }} />
                <TextInput
                  value={profileData.github}
                  onChangeText={(text) => setProfileData({ ...profileData, github: text })}
                  placeholder="https://github.com/username"
                  placeholderTextColor="#475569"
                  autoCapitalize="none"
                  className="flex-1 text-white text-xs font-semibold"
                />
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
