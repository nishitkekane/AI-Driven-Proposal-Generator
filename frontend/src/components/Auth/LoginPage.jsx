import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';
import AuthLayout from './AuthLayout';
import Button from '../ui/Button';
import LoadingSpinner from '../ui/LoadingSpinner';
import { loginUser } from '../../services/api';

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);
  const [success, setSuccess]   = useState(false);
  const [error, setError]       = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await loginUser({ email, password });
      setSuccess(true);
      setTimeout(() => navigate('/dashboard'), 600);
    } catch (err) {
      setError(err.message || 'Login failed. Check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Welcome Back"
      subtitle="Sign in to your ProposalForge AI Workspace"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Error Banner */}
        {error && (
          <div className="flex items-start gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-400">
            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-[#E5E4E2]/80 uppercase tracking-wider mb-2">
            Work Email
          </label>
          <div className="relative">
            <Mail className="w-4 h-4 text-[#E5E4E2]/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@company.com"
              className="w-full pl-10 pr-4 py-3 rounded-xl glass-input text-sm"
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-semibold text-[#E5E4E2]/80 uppercase tracking-wider">
              Password
            </label>
          </div>
          <div className="relative">
            <Lock className="w-4 h-4 text-[#E5E4E2]/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full pl-10 pr-4 py-3 rounded-xl glass-input text-sm"
            />
          </div>
        </div>

        <Button
          type="submit"
          variant="primary"
          size="lg"
          disabled={loading || success}
          className="w-full mt-2"
        >
          {loading ? (
            <LoadingSpinner size="sm" text="Authenticating..." />
          ) : success ? (
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-700" />
              <span className="text-emerald-950 font-bold">Opening Dashboard...</span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span>Sign In</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          )}
        </Button>

        <div className="pt-4 border-t border-white/10 text-center text-xs text-[#E5E4E2]/70">
          Don't have an account?{' '}
          <Link to="/signup" className="text-cyan-400 font-semibold hover:underline">
            Create Account
          </Link>
        </div>
      </form>
    </AuthLayout>
  );
}
