import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { User, Mail, Lock, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';
import AuthLayout from './AuthLayout';
import Button from '../ui/Button';
import LoadingSpinner from '../ui/LoadingSpinner';
import { registerUser, loginUser } from '../../services/api';

export default function SignupPage() {
  const navigate    = useNavigate();
  const [fullName, setFullName]   = useState('');
  const [email, setEmail]         = useState('');
  const [password, setPassword]   = useState('');
  const [loading, setLoading]     = useState(false);
  const [success, setSuccess]     = useState(false);
  const [error, setError]         = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      // Step 1 – Register the account
      await registerUser({ name: fullName, email, password });
      // Step 2 – Immediately log in to get the JWT
      await loginUser({ email, password });
      setSuccess(true);
      setTimeout(() => navigate('/dashboard'), 600);
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Create Workspace Account"
      subtitle="Join ProposalForge AI to accelerate material proposals"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Error Banner */}
        {error && (
          <div className="flex items-start gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-400">
            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-[#E5E4E2]/80 uppercase tracking-wider mb-1.5">
            Full Name
          </label>
          <div className="relative">
            <User className="w-4 h-4 text-[#E5E4E2]/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="John Doe"
              className="w-full pl-10 pr-4 py-3 rounded-xl glass-input text-sm"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-[#E5E4E2]/80 uppercase tracking-wider mb-1.5">
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
          <label className="block text-xs font-semibold text-[#E5E4E2]/80 uppercase tracking-wider mb-1.5">
            Password
          </label>
          <div className="relative">
            <Lock className="w-4 h-4 text-[#E5E4E2]/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 8 characters"
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
            <LoadingSpinner size="sm" text="Creating Account..." />
          ) : success ? (
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-700" />
              <span className="text-emerald-950 font-bold">Account Ready! Opening Workspace...</span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span>Create Account</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          )}
        </Button>

        <div className="pt-4 border-t border-white/10 text-center text-xs text-[#E5E4E2]/70">
          Already registered?{' '}
          <Link to="/login" className="text-cyan-400 font-semibold hover:underline">
            Sign In
          </Link>
        </div>
      </form>
    </AuthLayout>
  );
}
