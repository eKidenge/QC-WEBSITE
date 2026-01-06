import { Scale, HeartPulse, GraduationCap, Stethoscope, ArrowRight } from 'lucide-react';
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

// Default icons for different category types
const categoryIcons: Record<string, any> = {
  'Legal': Scale,
  'Legal Advice': Scale,
  'Law': Scale,
  'Mental Health': HeartPulse,
  'Psychology': HeartPulse,
  'Counseling': HeartPulse,
  'Career': GraduationCap,
  'Career Guidance': GraduationCap,
  'Education': GraduationCap,
  'Medical': Stethoscope,
  'Medical Help': Stethoscope,
  'Health': Stethoscope,
  'Doctor': Stethoscope
};

// Default descriptions for categories
const defaultDescriptions: Record<string, string> = {
  'Legal': 'Connect with licensed lawyers for urgent legal matters, disputes, contracts, and more.',
  'Legal Advice': 'Connect with licensed lawyers for urgent legal matters, disputes, contracts, and more.',
  'Mental Health': 'Access certified psychologists and counselors for confidential support anytime.',
  'Career Guidance': 'Get expert advice on career paths, academic choices, and professional development.',
  'Medical': 'Consult with verified doctors for non-emergency medical issues and health questions.',
  'Medical Help': 'Consult with verified doctors for non-emergency medical issues and health questions.',
  'default': 'Connect with verified professionals for expert advice and support.'
};

// Color schemes for different categories
const colorSchemes: Record<string, any> = {
  'Legal': {
    color: 'from-blue-500 to-blue-600',
    bgColor: 'bg-blue-50',
    iconColor: 'text-blue-600'
  },
  'Legal Advice': {
    color: 'from-blue-500 to-blue-600',
    bgColor: 'bg-blue-50',
    iconColor: 'text-blue-600'
  },
  'Mental Health': {
    color: 'from-pink-500 to-rose-600',
    bgColor: 'bg-pink-50',
    iconColor: 'text-pink-600'
  },
  'Career Guidance': {
    color: 'from-purple-500 to-purple-600',
    bgColor: 'bg-purple-50',
    iconColor: 'text-purple-600'
  },
  'Medical': {
    color: 'from-emerald-500 to-teal-600',
    bgColor: 'bg-emerald-50',
    iconColor: 'text-emerald-600'
  },
  'Medical Help': {
    color: 'from-emerald-500 to-teal-600',
    bgColor: 'bg-emerald-50',
    iconColor: 'text-emerald-600'
  },
  'default': {
    color: 'from-indigo-500 to-purple-600',
    bgColor: 'bg-indigo-50',
    iconColor: 'text-indigo-600'
  }
};

export default function Services() {
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

  // Fetch categories on component mount
  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('token');
      
      // If no token, we'll still show the component but with login prompt
      if (!token) {
        setLoading(false);
        return;
      }
      
      console.log('Fetching categories for services...');
      
      const response = await fetch('https://dc-backend-6xlc.onrender.com/api/categories/categories/', {
        headers: {
          'Authorization': `Token ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          console.log('Unauthorized - user needs to login');
          setLoading(false);
          return;
        }
        throw new Error(`Failed to load categories. Status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Services categories data received:', data);
      
      // Handle different API response formats
      let categoriesData: ServiceCategory[] = [];
      
      if (Array.isArray(data)) {
        categoriesData = data;
      } else if (data && typeof data === 'object') {
        // Handle various response structures
        if (Array.isArray(data.results)) {
          categoriesData = data.results;
        } else if (Array.isArray(data.categories)) {
          categoriesData = data.categories;
        } else if (Array.isArray(data.data)) {
          categoriesData = data.data;
        } else {
          // If it's an object, try to convert to array
          const values = Object.values(data);
          if (values.length > 0 && typeof values[0] === 'object') {
            categoriesData = values as ServiceCategory[];
          }
        }
      }
      
      // Filter active categories and sort by order
      const activeCategories = categoriesData
        .filter(category => category.active !== false)
        .sort((a, b) => (a.order || 0) - (b.order || 0))
        .slice(0, 4); // Only take first 4 for display
      
      setCategories(activeCategories);
      
    } catch (err: any) {
      console.error('Error fetching categories for services:', err);
      setError(err.message || 'Failed to load service categories');
      
      // Fallback to default services if API fails
      setCategories([
        { 
          id: 1, 
          name: 'Legal Advice', 
          description: 'Connect with licensed lawyers for urgent legal matters, disputes, contracts, and more.',
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
          description: 'Access certified psychologists and counselors for confidential support anytime.',
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
          description: 'Get expert advice on career paths, academic choices, and professional development.',
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
          description: 'Consult with verified doctors for non-emergency medical issues and health questions.',
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
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleServiceClick = (categoryId: number, categoryName: string) => {
    // Check authentication
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
    
    // Find the base price from your categories
    const service = categories.find(cat => cat.id === categoryId);
    const basePrice = service ? parseFloat(service.base_price) : 600.00;
    
    // Open matcher modal
    setSelectedCategory({
      id: categoryId,
      name: categoryName,
      base_price: basePrice
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
    fetchCategories();
  };

  // Get icon for category
  const getIconForCategory = (categoryName: string) => {
    const iconKey = Object.keys(categoryIcons).find(key => 
      categoryName.toLowerCase().includes(key.toLowerCase())
    );
    return iconKey ? categoryIcons[iconKey] : GraduationCap;
  };

  // Get color scheme for category
  const getColorScheme = (categoryName: string) => {
    const schemeKey = Object.keys(colorSchemes).find(key => 
      categoryName.toLowerCase().includes(key.toLowerCase())
    );
    return schemeKey ? colorSchemes[schemeKey] : colorSchemes.default;
  };

  // Get description for category
  const getDescription = (categoryName: string, customDescription?: string) => {
    if (customDescription) return customDescription;
    
    const descKey = Object.keys(defaultDescriptions).find(key => 
      categoryName.toLowerCase().includes(key.toLowerCase())
    );
    return descKey ? defaultDescriptions[descKey] : defaultDescriptions.default;
  };

  // Display services - either from backend or default
  const displayServices = categories.length > 0 ? categories : [
    {
      id: 1,
      name: 'Legal Advice',
      description: 'Connect with licensed lawyers for urgent legal matters, disputes, contracts, and more.'
    },
    {
      id: 2,
      name: 'Mental Health',
      description: 'Access certified psychologists and counselors for confidential support anytime.'
    },
    {
      id: 3,
      name: 'Career Guidance',
      description: 'Get expert advice on career paths, academic choices, and professional development.'
    },
    {
      id: 4,
      name: 'Medical Help',
      description: 'Consult with verified doctors for non-emergency medical issues and health questions.'
    }
  ];

  return (
    <>
      <section id="services" className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
              Professional Help, Instantly
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Access verified experts across multiple categories. No searching, no waiting.
            </p>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
              <p className="mt-4 text-gray-600">Loading services...</p>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-red-600 mb-4">{error}</p>
              <button 
                onClick={handleRetry}
                className="px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-medium"
              >
                Retry Loading Services
              </button>
              <div className="mt-8">
                <p className="text-gray-500 text-sm mb-4">Showing default services</p>
              </div>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {displayServices.map((service) => {
                const IconComponent = getIconForCategory(service.name);
                const colors = getColorScheme(service.name);
                const description = getDescription(service.name, service.description);
                
                return (
                  <div
                    key={service.id || service.name}
                    className="group relative bg-white rounded-2xl border-2 border-gray-100 p-6 hover:border-transparent hover:shadow-xl transition-all duration-300 cursor-pointer"
                    onClick={() => handleServiceClick(service.id, service.name)}
                  >
                    <div className={`absolute inset-0 bg-gradient-to-br ${colors.color} opacity-0 group-hover:opacity-5 rounded-2xl transition-opacity`}></div>

                    <div className={`${colors.bgColor} w-14 h-14 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                      <IconComponent className={colors.iconColor} size={28} />
                    </div>

                    <h3 className="text-xl font-bold text-gray-900 mb-3">{service.name}</h3>
                    <p className="text-gray-600 leading-relaxed">{description}</p>

                    <button className={`mt-6 text-sm font-semibold ${colors.iconColor} group-hover:gap-2 flex items-center transition-all`}>
                      Connect Now
                      <ArrowRight className="ml-1 group-hover:translate-x-1 transition-transform" size={16} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {!loading && !error && categories.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-600 mb-4">No active services available. Please check back later.</p>
              <button 
                onClick={handleRetry}
                className="px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-medium"
              >
                Refresh Services
              </button>
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
