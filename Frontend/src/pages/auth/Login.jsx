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
    <div className="flex min-h-screen">
      {/* Left - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center bg-white px-10 py-16">
        <div className="w-full max-w-sm">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">Sign In</h2>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="text-red-500 text-sm text-center bg-red-50 p-2 rounded">
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
              inputClassName="rounded px-4 py-2.5 placeholder:text-gray-400"
            />

            <div>
              <InputField
                type={showPassword ? 'text' : 'password'}
                label="Password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                inputClassName="rounded px-4 py-2.5 placeholder:text-gray-400"
                rightElement={
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <EyeIcon visible={showPassword} />
                  </button>
                }
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full rounded py-2.5 transition-all duration-700 ease-in-out"
            >
              {loading ? 'Signing In...' : 'Sign In'}
            </Button>
          </form>

          <p className="mt-5 text-sm text-gray-600">
            Don't have an account?{' '}
            <Link  to="/signup" className="text-blue-600 hover:underline font-medium">Sign Up</Link>
          </p>
        </div>
      </div>

      <div className="hidden lg:flex w-1/2 items-center justify-center bg-[#0f1f4b]">
        <div className="text-center text-white">
          <p className="text-6xl font-semibold tracking-tight">NexaHR</p>
          <p className="mt-4 text-lg text-blue-100">People operations, clearly organized.</p>
        </div>
      </div>
    </div>
  );
}
