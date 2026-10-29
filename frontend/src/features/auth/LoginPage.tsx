import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Eye,
  EyeOff,
  AlertCircle,
  Loader2,
  ShieldCheck,
  Check,
  Sparkles,
  Lock,
  ArrowLeft,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  // Quick role presets for demo & college evaluation testing
  const demoRoles = [
    {
      label: 'Super Admin',
      email: 'admin@gmail.com',
      password: 'Admin@123',
      roleBadge: 'Central IT',
    },
    {
      label: 'Verification Officer',
      email: 'ramesh.kumar@aicte-india.org',
      password: 'Admin@123',
      roleBadge: 'Desk Scrutiny',
    },
    {
      label: 'Approving Director',
      email: 'director.approvals@aicte-india.org',
      password: 'Admin@123',
      roleBadge: 'Regional Dir',
    },
    {
      label: 'College Admin',
      email: 'dean.ceg@annauniv.edu',
      password: 'Admin@123',
      roleBadge: 'CEG Anna Univ',
    },
  ];

  const [email, setEmail] = useState('admin@gmail.com');
  const [password, setPassword] = useState('Admin@123');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [activeRoleIndex, setActiveRoleIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const prefilled = (location.state as any)?.prefilledEmail;
    if (prefilled) {
      setEmail(prefilled);
      const foundIdx = demoRoles.findIndex((r) => r.email === prefilled);
      if (foundIdx !== -1) {
        setActiveRoleIndex(foundIdx);
        setPassword(demoRoles[foundIdx].password);
      }
    }
  }, [location.state]);

  const from = (location.state as any)?.from?.pathname || '/dashboard';

  const handleSelectRole = (r: (typeof demoRoles)[0], idx: number) => {
    setEmail(r.email);
    setPassword(r.password);
    setActiveRoleIndex(idx);
    setErrorMessage(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsLoading(true);

    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch (err: any) {
      setErrorMessage(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-5xl bg-white rounded-3xl lg:rounded-[2.5rem] shadow-[0_20px_60px_-15px_rgba(15,23,42,0.07)] border border-slate-100 overflow-hidden grid grid-cols-1 lg:grid-cols-12 transition-all">
      {/* Left Column: Login Form & Information */}
      <div className="lg:col-span-7 p-7 sm:p-10 md:p-12 lg:p-14 flex flex-col justify-between">
        <div className="space-y-6">
          {/* Top Bar with Brand Pill & Back to Home */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-2.5 h-6 rounded-full bg-[#6d3bee]" />
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900 text-sm tracking-tight">AICTE Portal</span>
                <span className="text-[10px] font-semibold text-[#6d3bee] bg-[#6d3bee]/10 px-2 py-0.5 rounded-full">
                  Security Deposit
                </span>
              </div>
            </div>

            <Link
              to="/"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-indigo-600 transition-colors bg-slate-50 hover:bg-indigo-50 px-3 py-1.5 rounded-lg border border-slate-200/60"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Home</span>
            </Link>
          </div>

          {/* Greeting Typography */}
          <div className="space-y-1.5 pt-1">
            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
              Holla,<br />
              <span className="text-slate-900">Welcome Back</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 font-medium pt-1">
              Hey, welcome back to your special place
            </p>
          </div>

          {/* Quick Demo Role Selector */}
          <div className="bg-slate-50/80 rounded-2xl p-2.5 border border-slate-100 space-y-1.5">
            <div className="flex items-center justify-between px-1">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-[#6d3bee]" />
                Demo Credentials
              </span>
              <span className="text-[10px] text-slate-400">Click to autofill</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
              {demoRoles.map((r, idx) => {
                const isSelected = activeRoleIndex === idx && email === r.email;
                return (
                  <button
                    key={r.email}
                    type="button"
                    onClick={() => handleSelectRole(r, idx)}
                    className={`p-2 rounded-xl text-left border transition-all flex flex-col justify-between ${
                      isSelected
                        ? 'bg-white border-[#6d3bee] text-[#6d3bee] shadow-sm ring-2 ring-[#6d3bee]/10 font-medium'
                        : 'bg-white/60 hover:bg-white border-slate-200/70 text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="text-[11px] font-semibold truncate leading-tight">{r.label}</span>
                      {isSelected && <Check className="w-3 h-3 text-[#6d3bee] flex-shrink-0 ml-1" />}
                    </div>
                    <span className="text-[9px] text-slate-400 truncate mt-0.5">{r.roleBadge}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Error Alert */}
          {errorMessage && (
            <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
              <span className="font-medium">{errorMessage}</span>
            </div>
          )}

          {/* Login Form matching the reference image layout */}
          <form onSubmit={handleSubmit} className="space-y-4 pt-1">
            {/* Email input */}
            <div className="space-y-1">
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setActiveRoleIndex(-1);
                }}
                placeholder="stanley@gmail.com"
                required
                className="w-full text-xs sm:text-sm px-4 py-3 bg-white border border-slate-200/90 rounded-2xl text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-[#6d3bee] focus:ring-4 focus:ring-[#6d3bee]/10 outline-none transition-all shadow-sm"
              />
            </div>

            {/* Password input with show/hide toggle */}
            <div className="space-y-1 relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                required
                className="w-full text-xs sm:text-sm pl-4 pr-11 py-3 bg-white border border-slate-200/90 rounded-2xl text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-[#6d3bee] focus:ring-4 focus:ring-[#6d3bee]/10 outline-none transition-all shadow-sm font-sans"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="p-1.5 text-slate-400 hover:text-slate-600 absolute right-3 top-1/2 -translate-y-1/2 rounded-lg transition-colors"
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {/* Remember Me and Forgot Password */}
            <div className="flex items-center justify-between text-xs pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none text-slate-600 font-medium">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded-md border-slate-300 text-[#6d3bee] focus:ring-[#6d3bee] accent-[#6d3bee]"
                />
                <span className="text-slate-500 hover:text-slate-700">Remember me</span>
              </label>
              <Link
                to="/forgot-password"
                className="text-slate-500 hover:text-[#6d3bee] font-medium transition-colors"
              >
                Forgot Password?
              </Link>
            </div>

            {/* Submit Button matching reference image button style */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-36 py-3 px-6 rounded-2xl font-semibold text-xs sm:text-sm text-white bg-[#6d3bee] hover:bg-[#5b2bd9] active:bg-[#4d1fbe] shadow-lg shadow-[#6d3bee]/25 transition-all transform hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2 disabled:opacity-60 disabled:hover:translate-y-0"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  <span>Sign In</span>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Bottom footer link */}
       
      </div>

      {/* Right Column: Illustration & Security Branding Banner */}
      <div className="hidden lg:flex lg:col-span-5 p-3.5 sm:p-4">
        <div className="w-full h-full bg-gradient-to-br from-[#8456f9] via-[#703ef0] to-[#5927d6] rounded-[2rem] relative overflow-hidden flex flex-col justify-between p-6 sm:p-8 text-white shadow-inner">
          {/* Subtle Background Cloud & Glow Elements */}
          <div className="absolute -top-16 -right-16 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute -bottom-20 -left-12 w-52 h-52 bg-indigo-400/20 rounded-full blur-2xl pointer-events-none" />

          {/* Top Floating Badge */}
          <div className="relative z-10 flex items-center justify-between">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md border border-white/25 text-white text-[11px] font-medium shadow-sm">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" />
              <span>SSL 256-bit Encrypted</span>
            </div>
            <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/15 backdrop-blur-md text-[10px] font-medium text-white/90">
              <Lock className="w-3 h-3" />
              <span>AICTE Central</span>
            </div>
          </div>

          {/* Illustration Container */}
          <div className="relative z-10 my-auto flex items-center justify-center py-4">
            <div className="relative group max-w-[340px] w-full">
              <img
                src="/auth_illustration.png"
                alt="Security & Authentication Illustration"
                className="w-full h-auto object-contain rounded-2xl drop-shadow-[0_15px_30px_rgba(0,0,0,0.25)] transform transition-transform duration-500 hover:scale-[1.02]"
              />
            </div>
          </div>

          {/* Bottom Security Highlights */}
          <div className="relative z-10 pt-2 space-y-1 text-center">
            <h3 className="text-sm font-bold text-white tracking-tight">
              Security Deposit & FDR Lifecycle
            </h3>
            <p className="text-[11px] text-white/75 font-normal">
              All India Council for Technical Education • Statutory Portal
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
