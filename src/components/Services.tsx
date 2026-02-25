import { HeartPulse, ArrowRight, Clock, Shield, Award, Users, Star } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ConsultationMatcher from './ConsultationMatcher';

interface ServiceCategory {
  id: number;
  name: string;
  description?: string;
  icon?: string;
  active: boolean;
  order: number;
  base_price: string;
  commission_rate: string;
  min_duration: number;
  max_duration: number;
  available_24_7: boolean;
  created_at: string;
  updated_at: string;
}

interface PaymentDetails {
  consultationId: number;
  professionalId: number;
  amount: number;
  professionalName: string;
  categoryName: string;
}

export default function Services() {
  const navigate = useNavigate();
  const [category, setCategory] = useState<ServiceCategory | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Matching system states
  const [selectedCategory, setSelectedCategory] = useState<{
    id: number;
    name: string;
    base_price: number;
  } | null>(null);
  const [showMatcher, setShowMatcher] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [paymentDetails, setPaymentDetails] = useState<PaymentDetails | null>(null);

  // Fetch categories on component mount
  useEffect(() => {
    fetchSingleCategory();
  }, []);

  const fetchSingleCategory = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('token');
      
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      };
      
      if (token) {
        headers['Authorization'] = `Token ${token}`;
      }
      
      console.log('Fetching mental health category...');
      
      const response = await fetch('https://dc-backend-6xlc.onrender.com/api/categories/categories/', {
        headers
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          console.log('Unauthorized - showing empty');
          setCategory(null);
          setLoading(false);
          return;
        }
        throw new Error(`Failed to load. Status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Categories data received:', data);
      
      // Handle different API response formats
      let categoriesData: ServiceCategory[] = [];
      
      if (Array.isArray(data)) {
        categoriesData = data;
      } else if (data && typeof data === 'object') {
        if (Array.isArray(data.results)) {
          categoriesData = data.results;
        } else if (Array.isArray(data.categories)) {
          categoriesData = data.categories;
        } else if (Array.isArray(data.data)) {
          categoriesData = data.data;
        } else {
          const values = Object.values(data);
          if (values.length > 0 && typeof values[0] === 'object') {
            categoriesData = values as ServiceCategory[];
          }
        }
      }
      
      // Filter active categories and find Mental Health
      const mentalHealthCategory = categoriesData
        .filter(cat => cat.active !== false)
        .find(cat => 
          cat.name.toLowerCase().includes('mental') || 
          cat.name.toLowerCase().includes('health') ||
          cat.name.toLowerCase().includes('psychology') ||
          cat.name.toLowerCase().includes('counseling')
        );
      
      setCategory(mentalHealthCategory || null);
      
    } catch (err: any) {
      console.error('Error fetching category:', err);
      setError(err.message || 'Failed to load service');
      setCategory(null);
    } finally {
      setLoading(false);
    }
  };

  const handleServiceClick = () => {
    if (!category) return;
    
    // Check authentication before allowing consultation
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
    
    // Open matcher modal
    setSelectedCategory({
      id: category.id,
      name: category.name,
      base_price: parseFloat(category.base_price)
    });
    setShowMatcher(true);
  };

  const handlePaymentRequired = (details: PaymentDetails) => {
    setPaymentDetails(details);
    setShowMatcher(false);
    setShowPayment(true);
  };

  const handlePaymentSuccess = (transactionId: string) => {
    if (paymentDetails) {
      // Navigate to call page with all required data
      navigate('/call', {
        state: {
          consultationId: paymentDetails.consultationId,
          professionalId: paymentDetails.professionalId,
          transactionId: transactionId,
          categoryName: paymentDetails.categoryName,
          professionalName: paymentDetails.professionalName
        }
      });
    }
    setShowPayment(false);
  };

  const handleRetry = () => {
    fetchSingleCategory();
  };

  // Format price
  const formatPrice = (price: string) => {
    const numPrice = parseFloat(price);
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(numPrice);
  };

  return (
    <>
      <section id="services" className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-[#0B1120] to-[#1a2639] relative overflow-hidden min-h-screen flex items-center">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 w-96 h-96 bg-pink-500 rounded-full filter blur-3xl"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-rose-500 rounded-full filter blur-3xl"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-500 rounded-full filter blur-3xl opacity-50"></div>
        </div>

        <div className="max-w-6xl mx-auto relative z-10 w-full">
          <div className="text-center mb-12">
            <span className="inline-block px-4 py-2 bg-pink-500/20 text-pink-400 rounded-full text-sm font-medium border border-pink-500/30 mb-4">
              Our Service
            </span>
            <h2 className="text-4xl sm:text-5xl font-bold text-white mb-4">
              Professional Mental Health Support,
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-rose-400 block">
                When You Need It Most
              </span>
            </h2>
          </div>

          {loading ? (
            <div className="text-center py-20">
              <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-pink-500 border-t-transparent"></div>
              <p className="mt-6 text-xl text-gray-400">Loading mental health services...</p>
            </div>
          ) : error ? (
            <div className="text-center py-16 bg-white/5 backdrop-blur-sm rounded-3xl border border-white/10 max-w-2xl mx-auto">
              <p className="text-red-400 mb-4 text-lg">{error}</p>
              <button 
                onClick={handleRetry}
                className="px-8 py-4 bg-pink-500 text-white rounded-xl hover:bg-pink-600 font-medium text-lg shadow-lg shadow-pink-500/25"
              >
                Retry Loading
              </button>
            </div>
          ) : !category ? (
            <div className="text-center py-16 bg-white/5 backdrop-blur-sm rounded-3xl border border-white/10 max-w-2xl mx-auto">
              <HeartPulse size={64} className="text-pink-400 mx-auto mb-6" />
              <p className="text-gray-300 text-xl mb-6">Mental health services coming soon.</p>
              <button 
                onClick={handleRetry}
                className="px-8 py-4 bg-pink-500 text-white rounded-xl hover:bg-pink-600 font-medium text-lg shadow-lg shadow-pink-500/25"
              >
                Check Again
              </button>
            </div>
          ) : (
            <div className="max-w-4xl mx-auto">
              {/* Main Service Card */}
              <div className="bg-gradient-to-br from-[#1E293B] to-[#2d3a4f] rounded-3xl border border-white/10 p-8 md:p-12 shadow-2xl backdrop-blur-sm">
                <div className="flex flex-col md:flex-row gap-8 items-start">
                  {/* Left Column - Icon and Stats */}
                  <div className="md:w-1/3">
                    <div className="bg-gradient-to-br from-pink-500 to-rose-600 w-28 h-28 rounded-3xl flex items-center justify-center mb-6 shadow-xl shadow-pink-500/30">
                      <HeartPulse size={56} className="text-white" />
                    </div>
                    
                    <div className="space-y-4">
                      <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                        <div className="text-pink-400 text-sm mb-1">Session Price</div>
                        <div className="text-3xl font-bold text-white">{formatPrice(category.base_price)}</div>
                        <div className="text-gray-400 text-sm mt-1">per session</div>
                      </div>
                      
                      <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                        <div className="flex items-center gap-2 text-gray-300 mb-2">
                          <Clock size={18} className="text-pink-400" />
                          <span>Duration: {category.min_duration}-{category.max_duration} min</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-300">
                          <Shield size={18} className="text-pink-400" />
                          <span>Licensed Therapists</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Column - Details */}
                  <div className="md:w-2/3">
                    <h3 className="text-4xl font-bold text-white mb-4">{category.name}</h3>
                    
                    <p className="text-xl text-gray-300 leading-relaxed mb-8">
                      {category.description || 'Connect with licensed mental health professionals for confidential support, therapy sessions, and emotional wellness guidance. Available 24/7 for when you need someone to talk to.'}
                    </p>

                    {/* Features Grid */}
                    <div className="grid grid-cols-2 gap-4 mb-8">
                      <div className="flex items-center gap-3 text-gray-300 bg-white/5 rounded-xl p-3">
                        <Users className="text-pink-400" size={20} />
                        <span>Licensed Experts</span>
                      </div>
                      <div className="flex items-center gap-3 text-gray-300 bg-white/5 rounded-xl p-3">
                        <Clock className="text-pink-400" size={20} />
                        <span>24/7 Available</span>
                      </div>
                      <div className="flex items-center gap-3 text-gray-300 bg-white/5 rounded-xl p-3">
                        <Shield className="text-pink-400" size={20} />
                        <span>100% Confidential</span>
                      </div>
                      <div className="flex items-center gap-3 text-gray-300 bg-white/5 rounded-xl p-3">
                        <Star className="text-pink-400" size={20} />
                        <span>Verified Professionals</span>
                      </div>
                    </div>

                    {/* CTA Buttons */}
                    <div className="flex flex-col sm:flex-row gap-4">
                      <button 
                        className="flex-1 group px-8 py-5 bg-gradient-to-r from-pink-500 to-rose-600 text-white rounded-xl hover:from-pink-600 hover:to-rose-700 transition-all font-semibold text-lg flex items-center justify-center gap-2 shadow-xl shadow-pink-500/30"
                        onClick={handleServiceClick}
                      >
                        Start Session Now
                        <ArrowRight className="group-hover:translate-x-1 transition-transform" size={20} />
                      </button>
                      <button className="flex-1 px-8 py-5 bg-white/10 text-white border-2 border-white/20 rounded-xl hover:bg-white/20 transition-all font-semibold text-lg backdrop-blur-sm">
                        Learn More
                      </button>
                    </div>

                    {/* Trust Indicators */}
                    <div className="mt-8 pt-6 border-t border-white/10">
                      <div className="flex flex-wrap items-center justify-between gap-4">
                        <div className="flex items-center gap-2">
                          <Award className="text-pink-400" size={20} />
                          <span className="text-sm text-gray-400">Licensed & Verified</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Shield className="text-pink-400" size={20} />
                          <span className="text-sm text-gray-400">HIPAA Compliant</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Users className="text-pink-400" size={20} />
                          <span className="text-sm text-gray-400">100+ Therapists</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Additional Info Cards */}
              <div className="grid md:grid-cols-3 gap-6 mt-8">
                <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
                  <h4 className="text-white font-semibold mb-2">How It Works</h4>
                  <p className="text-gray-400 text-sm">Connect with a therapist in minutes. No appointments needed.</p>
                </div>
                <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
                  <h4 className="text-white font-semibold mb-2">Secure Payments</h4>
                  <p className="text-gray-400 text-sm">Pay securely per session. No subscriptions or hidden fees.</p>
                </div>
                <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
                  <h4 className="text-white font-semibold mb-2">Any Device</h4>
                  <p className="text-gray-400 text-sm">Access from your phone, tablet, or computer. Wherever you are.</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Consultation Matcher Modal */}
      {showMatcher && selectedCategory && (
        <ConsultationMatcher
          categoryId={selectedCategory.id}
          categoryName={selectedCategory.name}
          basePrice={selectedCategory.base_price}
          onClose={() => setShowMatcher(false)}
          onPaymentRequired={handlePaymentRequired}
        />
      )}

      {/* Payment Modal */}
      {showPayment && paymentDetails && (
        <PaymentModal
          isOpen={showPayment}
          onClose={() => setShowPayment(false)}
          paymentDetails={paymentDetails}
          onPaymentSuccess={handlePaymentSuccess}
        />
      )}
    </>
  );
}