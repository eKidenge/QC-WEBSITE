import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Loader2, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Users, 
  Zap,
  Shield,
  Star,
  Award,
  Timer
} from 'lucide-react';

interface Professional {
  id: number;
  name: string;
  title: string;
  rating: number;
  experience_years: number;
  hourly_rate: number;
  languages: string[];
  bio: string;
  ai_score: number;
  user?: {
    get_full_name?: string;
  };
}

interface ConsultationMatcherProps {
  categoryId: number;
  categoryName: string;
  basePrice: number;
  onClose?: () => void;
  onPaymentRequired?: (details: {
    consultationId: number;
    professionalId: number;
    amount: number;
    professionalName: string;
    categoryName: string;
  }) => void;
}

export default function ConsultationMatcher({ 
  categoryId, 
  categoryName, 
  basePrice,
  onClose,
  onPaymentRequired 
}: ConsultationMatcherProps) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [matchResult, setMatchResult] = useState<any>(null);
  const [matchStage, setMatchStage] = useState<'initial' | 'searching' | 'found' | 'not_found' | 'payment'>('initial');
  const [consultationId, setConsultationId] = useState<number | null>(null);

  const startMatching = async () => {
    try {
      setLoading(true);
      setError(null);
      setMatchStage('searching');
      
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      console.log('🔄 [FRONTEND] Starting matching for category:', categoryId, categoryName);
      
      // Step 1: Create the consultation WITHOUT hardcoded pricing
      const createResponse = await fetch('https://dc-backend-6xlc.onrender.com/api/categories/consultations/', {
        method: 'POST',
        headers: {
          'Authorization': `Token ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          category: categoryId,
          title: `${categoryName} Consultation`,
          description: `Request for ${categoryName} consultation`,
          priority: 'medium',
          duration_minutes: 30,
        })
      });

      console.log('🔄 [FRONTEND] Create response status:', createResponse.status);
      
      if (!createResponse.ok) {
        const errorText = await createResponse.text();
        console.error('🔄 [FRONTEND] Create error:', errorText);
        throw new Error(`Failed to create consultation: ${createResponse.status}`);
      }

      const createResult = await createResponse.json();
      console.log('🔍 [FRONTEND] Create response:', createResult);
      
      // Wait for backend AI matching to complete
      console.log('⏳ [FRONTEND] Waiting for AI matching to complete...');
      
      // Wait 2 seconds for matching
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Step 2: Get consultations from ViewSet list endpoint
      try {
        console.log('🔄 [FRONTEND] Fetching consultations list...');
        
        const listResponse = await fetch('https://dc-backend-6xlc.onrender.com/api/categories/consultations/', {
          headers: {
            'Authorization': `Token ${token}`,
          }
        });
        
        console.log('🔄 [FRONTEND] List response status:', listResponse.status);
        
        if (listResponse.ok) {
          const listData = await listResponse.json();
          console.log('🔍 [FRONTEND] List endpoint data structure:', Object.keys(listData));
          
          // Check if it's paginated
          if (listData.results && Array.isArray(listData.results)) {
            console.log('📊 [FRONTEND] Found paginated data with', listData.results.length, 'results');
            
            // Sort by ID descending to get latest
            const sorted = [...listData.results].sort((a: any, b: any) => b.id - a.id);
            const latestConsultation = sorted[0];
            
            console.log('✅ [FRONTEND] Latest consultation:', latestConsultation);
            console.log('🔍 [FRONTEND] Latest consultation keys:', Object.keys(latestConsultation));
            console.log('🔍 [FRONTEND] Latest consultation status:', latestConsultation.status);
            console.log('🔍 [FRONTEND] Latest consultation professional_name:', latestConsultation.professional_name);
            console.log('🔍 [FRONTEND] Latest consultation hourly_rate:', latestConsultation.hourly_rate);
            console.log('🔍 [FRONTEND] Latest consultation total_amount:', latestConsultation.total_amount);
            console.log('🔍 [FRONTEND] Latest consultation has professional object?', !!latestConsultation.professional);
            
            setConsultationId(latestConsultation.id);
            setMatchResult(latestConsultation);
            
            // Check for match - looking at your data structure
            if (latestConsultation.professional_name || 
                latestConsultation.status === 'matched' || 
                latestConsultation.professional) {
              console.log('🎉 [FRONTEND] MATCH FOUND!');
              console.log('🎉 [FRONTEND] Professional:', latestConsultation.professional_name || 'Available');
              console.log('💰 [FRONTEND] Consultation amount:', latestConsultation.total_amount);
              setMatchStage('found');
            } else {
              console.log('⚠️ [FRONTEND] No match found in latest consultation');
              setMatchStage('not_found');
            }
          } else if (Array.isArray(listData)) {
            // Not paginated, direct array
            console.log('📊 [FRONTEND] Found direct array data with', listData.length, 'items');
            
            const sorted = [...listData].sort((a: any, b: any) => b.id - a.id);
            const latestConsultation = sorted[0];
            
            setConsultationId(latestConsultation.id);
            setMatchResult(latestConsultation);
            
            if (latestConsultation.professional_name || 
                latestConsultation.status === 'matched' || 
                latestConsultation.professional) {
              console.log('🎉 [FRONTEND] MATCH FOUND!');
              setMatchStage('found');
            } else {
              setMatchStage('not_found');
            }
          } else {
            console.log('⚠️ [FRONTEND] Unexpected data structure:', listData);
            setMatchStage('not_found');
          }
        } else {
          const errorText = await listResponse.text();
          console.error('❌ [FRONTEND] List error:', errorText);
          setMatchStage('not_found');
        }
      } catch (fetchErr) {
        console.error('❌ [FRONTEND] Error fetching consultations:', fetchErr);
        setMatchStage('not_found');
      }
      
    } catch (err: any) {
      console.error('❌ [FRONTEND] Matching error:', err);
      setError(err.message || 'Failed to find a match. Please try again.');
      setMatchStage('initial');
    } finally {
      setLoading(false);
    }
  };

  const handleProceedToPayment = () => {
    console.log('🔄 [FRONTEND] Proceed to payment clicked');
    
    if (!matchResult) {
      console.error('❌ [FRONTEND] No match result available');
      return;
    }
    
    // Check different data structures
    let professionalName = matchResult.professional_name || 
                          matchResult.professional?.user?.get_full_name || 
                          matchResult.professional?.name || 
                          'Professional';
    
    // FIXED: Calculate amount from hourly_rate if available, otherwise use total_amount
    let actualAmount = 0;
    
    if (matchResult.hourly_rate) {
      // Calculate from hourly_rate and duration
      const durationHours = (matchResult.duration_minutes || 30) / 60;
      actualAmount = parseFloat(matchResult.hourly_rate) * durationHours;
      console.log('💰 [FRONTEND] Calculated from hourly_rate:', {
        hourly_rate: matchResult.hourly_rate,
        duration: matchResult.duration_minutes,
        calculated: actualAmount
      });
    } else if (matchResult.total_amount) {
      // Use total_amount from backend
      actualAmount = parseFloat(matchResult.total_amount);
      console.log('💰 [FRONTEND] Using total_amount from backend:', actualAmount);
    } else {
      // Fallback to basePrice (shouldn't happen if backend is working)
      actualAmount = basePrice;
      console.warn('⚠️ [FRONTEND] No pricing data, using basePrice:', actualAmount);
    }
    
    console.log('✅ [FRONTEND] Professional name:', professionalName);
    console.log('✅ [FRONTEND] Consultation ID:', matchResult.id);
    console.log('💰 [FRONTEND] Amount for payment:', actualAmount);
    console.log('💰 [FRONTEND] Hourly rate from backend:', matchResult.hourly_rate);
    console.log('💰 [FRONTEND] Total amount from backend:', matchResult.total_amount);
    console.log('⏱️ [FRONTEND] Duration minutes:', matchResult.duration_minutes);
    
    if (professionalName && matchResult.id) {
      console.log('✅ [FRONTEND] Navigating to PaymentPage');
      
      navigate('/payment', {
        state: {
          consultationId: matchResult.id,
          professionalId: matchResult.professional?.id || 0,
          amount: actualAmount,
          professionalName: professionalName,
          categoryName: categoryName
        }
      });
      
      if (onClose) onClose();
      
    } else {
      console.error('❌ [FRONTEND] Missing data for payment:', {
        hasProfessionalName: !!professionalName,
        hasConsultationId: !!matchResult.id
      });
    }
  };

  const handleMakePayment = () => {
    console.log('🔄 [FRONTEND] Make payment clicked');
    
    if (matchResult?.id) {
      let professionalName = matchResult.professional_name || 
                            matchResult.professional?.user?.get_full_name || 
                            matchResult.professional?.name || 
                            'Professional';
      
      // FIXED: Calculate amount from hourly_rate if available, otherwise use total_amount
      let actualAmount = 0;
      
      if (matchResult.hourly_rate) {
        const durationHours = (matchResult.duration_minutes || 30) / 60;
        actualAmount = parseFloat(matchResult.hourly_rate) * durationHours;
      } else if (matchResult.total_amount) {
        actualAmount = parseFloat(matchResult.total_amount);
      } else {
        actualAmount = basePrice;
      }
      
      navigate('/payment', {
        state: {
          consultationId: matchResult.id,
          professionalId: matchResult.professional?.id || 0,
          amount: actualAmount,
          professionalName: professionalName,
          categoryName: categoryName
        }
      });
    }
  };

  const handleRetry = () => {
    console.log('🔄 [FRONTEND] Retry clicked');
    setMatchResult(null);
    setConsultationId(null);
    setMatchStage('initial');
    startMatching();
  };

  const getStageTitle = () => {
    switch (matchStage) {
      case 'initial':
        return 'DIRECT-CONNECT';
      case 'searching':
        return 'DIRECT-CONNECT..';
      case 'found':
        return 'Perfect Match Found!';
      case 'not_found':
        return 'No Professionals Available';
      case 'payment':
        return 'Complete Payment';
      default:
        return 'Find Your Expert';
    }
  };

  const getStageDescription = () => {
    switch (matchStage) {
      case 'initial':
        return `Click start to find the best ${categoryName.toLowerCase()} professional for you`;
      case 'searching':
        return 'Skip the search, Get the answer...';
      case 'found':
        return 'We found a verified professional ready to help you';
      case 'not_found':
        return 'All professionals are currently busy. Please try again in a few minutes';
      case 'payment':
        return 'Complete payment to start your consultation';
      default:
        return '';
    }
  };

  const getProfessionalData = () => {
    if (!matchResult) {
      console.log('❌ [FRONTEND] No match result');
      return null;
    }
    
    console.log('🔄 [FRONTEND] Extracting professional data from:', matchResult);
    
    let professionalName = matchResult.professional_name || 
                          matchResult.professional?.user?.get_full_name || 
                          matchResult.professional?.name;
    
    if (!professionalName) {
      console.log('❌ [FRONTEND] No professional name found');
      return null;
    }
    
    // Get hourly rate from backend, convert to number
    const hourlyRate = matchResult.hourly_rate ? parseFloat(matchResult.hourly_rate) : basePrice;
    
    return {
      id: matchResult.professional?.id || 0,
      name: professionalName,
      title: matchResult.professional?.title || 'Legal Expert',
      rating: matchResult.professional?.rating || 4.0,
      experience_years: matchResult.professional?.experience_years || 30,
      hourly_rate: hourlyRate,
      languages: matchResult.professional?.languages || ['English'],
      bio: matchResult.professional?.bio || 'Verified legal professional with extensive experience',
      ai_score: 85
    };
  };

  const renderAIScore = (score: number) => {
    let color = 'text-red-600 bg-red-50';
    let label = 'Fair Match';
    
    if (score >= 80) {
      color = 'text-emerald-600 bg-emerald-50';
      label = 'Get the Answer';
    } else if (score >= 60) {
      color = 'text-blue-600 bg-blue-50';
      label = 'Good Match';
    } else if (score >= 40) {
      color = 'text-yellow-600 bg-yellow-50';
      label = 'Average Match';
    }

    return (
      <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${color}`}>
        <Zap size={14} className="mr-1" />
        Skip the Search: {score}/100 • {label}
      </div>
    );
  };

  const renderProfessionalCard = () => {
    console.log('🔄 [FRONTEND] Rendering professional card');
    
    const professionalData = getProfessionalData();
    if (!professionalData) {
      console.error('❌ [FRONTEND] No professional data available');
      
      if (matchResult?.professional_name) {
        // Calculate amount for display
        let displayAmount = 0;
        if (matchResult.hourly_rate) {
          const durationHours = (matchResult.duration_minutes || 30) / 60;
          displayAmount = parseFloat(matchResult.hourly_rate) * durationHours;
        } else if (matchResult.total_amount) {
          displayAmount = parseFloat(matchResult.total_amount);
        } else {
          displayAmount = basePrice;
        }
        
        return (
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <div className="text-center p-8">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="text-emerald-600" size={32} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Match Found!</h3>
              <p className="text-gray-600 mb-4">
                Your consultation has been matched with <strong>{matchResult.professional_name}</strong>
              </p>
              
              <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Amount:</span>
                  <span className="text-xl font-bold text-emerald-600">KES {displayAmount.toFixed(2)}</span>
                </div>
                {matchResult.hourly_rate && (
                  <div className="text-sm text-gray-500 mt-1">
                    Hourly rate: KES {parseFloat(matchResult.hourly_rate).toFixed(2)}
                  </div>
                )}
                {matchResult.duration_minutes && (
                  <div className="text-sm text-gray-500">
                    Duration: {matchResult.duration_minutes} minutes
                  </div>
                )}
              </div>
              
              <p className="text-sm text-gray-500 mb-6">
                Consultation ID: {matchResult.id} | Status: {matchResult.status}
              </p>
              <button
                onClick={handleProceedToPayment}
                className="w-full py-3 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700 transition-colors"
              >
                Proceed to Payment - KES {displayAmount.toFixed(2)}
              </button>
            </div>
          </div>
        );
      }
      
      return (
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <div className="text-center p-8">
            <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">Professional Data Missing</h3>
            <p className="text-gray-600 mb-4">Consultation created but professional details not available.</p>
            <div className="space-y-3">
              <button
                onClick={handleRetry}
                className="w-full py-2 px-4 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700"
              >
                Try Matching Again
              </button>
              <button
                onClick={onClose}
                className="w-full py-2 px-4 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200"
              >
                Close and Check Dashboard
              </button>
            </div>
          </div>
        </div>
      );
    }

    const prof = professionalData;
    console.log('✅ [FRONTEND] Rendering professional:', prof);

    // Calculate consultation amount
    const consultationAmount = prof.hourly_rate * 0.5; // 30 minutes = 0.5 hours

    return (
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                {prof.name.split(' ').map(n => n[0]).join('')}
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">{prof.name}</h3>
                <p className="text-gray-600">{prof.title}</p>
              </div>
            </div>
            {renderAIScore(prof.ai_score)}
          </div>
          
          <div className="text-right">
            <div className="text-2xl font-bold text-gray-900">
              KES {prof.hourly_rate.toFixed(2)}
            </div>
            <div className="text-sm text-gray-500">per hour</div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
              <Star className="text-blue-600" size={16} />
            </div>
            <div>
              <div className="text-sm text-gray-500">Rating</div>
              <div className="font-semibold">{prof.rating}/5.0</div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-purple-50 rounded-lg flex items-center justify-center">
              <Award className="text-purple-600" size={16} />
            </div>
            <div>
              <div className="text-sm text-gray-500">Experience</div>
              <div className="font-semibold">{prof.experience_years} years</div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-amber-50 rounded-lg flex items-center justify-center">
              <Timer className="text-amber-600" size={16} />
            </div>
            <div>
              <div className="text-sm text-gray-500">Response Time</div>
              <div className="font-semibold">&lt; 2 mins</div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center">
              <Users className="text-emerald-600" size={16} />
            </div>
            <div>
              <div className="text-sm text-gray-500">Languages</div>
              <div className="font-semibold">{prof.languages.join(', ')}</div>
            </div>
          </div>
        </div>

        <p className="text-gray-600 text-sm mb-4">{prof.bio}</p>

        <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
          <Shield size={14} />
          <span>✓ Verified Professional • ✓ Background Checked • ✓ Licensed</span>
        </div>

        <div className="mb-6 p-4 bg-gray-50 rounded-xl">
          <div className="flex justify-between items-center mb-2">
            <span className="text-gray-600">30-minute Consultation:</span>
            <span className="text-lg font-bold text-emerald-600">
              KES {consultationAmount.toFixed(2)}
            </span>
          </div>
          <div className="text-sm text-gray-500">
            Based on hourly rate of KES {prof.hourly_rate.toFixed(2)}
          </div>
        </div>

        <button
          onClick={handleProceedToPayment}
          className="w-full py-3 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700 transition-colors"
        >
          Proceed to Payment - KES {consultationAmount.toFixed(2)}
        </button>
      </div>
    );
  };

  const renderPaymentCard = () => {
    if (!matchResult) return null;

    const professionalName = matchResult.professional_name || 
                            matchResult.professional?.user?.get_full_name || 
                            matchResult.professional?.name || 
                            'Professional';
    
    let actualAmount = 0;
    if (matchResult.hourly_rate) {
      const durationHours = (matchResult.duration_minutes || 30) / 60;
      actualAmount = parseFloat(matchResult.hourly_rate) * durationHours;
    } else if (matchResult.total_amount) {
      actualAmount = parseFloat(matchResult.total_amount);
    } else {
      actualAmount = basePrice;
    }

    return (
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="text-emerald-600" size={32} />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Payment Required</h3>
          <p className="text-gray-600">Complete payment to start your consultation with {professionalName}</p>
        </div>

        <div className="space-y-4 mb-6">
          <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
            <div>
              <div className="text-sm text-gray-500">Professional Fee</div>
              <div className="font-semibold">{professionalName}</div>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-500">KES {(matchResult.hourly_rate ? parseFloat(matchResult.hourly_rate) : basePrice).toFixed(2)}/hour</div>
              <div className="font-semibold">KES {actualAmount.toFixed(2)}</div>
            </div>
          </div>

          <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
            <div>
              <div className="text-sm text-gray-500">Service Category</div>
              <div className="font-semibold">{categoryName}</div>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-500">Duration</div>
              <div className="font-semibold">{matchResult.duration_minutes || 30} minutes</div>
            </div>
          </div>

          <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
            <div>
              <div className="text-sm text-gray-500">Platform Fee</div>
              <div className="font-semibold">Service & Support</div>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-500">Included</div>
              <div className="font-semibold">KES 0.00</div>
            </div>
          </div>

          <div className="border-t pt-4">
            <div className="flex justify-between items-center">
              <div className="text-lg font-bold">Total Amount</div>
              <div className="text-2xl font-bold text-emerald-600">
                KES {actualAmount.toFixed(2)}
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <button
            onClick={handleMakePayment}
            className="w-full py-3 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700 transition-colors"
          >
            Pay KES {actualAmount.toFixed(2)}
          </button>
          <button
            onClick={() => setMatchStage('found')}
            className="w-full py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-colors"
          >
            Back to Professional Details
          </button>
        </div>

        <div className="mt-6 text-center text-sm text-gray-500">
          <p>🔒 Secure payment • Money-back guarantee • 24/7 support</p>
        </div>
      </div>
    );
  };

  const renderQueueCard = () => {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center shadow-sm">
        <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Clock className="text-amber-600" size={32} />
        </div>
        
        <h3 className="text-xl font-bold text-gray-900 mb-2">All Professionals Are Busy</h3>
        <p className="text-gray-600 mb-6">
          Our verified {categoryName.toLowerCase()} professionals are currently assisting other clients. 
          You are #1 in the queue.
        </p>

        <div className="space-y-3">
          <button
            onClick={handleRetry}
            className="w-full py-3 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700 transition-colors"
          >
            Try Again Now
          </button>
          <button
            onClick={onClose}
            className="w-full py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-colors"
          >
            Choose Another Service
          </button>
        </div>

        <div className="mt-6 text-sm text-gray-500">
          <p>⏰ Average wait time: 5-10 minutes</p>
          <p>🔔 We'll notify you when a professional becomes available</p>
        </div>
      </div>
    );
  };

  console.log('🔄 [FRONTEND] Current stage:', matchStage);
  console.log('🔄 [FRONTEND] Match result:', matchResult);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
        <div className="bg-gradient-to-r from-emerald-600 to-teal-600 p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold">{getStageTitle()}</h2>
              <p className="text-emerald-100 text-sm mt-1">{getStageDescription()}</p>
            </div>
            {matchStage !== 'searching' && (
              <button
                onClick={onClose}
                className="text-white hover:text-emerald-200 transition-colors"
              >
                <XCircle size={24} />
              </button>
            )}
          </div>
        </div>

        <div className="p-6">
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl">
              <div className="flex items-center gap-2 text-red-600">
                <XCircle size={20} />
                <span className="font-medium">Error: {error}</span>
              </div>
              <button
                onClick={handleRetry}
                className="mt-2 text-sm text-red-600 hover:text-red-800 font-medium"
              >
                Try again
              </button>
            </div>
          )}

          {matchStage === 'initial' && (
            <div className="space-y-6">
              <div className="text-center p-6 bg-gray-50 rounded-xl">
                <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Zap className="text-emerald-600" size={28} />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">DIRECT-CONNECT</h3>
                <p className="text-gray-600 mb-4">
                  Skip the Search, Get the Answer:
                </p>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center gap-2">
                    <Star size={16} className="text-blue-500" />
                    <span>Rating & Reviews</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Award size={16} className="text-purple-500" />
                    <span>Experience</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Timer size={16} className="text-amber-500" />
                    <span>Response Time</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users size={16} className="text-emerald-500" />
                    <span>Availability</span>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <Shield className="text-blue-600 mt-1" size={20} />
                  <div>
                    <h4 className="font-bold text-gray-900 mb-1">Secure & Reliable</h4>
                    <p className="text-sm text-gray-600">
                      Only pay when matched with a verified professional. 
                      Money-back guarantee if not satisfied.
                    </p>
                  </div>
                </div>
              </div>

              <button
                onClick={startMatching}
                disabled={loading}
                className="w-full py-4 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl font-bold text-lg hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                "Skip the Search, Get the Answer"
              </button>
            </div>
          )}

          {matchStage === 'searching' && (
            <div className="space-y-6">
              <div className="text-center p-8">
                <Loader2 className="w-16 h-16 text-emerald-600 animate-spin mx-auto mb-4" />
                <h3 className="text-lg font-bold text-gray-900 mb-2">DIRECT-CONNECT</h3>
                <p className="text-gray-600">
                  Creating consultation and matching with best professional...
                </p>
                
                <div className="mt-8 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Creating consultation</span>
                    <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse"></div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">'Skip the Search, Get the Answer'</span>
                    <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse"></div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Checking availability</span>
                    <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse"></div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Fetching results</span>
                    <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse"></div>
                  </div>
                </div>
                
                <div className="mt-6 text-sm text-gray-500">
                  <p>This may take a few seconds...</p>
                </div>
              </div>
            </div>
          )}

          {matchStage === 'found' && renderProfessionalCard()}

          {matchStage === 'payment' && renderPaymentCard()}

          {matchStage === 'not_found' && renderQueueCard()}

          {matchResult && (
            <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
              <details className="text-sm">
                <summary className="cursor-pointer font-medium text-gray-700">Response Details</summary>
                <div className="mt-2 space-y-1 text-xs">
                  <div><strong>Consultation ID:</strong> {matchResult.id || 'N/A'}</div>
                  <div><strong>Status:</strong> {matchResult.status || 'N/A'}</div>
                  <div><strong>Professional Name:</strong> {matchResult.professional_name || 'N/A'}</div>
                  <div><strong>Hourly Rate:</strong> {matchResult.hourly_rate || 'N/A'}</div>
                  <div><strong>Total Amount:</strong> {matchResult.total_amount || 'N/A'}</div>
                  <div><strong>Duration:</strong> {matchResult.duration_minutes || 'N/A'} minutes</div>
                  <div><strong>Has Professional Object:</strong> {matchResult.professional ? 'Yes' : 'No'}</div>
                  <div><strong>Category:</strong> {matchResult.category_name || 'N/A'}</div>
                  <div className="mt-2">
                    <strong>Full Response:</strong>
                    <pre className="mt-1 text-xs bg-gray-100 p-2 rounded overflow-auto max-h-40">
                      {JSON.stringify(matchResult, null, 2)}
                    </pre>
                  </div>
                </div>
              </details>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
