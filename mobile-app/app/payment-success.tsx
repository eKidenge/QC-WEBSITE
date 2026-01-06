import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, Alert, ActivityIndicator, ScrollView } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useState, useEffect, useRef, useCallback } from 'react';
import { Ionicons } from '@expo/vector-icons';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';

interface PaymentData {
  id: string;
  amount: number;
  currency: string;
  method: string;
  status: string;
  transactionId: string;
  timestamp: string;
  professionalName: string;
  consultationType: string;
  sessionId: string;
}

interface ReceiptData {
  receiptNumber: string;
  date: string;
  time: string;
  clientName: string;
  clientEmail: string;
  professionalName: string;
  service: string;
  amount: number;
  transactionId: string;
  paymentMethod: string;
}

export default function PaymentSuccessScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [payment, setPayment] = useState<PaymentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [generatingReceipt, setGeneratingReceipt] = useState(false);
  const [receiptData, setReceiptData] = useState<ReceiptData | null>(null);
  
  const processedTransactions = useRef<Set<string>>(new Set());
  const initializationComplete = useRef(false);
  const API_BASE_URL = 'https://dalmas.pythonanywhere.com/api';

  console.log('🔴🔴🔴 PAYMENT SUCCESS PAGE LOADED 🔴🔴🔴');
  console.log('File: app/payment-success.tsx');
  console.log('Params received:', params);

  const initializePaymentData = useCallback(async () => {
    try {
      if (initializationComplete.current) {
        console.log('🔄 Initialization already completed, skipping...');
        return;
      }

      setLoading(true);
      initializationComplete.current = true;

      console.log('🎉 PaymentSuccess params:', params);

      const professional = params.professional ? JSON.parse(params.professional as string) : null;
      const amount = parseInt(params.amount as string) || 0;
      const transactionId = params.transactionId as string || params.checkoutRequestId as string || `TXN_${Date.now()}`;
      const consultationType = params.consultationType as string || 'consultation';
      const session = params.session ? JSON.parse(params.session as string) : null;

      console.log('📊 Payment data extracted:', {
        professional,
        amount,
        transactionId,
        consultationType,
        session
      });

      if (processedTransactions.current.has(transactionId)) {
        console.log('🔄 Transaction already processed, skipping...');
        createPaymentData(professional, amount, transactionId, consultationType, session);
        setLoading(false);
        return;
      }

      processedTransactions.current.add(transactionId);

      await recordPaymentWithRetry({
        amount: amount,
        professionalId: professional?.id,
        sessionId: session?.session_id || session?.id,
        paymentMethod: 'mpesa',
        transactionId: transactionId,
        clientId: '1'
      });

      createPaymentData(professional, amount, transactionId, consultationType, session);
      await unlockSession(session?.session_id || session?.id);

    } catch (error) {
      console.error('Payment initialization error:', error);
      createFallbackPaymentData();
    } finally {
      setLoading(false);
    }
  }, [params]);

  useEffect(() => {
    if (params.professional && !initializationComplete.current) {
      console.log('🚀 Initializing payment data...');
      initializePaymentData();
    } else if (initializationComplete.current) {
      console.log('🔄 Already initialized, skipping...');
      setLoading(false);
    } else if (!params.professional) {
      console.log('❌ Missing professional data, cannot initialize');
      setLoading(false);
    }
  }, [initializePaymentData, params.professional]);

  const recordPaymentWithRetry = async (paymentData: any, retries = 3): Promise<boolean> => {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        console.log(`📝 Recording payment attempt ${attempt}/${retries}...`);
        
        const paymentResponse = await fetch(`${API_BASE_URL}/record_payment/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(paymentData)
        });

        if (paymentResponse.ok) {
          const paymentResult = await paymentResponse.json();
          console.log('✅ Payment recorded in database:', paymentResult);
          return true;
        } else {
          console.log(`⚠️ Payment recording failed (attempt ${attempt}):`, paymentResponse.status);
          
          if (paymentResponse.status >= 400 && paymentResponse.status < 500) {
            console.log('🛑 Client error, stopping retries');
            break;
          }
        }
      } catch (dbError) {
        console.log(`⚠️ Database recording error (attempt ${attempt}):`, dbError);
      }

      if (attempt < retries) {
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }
    }

    console.log('❌ All payment recording attempts failed, but continuing...');
    return false;
  };

  const createPaymentData = (professional: any, amount: number, transactionId: string, consultationType: string, session: any) => {
    const paymentData: PaymentData = {
      id: `payment_${Date.now()}`,
      amount: amount,
      currency: 'KES',
      method: 'M-Pesa',
      status: 'completed',
      transactionId: transactionId,
      timestamp: new Date().toISOString(),
      professionalName: professional?.name || 'Professional',
      consultationType: consultationType,
      sessionId: session?.session_id || session?.id || `sess_${Date.now()}`
    };

    setPayment(paymentData);
    
    const receipt: ReceiptData = {
      receiptNumber: `RCP${Date.now()}`,
      date: new Date().toLocaleDateString(),
      time: new Date().toLocaleTimeString(),
      clientName: 'Client',
      clientEmail: 'client@example.com',
      professionalName: professional?.name || 'Professional',
      service: `${consultationType.charAt(0).toUpperCase() + consultationType.slice(1)} Consultation`,
      amount: amount,
      transactionId: transactionId,
      paymentMethod: 'M-Pesa'
    };
    
    setReceiptData(receipt);
    
    sendReceiptNotification(receipt).catch(error => 
      console.error('Receipt notification failed:', error)
    );
  };

  const createFallbackPaymentData = () => {
    const fallbackPayment: PaymentData = {
      id: `fallback_${Date.now()}`,
      amount: parseInt(params.amount as string) || 0,
      currency: 'KES',
      method: 'M-Pesa',
      status: 'completed',
      transactionId: params.transactionId as string || `TXN_${Date.now()}`,
      timestamp: new Date().toISOString(),
      professionalName: 'Professional',
      consultationType: params.consultationType as string || 'Consultation',
      sessionId: ''
    };
    
    setPayment(fallbackPayment);
    
    Alert.alert(
      'Payment Successful!',
      'Your payment was processed successfully. You can now start your session.'
    );
  };

  const unlockSession = async (sessionId: string) => {
    if (!sessionId) {
      console.log('🔓 No session ID provided for unlocking');
      return;
    }

    try {
      console.log('🔓 Unlocking session:', sessionId);
      
      const response = await fetch(`${API_BASE_URL}/update_session_status/${sessionId}/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'active',
          professional_id: params.professional ? JSON.parse(params.professional as string)?.id : null
        })
      });

      if (response.ok) {
        console.log('✅ Session unlocked and ready');
      } else {
        console.log('⚠️ Session status update failed:', response.status);
      }
    } catch (error) {
      console.error('Session unlock error:', error);
    }
  };

  const sendReceiptNotification = async (receipt: ReceiptData): Promise<void> => {
    try {
      console.log('📧 Sending receipt notification...');
      
      const response = await fetch(`${API_BASE_URL}/send_receipt_notification/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          receiptData: receipt,
          clientId: '1',
          sendEmail: true,
          sendSMS: false
        })
      });
      
      if (response.ok) {
        console.log('✅ Receipt notification sent');
      } else {
        console.log('⚠️ Receipt notification failed:', response.status);
      }
    } catch (error) {
      console.error('Receipt notification error:', error);
      throw error;
    }
  };

  const generateReceiptHTML = (receipt: ReceiptData): string => {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Payment Receipt</title>
        <style>
          body { 
            font-family: Arial, sans-serif; 
            margin: 0; 
            padding: 20px; 
            color: #333; 
          }
          .header { 
            text-align: center; 
            border-bottom: 2px solid #10B981; 
            padding-bottom: 20px; 
            margin-bottom: 20px; 
          }
          .company-name { 
            font-size: 24px; 
            font-weight: bold; 
            color: #111827; 
          }
          .receipt-title { 
            font-size: 20px; 
            color: #059669; 
            margin: 10px 0; 
          }
          .details { 
            margin: 20px 0; 
          }
          .detail-row { 
            display: flex; 
            justify-content: space-between; 
            margin-bottom: 8px; 
            padding: 8px 0;
            border-bottom: 1px solid #E5E7EB;
          }
          .detail-label { 
            font-weight: 600; 
            color: #6B7280; 
          }
          .detail-value { 
            color: #111827; 
          }
          .amount-section { 
            background: #F0F9FF; 
            padding: 15px; 
            borderRadius: 8px; 
            margin: 20px 0; 
          }
          .total-amount { 
            font-size: 24px; 
            font-weight: bold; 
            color: #059669; 
            text-align: center; 
          }
          .footer { 
            text-align: center; 
            margin-top: 30px; 
            padding-top: 20px; 
            border-top: 1px solid #E5E7EB; 
            color: #6B7280; 
            font-size: 12px; 
          }
          .thank-you { 
            text-align: center; 
            margin: 20px 0; 
            font-style: italic; 
            color: #6B7280; 
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="company-name">TeleConnect</div>
          <div class="receipt-title">PAYMENT RECEIPT</div>
        </div>
        
        <div class="details">
          <div class="detail-row">
            <span class="detail-label">Receipt Number:</span>
            <span class="detail-value">${receipt.receiptNumber}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Date:</span>
            <span class="detail-value">${receipt.date}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Time:</span>
            <span class="detail-value">${receipt.time}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Transaction ID:</span>
            <span class="detail-value">${receipt.transactionId}</span>
          </div>
        </div>
        
        <div class="details">
          <div class="detail-row">
            <span class="detail-label">Client:</span>
            <span class="detail-value">${receipt.clientName}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Professional:</span>
            <span class="detail-value">${receipt.professionalName}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Service:</span>
            <span class="detail-value">${receipt.service}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Payment Method:</span>
            <span class="detail-value">${receipt.paymentMethod}</span>
          </div>
        </div>
        
        <div class="amount-section">
          <div class="total-amount">KSH ${receipt.amount.toLocaleString()}</div>
        </div>
        
        <div class="thank-you">
          Thank you for your payment. This receipt confirms your transaction.
        </div>
        
        <div class="footer">
          <p>TeleConnect Limited</p>
          <p>support@teleconnect.com | +254 700 000 000</p>
          <p>This is an computer-generated receipt. No signature required.</p>
        </div>
      </body>
      </html>
    `;
  };

  const printReceipt = async () => {
    if (!receiptData) {
      Alert.alert('Error', 'Receipt data not available');
      return;
    }

    try {
      setGeneratingReceipt(true);
      
      const html = generateReceiptHTML(receiptData);
      
      const { uri } = await Print.printToFileAsync({
        html: html,
        base64: false
      });

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType: 'application/pdf',
          dialogTitle: 'Save Payment Receipt',
          UTI: 'com.adobe.pdf'
        });
      } else {
        Alert.alert('Success', 'Receipt generated successfully. PDF saved to device.');
      }
    } catch (error) {
      console.error('Print error:', error);
      Alert.alert('Error', 'Failed to generate receipt. Please try again.');
    } finally {
      setGeneratingReceipt(false);
    }
  };

  // UPDATED: Direct to call page
  const startSession = () => {
    console.log('🔍 Starting CALL session with params:', params);

    const professional = params.professional ? JSON.parse(params.professional as string) : null;
    const consultationType = params.consultationType as string || 'call';

    console.log('🚀 Call session start attempt:', { 
      professional: professional?.name,
      consultationType 
    });

    if (!professional) {
      Alert.alert('Error', 'Professional information missing');
      return;
    }

    const professionalId = professional?.id || professional?.user_id || professional?.professional_id || '';
    
    if (!professionalId) {
      Alert.alert('Error', 'Professional ID not found');
      return;
    }

    console.log('✅ Starting call with:', { 
      professionalId, 
      professionalName: professional.name,
      consultationType 
    });

    // Navigate to CALL screen instead of session screen
    router.push({
      pathname: '/call',
      params: { 
        professional: JSON.stringify(professional),
        calleeId: professionalId,
        professionalName: professional?.name || 'Professional',
        consultationType: consultationType,
        paymentVerified: 'true',
        amount: params.amount || '0',
        transactionId: params.transactionId || params.checkoutRequestId || `TXN_${Date.now()}`
      }
    });
  };

  const contactSupport = () => {
    Alert.alert(
      'Contact Support',
      'Email: support@teleconnect.com\nPhone: 0700 000 000',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'OK', style: 'default' }
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Finalizing your payment...</Text>
          <Text style={styles.loadingSubtext}>Unlocking your session...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.debugBanner}>
        <Text style={styles.debugBannerText}>
          DIRECT-CONNECT TECHNOLOGIES
        </Text>
        <Text style={styles.debugBannerSubtext}>
          "Skip the search, get the answer."
        </Text>
      </View>

      <ScrollView style={styles.scrollContent}>
        <View style={styles.content}>
          <View style={styles.successHeader}>
            <Ionicons name="checkmark-circle" size={100} color="#10B981" />
            <Text style={styles.title}>Payment Successful!</Text>
            <Text style={styles.subtitle}>
              Your payment has been processed successfully. You can now start your call with the professional.
            </Text>
          </View>

          {payment && (
            <View style={styles.detailsCard}>
              <Text style={styles.cardTitle}>Payment Details</Text>
              
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Amount Paid</Text>
                <Text style={styles.detailValue}>KSH {payment.amount.toLocaleString()}</Text>
              </View>
              
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Payment Method</Text>
                <Text style={styles.detailValue}>{payment.method}</Text>
              </View>
              
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Transaction ID</Text>
                <Text style={styles.detailValue}>{payment.transactionId}</Text>
              </View>
              
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Professional</Text>
                <Text style={styles.detailValue}>{payment.professionalName}</Text>
              </View>
              
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Service</Text>
                <Text style={styles.detailValue}>{payment.consultationType}</Text>
              </View>
              
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Status</Text>
                <View style={styles.statusBadge}>
                  <Text style={styles.statusText}>Completed</Text>
                </View>
              </View>
            </View>
          )}

          <View style={styles.sessionCard}>
            <Ionicons name="call" size={40} color="#10B981" />
            <Text style={styles.sessionTitle}>Call Unlocked! 🎉</Text>
            <Text style={styles.sessionText}>
              Your {params.consultationType} call with {payment?.professionalName} is now ready to start.
            </Text>
          </View>

          <View style={[styles.actionsCard, { borderColor: '#2563EB', borderWidth: 2 }]}>
            <Text style={[styles.cardTitle, { color: '#2563EB' }]}>📄 Receipt & Records</Text>
            
            <TouchableOpacity 
              style={[styles.receiptButton, { backgroundColor: '#8B5CF6' }]}
              onPress={printReceipt}
              disabled={generatingReceipt}
            >
              {generatingReceipt ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <Ionicons name="receipt" size={24} color="#fff" />
                  <Text style={styles.receiptButtonText}>
                    📥 DOWNLOAD RECEIPT
                  </Text>
                </>
              )}
            </TouchableOpacity>
            
            <Text style={{ fontSize: 12, color: '#6B7280', textAlign: 'center', marginTop: 8 }}>
              {receiptData ? `Receipt #${receiptData.receiptNumber} ready` : 'Generating receipt...'}
            </Text>
          </View>

          <View style={styles.infoCard}>
            <Text style={styles.cardTitle}>What's Next?</Text>
            <View style={styles.infoItem}>
              <Ionicons name="checkmark-circle" size={16} color="#10B981" />
              <Text style={styles.infoText}>Payment verified and recorded</Text>
            </View>
            <View style={styles.infoItem}>
              <Ionicons name="checkmark-circle" size={16} color="#10B981" />
              <Text style={styles.infoText}>Professional notified and waiting</Text>
            </View>
            <View style={styles.infoItem}>
              <Ionicons name="checkmark-circle" size={16} color="#10B981" />
              <Text style={styles.infoText}>Call session activated and ready</Text>
            </View>
            <View style={styles.infoItem}>
              <Ionicons name="checkmark-circle" size={16} color="#10B981" />
              <Text style={styles.infoText}>Receipt sent to your records</Text>
            </View>
          </View>

          <View style={styles.supportSection}>
            <Text style={styles.supportTitle}>Need Help?</Text>
            <Text style={styles.supportText}>
              If you have any issues starting your call, contact our support team.
            </Text>
            <TouchableOpacity 
              style={styles.supportButton}
              onPress={contactSupport}
            >
              <Ionicons name="headset" size={16} color="#2563EB" />
              <Text style={styles.supportButtonText}>Contact Support</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity 
          style={styles.primaryButton}
          onPress={startSession}
        >
          <Ionicons name="call" size={20} color="#fff" />
          <Text style={styles.primaryButtonText}>Start Call Now</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.outlineButton}
          onPress={() => router.push('/dashboard')}
        >
          <Text style={styles.outlineButtonText}>Return to Dashboard</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#F9FAFB' 
  },
  debugBanner: {
    backgroundColor: 'red', 
    padding: 12, 
    alignItems: 'center',
    zIndex: 1000,
  },
  debugBannerText: {
    color: 'white', 
    fontSize: 16, 
    fontWeight: 'bold',
    textAlign: 'center',
  },
  debugBannerSubtext: {
    color: 'white', 
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
  },
  scrollContent: {
    flex: 1,
  },
  content: { 
    padding: 20, 
    paddingBottom: 120,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 18,
    color: '#1F2937',
    fontWeight: '600',
  },
  loadingSubtext: {
    marginTop: 8,
    fontSize: 14,
    color: '#6B7280',
  },
  successHeader: {
    alignItems: 'center',
    marginBottom: 24,
    paddingVertical: 20,
  },
  title: { 
    fontSize: 28, 
    fontWeight: '800', 
    color: '#111827', 
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16, 
    color: '#6B7280', 
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 20,
  },
  detailsCard: {
    backgroundColor: '#fff', 
    borderRadius: 16, 
    padding: 20, 
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  sessionCard: {
    backgroundColor: '#F0FDF4',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    alignItems: 'center',
    borderLeftWidth: 4,
    borderLeftColor: '#10B981',
  },
  sessionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#065F46',
    marginTop: 12,
    marginBottom: 8,
  },
  sessionText: {
    fontSize: 14,
    color: '#059669',
    textAlign: 'center',
    lineHeight: 20,
  },
  actionsCard: {
    backgroundColor: '#fff', 
    borderRadius: 16, 
    padding: 20, 
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  infoCard: {
    backgroundColor: '#fff', 
    borderRadius: 16, 
    padding: 20, 
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18, 
    fontWeight: '700', 
    color: '#111827', 
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  detailLabel: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '600',
  },
  statusBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    color: '#059669',
    fontSize: 12,
    fontWeight: '600',
  },
  receiptButton: {
    backgroundColor: '#2563EB',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    gap: 8,
  },
  receiptButtonText: {
    color: '#fff', 
    fontSize: 16, 
    fontWeight: '600',
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#6B7280',
    flex: 1,
  },
  supportSection: {
    backgroundColor: '#F0F9FF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#2563EB',
  },
  supportTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  supportText: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 12,
    lineHeight: 20,
  },
  supportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    alignSelf: 'flex-start',
  },
  supportButtonText: {
    color: '#2563EB',
    fontSize: 14,
    fontWeight: '600',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  primaryButton: {
    backgroundColor: '#10B981',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    gap: 8,
  },
  primaryButtonText: {
    color: '#fff', 
    fontSize: 16, 
    fontWeight: '700',
  },
  outlineButton: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  outlineButtonText: {
    color: '#111827', 
    fontSize: 16, 
    fontWeight: '600',
  },
});