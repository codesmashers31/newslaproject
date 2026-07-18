import React, { useState, useEffect } from 'react';
import API, { BACKEND_URL } from '../../services/api';
import { toast } from 'react-hot-toast';
import { 
  User, 
  Upload, 
  Linkedin, 
  Github, 
  FileText, 
  MapPin, 
  Calendar, 
  BookOpen, 
  Sparkles 
} from 'lucide-react';
import { motion } from 'framer-motion';

const StudentProfile = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
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
  });

  const [photoFile, setPhotoFile] = useState(null);
  const [resumeFile, setResumeFile] = useState(null);
  const [currentPhoto, setCurrentPhoto] = useState('');
  const [currentResume, setCurrentResume] = useState('');

  const loadProfile = async () => {
    try {
      const { data } = await API.get('/student/dashboard');
      const p = data.profile || {};
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
      });
      setCurrentPhoto(p.photo || '');
      setCurrentResume(p.resumeUrl || '');
    } catch (error) {
      toast.error('Failed to load profile details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    const updateData = new FormData();
    Object.keys(profileData).forEach(key => {
      updateData.append(key, profileData[key]);
    });

    if (photoFile) updateData.append('photo', photoFile);
    if (resumeFile) updateData.append('resume', resumeFile);

    try {
      const { data } = await API.put('/student/profile', updateData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.toast ? toast.toast.success('Profile updated successfully!') : toast.success('Profile updated successfully!');
      
      // refresh images
      setCurrentPhoto(data.profile.photo || '');
      setCurrentResume(data.profile.resumeUrl || '');
      loadProfile();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error saving profile details');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="h-60 flex items-center justify-center bg-white/60 dark:bg-[#12131a]/60 border border-gray-200 dark:border-gray-800 rounded-3xl animate-pulse">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-violet-800 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">Complete Profile</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Complete your portfolio for placements drives</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Avatar & Files summary */}
        <div className="bg-white/60 dark:bg-[#12131a]/60 border border-gray-200 dark:border-gray-800 p-6 rounded-3xl backdrop-blur-md shadow-sm space-y-6 flex flex-col items-center text-center">
          
          {/* Avatar Picture */}
          <div className="relative group">
            <div className="h-28 w-28 rounded-full border-2 border-violet-500 overflow-hidden bg-gray-100 flex items-center justify-center shadow-lg relative">
              {currentPhoto ? (
                <img src={currentPhoto.startsWith('data:') || currentPhoto.startsWith('blob:') ? currentPhoto : `${BACKEND_URL}${currentPhoto}`} alt="Profile Avatar" className="h-full w-full object-cover" />
              ) : (
                <User size={48} className="text-gray-400" />
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
                  // Preview photo
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
            <h4 className="font-bold text-base">Profile Image</h4>
            <p className="text-[10px] text-gray-400">Upload JPEG, JPG, or PNG under 5MB</p>
          </div>

          <hr className="w-full border-gray-200 dark:border-gray-800" />

          {/* Resume Log */}
          <div className="w-full space-y-4">
            <h5 className="text-xs font-bold text-left text-gray-600 dark:text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
              <FileText size={14} className="text-violet-500" />
              Academic Resume (PDF)
            </h5>
            
            <div className="border border-dashed border-gray-300 dark:border-gray-700 rounded-2xl p-4 relative hover:bg-violet-50/10 cursor-pointer">
              <input
                type="file"
                accept=".pdf"
                onChange={(e) => {
                  setResumeFile(e.target.files[0]);
                  toast.success(`Selected resume: ${e.target.files[0].name}`);
                }}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <div className="space-y-2 text-center text-xs text-gray-500">
                <Upload size={18} className="mx-auto text-violet-500" />
                <span className="font-semibold block truncate">
                  {resumeFile ? resumeFile.name : 'Upload PDF Resume'}
                </span>
              </div>
            </div>

            {currentResume && (
              <a 
                href={`${BACKEND_URL}${currentResume}`}
                target="_blank" 
                rel="noreferrer"
                className="text-xs text-violet-800 hover:underline flex items-center gap-1 font-semibold justify-center"
              >
                <FileText size={12} />
                <span>View current uploaded resume document</span>
              </a>
            )}
          </div>
        </div>

        {/* Right Column: Edit inputs */}
        <div className="lg:col-span-2 bg-white/60 dark:bg-[#12131a]/60 border border-gray-200 dark:border-gray-800 p-6 sm:p-8 rounded-3xl backdrop-blur-md shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-5 text-xs font-semibold text-gray-600 dark:text-gray-400">
            {/* Bio */}
            <div>
              <label className="block mb-1.5 uppercase">Short Professional Bio</label>
              <textarea
                value={profileData.bio}
                onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                className="w-full px-3 py-2 border rounded-xl bg-transparent dark:border-gray-800 text-gray-900 dark:text-gray-200 text-sm focus:outline-none h-20"
                placeholder="Write a brief intro about your career aspirations..."
              />
            </div>

            {/* University Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block mb-1.5 uppercase">College / University Name</label>
                <input
                  type="text"
                  required
                  value={profileData.collegeName}
                  onChange={(e) => setProfileData({ ...profileData, collegeName: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl bg-transparent dark:border-gray-800 text-gray-900 dark:text-gray-200 text-sm focus:outline-none"
                  placeholder="e.g. Stanford University"
                />
              </div>
              <div>
                <label className="block mb-1.5 uppercase">Degree</label>
                <input
                  type="text"
                  required
                  value={profileData.degree}
                  onChange={(e) => setProfileData({ ...profileData, degree: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl bg-transparent dark:border-gray-800 text-gray-900 dark:text-gray-200 text-sm focus:outline-none"
                  placeholder="e.g. B.Tech / B.Sc"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block mb-1.5 uppercase">Department</label>
                <input
                  type="text"
                  required
                  value={profileData.department}
                  onChange={(e) => setProfileData({ ...profileData, department: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl bg-transparent dark:border-gray-800 text-gray-900 dark:text-gray-200 text-sm focus:outline-none"
                  placeholder="e.g. Computer Science"
                />
              </div>
              <div>
                <label className="block mb-1.5 uppercase">Year of Passing (YOP)</label>
                <input
                  type="text"
                  required
                  value={profileData.yearOfPassing}
                  onChange={(e) => setProfileData({ ...profileData, yearOfPassing: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl bg-transparent dark:border-gray-800 text-gray-900 dark:text-gray-200 text-sm focus:outline-none"
                  placeholder="e.g. 2026"
                />
              </div>
              <div>
                <label className="block mb-1.5 uppercase">Date of Birth</label>
                <input
                  type="date"
                  required
                  value={profileData.dob}
                  onChange={(e) => setProfileData({ ...profileData, dob: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl bg-transparent dark:border-gray-800 text-gray-900 dark:text-gray-200 text-sm focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block mb-1.5 uppercase">Gender Selection</label>
                <select
                  value={profileData.gender}
                  onChange={(e) => setProfileData({ ...profileData, gender: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl bg-white dark:bg-[#12131a] dark:border-gray-800 text-gray-900 dark:text-gray-200 text-sm focus:outline-none"
                >
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className="block mb-1.5 uppercase">Skills (comma-separated)</label>
                <input
                  type="text"
                  value={profileData.skills}
                  onChange={(e) => setProfileData({ ...profileData, skills: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl bg-transparent dark:border-gray-800 text-gray-900 dark:text-gray-200 text-sm focus:outline-none"
                  placeholder="e.g. HTML, CSS, JavaScript, React"
                />
              </div>
            </div>

            <div>
              <label className="block mb-1.5 uppercase">Residential Address</label>
              <input
                type="text"
                value={profileData.address}
                onChange={(e) => setProfileData({ ...profileData, address: e.target.value })}
                className="w-full px-3 py-2 border rounded-xl bg-transparent dark:border-gray-800 text-gray-900 dark:text-gray-200 text-sm focus:outline-none"
                placeholder="City, State, Country"
              />
            </div>

            {/* Social profiles */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block mb-1.5 uppercase flex items-center gap-1">
                  <Linkedin size={13} className="text-violet-500" />
                  <span>LinkedIn Profile Link</span>
                </label>
                <input
                  type="url"
                  value={profileData.linkedin}
                  onChange={(e) => setProfileData({ ...profileData, linkedin: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl bg-transparent dark:border-gray-800 text-gray-900 dark:text-gray-200 text-sm focus:outline-none"
                  placeholder="https://linkedin.com/in/username"
                />
              </div>
              <div>
                <label className="block mb-1.5 uppercase flex items-center gap-1">
                  <Github size={13} className="text-violet-500" />
                  <span>GitHub Profile Link</span>
                </label>
                <input
                  type="url"
                  value={profileData.github}
                  onChange={(e) => setProfileData({ ...profileData, github: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl bg-transparent dark:border-gray-800 text-gray-900 dark:text-gray-200 text-sm focus:outline-none"
                  placeholder="https://github.com/username"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full py-3 mt-4 bg-violet-800 hover:bg-violet-500 text-white font-semibold rounded-xl shadow-lg shadow-violet-500/20 disabled:opacity-50 transition-all duration-300 flex items-center justify-center gap-2"
            >
              {saving ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
              ) : (
                <>
                  <Sparkles size={16} />
                  <span>Save Portfolio Profile</span>
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default StudentProfile;
