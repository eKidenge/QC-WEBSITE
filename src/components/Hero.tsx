import { ArrowRight, Smartphone, Shield, Clock, Award } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
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

export default function Hero() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
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

  const colorClasses = [
    'from-pink-500 to-rose-600',
    'from-pink-500 to-rose-600',
    'from-pink-500 to-rose-600',
    'from-pink-500 to-rose-600',
    'from-pink-500 to-rose-600',
    'from-pink-500 to-rose-600',
    'from-pink-500 to-rose-600',
    'from-pink-500 to-rose-600'
  ];

  useEffect(() => {
    fetchCategories();
  }, []);

  const extractCategoriesArray = (data: any): ServiceCategory[] => {
    try {
      if (Array.isArray(data)) {
        return data;
      }

      if (data && typeof data === 'object') {
        const possibleArrayProps = ['results', 'categories', 'data', 'items', 'services'];
        
        for (const prop of possibleArrayProps) {
          if (Array.isArray(data[prop])) {
            return data[prop];
          }
        }

        const values = Object.values(data);
        if (values.length > 0) {
          const firstValue = values[0];
          if (firstValue && typeof firstValue === 'object' && 
              ('id' in firstValue || 'name' in firstValue)) {
            return values as ServiceCategory[];
          }
        }
      }

      return [];
    } catch (err) {
      console.error('Error extracting categories:', err);
      return [];
    }
  };

  const isValidCategory = (item: any): item is ServiceCategory => {
    return item && 
           typeof item === 'object' &&
           typeof item.id === 'number' &&
           typeof item.name === 'string';
  };

  const fetchCategories = async () => {
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
      
      const response = await fetch('https://dc-backend-6xlc.onrender.com/api/categories/categories/', {
        headers
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          setCategories([]);
          setLoading(false);
          return;
        }
        throw new Error(`Failed to load categories. Status: ${response.status}`);
      }
      
      const responseData = await response.json();
      const categoriesArray = extractCategoriesArray(responseData);
      
      const validCategories = categoriesArray
        .filter(isValidCategory)
        .filter(category => category.active !== false)
        .sort((a, b) => (a.order || 0) - (b.order || 0));
      
      setCategories(validCategories);
      
    } catch (err: any) {
      console.error('Error fetching categories:', err);
      setError(err.message || 'Failed to load service categories');
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  const handleServiceClick = (categoryId: number, categoryName: string, basePrice: number) => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
    
    setSelectedCategory({
      id: categoryId,
      name: categoryName,
      base_price: basePrice
    });
    setShowMatcher(true);
  };

  const handleConnectNow = () => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
    
    if (categories.length > 0) {
      const firstCategory = categories[0];
      setSelectedCategory({
        id: firstCategory.id,
        name: firstCategory.name,
        base_price: parseFloat(firstCategory.base_price)
      });
      setShowMatcher(true);
    }
  };

  const handlePaymentRequired = (details: PaymentDetails) => {
    setPaymentDetails(details);
    setShowMatcher(false);
    setShowPayment(true);
  };

  const handlePaymentSuccess = (transactionId: string) => {
    if (paymentDetails) {
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

  const handleLoginRedirect = () => {
    navigate('/login');
  };

  const handleRetryFetch = () => {
    fetchCategories();
  };

  const displayCategories = categories.slice(0, 4);

  return (
    <>
      <section className="min-h-screen bg-gradient-to-br from-[#0B1120] to-[#1a2639] relative overflow-hidden pt-24">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 w-72 h-72 bg-pink-500 rounded-full filter blur-3xl"></div>
          <div className="absolute bottom-20 right-10 w-72 h-72 bg-rose-500 rounded-full filter blur-3xl"></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-start">
            {/* Left side - Main Content */}
            <div className="space-y-6">
              {/* All badges removed */}

              <h1 className="text-5xl lg:text-6xl font-bold text-white leading-tight">
                Your Expert Support, Just a Click Away
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-rose-400 block">
                  Just a Click Away
                </span>
              </h1>

              <p className="text-xl text-gray-300 leading-relaxed max-w-lg">
                Skip the waiting rooms. Get instant access to verified experts across different professional domains. Private, secure, and available 24/7.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 pt-2">
                <button 
                  className="group px-8 py-4 bg-pink-500 text-white rounded-xl hover:bg-pink-600 transition-all font-semibold text-lg flex items-center justify-center gap-2 shadow-lg shadow-pink-500/25"
                  onClick={handleConnectNow}
                >
                  Speak to a Verified Expert Now
                  <ArrowRight className="group-hover:translate-x-1 transition-transform" size={20} />
                </button>
                <button className="px-8 py-4 bg-white/10 text-white border-2 border-white/20 rounded-xl hover:bg-white/20 transition-all font-semibold text-lg backdrop-blur-sm">
                  Explore Verified Experts
                </button>
              </div>

              <div className="pt-4">
                <h3 className="text-white text-lg font-semibold mb-3">Our Specialized Support</h3>
                <div className="grid grid-cols-2 gap-3 max-w-md">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-gray-300">
                      <div className="w-1.5 h-1.5 bg-pink-400 rounded-full"></div>
                      <span>Personal Counselling</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-300">
                      <div className="w-1.5 h-1.5 bg-pink-400 rounded-full"></div>
                      <span>Relationship Support</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-gray-300">
                      <div className="w-1.5 h-1.5 bg-pink-400 rounded-full"></div>
                      <span>Career Wellness</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-300">
                      <div className="w-1.5 h-1.5 bg-pink-400 rounded-full"></div>
                      <span>Youth & Student Support</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-2 flex items-center gap-6">
                <div className="flex items-center gap-2 text-pink-400">
                  <Shield size={18} />
                  <span className="text-sm text-gray-300">Verified Experts</span>
                </div>
                <div className="flex items-center gap-2 text-pink-400">
                  <Clock size={18} />
                  <span className="text-sm text-gray-300">24/7 Available</span>
                </div>
                <div className="flex items-center gap-2 text-pink-400">
                  <Award size={18} />
                  <span className="text-sm text-gray-300">Licensed</span>
                </div>
              </div>
            </div>

            {/* Right side - Mobile App Card */}
            <div className="relative lg:mt-0 mt-12">
              <div className="bg-[#1E293B] rounded-[2rem] p-6 shadow-2xl border border-white/10 max-w-sm mx-auto">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 bg-gradient-to-br from-pink-400 to-rose-500 rounded-xl flex items-center justify-center">
                      <span className="text-white font-bold text-xl">Q</span>
                    </div>
                    <span className="text-white font-semibold">QINEX</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center">
                      <Smartphone size={16} className="text-white" />
                    </div>
                    <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center">
                      <span className="text-white text-xs">⌂</span>
                    </div>
                  </div>
                </div>

                <div className="bg-[#0F172A] rounded-xl p-4 mb-4">
                  <h4 className="text-white text-sm font-medium mb-3">Services</h4>
                  
                  {loading ? (
                    <div className="text-center py-8">
                      <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-pink-500 border-t-transparent"></div>
                      <p className="mt-2 text-gray-400">Loading categories...</p>
                    </div>
                  ) : error ? (
                    <div className="text-center py-8">
                      <p className="text-red-400 mb-2">Error loading services</p>
                      <p className="text-gray-400 text-sm mb-4">{error}</p>
                      <button 
                        onClick={handleRetryFetch}
                        className="px-4 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600"
                      >
                        Retry
                      </button>
                    </div>
                  ) : displayCategories.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-gray-400">No services available</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-2">
                      {displayCategories.map((service, index) => (
                        <div
                          key={service.id}
                          className={`bg-gradient-to-br ${
                            colorClasses[index % colorClasses.length]
                          } text-white p-3 rounded-lg text-center text-sm font-medium hover:scale-105 transition-transform cursor-pointer`}
                          onClick={() => handleServiceClick(
                            service.id, 
                            service.name, 
                            parseFloat(service.base_price)
                          )}
                        >
                          {service.name}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="bg-[#0F172A] rounded-xl p-4">
                  <h4 className="text-white text-sm font-medium mb-3">Why Trust QINEX?</h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-400">Verified Expertise</span>
                      <span className="text-pink-400">✓</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-400">Full Anonymity</span>
                      <span className="text-pink-400">✓</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-400">HIPAA Integrated</span>
                      <span className="text-pink-400">✓</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-400">MISA Integrated</span>
                      <span className="text-pink-400">✓</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between text-xs text-gray-500">
                  <span>How it Works</span>
                  <span>Services</span>
                  <span>Company</span>
                  <span>Contact</span>
                </div>

                <div className="mt-2 flex items-center justify-between text-xs text-gray-600">
                  <span>Privacy Policy</span>
                  <span>Tele-health Consent</span>
                </div>

                <div className="mt-4 text-center">
                  <p className="text-xs text-gray-600">info@qinex.com</p>
                  <p className="text-xs text-gray-600 mt-1">QINEX • KENYA</p>
                  <p className="text-xs text-gray-700 mt-2 font-mono">QNY7936747691</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {showMatcher && selectedCategory && (
        <ConsultationMatcher
          categoryId={selectedCategory.id}
          categoryName={selectedCategory.name}
          basePrice={selectedCategory.base_price}
          onClose={() => setShowMatcher(false)}
          onPaymentRequired={handlePaymentRequired}
        />
      )}

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