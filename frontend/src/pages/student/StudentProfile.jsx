import React, { useState, useEffect } from 'react';
import API, { BACKEND_URL } from '../../services/api';
import { toast } from 'react-hot-toast';
import {
  User,
  Upload,
  Linkedin,
  Github,
  FileText,
  Save
} from 'lucide-react';
import { Card, SectionLabel, PRIMARY,
  PageSkeleton
} from '../../components/ui/primitives';

/**
 * Web counterpart of mobile/src/app/(tabs)/profile.tsx.
 * Same section order — identity card, Short Bio, Personal Info, Academic
 * Details, Professional Handles — with a sticky Save action in the header.
 *
 * Profile photo upload is deliberately absent on web: the avatar renders as a
 * monogram derived from the student's name. Resume upload is unaffected.
 */
const StudentProfile = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
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

  const [resumeFile, setResumeFile] = useState(null);
  const [currentResume, setCurrentResume] = useState('');

  const loadProfile = async () => {
    try {
      const { data } = await API.get('/student/dashboard');
      const p = data.profile || {};
      setProfileData({
        name: p.user?.name || '',
        email: p.user?.email || '',
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

    if (resumeFile) updateData.append('resume', resumeFile);

    try {
      const { data } = await API.put('/student/profile', updateData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success('Profile updated successfully!');
      setCurrentResume(data.profile?.resumeUrl || '');
      loadProfile();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error saving profile details');
    } finally {
      setSaving(false);
    }
  };

  const field = (key) => ({
    value: profileData[key],
    onChange: (e) => setProfileData({ ...profileData, [key]: e.target.value }),
  });

  if (loading) {
    return (
      <PageSkeleton variant="form" />
    );
  }

  const monogram = profileData.name?.charAt(0).toUpperCase() || 'S';

  return (
    <form onSubmit={handleSubmit} className="max-w-3xl mx-auto space-y-6">
      {/* Header — icon tile, title, Save action */}
      <Card className="p-5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="p-2.5 bg-slate-50 dark:bg-[#181922] border border-slate-200/60 dark:border-[#1e2330] rounded-2xl shrink-0">
            <User size={20} className="text-[#64748B]" />
          </div>
          <div className="min-w-0">
            <h1 className="text-2xl font-black text-[#0F172A] dark:text-white truncate">Edit Profile</h1>
            <p className="text-xs text-[#64748B] dark:text-slate-400 mt-0.5">Update academic info &amp; details</p>
          </div>
        </div>
        <button
          type="submit"
          disabled={saving}
          className="bg-[#4F46E5] hover:bg-[#4338ca] px-5 py-2.5 rounded-xl flex items-center gap-1.5 shadow-sm text-white text-xs font-black shrink-0 disabled:opacity-50 cursor-pointer transition-colors"
        >
          {saving ? (
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
          ) : (
            <>
              <Save size={14} />
              <span>Save</span>
            </>
          )}
        </button>
      </Card>

      {/* Identity card — monogram avatar, no photo upload */}
      <Card className="p-6 flex flex-col items-center text-center">
        <div className="h-28 w-28 rounded-full border-2 border-indigo-500 bg-indigo-50 dark:bg-indigo-950/40 flex items-center justify-center shadow-md">
          <span className="text-4xl font-black text-indigo-700 dark:text-indigo-400">{monogram}</span>
        </div>
        <p className="text-[#0F172A] dark:text-white font-extrabold text-base mt-4">
          {profileData.name || 'Student'}
        </p>
        <p className="text-[#64748B] dark:text-slate-400 text-xs mt-0.5">{profileData.email}</p>
      </Card>

      {/* Short Bio */}
      <Card className="space-y-2">
        <SectionLabel>Short Bio</SectionLabel>
        <textarea
          {...field('bio')}
          className="w-full text-sm h-20"
          placeholder="Write a brief intro about your career aspirations..."
        />
      </Card>

      {/* Personal Info */}
      <Card className="space-y-4">
        <SectionLabel>Personal Info</SectionLabel>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label>Full Name</label>
            <input type="text" {...field('name')} className="w-full text-sm" placeholder="Your full name" />
          </div>
          <div>
            <label>Date of Birth</label>
            <input type="date" {...field('dob')} className="w-full text-sm" />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label>Gender</label>
            <select {...field('gender')} className="w-full text-sm">
              <option value="">Select Gender</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div>
            <label>Skills (comma-separated)</label>
            <input type="text" {...field('skills')} className="w-full text-sm" placeholder="e.g. HTML, CSS, JavaScript, React" />
          </div>
        </div>

        <div>
          <label>Home Address</label>
          <input type="text" {...field('address')} className="w-full text-sm" placeholder="City, State, Country" />
        </div>
      </Card>

      {/* Academic Details */}
      <Card className="space-y-4">
        <SectionLabel>Academic Details</SectionLabel>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label>College Name</label>
            <input type="text" required {...field('collegeName')} className="w-full text-sm" placeholder="e.g. Stanford University" />
          </div>
          <div>
            <label>Degree</label>
            <input type="text" required {...field('degree')} className="w-full text-sm" placeholder="e.g. B.Tech / B.Sc" />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label>Department</label>
            <input type="text" required {...field('department')} className="w-full text-sm" placeholder="e.g. Computer Science" />
          </div>
          <div>
            <label>Year of Passing</label>
            <input type="text" required {...field('yearOfPassing')} className="w-full text-sm" placeholder="e.g. 2026" />
          </div>
        </div>
      </Card>

      {/* Professional Handles */}
      <Card className="space-y-4">
        <SectionLabel>Professional Handles</SectionLabel>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="flex items-center gap-1">
              <Linkedin size={13} className="text-indigo-500" />
              <span>LinkedIn Profile Link</span>
            </label>
            <input type="url" {...field('linkedin')} className="w-full text-sm" placeholder="https://linkedin.com/in/username" />
          </div>
          <div>
            <label className="flex items-center gap-1">
              <Github size={13} className="text-indigo-500" />
              <span>GitHub Profile Link</span>
            </label>
            <input type="url" {...field('github')} className="w-full text-sm" placeholder="https://github.com/username" />
          </div>
        </div>
      </Card>

      {/* Resume */}
      <Card className="space-y-4">
        <SectionLabel>Academic Resume (PDF)</SectionLabel>

        <div className="border border-dashed border-slate-300 dark:border-slate-700 rounded-2xl p-4 relative hover:bg-indigo-50/20 dark:hover:bg-indigo-950/10 cursor-pointer transition-colors">
          <input
            type="file"
            accept=".pdf"
            onChange={(e) => {
              const file = e.target.files[0];
              if (file) {
                setResumeFile(file);
                toast.success(`Selected resume: ${file.name}`);
              }
            }}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
          <div className="space-y-2 text-center text-xs text-[#64748B]">
            <Upload size={18} className="mx-auto text-indigo-500" />
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
            className="text-xs text-indigo-700 dark:text-indigo-400 hover:underline flex items-center gap-1 font-semibold justify-center"
          >
            <FileText size={12} />
            <span>View current uploaded resume document</span>
          </a>
        )}
      </Card>

      <button type="submit" disabled={saving} className="m-btn-primary">
        {saving ? (
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
        ) : (
          <>
            <Save size={16} />
            <span>Save Profile</span>
          </>
        )}
      </button>
    </form>
  );
};

export default StudentProfile;
