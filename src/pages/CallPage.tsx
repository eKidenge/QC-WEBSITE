import { useEffect, useState, useRef } from 'react';
import { ZIM } from "zego-zim-web";
import { ZegoUIKitPrebuilt } from '@zegocloud/zego-uikit-prebuilt';
import { Phone, Video, User, Loader2, AlertCircle, Clock } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';

interface UserInfo {
  userName: string;
  userID: string;
}

export default function CallPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [userInfo, setUserInfo] = useState<UserInfo>({ userName: "", userID: "" });
  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  const [isJoining, setIsJoining] = useState<boolean>(false);
  const [isSendingRequest, setIsSendingRequest] = useState<boolean>(false);
  const [paymentData, setPaymentData] = useState<any>(null);
  const [professionalData, setProfessionalData] = useState<any>(null);
  const [callRequestStatus, setCallRequestStatus] = useState<'idle' | 'sending' | 'sent' | 'ringing' | 'connecting' | 'error'>('idle');
  const [callRequestId, setCallRequestId] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(60);
  
  const zpRef = useRef<any>(null);
  const callInterfaceRef = useRef<HTMLDivElement>(null);
  const joinButtonsRef = useRef<HTMLDivElement>(null);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Get payment data if coming from payment page
  useEffect(() => {
    if (location.state) {
      console.log("📞 Received payment data:", location.state);
      setPaymentData(location.state);
      
      // Extract professional data
      const professionalId = location.state.professionalId === 0 ? 
        location.state.consultationId : 
        location.state.professionalId;
      
      const professional = {
        id: professionalId,
        name: location.state.professionalName,
        roomId: `room_${professionalId}`
      };
      setProfessionalData(professional);
    }
  }, [location.state]);

  function init() {
    let userId = '';
    let userName = '';
    
    if (paymentData?.clientId) {
      userId = paymentData.clientId;
      userName = paymentData.clientName || `Client_${userId}`;
    } else {
      const chars = '12345qwertyuiopasdfgh67890jklmnbvcxz';
      for (let i = 0; i < 8; i++) {
        userId += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      userName = "Client_" + userId;
    }
    
    setUserInfo({ userName, userID: userId });
  }

  useEffect(() => {
    init();
  }, [paymentData]);

  // Initialize Zego when userInfo is available
  useEffect(() => {
    if (userInfo.userID && userInfo.userName && !zpRef.current) {
      initializeZego();
    }
  }, [userInfo]);

  function initializeZego() {
    const appID = 1178040486;
    const serverSecret = "373ecf17185d1d8c94b03169895a336e";
    
    const TOKEN = ZegoUIKitPrebuilt.generateKitTokenForTest(
      appID, 
      serverSecret,
      professionalData?.roomId || 'default_room',
      userInfo.userID, 
      userInfo.userName
    );

    try {
      const zp = ZegoUIKitPrebuilt.create(TOKEN);
      zp.addPlugins({ ZIM });
      zpRef.current = zp;
      setIsInitialized(true);
      console.log("✅ ZegoUIKit instance created successfully");
    } catch (error) {
      console.error("❌ Failed to create ZegoUIKit:", error);
    }
  }

  // Function to send call request to backend
  const sendCallRequestToBackend = async (callType: string): Promise<number | null> => {
    setIsSendingRequest(true);
    setCallRequestStatus('sending');
    
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('No authentication token found');
      }

      const callRequestData = {
        professional: professionalData.id,
        client_id: userInfo.userID,
        client_name: userInfo.userName,
        call_type: callType,
        duration: paymentData?.duration || 30,
        consultation_id: paymentData?.consultationId || `cons_${Date.now()}`,
        amount: paymentData?.amount || 0,
        category: paymentData?.categoryName || 'Consultation'
      };

      console.log('📤 Sending call request to backend:', callRequestData);

      const response = await fetch('https://dc-backend-6xlc.onrender.com/api/call-requests/create/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${token}`
        },
        body: JSON.stringify(callRequestData)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Backend error response:', errorText);
        throw new Error(`Failed to send call request: ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ Call request created successfully:', data);
      
      if (data.id) {
        setCallRequestId(data.id);
        setCallRequestStatus('sent');
        setTimeLeft(60);
        
        // Start polling for call status
        startPollingCallStatus(data.id);
        
        return data.id;
      } else {
        throw new Error('No call request ID returned from backend');
      }
      
    } catch (error: any) {
      console.error('❌ Error sending call request:', error);
      setCallRequestStatus('error');
      alert(`Failed to send call request: ${error.message}`);
      return null;
    } finally {
      setIsSendingRequest(false);
    }
  };

  // Poll for call status - FIXED WITH CORRECT SWITCH STATEMENT
  const startPollingCallStatus = (requestId: number) => {
    // Clear any existing interval
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
    }
    
    let pollCount = 0;
    const maxPolls = 180;
    
    pollIntervalRef.current = setInterval(async () => {
      pollCount++;
      setTimeLeft(prev => Math.max(0, prev - 1));
      
      if (pollCount > maxPolls) {
        clearInterval(pollIntervalRef.current!);
        alert('Call request timed out. Professional did not respond.');
        setCallRequestStatus('idle');
        setCallRequestId(null);
        return;
      }
      
      try {
        const token = localStorage.getItem('token');
        console.log(`🔄 Polling call status for request ${requestId} (attempt ${pollCount})`);
        
        const response = await fetch(`https://dc-backend-6xlc.onrender.com/api/call-requests/${requestId}/`, {
          headers: {
            'Authorization': `Token ${token}`
          }
        });
        
        if (response.ok) {
          const callRequest = await response.json();
          console.log('📞 Call request status:', callRequest.status);
          
          // CORRECTED SWITCH STATEMENT - NO DUPLICATE 'connecting' CASE
          switch(callRequest.status) {
            case 'ringing':
              console.log('🔔 Professional is ringing!');
              setCallRequestStatus('ringing');
              break;
              
            case 'accepted':
            case 'connecting':  // Combined case - handles both statuses
              console.log('✅ Professional accepted/connecting!');
              clearInterval(pollIntervalRef.current!);
              // Professional accepted or connecting, join the room
              joinRoomAfterAcceptance(callRequest.call_type || 'video');
              break;
              
            case 'rejected':
              console.log('❌ Call rejected');
              clearInterval(pollIntervalRef.current!);
              setCallRequestStatus('idle');
              setCallRequestId(null);
              alert(`Call rejected: ${callRequest.rejection_reason || 'Professional is not available'}`);
              break;
              
            case 'cancelled':
            case 'expired':
              console.log(`📭 Call ${callRequest.status}`);
              clearInterval(pollIntervalRef.current!);
              setCallRequestStatus('idle');
              setCallRequestId(null);
              alert(`Call ${callRequest.status}. Please try again.`);
              break;
              
            case 'connected':
              console.log('✅ Connected!');
              setCallRequestStatus('connecting');
              break;
              
            default:
              // Still pending or other status
              console.log('⏳ Status:', callRequest.status);
          }
        } else {
          console.error('❌ Failed to fetch call status:', response.status);
        }
      } catch (error) {
        console.error('❌ Error polling call status:', error);
      }
    }, 1000); // Poll every second
  };

  // Join room after professional accepts
  const joinRoomAfterAcceptance = async (callType: string) => {
    if (!professionalData) {
      alert("Professional information not found.");
      return;
    }

    if (!isInitialized || !zpRef.current) {
      alert("Zego SDK is not initialized yet.");
      return;
    }

    setIsJoining(true);
    setCallRequestStatus('connecting');
    
    try {
      console.log("🎯 Joining professional room after acceptance:", professionalData.roomId);
      
      // Update call request status to 'connecting'
      await updateCallRequestStatus('connecting');
      
      // Generate token
      const appID = 1178040486;
      const serverSecret = "373ecf17185d1d8c94b03169895a336e";
      
      const TOKEN = ZegoUIKitPrebuilt.generateKitTokenForTest(
        appID, 
        serverSecret,
        professionalData.roomId,
        userInfo.userID, 
        userInfo.userName
      );
      
      // Join the room configuration
      const roomConfig = {
        container: document.getElementById('zego-ui-container'),
        scenario: {
          mode: ZegoUIKitPrebuilt.OneONoneCall,
        },
        turnOnMicrophoneWhenJoining: callType === 'video' || callType === 'voice',
        turnOnCameraWhenJoining: callType === 'video',
        showTextChat: true,
        showUserList: true,
        showPreJoinView: false,
        maxUsers: 2,
        layout: "Auto",
        showScreenSharingButton: true,
        showLeavingView: true,
        onLeaveRoom: () => {
          handleEndCall();
        },
        onJoinRoom: () => {
          console.log("✅ Successfully joined room");
          setIsJoining(false);
          updateCallRequestStatus('connected');
          setCallRequestStatus('connecting');
        },
        onUserJoin: (users: any[]) => {
          console.log("👥 Users in room:", users);
          // Professional has joined
          if (users.length > 0) {
            console.log('👨‍💼 Professional joined the room!');
          }
        }
      };

      // Join the room
      await zpRef.current.joinRoom(professionalData.roomId, TOKEN, roomConfig);
      
      // Show call interface
      if (callInterfaceRef.current) {
        callInterfaceRef.current.style.display = 'block';
      }
      if (joinButtonsRef.current) {
        joinButtonsRef.current.style.display = 'none';
      }
      
    } catch (err: any) {
      console.error("❌ Failed to join room:", err);
      alert(`Failed to connect: ${err.message || 'Unknown error'}`);
      setIsJoining(false);
      setCallRequestStatus('error');
      updateCallRequestStatus('failed');
    }
  };

  // Update call request status in backend
  const updateCallRequestStatus = async (status: string) => {
    if (!callRequestId) return;
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`https://dc-backend-6xlc.onrender.com/api/call-requests/${callRequestId}/update-status/`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${token}`
        },
        body: JSON.stringify({ status })
      });
      
      if (!response.ok) {
        console.error('Failed to update call status');
      }
    } catch (error) {
      console.error('❌ Error updating call status:', error);
    }
  };

  async function handleJoinCall(callType: string) {
    if (!professionalData) {
      alert("Professional information not found. Please complete payment first.");
      return;
    }

    if (!isInitialized || !zpRef.current) {
      alert("Zego SDK is not initialized yet. Please wait...");
      return;
    }

    // Send call request to backend
    const requestId = await sendCallRequestToBackend(callType);
    
    if (!requestId) {
      return; // Request failed
    }
  }

  const handleEndCall = () => {
    if (zpRef.current) {
      zpRef.current.leaveRoom();
      updateCallRequestStatus('ended');
    }
    if (callInterfaceRef.current) {
      callInterfaceRef.current.style.display = 'none';
    }
    if (joinButtonsRef.current) {
      joinButtonsRef.current.style.display = 'block';
    }
    setIsJoining(false);
    setCallRequestStatus('idle');
    setCallRequestId(null);
    
    // Clear polling interval
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
    }
  };

  const cancelCallRequest = async () => {
    if (!callRequestId) return;
    
    try {
      const token = localStorage.getItem('token');
      await fetch(`https://dc-backend-6xlc.onrender.com/api/call-requests/${callRequestId}/cancel/`, {
        method: 'POST',
        headers: {
          'Authorization': `Token ${token}`
        }
      });
      
      setCallRequestStatus('idle');
      setCallRequestId(null);
      
      // Clear polling interval
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
      
      alert('Call request cancelled');
    } catch (error) {
      console.error('❌ Error cancelling call request:', error);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Connect with {professionalData?.name || 'Professional'}
          </h1>
          <p className="text-gray-800 font-extrabold font-sans text-2xl md:text-3xl tracking-wide mt-4">
            DIRECT-CONNECT TECHNOLOGIES
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* User Info Card */}
          <div className="bg-white rounded-2xl shadow-2xl p-6 md:p-8 border border-gray-100">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl">
                <User className="text-white" size={24} />
              </div>
              <h2 className="text-2xl font-bold text-gray-800">Your Session</h2>
            </div>
            
            <div className="space-y-6">
              {/* Client Info */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-5 border border-blue-100">
                <div className="flex items-center gap-3 mb-2">
                  <User size={18} className="text-blue-600" />
                  <span className="text-sm font-medium text-blue-700">You are</span>
                </div>
                <div className="text-xl font-bold text-gray-800">
                  {userInfo.userName}
                </div>
              </div>
              
              {/* Professional Info */}
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-5 border border-purple-100">
                <div className="flex items-center gap-3 mb-2">
                  <User size={18} className="text-purple-600" />
                  <span className="text-sm font-medium text-purple-700">Connecting to</span>
                </div>
                <div className="text-xl font-bold text-gray-800">
                  {professionalData?.name || 'Professional'}
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  {paymentData?.categoryName || 'Consultation'}
                </p>
              </div>

              {/* Payment Info */}
              {paymentData && (
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-5 border border-green-200">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                    </div>
                    <h3 className="font-bold text-green-800">Payment Confirmed</h3>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Duration:</span>
                      <span className="font-semibold">{paymentData.duration || 30} min</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Amount:</span>
                      <span className="font-bold text-green-700">
                        KES {paymentData.amount?.toFixed(2) || '0.00'}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Call Request Status */}
              {callRequestStatus === 'sending' && (
                <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-xl border border-blue-200">
                  <Loader2 className="animate-spin text-blue-600" size={20} />
                  <div>
                    <p className="font-medium text-blue-800">Sending call request...</p>
                    <p className="text-sm text-blue-600">Notifying professional</p>
                  </div>
                </div>
              )}
              
              {callRequestStatus === 'sent' && (
                <div className="flex items-center gap-3 p-4 bg-amber-50 rounded-xl border border-amber-200">
                  <Loader2 className="animate-spin text-amber-600" size={20} />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-amber-800">Request sent</p>
                      <div className="flex items-center gap-1 text-sm text-amber-700">
                        <Clock size={14} />
                        <span>{timeLeft}s</span>
                      </div>
                    </div>
                    <p className="text-sm text-amber-600 mt-1">Waiting for {professionalData?.name} to respond</p>
                    <button
                      onClick={cancelCallRequest}
                      className="mt-2 text-sm text-amber-700 hover:text-amber-900 underline"
                    >
                      Cancel request
                    </button>
                  </div>
                </div>
              )}
              
              {callRequestStatus === 'ringing' && (
                <div className="flex items-center gap-3 p-4 bg-purple-50 rounded-xl border border-purple-200">
                  <Loader2 className="animate-spin text-purple-600" size={20} />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-purple-800">Professional is ringing!</p>
                      <div className="flex items-center gap-1 text-sm text-purple-700">
                        <Clock size={14} />
                        <span>{timeLeft}s</span>
                      </div>
                    </div>
                    <p className="text-sm text-purple-600 mt-1">{professionalData?.name} has received your call</p>
                  </div>
                </div>
              )}
              
              {callRequestStatus === 'connecting' && (
                <div className="flex items-center gap-3 p-4 bg-green-50 rounded-xl border border-green-200">
                  <Loader2 className="animate-spin text-green-600" size={20} />
                  <div className="flex-1">
                    <p className="font-medium text-green-800">Connecting...</p>
                    <p className="text-sm text-green-600 mt-1">Joining the consultation room</p>
                  </div>
                </div>
              )}
              
              {callRequestStatus === 'error' && (
                <div className="flex items-center gap-3 p-4 bg-red-50 rounded-xl border border-red-200">
                  <AlertCircle className="text-red-600" size={20} />
                  <div>
                    <p className="font-medium text-red-800">Failed to connect</p>
                    <p className="text-sm text-red-600">Please try again</p>
                  </div>
                </div>
              )}

              {/* Connection Status */}
              {!isInitialized && callRequestStatus === 'idle' ? (
                <div className="flex items-center gap-3 p-4 bg-amber-50 rounded-xl border border-amber-200">
                  <Loader2 className="animate-spin text-amber-600" size={20} />
                  <div>
                    <p className="font-medium text-amber-800">Initializing Connection</p>
                    <p className="text-sm text-amber-600">Please wait a moment...</p>
                  </div>
                </div>
              ) : callRequestStatus === 'idle' ? (
                <div className="flex items-center gap-3 p-4 bg-emerald-50 rounded-xl border border-emerald-200">
                  <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse"></div>
                  <div>
                    <p className="font-medium text-emerald-800">Ready to Connect</p>
                    <p className="text-sm text-emerald-600">Choose call type below</p>
                  </div>
                </div>
              ) : null}
            </div>
          </div>

          {/* Call Interface */}
          <div className="bg-white rounded-2xl shadow-2xl p-6 md:p-8 border border-gray-100">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-gradient-to-r from-purple-500 to-pink-600 rounded-xl">
                <Phone className="text-white" size={24} />
              </div>
              <h2 className="text-2xl font-bold text-gray-800">Start Consultation</h2>
            </div>

            {/* Join Buttons (shown when no active call request) */}
            {callRequestStatus === 'idle' && (
              <div id="join-buttons" ref={joinButtonsRef} className="space-y-4">
                <button
                  onClick={() => handleJoinCall('voice')}
                  disabled={!isInitialized || isSendingRequest || !professionalData}
                  className="w-full group p-5 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-4 shadow-lg hover:shadow-xl"
                >
                  {isSendingRequest ? (
                    <Loader2 className="animate-spin" size={24} />
                  ) : (
                    <>
                      <Phone size={24} />
                      <div className="text-left flex-1">
                        <div className="font-bold text-lg">Voice Call</div>
                        <div className="text-sm opacity-90">Audio consultation</div>
                      </div>
                      <div className="text-sm bg-white/20 px-3 py-1 rounded-full">
                        Request
                      </div>
                    </>
                  )}
                </button>

                <button
                  onClick={() => handleJoinCall('video')}
                  disabled={!isInitialized || isSendingRequest || !professionalData}
                  className="w-full group p-5 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-xl hover:from-purple-600 hover:to-pink-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-4 shadow-lg hover:shadow-xl"
                >
                  {isSendingRequest ? (
                    <Loader2 className="animate-spin" size={24} />
                  ) : (
                    <>
                      <Video size={24} />
                      <div className="text-left flex-1">
                        <div className="font-bold text-lg">Video Call</div>
                        <div className="text-sm opacity-90">Face-to-face consultation</div>
                      </div>
                      <div className="text-sm bg-white/20 px-3 py-1 rounded-full">
                        Request
                      </div>
                    </>
                  )}
                </button>
              </div>
            )}

            {/* Call Container (shown when call is active) */}
            <div id="call-interface" ref={callInterfaceRef} style={{ display: 'none' }}>
              <div id="zego-ui-container" className="w-full h-[400px] rounded-xl bg-gray-100"></div>
              <div className="mt-4 flex justify-center">
                <button
                  onClick={handleEndCall}
                  className="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-lg font-medium flex items-center gap-2"
                >
                  <Phone size={20} />
                  End Call
                </button>
              </div>
              <p className="text-center text-gray-600 mt-4">
                Connected to {professionalData?.name}. Consultation in progress...
              </p>
            </div>

            {/* Instructions based on status */}
            <div className="mt-8 p-5 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl border border-gray-200">
              <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                {callRequestStatus === 'sent' || callRequestStatus === 'ringing' || callRequestStatus === 'connecting' ? 'Call Status' : 'How it works'}
              </h3>
              
              {callRequestStatus === 'sent' ? (
                <ul className="space-y-3 text-gray-600">
                  <li className="flex items-start gap-2">
                    <div className="w-5 h-5 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-xs font-bold">✓</div>
                    <span>Call request sent to {professionalData?.name}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-5 h-5 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center text-xs font-bold">
                      <Loader2 size={10} className="animate-spin" />
                    </div>
                    <span>Waiting for professional to respond...</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-5 h-5 bg-blue-100 text-blue-400 rounded-full flex items-center justify-center text-xs font-bold">3</div>
                    <span>Will automatically connect when accepted</span>
                  </li>
                </ul>
              ) : callRequestStatus === 'ringing' ? (
                <ul className="space-y-3 text-gray-600">
                  <li className="flex items-start gap-2">
                    <div className="w-5 h-5 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-xs font-bold">✓</div>
                    <span>Call request received by {professionalData?.name}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-5 h-5 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-xs font-bold">
                      <Loader2 size={10} className="animate-spin" />
                    </div>
                    <span>Professional is ringing...</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-5 h-5 bg-blue-100 text-blue-400 rounded-full flex items-center justify-center text-xs font-bold">3</div>
                    <span>Will connect when professional accepts</span>
                  </li>
                </ul>
              ) : callRequestStatus === 'connecting' ? (
                <ul className="space-y-3 text-gray-600">
                  <li className="flex items-start gap-2">
                    <div className="w-5 h-5 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-xs font-bold">✓</div>
                    <span>Call accepted by {professionalData?.name}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-5 h-5 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-xs font-bold">
                      <Loader2 size={10} className="animate-spin" />
                    </div>
                    <span>Connecting to consultation room...</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-5 h-5 bg-blue-100 text-blue-400 rounded-full flex items-center justify-center text-xs font-bold">3</div>
                    <span>Starting consultation shortly</span>
                  </li>
                </ul>
              ) : (
                <ul className="space-y-3 text-gray-600">
                  <li className="flex items-start gap-2">
                    <div className="w-5 h-5 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold">1</div>
                    <span>Choose voice or video call</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-5 h-5 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold">2</div>
                    <span>Send call request to professional</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-5 h-5 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold">3</div>
                    <span>Wait for professional to accept</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-5 h-5 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold">4</div>
                    <span>Automatically connect and begin consultation</span>
                  </li>
                </ul>
              )}
            </div>
          </div>
        </div>
        
        {/* Footer Note */}
        <div className="mt-8 text-center text-gray-500 text-sm">
          <p>"SKIP THE SEARCH, GET THE ANSWER"</p>
        </div>
      </div>
    </div>
  );
}
