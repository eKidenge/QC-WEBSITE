import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Alert,
  ActivityIndicator,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import ZegoUIKitPrebuiltCall, { ZegoInvitationType, ZegoUIKitPrebuiltCallIncomingNotification } from '@zegocloud/zego-uikit-prebuilt-call-rn';
import { requestMultiple, PERMISSIONS } from 'react-native-permissions';
import { Ionicons } from '@expo/vector-icons';

// Your Zego credentials
const ZEGO_APP_ID = 759871504;
const ZEGO_APP_SIGN = "9f5563be3a3913bb2d523da1e75d5a4f5d144168ca1e4329da67d5fe675e3db9";

export default function ProfessionalCallScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isInCall, setIsInCall] = useState(false);
  const [callData, setCallData] = useState(null);
  
  // Professional info - in real app, this should come from auth/login
  const [professionalInfo, setProfessionalInfo] = useState({
    userID: '',
    userName: '',
  });

  console.log('👨‍⚕️ PROFESSIONAL CALL SCREEN LOADED');
  console.log('Params:', params);

  // Initialize professional
  useEffect(() => {
    initializeProfessional();
  }, []);

  const initializeProfessional = async () => {
    try {
      // Request permissions
      await requestMultiple([
        PERMISSIONS.ANDROID.CAMERA,
        PERMISSIONS.ANDROID.RECORD_AUDIO,
        PERMISSIONS.ANDROID.READ_EXTERNAL_STORAGE,
        PERMISSIONS.ANDROID.WRITE_EXTERNAL_STORAGE,
      ]);

      // In real app, get professional ID from auth/login
      // For demo, generate or use params
      const professionalId = params.professionalId || `pro_${Date.now().toString().slice(-6)}`;
      const professionalName = params.professionalName || 'Professional';
      
      setProfessionalInfo({
        userID: professionalId,
        userName: professionalName,
      });

      setIsInitialized(true);
      setIsLoading(false);

      console.log('✅ Professional initialized:', {
        id: professionalId,
        name: professionalName
      });

      // Show notification that professional is ready
      Alert.alert(
        'Ready for Calls',
        `You are now available for calls.\n\nYour Professional ID: ${professionalId}`,
        [{ text: 'OK' }]
      );

    } catch (error) {
      console.error('Professional initialization error:', error);
      Alert.alert('Error', 'Failed to initialize call system');
      setIsLoading(false);
    }
  };

  const handleIncomingCall = (data) => {
    console.log('📞 Incoming call data:', data);
    setCallData(data);
    setIsInCall(true);
    
    Alert.alert(
      'Incoming Call',
      `Client is calling you...`,
      [
        { 
          text: 'Accept', 
          onPress: () => acceptCall(data) 
        },
        { 
          text: 'Decline', 
          style: 'cancel',
          onPress: () => declineCall(data)
        }
      ]
    );
  };

  const acceptCall = (data) => {
    console.log('✅ Accepting call:', data);
    // The Zego component will handle the actual call
    // We just need to show the call UI
  };

  const declineCall = (data) => {
    console.log('❌ Declining call:', data);
    setIsInCall(false);
    setCallData(null);
  };

  const handleCallEnd = () => {
    console.log('📞 Call ended');
    setIsInCall(false);
    setCallData(null);
    
    Alert.alert(
      'Call Ended',
      'The call has ended. You are now available for new calls.',
      [{ text: 'OK' }]
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4A148C" />
          <Text style={styles.loadingText}>Setting up professional call system...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color="#4A148C" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Professional Call</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Status Card */}
        <View style={styles.statusCard}>
          <View style={styles.statusIndicator}>
            <View style={[styles.statusDot, isInitialized && styles.statusDotActive]} />
            <Text style={styles.statusText}>
              {isInitialized ? '✅ Ready for calls' : '⏳ Initializing...'}
            </Text>
          </View>
          <Text style={styles.statusSubtext}>
            {isInitialized 
              ? 'Waiting for client calls...' 
              : 'Setting up audio/video permissions...'}
          </Text>
        </View>

        {/* Professional Info Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Your Professional Profile</Text>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Name:</Text>
            <Text style={styles.infoValue}>{professionalInfo.userName}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Professional ID:</Text>
            <Text style={styles.infoValue} selectable>{professionalInfo.userID}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Status:</Text>
            <View style={[styles.badge, isInitialized ? styles.badgeReady : styles.badgeLoading]}>
              <Text style={styles.badgeText}>
                {isInitialized ? 'Available' : 'Offline'}
              </Text>
            </View>
          </View>

          <TouchableOpacity 
            style={styles.copyButton}
            onPress={() => {
              Alert.alert('Copied!', 'Professional ID copied to clipboard');
            }}
          >
            <Text style={styles.copyButtonText}>📋 Copy Your ID</Text>
          </TouchableOpacity>
        </View>

        {/* Call Status Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Call Status</Text>
          
          {isInCall ? (
            <View style={styles.activeCallCard}>
              <Ionicons name="call" size={40} color="#10B981" />
              <Text style={styles.activeCallTitle}>In Call</Text>
              <Text style={styles.activeCallText}>
                You are currently in a call with a client.
              </Text>
            </View>
          ) : (
            <View style={styles.waitingCard}>
              <Ionicons name="call-outline" size={40} color="#6B7280" />
              <Text style={styles.waitingTitle}>Waiting for Calls</Text>
              <Text style={styles.waitingText}>
                You will receive a notification when a client calls you.
              </Text>
              <ActivityIndicator size="small" color="#4A148C" style={{ marginTop: 16 }} />
            </View>
          )}
        </View>

        {/* Instructions */}
        <View style={styles.instructionsCard}>
          <Text style={styles.instructionsTitle}>How it works:</Text>
          
          <View style={styles.instructionItem}>
            <Text style={styles.instructionNumber}>1</Text>
            <Text style={styles.instructionText}>
              Share your Professional ID with clients
            </Text>
          </View>
          
          <View style={styles.instructionItem}>
            <Text style={styles.instructionNumber}>2</Text>
            <Text style={styles.instructionText}>
              Clients will call using your Professional ID
            </Text>
          </View>
          
          <View style={styles.instructionItem}>
            <Text style={styles.instructionNumber}>3</Text>
            <Text style={styles.instructionText}>
              You will receive call notifications
            </Text>
          </View>
          
          <View style={styles.instructionItem}>
            <Text style={styles.instructionNumber}>4</Text>
            <Text style={styles.instructionText}>
              Accept calls to start consultation
            </Text>
          </View>
        </View>

        {/* Zego Call Component (hidden until call starts) */}
        {isInCall && callData && (
          <View style={styles.zegoContainer}>
            <ZegoUIKitPrebuiltCall
              appID={ZEGO_APP_ID}
              appSign={ZEGO_APP_SIGN}
              userID={professionalInfo.userID}
              userName={professionalInfo.userName}
              callID={callData.callID || `call_${Date.now()}`}
              config={{
                onHangUp: handleCallEnd,
                onOnlySelfInRoom: handleCallEnd,
                durationConfig: {
                  isVisible: true,
                },
                layout: {
                  type: 1, // Picture-in-picture layout
                },
              }}
            />
          </View>
        )}

        {/* Zego Incoming Notification Listener */}
        <ZegoUIKitPrebuiltCallIncomingNotification
          onIncomingCallReceived={handleIncomingCall}
          appID={ZEGO_APP_ID}
          appSign={ZEGO_APP_SIGN}
          userID={professionalInfo.userID}
          userName={professionalInfo.userName}
        />

        {/* Test Button (for demo) */}
        {__DEV__ && (
          <View style={styles.testCard}>
            <Text style={styles.testTitle}>🧪 Test Mode</Text>
            <Text style={styles.testText}>
              In development: Simulate incoming call
            </Text>
            <TouchableOpacity
              style={styles.testButton}
              onPress={() => handleIncomingCall({
                callID: `test_call_${Date.now()}`,
                callerName: 'Test Client',
                callType: ZegoInvitationType.videoCall,
              })}
            >
              <Text style={styles.testButtonText}>Simulate Incoming Call</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  loadingText: {
    marginTop: 20,
    fontSize: 16,
    color: '#4A148C',
    fontWeight: '500',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
    textAlign: 'center',
  },
  statusCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderLeftWidth: 4,
    borderLeftColor: '#4A148C',
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#D1D5DB',
    marginRight: 10,
  },
  statusDotActive: {
    backgroundColor: '#10B981',
  },
  statusText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  statusSubtext: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4A148C',
    flex: 1,
    textAlign: 'right',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeReady: {
    backgroundColor: '#DCFCE7',
  },
  badgeLoading: {
    backgroundColor: '#FEF3C7',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#065F46',
  },
  copyButton: {
    backgroundColor: '#EEF2FF',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#E0E7FF',
  },
  copyButtonText: {
    color: '#4F46E5',
    fontSize: 14,
    fontWeight: '600',
  },
  activeCallCard: {
    backgroundColor: '#F0FDF4',
    borderRadius: 8,
    padding: 20,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#10B981',
  },
  activeCallTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#065F46',
    marginTop: 12,
    marginBottom: 8,
  },
  activeCallText: {
    fontSize: 14,
    color: '#059669',
    textAlign: 'center',
    lineHeight: 20,
  },
  waitingCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 20,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
  },
  waitingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 12,
    marginBottom: 8,
  },
  waitingText: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 20,
  },
  instructionsCard: {
    backgroundColor: '#F0F9FF',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E0F2FE',
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0369A1',
    marginBottom: 12,
  },
  instructionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  instructionNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#0EA5E9',
    color: 'white',
    textAlign: 'center',
    lineHeight: 24,
    fontSize: 12,
    fontWeight: 'bold',
    marginRight: 12,
  },
  instructionText: {
    flex: 1,
    fontSize: 14,
    color: '#1E40AF',
    lineHeight: 20,
  },
  zegoContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
  },
  testCard: {
    backgroundColor: '#FEF3C7',
    borderRadius: 12,
    padding: 16,
    marginTop: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
  },
  testTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#92400E',
    marginBottom: 8,
  },
  testText: {
    fontSize: 13,
    color: '#B45309',
    marginBottom: 12,
    lineHeight: 18,
  },
  testButton: {
    backgroundColor: '#F59E0B',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  testButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
});