// src/components/LoginPage.tsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, User, Mail, Phone, LogIn, Eye, EyeOff, UserCheck, Users, Briefcase, MessageSquare, Tag } from 'lucide-react';

interface LoginFormData {
  username: string;
  password: string;
  password_confirm?: string;
  email?: string;
  phone?: string;
  first_name?: string;
  last_name?: string;
  role?: 'client' | 'professional';
}

interface ServiceCategory {
  id: number;
  name: string;
  description: string;
  icon: string;
  base_price: string;
  commission_rate: string;
  available_24_7: boolean;
}

interface ProfessionalRegistrationData {
  service_categories: number[]; // Array of category IDs
  license_number?: string;
  hourly_rate: number;
  experience_years: number;
  bio?: string;
  languages: string[];
}

export default function LoginPage() {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [userType, setUserType] = useState<'client' | 'professional'>('client');
  const [formData, setFormData] = useState<LoginFormData>({
    username: '',
    password: '',
    email: '',
    phone: '',
    first_name: '',
    last_name: '',
    password_confirm: '',
    role: 'client'
  });
  const [professionalData, setProfessionalData] = useState<ProfessionalRegistrationData>({
    service_categories: [],
    license_number: '',
    hourly_rate: 50,
    experience_years: 1,
    bio: '',
    languages: ['English']
  });
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Fetch service categories on component mount
  useEffect(() => {
    fetchServiceCategories();
  }, []);

  // Check if user is already logged in
  useEffect(() => {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    
    if (token && user) {
      const userData = JSON.parse(user);
      redirectBasedOnRole(userData);
    }
  }, [navigate]);

  const fetchServiceCategories = async () => {
    try {
      setLoadingCategories(true);
      
      // Try different possible endpoints for categories
      const endpoints = [
        'https://dc-backend-6xlc.onrender.com/api/categories/', // Most likely
        'https://dc-backend-6xlc.onrender.com/api/service-categories/',
        'https://dc-backend-6xlc.onrender.com/api/categories/service-categories/',
        'https://dc-backend-6xlc.onrender.com/api/categories/all/'
      ];
      
      let categoriesData: ServiceCategory[] = [];
      let foundEndpoint = '';
      
      // Try each endpoint until one works
      for (const endpoint of endpoints) {
        try {
          console.log('Trying categories endpoint:', endpoint);
          const response = await fetch(endpoint, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
          });

          if (response.ok) {
            const data = await response.json();
            console.log('Categories response from', endpoint, ':', data);
            foundEndpoint = endpoint;
            
            // Handle different response formats
            if (Array.isArray(data)) {
              categoriesData = data;
            } else if (data.results && Array.isArray(data.results)) {
              categoriesData = data.results;
            } else if (data.data && Array.isArray(data.data)) {
              categoriesData = data.data;
            } else if (data.categories && Array.isArray(data.categories)) {
              categoriesData = data.categories;
            } else {
              // Try to find any array in the response
              for (const key in data) {
                if (Array.isArray(data[key])) {
                  categoriesData = data[key];
                  break;
                }
              }
            }
            
            if (categoriesData.length > 0) {
              break; // Stop trying endpoints when we get data
            }
          }
        } catch (err) {
          console.log('Endpoint failed:', endpoint, err);
        }
      }
      
      if (categoriesData.length === 0) {
        // If no endpoint worked, show hardcoded categories as fallback
        console.log('No categories found from API, using fallback');
        categoriesData = [
          { id: 1, name: 'Legal Advice', description: 'Legal consultation services', icon: 'gavel', base_price: '100.00', commission_rate: '20.00', available_24_7: false },
          { id: 2, name: 'Medical Consultation', description: 'Healthcare advice', icon: 'stethoscope', base_price: '80.00', commission_rate: '15.00', available_24_7: true },
          { id: 3, name: 'Business Consulting', description: 'Business strategy and advice', icon: 'briefcase', base_price: '120.00', commission_rate: '25.00', available_24_7: false },
          { id: 4, name: 'Tech Support', description: 'Technology and IT services', icon: 'laptop', base_price: '60.00', commission_rate: '10.00', available_24_7: true },
          { id: 5, name: 'Financial Planning', description: 'Investment and finance advice', icon: 'dollar-sign', base_price: '150.00', commission_rate: '30.00', available_24_7: false },
        ];
      }
      
      setCategories(categoriesData);
      console.log('Final categories loaded:', categoriesData.length, 'items');
      
    } catch (error) {
      console.error('Error fetching categories:', error);
      // Fallback categories
      setCategories([
        { id: 1, name: 'Legal Advice', description: 'Legal consultation services', icon: 'gavel', base_price: '100.00', commission_rate: '20.00', available_24_7: false },
        { id: 2, name: 'Medical Consultation', description: 'Healthcare advice', icon: 'stethoscope', base_price: '80.00', commission_rate: '15.00', available_24_7: true },
        { id: 3, name: 'Business Consulting', description: 'Business strategy and advice', icon: 'briefcase', base_price: '120.00', commission_rate: '25.00', available_24_7: false },
      ]);
    } finally {
      setLoadingCategories(false);
    }
  };

  const redirectBasedOnRole = (userData: any) => {
    const userType = userData.user_type || userData.role || 'client';
    
    if (userType === 'professional') {
      window.location.href = '/professional/dashboard';
    } else if (userType === 'admin') {
      window.location.href = '/admin';
    } else {
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

  const handleProfessionalInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setProfessionalData(prev => ({
      ...prev,
      [name]: name === 'hourly_rate' || name === 'experience_years' 
        ? Number(value) 
        : name === 'languages'
        ? [value]
        : value
    }));
  };

  const handleCategoryChange = (categoryId: number) => {
    setProfessionalData(prev => {
      const currentCategories = [...prev.service_categories];
      if (currentCategories.includes(categoryId)) {
        // Remove category if already selected
        return {
          ...prev,
          service_categories: currentCategories.filter(id => id !== categoryId)
        };
      } else {
        // Add category if not selected
        return {
          ...prev,
          service_categories: [...currentCategories, categoryId]
        };
      }
    });
  };

  const handleUserTypeChange = (type: 'client' | 'professional') => {
    setUserType(type);
    setFormData(prev => ({
      ...prev,
      role: type
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

      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      
      setSuccess('Login successful! Redirecting...');
      
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

    // Validate required fields
    if (!formData.first_name?.trim()) {
      setError('First name is required');
      setLoading(false);
      return;
    }

    if (!formData.email?.trim()) {
      setError('Email is required');
      setLoading(false);
      return;
    }

    // Validate professional fields - require at least one category
    if (userType === 'professional' && professionalData.service_categories.length === 0) {
      setError('Please select at least one service category');
      setLoading(false);
      return;
    }

    try {
      // Create the registration payload
      const payload: any = {
        username: formData.username.trim(),
        password: formData.password,
        password_confirm: formData.password_confirm,
        email: formData.email.trim(),
        role: userType,
        first_name: formData.first_name.trim(),
        last_name: (formData.last_name || 'User').trim(),
        phone: formData.phone?.trim() || '',
        is_active: true
      };

      // Add professional-specific fields
      if (userType === 'professional') {
        // Use the first selected category as specialty (for backend compatibility)
        if (professionalData.service_categories.length > 0) {
          const firstCategory = categories.find(cat => cat.id === professionalData.service_categories[0]);
          payload.specialty = firstCategory?.name || 'General';
        }
        
        payload.hourly_rate = professionalData.hourly_rate || 50;
        payload.experience_years = professionalData.experience_years || 1;
        payload.bio = professionalData.bio?.trim() || '';
        payload.languages = professionalData.languages || ['English'];
        payload.license_number = professionalData.license_number?.trim() || '';
        
        // Store categories for future use (if backend supports it later)
        // payload.service_categories = professionalData.service_categories;
      }

      console.log('Sending registration payload:', JSON.stringify(payload, null, 2));

      const response = await fetch('https://dc-backend-6xlc.onrender.com/api/accounts/register/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      const responseText = await response.text();
      console.log('Raw response:', responseText);
      
      let data;
      try {
        data = responseText ? JSON.parse(responseText) : {};
      } catch (jsonError) {
        console.error('JSON parse error:', jsonError);
        throw new Error('Server returned invalid JSON');
      }

      if (!response.ok) {
        let errorMessages: string[] = [];
        
        if (typeof data === 'object') {
          Object.keys(data).forEach(key => {
            if (Array.isArray(data[key])) {
              errorMessages.push(...data[key].map((msg: string) => `${key}: ${msg}`));
            } else if (typeof data[key] === 'string') {
              errorMessages.push(`${key}: ${data[key]}`);
            }
          });
        }
        
        const errorMessage = errorMessages.length > 0 
          ? errorMessages.join(', ')
          : data.error || data.detail || `Registration failed (${response.status})`;
          
        throw new Error(errorMessage);
      }

      // After successful user registration, auto-login
      if (data.token && data.user) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        
        setSuccess(`Registration successful! Welcome as a ${userType}. Redirecting...`);
        
        // Redirect based on role
        setTimeout(() => {
          if (userType === 'professional') {
            window.location.href = '/professional/dashboard';
          } else {
            window.location.href = '/';
          }
        }, 1500);
      } else {
        // If no auto-login, just show success message
        setSuccess('Registration successful! Please log in.');
        setIsLogin(true);
        // Clear password fields
        setFormData(prev => ({
          ...prev,
          password: '',
          password_confirm: ''
        }));
      }

    } catch (err: any) {
      console.error('Registration error:', err);
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
              {isLogin ? 'Skip the search, Get the Answer' : 'Join our community'}
            </p>
          </div>

          {/* Form */}
          <div className="p-8">
            {/* Error/Success Messages */}
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                <div className="flex items-start gap-2">
                  <div className="mt-0.5">⚠️</div>
                  <div>
                    <strong>Error:</strong> {error}
                  </div>
                </div>
              </div>
            )}
            {success && (
              <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg text-sm">
                <div className="flex items-start gap-2">
                  <div className="mt-0.5">✅</div>
                  <div>
                    <strong>Success:</strong> {success}
                  </div>
                </div>
              </div>
            )}

            {/* User Type Selection (Registration Only) */}
            {!isLogin && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Join as:
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => handleUserTypeChange('client')}
                    className={`p-4 rounded-lg border-2 transition-all duration-200 ${
                      userType === 'client'
                        ? 'border-emerald-500 bg-emerald-50 shadow-sm'
                        : 'border-gray-200 hover:border-emerald-300 hover:bg-gray-50'
                    }`}
                    disabled={loading}
                  >
                    <div className="flex flex-col items-center gap-2">
                      <div className={`p-2 rounded-full ${
                        userType === 'client' ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-100 text-gray-600'
                      }`}>
                        <Users className="h-5 w-5" />
                      </div>
                      <span className={`font-medium ${
                        userType === 'client' ? 'text-emerald-700' : 'text-gray-700'
                      }`}>
                        Client
                      </span>
                      <span className="text-xs text-gray-500 text-center">
                        Book consultations
                      </span>
                    </div>
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => handleUserTypeChange('professional')}
                    className={`p-4 rounded-lg border-2 transition-all duration-200 ${
                      userType === 'professional'
                        ? 'border-emerald-500 bg-emerald-50 shadow-sm'
                        : 'border-gray-200 hover:border-emerald-300 hover:bg-gray-50'
                    }`}
                    disabled={loading}
                  >
                    <div className="flex flex-col items-center gap-2">
                      <div className={`p-2 rounded-full ${
                        userType === 'professional' ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-100 text-gray-600'
                      }`}>
                        <Briefcase className="h-5 w-5" />
                      </div>
                      <span className={`font-medium ${
                        userType === 'professional' ? 'text-emerald-700' : 'text-gray-700'
                      }`}>
                        Professional
                      </span>
                      <span className="text-xs text-gray-500 text-center">
                        Offer services
                      </span>
                    </div>
                  </button>
                </div>
                
                {/* User Type Description */}
                <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">
                    {userType === 'client' ? (
                      <>
                        <Users className="inline h-4 w-4 mr-1" />
                        <strong>Clients</strong> can book consultations with verified professionals
                      </>
                    ) : (
                      <>
                        <Briefcase className="inline h-4 w-4 mr-1" />
                        <strong>Professionals</strong> offer consultations and earn money
                      </>
                    )}
                  </p>
                </div>
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
                      className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition disabled:bg-gray-50"
                      placeholder="john_doe"
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
                      className="w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition disabled:bg-gray-50"
                      placeholder="••••••••"
                      required
                      minLength={6}
                      autoComplete={isLogin ? "current-password" : "new-password"}
                      disabled={loading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 disabled:opacity-50"
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
                          className="w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition disabled:bg-gray-50"
                          placeholder="••••••••"
                          required
                          minLength={6}
                          autoComplete="new-password"
                          disabled={loading}
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 disabled:opacity-50"
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
                          className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition disabled:bg-gray-50"
                          placeholder="John"
                          required
                          autoComplete="given-name"
                          disabled={loading}
                        />
                      </div>
                    </div>

                    {/* Last Name */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Last Name
                      </label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                        <input
                          type="text"
                          name="last_name"
                          value={formData.last_name || ''}
                          onChange={handleInputChange}
                          className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition disabled:bg-gray-50"
                          placeholder="Doe"
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
                          className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition disabled:bg-gray-50"
                          placeholder="john@example.com"
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
                          className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition disabled:bg-gray-50"
                          placeholder="+1 (555) 123-4567"
                          autoComplete="tel"
                          disabled={loading}
                        />
                      </div>
                    </div>

                    {/* Professional-specific fields */}
                    {userType === 'professional' && (
                      <div className="pt-6 border-t border-gray-200">
                        <h3 className="text-sm font-medium text-gray-700 mb-4 flex items-center gap-2">
                          <Tag className="h-4 w-4" />
                          Professional Information
                        </h3>
                        <div className="space-y-4">
                          {/* Service Categories - REQUIRED */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Service Categories *
                              <span className="text-xs text-gray-500 ml-1">
                                (Select at least one)
                              </span>
                            </label>
                            {loadingCategories ? (
                              <div className="text-sm text-gray-500 py-2">Loading categories...</div>
                            ) : categories.length === 0 ? (
                              <div className="text-sm text-gray-500 py-2">
                                <p className="mb-2">No categories available from server.</p>
                                <p className="text-xs">Please select your specialty manually:</p>
                                <input
                                  type="text"
                                  placeholder="e.g., Lawyer, Doctor, Consultant"
                                  className="w-full mt-2 px-3 py-2 border border-gray-300 rounded-lg"
                                  value={professionalData.license_number} // Using license_number as temporary field
                                  onChange={(e) => setProfessionalData(prev => ({...prev, license_number: e.target.value}))}
                                />
                              </div>
                            ) : (
                              <div className="space-y-2 max-h-48 overflow-y-auto p-2 border border-gray-200 rounded-lg">
                                {categories.map(category => (
                                  <div key={category.id} className="flex items-center">
                                    <input
                                      type="checkbox"
                                      id={`category-${category.id}`}
                                      checked={professionalData.service_categories.includes(category.id)}
                                      onChange={() => handleCategoryChange(category.id)}
                                      className="h-4 w-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                                      disabled={loading}
                                    />
                                    <label
                                      htmlFor={`category-${category.id}`}
                                      className="ml-2 text-sm text-gray-700 flex items-start gap-2 cursor-pointer flex-1"
                                    >
                                      <div className="flex-1">
                                        <div className="font-medium">{category.name}</div>
                                        <div className="text-xs text-gray-500">{category.description}</div>
                                        <div className="flex gap-2 mt-1">
                                          <span className="text-xs bg-gray-100 px-2 py-0.5 rounded">
                                            Base: ${category.base_price}
                                          </span>
                                          <span className="text-xs bg-gray-100 px-2 py-0.5 rounded">
                                            Commission: {category.commission_rate}%
                                          </span>
                                          {category.available_24_7 && (
                                            <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded">
                                              24/7
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                    </label>
                                  </div>
                                ))}
                              </div>
                            )}
                            {professionalData.service_categories.length > 0 && (
                              <div className="mt-2 text-xs text-gray-500">
                                Selected: {professionalData.service_categories.length} category(ies)
                              </div>
                            )}
                          </div>

                          {/* License Number */}
                          <div>
                            <label className="block text-sm text-gray-600 mb-1">
                              License Number (Optional)
                            </label>
                            <input
                              type="text"
                              name="license_number"
                              value={professionalData.license_number || ''}
                              onChange={handleProfessionalInputChange}
                              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition disabled:bg-gray-50"
                              placeholder="Professional license number"
                              disabled={loading}
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            {/* Hourly Rate */}
                            <div>
                              <label className="block text-sm text-gray-600 mb-1">
                                Hourly Rate ($)
                              </label>
                              <input
                                type="number"
                                name="hourly_rate"
                                value={professionalData.hourly_rate}
                                onChange={handleProfessionalInputChange}
                                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition disabled:bg-gray-50"
                                placeholder="50"
                                min="0"
                                step="1"
                                disabled={loading}
                              />
                            </div>
                            
                            {/* Experience Years */}
                            <div>
                              <label className="block text-sm text-gray-600 mb-1">
                                Years of Experience
                              </label>
                              <input
                                type="number"
                                name="experience_years"
                                value={professionalData.experience_years}
                                onChange={handleProfessionalInputChange}
                                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition disabled:bg-gray-50"
                                placeholder="5"
                                min="0"
                                step="1"
                                disabled={loading}
                              />
                            </div>
                          </div>

                          {/* Languages */}
                          <div>
                            <label className="block text-sm text-gray-600 mb-1">
                              Languages (Optional)
                            </label>
                            <select
                              name="languages"
                              value={professionalData.languages[0] || 'English'}
                              onChange={handleProfessionalInputChange}
                              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition disabled:bg-gray-50"
                              disabled={loading}
                            >
                              <option value="English">English</option>
                              <option value="Spanish">Spanish</option>
                              <option value="French">French</option>
                              <option value="German">German</option>
                              <option value="Chinese">Chinese</option>
                              <option value="Arabic">Arabic</option>
                              <option value="Swahili">Swahili</option>
                            </select>
                          </div>

                          {/* Bio */}
                          <div>
                            <label className="block text-sm text-gray-600 mb-1">
                              Bio (Optional)
                            </label>
                            <textarea
                              name="bio"
                              value={professionalData.bio || ''}
                              onChange={handleProfessionalInputChange}
                              rows={3}
                              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition disabled:bg-gray-50"
                              placeholder="Tell us about your expertise, qualifications, and experience..."
                              disabled={loading}
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 mt-6 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-semibold rounded-lg hover:from-emerald-700 hover:to-teal-700 focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-sm"
                >
                  {loading ? (
                    <>
                      <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      {isLogin ? 'Signing in...' : 'Creating account...'}
                    </>
                  ) : (
                    <>
                      {isLogin ? (
                        <>
                          <LogIn className="h-5 w-5" />
                          Sign In
                        </>
                      ) : (
                        <>
                          <MessageSquare className="h-5 w-5" />
                          {userType === 'professional' ? 'Join as Professional' : 'Join as Client'}
                        </>
                      )}
                    </>
                  )}
                </button>
              </div>
            </form>

            {/* Toggle Login/Register */}
            <div className="mt-6 pt-6 border-t border-gray-200 text-center">
              <button
                type="button"
                onClick={() => {
                  setIsLogin(!isLogin);
                  setError(null);
                  setSuccess(null);
                  setUserType('client');
                  if (isLogin) {
                    setFormData(prev => ({
                      ...prev,
                      password_confirm: '',
                      first_name: '',
                      last_name: '',
                      email: '',
                      phone: '',
                      role: 'client'
                    }));
                    setProfessionalData({
                      service_categories: [],
                      license_number: '',
                      hourly_rate: 50,
                      experience_years: 1,
                      bio: '',
                      languages: ['English']
                    });
                  } else {
                    setFormData(prev => ({
                      username: prev.username,
                      password: '',
                      email: '',
                      phone: '',
                      first_name: '',
                      last_name: '',
                      password_confirm: '',
                      role: 'client'
                    }));
                  }
                }}
                className="text-emerald-600 hover:text-emerald-700 font-medium text-sm disabled:opacity-50 transition-colors"
                disabled={loading}
              >
                {isLogin
                  ? "Don't have an account? Sign up"
                  : 'Already have an account? Sign in'}
              </button>
              
              {/* Terms notice */}
              {!isLogin && (
                <p className="mt-4 text-xs text-gray-500">
                  By creating an account, you agree to our Terms of Service and Privacy Policy
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
