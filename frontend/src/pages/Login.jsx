import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-hot-toast';
import { motion } from 'framer-motion';
import { 
  Mail, 
  Lock, 
  ArrowRight, 
  Eye, 
  EyeOff, 
  GraduationCap, 
  Users, 
  BookOpen, 
  Trophy, 
  Quote, 
  ShieldCheck, 
  HelpCircle 
} from 'lucide-react';
import logoSla from '../assets/logosla.png';
import loginImage from '../assets/loginimage.svg';

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
      const storedUser = localStorage.getItem('userInfo');
      if (storedUser) {
        const { role } = JSON.parse(storedUser);
        if (role !== 'Super Admin') {
          toast.error('Access denied. Only Super Admin can access the portal.');
          localStorage.removeItem('userInfo');
          return;
        }
        toast.success('Logged in successfully!');
        navigate('/admin');
      }
    } else {
      toast.error(result.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-800 selection:bg-indigo-500 selection:text-white relative">
      {/* Main Login Card */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md mx-4 p-10 py-12 bg-white border border-slate-200/80 rounded-3xl shadow-xl space-y-8"
      >
        {/* Top SLA Logo & Brand Header */}
        <div className="flex flex-col items-center text-center space-y-4">
          <img src={logoSla} alt="Softlogic Logo" className="h-16 w-auto object-contain mb-2" />
          <div>
            <h2 className="text-2xl font-black tracking-tight text-slate-900">
              Softlogic LCP Portal
            </h2>
            <p className="text-xs text-slate-500 mt-1.5 font-medium">
              Student & Career Portal • Login to Continue
            </p>
          </div>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Email Address */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide">
              Email Address
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                <Mail size={18} />
              </div>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your registered email"
                className="w-full pl-12 pr-4 py-3.5 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-950 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all font-medium placeholder-slate-400"
              />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide">
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                <Lock size={18} />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full pl-12 pr-12 py-3.5 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-950 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all font-medium placeholder-slate-400"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Login Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-extrabold text-sm shadow-lg shadow-indigo-600/10 flex items-center justify-center space-x-2 transition disabled:opacity-50 cursor-pointer mt-4"
          >
            {loading ? (
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : (
              <>
                <span>Login to Portal</span>
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>
      </motion.div>
    </div>
  );
};

export default Login;
