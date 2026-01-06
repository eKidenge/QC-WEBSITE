import { ArrowRight, Smartphone } from 'lucide-react';
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
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
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
    'from-blue-500 to-blue-600',
    'from-pink-500 to-rose-600',
    'from-purple-500 to-purple-600',
    'from-emerald-500 to-teal-600',
    'from-orange-500 to-red-600',
    'from-indigo-500 to-purple-600',
    'from-cyan-500 to-blue-600',
    'from-lime-500 to-green-600'
  ];

  // Check authentication on component mount
  useEffect(() => {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    
    if (token && user) {
      setIsAuthenticated(true);
      console.log('User is authenticated, fetching categories...');
      fetchCategories();
    } else {
      setIsAuthenticated(false);
      setLoading(false);
      console.log('User not authenticated');
    }
  }, []);

  // Helper function to extract array from response
  const extractCategoriesArray = (data: any): ServiceCategory[] => {
    try {
      console.log('Extracting categories from:', {
        type: typeof data,
        isArray: Array.isArray(data),
        keys: data && typeof data === 'object' ? Object.keys(data) : []
      });

      // If it's already an array, return it
      if (Array.isArray(data)) {
        return data;
      }

      // If it's an object, check for common array properties
      if (data && typeof data === 'object') {
        const possibleArrayProps = ['results', 'categories', 'data', 'items', 'services'];
        
        for (const prop of possibleArrayProps) {
          if (Array.isArray(data[prop])) {
            console.log(`Found categories in property: ${prop}`);
            return data[prop];
          }
        }

        // If object has numeric keys or is a single category object
        const values = Object.values(data);
        if (values.length > 0) {
          // Check if first value is an object with id/name (likely a category)
          const firstValue = values[0];
          if (firstValue && typeof firstValue === 'object' && 
              ('id' in firstValue || 'name' in firstValue)) {
            return values as ServiceCategory[];
          }
        }
      }

      // If we can't find an array, return empty
      return [];
    } catch (err) {
      console.error('Error extracting categories:', err);
      return [];
    }
  };

  // Type guard for ServiceCategory
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
      
      // Get token from localStorage
      const token = localStorage.getItem('token');
      
      // Check if user is logged in
      if (!token) {
        setError('Please login to view service categories');
        setIsAuthenticated(false);
        setLoading(false);
        return;
      }
      
      console.log('Fetching categories with token:', token.substring(0, 10) + '...');
      
      const response = await fetch('https://dc-backend-6xlc.onrender.com/api/categories/categories/', {
        headers: {
          'Authorization': `Token ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });
      
      console.log('Response status:', response.status);
      
      if (!response.ok) {
        if (response.status === 401) {
          // Token expired or invalid
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setIsAuthenticated(false);
          setError('Your session has expired. Please login again.');
          navigate('/login');
          return;
        }
        throw new Error(`Failed to load categories. Status: ${response.status}`);
      }
      
      const responseData = await response.json();
      console.log('Raw API response:', responseData);
      
      // Extract categories array from response
      const categoriesArray = extractCategoriesArray(responseData);
      console.log('Extracted categories array:', categoriesArray);
      
      // Validate and filter categories
      const validCategories = categoriesArray
        .filter(isValidCategory)
        .filter(category => category.active !== false)
        .sort((a, b) => (a.order || 0) - (b.order || 0));
      
      console.log('Valid active categories:', validCategories);
      
      if (validCategories.length === 0) {
        console.warn('No valid active categories found in response');
        
        // Only use mock data if we got a successful response but no categories
        const mockCategories: ServiceCategory[] = [
          { 
            id: 1, 
            name: 'Legal Advice', 
            description: 'Connect with licensed lawyers',
            order: 1, 
            active: true,
            base_price: '600.00',
            commission_rate: '20.00',
            min_duration: 15,
            max_duration: 120,
            available_24_7: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          { 
            id: 2, 
            name: 'Mental Health', 
            description: 'Talk to professional psychologists',
            order: 2, 
            active: true,
            base_price: '600.00',
            commission_rate: '20.00',
            min_duration: 15,
            max_duration: 120,
            available_24_7: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          { 
            id: 3, 
            name: 'Career Guidance', 
            description: 'Get career advice from experts',
            order: 0, 
            active: true,
            base_price: '0.00',
            commission_rate: '20.00',
            min_duration: 15,
            max_duration: 120,
            available_24_7: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          { 
            id: 4, 
            name: 'Medical Help', 
            description: 'Consult with medical professionals',
            order: 5, 
            active: true,
            base_price: '600.00',
            commission_rate: '20.00',
            min_duration: 15,
            max_duration: 120,
            available_24_7: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        ];
        
        setCategories(mockCategories);
        setError('No active categories available. Showing demo services.');
      } else {
        setCategories(validCategories);
      }
      
    } catch (err: any) {
      console.error('Error fetching categories:', err);
      setError(err.message || 'Failed to load service categories');
      
      // Fallback to mock data on error
      const mockCategories: ServiceCategory[] = [
        { 
          id: 1, 
          name: 'Legal Advice', 
          description: 'Connect with licensed lawyers',
          order: 1, 
          active: true,
          base_price: '600.00',
          commission_rate: '20.00',
          min_duration: 15,
          max_duration: 120,
          available_24_7: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        { 
          id: 2, 
          name: 'Mental Health', 
          description: 'Talk to professional psychologists',
          order: 2, 
          active: true,
          base_price: '600.00',
          commission_rate: '20.00',
          min_duration: 15,
          max_duration: 120,
          available_24_7: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ];
      
      setCategories(mockCategories);
    } finally {
      setLoading(false);
    }
  };

  const handleServiceClick = (categoryId: number, categoryName: string, basePrice: number) => {
    // Check authentication before allowing service click
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
    
    // Set selected category and open matcher
    setSelectedCategory({
      id: categoryId,
      name: categoryName,
      base_price: basePrice
    });
    setShowMatcher(true);
  };

  const handleConnectNow = () => {
    // Check authentication
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

  const handleLoginRedirect = () => {
    navigate('/login');
  };

  const handleRetryFetch = () => {
    fetchCategories();
  };

  // Show only first 4 categories (or all if less than 4)
  const displayCategories = categories.slice(0, 4);

  return (
    <>
      <section className="pt-24 pb-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-emerald-50 to-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left side content */}
            <div className="space-y-8">
              <div className="inline-block px-4 py-2 bg-emerald-100 text-emerald-700 rounded-full text-sm font-semibold">
                Skip the search, get the answer
              </div>

              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-gray-900 leading-tight">
                Instant Access to
                <span className="text-emerald-600"> Verified Professionals</span>
              </h1>

              <p className="text-xl text-gray-600 leading-relaxed">
                Connect with licensed lawyers, doctors, psychologists, and career coaches in seconds.
                Get the expert help you need, when you need it.
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                {isAuthenticated ? (
                  <>
                    <button 
                      className="group px-8 py-4 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-all font-semibold text-lg flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
                      onClick={handleConnectNow}
                    >
                      Connect Now
                      <ArrowRight className="group-hover:translate-x-1 transition-transform" size={20} />
                    </button>
                    <button className="px-8 py-4 bg-white text-gray-900 border-2 border-gray-200 rounded-xl hover:border-emerald-600 hover:text-emerald-600 transition-all font-semibold text-lg">
                      Learn More
                    </button>
                  </>
                ) : (
                  <button 
                    className="group px-8 py-4 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-all font-semibold text-lg flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
                    onClick={handleLoginRedirect}
                  >
                    Login to Get Started
                    <ArrowRight className="group-hover:translate-x-1 transition-transform" size={20} />
                  </button>
                )}
              </div>

              <div className="flex items-center gap-8 pt-4">
                <div>
                  <div className="text-3xl font-bold text-gray-900">500+</div>
                  <div className="text-gray-600">Verified Professionals</div>
                </div>
                <div className="w-px h-12 bg-gray-300"></div>
                <div>
                  <div className="text-3xl font-bold text-gray-900">&lt;2 min</div>
                  <div className="text-gray-600">Average Connection</div>
                </div>
                <div className="w-px h-12 bg-gray-300"></div>
                <div>
                  <div className="text-3xl font-bold text-gray-900">24/7</div>
                  <div className="text-gray-600">Available</div>
                </div>
              </div>
            </div>

            {/* Right side - Categories */}
            <div className="relative">
              <div className="relative z-10 mx-auto max-w-sm">
                <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-3xl p-8 shadow-2xl">
                  <div className="bg-white rounded-2xl p-6 space-y-4">
                    <div className="flex items-center justify-center mb-6">
                      <Smartphone className="text-emerald-600" size={48} />
                    </div>
                    <h3 className="text-center text-xl font-bold text-gray-900">
                      {isAuthenticated ? 'Choose Your Expert' : 'Login to View Services'}
                    </h3>
                    
                    {!isAuthenticated ? (
                      <div className="text-center py-8">
                        <p className="text-gray-600 mb-4">Please login to view available services</p>
                        <button 
                          onClick={handleLoginRedirect}
                          className="px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-medium"
                        >
                          Go to Login
                        </button>
                      </div>
                    ) : loading ? (
                      <div className="text-center py-8">
                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
                        <p className="mt-2 text-gray-600">Loading categories...</p>
                      </div>
                    ) : error ? (
                      <div className="text-center py-8">
                        <p className="text-red-600 mb-2">API Error</p>
                        <p className="text-gray-600 text-sm mb-4">{error}</p>
                        <button 
                          onClick={handleRetryFetch}
                          className="mt-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
                        >
                          Retry
                        </button>
                      </div>
                    ) : displayCategories.length === 0 ? (
                      <div className="text-center py-8">
                        <p className="text-gray-600">No service categories available</p>
                        <button 
                          onClick={handleRetryFetch}
                          className="mt-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
                        >
                          Refresh
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="grid grid-cols-2 gap-3">
                          {displayCategories.map((service, index) => (
                            <div
                              key={service.id}
                              className={`bg-gradient-to-br ${
                                colorClasses[index % colorClasses.length]
                              } text-white p-4 rounded-xl text-center font-semibold text-sm hover:scale-105 transition-transform cursor-pointer`}
                              onClick={() => handleServiceClick(
                                service.id, 
                                service.name, 
                                parseFloat(service.base_price)
                              )}
                              title={service.description || service.name}
                            >
                              {service.name}
                            </div>
                          ))}
                        </div>
                        <p className="text-center text-xs text-gray-500 mt-4">
                          {error ? '(Showing demo services)' : ''}
                        </p>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="absolute top-10 -right-10 w-72 h-72 bg-emerald-200 rounded-full blur-3xl opacity-30"></div>
              <div className="absolute -bottom-10 -left-10 w-72 h-72 bg-teal-200 rounded-full blur-3xl opacity-30"></div>
            </div>
          </div>
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
