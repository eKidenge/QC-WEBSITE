import { useEffect, useState, useRef } from 'react';
import { ZIM } from "zego-zim-web";
import { ZegoUIKitPrebuilt } from '@zegocloud/zego-uikit-prebuilt';

function randomID(len) {
  let result = '';
  if (result) return result;
  var chars = '12345qwertyuiopasdfgh67890jklmnbvcxzMNBVCZXASDQWERTYHGFUIOLKJP',
    maxPos = chars.length,
    i;
  len = len || 5;
  for (i = 0; i < len; i++) {
    result += chars.charAt(Math.floor(Math.random() * maxPos));
  }
  return result;
}

function App() {
  const [userInfo, setUserInfo] = useState({ userName: "", userID: "" });
  const [calleeId, setCalleeId] = useState("");
  const [isInitialized, setIsInitialized] = useState(false);
  
  const zpRef = useRef(null);

  function init() {
    const userId = randomID();
    const userName = "user_" + userId;
    setUserInfo({ userName, userID: userId });
  }

  useEffect(() => {
    init();
  }, []);

  // Initialize Zego when userInfo is available
  useEffect(() => {
    if (userInfo.userID && userInfo.userName && !zpRef.current) {
      initializeZego();
    }
  }, [userInfo]);

  function initializeZego() {
    const appID = 1178040486;
    const serverSecret = "373ecf17185d1d8c94b03169895a336e";
    
    // Generate token
    const TOKEN = ZegoUIKitPrebuilt.generateKitTokenForTest(
      appID, 
      serverSecret,
      null,  // roomID - can be null for calls
      userInfo.userID, 
      userInfo.userName
    );

    try {
      // Create Zego instance - this should already be initialized
      const zp = ZegoUIKitPrebuilt.create(TOKEN);
      zp.addPlugins({ ZIM });
      
      // Store the instance
      zpRef.current = zp;
      setIsInitialized(true);
      console.log("ZegoUIKit instance created successfully", zp);
      
      // Optional: Check if methods are available
      console.log("Available methods:", {
        sendCallInvitation: typeof zp.sendCallInvitation,
        languageManager: zp.languageManager
      });
    } catch (error) {
      console.error("Failed to create ZegoUIKit:", error);
    }
  }

  function handleCall(callType) {
    if (!calleeId) {
      alert("UserID cannot be empty");
      return;
    }

    if (!isInitialized || !zpRef.current) {
      alert("Zego SDK is not initialized yet. Please wait...");
      return;
    }

    // Check if the method exists
    if (typeof zpRef.current.sendCallInvitation !== 'function') {
      console.error("sendCallInvitation is not a function on:", zpRef.current);
      alert("SDK method not available. Check console for details.");
      return;
    }

    console.log("Sending call invitation to:", calleeId);
    
    zpRef.current.sendCallInvitation({
      callees: [{ userID: calleeId, userName: userInfo.userName }],
      callType,
      timeout: 60,
    })
    .then((res) => {
      console.log("Call invitation sent successfully:", res);
    })
    .catch((err) => {
      console.error("Call invitation failed:", err);
      alert(`Call failed: ${err.message || JSON.stringify(err)}`);
    });
  }

  return (
    <div className='container'>
      <div className='title'>
        <h2>Username : {userInfo.userName} </h2>
        <h2>UserId : {userInfo.userID} </h2>
        {!isInitialized && <p style={{color: 'orange'}}>Initializing Zego SDK...</p>}
      </div>
      <div className='input-field'>
        <input 
          type="text" 
          placeholder="callee's userID" 
          spellCheck="false" 
          onChange={(e) => setCalleeId(e.target.value)}
          value={calleeId}
        />
        <label>Enter Callee's UserID</label>
      </div>
      <div className='btns'>
        <button 
          onClick={() => handleCall(ZegoUIKitPrebuilt.InvitationTypeVoiceCall)}
          disabled={!isInitialized}
        >
          {isInitialized ? "Voice Call" : "Initializing..."}
        </button>
        <button 
          onClick={() => handleCall(ZegoUIKitPrebuilt.InvitationTypeVideoCall)}
          disabled={!isInitialized}
        >
          {isInitialized ? "Video Call" : "Initializing..."}
        </button>
      </div>
    </div>
  );
}

export default App;