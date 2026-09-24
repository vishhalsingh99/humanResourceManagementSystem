import { useState } from 'react';
import { Link } from 'react-router-dom';

import { useApp } from '../../context/AppContext';
import Button from '../../components/common/Button';
import InputField from '../../components/common/InputField';
import EyeIcon from '../../components/common/EyeIcon';

export default function Login() {
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login, showToast } = useApp();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await login(loginId, password);
      showToast('Login successful!', 'success');
    } catch (err) {
      const message = err.response?.data?.error || err.message || 'Unable to sign in';
      setError(message);
      showToast(message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-ambient flex min-h-screen">
      <div className="flex w-full items-center justify-center px-10 py-16 lg:w-1/2">
        <div className="w-full max-w-sm rounded-2xl border border-neutral-800/80 bg-neutral-900/50 p-8 shadow-[0_0_40px_rgba(239,68,68,0.1)] backdrop-blur-md">
          <p className="mb-2 font-mono text-xs uppercase tracking-[0.18em] text-red-400">NexaHR</p>
          <h2 className="mb-6 text-2xl font-semibold text-neutral-50">Sign In</h2>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-2 text-center text-sm text-red-300">
                {error}
              </div>
            )}

            <InputField
              type="text"
              label="Email / Employee ID"
              placeholder="example@email.com or EMPID"
              value={loginId}
              onChange={(e) => setLoginId(e.target.value)}
              required
            />

            <div>
              <InputField
                type={showPassword ? 'text' : 'password'}
                label="Password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                rightElement={
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-200"
                  >
                    <EyeIcon visible={showPassword} />
                  </button>
                }
              />
            </div>

            <Button type="submit" loading={loading} className="w-full">
              {loading ? 'Signing In...' : 'Sign In'}
            </Button>
          </form>

          <p className="mt-5 text-sm text-neutral-400">
            Don&apos;t have an account?{' '}
            <Link to="/signup" className="font-medium text-red-400 hover:text-red-300 hover:underline">
              Sign Up
            </Link>
          </p>
        </div>
      </div>

      <div className="relative hidden w-1/2 items-center justify-center overflow-hidden border-l border-neutral-800/80 lg:flex">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(239,68,68,0.18),transparent_60%)]" />
        <div className="relative z-10 text-center text-white">
          <p className="text-6xl font-semibold tracking-tight">NexaHR</p>
          <p className="mt-4 font-mono text-sm text-neutral-400">People operations, clearly organized.</p>
        </div>
      </div>
    </div>
  );
}
