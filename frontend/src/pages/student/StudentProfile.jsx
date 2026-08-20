import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import API from '../../services/api';
import toast from 'react-hot-toast';
import { 
  User, Phone, BookOpen, MapPin, Calendar, Sparkles, 
  Camera, Save, GraduationCap, Shield, ExternalLink, Briefcase, Code2
} from 'lucide-react';

const StudentProfile = () => {
  const { user: authUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [profileData, setProfileData] = useState({
    collegeName: '', degree: '', department: '', yearOfPassing: '', dob: '', 
    gender: '', address: '', skills: '', linkedin: '', github: '', bio: '', 
    name: '', mobile: '', email: ''
  });

  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [currentPhotoPath, setCurrentPhotoPath] = useState('');
  const [photoPreview, setPhotoPreview] = useState(null);

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
        skills: p.skills?.join(', ') || '',
        linkedin: p.linkedin || '',
        github: p.github || '',
        bio: p.bio || '',
        name: student.name || authUser?.name || '',
        mobile: student.mobile || authUser?.mobile || '',
        email: student.email || authUser?.email || '',
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
    <div className="bg-[#F8FAFC] min-h-screen pb-10">
      
      {/* Header */}
      <div className="px-5 pt-6 pb-4 bg-white border-b border-[#E2E8F0] shadow-sm sticky top-0 z-20 flex justify-between items-center">
        <div>
          <h1 className="text-xl font-black text-[#0F172A]">My Profile</h1>
          <p className="text-xs font-semibold text-slate-500 mt-1">Update academic info & details</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-[#4F46E5] px-4 py-2 rounded-xl flex items-center gap-1.5 shadow-sm disabled:opacity-50 hover:bg-[#4338CA] transition-colors"
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
          <p className="text-[#64748B] text-xs mt-0.5">{profileData.email}</p>
        </div>

        {/* Form Content */}
        <div className="flex flex-col gap-5">
          
          {/* Bio */}
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-black text-[#64748B] uppercase tracking-wider">Short Bio</label>
            <textarea
              rows="3"
              value={profileData.bio}
              onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
              placeholder="Tell us about yourself, career goals or specializations..."
              className="w-full bg-white border border-[#E2E8F0] rounded-2xl p-4 text-[#0F172A] text-sm font-semibold shadow-sm focus:outline-none focus:ring-2 focus:ring-[#8B5CF6]"
            />
          </div>

          <p className="text-[10px] font-black text-[#64748B] uppercase tracking-wider mt-2 border-b border-slate-200 pb-2">Personal Info</p>

          {/* Name */}
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-black text-[#64748B] uppercase tracking-wider">Full Name</label>
            <div className="flex items-center bg-white border border-[#E2E8F0] rounded-2xl px-4 h-12 shadow-sm focus-within:ring-2 focus-within:ring-[#8B5CF6]">
              <User size={16} className="text-[#64748B] mr-3 shrink-0" />
              <input
                type="text"
                value={profileData.name}
                onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                placeholder="Enter full name"
                className="flex-1 bg-transparent border-none outline-none text-[#0F172A] text-sm font-semibold w-full"
              />
            </div>
          </div>

          {/* Mobile */}
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-black text-[#64748B] uppercase tracking-wider">Mobile Number</label>
            <div className="flex items-center bg-white border border-[#E2E8F0] rounded-2xl px-4 h-12 shadow-sm focus-within:ring-2 focus-within:ring-[#8B5CF6]">
              <Phone size={16} className="text-[#64748B] mr-3 shrink-0" />
              <input
                type="tel"
                value={profileData.mobile}
                onChange={(e) => setProfileData({ ...profileData, mobile: e.target.value })}
                placeholder="Enter mobile number"
                className="flex-1 bg-transparent border-none outline-none text-[#0F172A] text-sm font-semibold w-full"
              />
            </div>
          </div>

          <p className="text-[10px] font-black text-[#64748B] uppercase tracking-wider mt-2 border-b border-slate-200 pb-2">Academic Details</p>

          {/* College Name */}
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-black text-[#64748B] uppercase tracking-wider">College Name</label>
            <div className="flex items-center bg-white border border-[#E2E8F0] rounded-2xl px-4 h-12 shadow-sm focus-within:ring-2 focus-within:ring-[#8B5CF6]">
              <GraduationCap size={16} className="text-[#64748B] mr-3 shrink-0" />
              <input
                type="text"
                value={profileData.collegeName}
                onChange={(e) => setProfileData({ ...profileData, collegeName: e.target.value })}
                placeholder="Enter college name"
                className="flex-1 bg-transparent border-none outline-none text-[#0F172A] text-sm font-semibold w-full"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Degree */}
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-black text-[#64748B] uppercase tracking-wider">Degree</label>
              <div className="flex items-center bg-white border border-[#E2E8F0] rounded-2xl px-4 h-12 shadow-sm focus-within:ring-2 focus-within:ring-[#8B5CF6]">
                <BookOpen size={16} className="text-[#64748B] mr-3 shrink-0" />
                <input
                  type="text"
                  value={profileData.degree}
                  onChange={(e) => setProfileData({ ...profileData, degree: e.target.value })}
                  placeholder="e.g. B.E, B.Tech, MCA"
                  className="flex-1 bg-transparent border-none outline-none text-[#0F172A] text-sm font-semibold w-full"
                />
              </div>
            </div>

            {/* Department */}
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-black text-[#64748B] uppercase tracking-wider">Department</label>
              <div className="flex items-center bg-white border border-[#E2E8F0] rounded-2xl px-4 h-12 shadow-sm focus-within:ring-2 focus-within:ring-[#8B5CF6]">
                <BookOpen size={16} className="text-[#64748B] mr-3 shrink-0" />
                <input
                  type="text"
                  value={profileData.department}
                  onChange={(e) => setProfileData({ ...profileData, department: e.target.value })}
                  placeholder="e.g. Computer Science"
                  className="flex-1 bg-transparent border-none outline-none text-[#0F172A] text-sm font-semibold w-full"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Year of Passing */}
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-black text-[#64748B] uppercase tracking-wider">Year of Passing</label>
              <div className="flex items-center bg-white border border-[#E2E8F0] rounded-2xl px-4 h-12 shadow-sm focus-within:ring-2 focus-within:ring-[#8B5CF6]">
                <Calendar size={16} className="text-[#64748B] mr-3 shrink-0" />
                <input
                  type="number"
                  value={profileData.yearOfPassing}
                  onChange={(e) => setProfileData({ ...profileData, yearOfPassing: e.target.value })}
                  placeholder="e.g. 2024, 2025"
                  className="flex-1 bg-transparent border-none outline-none text-[#0F172A] text-sm font-semibold w-full"
                />
              </div>
            </div>

            {/* Date of Birth */}
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-black text-[#64748B] uppercase tracking-wider">Date of Birth</label>
              <div className="flex items-center bg-white border border-[#E2E8F0] rounded-2xl px-4 h-12 shadow-sm focus-within:ring-2 focus-within:ring-[#8B5CF6]">
                <Calendar size={16} className="text-[#64748B] mr-3 shrink-0" />
                <input
                  type="date"
                  value={profileData.dob}
                  onChange={(e) => setProfileData({ ...profileData, dob: e.target.value })}
                  className="flex-1 bg-transparent border-none outline-none text-[#0F172A] text-sm font-semibold w-full"
                />
              </div>
            </div>
          </div>

          {/* Gender */}
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-black text-[#64748B] uppercase tracking-wider">Gender</label>
            <div className="flex items-center bg-white border border-[#E2E8F0] rounded-2xl px-4 h-12 shadow-sm focus-within:ring-2 focus-within:ring-[#8B5CF6]">
              <User size={16} className="text-[#64748B] mr-3 shrink-0" />
              <select
                value={profileData.gender}
                onChange={(e) => setProfileData({ ...profileData, gender: e.target.value })}
                className="flex-1 bg-transparent border-none outline-none text-[#0F172A] text-sm font-semibold w-full appearance-none"
              >
                <option value="">Select Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          {/* Skills */}
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-black text-[#64748B] uppercase tracking-wider">Skills (comma-separated)</label>
            <div className="flex items-center bg-white border border-[#E2E8F0] rounded-2xl px-4 h-12 shadow-sm focus-within:ring-2 focus-within:ring-[#8B5CF6]">
              <Sparkles size={16} className="text-[#64748B] mr-3 shrink-0" />
              <input
                type="text"
                value={profileData.skills}
                onChange={(e) => setProfileData({ ...profileData, skills: e.target.value })}
                placeholder="e.g. React, Node.js, Python, SQL"
                className="flex-1 bg-transparent border-none outline-none text-[#0F172A] text-sm font-semibold w-full"
              />
            </div>
          </div>

          {/* Address */}
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-black text-[#64748B] uppercase tracking-wider">Home Address</label>
            <div className="flex items-center bg-white border border-[#E2E8F0] rounded-2xl px-4 h-12 shadow-sm focus-within:ring-2 focus-within:ring-[#8B5CF6]">
              <MapPin size={16} className="text-[#64748B] mr-3 shrink-0" />
              <input
                type="text"
                value={profileData.address}
                onChange={(e) => setProfileData({ ...profileData, address: e.target.value })}
                placeholder="Enter full address"
                className="flex-1 bg-transparent border-none outline-none text-[#0F172A] text-sm font-semibold w-full"
              />
            </div>
          </div>

          <p className="text-[10px] font-black text-[#64748B] uppercase tracking-wider mt-2 border-b border-slate-200 pb-2">Professional Handles</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* LinkedIn */}
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-black text-[#64748B] uppercase tracking-wider">LinkedIn Profile</label>
              <div className="flex items-center bg-white border border-[#E2E8F0] rounded-2xl px-4 h-12 shadow-sm focus-within:ring-2 focus-within:ring-[#8B5CF6]">
                <Briefcase size={16} className="text-[#64748B] mr-3 shrink-0" />
                <input
                  type="url"
                  value={profileData.linkedin}
                  onChange={(e) => setProfileData({ ...profileData, linkedin: e.target.value })}
                  placeholder="https://linkedin.com/in/username"
                  className="flex-1 bg-transparent border-none outline-none text-[#0F172A] text-sm font-semibold w-full"
                />
              </div>
            </div>

            {/* GitHub */}
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-black text-[#64748B] uppercase tracking-wider">GitHub Profile</label>
              <div className="flex items-center bg-white border border-[#E2E8F0] rounded-2xl px-4 h-12 shadow-sm focus-within:ring-2 focus-within:ring-[#8B5CF6]">
                <Code2 size={16} className="text-[#64748B] mr-3 shrink-0" />
                <input
                  type="url"
                  value={profileData.github}
                  onChange={(e) => setProfileData({ ...profileData, github: e.target.value })}
                  placeholder="https://github.com/username"
                  className="flex-1 bg-transparent border-none outline-none text-[#0F172A] text-sm font-semibold w-full"
                />
              </div>
            </div>
          </div>

          {/* Privacy Policy Link */}
          <div className="mt-4">
            <a
              href="https://newslaproject.vercel.app/privacy-policy"
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-between bg-white border border-[#E2E8F0] rounded-2xl px-4 h-14 shadow-sm py-3 hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-center">
                <Shield size={16} className="text-[#6366F1] mr-3 shrink-0" />
                <span className="text-sm font-bold text-[#0F172A]">Privacy Policy & Data Security</span>
              </div>
              <ExternalLink size={16} className="text-[#94A3B8]" />
            </a>
          </div>

        </div>
      </div>
    </div>
  );
};

export default StudentProfile;
