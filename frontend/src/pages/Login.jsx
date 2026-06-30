import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-hot-toast';
import { motion } from 'framer-motion';
import { Mail, Lock, LogIn, ArrowRight, Eye, EyeOff } from 'lucide-react';
import logoSla from '../assets/logosla.png';

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please enter all fields');
      return;
    }

    setLoading(true);
    const result = await login(email, password);
    setLoading(false);

    if (result.success) {
      toast.success('Logged in successfully!');
      
      // Redirect based on role
      const storedUser = localStorage.getItem('userInfo');
      if (storedUser) {
        const { role } = JSON.parse(storedUser);
        if (role === 'Admin') {
          navigate('/admin');
        } else if (['Aptitude Trainer', 'Communication Trainer', 'Technical Trainer'].includes(role)) {
          navigate('/trainer');
        } else {
          navigate('/student');
        }
      }
    } else {
      toast.error(result.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white dark:bg-[#0d0e12] login-page-bg p-4">
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

        {/* Right Side - Form */}
        <div className="p-8 sm:p-12 flex flex-col justify-center">
          <div className="w-full max-w-md mx-auto">
            <div className="flex md:hidden items-center justify-center mb-6">
              <img src={logoSla} alt="LCP Logo" className="h-10 w-auto object-contain" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Welcome Back</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Please sign in to your dashboard</p>

            <form onSubmit={handleSubmit} className="mt-8 space-y-6">
              <div>
                <label className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider block mb-2">Email Address</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                    <Mail size={18} />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full input-with-icon-left rounded-xl border border-gray-200 dark:border-gray-800 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600 dark:focus:ring-indigo-400"
                    placeholder="name@institute.com"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider block mb-2">Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                    <Lock size={18} />
                  </div>
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

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 dark:bg-indigo-600 dark:hover:bg-indigo-500 text-white font-semibold rounded-xl shadow-lg shadow-indigo-500/30 dark:shadow-none flex items-center justify-center space-x-2 transition-all duration-300 disabled:opacity-50"
              >
                {loading ? (
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : (
                  <>
                    <span>Login</span>
                    <LogIn size={18} />
                  </>
                )}
              </button>
            </form>

            <p className="mt-8 text-center text-sm text-gray-500 dark:text-gray-400">
              New here?{' '}
              <Link to="/register" className="font-semibold text-indigo-600 dark:text-indigo-400 hover:underline inline-flex items-center">
                <span>Create an account</span>
                <ArrowRight size={14} className="ml-1" />
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
