import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
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
  Loader2,
  Plus,
  X,
  Save,
  EyeOff
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

// Types
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
  first_name?: string;
  last_name?: string;
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
  client?: number;
  professional?: number;
  category?: number;
}

interface AdminLog {
  id: number;
  admin_name: string;
  action: string;
  description: string;
  ip_address?: string;
  created_at: string;
  details?: any;
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

interface Report {
  id: number;
  name: string;
  report_type: string;
  format: string;
  period_start: string;
  period_end: string;
  status: string;
  generated_by_name?: string;
  generated_at?: string;
  data?: any;
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
  const [reports, setReports] = useState<Report[]>([]);
  
  // UI States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTab, setSelectedTab] = useState<'overview' | 'professionals' | 'clients' | 'consultations' | 'reports'>('overview');
  const [showSidebar, setShowSidebar] = useState(true);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [dateRange, setDateRange] = useState<'today' | 'week' | 'month' | 'year'>('week');
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  // Modal States
  const [showAddProfessionalModal, setShowAddProfessionalModal] = useState(false);
  const [showAddClientModal, setShowAddClientModal] = useState(false);
  const [showGenerateReportModal, setShowGenerateReportModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedDetail, setSelectedDetail] = useState<any>(null);
  const [detailType, setDetailType] = useState<'professional' | 'client' | 'consultation' | null>(null);
  
  // Form States
  const [newProfessionalData, setNewProfessionalData] = useState({
    user: {
      username: '',
      email: '',
      password: '',
      first_name: '',
      last_name: '',
      phone: ''
    },
    professional: {
      hourly_rate: 0,
      experience_years: 0,
      bio: '',
      languages: ['English'],
      license_number: ''
    }
  });
  
  const [newClientData, setNewClientData] = useState({
    user: {
      username: '',
      email: '',
      password: '',
      first_name: '',
      last_name: '',
      phone: ''
    },
    client: {
      date_of_birth: '',
      preferences: {}
    }
  });
  
  const [reportData, setReportData] = useState({
    name: '',
    report_type: 'revenue',
    period_start: new Date().toISOString().split('T')[0],
    period_end: new Date().toISOString().split('T')[0],
    format: 'json'
  });
  
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
      
      // Fetch platform stats
      const statsRes = await fetch(`${API_BASE_URL}/admin/dashboard/stats/`, { headers });
      
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      } else {
        const errorText = await statsRes.text();
        console.error('Failed to fetch stats:', statsRes.status, errorText);
      }
      
      // Fetch professionals
      const prosRes = await fetch(`${API_BASE_URL}/admin/professionals/`, { headers });
      if (prosRes.ok) {
        const prosData = await prosRes.json();
        setProfessionals(Array.isArray(prosData) ? prosData : (prosData.results || []));
      }
      
      // Fetch clients
      const clientsRes = await fetch(`${API_BASE_URL}/admin/clients/`, { headers });
      if (clientsRes.ok) {
        const clientsData = await clientsRes.json();
        setClients(Array.isArray(clientsData) ? clientsData : (clientsData.results || []));
      }
      
      // Fetch recent consultations
      const consRes = await fetch(`${API_BASE_URL}/admin/consultations/recent/`, { headers });
      if (consRes.ok) {
        const consData = await consRes.json();
        setConsultations(Array.isArray(consData) ? consData : (consData.results || []));
      }
      
      // Fetch recent activity
      const activityRes = await fetch(`${API_BASE_URL}/admin/dashboard/activity/`, { headers });
      if (activityRes.ok) {
        const activityData = await activityRes.json();
        setRecentActivity(Array.isArray(activityData) ? activityData : (activityData.results || []));
      }
      
      // Fetch reports
      const reportsRes = await fetch(`${API_BASE_URL}/admin/reports/`, { headers });
      if (reportsRes.ok) {
        const reportsData = await reportsRes.json();
        setReports(Array.isArray(reportsData) ? reportsData : (reportsData.results || []));
      }
      
    } catch (error: any) {
      console.error('Error fetching dashboard data:', error);
      setError(error.message || 'Failed to load dashboard data.');
    } finally {
      setLoading(false);
    }
  };
  
  // === BUTTON FUNCTIONS ===
  
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };
  
  // Professional Functions
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
        setSuccessMessage(`Professional ${!isActive ? 'activated' : 'deactivated'} successfully`);
        fetchDashboardData();
        setTimeout(() => setSuccessMessage(null), 3000);
      } else {
        setError('Failed to update professional status');
      }
    } catch (error) {
      console.error('Error toggling professional status:', error);
      setError('Error updating professional status');
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
        setSuccessMessage('Professional verified successfully');
        fetchDashboardData();
        setTimeout(() => setSuccessMessage(null), 3000);
      } else {
        setError('Failed to verify professional');
      }
    } catch (error) {
      console.error('Error verifying professional:', error);
      setError('Error verifying professional');
    }
  };
  
  const addNewProfessional = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/admin/professionals/`, {
        method: 'POST',
        headers: {
          'Authorization': `Token ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          user: newProfessionalData.user,
          professional: {  // ← ADD THIS LINE
            hourly_rate: newProfessionalData.professional.hourly_rate,
            experience_years: newProfessionalData.professional.experience_years,
            bio: newProfessionalData.professional.bio,
            languages: newProfessionalData.professional.languages,
            license_number: newProfessionalData.professional.license_number,
            service_categories: []  // Added comma here
            }  // ← ADD THIS LINE
          })
      });
      
      if (response.ok) {
        setSuccessMessage('Professional added successfully');
        setShowAddProfessionalModal(false);
        setNewProfessionalData({
          user: {
            username: '',
            email: '',
            password: '',
            first_name: '',
            last_name: '',
            phone: ''
          },
          professional: {
            hourly_rate: 0,
            experience_years: 0,
            bio: '',
            languages: ['English'],
            license_number: ''
          }
        });
        fetchDashboardData();
        setTimeout(() => setSuccessMessage(null), 3000);
      } else {
        const errorData = await response.json();
        setError(`Failed to add professional: ${JSON.stringify(errorData)}`);
      }
    } catch (error) {
      console.error('Error adding professional:', error);
      setError('Error adding professional');
    }
  };
  
  // Client Functions
  const toggleClientStatus = async (clientId: number, isActive: boolean) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/admin/clients/${clientId}/toggle-active/`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Token ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ is_active: !isActive })
      });
      
      if (response.ok) {
        setSuccessMessage(`Client ${!isActive ? 'activated' : 'deactivated'} successfully`);
        fetchDashboardData();
        setTimeout(() => setSuccessMessage(null), 3000);
      } else {
        setError('Failed to update client status');
      }
    } catch (error) {
      console.error('Error toggling client status:', error);
      setError('Error updating client status');
    }
  };
  
  const addNewClient = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/admin/clients/`, {
        method: 'POST',
        headers: {
          'Authorization': `Token ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newClientData)
      });
      
      if (response.ok) {
        setSuccessMessage('Client added successfully');
        setShowAddClientModal(false);
        setNewClientData({
          user: {
            username: '',
            email: '',
            password: '',
            first_name: '',
            last_name: '',
            phone: ''
          },
          client: {
            date_of_birth: '',
            preferences: {}
          }
        });
        fetchDashboardData();
        setTimeout(() => setSuccessMessage(null), 3000);
      } else {
        const errorData = await response.json();
        setError(`Failed to add client: ${JSON.stringify(errorData)}`);
      }
    } catch (error) {
      console.error('Error adding client:', error);
      setError('Error adding client');
    }
  };
  
  // Report Functions
  const generateReport = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/admin/reports/generate/`, {
        method: 'POST',
        headers: {
          'Authorization': `Token ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(reportData)
      });
      
      if (response.ok) {
        const report = await response.json();
        setSuccessMessage(`Report "${report.name}" generated successfully`);
        setShowGenerateReportModal(false);
        setReportData({
          name: '',
          report_type: 'revenue',
          period_start: new Date().toISOString().split('T')[0],
          period_end: new Date().toISOString().split('T')[0],
          format: 'json'
        });
        fetchDashboardData();
        setTimeout(() => setSuccessMessage(null), 3000);
      } else {
        const errorData = await response.json();
        setError(`Failed to generate report: ${JSON.stringify(errorData)}`);
      }
    } catch (error) {
      console.error('Error generating report:', error);
      setError('Error generating report');
    }
  };
  
  const downloadReport = async (reportId: number, reportName: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/admin/reports/${reportId}/download/`, {
        headers: {
          'Authorization': `Token ${token}`,
        }
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${reportName}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        setSuccessMessage('Report downloaded successfully');
        setTimeout(() => setSuccessMessage(null), 3000);
      } else {
        setError('Failed to download report');
      }
    } catch (error) {
      console.error('Error downloading report:', error);
      setError('Error downloading report');
    }
  };
  
  // Consultation Functions
  const cancelConsultation = async (consultationId: number) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/admin/consultations/${consultationId}/cancel/`, {
        method: 'POST',
        headers: {
          'Authorization': `Token ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        setSuccessMessage('Consultation cancelled successfully');
        fetchDashboardData();
        setTimeout(() => setSuccessMessage(null), 3000);
      } else {
        setError('Failed to cancel consultation');
      }
    } catch (error) {
      console.error('Error cancelling consultation:', error);
      setError('Error cancelling consultation');
    }
  };
  
  // Detail View Function
  const viewDetails = async (type: 'professional' | 'client' | 'consultation', id: number) => {
    try {
      const token = localStorage.getItem('token');
      let endpoint = '';
      
      switch (type) {
        case 'professional':
          endpoint = `${API_BASE_URL}/admin/professionals/${id}/`;
          break;
        case 'client':
          endpoint = `${API_BASE_URL}/admin/clients/${id}/`;
          break;
        case 'consultation':
          endpoint = `${API_BASE_URL}/admin/consultations/${id}/`;
          break;
      }
      
      const response = await fetch(endpoint, {
        headers: {
          'Authorization': `Token ${token}`,
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setSelectedDetail(data);
        setDetailType(type);
        setShowDetailModal(true);
      } else {
        setError('Failed to load details');
      }
    } catch (error) {
      console.error('Error loading details:', error);
      setError('Error loading details');
    }
  };
  
  // Export Function
  const exportData = async (type: 'professionals' | 'clients' | 'consultations') => {
    try {
      const token = localStorage.getItem('token');
      let endpoint = `${API_BASE_URL}/admin/${type}/`;
      
      const response = await fetch(endpoint, {
        headers: {
          'Authorization': `Token ${token}`,
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        const items = Array.isArray(data) ? data : (data.results || []);
        
        // Convert to CSV
        const csvContent = convertToCSV(items);
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${type}_export_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        setSuccessMessage(`${type} exported successfully`);
        setTimeout(() => setSuccessMessage(null), 3000);
      } else {
        setError(`Failed to export ${type}`);
      }
    } catch (error) {
      console.error(`Error exporting ${type}:`, error);
      setError(`Error exporting ${type}`);
    }
  };
  
  const convertToCSV = (items: any[]) => {
    if (items.length === 0) return '';
    
    const headers = Object.keys(items[0]).join(',');
    const rows = items.map(item => 
      Object.values(item).map(value => 
        typeof value === 'string' ? `"${value.replace(/"/g, '""')}"` : value
      ).join(',')
    );
    
    return [headers, ...rows].join('\n');
  };
  
  // Utility Functions
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
  
  // Chart data
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
  
  // Filter professionals for pending verifications
  const pendingProfessionals = professionals.filter(pro => !pro.is_verified);
  
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
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Success/Error Messages */}
      {successMessage && (
        <div className="fixed top-4 right-4 z-50">
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 shadow-lg">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-emerald-600" />
              <span className="text-emerald-800">{successMessage}</span>
            </div>
          </div>
        </div>
      )}
      
      {error && (
        <div className="fixed top-4 right-4 z-50">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 shadow-lg">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <span className="text-red-800">{error}</span>
              <button 
                onClick={() => setError(null)}
                className="ml-auto text-red-600 hover:text-red-800"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Top Navigation */}
      <div className="bg-white shadow-sm border-b">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
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
            
            <div className="flex items-center gap-4">
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
              
              <button className="p-2 rounded-lg hover:bg-gray-100 relative">
                <Bell className="h-6 w-6 text-gray-600" />
                {notifications.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {notifications.length}
                  </span>
                )}
              </button>
              
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
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                <div className="bg-white rounded-xl shadow-sm border p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-bold text-gray-900">Revenue Trend</h3>
                  </div>
                  <div className="h-80">
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
                  </div>
                </div>
                
                <div className="bg-white rounded-xl shadow-sm border p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-bold text-gray-900">Consultations by Category</h3>
                  </div>
                  <div className="h-80">
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
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                  <div className="bg-white rounded-xl shadow-sm border p-6">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-lg font-bold text-gray-900">Recent Activity</h3>
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
                    </div>
                  </div>
                </div>
                
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
                      <button
                        onClick={() => setShowAddProfessionalModal(true)}
                        className="w-full py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                      >
                        <UserPlus className="h-4 w-4" />
                        Add New Professional
                      </button>
                      <button
                        onClick={() => setShowGenerateReportModal(true)}
                        className="w-full py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                      >
                        <BarChart3 className="h-4 w-4" />
                        Generate Report
                      </button>
                      <button 
                        onClick={() => {
                          setSelectedTab('professionals');
                          setSearchQuery('');
                        }}
                        className="w-full py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                      >
                        <UserCheck className="h-4 w-4" />
                        View Pending Verifications ({pendingProfessionals.length})
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
                  <button
                    onClick={() => setShowAddProfessionalModal(true)}
                    className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 flex items-center gap-2"
                  >
                    <UserPlus className="h-4 w-4" />
                    Add Professional
                  </button>
                  <button
                    onClick={() => exportData('professionals')}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2"
                  >
                    <Download className="h-4 w-4" />
                    Export
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
                                onClick={() => viewDetails('professional', pro.id)}
                                className="p-1 hover:bg-gray-100 rounded"
                                title="View Details"
                              >
                                <Eye className="h-4 w-4 text-gray-600" />
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
              </div>
            </div>
          )}
          
          {/* Clients Tab */}
          {selectedTab === 'clients' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">Manage Clients</h2>
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setShowAddClientModal(true)}
                    className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 flex items-center gap-2"
                  >
                    <UserPlus className="h-4 w-4" />
                    Add Client
                  </button>
                  <button
                    onClick={() => exportData('clients')}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2"
                  >
                    <Download className="h-4 w-4" />
                    Export
                  </button>
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
                        onClick={() => viewDetails('client', client.id)}
                        className="flex-1 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-medium"
                      >
                        View Details
                      </button>
                      <button
                        onClick={() => toggleClientStatus(client.id, client.user?.is_active || false)}
                        className={`p-2 border border-gray-300 rounded-lg hover:bg-gray-50 ${
                          client.user?.is_active ? 'text-red-600' : 'text-green-600'
                        }`}
                        title={client.user?.is_active ? 'Deactivate' : 'Activate'}
                      >
                        {client.user?.is_active ? <UserMinus className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Consultations Tab */}
          {selectedTab === 'consultations' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">Consultations</h2>
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => exportData('consultations')}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2"
                  >
                    <Download className="h-4 w-4" />
                    Export
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
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => viewDetails('consultation', consultation.id)}
                              className="p-2 hover:bg-gray-100 rounded-lg"
                              title="View Details"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            {!['completed', 'cancelled'].includes(consultation.status) && (
                              <button
                                onClick={() => cancelConsultation(consultation.id)}
                                className="p-2 hover:bg-red-50 rounded-lg text-red-600"
                                title="Cancel Consultation"
                              >
                                <XCircle className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
          
          {/* Reports Tab */}
          {selectedTab === 'reports' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">Reports & Analytics</h2>
                <button
                  onClick={() => setShowGenerateReportModal(true)}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Generate Report
                </button>
              </div>
              
              <div className="bg-white rounded-xl shadow-sm border p-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Recent Reports</h3>
                    <div className="space-y-3">
                      {reports.slice(0, 5).map((report) => (
                        <div key={report.id} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg border">
                          <div>
                            <div className="font-medium">{report.name}</div>
                            <div className="text-sm text-gray-500">
                              {formatDate(report.period_start)} - {formatDate(report.period_end)}
                            </div>
                            <div className="text-xs text-gray-400">{report.report_type}</div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              report.status === 'generated'
                                ? 'bg-emerald-100 text-emerald-800'
                                : report.status === 'processing'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}>
                              {report.status}
                            </span>
                            {report.status === 'generated' && (
                              <button
                                onClick={() => downloadReport(report.id, report.name)}
                                className="p-1 hover:bg-gray-100 rounded"
                                title="Download Report"
                              >
                                <Download className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Report Types</h3>
                    <div className="space-y-4">
                      <div className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer">
                        <div className="flex items-center gap-3">
                          <BarChart3 className="h-5 w-5 text-emerald-600" />
                          <div>
                            <h4 className="font-medium">Revenue Report</h4>
                            <p className="text-sm text-gray-500">Daily revenue and trends</p>
                          </div>
                        </div>
                      </div>
                      <div className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer">
                        <div className="flex items-center gap-3">
                          <Users className="h-5 w-5 text-blue-600" />
                          <div>
                            <h4 className="font-medium">User Growth Report</h4>
                            <p className="text-sm text-gray-500">New users and growth metrics</p>
                          </div>
                        </div>
                      </div>
                      <div className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer">
                        <div className="flex items-center gap-3">
                          <UserCheck className="h-5 w-5 text-purple-600" />
                          <div>
                            <h4 className="font-medium">Professional Performance</h4>
                            <p className="text-sm text-gray-500">Professional earnings and ratings</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Add Professional Modal */}
      {showAddProfessionalModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900">Add New Professional</h3>
                <button
                  onClick={() => setShowAddProfessionalModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              <div className="space-y-6">
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">User Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Username *
                      </label>
                      <input
                        type="text"
                        value={newProfessionalData.user.username}
                        onChange={(e) => setNewProfessionalData({
                          ...newProfessionalData,
                          user: { ...newProfessionalData.user, username: e.target.value }
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email *
                      </label>
                      <input
                        type="email"
                        value={newProfessionalData.user.email}
                        onChange={(e) => setNewProfessionalData({
                          ...newProfessionalData,
                          user: { ...newProfessionalData.user, email: e.target.value }
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Password *
                      </label>
                      <input
                        type="password"
                        value={newProfessionalData.user.password}
                        onChange={(e) => setNewProfessionalData({
                          ...newProfessionalData,
                          user: { ...newProfessionalData.user, password: e.target.value }
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Phone
                      </label>
                      <input
                        type="tel"
                        value={newProfessionalData.user.phone}
                        onChange={(e) => setNewProfessionalData({
                          ...newProfessionalData,
                          user: { ...newProfessionalData.user, phone: e.target.value }
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        First Name
                      </label>
                      <input
                        type="text"
                        value={newProfessionalData.user.first_name}
                        onChange={(e) => setNewProfessionalData({
                          ...newProfessionalData,
                          user: { ...newProfessionalData.user, first_name: e.target.value }
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Last Name
                      </label>
                      <input
                        type="text"
                        value={newProfessionalData.user.last_name}
                        onChange={(e) => setNewProfessionalData({
                          ...newProfessionalData,
                          user: { ...newProfessionalData.user, last_name: e.target.value }
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      />
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Professional Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Hourly Rate (KES)
                      </label>
                      <input
                        type="number"
                        value={newProfessionalData.professional.hourly_rate}
                        onChange={(e) => setNewProfessionalData({
                          ...newProfessionalData,
                          professional: { ...newProfessionalData.professional, hourly_rate: parseFloat(e.target.value) }
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Experience (Years)
                      </label>
                      <input
                        type="number"
                        value={newProfessionalData.professional.experience_years}
                        onChange={(e) => setNewProfessionalData({
                          ...newProfessionalData,
                          professional: { ...newProfessionalData.professional, experience_years: parseInt(e.target.value) }
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Bio
                      </label>
                      <textarea
                        value={newProfessionalData.professional.bio}
                        onChange={(e) => setNewProfessionalData({
                          ...newProfessionalData,
                          professional: { ...newProfessionalData.professional, bio: e.target.value }
                        })}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        License Number
                      </label>
                      <input
                        type="text"
                        value={newProfessionalData.professional.license_number}
                        onChange={(e) => setNewProfessionalData({
                          ...newProfessionalData,
                          professional: { ...newProfessionalData.professional, license_number: e.target.value }
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      />
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-end gap-3 pt-4 border-t">
                  <button
                    onClick={() => setShowAddProfessionalModal(false)}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={addNewProfessional}
                    className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 flex items-center gap-2"
                  >
                    <Save className="h-4 w-4" />
                    Add Professional
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Add Client Modal */}
      {showAddClientModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900">Add New Client</h3>
                <button
                  onClick={() => setShowAddClientModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              <div className="space-y-6">
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">User Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Username *
                      </label>
                      <input
                        type="text"
                        value={newClientData.user.username}
                        onChange={(e) => setNewClientData({
                          ...newClientData,
                          user: { ...newClientData.user, username: e.target.value }
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email *
                      </label>
                      <input
                        type="email"
                        value={newClientData.user.email}
                        onChange={(e) => setNewClientData({
                          ...newClientData,
                          user: { ...newClientData.user, email: e.target.value }
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Password *
                      </label>
                      <input
                        type="password"
                        value={newClientData.user.password}
                        onChange={(e) => setNewClientData({
                          ...newClientData,
                          user: { ...newClientData.user, password: e.target.value }
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Phone
                      </label>
                      <input
                        type="tel"
                        value={newClientData.user.phone}
                        onChange={(e) => setNewClientData({
                          ...newClientData,
                          user: { ...newClientData.user, phone: e.target.value }
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        First Name
                      </label>
                      <input
                        type="text"
                        value={newClientData.user.first_name}
                        onChange={(e) => setNewClientData({
                          ...newClientData,
                          user: { ...newClientData.user, first_name: e.target.value }
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Last Name
                      </label>
                      <input
                        type="text"
                        value={newClientData.user.last_name}
                        onChange={(e) => setNewClientData({
                          ...newClientData,
                          user: { ...newClientData.user, last_name: e.target.value }
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      />
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Client Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Date of Birth
                      </label>
                      <input
                        type="date"
                        value={newClientData.client.date_of_birth}
                        onChange={(e) => setNewClientData({
                          ...newClientData,
                          client: { ...newClientData.client, date_of_birth: e.target.value }
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      />
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-end gap-3 pt-4 border-t">
                  <button
                    onClick={() => setShowAddClientModal(false)}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={addNewClient}
                    className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 flex items-center gap-2"
                  >
                    <Save className="h-4 w-4" />
                    Add Client
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Generate Report Modal */}
      {showGenerateReportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900">Generate Report</h3>
                <button
                  onClick={() => setShowGenerateReportModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Report Name
                  </label>
                  <input
                    type="text"
                    value={reportData.name}
                    onChange={(e) => setReportData({ ...reportData, name: e.target.value })}
                    placeholder="Monthly Revenue Report"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Report Type
                  </label>
                  <select
                    value={reportData.report_type}
                    onChange={(e) => setReportData({ ...reportData, report_type: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  >
                    <option value="revenue">Revenue Report</option>
                    <option value="users">User Growth Report</option>
                    <option value="consultations">Consultation Report</option>
                    <option value="professionals">Professional Performance</option>
                    <option value="clients">Client Retention</option>
                  </select>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Start Date
                    </label>
                    <input
                      type="date"
                      value={reportData.period_start}
                      onChange={(e) => setReportData({ ...reportData, period_start: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      End Date
                    </label>
                    <input
                      type="date"
                      value={reportData.period_end}
                      onChange={(e) => setReportData({ ...reportData, period_end: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Format
                  </label>
                  <select
                    value={reportData.format}
                    onChange={(e) => setReportData({ ...reportData, format: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  >
                    <option value="json">JSON</option>
                    <option value="csv">CSV</option>
                  </select>
                </div>
                
                <div className="flex justify-end gap-3 pt-4 border-t">
                  <button
                    onClick={() => setShowGenerateReportModal(false)}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={generateReport}
                    className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 flex items-center gap-2"
                  >
                    <BarChart3 className="h-4 w-4" />
                    Generate Report
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Detail View Modal */}
      {showDetailModal && selectedDetail && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900">
                  {detailType === 'professional' ? 'Professional Details' :
                   detailType === 'client' ? 'Client Details' :
                   'Consultation Details'}
                </h3>
                <button
                  onClick={() => {
                    setShowDetailModal(false);
                    setSelectedDetail(null);
                    setDetailType(null);
                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              <div className="space-y-6">
                {detailType === 'professional' && (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-medium text-gray-900 mb-3">Basic Information</h4>
                        <div className="space-y-3">
                          <div>
                            <span className="text-sm text-gray-500">Name:</span>
                            <p className="font-medium">{selectedDetail.user?.full_name || 'N/A'}</p>
                          </div>
                          <div>
                            <span className="text-sm text-gray-500">Email:</span>
                            <p className="font-medium">{selectedDetail.user?.email || 'N/A'}</p>
                          </div>
                          <div>
                            <span className="text-sm text-gray-500">Phone:</span>
                            <p className="font-medium">{selectedDetail.user?.phone || 'N/A'}</p>
                          </div>
                          <div>
                            <span className="text-sm text-gray-500">Status:</span>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              selectedDetail.user?.is_active
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {selectedDetail.user?.is_active ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="font-medium text-gray-900 mb-3">Professional Information</h4>
                        <div className="space-y-3">
                          <div>
                            <span className="text-sm text-gray-500">Hourly Rate:</span>
                            <p className="font-medium">{formatCurrency(selectedDetail.hourly_rate)}/hr</p>
                          </div>
                          <div>
                            <span className="text-sm text-gray-500">Experience:</span>
                            <p className="font-medium">{selectedDetail.experience_years} years</p>
                          </div>
                          <div>
                            <span className="text-sm text-gray-500">Rating:</span>
                            <p className="font-medium">{selectedDetail.rating}/5.0</p>
                          </div>
                          <div>
                            <span className="text-sm text-gray-500">Verification:</span>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              selectedDetail.is_verified
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}>
                              {selectedDetail.is_verified ? 'Verified' : 'Pending'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {selectedDetail.bio && (
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Bio</h4>
                        <p className="text-gray-600">{selectedDetail.bio}</p>
                      </div>
                    )}
                    
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Statistics</h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <span className="text-sm text-gray-500">Total Consultations</span>
                          <p className="text-2xl font-bold">{selectedDetail.total_consultations || 0}</p>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <span className="text-sm text-gray-500">Total Earnings</span>
                          <p className="text-2xl font-bold text-emerald-600">
                            {formatCurrency(selectedDetail.total_earnings || 0)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </>
                )}
                
                {detailType === 'client' && (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-medium text-gray-900 mb-3">Basic Information</h4>
                        <div className="space-y-3">
                          <div>
                            <span className="text-sm text-gray-500">Name:</span>
                            <p className="font-medium">{selectedDetail.user?.full_name || 'N/A'}</p>
                          </div>
                          <div>
                            <span className="text-sm text-gray-500">Email:</span>
                            <p className="font-medium">{selectedDetail.user?.email || 'N/A'}</p>
                          </div>
                          <div>
                            <span className="text-sm text-gray-500">Phone:</span>
                            <p className="font-medium">{selectedDetail.user?.phone || 'N/A'}</p>
                          </div>
                          <div>
                            <span className="text-sm text-gray-500">Status:</span>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              selectedDetail.user?.is_active
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {selectedDetail.user?.is_active ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="font-medium text-gray-900 mb-3">Client Statistics</h4>
                        <div className="space-y-3">
                          <div>
                            <span className="text-sm text-gray-500">Total Consultations:</span>
                            <p className="font-medium">{selectedDetail.total_consultations || 0}</p>
                          </div>
                          <div>
                            <span className="text-sm text-gray-500">Total Spent:</span>
                            <p className="font-medium text-emerald-600">
                              {formatCurrency(selectedDetail.total_spent || 0)}
                            </p>
                          </div>
                          <div>
                            <span className="text-sm text-gray-500">Last Activity:</span>
                            <p className="font-medium">
                              {selectedDetail.user?.last_login ? formatDate(selectedDetail.user.last_login) : 'Never'}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                )}
                
                {detailType === 'consultation' && (
                  <>
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">{selectedDetail.title}</h4>
                      <p className="text-gray-600 mb-4">{selectedDetail.description}</p>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-medium text-gray-900 mb-3">Details</h4>
                        <div className="space-y-3">
                          <div>
                            <span className="text-sm text-gray-500">Status:</span>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              getStatusColor(selectedDetail.status)
                            }`}>
                              {selectedDetail.status.replace('_', ' ')}
                            </span>
                          </div>
                          <div>
                            <span className="text-sm text-gray-500">Duration:</span>
                            <p className="font-medium">{selectedDetail.duration_minutes} minutes</p>
                          </div>
                          <div>
                            <span className="text-sm text-gray-500">Total Amount:</span>
                            <p className="font-medium text-emerald-600">
                              {formatCurrency(selectedDetail.total_amount)}
                            </p>
                          </div>
                          <div>
                            <span className="text-sm text-gray-500">Created:</span>
                            <p className="font-medium">{formatDate(selectedDetail.created_at)}</p>
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="font-medium text-gray-900 mb-3">Participants</h4>
                        <div className="space-y-3">
                          <div>
                            <span className="text-sm text-gray-500">Client:</span>
                            <p className="font-medium">{selectedDetail.client_name || 'N/A'}</p>
                          </div>
                          <div>
                            <span className="text-sm text-gray-500">Professional:</span>
                            <p className="font-medium">{selectedDetail.professional_name || 'N/A'}</p>
                          </div>
                          <div>
                            <span className="text-sm text-gray-500">Category:</span>
                            <p className="font-medium">{selectedDetail.category_name || 'N/A'}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
