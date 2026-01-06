import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  // Icons
  Users,
  UserCheck,
  Shield,
  BarChart3,
  Settings,
  LogOut,
  Bell,
  Search,
  Filter,
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Calendar,
  Activity,
  Wifi,
  WifiOff,
  Star,
  Phone,
  Video,
  Mail,
  MessageSquare,
  AlertCircle,
  Download,
  RefreshCw,
  ChevronRight,
  Home,
  UserCog,
  FileText,
  CreditCard,
  Headphones,
  Zap,
  Globe,
  Target,
  PieChart,
  UserPlus,
  UserMinus,
  Loader2
} from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

// Types that match your Django models
interface User {
  id: number;
  username: string;
  email: string;
  full_name: string;
  phone?: string;
  is_active: boolean;
  date_joined: string;
  last_login?: string;
  user_type: 'client' | 'professional' | 'admin';
  profile_image?: string;
}

interface Professional {
  id: number;
  user: User;
  hourly_rate: number;
  rating: number;
  experience_years: number;
  bio?: string;
  languages: string[];
  is_verified: boolean;
  is_online: boolean;
  last_seen?: string;
  license_number?: string;
  categories: Array<{ id: number; name: string }>;
  total_earnings: number;
  total_consultations: number;
  average_rating: number;
}

interface Client {
  id: number;
  user: User;
  total_spent: number;
  total_consultations: number;
  last_consultation?: string;
  date_of_birth?: string;
  preferences: any;
}

interface Consultation {
  id: number;
  title: string;
  description: string;
  status: 'pending' | 'matched' | 'accepted' | 'in_progress' | 'completed' | 'cancelled' | 'rejected' | 'expired';
  duration_minutes: number;
  total_amount: number;
  created_at: string;
  scheduled_start?: string;
  scheduled_end?: string;
  completed_at?: string;
  hourly_rate: number;
  professional_earnings: number;
  platform_fee: number;
  client_name: string;
  professional_name?: string;
  category_name: string;
}

interface AdminLog {
  id: number;
  admin_name: string;
  action: string;
  description: string;
  ip_address?: string;
  created_at: string;
}

interface PlatformStats {
  total_users: number;
  total_professionals: number;
  total_clients: number;
  total_consultations: number;
  total_revenue: number;
  active_consultations: number;
  today_revenue: number;
  today_consultations: number;
  pending_verifications: number;
  offline_professionals: number;
}

interface DashboardMetric {
  id: string;
  title: string;
  value: number | string;
  change: number;
  icon: React.ReactNode;
  color: string;
  format?: 'currency' | 'number' | 'percentage';
}

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  
  // States
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [stats, setStats] = useState<PlatformStats>({
    total_users: 0,
    total_professionals: 0,
    total_clients: 0,
    total_consultations: 0,
    total_revenue: 0,
    active_consultations: 0,
    today_revenue: 0,
    today_consultations: 0,
    pending_verifications: 0,
    offline_professionals: 0
  });
  
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [recentActivity, setRecentActivity] = useState<AdminLog[]>([]);
  
  // UI States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTab, setSelectedTab] = useState<'overview' | 'professionals' | 'clients' | 'consultations' | 'reports'>('overview');
  const [showSidebar, setShowSidebar] = useState(true);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [dateRange, setDateRange] = useState<'today' | 'week' | 'month' | 'year'>('week');
  const [error, setError] = useState<string | null>(null);
  
  const API_BASE_URL = 'https://dc-backend-6xlc.onrender.com/api';
  
  // Check authentication and role
  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (!token || !userData) {
      navigate('/login');
      return;
    }
    
    try {
      const parsedUser = JSON.parse(userData);
      if (parsedUser.user_type !== 'admin' && parsedUser.role !== 'admin') {
        navigate('/');
        return;
      }
      setUser(parsedUser);
      fetchDashboardData();
    } catch (error) {
      console.error('Error parsing user data:', error);
      navigate('/login');
    }
  }, [navigate]);
  
  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('token');
      
      if (!token) {
        navigate('/login');
        return;
      }
      
      const headers = {
        'Authorization': `Token ${token}`,
        'Content-Type': 'application/json'
      };
      
      console.log('Fetching dashboard data with token:', token.substring(0, 20) + '...');
      
      // 1. Fetch platform stats - FIXED URL (add /stats/)
      const statsRes = await fetch(`${API_BASE_URL}/admin/dashboard/stats/`, {
        headers
      });
      
      console.log('Stats response status:', statsRes.status);
      
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        console.log('Stats data received:', statsData);
        setStats(statsData);
      } else {
        const errorText = await statsRes.text();
        console.error('Failed to fetch stats:', statsRes.status, errorText);
        if (statsRes.status === 404) {
          setError(`API endpoint not found: /admin/dashboard/stats/. Check your backend routes.`);
        } else if (statsRes.status === 401) {
          setError('Authentication failed. Please log in again.');
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          navigate('/login');
        }
      }
      
      // 2. Fetch professionals
      const prosRes = await fetch(`${API_BASE_URL}/admin/professionals/`, {
        headers
      });
      
      if (prosRes.ok) {
        const prosData = await prosRes.json();
        console.log('Professionals data received:', prosData);
        
        // Handle response format
        if (Array.isArray(prosData)) {
          setProfessionals(prosData);
        } else if (prosData.results && Array.isArray(prosData.results)) {
          setProfessionals(prosData.results);
        } else {
          console.log('Professionals data format unexpected:', prosData);
          setProfessionals([]);
        }
      } else {
        console.error('Failed to fetch professionals:', prosRes.status, await prosRes.text());
      }
      
      // 3. Fetch clients
      const clientsRes = await fetch(`${API_BASE_URL}/admin/clients/`, {
        headers
      });
      
      if (clientsRes.ok) {
        const clientsData = await clientsRes.json();
        console.log('Clients data received:', clientsData);
        
        if (Array.isArray(clientsData)) {
          setClients(clientsData);
        } else if (clientsData.results && Array.isArray(clientsData.results)) {
          setClients(clientsData.results);
        } else {
          console.log('Clients data format unexpected:', clientsData);
          setClients([]);
        }
      } else {
        console.error('Failed to fetch clients:', clientsRes.status, await clientsRes.text());
      }
      
      // 4. Fetch recent consultations
      const consRes = await fetch(`${API_BASE_URL}/admin/consultations/recent/`, {
        headers
      });
      
      if (consRes.ok) {
        const consData = await consRes.json();
        console.log('Consultations data received:', consData);
        
        if (Array.isArray(consData)) {
          setConsultations(consData);
        } else if (consData.results && Array.isArray(consData.results)) {
          setConsultations(consData.results);
        } else {
          console.log('Consultations data format unexpected:', consData);
          setConsultations([]);
        }
      } else {
        console.error('Failed to fetch consultations:', consRes.status, await consRes.text());
      }
      
      // 5. Fetch recent activity
      const activityRes = await fetch(`${API_BASE_URL}/admin/dashboard/activity/`, {
        headers
      });
      
      if (activityRes.ok) {
        const activityData = await activityRes.json();
        console.log('Activity data received:', activityData);
        
        if (Array.isArray(activityData)) {
          setRecentActivity(activityData);
        } else if (activityData.results && Array.isArray(activityData.results)) {
          setRecentActivity(activityData.results);
        } else {
          console.log('Activity data format unexpected:', activityData);
          setRecentActivity([]);
        }
      } else {
        console.error('Failed to fetch activity:', activityRes.status, await activityRes.text());
      }
      
    } catch (error: any) {
      console.error('Error fetching dashboard data:', error);
      setError(error.message || 'Failed to load dashboard data. Check console for details.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };
  
  const toggleProfessionalStatus = async (professionalId: number, isActive: boolean) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/admin/professionals/${professionalId}/toggle-active/`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Token ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ is_active: !isActive })
      });
      
      if (response.ok) {
        fetchDashboardData();
      } else {
        console.error('Failed to toggle professional status:', response.status, await response.text());
      }
    } catch (error) {
      console.error('Error toggling professional status:', error);
    }
  };
  
  const verifyProfessional = async (professionalId: number) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/admin/professionals/${professionalId}/verify/`, {
        method: 'POST',
        headers: { 
          'Authorization': `Token ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        fetchDashboardData();
      } else {
        console.error('Failed to verify professional:', response.status, await response.text());
      }
    } catch (error) {
      console.error('Error verifying professional:', error);
    }
  };
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0
    }).format(amount);
  };
  
  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'Invalid Date';
    }
  };
  
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
      case 'completed':
      case 'verified':
        return 'bg-emerald-100 text-emerald-800';
      case 'pending':
      case 'matched':
      case 'accepted':
      case 'in_progress':
        return 'bg-amber-100 text-amber-800';
      case 'cancelled':
      case 'rejected':
      case 'failed':
      case 'expired':
        return 'bg-red-100 text-red-800';
      case 'offline':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  // Dashboard metrics
  const dashboardMetrics: DashboardMetric[] = [
    {
      id: 'revenue',
      title: 'Total Revenue',
      value: formatCurrency(stats.total_revenue),
      change: 12.5,
      icon: <DollarSign className="h-5 w-5" />,
      color: 'text-emerald-600 bg-emerald-50',
      format: 'currency'
    },
    {
      id: 'consultations',
      title: 'Total Consultations',
      value: stats.total_consultations,
      change: 8.2,
      icon: <Headphones className="h-5 w-5" />,
      color: 'text-blue-600 bg-blue-50',
      format: 'number'
    },
    {
      id: 'users',
      title: 'Total Users',
      value: stats.total_users,
      change: 5.7,
      icon: <Users className="h-5 w-5" />,
      color: 'text-purple-600 bg-purple-50',
      format: 'number'
    },
    {
      id: 'active',
      title: 'Active Now',
      value: `${stats.total_professionals - stats.offline_professionals}/${stats.total_professionals}`,
      change: 3.4,
      icon: <Activity className="h-5 w-5" />,
      color: 'text-amber-600 bg-amber-50',
      format: 'number'
    }
  ];
  
  // Generate chart data based on real stats
  const revenueData = [
    { month: 'Jan', revenue: stats.total_revenue * 0.1 },
    { month: 'Feb', revenue: stats.total_revenue * 0.15 },
    { month: 'Mar', revenue: stats.total_revenue * 0.12 },
    { month: 'Apr', revenue: stats.total_revenue * 0.18 },
    { month: 'May', revenue: stats.total_revenue * 0.22 },
    { month: 'Jun', revenue: stats.total_revenue * 0.23 },
  ];
  
  const categoryData = [
    { name: 'Legal', value: 35, color: '#10b981' },
    { name: 'Medical', value: 25, color: '#3b82f6' },
    { name: 'Tech', value: 20, color: '#8b5cf6' },
    { name: 'Business', value: 15, color: '#f59e0b' },
    { name: 'Other', value: 5, color: '#ef4444' }
  ];
  
  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-16 h-16 text-emerald-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading Admin Dashboard...</p>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-600 mx-auto mb-4" />
          <p className="text-gray-900 font-semibold mb-2">Error Loading Dashboard</p>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={fetchDashboardData}
            className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 mr-2"
          >
            Retry
          </button>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
          >
            Logout
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation */}
      <div className="bg-white shadow-sm border-b">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Left side */}
            <div className="flex items-center">
              <button
                onClick={() => setShowSidebar(!showSidebar)}
                className="p-2 rounded-lg hover:bg-gray-100 mr-2"
              >
                <div className="w-6 h-6 flex flex-col justify-center gap-1">
                  <div className="h-0.5 w-full bg-gray-600"></div>
                  <div className="h-0.5 w-full bg-gray-600"></div>
                  <div className="h-0.5 w-full bg-gray-600"></div>
                </div>
              </button>
              
              <div className="flex items-center gap-2 ml-4">
                <Shield className="h-8 w-8 text-emerald-600" />
                <div>
                  <h1 className="text-xl font-bold text-gray-900">Admin Dashboard</h1>
                  <p className="text-sm text-gray-500">DIRECT-CONNECT</p>
                </div>
              </div>
            </div>
            
            {/* Right side */}
            <div className="flex items-center gap-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search users, consultations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 w-64"
                />
              </div>
              
              {/* Notifications */}
              <button className="p-2 rounded-lg hover:bg-gray-100 relative">
                <Bell className="h-6 w-6 text-gray-600" />
                {notifications.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {notifications.length}
                  </span>
                )}
              </button>
              
              {/* User dropdown */}
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="font-medium text-gray-900">{user?.full_name || 'Admin'}</p>
                  <p className="text-sm text-gray-500">Administrator</p>
                </div>
                <div className="h-10 w-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center text-white font-bold">
                  {user?.full_name?.charAt(0) || 'A'}
                </div>
                <button
                  onClick={handleLogout}
                  className="p-2 rounded-lg hover:bg-gray-100 text-gray-600"
                  title="Logout"
                >
                  <LogOut className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="flex">
        {/* Sidebar */}
        {showSidebar && (
          <div className="w-64 bg-white border-r min-h-[calc(100vh-4rem)]">
            <nav className="p-4 space-y-1">
              <button
                onClick={() => setSelectedTab('overview')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  selectedTab === 'overview'
                    ? 'bg-emerald-50 text-emerald-700 border-l-4 border-emerald-600'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Home className="h-5 w-5" />
                <span className="font-medium">Dashboard Overview</span>
              </button>
              
              <button
                onClick={() => setSelectedTab('professionals')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  selectedTab === 'professionals'
                    ? 'bg-emerald-50 text-emerald-700 border-l-4 border-emerald-600'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <UserCheck className="h-5 w-5" />
                <span className="font-medium">Professionals</span>
                <span className="ml-auto bg-emerald-100 text-emerald-800 text-xs px-2 py-1 rounded-full">
                  {professionals.length}
                </span>
              </button>
              
              <button
                onClick={() => setSelectedTab('clients')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  selectedTab === 'clients'
                    ? 'bg-emerald-50 text-emerald-700 border-l-4 border-emerald-600'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Users className="h-5 w-5" />
                <span className="font-medium">Clients</span>
                <span className="ml-auto bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                  {clients.length}
                </span>
              </button>
              
              <button
                onClick={() => setSelectedTab('consultations')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  selectedTab === 'consultations'
                    ? 'bg-emerald-50 text-emerald-700 border-l-4 border-emerald-600'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <FileText className="h-5 w-5" />
                <span className="font-medium">Consultations</span>
                <span className="ml-auto bg-amber-100 text-amber-800 text-xs px-2 py-1 rounded-full">
                  {consultations.length}
                </span>
              </button>
              
              <button
                onClick={() => setSelectedTab('reports')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  selectedTab === 'reports'
                    ? 'bg-emerald-50 text-emerald-700 border-l-4 border-emerald-600'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <BarChart3 className="h-5 w-5" />
                <span className="font-medium">Reports & Analytics</span>
              </button>
              
              <div className="pt-8 px-4">
                <div className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-xl p-4 text-white">
                  <div className="flex items-center gap-2 mb-2">
                    <Zap className="h-5 w-5" />
                    <span className="font-bold">Platform Health</span>
                  </div>
                  <div className="text-sm opacity-90 mb-3">
                    {stats.active_consultations} active consultations
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span>Uptime: 99.9%</span>
                    <span className="flex items-center gap-1">
                      <div className="h-2 w-2 bg-green-400 rounded-full animate-pulse"></div>
                      Online
                    </span>
                  </div>
                </div>
              </div>
            </nav>
          </div>
        )}
        
        {/* Main Content */}
        <div className="flex-1 p-6">
          {selectedTab === 'overview' && (
            <>
              {/* Header */}
              <div className="mb-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Platform Overview</h2>
                    <p className="text-gray-600">Welcome back, {user?.full_name}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <select
                      value={dateRange}
                      onChange={(e) => setDateRange(e.target.value as any)}
                      className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    >
                      <option value="today">Today</option>
                      <option value="week">This Week</option>
                      <option value="month">This Month</option>
                      <option value="year">This Year</option>
                    </select>
                    <button
                      onClick={fetchDashboardData}
                      className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200"
                    >
                      <RefreshCw className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>
              
              {/* Error Alert */}
              {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-red-600" />
                    <span className="text-red-800 font-medium">{error}</span>
                  </div>
                </div>
              )}
              
              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {dashboardMetrics.map((metric) => (
                  <div key={metric.id} className="bg-white rounded-xl shadow-sm border p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className={`p-3 rounded-lg ${metric.color.split(' ')[1]}`}>
                        <div className={metric.color.split(' ')[0]}>
                          {metric.icon}
                        </div>
                      </div>
                      <div className={`flex items-center gap-1 text-sm ${
                        metric.change >= 0 ? 'text-emerald-600' : 'text-red-600'
                      }`}>
                        {metric.change >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                        <span>{Math.abs(metric.change)}%</span>
                      </div>
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-1">{metric.value}</h3>
                    <p className="text-sm text-gray-600">{metric.title}</p>
                  </div>
                ))}
              </div>
              
              {/* Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                {/* Revenue Chart */}
                <div className="bg-white rounded-xl shadow-sm border p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-bold text-gray-900">Revenue Trend</h3>
                    <div className="flex items-center gap-2 text-sm">
                      <div className="flex items-center gap-1">
                        <div className="h-3 w-3 bg-emerald-500 rounded-full"></div>
                        <span>Revenue</span>
                      </div>
                    </div>
                  </div>
                  <div className="h-80 flex items-center justify-center">
                    {stats.total_revenue > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={revenueData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                          <XAxis dataKey="month" stroke="#666" />
                          <YAxis stroke="#666" />
                          <Tooltip formatter={(value) => [formatCurrency(value as number), 'Revenue']} />
                          <Legend />
                          <Line
                            type="monotone"
                            dataKey="revenue"
                            stroke="#10b981"
                            strokeWidth={2}
                            dot={{ r: 4 }}
                            activeDot={{ r: 6 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="text-center text-gray-500">
                        <BarChart3 className="h-12 w-12 mx-auto mb-2" />
                        <p>No revenue data yet</p>
                        <p className="text-sm">Revenue will appear here once consultations are completed</p>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Category Distribution */}
                <div className="bg-white rounded-xl shadow-sm border p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-bold text-gray-900">Consultations by Category</h3>
                    <Globe className="h-5 w-5 text-gray-400" />
                  </div>
                  <div className="h-80 flex items-center justify-center">
                    {stats.total_consultations > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <RechartsPieChart>
                          <Pie
                            data={categoryData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {categoryData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value) => [`${value}%`, 'Share']} />
                          <Legend />
                        </RechartsPieChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="text-center text-gray-500">
                        <PieChart className="h-12 w-12 mx-auto mb-2" />
                        <p>No consultation data yet</p>
                        <p className="text-sm">Categories will appear here once consultations are created</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Recent Activity & Quick Stats */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Recent Activity */}
                <div className="lg:col-span-2">
                  <div className="bg-white rounded-xl shadow-sm border p-6">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-lg font-bold text-gray-900">Recent Activity</h3>
                      <button className="text-sm text-emerald-600 hover:text-emerald-700">
                        View All
                      </button>
                    </div>
                    <div className="space-y-4">
                      {recentActivity.slice(0, 5).map((activity, index) => (
                        <div key={activity.id || index} className="flex items-center gap-4 p-3 hover:bg-gray-50 rounded-lg">
                          <div className={`p-2 rounded-full ${
                            activity.action === 'professional_verified' ? 'bg-emerald-100 text-emerald-600' :
                            activity.action === 'consultation_created' ? 'bg-blue-100 text-blue-600' :
                            activity.action === 'user_created' ? 'bg-purple-100 text-purple-600' :
                            'bg-gray-100 text-gray-600'
                          }`}>
                            {activity.action === 'professional_verified' ? <UserCheck className="h-4 w-4" /> :
                             activity.action === 'consultation_created' ? <Headphones className="h-4 w-4" /> :
                             activity.action === 'user_created' ? <UserPlus className="h-4 w-4" /> :
                             <Bell className="h-4 w-4" />}
                          </div>
                          <div className="flex-1">
                            <p className="text-sm text-gray-900">{activity.description}</p>
                            <p className="text-xs text-gray-500">{formatDate(activity.created_at)}</p>
                          </div>
                        </div>
                      ))}
                      {recentActivity.length === 0 && (
                        <div className="text-center py-8 text-gray-500">
                          <Bell className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                          <p>No recent activity</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Quick Stats */}
                <div className="space-y-6">
                  <div className="bg-white rounded-xl shadow-sm border p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Platform Health</h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Users className="h-5 w-5 text-gray-400" />
                          <span className="text-gray-600">Active Users</span>
                        </div>
                        <span className="font-semibold">
                          {stats.total_professionals + stats.total_clients}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Activity className="h-5 w-5 text-gray-400" />
                          <span className="text-gray-600">Active Consultations</span>
                        </div>
                        <span className="font-semibold">{stats.active_consultations}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <UserCheck className="h-5 w-5 text-gray-400" />
                          <span className="text-gray-600">Online Professionals</span>
                        </div>
                        <span className="font-semibold">
                          {stats.total_professionals - stats.offline_professionals}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Shield className="h-5 w-5 text-gray-400" />
                          <span className="text-gray-600">Pending Verifications</span>
                        </div>
                        <span className="font-semibold text-amber-600">{stats.pending_verifications}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-xl p-6 text-white">
                    <h3 className="text-lg font-bold mb-4">Quick Actions</h3>
                    <div className="space-y-3">
                      <button className="w-full py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium transition-colors">
                        Add New Professional
                      </button>
                      <button className="w-full py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium transition-colors">
                        Generate Report
                      </button>
                      <button 
                        onClick={() => setSelectedTab('professionals')}
                        className="w-full py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium transition-colors"
                      >
                        View Pending Verifications
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
          
          {/* Professionals Tab */}
          {selectedTab === 'professionals' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">Manage Professionals</h2>
                <div className="flex items-center gap-4">
                  <button className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 flex items-center gap-2">
                    <UserPlus className="h-4 w-4" />
                    Add Professional
                  </button>
                  <button
                    onClick={fetchDashboardData}
                    className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200"
                  >
                    <RefreshCw className="h-5 w-5" />
                  </button>
                </div>
              </div>
              
              <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                <div className="p-6 border-b">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                          type="text"
                          placeholder="Search professionals..."
                          className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 w-64"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                        />
                      </div>
                      <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                        <Filter className="h-4 w-4" />
                        Filter
                      </button>
                    </div>
                    <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                      <Download className="h-4 w-4" />
                      Export
                    </button>
                  </div>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Professional
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Rate
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Consultations
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Earnings
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Verification
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {professionals
                        .filter(pro => 
                          searchQuery === '' ||
                          (pro.user?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           pro.user?.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           pro.user?.phone?.includes(searchQuery))
                        )
                        .map((pro) => (
                        <tr key={pro.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center text-white font-bold">
                                {pro.user?.full_name?.charAt(0) || 'P'}
                              </div>
                              <div>
                                <div className="font-medium text-gray-900">{pro.user?.full_name || 'Unknown'}</div>
                                <div className="text-sm text-gray-500">{pro.user?.email || 'No email'}</div>
                                <div className="text-xs text-gray-400">{pro.user?.phone || 'No phone'}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <div className={`h-2 w-2 rounded-full ${
                                pro.is_online ? 'bg-green-500' : 'bg-gray-400'
                              }`}></div>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                pro.user?.is_active
                                  ? pro.is_online
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-gray-100 text-gray-800'
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {pro.user?.is_active
                                  ? pro.is_online
                                    ? 'Online'
                                    : 'Offline'
                                  : 'Inactive'}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="font-medium text-gray-900">
                              {formatCurrency(pro.hourly_rate)}/hr
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-gray-900">{pro.total_consultations || 0}</div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="font-medium text-emerald-600">
                              {formatCurrency(pro.total_earnings || 0)}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              pro.is_verified
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}>
                              {pro.is_verified ? 'Verified' : 'Pending'}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => console.log('View details:', pro.id)}
                                className="p-1 hover:bg-gray-100 rounded"
                                title="View Details"
                              >
                                <Eye className="h-4 w-4 text-gray-600" />
                              </button>
                              <button
                                onClick={() => console.log('Edit:', pro.id)}
                                className="p-1 hover:bg-gray-100 rounded"
                                title="Edit"
                              >
                                <Edit className="h-4 w-4 text-gray-600" />
                              </button>
                              {!pro.is_verified && (
                                <button
                                  onClick={() => verifyProfessional(pro.id)}
                                  className="p-1 hover:bg-emerald-50 rounded"
                                  title="Verify"
                                >
                                  <CheckCircle className="h-4 w-4 text-emerald-600" />
                                </button>
                              )}
                              <button
                                onClick={() => toggleProfessionalStatus(pro.id, pro.user?.is_active || false)}
                                className={`p-1 rounded ${
                                  pro.user?.is_active
                                    ? 'hover:bg-red-50'
                                    : 'hover:bg-green-50'
                                }`}
                                title={pro.user?.is_active ? 'Deactivate' : 'Activate'}
                              >
                                {pro.user?.is_active ? (
                                  <UserMinus className="h-4 w-4 text-red-600" />
                                ) : (
                                  <UserPlus className="h-4 w-4 text-green-600" />
                                )}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                
                {professionals.length === 0 && (
                  <div className="text-center py-12">
                    <UserCheck className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">No professionals found</p>
                    <button
                      onClick={fetchDashboardData}
                      className="mt-2 text-sm text-emerald-600 hover:text-emerald-700"
                    >
                      Refresh
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* Clients Tab */}
          {selectedTab === 'clients' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">Manage Clients</h2>
                <div className="text-sm text-gray-500">
                  Total: {clients.length} clients
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {clients.slice(0, 9).map((client) => (
                  <div key={client.id} className="bg-white rounded-xl shadow-sm border p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold">
                          {client.user?.full_name?.charAt(0) || 'C'}
                        </div>
                        <div>
                          <h3 className="font-bold text-gray-900">{client.user?.full_name || 'Unknown Client'}</h3>
                          <p className="text-sm text-gray-500">{client.user?.email || 'No email'}</p>
                        </div>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        client.user?.is_active
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {client.user?.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Consultations:</span>
                        <span className="font-medium">{client.total_consultations || 0}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Total Spent:</span>
                        <span className="font-medium text-emerald-600">
                          {formatCurrency(client.total_spent || 0)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Last Activity:</span>
                        <span className="font-medium">
                          {client.user?.last_login ? formatDate(client.user.last_login) : 'Never'}
                        </span>
                      </div>
                    </div>
                    
                    <div className="mt-6 flex items-center gap-2">
                      <button
                        onClick={() => console.log('View client:', client.id)}
                        className="flex-1 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-medium"
                      >
                        View Details
                      </button>
                      <button className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                        <MoreVertical className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              
              {clients.length === 0 && (
                <div className="text-center py-12">
                  <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No clients found</p>
                </div>
              )}
            </div>
          )}
          
          {/* Consultations Tab */}
          {selectedTab === 'consultations' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">Consultations</h2>
                <div className="flex items-center gap-4">
                  <div className="text-sm text-gray-500">
                    Showing {consultations.length} consultations
                  </div>
                  <button
                    onClick={fetchDashboardData}
                    className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200"
                  >
                    <RefreshCw className="h-5 w-5" />
                  </button>
                </div>
              </div>
              
              <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                <div className="p-6 border-b">
                  <div className="flex items-center gap-4">
                    <button className="px-4 py-2 bg-emerald-600 text-white rounded-lg">
                      All
                    </button>
                    <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                      Pending
                    </button>
                    <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                      Active
                    </button>
                    <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                      Completed
                    </button>
                  </div>
                </div>
                
                <div className="divide-y divide-gray-200">
                  {consultations.map((consultation) => (
                    <div key={consultation.id} className="p-6 hover:bg-gray-50">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <span className="font-bold text-gray-900">#{consultation.id}</span>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              getStatusColor(consultation.status)
                            }`}>
                              {consultation.status.replace('_', ' ')}
                            </span>
                          </div>
                          <h3 className="text-lg font-semibold text-gray-900">{consultation.title}</h3>
                          <p className="text-sm text-gray-600 line-clamp-2">{consultation.description}</p>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-emerald-600">
                            {formatCurrency(consultation.total_amount)}
                          </div>
                          <div className="text-sm text-gray-500">
                            {consultation.duration_minutes} mins
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2">
                            <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                              <Users className="h-4 w-4 text-blue-600" />
                            </div>
                            <div>
                              <div className="text-sm text-gray-500">Client</div>
                              <div className="font-medium">{consultation.client_name}</div>
                            </div>
                          </div>
                          
                          {consultation.professional_name && (
                            <div className="flex items-center gap-2">
                              <div className="h-8 w-8 bg-emerald-100 rounded-full flex items-center justify-center">
                                <UserCheck className="h-4 w-4 text-emerald-600" />
                              </div>
                              <div>
                                <div className="text-sm text-gray-500">Professional</div>
                                <div className="font-medium">{consultation.professional_name}</div>
                              </div>
                            </div>
                          )}
                          
                          <div className="flex items-center gap-2">
                            <div className="h-8 w-8 bg-purple-100 rounded-full flex items-center justify-center">
                              <FileText className="h-4 w-4 text-purple-600" />
                            </div>
                            <div>
                              <div className="text-sm text-gray-500">Category</div>
                              <div className="font-medium">{consultation.category_name}</div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <div className="text-sm text-gray-500">
                            {formatDate(consultation.created_at)}
                          </div>
                          <button className="p-2 hover:bg-gray-100 rounded-lg">
                            <MoreVertical className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                {consultations.length === 0 && (
                  <div className="text-center py-12">
                    <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">No consultations found</p>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* Reports Tab */}
          {selectedTab === 'reports' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">Reports & Analytics</h2>
                <button className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 flex items-center gap-2">
                  <Download className="h-4 w-4" />
                  Export Report
                </button>
              </div>
              
              <div className="bg-white rounded-xl shadow-sm border p-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Performance Metrics</h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Conversion Rate</span>
                        <span className="font-bold text-gray-900">24.5%</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Avg. Consultation Time</span>
                        <span className="font-bold text-gray-900">28 mins</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Client Satisfaction</span>
                        <span className="font-bold text-gray-900">4.7/5.0</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Professional Response Time</span>
                        <span className="font-bold text-gray-900">2.1 mins</span>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Recent Reports</h3>
                    <div className="space-y-3">
                      {[
                        { name: 'Monthly Revenue Report', date: 'Dec 2023', status: 'Generated' },
                        { name: 'User Growth Analysis', date: 'Dec 2023', status: 'Pending' },
                        { name: 'Professional Performance', date: 'Nov 2023', status: 'Generated' },
                        { name: 'Client Retention Report', date: 'Nov 2023', status: 'Generated' }
                      ].map((report, index) => (
                        <div key={index} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg">
                          <div>
                            <div className="font-medium">{report.name}</div>
                            <div className="text-sm text-gray-500">{report.date}</div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              report.status === 'Generated'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}>
                              {report.status}
                            </span>
                            <button className="p-1 hover:bg-gray-100 rounded">
                              <Download className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
