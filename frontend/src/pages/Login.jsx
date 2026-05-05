import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

const roles = [
  {
    key: 'admin',
    label: 'Admin',
    username: 'admin',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.623 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
      </svg>
    ),
    description: 'Full system access',
  },
  {
    key: 'supplier',
    label: 'Supplier',
    username: 'supplier',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 0 0-10.026 0 1.106 1.106 0 0 0-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
      </svg>
    ),
    description: 'Reorders & supply',
  },
  {
    key: 'client',
    label: 'Client',
    username: 'client',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
      </svg>
    ),
    description: 'Browse & request',
  },
];

export default function Login() {
  const [selectedRole, setSelectedRole] = useState(null);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleRoleSelect = (role) => {
    setSelectedRole(role.key);
    setUsername(role.username);
    setPassword('');
    setError('');
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!selectedRole) {
      setError('Please select a role first.');
      return;
    }
    setError('');
    setIsLoading(true);
    try {
      const response = await api.post('/login', { username, password });
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('role', response.data.role);
      localStorage.setItem('username', response.data.username);

      // Role-based redirect
      const role = response.data.role;
      if (role === 'supplier') {
        navigate('/supplier');
      } else if (role === 'client') {
        navigate('/client');
      } else {
        navigate('/');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Branding Panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-[#0f172a] via-[#0e2a3b] to-[#134e4a] flex-col justify-center items-start px-16 xl:px-24 relative overflow-hidden">
        {/* Decorative background shapes */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>

        <div className="relative z-10 max-w-xl">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-12">
            <div className="w-10 h-10 bg-teal-500 rounded-lg flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="m21 7.5-9-5.25L3 7.5m18 0-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9" />
              </svg>
            </div>
            <span className="text-white text-xl font-bold tracking-wider">SMART INVENTORY</span>
          </div>

          <h1 className="text-4xl xl:text-5xl font-bold text-white leading-tight mb-6">
            Unlock The Full Power of Your Inventory
          </h1>
          <p className="text-lg text-gray-400 leading-relaxed">
            Manage stock efficiently and forecast demand with smart analytics. Track products, suppliers, and client requests — all in one place.
          </p>

          {/* Feature bullets */}
          <div className="mt-10 space-y-4">
            {['Real-time stock tracking', 'Smart demand forecasting', 'Role-based access control'].map((feature, i) => (
              <div key={i} className="flex items-center gap-3 text-gray-300">
                <div className="w-5 h-5 rounded-full bg-teal-500/20 flex items-center justify-center flex-shrink-0">
                  <svg className="w-3 h-3 text-teal-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <span className="text-sm font-medium">{feature}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Login Panel */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center bg-gray-50 px-8 sm:px-16 xl:px-24">
        <div className="w-full max-w-md mx-auto">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-9 h-9 bg-teal-500 rounded-lg flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="m21 7.5-9-5.25L3 7.5m18 0-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9" />
              </svg>
            </div>
            <span className="text-gray-900 text-lg font-bold tracking-wider">SMART INVENTORY</span>
          </div>

          <div className="mb-8">
            <h2 className="text-3xl font-extrabold text-gray-900">Welcome Back</h2>
            <p className="text-sm text-gray-500 mt-2">Select your role to get started</p>
          </div>

          <div className="bg-white py-8 px-6 shadow-sm border border-gray-200 rounded-2xl">
            {/* Role Selection Cards */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">Select Role</label>
              <div className="grid grid-cols-3 gap-3">
                {roles.map((role) => (
                  <button
                    key={role.key}
                    type="button"
                    onClick={() => handleRoleSelect(role)}
                    className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all duration-200 cursor-pointer ${
                      selectedRole === role.key
                        ? 'border-teal-500 bg-teal-50 text-teal-700 shadow-sm shadow-teal-100'
                        : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className={`p-2 rounded-lg ${
                      selectedRole === role.key ? 'bg-teal-100 text-teal-600' : 'bg-gray-100 text-gray-400'
                    }`}>
                      {role.icon}
                    </div>
                    <span className={`text-sm font-semibold ${
                      selectedRole === role.key ? 'text-teal-700' : 'text-gray-700'
                    }`}>
                      {role.label}
                    </span>
                    <span className={`text-xs ${
                      selectedRole === role.key ? 'text-teal-500' : 'text-gray-400'
                    }`}>
                      {role.description}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <form className="space-y-5" onSubmit={handleLogin}>
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
                  <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {error}
                </div>
              )}

              {/* Username - read only after role selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                <input
                  type="text"
                  required
                  readOnly={!!selectedRole}
                  value={username}
                  onChange={(e) => !selectedRole && setUsername(e.target.value)}
                  className={`appearance-none block w-full px-4 py-2.5 border rounded-lg shadow-sm sm:text-sm transition-colors ${
                    selectedRole
                      ? 'bg-gray-50 border-gray-200 text-gray-700 cursor-default'
                      : 'border-gray-300 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500'
                  }`}
                  placeholder={selectedRole ? '' : 'Select a role above'}
                />
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={!selectedRole}
                  className={`appearance-none block w-full px-4 py-2.5 border rounded-lg shadow-sm sm:text-sm transition-colors ${
                    !selectedRole
                      ? 'bg-gray-50 border-gray-200 text-gray-400 cursor-not-allowed'
                      : 'border-gray-300 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500'
                  }`}
                  placeholder={selectedRole ? '••••••••' : 'Select a role first'}
                />
                <p className="mt-2 text-xs text-gray-400">
                  Select your role and enter your password to continue.
                </p>
              </div>

              {/* Submit */}
              <div>
                <button
                  type="submit"
                  disabled={!selectedRole || isLoading}
                  className={`w-full flex justify-center items-center gap-2 py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white transition-all duration-200 ${
                    !selectedRole || isLoading
                      ? 'bg-gray-300 cursor-not-allowed'
                      : 'bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500'
                  }`}
                >
                  {isLoading ? (
                    <>
                      <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Signing in...
                    </>
                  ) : (
                    'Sign in'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
