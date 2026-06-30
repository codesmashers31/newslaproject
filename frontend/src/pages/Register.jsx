import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-hot-toast';
import { motion } from 'framer-motion';
import { User, Mail, Lock, Phone, UserPlus, BookOpen, GraduationCap, ChevronRight, ChevronLeft, Camera, Eye, EyeOff } from 'lucide-react';
import logoSla from '../assets/logosla.png';

const PRESET_AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=200',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=200'
];

const Register = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  
  // Wizard steps: 1 (Account details), 2 (Educational details - Students only), 3 (Photo / Review)
  const [step, setStep] = useState(1);
  
  // Fields state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [role, setRole] = useState('Student');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [collegeName, setCollegeName] = useState('');
  const [degree, setDegree] = useState('');
  const [yearOfPassing, setYearOfPassing] = useState('');
  const [photo, setPhoto] = useState(PRESET_AVATARS[0]);
  const [loading, setLoading] = useState(false);

  // Eye toggle states
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error('Image size must be less than 2MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhoto(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerFileInput = () => {
    document.getElementById('avatar-file-input').click();
  };

  const handleNext = () => {
    if (step === 1) {
      if (!name || !email || !mobile || !password || !confirmPassword) {
        toast.error('Please fill in all account fields');
        return;
      }
      if (password !== confirmPassword) {
        toast.error('Passwords do not match');
        return;
      }
      if (role === 'Student') {
        setStep(2);
      } else {
        setStep(3); // Skip educational details for non-students
      }
    } else if (step === 2) {
      if (!collegeName || !degree || !yearOfPassing) {
        toast.error('Please enter all educational details');
        return;
      }
      setStep(3);
    }
  };

  const handlePrev = () => {
    if (step === 3 && role !== 'Student') {
      setStep(1);
    } else {
      setStep(prev => Math.max(prev - 1, 1));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (step < 3) {
      handleNext();
      return;
    }

    setLoading(true);
    const result = await register(
      name, 
      email, 
      mobile, 
      password, 
      role, 
      collegeName, 
      degree, 
      yearOfPassing, 
      photo
    );
    setLoading(false);

    if (result.success) {
      toast.success('Registration successful! Welcome.');
      if (role === 'Admin') navigate('/admin');
      else if (['Aptitude Trainer', 'Communication Trainer', 'Technical Trainer'].includes(role)) navigate('/trainer');
      else navigate('/student');
    } else {
      toast.error(result.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white dark:bg-[#0d0e12] login-page-bg p-4 overflow-y-auto select-none">
      <div className="absolute inset-0 bg-grid-black/[0.015] bg-[size:20px_20px] pointer-events-none" />
      
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-5xl grid md:grid-cols-2 rounded-3xl overflow-hidden shadow-2xl bg-white dark:bg-[#12131a] border border-gray-200/60 dark:border-gray-800/80 backdrop-blur-lg"
      >
        {/* Left Side - Brand & Info */}
        <div className="hidden md:flex flex-col justify-between p-12 bg-white dark:bg-[#12131a] text-gray-900 dark:text-gray-100 relative overflow-hidden border-r border-gray-100 dark:border-gray-800/80">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-indigo-100/50 dark:bg-indigo-950/10 rounded-full blur-3xl opacity-40" />
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-pink-100/50 dark:bg-pink-950/10 rounded-full blur-3xl opacity-40" />
          
          <div className="relative z-10">
            <div className="h-14 flex items-center">
              <img src={logoSla} alt="LCP Logo" className="h-12 w-auto object-contain" />
            </div>
            <h2 className="mt-8 text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">LCP Management</h2>
            <p className="mt-2 text-gray-500 dark:text-gray-400 text-sm">
              Learning & Career Progress dashboard. Elevating training institute evaluations with secure, digital analytics and tracking.
            </p>
          </div>

          <div className="relative z-10">
            <blockquote className="border-l-2 border-gray-300 dark:border-gray-700 pl-4 italic text-sm text-gray-500 dark:text-gray-400">
              "Replace paper scorecards with modular evaluation tracking for student placements."
            </blockquote>
            <p className="mt-4 text-xs font-semibold text-gray-400 dark:text-gray-500">LCP Training Platform &copy; 2026</p>
          </div>
        </div>

        {/* Right Side: Register Form Wizard */}
        <div className="p-8 sm:p-12 flex flex-col justify-center overflow-y-auto">
          <div className="w-full max-w-md mx-auto">
            
            {/* Mobile Logo */}
            <div className="flex md:hidden items-center justify-center mb-6">
              <img src={logoSla} alt="LCP Logo" className="h-10 w-auto object-contain" />
            </div>
            
            <div className="mb-6 text-center md:text-left">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">Create Account</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">Step {step} of 3 • {step === 1 ? 'Credentials' : step === 2 ? 'Educational Info' : 'Photo Setup'}</p>
              
              {/* Progress Indicator Bar */}
              <div className="flex items-center gap-2 mt-4">
                <div className={`h-1.5 flex-1 rounded-full ${step >= 1 ? 'bg-indigo-600' : 'bg-gray-200 dark:bg-gray-800'}`}></div>
                <div className={`h-1.5 flex-1 rounded-full ${step >= 2 ? 'bg-indigo-600' : 'bg-gray-200 dark:bg-gray-800'}`}></div>
                <div className={`h-1.5 flex-1 rounded-full ${step >= 3 ? 'bg-indigo-600' : 'bg-gray-200 dark:bg-gray-800'}`}></div>
              </div>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* STEP 1: Account credentials */}
              {step === 1 && (
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-600 dark:text-gray-400 block">Full Name</label>
                    <div className="relative group">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-4.5 h-4.5" />
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full input-with-icon-left rounded-xl border border-gray-200 dark:border-gray-800 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600 dark:focus:ring-indigo-400"
                        placeholder="John Doe"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-600 dark:text-gray-400 block">Email Address</label>
                    <div className="relative group">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-4.5 h-4.5" />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full input-with-icon-left rounded-xl border border-gray-200 dark:border-gray-800 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600 dark:focus:ring-indigo-400"
                        placeholder="john@example.com"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-gray-600 dark:text-gray-400 block">Mobile</label>
                      <div className="relative group">
                        <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                          type="tel"
                          required
                          value={mobile}
                          onChange={(e) => setMobile(e.target.value)}
                          className="w-full input-with-icon-left rounded-xl border border-gray-200 dark:border-gray-800 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600 dark:focus:ring-indigo-400"
                          placeholder="9876543210"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-gray-600 dark:text-gray-400 block">Register as</label>
                      <select
                        value={role}
                        onChange={(e) => setRole(e.target.value)}
                        className="w-full px-3 py-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600 dark:focus:ring-indigo-400"
                      >
                        <option value="Student">Student</option>
                        <option value="Admin">Admin</option>
                        <option value="Aptitude Trainer">Aptitude Trainer</option>
                        <option value="Communication Trainer">Communication Trainer</option>
                        <option value="Technical Trainer">Technical Trainer</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-gray-600 dark:text-gray-400 block">Password</label>
                      <div className="relative group">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-4.5 h-4.5" />
                        <input
                          type={showPassword ? 'text' : 'password'}
                          required
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="w-full input-with-icon-both rounded-xl border border-gray-200 dark:border-gray-800 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600 dark:focus:ring-indigo-400"
                          placeholder="••••••••"
                        />
                        <span
                          role="button"
                          tabIndex={0}
                          onClick={() => setShowPassword(!showPassword)}
                          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setShowPassword(!showPassword); }}
                          className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 cursor-pointer"
                        >
                          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </span>
                      </div>
                    </div>
                    
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-gray-600 dark:text-gray-400 block">Confirm Password</label>
                      <div className="relative group">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-4.5 h-4.5" />
                        <input
                          type={showConfirmPassword ? 'text' : 'password'}
                          required
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="w-full input-with-icon-both rounded-xl border border-gray-200 dark:border-gray-800 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600 dark:focus:ring-indigo-400"
                          placeholder="••••••••"
                        />
                        <span
                          role="button"
                          tabIndex={0}
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setShowConfirmPassword(!showConfirmPassword); }}
                          className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 cursor-pointer"
                        >
                          {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 2: Educational details */}
              {step === 2 && (
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-600 dark:text-gray-400 block">College / University Name</label>
                    <div className="relative group">
                      <GraduationCap className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-4.5 h-4.5" />
                      <input
                        type="text"
                        required
                        value={collegeName}
                        onChange={(e) => setCollegeName(e.target.value)}
                        className="w-full input-with-icon-left rounded-xl border border-gray-200 dark:border-gray-800 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600 dark:focus:ring-indigo-400"
                        placeholder="Harvard University / IIT Madras"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-gray-600 dark:text-gray-400 block">Degree Course</label>
                      <input
                        type="text"
                        required
                        value={degree}
                        onChange={(e) => setDegree(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600 dark:focus:ring-indigo-400"
                        placeholder="B.E. Computer Science"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-gray-600 dark:text-gray-400 block">Year of Passing</label>
                      <input
                        type="number"
                        required
                        value={yearOfPassing}
                        onChange={(e) => setYearOfPassing(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600 dark:focus:ring-indigo-400"
                        placeholder="2026"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 3: Profile picture / Review */}
              {step === 3 && (
                <div className="space-y-6">
                  <div className="flex flex-col items-center justify-center p-4 border border-gray-200 dark:border-gray-800 rounded-2xl bg-gray-50/10">
                    <input
                      type="file"
                      id="avatar-file-input"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    
                    <div 
                      onClick={triggerFileInput}
                      className="relative w-24 h-24 rounded-full overflow-hidden border-4 border-indigo-600/20 mb-4 bg-white dark:bg-gray-800 cursor-pointer group transition-all duration-350 hover:border-indigo-600/50"
                    >
                      {photo ? (
                        <img src={photo} alt="Avatar preview" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          <Camera className="w-8 h-8" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Camera className="w-6 h-6 text-white" />
                      </div>
                    </div>
                    
                    <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">Select Preset Avatar</span>
                    <div className="flex gap-3 justify-center mb-6">
                      {PRESET_AVATARS.map((url, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => setPhoto(url)}
                          className={`w-10 h-10 rounded-full overflow-hidden border-2 transition-all ${photo === url ? 'border-indigo-600 scale-110 shadow-md' : 'border-transparent opacity-60 hover:opacity-100'}`}
                        >
                          <img src={url} alt="Preset avatar" className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                    
                    <div className="w-full text-center">
                      <button
                        type="button"
                        onClick={triggerFileInput}
                        className="py-2.5 px-4 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/20 dark:hover:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 font-semibold text-xs rounded-xl border border-indigo-100/40 dark:border-indigo-900/30 transition-all cursor-pointer"
                      >
                        Choose from Local Files
                      </button>
                    </div>
                  </div>
                  
                  {/* Account overview card */}
                  <div className="p-4 bg-indigo-50/15 dark:bg-indigo-950/10 border border-gray-200 dark:border-gray-800 rounded-2xl text-xs space-y-2">
                    <p className="font-bold text-indigo-600 dark:text-indigo-400">Account Overview:</p>
                    <p className="text-gray-600 dark:text-gray-400"><span className="font-semibold text-gray-800 dark:text-gray-200">Name:</span> {name}</p>
                    <p className="text-gray-600 dark:text-gray-400"><span className="font-semibold text-gray-800 dark:text-gray-200">Email:</span> {email}</p>
                    <p className="text-gray-600 dark:text-gray-400"><span className="font-semibold text-gray-800 dark:text-gray-200">Role:</span> {role}</p>
                    {role === 'Student' && (
                      <p className="text-gray-600 dark:text-gray-400"><span className="font-semibold text-gray-800 dark:text-gray-200">College:</span> {collegeName} ({degree})</p>
                    )}
                  </div>
                </div>
              )}

              {/* Wizard Nav buttons */}
              <div className="flex gap-4 pt-4">
                {step > 1 && (
                  <button
                    type="button"
                    onClick={handlePrev}
                    className="flex-1 py-3 bg-white border border-gray-200 hover:bg-gray-50 text-gray-800 dark:bg-transparent dark:border-gray-800 dark:hover:bg-gray-800 dark:text-gray-200 font-semibold text-sm rounded-xl transition-all flex items-center justify-center gap-1 active:scale-[0.98]"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Back
                  </button>
                )}

                {step < 3 ? (
                  <button
                    type="button"
                    onClick={handleNext}
                    className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm rounded-xl transition-all flex items-center justify-center gap-1 active:scale-[0.98]"
                  >
                    <span>Continue</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm rounded-xl transition-all flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-50"
                  >
                    {loading ? (
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    ) : (
                      <>
                        <span>Submit Registration</span>
                        <UserPlus className="w-4 h-4" />
                      </>
                    )}
                  </button>
                )}
              </div>
              
            </form>

            <p className="mt-8 text-center text-sm text-gray-500 dark:text-gray-400">
              Already have an account?{' '}
              <Link to="/login" className="text-indigo-600 dark:text-indigo-400 font-bold hover:underline">
                Sign in
              </Link>
            </p>
          </div>
        </div>

      </motion.div>
    </div>
  );
};

export default Register;
