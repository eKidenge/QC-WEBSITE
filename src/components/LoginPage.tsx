// src/components/LoginPage.tsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, User, Mail, Phone, LogIn, Eye, EyeOff } from 'lucide-react';

interface LoginFormData {
  username: string;
  password: string;
  password_confirm?: string;
  email?: string;
  phone?: string;
  first_name?: string;
  last_name?: string;
}

export default function LoginPage() {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState<LoginFormData>({
    username: '',
    password: '',
    email: '',
    phone: '',
    first_name: '',
    last_name: '',
    password_confirm: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Check if user is already logged in
  useEffect(() => {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    
    if (token && user) {
      const userData = JSON.parse(user);
      redirectBasedOnRole(userData);
    }
  }, [navigate]);

  const redirectBasedOnRole = (userData: any) => {
    const userType = userData.user_type || userData.role || 'client';
    
    if (userType === 'professional') {
      // Use window.location.href instead of navigate() for full page reload
      window.location.href = '/professional/dashboard';
    } else if (userType === 'admin') {
      //window.location.href = '/';
      window.location.href = '/admin';  // Changed from '/' to '/admin'
    } else {
      // Client or default
      window.location.href = '/';
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError(null);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const loginPayload = {
        username: formData.username.trim(),
        password: formData.password
      };
      
      const response = await fetch('https://dc-backend-6xlc.onrender.com/api/accounts/login/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(loginPayload)
      });

      let data;
      try {
        data = await response.json();
      } catch (jsonError) {
        throw new Error('Invalid server response');
      }

      if (!response.ok) {
        const errorMessage = data.error || 
                           data.detail || 
                           data.non_field_errors?.[0] || 
                           `Login failed (${response.status})`;
        throw new Error(errorMessage);
      }

      // Save token and user data
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      
      setSuccess('Login successful! Redirecting...');
      
      // Role-based redirect
      setTimeout(() => {
        redirectBasedOnRole(data.user);
      }, 500);

    } catch (err: any) {
      let errorMsg = err.message || 'Login failed';
      if (errorMsg.includes('Failed to fetch') || errorMsg.includes('NetworkError')) {
        errorMsg = 'Cannot connect to server';
      }
      
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    // Check if passwords match
    if (formData.password !== formData.password_confirm) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    try {
      // Registration always creates client accounts by default
      // If you need professional registration, add a hidden role field
      const payload: any = {
        username: formData.username.trim(),
        password: formData.password,
        password_confirm: formData.password_confirm,
        email: formData.email || '',
        role: 'client', // Default to client
        first_name: formData.first_name || formData.username,
        last_name: formData.last_name || 'User',
        phone: formData.phone || ''
      };

      const response = await fetch('https://dc-backend-6xlc.onrender.com/api/accounts/register/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (!response.ok) {
        let errorMessages: string[] = [];
        
        if (typeof data === 'object') {
          Object.keys(data).forEach(key => {
            if (Array.isArray(data[key])) {
              errorMessages.push(...data[key]);
            } else if (typeof data[key] === 'string') {
              errorMessages.push(data[key]);
            }
          });
        }
        
        const errorMessage = errorMessages.length > 0 
          ? errorMessages.join(', ')
          : data.error || data.detail || `Registration failed (${response.status})`;
          
        throw new Error(errorMessage);
      }

      // Auto-login after registration
      if (data.token && data.user) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        
        setSuccess('Registration successful! Redirecting...');
        
        // Redirect to homepage for new clients
        setTimeout(() => {
          window.location.href = '/';
        }, 1000);
      } else {
        throw new Error('Registration response missing token or user data');
      }

    } catch (err: any) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = isLogin ? handleLogin : handleRegister;

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-emerald-600 to-teal-600 p-8 text-white">
            <div className="flex items-center justify-center mb-4">
              <Lock className="h-12 w-12" />
            </div>
            <h1 className="text-2xl font-bold text-center">
              DIRECT-CONNECT
            </h1>
            <p className="text-emerald-100 text-center mt-2">
              {isLogin ? 'Skip the search, Get the Answer' : 'Create your account'}
            </p>
          </div>

          {/* Form */}
          <div className="p-8">
            {/* Error/Success Messages */}
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                <strong>Error:</strong> {error}
              </div>
            )}
            {success && (
              <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg text-sm">
                <strong>Success:</strong> {success}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                {/* Username */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Username *
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                    <input
                      type="text"
                      name="username"
                      value={formData.username}
                      onChange={handleInputChange}
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
                      placeholder="Enter your username"
                      required
                      autoComplete="username"
                      disabled={loading}
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Password *
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
                      placeholder="Enter your password"
                      required
                      autoComplete={isLogin ? "current-password" : "new-password"}
                      disabled={loading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      disabled={loading}
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>

                {/* Registration Only Fields */}
                {!isLogin && (
                  <>
                    {/* Password Confirmation */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Confirm Password *
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                        <input
                          type={showConfirmPassword ? "text" : "password"}
                          name="password_confirm"
                          value={formData.password_confirm || ''}
                          onChange={handleInputChange}
                          className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
                          placeholder="Confirm your password"
                          required
                          autoComplete="new-password"
                          disabled={loading}
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          disabled={loading}
                        >
                          {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                        </button>
                      </div>
                    </div>

                    {/* First Name */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        First Name *
                      </label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                        <input
                          type="text"
                          name="first_name"
                          value={formData.first_name || ''}
                          onChange={handleInputChange}
                          className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
                          placeholder="Enter your first name"
                          required
                          autoComplete="given-name"
                          disabled={loading}
                        />
                      </div>
                    </div>

                    {/* Last Name */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Last Name *
                      </label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                        <input
                          type="text"
                          name="last_name"
                          value={formData.last_name || ''}
                          onChange={handleInputChange}
                          className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
                          placeholder="Enter your last name"
                          required
                          autoComplete="family-name"
                          disabled={loading}
                        />
                      </div>
                    </div>

                    {/* Email */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email Address *
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                        <input
                          type="email"
                          name="email"
                          value={formData.email || ''}
                          onChange={handleInputChange}
                          className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
                          placeholder="Enter your email"
                          required
                          autoComplete="email"
                          disabled={loading}
                        />
                      </div>
                    </div>

                    {/* Phone */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Phone Number (Optional)
                      </label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                        <input
                          type="tel"
                          name="phone"
                          value={formData.phone || ''}
                          onChange={handleInputChange}
                          className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
                          placeholder="Enter your phone number"
                          autoComplete="tel"
                          disabled={loading}
                        />
                      </div>
                    </div>
                  </>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-semibold rounded-lg hover:from-emerald-700 hover:to-teal-700 focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      {isLogin ? 'Signing in...' : 'Creating account...'}
                    </>
                  ) : (
                    <>
                      <LogIn className="h-5 w-5" />
                      {isLogin ? 'Sign In' : 'Create Account'}
                    </>
                  )}
                </button>
              </div>
            </form>

            {/* Toggle Login/Register */}
            <div className="mt-6 text-center">
              <button
                type="button"
                onClick={() => {
                  setIsLogin(!isLogin);
                  setError(null);
                  setSuccess(null);
                  // Reset registration-specific fields when switching to login
                  if (isLogin) {
                    setFormData(prev => ({
                      ...prev,
                      password_confirm: '',
                      first_name: '',
                      last_name: '',
                      email: '',
                      phone: ''
                    }));
                  } else {
                    // Keep only login fields when switching to registration
                    setFormData(prev => ({
                      username: prev.username,
                      password: prev.password,
                      email: '',
                      phone: '',
                      first_name: '',
                      last_name: '',
                      password_confirm: ''
                    }));
                  }
                }}
                className="text-emerald-600 hover:text-emerald-700 font-medium text-sm disabled:opacity-50"
                disabled={loading}
              >
                {isLogin
                  ? "Don't have an account? Sign up"
                  : 'Already have an account? Sign in'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
