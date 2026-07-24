import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import API, { BACKEND_URL } from '../../services/api';
import { toast } from 'react-hot-toast';
import { 
  User, 
  Mail, 
  Phone, 
  Shield, 
  Lock, 
  Save, 
  CheckCircle, 
  Sparkles,
  Building2,
  Upload,
  Eye,
  EyeOff
} from 'lucide-react';
import { motion } from 'framer-motion';

const UserProfile = () => {
  const { user, updateUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    name: user?.name || '',
    mobile: user?.mobile || '',
    password: '',
    confirmPassword: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [photoFile, setPhotoFile] = useState(null);
  const [currentPhoto, setCurrentPhoto] = useState(user?.photo || '');

  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        name: user.name || '',
        mobile: user.mobile || '',
      }));
      setCurrentPhoto(user.photo || '');
    }
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.password && formData.password !== formData.confirmPassword) {
      toast.error('New passwords do not match!');
      return;
    }

    setSaving(true);
    const updateData = new FormData();
    updateData.append('name', formData.name);
    updateData.append('mobile', formData.mobile);
    if (formData.password) {
      updateData.append('password', formData.password);
    }
    if (photoFile) {
      updateData.append('photo', photoFile);
    }

    try {
      const { data } = await API.put('/auth/me', updateData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      const storedUser = JSON.parse(localStorage.getItem('userInfo') || '{}');
      const updatedUser = { ...storedUser, name: data.name, mobile: data.mobile, photo: data.photo };
      updateUser(updatedUser);

      toast.success('Profile updated successfully!');
      setFormData(prev => ({ ...prev, password: '', confirmPassword: '' }));
      setPhotoFile(null);
      setCurrentPhoto(data.photo || '');
    } catch (error) {
      console.error('Failed to update profile:', error);
      toast.error(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 font-sans pb-12">
      {/* HEADER BANNER */}
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden bg-gradient-to-r from-[#4F46E5] via-violet-800 to-purple-600 rounded-2xl p-6 sm:p-8 text-white shadow-lg"
      >
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center text-2xl sm:text-3xl font-extrabold shadow-inner">
              {user?.name?.charAt(0) || 'U'}
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-white/20 text-white backdrop-blur-sm border border-white/25">
                  <Shield size={12} />
                  {user?.role}
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/30 text-emerald-100 border border-emerald-400/30">
                  <CheckCircle size={12} /> Active Account
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                {user?.name}
              </h1>
              <p className="text-xs sm:text-sm text-violet-100 opacity-90 mt-0.5">
                {user?.email}
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* MAIN FORM GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT CARD: ACCOUNT SNAPSHOT */}
        <div className="bg-white dark:bg-[#12131a] rounded-2xl p-6 border border-gray-200 dark:border-gray-800 shadow-sm space-y-6 flex flex-col items-center text-center">
          {/* Avatar Picture */}
          <div className="relative group">
            <div className="h-28 w-28 rounded-full border-2 border-violet-500 overflow-hidden bg-gray-100 dark:bg-gray-800 flex items-center justify-center shadow-lg relative">
              {currentPhoto ? (
                <img src={currentPhoto.startsWith('data:') || currentPhoto.startsWith('blob:') || currentPhoto.startsWith('http') ? currentPhoto : `${BACKEND_URL}${currentPhoto}`} alt="Profile Avatar" className="h-full w-full object-cover" />
              ) : (
                <span className="text-3xl font-extrabold text-[#4F46E5]">{user?.name?.charAt(0)}</span>
              )}
            </div>
            {/* Hover file indicator */}
            <div className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all duration-300 pointer-events-none text-white text-[10px] font-bold">
              <span>Change Photo</span>
            </div>
            {/* hidden upload input */}
            <input 
              type="file" 
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files[0];
                if (file) {
                  setPhotoFile(file);
                  const reader = new FileReader();
                  reader.onload = (event) => {
                    setCurrentPhoto(event.target.result);
                  };
                  reader.readAsDataURL(file);
                  toast.success(`Selected photo: ${file.name}`);
                }
              }}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
            />
          </div>

          <div className="space-y-1">
            <h4 className="font-bold text-base text-gray-900 dark:text-white">Profile Image</h4>
            <p className="text-[10px] text-gray-400">Upload JPEG, JPG, or PNG under 5MB</p>
          </div>

          <hr className="w-full border-gray-200 dark:border-gray-800" />

          <div className="w-full flex items-center gap-3 pb-4 border-b border-gray-200 dark:border-gray-800 text-left">
            <div className="p-2.5 rounded-xl bg-violet-50 dark:bg-violet-950/40 text-[#4F46E5] dark:text-violet-400">
              <User size={20} />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-gray-900 dark:text-white">Account Snapshot</h3>
              <p className="text-xs text-gray-500">Overview of your workspace identity</p>
            </div>
          </div>

          <div className="space-y-4 text-xs w-full">
            <div className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-800/60">
              <span className="text-gray-500 font-medium">Full Name</span>
              <span className="font-bold text-gray-800 dark:text-gray-200">{user?.name}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-800/60">
              <span className="text-gray-500 font-medium">Email Address</span>
              <span className="font-bold text-gray-800 dark:text-gray-200">{user?.email}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-800/60">
              <span className="text-gray-500 font-medium">Mobile Number</span>
              <span className="font-bold text-gray-800 dark:text-gray-200">{user?.mobile || 'N/A'}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-800/60">
              <span className="text-gray-500 font-medium">Workspace Role</span>
              <span className="px-2.5 py-0.5 rounded-lg bg-violet-50 dark:bg-violet-950/30 text-[#4F46E5] dark:text-violet-400 font-extrabold">
                {user?.role}
              </span>
            </div>
          </div>
        </div>

        {/* RIGHT CARD: EDIT PROFILE FORM */}
        <div className="lg:col-span-2 bg-white dark:bg-[#12131a] rounded-2xl p-6 border border-gray-200 dark:border-gray-800 shadow-sm">
          <div className="flex items-center gap-3 pb-4 mb-6 border-b border-gray-200 dark:border-gray-800">
            <div className="p-2.5 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400">
              <Sparkles size={20} />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-gray-900 dark:text-white">Edit Profile Details</h3>
              <p className="text-xs text-gray-500">Update your contact details or change password</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-3 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 dark:border-gray-800 rounded-xl bg-gray-50 dark:bg-gray-900 text-xs font-semibold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#4F46E5]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                  Mobile Number
                </label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-3 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    value={formData.mobile}
                    onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                    required
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 dark:border-gray-800 rounded-xl bg-gray-50 dark:bg-gray-900 text-xs font-semibold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#4F46E5]"
                  />
                </div>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                  Email Address <span className="text-[10px] font-normal text-gray-400">(Primary Login Identifier)</span>
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3 h-4 w-4 text-gray-400" />
                  <input
                    type="email"
                    value={user?.email || ''}
                    disabled
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 dark:border-gray-800 rounded-xl bg-gray-100 dark:bg-gray-800/60 text-xs font-semibold text-gray-500 cursor-not-allowed"
                  />
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-200 dark:border-gray-800">
              <h4 className="text-xs font-extrabold text-gray-900 dark:text-white uppercase tracking-wider mb-3">
                Security & Password Change <span className="text-[10px] font-normal text-gray-400">(Optional)</span>
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                    New Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-3 h-4 w-4 text-gray-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Leave blank to keep current"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="w-full pl-10 pr-10 py-2.5 border border-gray-200 dark:border-gray-800 rounded-xl bg-gray-50 dark:bg-gray-900 text-xs font-semibold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#4F46E5]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 focus:outline-none cursor-pointer"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-3 h-4 w-4 text-gray-400" />
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="Repeat new password"
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                      className="w-full pl-10 pr-10 py-2.5 border border-gray-200 dark:border-gray-800 rounded-xl bg-gray-50 dark:bg-gray-900 text-xs font-semibold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#4F46E5]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3.5 top-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 focus:outline-none cursor-pointer"
                    >
                      {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#4F46E5] hover:bg-[#4c1d95] text-white text-xs font-bold shadow-md shadow-violet-500/20 transition-all cursor-pointer disabled:opacity-50"
              >
                <Save size={16} />
                {saving ? 'Saving Changes...' : 'Save Profile Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
