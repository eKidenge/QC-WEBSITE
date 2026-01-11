import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Phone, 
  CreditCard, 
  Shield, 
  CheckCircle, 
  XCircle, 
  Loader2,
  Lock,
  Smartphone,
  AlertCircle,
  ArrowLeft,
  Receipt,
  Clock,
  Wifi
} from 'lucide-react';

interface PaymentPageProps {
  consultationId?: number;
  professionalId?: number;
  amount?: number;
  professionalName?: string;
  categoryName?: string;
}

interface MpesaResponse {
  status: 'success' | 'pending' | 'failed' | 'phone_required';
  message: string;
  checkout_request_id?: string;
  merchant_request_id?: string;
  transaction_id?: number;
  phone_number?: string;
  amount?: number;
}

interface TransactionStatus {
  status: 'success' | 'pending' | 'failed' | 'processing';
  message: string;
  transaction_id?: number;
  mpesa_receipt?: string;
  amount?: number;
}

export default function PaymentPage() {
  const navigate = useNavigate();
  const location = useLocation();
  // ========== ADD THESE TWO LINES ==========
  console.log("🔍 DEBUG - Payment Page location.state:", location.state);
  console.log("🔍 DEBUG - Payment Details:", paymentDetails);
  // =========================================
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [mpesaResponse, setMpesaResponse] = useState<MpesaResponse | null>(null);
  const [currentStatus, setCurrentStatus] = useState<TransactionStatus | null>(null);
  const [polling, setPolling] = useState(false);
  const [pollInterval, setPollInterval] = useState<NodeJS.Timeout | null>(null);
  
  // Get payment details from location state or props
  const paymentDetails = location.state as PaymentPageProps || {};
  
  const {
    consultationId,
    professionalId,
    amount = 1000,
    professionalName = 'Professional',
    categoryName = 'Service'
  } = paymentDetails;

  // FIX: Convert amount to number safely
  const safeAmount = React.useMemo(() => {
    const amt = Number(amount);
    return isNaN(amt) || amt <= 0 ? 1000 : amt;
  }, [amount]);

  // Validate required parameters
  useEffect(() => {
    if (!consultationId) {
      setError('Missing consultation ID. Please go back and try again.');
    }
  }, [consultationId]);

  const [phoneNumber, setPhoneNumber] = useState('');
  const [phoneError, setPhoneError] = useState<string | null>(null);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollInterval) {
        clearInterval(pollInterval);
      }
    };
  }, [pollInterval]);

  const validatePhoneNumber = (phone: string): boolean => {
    // Kenyan phone number validation: starts with 07, 01, or +254
    const kenyanRegex = /^(?:0|\+?254)(?:7[0-9]|1[0-9])\d{7}$/;
    return kenyanRegex.test(phone);
  };

  const formatPhoneNumber = (phone: string): string => {
    // Format to 2547XXXXXXXX
    let formatted = phone.trim();
    
    if (formatted.startsWith('0')) {
      formatted = '254' + formatted.substring(1);
    } else if (formatted.startsWith('+254')) {
      formatted = formatted.substring(1);
    } else if (formatted.startsWith('254')) {
      // Already formatted
    } else {
      // Assume it's 7XXXXXXXX
      formatted = '254' + formatted;
    }
    
    return formatted;
  };

  const initiateMpesaPayment = async (phone: string) => {
    try {
      setLoading(true);
      setError(null);
      setPhoneError(null);
      setSuccess(false);
      setMpesaResponse(null);
      setCurrentStatus(null);
      
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      if (!consultationId) {
        setError('Missing consultation ID');
        return;
      }

      const formattedPhone = formatPhoneNumber(phone);
      
      console.log('🔄 [PAYMENT] Initiating M-Pesa payment:', {
        consultationId,
        phoneNumber: formattedPhone,
        amount: safeAmount
      });

      const response = await fetch('https://dc-backend-6xlc.onrender.com/api/payments/mpesa/initiate/', {
        method: 'POST',
        headers: {
          'Authorization': `Token ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          consultation_id: consultationId, // Changed from consultation to consultation_id
          phone_number: formattedPhone,
          amount: safeAmount // Use safeAmount instead of amount
        })
      });

      console.log('🔄 [PAYMENT] Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('🔄 [PAYMENT] Error response:', errorText);
        throw new Error(`Payment initiation failed: ${response.status}`);
      }

      const result: MpesaResponse = await response.json();
      console.log('🔍 [PAYMENT] M-Pesa response:', result);
      
      setMpesaResponse(result);

      if (result.status === 'success') {
        console.log('✅ [PAYMENT] M-Pesa STK Push initiated successfully');
        
        // Start polling for payment status
        if (result.checkout_request_id || result.transaction_id) {
          startPolling(result.checkout_request_id, result.transaction_id);
        }
        
        // Show success message but continue polling
        setSuccess(true);
      } else if (result.status === 'phone_required') {
        console.log('📱 [PAYMENT] Phone number required');
        setPhoneError('Please enter a valid M-Pesa registered phone number');
      } else {
        console.error('❌ [PAYMENT] Payment initiation failed:', result.message);
        setError(result.message || 'Failed to initiate payment');
      }
    } catch (err: any) {
      console.error('❌ [PAYMENT] Error:', err);
      setError(err.message || 'Failed to process payment');
    } finally {
      setLoading(false);
    }
  };

  const checkPaymentStatus = async (checkoutRequestId?: string, transactionId?: number) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return null;

      const params = new URLSearchParams();
      if (checkoutRequestId) {
        params.append('checkout_request_id', checkoutRequestId);
      }
      if (transactionId) {
        params.append('transaction_id', transactionId.toString());
      }

      const url = `https://dc-backend-6xlc.onrender.com/api/payments/mpesa/status/?${params.toString()}`;
      console.log('🔍 [PAYMENT] Checking status:', url);

      const response = await fetch(url, {
        headers: {
          'Authorization': `Token ${token}`,
        }
      });

      if (response.ok) {
        const result: TransactionStatus = await response.json();
        console.log('🔍 [PAYMENT] Status check result:', result);
        setCurrentStatus(result);
        return result;
      } else {
        const errorText = await response.text();
        console.error('❌ [PAYMENT] Status check error:', errorText);
      }
    } catch (err) {
      console.error('❌ [PAYMENT] Status check error:', err);
    }
    return null;
  };

  const startPolling = (checkoutRequestId?: string, transactionId?: number) => {
    // Clear any existing interval
    if (pollInterval) {
      clearInterval(pollInterval);
    }
    
    setPolling(true);
    
    // Initial check
    checkPaymentStatus(checkoutRequestId, transactionId);
    
    // Start polling interval
    const interval = setInterval(async () => {
      console.log('🔄 [PAYMENT] Polling for payment status...');
      
      const statusResult = await checkPaymentStatus(checkoutRequestId, transactionId);
      
      if (statusResult) {
        console.log('🔍 [PAYMENT] Polling result:', statusResult);
        
        // FIXED: Changed statusStatus to statusResult.status
        if (statusResult.status === 'success') {
          console.log('✅ [PAYMENT] Payment confirmed!');
          clearInterval(interval);
          setPollInterval(null);
          setPolling(false);
          // No need to navigate since we show success in this component
        } else if (statusResult.status === 'failed') {
          console.error('❌ [PAYMENT] Payment failed');
          clearInterval(interval);
          setPollInterval(null);
          setPolling(false);
          setError(statusResult.message || 'Payment failed. Please try again.');
        }
        // If still pending/processing, continue polling
      }
    }, 5000); // Poll every 5 seconds

    setPollInterval(interval);

    // Stop polling after 10 minutes (M-Pesa timeout)
    setTimeout(() => {
      if (interval) {
        clearInterval(interval);
        setPollInterval(null);
        setPolling(false);
        if (!currentStatus || currentStatus.status !== 'success') {
          setError('Payment timeout. Please check your M-Pesa messages or try again.');
        }
      }
    }, 600000); // 10 minutes
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!phoneNumber.trim()) {
      setPhoneError('Phone number is required');
      return;
    }
    
    if (!validatePhoneNumber(phoneNumber)) {
      setPhoneError('Please enter a valid Kenyan phone number (e.g., 07XXXXXXXX or +2547XXXXXXXX)');
      return;
    }
    
    await initiateMpesaPayment(phoneNumber);
  };

  const handleBack = () => {
    navigate(-1);
  };

  const handleRetry = () => {
    setError(null);
    setMpesaResponse(null);
    setCurrentStatus(null);
    setSuccess(false);
    setPhoneNumber('');
    
    if (pollInterval) {
      clearInterval(pollInterval);
      setPollInterval(null);
    }
    setPolling(false);
  };

  const formatPhoneDisplay = (phone: string) => {
    if (phone.startsWith('254')) {
      return '0' + phone.substring(3);
    }
    return phone;
  };

  // Render payment form
  const renderPaymentForm = () => (
    <div className="max-w-md mx-auto">
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Smartphone className="text-emerald-600" size={32} />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Complete Payment</h2>
          <p className="text-gray-600">
            Enter your M-Pesa registered phone number to receive a payment prompt
          </p>
        </div>

        {/* Payment Summary */}
        <div className="bg-gray-50 rounded-xl p-4 mb-6">
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Professional</span>
              <span className="font-semibold">{professionalName}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Service</span>
              <span className="font-semibold">{categoryName}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Consultation ID</span>
              <span className="font-semibold">#{consultationId}</span>
            </div>
            <div className="border-t pt-3">
              <div className="flex justify-between items-center">
                <span className="text-lg font-bold">Total Amount</span>
                <div className="text-right">
                  <div className="text-2xl font-bold text-emerald-600">KES {safeAmount.toFixed(2)}</div>
                  <div className="text-sm text-gray-500">Including all fees</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Phone Input Form */}
        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              M-Pesa Registered Phone Number
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Phone className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => {
                  setPhoneNumber(e.target.value);
                  setPhoneError(null);
                }}
                placeholder="07XXXXXXXX or +2547XXXXXXXX"
                className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                disabled={loading}
                autoFocus
              />
            </div>
            {phoneError && (
              <p className="mt-2 text-sm text-red-600 flex items-center">
                <AlertCircle size={16} className="mr-1" />
                {phoneError}
              </p>
            )}
            <p className="mt-2 text-sm text-gray-500">
              Enter the phone number registered with M-Pesa. You'll receive a prompt on your phone.
            </p>
          </div>

          {/* Security Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
            <div className="flex items-start gap-3">
              <Shield className="text-blue-600 mt-1" size={20} />
              <div>
                <h4 className="font-bold text-gray-900 mb-1">Secure Payment</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li className="flex items-center">
                    <Lock size={14} className="mr-2 text-green-600" />
                    Encrypted M-Pesa transaction
                  </li>
                  <li className="flex items-center">
                    <CheckCircle size={14} className="mr-2 text-green-600" />
                    Money-back guarantee
                  </li>
                  <li className="flex items-center">
                    <Wifi size={14} className="mr-2 text-green-600" />
                    Instant confirmation
                  </li>
                  <li className="flex items-center">
                    <Receipt size={14} className="mr-2 text-green-600" />
                    M-Pesa receipt provided
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Payment Button */}
          <button
            type="submit"
            disabled={loading || !phoneNumber.trim()}
            className="w-full py-4 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl font-bold text-lg hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Lock className="w-5 h-5 mr-2" />
                Pay KES {safeAmount.toFixed(2)} with M-Pesa
              </>
            )}
          </button>

          <p className="mt-4 text-center text-sm text-gray-500">
            By proceeding, you agree to our Terms of Service and Privacy Policy
          </p>
        </form>
      </div>
    </div>
  );

  // Render pending payment
  const renderPendingPayment = () => (
    <div className="max-w-md mx-auto">
      <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm text-center">
        <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
          {polling ? (
            <Loader2 className="text-blue-600 animate-spin" size={32} />
          ) : (
            <CheckCircle className="text-blue-600" size={32} />
          )}
        </div>
        
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Payment Initiated</h2>
        <p className="text-gray-600 mb-4">
          We've sent an M-Pesa prompt to <strong className="text-emerald-600">
            {mpesaResponse?.phone_number ? formatPhoneDisplay(mpesaResponse.phone_number) : 'your phone'}
          </strong>
        </p>
        
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
          <h4 className="font-bold text-gray-900 mb-3">What to do next:</h4>
          <ol className="text-sm text-gray-600 text-left space-y-3">
            <li className="flex items-start">
              <span className="bg-blue-100 text-blue-800 rounded-full w-6 h-6 flex items-center justify-center mr-3 flex-shrink-0 mt-0.5">1</span>
              <div>
                <span className="font-medium">Check your phone</span>
                <p className="text-gray-500 mt-1">Look for an M-Pesa STK Push notification</p>
              </div>
            </li>
            <li className="flex items-start">
              <span className="bg-blue-100 text-blue-800 rounded-full w-6 h-6 flex items-center justify-center mr-3 flex-shrink-0 mt-0.5">2</span>
              <div>
                <span className="font-medium">Enter your M-Pesa PIN</span>
                <p className="text-gray-500 mt-1">Enter your PIN when prompted to complete payment</p>
              </div>
            </li>
            <li className="flex items-start">
              <span className="bg-blue-100 text-blue-800 rounded-full w-6 h-6 flex items-center justify-center mr-3 flex-shrink-0 mt-0.5">3</span>
              <div>
                <span className="font-medium">Wait for confirmation</span>
                <p className="text-gray-500 mt-1">You'll be redirected automatically when payment is confirmed</p>
              </div>
            </li>
          </ol>
        </div>

        {/* Status Display */}
        {currentStatus && (
          <div className={`mb-6 p-4 rounded-xl ${
            currentStatus.status === 'success' ? 'bg-emerald-50 border border-emerald-200' :
            currentStatus.status === 'failed' ? 'bg-red-50 border border-red-200' :
            'bg-blue-50 border border-blue-200'
          }`}>
            <div className="flex items-center justify-center gap-2 mb-2">
              {currentStatus.status === 'success' && <CheckCircle className="text-emerald-600" size={20} />}
              {currentStatus.status === 'failed' && <XCircle className="text-red-600" size={20} />}
              {currentStatus.status === 'pending' && <Loader2 className="text-blue-600 animate-spin" size={20} />}
              {currentStatus.status === 'processing' && <Loader2 className="text-blue-600 animate-spin" size={20} />}
              <span className="font-medium">
                {currentStatus.status === 'success' ? 'Payment Confirmed' :
                 currentStatus.status === 'failed' ? 'Payment Failed' :
                 currentStatus.status === 'processing' ? 'Processing Payment' :
                 'Awaiting Payment'}
              </span>
            </div>
            <p className="text-sm text-gray-600">{currentStatus.message}</p>
            
            {currentStatus.mpesa_receipt && (
              <div className="mt-2 text-sm">
                <span className="text-gray-500">Receipt: </span>
                <span className="font-mono font-semibold">{currentStatus.mpesa_receipt}</span>
              </div>
            )}
          </div>
        )}

        {polling && (
          <div className="mb-6">
            <div className="flex items-center justify-center gap-2 text-blue-600">
              <Loader2 size={16} className="animate-spin" />
              <span>Checking payment status...</span>
            </div>
            <div className="mt-2 text-sm text-gray-500">
              This may take a few moments
            </div>
          </div>
        )}

        <div className="space-y-3">
          {currentStatus?.status !== 'success' && (
            <button
              onClick={handleRetry}
              className="w-full py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-colors"
            >
              Use Different Phone Number
            </button>
          )}
          <button
            onClick={handleBack}
            className="w-full py-3 bg-white border border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors flex items-center justify-center"
          >
            <ArrowLeft size={18} className="mr-2" />
            Back to Consultation
          </button>
        </div>

        <div className="mt-6 text-sm text-gray-500">
          <p>Not received the prompt?</p>
          <div className="space-y-2 mt-2">
            <button
              onClick={() => mpesaResponse?.phone_number && initiateMpesaPayment(mpesaResponse.phone_number)}
              className="text-emerald-600 hover:text-emerald-800 font-medium block w-full"
            >
              Resend M-Pesa Prompt
            </button>
            <button
              onClick={() => checkPaymentStatus(mpesaResponse?.checkout_request_id, mpesaResponse?.transaction_id)}
              className="text-blue-600 hover:text-blue-800 font-medium block w-full"
            >
              Check Payment Status
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // Render success state
  const renderSuccess = () => (
    <div className="max-w-md mx-auto">
      <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm text-center">
        <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="text-emerald-600" size={32} />
        </div>
        
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Payment Successful!</h2>
        <p className="text-gray-600 mb-6">
          Your payment of <strong className="text-emerald-600">KES {safeAmount.toFixed(2)}</strong> has been confirmed.
        </p>
        
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 mb-6">
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Transaction ID:</span>
              <span className="font-mono font-semibold">
                {currentStatus?.transaction_id || mpesaResponse?.transaction_id || 'N/A'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">M-Pesa Receipt:</span>
              <span className="font-mono font-semibold">
                {currentStatus?.mpesa_receipt_number || 'N/A'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Professional:</span>
              <span className="font-semibold">{professionalName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Consultation ID:</span>
              <span className="font-semibold">#{consultationId}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Phone Number:</span>
              <span className="font-semibold">
                {mpesaResponse?.phone_number ? formatPhoneDisplay(mpesaResponse.phone_number) : 'N/A'}
              </span>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <button
            onClick={() => navigate('/call', { 
              state: { 
                from: 'consultation',
                consultationId: consultationId,
                professionalId: location.state?.professionalId || 1, // ADD THIS
                professionalName: location.state?.professionalName,
                amount: safeAmount,
                categoryName: categoryName
              }
            })}
            className="w-full py-3 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700 transition-colors"
          >
            Begin Consultation
          </button>
          <button
            onClick={() => navigate(`/consultation/${consultationId}`)}
            className="w-full py-3 bg-white border border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
          >
            View Consultation Details
          </button>
          <button
            onClick={() => window.print()}
            className="w-full py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors"
          >
            Print Receipt
          </button>
        </div>
      </div>
    </div>
  );

  // Render error state
  const renderError = () => (
    <div className="max-w-md mx-auto">
      <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm text-center">
        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <XCircle className="text-red-600" size={32} />
        </div>
        
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Payment Failed</h2>
        <p className="text-gray-600 mb-6">
          {error || 'There was an error processing your payment.'}
        </p>
        
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
          <h4 className="font-bold text-gray-900 mb-2">Possible Reasons:</h4>
          <ul className="text-sm text-gray-600 text-left space-y-2">
            <li className="flex items-start">
              <XCircle size={16} className="text-red-500 mr-2 mt-0.5 flex-shrink-0" />
              <span>Insufficient M-Pesa balance</span>
            </li>
            <li className="flex items-start">
              <XCircle size={16} className="text-red-500 mr-2 mt-0.5 flex-shrink-0" />
              <span>Incorrect M-Pesa PIN entered</span>
            </li>
            <li className="flex items-start">
              <XCircle size={16} className="text-red-500 mr-2 mt-0.5 flex-shrink-0" />
              <span>Transaction timeout</span>
            </li>
            <li className="flex items-start">
              <XCircle size={16} className="text-red-500 mr-2 mt-0.5 flex-shrink-0" />
              <span>Network issues</span>
            </li>
          </ul>
        </div>

        <div className="space-y-3">
          <button
            onClick={handleRetry}
            className="w-full py-3 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700 transition-colors"
          >
            Try Again
          </button>
          <button
            onClick={handleBack}
            className="w-full py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-colors"
          >
            Back to Safety
          </button>
          <button
            onClick={() => navigate('/support')}
            className="w-full py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors"
          >
            Contact Support
          </button>
        </div>
      </div>
    </div>
  );

  console.log('🔄 [PAYMENT] Current state:', {
    loading,
    error,
    success,
    mpesaResponse,
    currentStatus,
    polling,
    consultationId,
    safeAmount
  });

  // Determine what to render
  const getContent = () => {
    if (error) return renderError();
    if (currentStatus?.status === 'success') return renderSuccess();
    if (mpesaResponse) return renderPendingPayment();
    return renderPaymentForm();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={handleBack}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft size={20} className="mr-2" />
            Back
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Secure M-Pesa Payment</h1>
          <p className="text-gray-600 mt-2">Complete your consultation payment securely via M-Pesa</p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center mb-8">
          {['Details', 'M-Pesa Prompt', 'Confirmation'].map((step, index) => {
            let stepStatus = '';
            if (mpesaResponse) {
              stepStatus = index <= 1 ? 'complete' : 'current';
            } else {
              stepStatus = index === 0 ? 'current' : 'pending';
            }
            if (currentStatus?.status === 'success') {
              stepStatus = 'complete';
            }
            
            return (
              <div key={index} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  stepStatus === 'complete' ? 'bg-emerald-600 text-white' :
                  stepStatus === 'current' ? 'bg-blue-600 text-white' :
                  'bg-gray-200 text-gray-600'
                }`}>
                  {stepStatus === 'complete' ? '✓' : index + 1}
                </div>
                <div className={`text-sm ml-2 ${
                  stepStatus === 'complete' ? 'text-emerald-600 font-medium' :
                  stepStatus === 'current' ? 'text-blue-600 font-medium' :
                  'text-gray-500'
                }`}>
                  {step}
                </div>
                {index < 2 && (
                  <div className={`w-16 h-1 mx-2 ${
                    stepStatus === 'complete' ? 'bg-emerald-600' : 'bg-gray-200'
                  }`}></div>
                )}
              </div>
            );
          })}
        </div>

        {/* Main Content */}
        {getContent()}
      </div>
    </div>
  );
}
