import React, { useState, useEffect, useCallback } from 'react';
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
import { useFocusEffect } from 'expo-router';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import Toast from 'react-native-toast-message';
import API from '../../services/api';
import { ScreenSkeleton } from '../../components/Skeleton';
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
  const primaryColor = '#4F46E5';
  const mutedColor = '#64748B';
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
  const [selectedPhoto, setSelectedPhoto] = useState<any>(null);
  const [currentPhotoPath, setCurrentPhotoPath] = useState<string>('');

  const [techSearch, setTechSearch] = useState('');
  const [commSearch, setCommSearch] = useState('');
  const [aptiSearch, setAptiSearch] = useState('');

  const getServerRoot = () => {
    const base = API.defaults.baseURL;
    if (base) {
      const root = base.replace('/api', '');
      return root.endsWith('/') ? root.slice(0, -1) : root;
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
      setCurrentPhotoPath(p.photo || student.photo || '');
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
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Could not load profile details.',
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadProfileData();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadProfileData();
  };

  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Toast.show({
        type: 'error',
        text1: 'Permission Denied',
        text2: 'We need camera roll permissions to select a photo.',
      });
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions ? ImagePicker.MediaTypeOptions.Images : ['images'] as any,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setSelectedPhoto(result.assets[0]);
    }
  };

  const handleSave = async () => {
    if (!profileData.name.trim() || !profileData.mobile.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Validation Error',
        text2: 'Name and Mobile Number are required.',
      });
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
      
      // Send skills as a comma-separated string directly (which matches the backend's split parser)
      formData.append('skills', profileData.skills || '');

      // Append photo if selected
      if (selectedPhoto) {
        const uri = selectedPhoto.uri || selectedPhoto;
        let cleanUri = uri;
        if (Platform.OS === 'android' && !cleanUri.startsWith('file://') && !cleanUri.startsWith('content://')) {
          cleanUri = `file://${cleanUri}`;
        }
        const filename = selectedPhoto.fileName || cleanUri.split('/').pop() || 'photo.jpg';
        const type = selectedPhoto.mimeType || selectedPhoto.type || 'image/jpeg';
        
        formData.append('photo', {
          uri: cleanUri,
          name: filename,
          type: type,
        } as any);
      }

      // 2. Save via API (Profile details and trainers)
      await API.put('/student/profile', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      // 3. Sync user basic details (name, mobile) to the auth model
      await API.put('/auth/me', {
        name: profileData.name,
        mobile: profileData.mobile,
      });

      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Your profile details have been saved successfully.',
      });
      loadProfileData();
    } catch (error: any) {
      console.error('Failed to update student profile', error);
      const msg = error?.response?.data?.message || 'Error updating profile details.';
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: msg,
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <ScreenSkeleton variant="profile" />
    );
  }

  const uriString = selectedPhoto 
    ? (selectedPhoto.uri || selectedPhoto)
    : currentPhotoPath 
    ? (currentPhotoPath.startsWith('http') ? currentPhotoPath : `${getServerRoot()}${currentPhotoPath.startsWith('/') ? '' : '/'}${currentPhotoPath}`)
    : null;

  const avatarSource = uriString ? { uri: uriString } : null;

  return (
    <SafeAreaView className="flex-1 bg-[#F8FAFC]">
      <StatusBar barStyle="dark-content" />
      
      {/* Header */}
      <View className="px-6 py-5 border-b border-[#E2E8F0] bg-white flex-row justify-between items-center z-10">
        <View className="flex-row items-center gap-3.5">
          <View className="p-2.5 bg-slate-50 rounded-2xl border border-slate-200/50">
            <User size={20} color="#64748B" />
          </View>
          <View>
            <Text className="text-2xl font-black text-[#0F172A]">Edit Profile</Text>
            <Text className="text-xs text-[#64748B] mt-0.5">Update academic info & details</Text>
          </View>
        </View>
        <TouchableOpacity
          onPress={handleSave}
          disabled={saving}
          className="bg-[#4F46E5] px-5 py-2.5 rounded-xl flex-row items-center space-x-1.5 shadow-sm"
        >
          {saving ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <>
              <Save size={14} color="#ffffff" style={{ marginRight: 4 }} />
              <Text className="text-white text-xs font-black">Save</Text>
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
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={primaryColor} />
          }
          className="flex-1 px-6 py-4"
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Avatar Picture Card */}
          <View className="bg-white border border-[#E2E8F0] rounded-3xl p-6 items-center mb-6 shadow-sm">
            <TouchableOpacity onPress={handlePickImage} activeOpacity={0.8} className="relative">
              <View className="h-28 w-28 rounded-full border-2 border-indigo-500 overflow-hidden bg-indigo-50 items-center justify-center shadow-md relative">
                {avatarSource ? (
                  <Image key={uriString || 'photo'} source={avatarSource} className="h-full w-full" contentFit="cover" />
                ) : (
                  <User size={48} color={mutedColor} />
                )}
              </View>
              <View className="absolute bottom-0 right-0 bg-[#4F46E5] p-2 rounded-full border-2 border-white">
                <Camera size={14} color="#ffffff" />
              </View>
            </TouchableOpacity>
            
            <Text className="text-[#0F172A] font-extrabold text-base mt-4">{profileData.name || 'Student'}</Text>
            <Text className="text-[#64748B] text-xs mt-0.5">{profileData.email}</Text>
          </View>

          {/* Form Content */}
          <View className="mb-12">
            
            {/* Bio */}
            <View className="mb-6">
              <Text className="text-[10px] font-black text-[#64748B] uppercase tracking-wider mb-2">Short Bio</Text>
              <TextInput
                multiline
                numberOfLines={3}
                value={profileData.bio}
                onChangeText={(text) => setProfileData({ ...profileData, bio: text })}
                placeholder="Tell us about yourself, career goals or specializations..."
                placeholderTextColor={mutedColor}
                className="w-full bg-white border border-[#E2E8F0] rounded-2xl p-4 text-[#0F172A] text-xs font-semibold text-left shadow-sm"
                style={{ minHeight: 80, textAlignVertical: 'top' }}
              />
            </View>

            {/* Basic Info Header */}
            <Text className="text-[10px] font-black text-[#64748B] uppercase tracking-wider mb-4 mt-2">Personal Info</Text>

            {/* Name */}
            <View className="mb-5">
              <Text className="text-[10px] font-black text-[#64748B] uppercase tracking-wider mb-2">Full Name</Text>
              <View className="flex-row items-center bg-white border border-[#E2E8F0] rounded-2xl px-4 h-12 shadow-sm">
                <User size={16} color={mutedColor} style={{ marginRight: 8 }} />
                <TextInput
                  value={profileData.name}
                  onChangeText={(text) => setProfileData({ ...profileData, name: text })}
                  placeholder="Enter full name"
                  placeholderTextColor={mutedColor}
                  className="flex-1 text-[#0F172A] text-xs font-semibold"
                />
              </View>
            </View>

            {/* Mobile */}
            <View className="mb-6">
              <Text className="text-[10px] font-black text-[#64748B] uppercase tracking-wider mb-2">Mobile Number</Text>
              <View className="flex-row items-center bg-white border border-[#E2E8F0] rounded-2xl px-4 h-12 shadow-sm">
                <Phone size={16} color={mutedColor} style={{ marginRight: 8 }} />
                <TextInput
                  value={profileData.mobile}
                  onChangeText={(text) => setProfileData({ ...profileData, mobile: text })}
                  placeholder="Enter mobile number"
                  placeholderTextColor={mutedColor}
                  keyboardType="phone-pad"
                  className="flex-1 text-[#0F172A] text-xs font-semibold"
                />
              </View>
            </View>

            {/* Academic Info Header */}
            <Text className="text-[10px] font-black text-[#64748B] uppercase tracking-wider mb-4 mt-2">Academic Details</Text>

            {/* College Name */}
            <View className="mb-5">
              <Text className="text-[10px] font-black text-[#64748B] uppercase tracking-wider mb-2">College Name</Text>
              <View className="flex-row items-center bg-white border border-[#E2E8F0] rounded-2xl px-4 h-12 shadow-sm">
                <GraduationCap size={16} color={mutedColor} style={{ marginRight: 8 }} />
                <TextInput
                  value={profileData.collegeName}
                  onChangeText={(text) => setProfileData({ ...profileData, collegeName: text })}
                  placeholder="Enter college name"
                  placeholderTextColor={mutedColor}
                  className="flex-1 text-[#0F172A] text-xs font-semibold"
                />
              </View>
            </View>

            {/* Degree */}
            <View className="mb-5">
              <Text className="text-[10px] font-black text-[#64748B] uppercase tracking-wider mb-2">Degree</Text>
              <View className="flex-row items-center bg-white border border-[#E2E8F0] rounded-2xl px-4 h-12 shadow-sm">
                <BookOpen size={16} color={mutedColor} style={{ marginRight: 8 }} />
                <TextInput
                  value={profileData.degree}
                  onChangeText={(text) => setProfileData({ ...profileData, degree: text })}
                  placeholder="e.g. B.E, B.Tech, MCA, BSc"
                  placeholderTextColor={mutedColor}
                  className="flex-1 text-[#0F172A] text-xs font-semibold"
                />
              </View>
            </View>

            {/* Department */}
            <View className="mb-5">
              <Text className="text-[10px] font-black text-[#64748B] uppercase tracking-wider mb-2">Department</Text>
              <View className="flex-row items-center bg-white border border-[#E2E8F0] rounded-2xl px-4 h-12 shadow-sm">
                <BookOpen size={16} color={mutedColor} style={{ marginRight: 8 }} />
                <TextInput
                  value={profileData.department}
                  onChangeText={(text) => setProfileData({ ...profileData, department: text })}
                  placeholder="e.g. Computer Science, Information Technology"
                  placeholderTextColor={mutedColor}
                  className="flex-1 text-[#0F172A] text-xs font-semibold"
                />
              </View>
            </View>

            {/* Year of Passing */}
            <View className="mb-5">
              <Text className="text-[10px] font-black text-[#64748B] uppercase tracking-wider mb-2">Year of Passing</Text>
              <View className="flex-row items-center bg-white border border-[#E2E8F0] rounded-2xl px-4 h-12 shadow-sm">
                <Calendar size={16} color={mutedColor} style={{ marginRight: 8 }} />
                <TextInput
                  value={profileData.yearOfPassing}
                  onChangeText={(text) => setProfileData({ ...profileData, yearOfPassing: text })}
                  placeholder="e.g. 2024, 2025"
                  placeholderTextColor={mutedColor}
                  keyboardType="numeric"
                  className="flex-1 text-[#0F172A] text-xs font-semibold"
                />
              </View>
            </View>

            {/* Gender */}
            <View className="mb-5">
              <Text className="text-[10px] font-black text-[#64748B] uppercase tracking-wider mb-2">Gender</Text>
              <View className="flex-row items-center bg-white border border-[#E2E8F0] rounded-2xl px-4 h-12 shadow-sm">
                <User size={16} color={mutedColor} style={{ marginRight: 8 }} />
                <TextInput
                  value={profileData.gender}
                  onChangeText={(text) => setProfileData({ ...profileData, gender: text })}
                  placeholder="e.g. Male, Female, Other"
                  placeholderTextColor={mutedColor}
                  className="flex-1 text-[#0F172A] text-xs font-semibold"
                />
              </View>
            </View>

            {/* Date of Birth */}
            <View className="mb-5">
              <Text className="text-[10px] font-black text-[#64748B] uppercase tracking-wider mb-2">Date of Birth</Text>
              <View className="flex-row items-center bg-white border border-[#E2E8F0] rounded-2xl px-4 h-12 shadow-sm">
                <Calendar size={16} color={mutedColor} style={{ marginRight: 8 }} />
                <TextInput
                  value={profileData.dob}
                  onChangeText={(text) => setProfileData({ ...profileData, dob: text })}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={mutedColor}
                  className="flex-1 text-[#0F172A] text-xs font-semibold"
                />
              </View>
            </View>

            {/* Skills */}
            <View className="mb-5">
              <Text className="text-[10px] font-black text-[#64748B] uppercase tracking-wider mb-2">Skills (comma-separated)</Text>
              <View className="flex-row items-center bg-white border border-[#E2E8F0] rounded-2xl px-4 h-12 shadow-sm">
                <Sparkles size={16} color={mutedColor} style={{ marginRight: 8 }} />
                <TextInput
                  value={profileData.skills}
                  onChangeText={(text) => setProfileData({ ...profileData, skills: text })}
                  placeholder="e.g. React, Node.js, Python, SQL"
                  placeholderTextColor={mutedColor}
                  className="flex-1 text-[#0F172A] text-xs font-semibold"
                />
              </View>
            </View>

            {/* Address */}
            <View className="mb-6">
              <Text className="text-[10px] font-black text-[#64748B] uppercase tracking-wider mb-2">Home Address</Text>
              <View className="flex-row items-center bg-white border border-[#E2E8F0] rounded-2xl px-4 h-12 shadow-sm">
                <MapPin size={16} color={mutedColor} style={{ marginRight: 8 }} />
                <TextInput
                  value={profileData.address}
                  onChangeText={(text) => setProfileData({ ...profileData, address: text })}
                  placeholder="Enter full address"
                  placeholderTextColor={mutedColor}
                  className="flex-1 text-[#0F172A] text-xs font-semibold"
                />
              </View>
            </View>

            {/* Professional Links Header */}
            <Text className="text-[10px] font-black text-[#64748B] uppercase tracking-wider mb-4 mt-2">Professional Handles</Text>

            {/* LinkedIn */}
            <View className="mb-5">
              <Text className="text-[10px] font-black text-[#64748B] uppercase tracking-wider mb-2">LinkedIn Profile Link</Text>
              <View className="flex-row items-center bg-white border border-[#E2E8F0] rounded-2xl px-4 h-12 shadow-sm">
                <Briefcase size={16} color={mutedColor} style={{ marginRight: 8 }} />
                <TextInput
                  value={profileData.linkedin}
                  onChangeText={(text) => setProfileData({ ...profileData, linkedin: text })}
                  placeholder="https://linkedin.com/in/username"
                  placeholderTextColor={mutedColor}
                  autoCapitalize="none"
                  className="flex-1 text-[#0F172A] text-xs font-semibold"
                />
              </View>
            </View>

            {/* GitHub */}
            <View className="mb-5">
              <Text className="text-[10px] font-black text-[#64748B] uppercase tracking-wider mb-2">GitHub Profile Link</Text>
              <View className="flex-row items-center bg-white border border-[#E2E8F0] rounded-2xl px-4 h-12 shadow-sm">
                <Code2 size={16} color={mutedColor} style={{ marginRight: 8 }} />
                <TextInput
                  value={profileData.github}
                  onChangeText={(text) => setProfileData({ ...profileData, github: text })}
                  placeholder="https://github.com/username"
                  placeholderTextColor={mutedColor}
                  autoCapitalize="none"
                  className="flex-1 text-[#0F172A] text-xs font-semibold"
                />
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
