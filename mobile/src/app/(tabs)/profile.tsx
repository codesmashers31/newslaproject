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
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import Toast from 'react-native-toast-message';
import AsyncStorage from '@react-native-async-storage/async-storage';
import API from '../../services/api';
import { ScreenSkeleton } from '../../components/Skeleton';
import AppHeader from '../../components/AppHeader';
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
  GraduationCap,
  Shield,
  ExternalLink,
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
  // Bumped whenever the stored photo changes, to bust the image cache.
  const [photoVersion, setPhotoVersion] = useState<number>(Date.now());
  const [imageError, setImageError] = useState<boolean>(false);

  React.useEffect(() => {
    setImageError(false);
  }, [currentPhotoPath, selectedPhoto]);

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

  React.useEffect(() => {
    const loadCache = async () => {
      try {
        const cached = await AsyncStorage.getItem('cached_profile_data');
        if (cached) {
          const { student, p, photo } = JSON.parse(cached);
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
          setCurrentPhotoPath(photo || '');
          setLoading(false);
        }
      } catch (e) {}
    };
    loadCache();
  }, []);

  const loadProfileData = async () => {
    try {
      const [{ data }, { data: batchesData }] = await Promise.all([
        API.get('/student/dashboard'),
        API.get('/student/batches').catch(() => ({ data: [] }))
      ]);

      const student = data?.profile?.user || {};
      const p = data?.profile || {};
      const photo = p.photo || student.photo || '';
      
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
      setCurrentPhotoPath(photo);
      setPhotoVersion(Date.now());
      setSelectedPhoto(null);
      setAvailableBatches(batchesData || []);

      AsyncStorage.setItem('cached_profile_data', JSON.stringify({ student, p, photo })).catch(() => {});

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
      mediaTypes: ['images'] as any,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
      base64: true,
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
      let photoBase64 = null;
      if (selectedPhoto) {
        if (selectedPhoto.base64) {
          const mime = selectedPhoto.mimeType || 'image/jpeg';
          photoBase64 = `data:${mime};base64,${selectedPhoto.base64}`;
        }
      }

      const payload = {
        name: profileData.name || '',
        mobile: profileData.mobile || '',
        collegeName: profileData.collegeName || '',
        degree: profileData.degree || '',
        department: profileData.department || '',
        yearOfPassing: profileData.yearOfPassing || '',
        dob: profileData.dob || '',
        gender: profileData.gender || '',
        address: profileData.address || '',
        linkedin: profileData.linkedin || '',
        github: profileData.github || '',
        bio: profileData.bio || '',
        technicalBatch: profileData.technicalBatch || '',
        technicalTrainer: profileData.technicalTrainer || '',
        communicationBatch: profileData.communicationBatch || '',
        communicationTrainer: profileData.communicationTrainer || '',
        aptitudeBatch: profileData.aptitudeBatch || '',
        aptitudeTrainer: profileData.aptitudeTrainer || '',
        skills: Array.isArray(profileData.skills) ? profileData.skills.join(', ') : (profileData.skills || ''),
        ...(photoBase64 ? { photoBase64 } : {}),
      };

      const { data: resData } = await API.put('/student/profile', payload);

      // Update current photo path immediately from response
      const newPhoto = resData?.profile?.photo || resData?.user?.photo;
      if (newPhoto) {
        setCurrentPhotoPath(newPhoto);
      }
      setSelectedPhoto(null);

      // Sync user basic details (name, mobile) to auth model
      try {
        await API.put('/auth/me', {
          name: profileData.name,
          mobile: profileData.mobile,
        });
      } catch (e) {}

      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Your profile details have been saved successfully.',
      });
      loadProfileData();
    } catch (error: any) {
      console.error('Failed to update student profile', error);
      const msg = error?.message || 'Error updating profile details.';
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

  // For a freshly picked photo, render the base64 data URI directly rather
  // than the file:// path. The data URI is self-contained, so the preview
  // shows immediately and does not depend on the native file provider being
  // able to resolve a temporary picker path.
  let uriString: string | null = null;
  if (selectedPhoto) {
    if (selectedPhoto.base64) {
      const mime = selectedPhoto.mimeType || 'image/jpeg';
      uriString = `data:${mime};base64,${selectedPhoto.base64}`;
    } else {
      uriString = selectedPhoto.uri || selectedPhoto;
    }
  } else if (currentPhotoPath) {
    const abs = currentPhotoPath.startsWith('http')
      ? currentPhotoPath
      : `${getServerRoot()}${currentPhotoPath.startsWith('/') ? '' : '/'}${currentPhotoPath}`;
    // Cache-bust so a re-uploaded photo at the same URL refreshes instead of
    // showing the stale cached image.
    uriString = `${abs}${abs.includes('?') ? '&' : '?'}t=${photoVersion}`;
  }

  const avatarSource = uriString ? { uri: uriString } : null;

  const initialLetter = profileData.name ? profileData.name.charAt(0).toUpperCase() : 'S';

  return (
    <SafeAreaView className="flex-1 bg-[#F8FAFC]">
      <StatusBar barStyle="dark-content" />
      
      {/* Universal Fixed Top Navbar + Sub-Header Action Bar */}
      <AppHeader 
        title="My Profile" 
        subtitle="Update academic info & details"
        showBack={true}
        onRefreshData={loadProfileData}
        rightAction={
          <TouchableOpacity
            onPress={handleSave}
            disabled={saving}
            className="bg-[#4F46E5] px-4 py-1.5 rounded-xl flex-row items-center shadow-sm"
          >
            {saving ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <>
                <Save size={13} color="#ffffff" style={{ marginRight: 4 }} />
                <Text className="text-white text-xs font-black">Save</Text>
              </>
            )}
          </TouchableOpacity>
        }
      />

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1"
      >
        <ScrollView
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={primaryColor} />
          }
          className="flex-1 px-5 py-4"
          contentContainerStyle={{ paddingBottom: 120 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Avatar Picture Card */}
          <View className="bg-white border border-[#E2E8F0] rounded-3xl p-6 items-center mb-6 shadow-sm">
            <TouchableOpacity onPress={handlePickImage} activeOpacity={0.8} className="relative">
              <View className="h-28 w-28 rounded-full border-2 border-indigo-500 overflow-hidden bg-indigo-100 items-center justify-center shadow-md relative">
                {avatarSource && !imageError ? (
                  <Image 
                    key={uriString || 'photo'} 
                    source={avatarSource} 
                    style={{ width: '100%', height: '100%' }} 
                    contentFit="cover" 
                    onError={() => setImageError(true)}
                  />
                ) : (
                  <Text className="text-4xl font-black text-indigo-700">
                    {initialLetter}
                  </Text>
                )}
              </View>
              <View className="absolute bottom-0 right-0 bg-[#4F46E5] p-2.5 rounded-full border-2 border-white shadow-sm">
                <Camera size={16} color="#ffffff" />
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

            {/* Privacy Policy Link */}
            <View className="mt-4 mb-2">
              <TouchableOpacity
                onPress={() => Linking.openURL('https://newslaproject.vercel.app/privacy-policy')}
                className="flex-row items-center justify-between bg-white border border-[#E2E8F0] rounded-2xl px-4 h-13 shadow-sm py-3"
              >
                <View className="flex-row items-center">
                  <Shield size={16} color="#6366F1" style={{ marginRight: 8 }} />
                  <Text className="text-xs font-bold text-[#0F172A]">Privacy Policy & Data Security</Text>
                </View>
                <ExternalLink size={14} color="#94A3B8" />
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
