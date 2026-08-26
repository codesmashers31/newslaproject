import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import API from '../../services/api';
import toast from 'react-hot-toast';
import { 
  User, Phone, BookOpen, MapPin, Calendar, Sparkles, 
  Camera, Save, GraduationCap, Shield, ExternalLink, Briefcase, Code2,
  Mail, Hash, Lock, Eye, EyeOff, KeyRound, CheckCircle2, LogOut
} from 'lucide-react';

const StudentProfile = () => {
  const { user: authUser, logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [profileData, setProfileData] = useState({
    collegeName: '', degree: '', department: '', yearOfPassing: '', dob: '', 
    gender: '', address: '', skills: '', linkedin: '', github: '', bio: '', 
    name: '', mobile: '', email: '', slaeId: ''
  });

  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [currentPhotoPath, setCurrentPhotoPath] = useState('');
  const [photoPreview, setPhotoPreview] = useState(null);

  // Password Management State
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [updatingPassword, setUpdatingPassword] = useState(false);

  const loadProfileData = async () => {
    try {
      const { data } = await API.get('/student/dashboard');
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
        skills: Array.isArray(p.skills) ? p.skills.join(', ') : (p.skills || ''),
        linkedin: p.linkedin || '',
        github: p.github || '',
        bio: p.bio || '',
        name: student.name || authUser?.name || '',
        mobile: student.mobile || authUser?.mobile || '',
        email: student.email || authUser?.email || '',
        slaeId: student.slaeId || authUser?.slaeId || 'N/A'
      });
      setCurrentPhotoPath(photo);
      setSelectedPhoto(null);
      setPhotoPreview(null);
    } catch (error) {
      console.error('Failed to load profile details', error);
      toast.error('Could not load profile details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfileData();
  }, []);

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedPhoto(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    if (!profileData.name.trim() || !profileData.mobile.trim()) {
      toast.error('Name and Mobile Number are required.');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: profileData.name || '',
        mobile: profileData.mobile || '',
        email: profileData.email || '',
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
        skills: Array.isArray(profileData.skills) ? profileData.skills.join(', ') : (profileData.skills || '')
      };

      if (photoPreview) {
        payload.photoBase64 = photoPreview;
      }

      const { data: resData } = await API.put('/student/profile', payload);

      const newPhoto = resData?.profile?.photo || resData?.user?.photo;
      if (newPhoto) {
        setCurrentPhotoPath(newPhoto);
      }
      setSelectedPhoto(null);
      setPhotoPreview(null);

      // Sync user basic details to auth model
      try {
        await API.put('/auth/me', {
          name: profileData.name,
          mobile: profileData.mobile,
        });
      } catch (e) {}

      toast.success('Your profile details have been saved successfully.');
      loadProfileData();
    } catch (error) {
      console.error('Failed to update student profile', error);
      toast.error(error?.response?.data?.message || 'Error updating profile details.');
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    if (!passwordData.currentPassword) {
      toast.error('Please enter your current password.');
      return;
    }
    if (!passwordData.newPassword) {
      toast.error('Please enter a new password.');
      return;
    }
    if (passwordData.newPassword.length < 6) {
      toast.error('New password must be at least 6 characters long.');
      return;
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('New passwords do not match.');
      return;
    }

    setUpdatingPassword(true);
    try {
      const { data } = await API.put('/student/password', {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
        confirmPassword: passwordData.confirmPassword
      });
      toast.success(data?.message || 'Password changed successfully!');
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (error) {
      console.error('Failed to change password', error);
      toast.error(error?.response?.data?.message || 'Failed to change password. Please check your current password.');
    } finally {
      setUpdatingPassword(false);
    }
  };

  if (loading) {
    return <div className="p-5 text-center text-sm text-slate-500 animate-pulse">Loading Profile...</div>;
  }

  const getServerRoot = () => {
    const base = API.defaults.baseURL || 'http://localhost:5000/api';
    const root = base.replace('/api', '');
    return root.endsWith('/') ? root.slice(0, -1) : root;
  };

  let avatarSrc = null;
  if (photoPreview) {
    avatarSrc = photoPreview;
  } else if (currentPhotoPath) {
    avatarSrc = currentPhotoPath.startsWith('http') 
      ? currentPhotoPath 
      : `${getServerRoot()}${currentPhotoPath.startsWith('/') ? '' : '/'}${currentPhotoPath}`;
  }

  const initialLetter = profileData.name ? profileData.name.charAt(0).toUpperCase() : 'S';

  return (
    <div className="bg-[#F8FAFC] min-h-screen pb-24">
      
      {/* Header */}
      <div className="px-5 pt-6 pb-4 bg-white border-b border-[#E2E8F0] shadow-sm sticky top-0 z-20 flex justify-between items-center">
        <div>
          <h1 className="text-xl font-black text-[#0F172A]">My Profile</h1>
          <p className="text-xs font-semibold text-slate-500 mt-1">Manage personal details, academic info & security</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              logout();
              toast.success('Logged out successfully');
            }}
            className="border border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100 hover:text-rose-700 px-3.5 py-2 rounded-xl flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer text-xs font-bold"
            title="Log out of account"
          >
            <LogOut size={14} />
            <span className="hidden sm:inline">Logout</span>
          </button>

          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-[#4F46E5] px-4 py-2 rounded-xl flex items-center gap-1.5 shadow-sm disabled:opacity-50 hover:bg-[#4338CA] transition-colors cursor-pointer"
          >
            {saving ? (
              <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : (
              <>
                <Save size={14} className="text-white" />
                <span className="text-white text-xs font-black">Save</span>
              </>
            )}
          </button>
        </div>
      </div>

      <div className="p-5 md:p-8 max-w-3xl mx-auto flex flex-col gap-6">

        {/* Avatar Picture Card */}
        <div className="bg-white border border-[#E2E8F0] rounded-3xl p-6 flex flex-col items-center shadow-sm">
          <label className="relative cursor-pointer block">
            <div className="h-28 w-28 rounded-full border-2 border-indigo-500 overflow-hidden bg-indigo-100 flex items-center justify-center shadow-md">
              {avatarSrc ? (
                <img src={avatarSrc} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <span className="text-4xl font-black text-indigo-700">{initialLetter}</span>
              )}
            </div>
            <div className="absolute bottom-0 right-0 bg-[#4F46E5] p-2.5 rounded-full border-2 border-white shadow-sm flex items-center justify-center">
              <Camera size={16} className="text-white" />
            </div>
            <input
              type="file"
              accept="image/*"
              onChange={handlePhotoChange}
              className="hidden"
            />
          </label>
          
          <h2 className="text-[#0F172A] font-extrabold text-base mt-4">{profileData.name || 'Student'}</h2>
          
          <div className="flex items-center gap-2 mt-1">
            <span className="text-[#64748B] text-xs font-medium">{profileData.email}</span>
            <span className="text-slate-300">•</span>
            <span className="bg-[#F3E8FF] text-[#7C3AED] px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border border-[#E9D5FF]">
              EID: {profileData.slaeId || 'N/A'}
            </span>
          </div>
        </div>

        {/* Form Content */}
        <div className="flex flex-col gap-6">
          
          {/* Bio */}
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-black text-[#64748B] uppercase tracking-wider">Short Bio</label>
            <textarea
              rows="3"
              value={profileData.bio}
              onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
              placeholder="Tell us about yourself, career goals or specializations..."
              className="w-full bg-white border border-[#E2E8F0] rounded-2xl p-4 text-[#0F172A] text-sm font-semibold shadow-sm focus:outline-none focus:ring-2 focus:ring-[#8B5CF6] focus:border-[#8B5CF6] transition-all"
            />
          </div>

          {/* Section 1: Personal & Account Details */}
          <div className="bg-white border border-[#E2E8F0] rounded-3xl p-5 md:p-6 shadow-sm flex flex-col gap-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <p className="text-[11px] font-black text-[#64748B] uppercase tracking-wider">Personal & Account Details</p>
              <span className="text-[10px] font-bold text-[#8B5CF6] bg-[#F3E8FF] px-2 py-0.5 rounded-md">General Info</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* Name */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black text-[#64748B] uppercase tracking-wider">Full Name</label>
                <div className="flex items-center bg-white border border-[#E2E8F0] rounded-2xl px-4 h-12 shadow-sm focus-within:ring-2 focus-within:ring-[#8B5CF6] focus-within:border-[#8B5CF6] transition-all">
                  <User size={16} className="text-[#64748B] mr-3 shrink-0" />
                  <input
                    type="text"
                    value={profileData.name}
                    onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                    placeholder="Enter full name"
                    className="field-bare flex-1 text-[#0F172A] text-sm font-semibold w-full"
                  />
                </div>
              </div>

              {/* SLA EID (Read Only) */}
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-black text-[#64748B] uppercase tracking-wider">Student EID (SLA ID)</label>
                  <span className="text-[9px] font-bold text-slate-400 uppercase flex items-center gap-1">
                    <Lock size={10} /> Read-Only
                  </span>
                </div>
                <div className="flex items-center bg-slate-50 border border-slate-200 rounded-2xl px-4 h-12 shadow-xs cursor-not-allowed">
                  <Hash size={16} className="text-[#7C3AED] mr-3 shrink-0" />
                  <input
                    type="text"
                    readOnly
                    value={profileData.slaeId || 'N/A'}
                    className="field-bare flex-1 text-[#0F172A] text-sm font-bold w-full cursor-not-allowed bg-transparent select-all"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* Email Address */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black text-[#64748B] uppercase tracking-wider">Email Address</label>
                <div className="flex items-center bg-white border border-[#E2E8F0] rounded-2xl px-4 h-12 shadow-sm focus-within:ring-2 focus-within:ring-[#8B5CF6] focus-within:border-[#8B5CF6] transition-all">
                  <Mail size={16} className="text-[#64748B] mr-3 shrink-0" />
                  <input
                    type="email"
                    value={profileData.email}
                    onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                    placeholder="Enter email address"
                    className="field-bare flex-1 text-[#0F172A] text-sm font-semibold w-full"
                  />
                </div>
              </div>

              {/* Mobile */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black text-[#64748B] uppercase tracking-wider">Mobile Number</label>
                <div className="flex items-center bg-white border border-[#E2E8F0] rounded-2xl px-4 h-12 shadow-sm focus-within:ring-2 focus-within:ring-[#8B5CF6] focus-within:border-[#8B5CF6] transition-all">
                  <Phone size={16} className="text-[#64748B] mr-3 shrink-0" />
                  <input
                    type="tel"
                    value={profileData.mobile}
                    onChange={(e) => setProfileData({ ...profileData, mobile: e.target.value })}
                    placeholder="Enter mobile number"
                    className="field-bare flex-1 text-[#0F172A] text-sm font-semibold w-full"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Academic Details */}
          <div className="bg-white border border-[#E2E8F0] rounded-3xl p-5 md:p-6 shadow-sm flex flex-col gap-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <p className="text-[11px] font-black text-[#64748B] uppercase tracking-wider">Academic Background</p>
              <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">Education</span>
            </div>

            {/* College Name */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-black text-[#64748B] uppercase tracking-wider">College Name</label>
              <div className="flex items-center bg-white border border-[#E2E8F0] rounded-2xl px-4 h-12 shadow-sm focus-within:ring-2 focus-within:ring-[#8B5CF6] focus-within:border-[#8B5CF6] transition-all">
                <GraduationCap size={16} className="text-[#64748B] mr-3 shrink-0" />
                <input
                  type="text"
                  value={profileData.collegeName}
                  onChange={(e) => setProfileData({ ...profileData, collegeName: e.target.value })}
                  placeholder="Enter college or university name"
                  className="field-bare flex-1 text-[#0F172A] text-sm font-semibold w-full"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* Degree */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black text-[#64748B] uppercase tracking-wider">Degree</label>
                <div className="flex items-center bg-white border border-[#E2E8F0] rounded-2xl px-4 h-12 shadow-sm focus-within:ring-2 focus-within:ring-[#8B5CF6] focus-within:border-[#8B5CF6] transition-all">
                  <BookOpen size={16} className="text-[#64748B] mr-3 shrink-0" />
                  <input
                    type="text"
                    value={profileData.degree}
                    onChange={(e) => setProfileData({ ...profileData, degree: e.target.value })}
                    placeholder="e.g. B.E, B.Tech, MCA"
                    className="field-bare flex-1 text-[#0F172A] text-sm font-semibold w-full"
                  />
                </div>
              </div>

              {/* Department */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black text-[#64748B] uppercase tracking-wider">Department</label>
                <div className="flex items-center bg-white border border-[#E2E8F0] rounded-2xl px-4 h-12 shadow-sm focus-within:ring-2 focus-within:ring-[#8B5CF6] focus-within:border-[#8B5CF6] transition-all">
                  <BookOpen size={16} className="text-[#64748B] mr-3 shrink-0" />
                  <input
                    type="text"
                    value={profileData.department}
                    onChange={(e) => setProfileData({ ...profileData, department: e.target.value })}
                    placeholder="e.g. Computer Science"
                    className="field-bare flex-1 text-[#0F172A] text-sm font-semibold w-full"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              {/* Year of Passing */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black text-[#64748B] uppercase tracking-wider">Year of Passing</label>
                <div className="flex items-center bg-white border border-[#E2E8F0] rounded-2xl px-4 h-12 shadow-sm focus-within:ring-2 focus-within:ring-[#8B5CF6] focus-within:border-[#8B5CF6] transition-all">
                  <Calendar size={16} className="text-[#64748B] mr-3 shrink-0" />
                  <input
                    type="number"
                    value={profileData.yearOfPassing}
                    onChange={(e) => setProfileData({ ...profileData, yearOfPassing: e.target.value })}
                    placeholder="e.g. 2026"
                    className="field-bare flex-1 text-[#0F172A] text-sm font-semibold w-full"
                  />
                </div>
              </div>

              {/* Date of Birth */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black text-[#64748B] uppercase tracking-wider">Date of Birth</label>
                <div className="flex items-center bg-white border border-[#E2E8F0] rounded-2xl px-4 h-12 shadow-sm focus-within:ring-2 focus-within:ring-[#8B5CF6] focus-within:border-[#8B5CF6] transition-all">
                  <Calendar size={16} className="text-[#64748B] mr-3 shrink-0" />
                  <input
                    type="date"
                    value={profileData.dob}
                    onChange={(e) => setProfileData({ ...profileData, dob: e.target.value })}
                    className="field-bare flex-1 text-[#0F172A] text-sm font-semibold w-full"
                  />
                </div>
              </div>

              {/* Gender */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black text-[#64748B] uppercase tracking-wider">Gender</label>
                <div className="flex items-center bg-white border border-[#E2E8F0] rounded-2xl px-4 h-12 shadow-sm focus-within:ring-2 focus-within:ring-[#8B5CF6] focus-within:border-[#8B5CF6] transition-all">
                  <User size={16} className="text-[#64748B] mr-3 shrink-0" />
                  <select
                    value={profileData.gender}
                    onChange={(e) => setProfileData({ ...profileData, gender: e.target.value })}
                    className="field-bare flex-1 text-[#0F172A] text-sm font-semibold w-full bg-transparent cursor-pointer"
                  >
                    <option value="">Select</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Skills, Address & Social Handles */}
          <div className="bg-white border border-[#E2E8F0] rounded-3xl p-5 md:p-6 shadow-sm flex flex-col gap-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <p className="text-[11px] font-black text-[#64748B] uppercase tracking-wider">Skills & Professional Handles</p>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">Placement Ready</span>
            </div>

            {/* Skills */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-black text-[#64748B] uppercase tracking-wider">Skills (comma-separated)</label>
              <div className="flex items-center bg-white border border-[#E2E8F0] rounded-2xl px-4 h-12 shadow-sm focus-within:ring-2 focus-within:ring-[#8B5CF6] focus-within:border-[#8B5CF6] transition-all">
                <Sparkles size={16} className="text-[#64748B] mr-3 shrink-0" />
                <input
                  type="text"
                  value={profileData.skills}
                  onChange={(e) => setProfileData({ ...profileData, skills: e.target.value })}
                  placeholder="e.g. React, Node.js, Express, MongoDB, Python"
                  className="field-bare flex-1 text-[#0F172A] text-sm font-semibold w-full"
                />
              </div>
            </div>

            {/* Address */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-black text-[#64748B] uppercase tracking-wider">Home Address</label>
              <div className="flex items-center bg-white border border-[#E2E8F0] rounded-2xl px-4 h-12 shadow-sm focus-within:ring-2 focus-within:ring-[#8B5CF6] focus-within:border-[#8B5CF6] transition-all">
                <MapPin size={16} className="text-[#64748B] mr-3 shrink-0" />
                <input
                  type="text"
                  value={profileData.address}
                  onChange={(e) => setProfileData({ ...profileData, address: e.target.value })}
                  placeholder="Enter residential address"
                  className="field-bare flex-1 text-[#0F172A] text-sm font-semibold w-full"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* LinkedIn */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black text-[#64748B] uppercase tracking-wider">LinkedIn Profile URL</label>
                <div className="flex items-center bg-white border border-[#E2E8F0] rounded-2xl px-4 h-12 shadow-sm focus-within:ring-2 focus-within:ring-[#8B5CF6] focus-within:border-[#8B5CF6] transition-all">
                  <Briefcase size={16} className="text-[#64748B] mr-3 shrink-0" />
                  <input
                    type="url"
                    value={profileData.linkedin}
                    onChange={(e) => setProfileData({ ...profileData, linkedin: e.target.value })}
                    placeholder="https://linkedin.com/in/username"
                    className="field-bare flex-1 text-[#0F172A] text-sm font-semibold w-full"
                  />
                </div>
              </div>

              {/* GitHub */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black text-[#64748B] uppercase tracking-wider">GitHub Profile URL</label>
                <div className="flex items-center bg-white border border-[#E2E8F0] rounded-2xl px-4 h-12 shadow-sm focus-within:ring-2 focus-within:ring-[#8B5CF6] focus-within:border-[#8B5CF6] transition-all">
                  <Code2 size={16} className="text-[#64748B] mr-3 shrink-0" />
                  <input
                    type="url"
                    value={profileData.github}
                    onChange={(e) => setProfileData({ ...profileData, github: e.target.value })}
                    placeholder="https://github.com/username"
                    className="field-bare flex-1 text-[#0F172A] text-sm font-semibold w-full"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 4: Security & Change Password */}
          <div className="bg-white border border-[#E2E8F0] rounded-3xl p-5 md:p-6 shadow-sm flex flex-col gap-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <KeyRound size={18} className="text-[#4F46E5]" />
                <p className="text-[11px] font-black text-[#0F172A] uppercase tracking-wider">Security & Change Password</p>
              </div>
              <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md">Account Security</span>
            </div>

            <form onSubmit={handlePasswordUpdate} className="flex flex-col gap-4">
              {/* Current Password */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black text-[#64748B] uppercase tracking-wider">Current Password</label>
                <div className="flex items-center bg-white border border-[#E2E8F0] rounded-2xl px-4 h-12 shadow-sm focus-within:ring-2 focus-within:ring-[#8B5CF6] focus-within:border-[#8B5CF6] transition-all">
                  <Lock size={16} className="text-[#64748B] mr-3 shrink-0" />
                  <input
                    type={showCurrentPass ? 'text' : 'password'}
                    value={passwordData.currentPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                    placeholder="Enter your current password"
                    className="field-bare flex-1 text-[#0F172A] text-sm font-semibold w-full"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPass(!showCurrentPass)}
                    className="text-slate-400 hover:text-slate-600 ml-2 focus:outline-none"
                  >
                    {showCurrentPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* New Password */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-black text-[#64748B] uppercase tracking-wider">New Password</label>
                  <div className="flex items-center bg-white border border-[#E2E8F0] rounded-2xl px-4 h-12 shadow-sm focus-within:ring-2 focus-within:ring-[#8B5CF6] focus-within:border-[#8B5CF6] transition-all">
                    <KeyRound size={16} className="text-[#64748B] mr-3 shrink-0" />
                    <input
                      type={showNewPass ? 'text' : 'password'}
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                      placeholder="Minimum 6 characters"
                      className="field-bare flex-1 text-[#0F172A] text-sm font-semibold w-full"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPass(!showNewPass)}
                      className="text-slate-400 hover:text-slate-600 ml-2 focus:outline-none"
                    >
                      {showNewPass ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {/* Confirm New Password */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-black text-[#64748B] uppercase tracking-wider">Confirm New Password</label>
                  <div className="flex items-center bg-white border border-[#E2E8F0] rounded-2xl px-4 h-12 shadow-sm focus-within:ring-2 focus-within:ring-[#8B5CF6] focus-within:border-[#8B5CF6] transition-all">
                    <KeyRound size={16} className="text-[#64748B] mr-3 shrink-0" />
                    <input
                      type={showConfirmPass ? 'text' : 'password'}
                      value={passwordData.confirmPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                      placeholder="Re-enter new password"
                      className="field-bare flex-1 text-[#0F172A] text-sm font-semibold w-full"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPass(!showConfirmPass)}
                      className="text-slate-400 hover:text-slate-600 ml-2 focus:outline-none"
                    >
                      {showConfirmPass ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <p className="text-[11px] text-slate-500 font-medium">Use a strong password with letters and numbers.</p>
                <button
                  type="submit"
                  disabled={updatingPassword || !passwordData.currentPassword || !passwordData.newPassword}
                  className="px-5 py-2.5 bg-[#4F46E5] text-white rounded-xl text-xs font-bold hover:bg-[#4338CA] transition-colors disabled:opacity-50 shadow-sm flex items-center gap-1.5 cursor-pointer"
                >
                  {updatingPassword ? (
                    <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  ) : (
                    <>
                      <CheckCircle2 size={14} />
                      <span>Update Password</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Privacy Policy Link */}
          <div>
            <Link
              to="/privacy-policy"
              className="flex items-center justify-between bg-white border border-[#E2E8F0] rounded-2xl px-4 h-14 shadow-sm py-3 hover:bg-slate-50 transition-colors cursor-pointer"
            >
              <div className="flex items-center">
                <Shield size={16} className="text-[#6366F1] mr-3 shrink-0" />
                <span className="text-sm font-bold text-[#0F172A]">Privacy Policy & Data Security</span>
              </div>
              <ExternalLink size={16} className="text-[#94A3B8]" />
            </Link>
          </div>

          {/* Logout Section Card */}
          <div className="bg-white border border-[#E2E8F0] rounded-3xl p-4 shadow-sm">
            <button
              onClick={() => {
                logout();
                toast.success('Logged out successfully');
              }}
              className="w-full py-3.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-600 rounded-2xl font-black text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-xs active:scale-[0.99]"
            >
              <LogOut size={18} />
              <span>Log Out of SLA Portal</span>
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};

export default StudentProfile;
