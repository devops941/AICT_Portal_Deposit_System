import React, { useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { Layers, Lock, CheckCircle2, AlertCircle, ArrowLeft } from 'lucide-react';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { apiClient } from '../../services/apiClient';

export const ResetPasswordPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [token, setToken] = useState(searchParams.get('token') || '');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (newPassword !== confirmPassword) {
      setErrorMessage('Passwords do not match');
      return;
    }

    setIsLoading(true);

    try {
      await apiClient.post('/v1/auth/reset-password', {
        token,
        newPassword,
        confirmPassword,
      });
      setIsSuccess(true);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to reset password. Token may be expired.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto p-4">
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-2xl p-8 text-center space-y-6">
        {/* Brand Icon */}
        <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white mx-auto shadow-md shadow-indigo-500/30">
          <Layers className="w-6 h-6" />
        </div>

      <div>
        <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Reset Password</h2>
        <p className="text-xs text-slate-500 mt-1.5">Create a strong new password for your account</p>
      </div>

      {errorMessage && (
        <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 flex items-center gap-2 text-rose-700 text-xs text-left">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {isSuccess ? (
        <div className="space-y-4 text-left">
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs space-y-2">
            <div className="flex items-center gap-2 font-bold">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>Password Reset Successful!</span>
            </div>
            <p>Your password has been securely updated. You can now log in with your new credentials.</p>
          </div>

          <Button onClick={() => navigate('/login')} className="w-full py-2.5 rounded-xl font-semibold">
            Proceed to Sign In
          </Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4 text-left">
          <Input
            label="Security Reset Token"
            type="text"
            placeholder="Paste your reset token"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            required
          />

          <Input
            label="New Password"
            type="password"
            placeholder="Minimum 8 characters"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            icon={<Lock className="w-4 h-4" />}
            required
          />

          <Input
            label="Confirm New Password"
            type="password"
            placeholder="Repeat your password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            icon={<Lock className="w-4 h-4" />}
            required
          />

          <div className="text-[11px] text-slate-500 space-y-1">
            <span className="font-semibold block">Must contain:</span>
            <div className="flex flex-wrap gap-2 text-slate-600">
              <span className={newPassword.length >= 8 ? 'text-emerald-600 font-bold' : ''}>• 8+ chars</span>
              <span className={/[A-Z]/.test(newPassword) ? 'text-emerald-600 font-bold' : ''}>• 1 uppercase</span>
              <span className={/[a-z]/.test(newPassword) ? 'text-emerald-600 font-bold' : ''}>• 1 lowercase</span>
              <span className={/[0-9]/.test(newPassword) ? 'text-emerald-600 font-bold' : ''}>• 1 number</span>
              <span className={/[^A-Za-z0-9]/.test(newPassword) ? 'text-emerald-600 font-bold' : ''}>• 1 symbol</span>
            </div>
          </div>

          <Button type="submit" isLoading={isLoading} className="w-full py-2.5 rounded-xl font-semibold mt-2">
            Update Password
          </Button>

          <div className="pt-2 text-center">
            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Sign In
            </Link>
          </div>
        </form>
      )}
      </div>
    </div>
  );
};
