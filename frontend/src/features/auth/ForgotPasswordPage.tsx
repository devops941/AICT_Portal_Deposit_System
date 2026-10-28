import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Layers, Mail, ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { apiClient } from '../../services/apiClient';

export const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [successInfo, setSuccessInfo] = useState<{ message: string; resetToken?: string } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsLoading(true);

    try {
      const res: any = await apiClient.post('/v1/auth/forgot-password', { email });
      setSuccessInfo(res.data);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to process request.');
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
        <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Forgot Password</h2>
        <p className="text-xs text-slate-500 mt-1.5">Enter your email address to receive password reset instructions</p>
      </div>

      {errorMessage && (
        <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 flex items-center gap-2 text-rose-700 text-xs text-left">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {successInfo ? (
        <div className="space-y-4 text-left">
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs space-y-2">
            <div className="flex items-center gap-2 font-bold">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>Instructions Sent</span>
            </div>
            <p>{successInfo.message}</p>
          </div>

          {successInfo.resetToken && (
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Development Reset Token:
              </span>
              <code className="text-xs font-mono text-primary-700 break-all select-all block bg-white p-2 rounded border border-slate-200">
                {successInfo.resetToken}
              </code>
              <Link
                to={`/reset-password?token=${successInfo.resetToken}`}
                className="inline-block text-xs font-bold text-primary-600 hover:underline pt-1"
              >
                Proceed to Reset Password Page →
              </Link>
            </div>
          )}

          <Link to="/login">
            <Button variant="outline" className="w-full mt-2">
              Back to Sign In
            </Button>
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4 text-left">
          <Input
            label="Email address"
            type="email"
            placeholder="your@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            icon={<Mail className="w-4 h-4" />}
            required
          />

          <Button type="submit" isLoading={isLoading} className="w-full py-2.5 rounded-xl font-semibold mt-2">
            Send Reset Instructions
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
