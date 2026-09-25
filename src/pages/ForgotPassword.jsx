import React, { useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import axios from '../api/axios';
import toast from 'react-hot-toast';

const ForgotPassword = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const token = params.get('token') || '';
  const [email, setEmail] = useState('');
  const [resetToken, setResetToken] = useState(token);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);

  const requestReset = async (e) => {
    e.preventDefault();
    const normalized = email.trim().toLowerCase();
    if (!normalized) return toast.error('Please enter your email address.');
    setLoading(true);
    try {
      const res = await axios.post('/auth/forgot-password', { email: normalized });
      toast.success(res.data?.message || 'If an account exists, a reset code has been sent.');
      setResetToken('');
    } catch (err) {
      toast.error(err.response?.data?.message || err.response?.data?.error || 'Unable to request password reset.');
    } finally { setLoading(false); }
  };

  const resetPassword = async (e) => {
    e.preventDefault();
    if (!resetToken.trim()) return toast.error('Please use the reset code from your email.');
    if (password.length < 6) return toast.error('Password must be at least 6 characters.');
    if (password !== confirm) return toast.error('Passwords do not match.');
    setLoading(true);
    try {
      const res = await axios.post('/auth/reset-password', { token: resetToken.trim(), password });
      toast.success(res.data?.message || 'Password reset successfully.');
      setTimeout(() => navigate('/login', { replace: true }), 700);
    } catch (err) {
      toast.error(err.response?.data?.message || err.response?.data?.error || 'Reset code is invalid or expired.');
    } finally { setLoading(false); }
  };

  const hasToken = Boolean(token);
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-28">
      <div className="w-full max-w-md card-premium p-7 md:p-9">
        <div className="text-center mb-7">
          <h1 className="text-3xl font-black tracking-tight">{hasToken ? 'Reset Password' : 'Forgot Password?'}</h1>
          <p className="text-sm text-muted-foreground mt-2">
            {hasToken ? 'Choose a new password for your Panipuri Store account.' : 'Enter your registered email to receive a secure reset link and code.'}
          </p>
        </div>

        {hasToken ? (
          <form onSubmit={resetPassword} className="space-y-4">
            <input value={resetToken} onChange={e => setResetToken(e.target.value)} className="input-premium" placeholder="Reset code" required />
            <input value={password} onChange={e => setPassword(e.target.value)} className="input-premium" type="password" placeholder="New password" minLength={6} required />
            <input value={confirm} onChange={e => setConfirm(e.target.value)} className="input-premium" type="password" placeholder="Confirm new password" minLength={6} required />
            <button disabled={loading} className="btn-primary w-full h-12 font-black">{loading ? 'Resetting…' : 'Reset Password'}</button>
          </form>
        ) : (
          <form onSubmit={requestReset} className="space-y-4">
            <input value={email} onChange={e => setEmail(e.target.value)} className="input-premium" type="email" placeholder="Email address" autoComplete="email" required />
            <button disabled={loading} className="btn-primary w-full h-12 font-black">{loading ? 'Sending…' : 'Send Reset Link'}</button>
          </form>
        )}

        <div className="text-center mt-6 text-sm">
          <Link to="/login" className="text-primary font-bold hover:underline">Back to Sign In</Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
