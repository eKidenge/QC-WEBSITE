import React, { useEffect, useState, useRef } from 'react';
import { 
  Phone, 
  Video, 
  User, 
  Bell, 
  Settings,
  LogOut,
  Clock,
  Calendar,
  DollarSign,
  Activity,
  Wifi,
  WifiOff,
  RefreshCw,
  Zap,
  Users,
  Star,
  TrendingUp,
  Shield,
  PhoneCall,
  PhoneOff,
  PhoneIncoming,
  UserCheck,
  BarChart3,
  Headphones,
  Camera,
  Mic,
  X
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ZIM } from "zego-zim-web";
import { ZegoUIKitPrebuilt } from '@zegocloud/zego-uikit-prebuilt';

// Define interfaces
interface User {
  id: number;
  email: string;
  full_name: string;
}

interface ProfessionalProfile {
  id: number;
  user: User;
  hourly_rate: number;
  bio?: string;
  experience_years?: number;
  is_online: boolean;
  last_seen?: string;
}

interface CallRequest {
  id: number;
  professional: number;
  client_id: string;
  client_name: string;
  client_phone?: string;
  call_type: 'voice' | 'video';
  duration: number;
  consultation_id?: string;
  amount: number;
  category: string;
  status: string;
  room_id: string;
  expires_at: string;
  created_at: string;
}

interface ProfessionalStat {
  id: number;
  professional: number;
  today_earnings: number;
  today_consultations: number;
  week_earnings: number;
  week_hours: number;
  total_consultations: number;
  average_rating: number;
}

interface ProfessionalAvailability {
  id: number;
  professional: number;
  is_available: boolean;
  auto_accept_calls: boolean;
}

const ProfessionalDashboard = () => {
  const navigate = useNavigate();
  
  // API Configuration
  const API_BASE_URL = 'https://dc-backend-6xlc.onrender.com/api';
  
  // State
  const [professionalProfile, setProfessionalProfile] = useState<ProfessionalProfile | null>(null);
  const [availability, setAvailability] = useState<ProfessionalAvailability | null>(null);
  const [stats, setStats] = useState<ProfessionalStat | null>(null);
  const [incomingCalls, setIncomingCalls] = useState<CallRequest[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  
  // UI State
  const [isOnline, setIsOnline] = useState(false);
  const [showIncomingCallModal, setShowIncomingCallModal] = useState(false);
  const [currentCall, setCurrentCall] = useState<CallRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [callStatus, setCallStatus] = useState<'idle' | 'ringing' | 'connecting' | 'active'>('idle');
  
  // Zego State
  const [zegoInstance, setZegoInstance] = useState<any>(null);
  const [isInCall, setIsInCall] = useState(false);
  
  // Refs
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const callContainerRef = useRef<HTMLDivElement>(null);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const zegoInitialized = useRef(false);
  const modalAlreadyShownRef = useRef(false);
  
  // Get professional ID from localStorage
  const getProfessionalId = (): number | null => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      try {
        const userData = JSON.parse(savedUser);
        return userData.id || null;
      } catch (e) {
        console.error('Error parsing user data:', e);
      }
    }
    return professionalProfile?.id || null;
  };
  
  // Get user name
  const getUserName = (): string => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      try {
        const userData = JSON.parse(savedUser);
        if (userData.full_name) return userData.full_name;
        if (userData.name) return userData.name;
        if (userData.first_name && userData.last_name) return `${userData.first_name} ${userData.last_name}`;
        if (userData.first_name) return userData.first_name;
        if (userData.username) return userData.username;
        if (userData.email) return userData.email.split('@')[0];
      } catch (e) {
        console.error('Error parsing localStorage user:', e);
      }
    }
    return 'Professional';
  };
  
  // Initialize Zego
  const initializeZego = () => {
    if (zegoInitialized.current) {
      console.log('Zego already initialized');
      return;
    }
    
    try {
      const professionalId = getProfessionalId();
      if (!professionalId) {
        console.log('Professional ID not available for Zego initialization');
        return;
      }
      
      const appID = 1178040486;
      const serverSecret = "373ecf17185d1d8c94b03169895a336e";
      const professionalName = getUserName();
      const roomId = `room_${professionalId}`;
      
      console.log('🚀 Initializing Zego for professional:', {
        professionalId,
        professionalName,
        roomId
      });
      
      const TOKEN = ZegoUIKitPrebuilt.generateKitTokenForTest(
        appID, 
        serverSecret,
        roomId,
        String(professionalId), 
        professionalName
      );

      const zp = ZegoUIKitPrebuilt.create(TOKEN);
      zp.addPlugins({ ZIM });
      setZegoInstance(zp);
      zegoInitialized.current = true;
      
      console.log("✅ Zego instance created successfully");
    } catch (error) {
      console.error("❌ Failed to create Zego instance:", error);
    }
  };
  
  // Fetch professional data
  const fetchProfessionalData = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('No token found');
        navigate('/login');
        return;
      }
      
      console.log('🔍 Fetching professional data...');
      
      // Fetch profile
      const profileRes = await fetch(`${API_BASE_URL}/dashboard/profile/`, {
        headers: { 'Authorization': `Token ${token}` }
      });
      
      if (profileRes.ok) {
        const profileData = await profileRes.json();
        console.log('✅ Profile loaded:', profileData);
        setProfessionalProfile(profileData);
        setIsOnline(profileData.is_online);
        
        // Initialize Zego now that we have profile
        if (!zegoInitialized.current) {
          initializeZego();
        }
      } else {
        console.error('Profile API error:', profileRes.status);
      }
      
      // Fetch availability
      try {
        const availabilityRes = await fetch(`${API_BASE_URL}/dashboard/availability/`, {
          headers: { 'Authorization': `Token ${token}` }
        });
        if (availabilityRes.ok) {
          const availabilityData = await availabilityRes.json();
          setAvailability(availabilityData);
        }
      } catch (e) {
        console.log('Availability not loaded');
      }
      
      // Fetch stats
      try {
        const statsRes = await fetch(`${API_BASE_URL}/dashboard/stats/`, {
          headers: { 'Authorization': `Token ${token}` }
        });
        if (statsRes.ok) {
          const statsData = await statsRes.json();
          setStats(statsData);
        }
      } catch (e) {
        console.log('Stats not loaded');
      }
      
    } catch (error) {
      console.error('❌ Error fetching professional data:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // Check for new calls - UPDATED
  const checkForNewCalls = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.log('❌ No token');
        return;
      }
      
      console.log('🔔 Checking for incoming calls...');
      
      const response = await fetch(`${API_BASE_URL}/call-requests/pending/`, {
        headers: { 'Authorization': `Token ${token}` }
      });
      
      if (!response.ok) {
        console.log('Call request API error:', response.status);
        return;
      }
      
      const data = await response.json();
      console.log('📞 Call request response:', data);
      
      if (data.pending_calls && Array.isArray(data.pending_calls)) {
        console.log(`✅ Found ${data.pending_calls.length} pending calls`);
        
        // Filter for PENDING calls only (not ringing, accepted, etc.)
        const pendingCalls = data.pending_calls.filter((call: any) => 
          call.status === 'pending' || !call.status
        );
        
        console.log(`📊 ${pendingCalls.length} truly pending calls`);
        
        const calls = pendingCalls.map((call: any) => ({
          id: call.id,
          professional: call.professional || getProfessionalId(),
          client_id: call.client_id || '',
          client_name: call.client_name || 'Client',
          client_phone: call.client_phone || '',
          call_type: call.call_type || 'video',
          duration: call.duration || 30,
          consultation_id: call.consultation_id || '',
          amount: call.amount || 0,
          category: call.category || 'Consultation',
          status: 'pending',
          room_id: call.room_id || `room_${getProfessionalId()}`,
          expires_at: call.expires_at || new Date(Date.now() + 60000).toISOString(),
          created_at: call.created_at || new Date().toISOString()
        }));
        
        setIncomingCalls(calls);
        
        // Show modal if we have NEW pending calls and no modal is showing
        if (calls.length > 0 && !showIncomingCallModal && !isInCall && !currentCall && !modalAlreadyShownRef.current) {
          const latestCall = calls[0];
          console.log('🚨 Showing incoming call modal for:', latestCall);
          handleNewIncomingCall(latestCall);
          modalAlreadyShownRef.current = true;
        } else if (calls.length === 0) {
          // Reset modal flag if no pending calls
          modalAlreadyShownRef.current = false;
        }
      }
    } catch (error) {
      console.error('Error checking calls:', error);
    }
  };
  
  const handleNewIncomingCall = (call: CallRequest) => {
    console.log('🎯 New incoming call received:', call);
    setCurrentCall(call);
    setShowIncomingCallModal(true);
    setCallStatus('ringing');
    
    // Play ringtone
    if (audioRef.current) {
      audioRef.current.src = 'https://assets.mixkit.co/active_storage/sfx/210/210-preview.mp3';
      audioRef.current.loop = true;
      audioRef.current.play().catch(e => console.log('Audio play failed:', e));
    }
    
    // Update call status to 'ringing' - THIS NOTIFIES THE CLIENT
    updateCallStatus(call.id, 'ringing');
  };
  
  const updateCallStatus = async (callId: number, status: string, additionalData?: any) => {
    try {
      const token = localStorage.getItem('token');
      const body = { status, ...additionalData };
      
      console.log(`🔄 Updating call ${callId} status to:`, status);
      
      const response = await fetch(`${API_BASE_URL}/call-requests/${callId}/update-status/`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Token ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body)
      });
      
      if (response.ok) {
        console.log(`✅ Call ${callId} status updated to ${status}`);
        return await response.json();
      } else {
        const errorText = await response.text();
        console.error(`❌ Failed to update call ${callId} status:`, errorText);
        throw new Error(`Failed to update call status: ${response.status}`);
      }
    } catch (error) {
      console.error('Error updating call status:', error);
      throw error;
    }
  };
  
  const acceptCall = async () => {
    if (!currentCall || !zegoInstance) {
      console.error('Cannot accept call: missing call or Zego instance');
      return;
    }
    
    setCallStatus('connecting');
    console.log('🔄 Accepting call:', currentCall.id);
    
    try {
      const token = localStorage.getItem('token');
      const professionalId = getProfessionalId();
      
      if (!professionalId) {
        throw new Error('Professional ID not found');
      }
      
      // 1. Update status to 'accepted' - THIS NOTIFIES THE CLIENT
      console.log('📤 Notifying client about acceptance...');
      const acceptedCall = await updateCallStatus(currentCall.id, 'accepted', {
        accepted_at: new Date().toISOString(),
        professional_id: professionalId
      });
      
      console.log('✅ Client notified, accepted call:', acceptedCall);
      
      // 2. Stop ringtone
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
      
      // 3. Update status to 'connecting'
      await updateCallStatus(currentCall.id, 'connecting', {
        connected_at: new Date().toISOString()
      });
      
      // 4. Join the room
      const roomId = acceptedCall.room_id || `room_${professionalId}`;
      const professionalName = getUserName();
      
      console.log('🎯 Joining Zego room:', roomId);
      
      const appID = 1178040486;
      const serverSecret = "373ecf17185d1d8c94b03169895a336e";
      
      const TOKEN = ZegoUIKitPrebuilt.generateKitTokenForTest(
        appID, 
        serverSecret,
        roomId,
        String(professionalId), 
        professionalName
      );
      
      // Clear container
      if (callContainerRef.current) {
        callContainerRef.current.innerHTML = '';
      }
      
      // Room configuration
      const roomConfig = {
        container: callContainerRef.current,
        scenario: {
          mode: ZegoUIKitPrebuilt.OneONoneCall,
        },
        turnOnMicrophoneWhenJoining: true,
        turnOnCameraWhenJoining: currentCall.call_type === 'video',
        showTextChat: true,
        showUserList: true,
        showPreJoinView: false,
        maxUsers: 2,
        layout: "Auto",
        showScreenSharingButton: true,
        showLeavingView: true,
        onLeaveRoom: () => {
          console.log('👋 Leaving room');
          handleEndCall();
        },
        onJoinRoom: () => {
          console.log('✅ Joined room successfully');
          
          // Update status to 'connected'
          updateCallStatus(currentCall.id, 'connected', {
            connected_at: new Date().toISOString()
          });
          
          setCallStatus('active');
          setIsInCall(true);
          setShowIncomingCallModal(false);
          setCurrentCall(null);
          modalAlreadyShownRef.current = false;
        },
        onUserJoin: (users: any[]) => {
          console.log('👤 Client joined:', users);
        },
        onUserLeave: (users: any[]) => {
          console.log('👋 Client left:', users);
          if (users.length === 0) {
            handleEndCall();
          }
        }
      };
      
      // Join room
      console.log('🚀 Joining Zego room...');
      await zegoInstance.joinRoom(roomId, TOKEN, roomConfig);
      
    } catch (error: any) {
      console.error('❌ Error accepting call:', error);
      alert(`Failed to accept call: ${error.message}`);
      setCallStatus('idle');
      modalAlreadyShownRef.current = false;
    }
  };
  
  const handleEndCall = async () => {
    console.log('📞 Ending call');
    
    if (zegoInstance) {
      try {
        zegoInstance.leaveRoom();
      } catch (error) {
        console.error('Error leaving room:', error);
      }
    }
    
    if (currentCall) {
      try {
        await updateCallStatus(currentCall.id, 'ended', {
          ended_at: new Date().toISOString()
        });
      } catch (error) {
        console.error('Error updating call end status:', error);
      }
    }
    
    setIsInCall(false);
    setCallStatus('idle');
    setCurrentCall(null);
    modalAlreadyShownRef.current = false;
    
    if (callContainerRef.current) {
      callContainerRef.current.innerHTML = '';
    }
    
    // Refresh data
    fetchProfessionalData();
  };
  
  const rejectCall = async (reason?: string) => {
    if (!currentCall) return;
    
    try {
      console.log('❌ Rejecting call:', currentCall.id);
      
      await updateCallStatus(currentCall.id, 'rejected', {
        rejected_at: new Date().toISOString(),
        rejection_reason: reason || 'Not available'
      });
      
      // Stop ringtone
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
      
      setShowIncomingCallModal(false);
      setCurrentCall(null);
      setCallStatus('idle');
      modalAlreadyShownRef.current = false;
      
      // Refresh calls
      fetchProfessionalData();
      
    } catch (error) {
      console.error('Error rejecting call:', error);
    }
  };
  
  const cancelCallRequest = async (callId: number) => {
    try {
      const token = localStorage.getItem('token');
      await fetch(`${API_BASE_URL}/call-requests/${callId}/cancel/`, {
        method: 'POST',
        headers: {
          'Authorization': `Token ${token}`,
          'Content-Type': 'application/json',
        }
      });
      
      setIncomingCalls(incomingCalls.filter(call => call.id !== callId));
      
      if (currentCall && currentCall.id === callId) {
        setShowIncomingCallModal(false);
        setCurrentCall(null);
        modalAlreadyShownRef.current = false;
      }
    } catch (error) {
      console.error('Error cancelling call:', error);
    }
  };
  
  const toggleOnlineStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      const newStatus = !isOnline;
      
      const response = await fetch(`${API_BASE_URL}/dashboard/toggle-online/`, {
        method: 'POST',
        headers: {
          'Authorization': `Token ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ is_online: newStatus })
      });
      
      if (response.ok) {
        setIsOnline(newStatus);
        if (professionalProfile) {
          setProfessionalProfile({
            ...professionalProfile,
            is_online: newStatus
          });
        }
      }
    } catch (error) {
      console.error('Error toggling online status:', error);
    }
  };
  
  const updateAutoAcceptCalls = async () => {
    if (!availability) return;
    
    try {
      const token = localStorage.getItem('token');
      const newValue = !availability.auto_accept_calls;
      
      const response = await fetch(`${API_BASE_URL}/dashboard/availability/${availability.id}/`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Token ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          auto_accept_calls: newValue
        })
      });
      
      if (response.ok) {
        setAvailability({
          ...availability,
          auto_accept_calls: newValue
        });
      }
    } catch (error) {
      console.error('Error updating auto-accept:', error);
    }
  };
  
  const handleLogout = () => {
    if (isInCall) {
      handleEndCall();
    }
    
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };
  
  // Effects
  useEffect(() => {
    fetchProfessionalData();
    
    // Initialize Zego immediately with localStorage data
    initializeZego();
    
    // Setup polling for new calls
    const pollInterval = setInterval(() => {
      checkForNewCalls();
    }, 3000);
    
    pollIntervalRef.current = pollInterval;
    
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, []);
  
  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading professional dashboard...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Audio element for ringtone */}
      <audio ref={audioRef} className="hidden" />
      
      {/* Active Call Overlay */}
      {isInCall && (
        <div className="fixed inset-0 bg-black z-50 flex flex-col">
          <div className="bg-gray-900 text-white p-4 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <PhoneCall className="text-green-500" size={24} />
              <div>
                <h2 className="font-bold text-lg">Active Call with {currentCall?.client_name || 'Client'}</h2>
                <p className="text-sm text-gray-300">
                  Room: room_{getProfessionalId()}
                  {currentCall && (
                    <span className="ml-4">• Duration: {currentCall.duration || 30} min</span>
                  )}
                </p>
              </div>
            </div>
            <button
              onClick={handleEndCall}
              className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg flex items-center gap-2"
            >
              <PhoneOff size={20} />
              End Call
            </button>
          </div>
          
          {/* Zego call container */}
          <div 
            ref={callContainerRef} 
            className="flex-1 bg-gray-800"
            style={{ minHeight: '500px' }}
          >
            {callStatus === 'connecting' && (
              <div className="h-full flex items-center justify-center">
                <div className="text-center text-white">
                  <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-xl">Connecting to client...</p>
                  <p className="text-gray-300 mt-2">Please wait a moment</p>
                </div>
              </div>
            )}
          </div>
          
          {/* Call controls */}
          <div className="bg-gray-800 p-4 flex justify-center gap-6">
            <button 
              onClick={() => {
                if (zegoInstance && zegoInstance.turnCamera) {
                  try {
                    zegoInstance.turnCamera(!zegoInstance.isCameraOn());
                  } catch (error) {
                    console.error('Error toggling camera:', error);
                  }
                }
              }}
              className="p-3 rounded-full bg-gray-700 hover:bg-gray-600 transition-colors"
            >
              <Camera size={24} className="text-white" />
            </button>
            <button 
              onClick={() => {
                if (zegoInstance && zegoInstance.turnMicrophone) {
                  try {
                    zegoInstance.turnMicrophone(!zegoInstance.isMicrophoneOn());
                  } catch (error) {
                    console.error('Error toggling microphone:', error);
                  }
                }
              }}
              className="p-3 rounded-full bg-gray-700 hover:bg-gray-600 transition-colors"
            >
              <Mic size={24} className="text-white" />
            </button>
            <button 
              onClick={handleEndCall}
              className="p-3 rounded-full bg-red-600 hover:bg-red-700 transition-colors"
            >
              <PhoneOff size={24} className="text-white" />
            </button>
          </div>
        </div>
      )}
      
      {/* Incoming Call Modal */}
      {showIncomingCallModal && currentCall && !isInCall && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in duration-300">
            <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-6 text-white">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <PhoneIncoming className="animate-pulse" size={32} />
                  <h2 className="text-2xl font-bold">Incoming Call</h2>
                </div>
                <button
                  onClick={() => {
                    setShowIncomingCallModal(false);
                    if (audioRef.current) {
                      audioRef.current.pause();
                      audioRef.current.currentTime = 0;
                    }
                    rejectCall('Manually dismissed');
                  }}
                  className="text-white/80 hover:text-white p-1"
                >
                  <X size={24} />
                </button>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold mb-2">{currentCall.client_name}</div>
                <div className="text-lg opacity-90 mb-1">{currentCall.category}</div>
                <div className="flex items-center justify-center gap-2">
                  <Clock size={16} />
                  <span>{currentCall.duration} min • KES {currentCall.amount?.toFixed(2) || '0.00'}</span>
                </div>
              </div>
            </div>
            
            <div className="p-6">
              <div className="space-y-4 mb-6">
                <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                  <DollarSign className="text-blue-600" size={18} />
                  <div className="text-sm">
                    <div className="font-medium text-blue-700">Earnings</div>
                    <div className="text-xl font-bold text-blue-900">KES {currentCall.amount?.toFixed(2) || '0.00'}</div>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                  <Clock className="text-green-600" size={18} />
                  <div className="text-sm">
                    <div className="font-medium text-green-700">Duration</div>
                    <div className="text-xl font-bold text-green-900">{currentCall.duration} minutes</div>
                  </div>
                </div>
              </div>
              
              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-2">
                  Call Type: <span className="font-medium">{currentCall.call_type === 'video' ? 'Video Call' : 'Voice Call'}</span>
                </p>
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={acceptCall}
                  disabled={callStatus === 'connecting'}
                  className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 text-white py-4 rounded-xl font-bold text-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {callStatus === 'connecting' ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Connecting...
                    </>
                  ) : (
                    <>
                      <PhoneCall size={24} />
                      Accept
                    </>
                  )}
                </button>
                <button
                  onClick={() => rejectCall('Busy')}
                  className="flex-1 bg-gradient-to-r from-red-500 to-pink-600 text-white py-4 rounded-xl font-bold text-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                >
                  <PhoneOff size={24} />
                  Reject
                </button>
              </div>
              
              <div className="mt-4 text-center text-sm text-gray-500">
                <p>Client is waiting for your response</p>
                <button
                  onClick={() => {
                    setShowIncomingCallModal(false);
                    if (audioRef.current) {
                      audioRef.current.pause();
                      audioRef.current.currentTime = 0;
                    }
                    modalAlreadyShownRef.current = false;
                  }}
                  className="mt-2 text-sm text-gray-500 hover:text-gray-700 underline"
                >
                  Dismiss (Keep call pending)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Top Navigation Bar */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center">
              <div className="flex items-center gap-2">
                <Headphones className="text-purple-600" size={28} />
                <span className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  DIRECT-CONNECT
                </span>
                <div className={`ml-3 px-2 py-1 rounded-full text-xs font-medium ${isOnline ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                  {isOnline ? 'ONLINE' : 'OFFLINE'}
                </div>
                {isInCall && (
                  <div className="ml-2 px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 animate-pulse">
                    IN CALL
                  </div>
                )}
              </div>
            </div>
            
            {/* Right side controls */}
            <div className="flex items-center gap-4">
              {/* Online Status Toggle */}
              <button
                onClick={toggleOnlineStatus}
                disabled={isInCall}
                className={`flex items-center gap-2 px-4 py-2 rounded-full ${isOnline ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'} hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {isOnline ? <Wifi size={18} /> : <WifiOff size={18} />}
                <span className="font-medium">{isOnline ? 'Online' : 'Offline'}</span>
              </button>
              
              {/* Logout */}
              <button
                onClick={handleLogout}
                disabled={isInCall}
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-gray-100 text-gray-800 hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <LogOut size={18} />
                <span className="font-medium">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back, {getUserName()}!
          </h1>
          <p className="text-gray-600 mt-2">
            Manage your consultations, view earnings, and connect with clients
          </p>
          {isInCall && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-2">
                <PhoneCall className="text-blue-600" size={18} />
                <span className="font-medium text-blue-800">You are currently in a call with {currentCall?.client_name}</span>
              </div>
            </div>
          )}
        </div>
        
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Today's Earnings */}
          <div className="bg-white rounded-2xl shadow-sm p-6 border">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl">
                <DollarSign className="text-white" size={24} />
              </div>
              <TrendingUp className="text-green-600" size={20} />
            </div>
            <h3 className="text-sm font-medium text-gray-600">Today's Earnings</h3>
            <p className="text-2xl font-bold text-gray-900 mt-1">
              KES {stats?.today_earnings?.toFixed(2) || '0.00'}
            </p>
            <div className="flex items-center gap-2 mt-2">
              <Activity size={14} className="text-green-600" />
              <span className="text-sm text-gray-500">
                {stats?.today_consultations || 0} consultations
              </span>
            </div>
          </div>
          
          {/* Total Consultations */}
          <div className="bg-white rounded-2xl shadow-sm p-6 border">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl">
                <Users className="text-white" size={24} />
              </div>
              <UserCheck className="text-blue-600" size={20} />
            </div>
            <h3 className="text-sm font-medium text-gray-600">Total Consultations</h3>
            <p className="text-2xl font-bold text-gray-900 mt-1">
              {stats?.total_consultations || 0}
            </p>
            <div className="flex items-center gap-2 mt-2">
              <Star size={14} className="text-yellow-500" />
              <span className="text-sm text-gray-500">
                {stats?.average_rating?.toFixed(1) || '0.0'} rating
              </span>
            </div>
          </div>
          
          {/* Weekly Earnings */}
          <div className="bg-white rounded-2xl shadow-sm p-6 border">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-gradient-to-r from-purple-500 to-pink-600 rounded-xl">
                <BarChart3 className="text-white" size={24} />
              </div>
              <Zap className="text-purple-600" size={20} />
            </div>
            <h3 className="text-sm font-medium text-gray-600">Weekly Earnings</h3>
            <p className="text-2xl font-bold text-gray-900 mt-1">
              KES {stats?.week_earnings?.toFixed(2) || '0.00'}
            </p>
            <div className="flex items-center gap-2 mt-2">
              <Clock size={14} className="text-purple-600" />
              <span className="text-sm text-gray-500">
                {stats?.week_hours?.toFixed(1) || '0'} hours
              </span>
            </div>
          </div>
          
          {/* Availability Status */}
          <div className="bg-white rounded-2xl shadow-sm p-6 border">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-gradient-to-r from-amber-500 to-orange-600 rounded-xl">
                <Activity className="text-white" size={24} />
              </div>
              <div className={`w-3 h-3 rounded-full ${isOnline ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
            </div>
            <h3 className="text-sm font-medium text-gray-600">Availability</h3>
            <p className="text-2xl font-bold text-gray-900 mt-1">
              {isOnline ? 'Available' : 'Offline'}
            </p>
            <div className="flex items-center gap-2 mt-2">
              <Shield size={14} className="text-amber-600" />
              <span className="text-sm text-gray-500">
                {availability?.auto_accept_calls ? 'Auto-accept ON' : 'Manual accept'}
              </span>
            </div>
          </div>
        </div>
        
        {/* Main Dashboard Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Incoming Calls */}
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-white rounded-2xl shadow-sm p-6 border">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">Incoming Calls</h2>
                <div className="flex gap-2">
                  <button
                    onClick={checkForNewCalls}
                    className="p-2 rounded-full hover:bg-gray-100 text-sm text-gray-600"
                    disabled={isInCall}
                  >
                    Check Now
                  </button>
                  <button
                    onClick={fetchProfessionalData}
                    className="p-2 rounded-full hover:bg-gray-100"
                    disabled={isInCall}
                  >
                    <RefreshCw size={18} className="text-gray-600" />
                  </button>
                </div>
              </div>
              
              {incomingCalls.length === 0 ? (
                <div className="text-center py-12">
                  <PhoneIncoming className="mx-auto text-gray-300" size={48} />
                  <p className="text-gray-500 mt-4">No incoming calls at the moment</p>
                  <p className="text-sm text-gray-400 mt-2">You'll be notified when a client calls</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {incomingCalls.map((call) => (
                    <div
                      key={call.id}
                      className="p-4 border rounded-xl hover:border-purple-500 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-purple-100 rounded-full">
                            <PhoneIncoming className="text-purple-600" size={20} />
                          </div>
                          <div>
                            <h3 className="font-medium text-gray-900">{call.client_name}</h3>
                            <p className="text-sm text-gray-500">{call.category}</p>
                            <p className="text-xs text-gray-400">
                              Status: <span className="font-medium text-yellow-600">pending</span>
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-gray-900">KES {call.amount?.toFixed(2) || '0.00'}</p>
                          <p className="text-sm text-gray-500">{call.duration} min</p>
                          <p className="text-xs text-gray-400">
                            {new Date(call.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex gap-2 mt-4">
                        <button
                          onClick={() => {
                            setCurrentCall(call);
                            setShowIncomingCallModal(true);
                          }}
                          className="flex-1 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg font-medium hover:opacity-90"
                          disabled={isInCall}
                        >
                          Accept Call
                        </button>
                        <button
                          onClick={() => cancelCallRequest(call.id)}
                          className="flex-1 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200"
                          disabled={isInCall}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          
          {/* Right Column: Settings */}
          <div className="space-y-8">
            {/* Availability Settings */}
            <div className="bg-white rounded-2xl shadow-sm p-6 border">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Availability Settings</h2>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gray-100 rounded-full">
                      <Wifi className="text-gray-600" size={20} />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">Online Status</h3>
                      <p className="text-sm text-gray-500">Go online to receive calls</p>
                    </div>
                  </div>
                  <button
                    onClick={toggleOnlineStatus}
                    disabled={isInCall}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full ${isOnline ? 'bg-green-500' : 'bg-gray-300'} disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${isOnline ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-full">
                      <Zap className="text-blue-600" size={20} />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">Auto-accept Calls</h3>
                      <p className="text-sm text-gray-500">Automatically accept incoming calls</p>
                    </div>
                  </div>
                  <button
                    onClick={updateAutoAcceptCalls}
                    disabled={isInCall}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full ${availability?.auto_accept_calls ? 'bg-blue-500' : 'bg-gray-300'} disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${availability?.auto_accept_calls ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                </div>
              </div>
            </div>
            
            {/* Quick Actions */}
            <div className="bg-white rounded-2xl shadow-sm p-6 border">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Quick Actions</h2>
              
              <div className="grid grid-cols-2 gap-4">
                <button 
                  onClick={() => navigate('/calendar')}
                  disabled={isInCall}
                  className="p-4 border rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-colors text-center disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="p-3 bg-blue-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-2">
                    <Calendar className="text-blue-600" size={24} />
                  </div>
                  <span className="font-medium text-gray-900">Calendar</span>
                </button>
                
                <button 
                  onClick={() => navigate('/earnings')}
                  disabled={isInCall}
                  className="p-4 border rounded-xl hover:border-green-500 hover:bg-green-50 transition-colors text-center disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="p-3 bg-green-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-2">
                    <DollarSign className="text-green-600" size={24} />
                  </div>
                  <span className="font-medium text-gray-900">Earnings</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Bottom Status Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
                <span className="text-sm font-medium">
                  {isInCall ? `In call with ${currentCall?.client_name}` : (isOnline ? 'Online • Ready for calls' : 'Offline • Not receiving calls')}
                </span>
              </div>
              
              {incomingCalls.length > 0 && !isInCall && (
                <div className="flex items-center gap-2">
                  <PhoneIncoming className="text-purple-600" size={16} />
                  <span className="text-sm text-purple-600 font-medium">
                    {incomingCalls.length} incoming call{incomingCalls.length !== 1 ? 's' : ''}
                  </span>
                </div>
              )}
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Clock size={16} className="text-gray-400" />
                <span className="text-sm text-gray-600">
                  {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfessionalDashboard;