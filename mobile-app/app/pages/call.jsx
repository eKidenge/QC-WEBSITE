import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
  StatusBar,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import ZegoUIKitPrebuiltCall, {
  ZegoInvitationType,
  ZegoSendCallInvitationButton,
} from '@zegocloud/zego-uikit-prebuilt-call-rn';
import { requestMultiple, PERMISSIONS } from 'react-native-permissions';

// Your Zego credentials
const ZEGO_APP_ID = 759871504;
const ZEGO_APP_SIGN = "9f5563be3a3913bb2d523da1e75d5a4f5d144168ca1e4329da67d5fe675e3db9";

function randomID(len = 5) {
  let result = '';
  const chars = '12345qwertyuiopasdfgh67890jklmnbvcxzMNBVCZXASDQWERTYHGFUIOLKJP';
  const maxPos = chars.length;
  for (let i = 0; i < len; i++) {
    result += chars.charAt(Math.floor(Math.floor(Math.random() * maxPos)));
  }
  return result;
}

export default function CallScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [userInfo, setUserInfo] = useState({ userName: '', userID: '' });
  const [calleeId, setCalleeId] = useState('');
  const [professionalName, setProfessionalName] = useState('');
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  console.log('📞 CALL SCREEN LOADED with params:', params);

  // Auto-fill professional ID from payment success
  useEffect(() => {
    if (params.calleeId) {
      setCalleeId(params.calleeId);
    } else if (params.professional) {
      try {
        const professional = JSON.parse(params.professional);
        setCalleeId(professional.id || professional.user_id || '');
        setProfessionalName(professional.name || 'Professional');
      } catch (error) {
        console.error('Error parsing professional:', error);
      }
    } else if (params.professionalId) {
      setCalleeId(params.professionalId);
    }

    if (params.professionalName) {
      setProfessionalName(params.professionalName);
    }
  }, [params]);

  // Initialize user and permissions
  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      // Request permissions for Android
      await requestMultiple([
        PERMISSIONS.ANDROID.CAMERA,
        PERMISSIONS.ANDROID.RECORD_AUDIO,
        PERMISSIONS.ANDROID.READ_EXTERNAL_STORAGE,
        PERMISSIONS.ANDROID.WRITE_EXTERNAL_STORAGE,
      ]);

      // Generate user ID (client's ID)
      const userId = randomID(8);
      const userName = `client_${userId}`;
      
      setUserInfo({ userName, userID: userId });
      setIsInitialized(true);
      setIsLoading(false);
      
      console.log('User initialized:', { userName, userID: userId });
      console.log('Callee ID set to:', calleeId);
      console.log('Professional name:', professionalName);
    } catch (error) {
      console.error('Initialization error:', error);
      Alert.alert('Error', 'Failed to initialize call system');
      setIsLoading(false);
    }
  };

  const handleDirectCall = (callType) => {
    if (!calleeId.trim()) {
      Alert.alert('Error', 'Professional ID not found');
      return;
    }

    if (!isInitialized) {
      Alert.alert('Warning', 'Call system is still initializing');
      return;
    }

    Alert.alert(
      'Direct Call',
      `Would start ${callType} call to ${professionalName || 'Professional'}\n\nUse the Zego buttons for actual calls`
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4A148C" />
          <Text style={styles.loadingText}>Setting up call system...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#4A148C" barStyle="light-content" />
      
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header with back button */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Video Call</Text>
          <View style={{ width: 60 }} />
        </View>

        {/* Payment Success Info */}
        {params.paymentVerified === 'true' && (
          <View style={styles.successCard}>
            <Text style={styles.successTitle}>✅ Payment Verified</Text>
            <Text style={styles.successText}>
              Your payment has been confirmed. You can now call {professionalName || 'the professional'}.
            </Text>
          </View>
        )}

        {/* User Info Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Your Information</Text>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Your Name:</Text>
            <Text style={styles.infoValue}>{userInfo.userName}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Your ID:</Text>
            <Text style={styles.infoValue}>{userInfo.userID}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Status:</Text>
            <View style={styles.statusBadge}>
              <Text style={styles.statusText}>
                {isInitialized ? 'Ready to call' : 'Initializing...'}
              </Text>
            </View>
          </View>
        </View>

        {/* Professional Info Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Professional Information</Text>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Professional:</Text>
            <Text style={styles.infoValue}>
              {professionalName || 'Not specified'}
            </Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Professional ID:</Text>
            <TextInput
              style={[styles.input, !calleeId && styles.inputEmpty]}
              placeholder="Professional ID will auto-fill..."
              placeholderTextColor="#999"
              value={calleeId}
              onChangeText={setCalleeId}
              editable={true}
            />
          </View>
          
          <Text style={styles.inputHint}>
            {calleeId 
              ? `Ready to call ${professionalName || 'professional'}`
              : 'Enter professional ID or wait for auto-fill'}
          </Text>
        </View>

        {/* Call Buttons Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Start a Call</Text>
          
          {calleeId ? (
            <>
              {/* Voice Call Button */}
              <ZegoSendCallInvitationButton
                invitees={[{ userID: calleeId, userName: professionalName || 'Professional' }]}
                type={ZegoInvitationType.voiceCall}
                userID={userInfo.userID}
                userName={userInfo.userName}
                appID={ZEGO_APP_ID}
                appSign={ZEGO_APP_SIGN}
                style={styles.callButton}
                disabled={!isInitialized}
              >
                <View style={[styles.buttonContent, styles.voiceButton, !isInitialized && styles.buttonDisabled]}>
                  <Text style={styles.buttonText}>📞 Voice Call</Text>
                </View>
              </ZegoSendCallInvitationButton>

              {/* Video Call Button */}
              <ZegoSendCallInvitationButton
                invitees={[{ userID: calleeId, userName: professionalName || 'Professional' }]}
                type={ZegoInvitationType.videoCall}
                userID={userInfo.userID}
                userName={userInfo.userName}
                appID={ZEGO_APP_ID}
                appSign={ZEGO_APP_SIGN}
                style={styles.callButton}
                disabled={!isInitialized}
              >
                <View style={[styles.buttonContent, styles.videoButton, !isInitialized && styles.buttonDisabled]}>
                  <Text style={styles.buttonText}>📹 Video Call</Text>
                </View>
              </ZegoSendCallInvitationButton>
            </>
          ) : (
            <View style={styles.noCalleeContainer}>
              <Text style={styles.noCalleeText}>
                Waiting for professional ID...
              </Text>
              <Text style={styles.noCalleeSubtext}>
                This should auto-fill from payment. If not, enter the professional ID manually above.
              </Text>
            </View>
          )}

          {/* Test Buttons */}
          <View style={styles.testButtons}>
            <Text style={styles.testTitle}>Test Controls:</Text>
            <View style={styles.testButtonRow}>
              <TouchableOpacity
                style={[styles.testButton, styles.testVoiceButton]}
                onPress={() => handleDirectCall('voice')}
                disabled={!calleeId || !isInitialized}
              >
                <Text style={styles.testButtonText}>Test Voice</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.testButton, styles.testVideoButton]}
                onPress={() => handleDirectCall('video')}
                disabled={!calleeId || !isInitialized}
              >
                <Text style={styles.testButtonText}>Test Video</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Instructions */}
        <View style={styles.instructionsCard}>
          <Text style={styles.instructionsTitle}>How to Call:</Text>
          
          <View style={styles.instructionItem}>
            <Text style={styles.instructionNumber}>1</Text>
            <Text style={styles.instructionText}>
              {calleeId 
                ? `Call ${professionalName || 'the professional'} using buttons above`
                : 'Professional ID will auto-fill after payment'}
            </Text>
          </View>
          
          <View style={styles.instructionItem}>
            <Text style={styles.instructionNumber}>2</Text>
            <Text style={styles.instructionText}>
              Choose Voice (audio only) or Video (face-to-face) call
            </Text>
          </View>
          
          <View style={styles.instructionItem}>
            <Text style={styles.instructionNumber}>3</Text>
            <Text style={styles.instructionText}>
              Wait for the professional to accept your call
            </Text>
          </View>
          
          <View style={styles.instructionItem}>
            <Text style={styles.instructionNumber}>4</Text>
            <Text style={styles.instructionText}>
              Your call will start automatically when accepted
            </Text>
          </View>
        </View>

        {/* Debug Info (for testing) */}
        {__DEV__ && (
          <View style={styles.debugCard}>
            <Text style={styles.debugTitle}>Debug Info:</Text>
            <Text style={styles.debugText}>Client ID: {userInfo.userID}</Text>
            <Text style={styles.debugText}>Professional ID: {calleeId || 'Not set'}</Text>
            <Text style={styles.debugText}>Professional Name: {professionalName || 'Not set'}</Text>
            <Text style={styles.debugText}>Initialized: {isInitialized ? 'Yes' : 'No'}</Text>
            <Text style={styles.debugText}>Payment Verified: {params.paymentVerified || 'No'}</Text>
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
    padding: 10,
  },
  backButtonText: {
    color: '#4A148C',
    fontSize: 16,
    fontWeight: '500',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
    textAlign: 'center',
  },
  successCard: {
    backgroundColor: '#DCFCE7',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#10B981',
  },
  successTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#065F46',
    marginBottom: 8,
  },
  successText: {
    fontSize: 14,
    color: '#059669',
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
  statusBadge: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    color: '#4F46E5',
    fontSize: 12,
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    padding: 10,
    fontSize: 14,
    backgroundColor: '#FAFAFA',
    flex: 1,
    textAlign: 'right',
  },
  inputEmpty: {
    borderColor: '#FBBF24',
    backgroundColor: '#FFFBEB',
  },
  inputHint: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 8,
    fontStyle: 'italic',
  },
  callButton: {
    marginBottom: 10,
    borderRadius: 8,
    overflow: 'hidden',
  },
  buttonContent: {
    padding: 16,
    alignItems: 'center',
    borderRadius: 8,
  },
  voiceButton: {
    backgroundColor: '#4CAF50',
  },
  videoButton: {
    backgroundColor: '#2196F3',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  noCalleeContainer: {
    backgroundColor: '#FEF3C7',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  noCalleeText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#92400E',
    marginBottom: 8,
  },
  noCalleeSubtext: {
    fontSize: 14,
    color: '#B45309',
    textAlign: 'center',
    lineHeight: 20,
  },
  testButtons: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  testTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 12,
  },
  testButtonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  testButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  testVoiceButton: {
    backgroundColor: '#D1FAE5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  testVideoButton: {
    backgroundColor: '#DBEAFE',
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  testButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#065F46',
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
  debugCard: {
    backgroundColor: '#1F2937',
    borderRadius: 12,
    padding: 16,
    marginTop: 20,
  },
  debugTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#60A5FA',
    marginBottom: 8,
  },
  debugText: {
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 4,
    fontFamily: 'monospace',
  },
});