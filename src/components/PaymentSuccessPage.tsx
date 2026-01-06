// PaymentSuccessPage.tsx
import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { CheckCircle, Download, Share2, Home, FileText } from 'lucide-react';

interface PaymentSuccessProps {
  consultationId?: number;
  amount?: number;
  professionalName?: string;
  transactionId?: number;
  mpesaReceipt?: string;
}

export default function PaymentSuccessPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const paymentData = location.state as PaymentSuccessProps || {};

  const {
    consultationId,
    amount = 0,
    professionalName = 'Professional',
    transactionId,
    mpesaReceipt
  } = paymentData;

  const handlePrintReceipt = () => {
    const receiptContent = `
      PAYMENT RECEIPT
      ===============
      
      Transaction ID: ${transactionId || 'N/A'}
      M-Pesa Receipt: ${mpesaReceipt || 'N/A'}
      Consultation ID: ${consultationId || 'N/A'}
      Professional: ${professionalName}
      Amount Paid: KES ${amount.toFixed(2)}
      Date: ${new Date().toLocaleDateString()}
      Time: ${new Date().toLocaleTimeString()}
      
      Thank you for your payment!
      Consultation will start shortly.
    `;
    
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`<pre>${receiptContent}</pre>`);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const handleShare = async () => {
    const shareData = {
      title: 'Payment Confirmation',
      text: `I've successfully paid KES ${amount.toFixed(2)} for consultation with ${professionalName}. Transaction ID: ${transactionId}`,
    };
    
    if (navigator.share && navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.log('Error sharing:', err);
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(shareData.text);
      alert('Receipt details copied to clipboard!');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 flex items-center justify-center py-8 px-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-xl text-center">
          {/* Success Icon */}
          <div className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="text-emerald-600" size={48} />
          </div>
          
          {/* Success Message */}
          <h1 className="text-3xl font-bold text-gray-900 mb-3">Payment Successful!</h1>
          <p className="text-gray-600 mb-2">
            You've successfully paid <strong className="text-emerald-600">KES {amount.toFixed(2)}</strong>
          </p>
          <p className="text-gray-500 text-sm mb-8">
            Your consultation with {professionalName} is now confirmed
          </p>

          {/* Receipt Card */}
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 mb-8">
            <div className="flex items-center justify-center gap-2 mb-4">
              <FileText className="text-gray-600" size={20} />
              <h3 className="font-bold text-gray-900">Payment Receipt</h3>
            </div>
            
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Transaction ID:</span>
                <span className="font-mono font-semibold">{transactionId || 'N/A'}</span>
              </div>
              {mpesaReceipt && (
                <div className="flex justify-between">
                  <span className="text-gray-600">M-Pesa Receipt:</span>
                  <span className="font-mono font-semibold">{mpesaReceipt}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-600">Consultation ID:</span>
                <span className="font-semibold">#{consultationId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Amount:</span>
                <span className="font-bold text-emerald-600">KES {amount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Date:</span>
                <span>{new Date().toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Time:</span>
                <span>{new Date().toLocaleTimeString()}</span>
              </div>
            </div>
          </div>

          {/* Next Steps */}
          <div className="mb-8">
            <h3 className="font-bold text-gray-900 mb-3">What happens next?</h3>
            <div className="space-y-3 text-sm text-gray-600">
              <p className="flex items-start">
                <span className="bg-emerald-100 text-emerald-800 rounded-full w-5 h-5 flex items-center justify-center mr-2 mt-0.5 flex-shrink-0">✓</span>
                Professional has been notified of your payment
              </p>
              <p className="flex items-start">
                <span className="bg-emerald-100 text-emerald-800 rounded-full w-5 h-5 flex items-center justify-center mr-2 mt-0.5 flex-shrink-0">✓</span>
                Consultation session will be scheduled shortly
              </p>
              <p className="flex items-start">
                <span className="bg-emerald-100 text-emerald-800 rounded-full w-5 h-5 flex items-center justify-center mr-2 mt-0.5 flex-shrink-0">✓</span>
                You'll receive a notification when ready
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <button
              onClick={() => navigate(`/consultation/${consultationId}`)}
              className="w-full py-3 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700 transition-colors"
            >
              View Consultation Details
            </button>
            
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={handlePrintReceipt}
                className="py-3 bg-white border border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors flex items-center justify-center"
              >
                <Download size={18} className="mr-2" />
                Receipt
              </button>
              <button
                onClick={handleShare}
                className="py-3 bg-white border border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors flex items-center justify-center"
              >
                <Share2 size={18} className="mr-2" />
                Share
              </button>
            </div>
            
            <button
              onClick={() => navigate('/dashboard')}
              className="w-full py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-colors flex items-center justify-center"
            >
              <Home size={18} className="mr-2" />
              Go to Dashboard
            </button>
          </div>

          {/* Support Info */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-500 mb-2">Need help?</p>
            <button
              onClick={() => navigate('/support')}
              className="text-emerald-600 hover:text-emerald-800 font-medium"
            >
              Contact Customer Support →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}