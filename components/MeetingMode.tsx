
import React, { useState, useEffect, useRef } from 'react';
import { 
  Video, Mic, MicOff, VideoOff, PhoneOff, Users, 
  ShieldCheck, ShieldAlert, Monitor, Settings, 
  MoreVertical, Share2, ScanFace, Activity, X, Lock, CheckCircle2, User, Play,
  MonitorUp, MonitorOff, MonitorX, AlertTriangle
} from 'lucide-react';

interface Participant {
  id: string;
  name: string;
  role: 'host' | 'participant';
  isMuted: boolean;
  isVideoOff: boolean;
  isBlocked: boolean; // Blocked by AI (Safety)
  isScreenSharing: boolean; // Is currently sharing screen
  canShareScreen: boolean; // Host permission
  image?: string;
  isLocal?: boolean;
}

const MOCK_PARTICIPANTS: Participant[] = [
  { id: '2', name: 'Sarah Jenks', role: 'participant', isMuted: false, isVideoOff: false, isBlocked: false, isScreenSharing: false, canShareScreen: true, image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah' },
  { id: '3', name: 'David Chen', role: 'participant', isMuted: true, isVideoOff: false, isBlocked: false, isScreenSharing: false, canShareScreen: false, image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=David' },
  { id: '4', name: 'Emily Davis', role: 'participant', isMuted: false, isVideoOff: true, isBlocked: false, isScreenSharing: false, canShareScreen: true, image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Emily' },
];

export const MeetingMode: React.FC = () => {
  const [phase, setPhase] = useState<'lobby' | 'meeting'>('lobby');
  const [isHost, setIsHost] = useState(true); // Default to host for demo
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [showHostPanel, setShowHostPanel] = useState(false);
  
  // Local User State
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null);
  const [isLocalMuted, setIsLocalMuted] = useState(false);
  const [isLocalVideoOff, setIsLocalVideoOff] = useState(false);
  const [isLocalBlocked, setIsLocalBlocked] = useState(false); // AI Penalty State
  const [isLocalScreenSharing, setIsLocalScreenSharing] = useState(false);
  const [localCanShareScreen, setLocalCanShareScreen] = useState(true); // Permission for local user
  
  // Auth State
  const [authStep, setAuthStep] = useState<'idle' | 'scanning' | 'verified' | 'failed'>('idle');
  const [scanMessage, setScanMessage] = useState('');

  // Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);

  // Initialize Camera
  useEffect(() => {
    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        setLocalStream(stream);
      } catch (e) {
        console.error("Camera access denied", e);
      }
    };
    startCamera();
    return () => {
      localStream?.getTracks().forEach(track => track.stop());
      screenStream?.getTracks().forEach(track => track.stop());
    };
  }, []);

  // Bind Stream to Video Element (Handle switching between Camera and Screen)
  useEffect(() => {
    const streamToUse = isLocalScreenSharing && screenStream ? screenStream : localStream;
    
    if (streamToUse) {
      if (videoRef.current) {
          videoRef.current.srcObject = streamToUse;
          // Mirror only if it's camera, not screen
          videoRef.current.style.transform = isLocalScreenSharing ? 'none' : 'scaleX(-1)';
      }
      if (localVideoRef.current) {
          localVideoRef.current.srcObject = streamToUse;
          localVideoRef.current.style.transform = isLocalScreenSharing ? 'none' : 'scaleX(-1)';
      }
    }
  }, [localStream, screenStream, isLocalScreenSharing, phase, isLocalBlocked]);

  // Sync local state to participants array
  useEffect(() => {
      setParticipants(prev => prev.map(p => 
          p.isLocal ? { 
              ...p, 
              isMuted: isLocalMuted, 
              isVideoOff: isLocalVideoOff, 
              isBlocked: isLocalBlocked,
              isScreenSharing: isLocalScreenSharing,
              canShareScreen: localCanShareScreen
          } : p
      ));
  }, [isLocalMuted, isLocalVideoOff, isLocalBlocked, isLocalScreenSharing, localCanShareScreen]);

  // --- ACTIONS ---

  const handleStartScan = () => {
    setAuthStep('scanning');
    setScanMessage('Initializing Biometric AI...');
    
    setTimeout(() => setScanMessage('Scanning Facial Features...'), 1500);
    setTimeout(() => setScanMessage('Analyzing Background Environment...'), 3000);
    setTimeout(() => setScanMessage('Verifying Voice Print...'), 4500);
    
    setTimeout(() => {
      setAuthStep('verified');
      setScanMessage('Authentication Successful.');
    }, 6000);
  };

  const handleJoinMeeting = () => {
    if (authStep !== 'verified') return;
    
    const localUser: Participant = {
      id: '1',
      name: 'You (Host)',
      role: isHost ? 'host' : 'participant',
      isMuted: isLocalMuted,
      isVideoOff: isLocalVideoOff,
      isBlocked: false,
      isScreenSharing: false,
      canShareScreen: true,
      isLocal: true
    };
    
    setParticipants([localUser, ...MOCK_PARTICIPANTS]);
    setPhase('meeting');
  };

  const handleToggleScreenShare = async () => {
      if (!localCanShareScreen && !isLocalScreenSharing) {
          alert("Host has disabled screen sharing for you.");
          return;
      }

      if (isLocalScreenSharing) {
          // Stop Sharing
          screenStream?.getTracks().forEach(t => t.stop());
          setScreenStream(null);
          setIsLocalScreenSharing(false);
      } else {
          // Start Sharing
          try {
              const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
              setScreenStream(stream);
              setIsLocalScreenSharing(true);
              
              // Handle system stop button
              stream.getVideoTracks()[0].onended = () => {
                  setScreenStream(null);
                  setIsLocalScreenSharing(false);
              };
          } catch (e) {
              console.error("Screen share failed", e);
              setIsLocalScreenSharing(false);
              // Not showing alert to avoid spamming if user just cancelled, 
              // but console will show the policy error if present.
          }
      }
  };

  // --- AI SIMULATION LOGIC ---

  const triggerViolation = (type: string) => {
    // If sharing screen and violation happens (e.g. inappropriate content on screen), block user.
    setIsLocalBlocked(true);
    if (isLocalScreenSharing) handleToggleScreenShare(); // Stop screen share immediately
    
    setParticipants(prev => prev.map(p => p.isLocal ? { ...p, isBlocked: true } : p));
    
    const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
    audio.play().catch(e => console.log(e));
  };

  // --- HOST CONTROLS ---

  const handleHostToggleBlock = (userId: string) => {
    if (userId === '1') {
        setIsLocalBlocked(false); // Only unblock self for demo
    } else {
        setParticipants(prev => prev.map(p => p.id === userId ? { ...p, isBlocked: !p.isBlocked } : p));
    }
  };

  const handleHostScreenPermission = (userId: string) => {
      if (userId === '1') {
          // Toggle own permission (weird for host, but for demo completeness)
          if (isLocalScreenSharing) handleToggleScreenShare();
          setLocalCanShareScreen(!localCanShareScreen);
      } else {
          setParticipants(prev => prev.map(p => {
              if (p.id === userId) {
                  // If we are revoking permission and they are sharing, stop it (simulated)
                  const newPermission = !p.canShareScreen;
                  return { 
                      ...p, 
                      canShareScreen: newPermission,
                      isScreenSharing: newPermission ? p.isScreenSharing : false 
                  };
              }
              return p;
          }));
      }
  };

  // --- RENDERERS ---

  if (phase === 'lobby') {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-900 p-6 relative overflow-hidden font-sans">
        {/* Background Accents */}
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-blue-500/10 rounded-full blur-[100px]"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-pink-500/10 rounded-full blur-[100px]"></div>

        <div className="max-w-4xl w-full grid md:grid-cols-2 gap-12 items-center z-10">
          
          {/* Left: Info */}
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 text-xs font-bold uppercase tracking-wider">
              <ShieldCheck size={14} /> AI Protected Environment
            </div>
            <h1 className="text-5xl font-black text-slate-800 dark:text-white leading-tight">
              Secure <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-pink-500">Meeting Mode</span>
            </h1>
            <p className="text-slate-600 dark:text-slate-400 text-lg leading-relaxed">
              Join with confidence. Our AI monitors background, face, and voice patterns to ensure a professional and safe environment for everyone.
            </p>
            
            <div className="flex gap-4 pt-4">
              <button 
                onClick={() => setIsHost(true)} 
                className={`px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all ${isHost ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' : 'bg-white dark:bg-slate-800 border dark:border-slate-700 text-slate-500'}`}
              >
                <Monitor size={18} /> Host Meeting
              </button>
              <button 
                onClick={() => setIsHost(false)} 
                className={`px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all ${!isHost ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' : 'bg-white dark:bg-slate-800 border dark:border-slate-700 text-slate-500'}`}
              >
                <Users size={18} /> Join Meeting
              </button>
            </div>
          </div>

          {/* Right: Camera & Auth */}
          <div className="relative">
            <div className="aspect-video bg-black rounded-3xl overflow-hidden shadow-2xl relative border-4 border-white dark:border-slate-800">
              <video 
                ref={videoRef} 
                autoPlay 
                muted 
                playsInline 
                className={`w-full h-full object-cover transform scale-x-[-1] ${authStep === 'scanning' ? 'opacity-50' : 'opacity-100'}`} 
              />
              
              {/* Scan Overlay */}
              {authStep === 'scanning' && (
                <div className="absolute inset-0 flex flex-col items-center justify-center z-20">
                  <div className="w-64 h-64 border-2 border-blue-400/50 rounded-full flex items-center justify-center relative animate-pulse">
                     <div className="absolute inset-0 border-t-2 border-blue-500 rounded-full animate-spin"></div>
                     <ScanFace size={64} className="text-blue-400 opacity-80" />
                  </div>
                  <p className="text-blue-300 font-mono mt-8 text-sm animate-pulse">{scanMessage}</p>
                </div>
              )}

              {/* Verified Overlay */}
              {authStep === 'verified' && (
                <div className="absolute inset-0 bg-green-500/20 flex flex-col items-center justify-center z-20 backdrop-blur-sm animate-in fade-in">
                   <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mb-4 shadow-lg shadow-green-500/50">
                      <CheckCircle2 size={40} className="text-white" />
                   </div>
                   <h3 className="text-2xl font-bold text-white">Identity Verified</h3>
                   <p className="text-white/80 text-sm">You are clear to join.</p>
                </div>
              )}

              {/* Idle Overlay */}
              {authStep === 'idle' && (
                 <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-4 z-20">
                    <button onClick={() => setIsLocalMuted(!isLocalMuted)} className={`p-4 rounded-full ${isLocalMuted ? 'bg-red-500 text-white' : 'bg-white/20 backdrop-blur-md text-white hover:bg-white/30'}`}>
                       {isLocalMuted ? <MicOff size={20} /> : <Mic size={20} />}
                    </button>
                    <button onClick={() => setIsLocalVideoOff(!isLocalVideoOff)} className={`p-4 rounded-full ${isLocalVideoOff ? 'bg-red-500 text-white' : 'bg-white/20 backdrop-blur-md text-white hover:bg-white/30'}`}>
                       {isLocalVideoOff ? <VideoOff size={20} /> : <Video size={20} />}
                    </button>
                 </div>
              )}
            </div>

            {/* Action Button */}
            <div className="mt-6">
               {authStep === 'idle' ? (
                 <button 
                   onClick={handleStartScan}
                   className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-2xl font-bold text-lg shadow-xl shadow-blue-500/20 transition-all flex justify-center items-center gap-2"
                 >
                   <ScanFace size={24} /> Authenticate & Scan
                 </button>
               ) : (
                 <button 
                   onClick={handleJoinMeeting}
                   disabled={authStep !== 'verified'}
                   className="w-full py-4 bg-green-500 hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-2xl font-bold text-lg shadow-xl shadow-green-500/20 transition-all flex justify-center items-center gap-2"
                 >
                   Join Meeting <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center"><Play size={12} fill="currentColor"/></div>
                 </button>
               )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- MEETING ROOM PHASE ---

  return (
    <div className="h-full flex flex-col bg-[#0f172a] relative overflow-hidden">
      
      {/* Simulation Dev Tools (Hidden in real app, but requested for demo) */}
      <div className="absolute top-4 left-4 z-50 group">
         <button className="bg-slate-800 text-slate-400 p-2 rounded-lg text-xs font-bold border border-slate-700 hover:text-white flex items-center gap-2">
            <Activity size={14} /> AI Sim
         </button>
         <div className="hidden group-hover:flex flex-col gap-2 absolute top-full left-0 mt-2 bg-slate-800 p-3 rounded-xl border border-slate-700 shadow-xl w-48">
            <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">Trigger Violation</p>
            <button onClick={() => triggerViolation('filter')} className="text-left px-3 py-2 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-lg text-xs font-bold">Use Filter</button>
            <button onClick={() => triggerViolation('voice')} className="text-left px-3 py-2 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-lg text-xs font-bold">Voice Changer</button>
            <button onClick={() => triggerViolation('bg')} className="text-left px-3 py-2 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-lg text-xs font-bold">Change BG</button>
            <div className="h-px bg-slate-700 my-1"></div>
            <button onClick={() => { setIsLocalBlocked(false); setParticipants(p => p.map(x => x.isLocal ? {...x, isBlocked:false}:x)) }} className="text-left px-3 py-2 bg-green-500/10 text-green-400 hover:bg-green-500/20 rounded-lg text-xs font-bold">Reset Status</button>
         </div>
      </div>

      {/* Header */}
      <div className="h-16 bg-slate-900/50 backdrop-blur-md border-b border-slate-800 flex items-center justify-between px-6 z-20">
         <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                <ShieldCheck size={16} className="text-blue-400" />
                <span className="text-blue-200 text-xs font-bold">AI Guardian Active</span>
            </div>
            <div className="h-4 w-px bg-slate-700"></div>
            <h2 className="text-white font-bold">Project Discussion</h2>
         </div>
         <div className="flex items-center gap-3">
             <button className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg"><Share2 size={20}/></button>
             <button className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg"><Settings size={20}/></button>
         </div>
      </div>

      {/* Main Grid */}
      <div className="flex-1 p-6 overflow-y-auto">
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto h-full auto-rows-fr">
            {participants.map(p => (
               <div key={p.id} className="relative bg-slate-800 rounded-3xl overflow-hidden border border-slate-700 shadow-2xl group">
                  
                  {/* Video Feed */}
                  {p.isLocal ? (
                      <video 
                        ref={localVideoRef} 
                        autoPlay 
                        muted 
                        playsInline 
                        className={`w-full h-full object-cover transform transition-transform ${p.isBlocked ? 'opacity-10 blur-xl' : ''} ${isLocalScreenSharing ? 'scale-100' : 'scale-x-[-1]'}`} 
                      />
                  ) : p.isScreenSharing ? (
                      <div className="w-full h-full bg-black flex items-center justify-center relative">
                          <img src="https://images.unsplash.com/photo-1587620962725-abab7fe55159?q=80&w=2831&auto=format&fit=crop" alt="Shared Screen" className="w-full h-full object-contain opacity-80" />
                          <div className="absolute bottom-4 right-4 bg-black/60 px-2 py-1 rounded text-xs font-bold text-white flex items-center gap-1">
                              <MonitorUp size={12} /> {p.name}'s Screen
                          </div>
                      </div>
                  ) : (
                      <img src={p.image} alt={p.name} className={`w-full h-full object-cover ${p.isBlocked ? 'opacity-10 blur-xl' : ''}`} />
                  )}

                  {/* Info Tag */}
                  <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-md text-white px-3 py-1.5 rounded-lg text-sm font-bold flex items-center gap-2">
                      {p.isMuted ? <MicOff size={12} className="text-red-400"/> : <Mic size={12} className="text-green-400"/>}
                      {p.name}
                  </div>

                  {/* AI Status Overlay - Safe */}
                  {!p.isBlocked && (
                      <div className="absolute top-4 right-4 bg-green-500/20 border border-green-500/50 p-1.5 rounded-full">
                          <ShieldCheck size={16} className="text-green-400" />
                      </div>
                  )}

                  {/* AI Status Overlay - BLOCKED (The Penalty) */}
                  {p.isBlocked && (
                      <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-md flex flex-col items-center justify-center text-center p-6 z-10 animate-in zoom-in duration-300">
                          <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mb-4 animate-pulse">
                              <ShieldAlert size={48} className="text-red-500" />
                          </div>
                          <h3 className="text-xl font-black text-red-500 mb-2">Access Restricted</h3>
                          <p className="text-slate-400 text-sm mb-6">AI detected inappropriate behavior (Filter/Voice Mod). Audio and Video stream blocked.</p>
                          
                          {p.isLocal ? (
                              <div className="text-xs text-slate-500 font-mono">Waiting for host review...</div>
                          ) : (
                              isHost && (
                                  <button 
                                    onClick={() => handleHostToggleBlock(p.id)}
                                    className="px-6 py-2 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 transition-colors"
                                  >
                                      Override & Allow
                                  </button>
                              )
                          )}
                      </div>
                  )}
               </div>
            ))}
         </div>
      </div>

      {/* Footer Controls */}
      <div className="h-20 bg-slate-900 border-t border-slate-800 flex justify-center items-center gap-4 px-6 z-20">
          <button 
            onClick={() => setIsLocalMuted(!isLocalMuted)}
            className={`p-4 rounded-2xl transition-all ${isLocalMuted ? 'bg-red-500 text-white' : 'bg-slate-800 text-white hover:bg-slate-700'}`}
          >
              {isLocalMuted ? <MicOff size={24} /> : <Mic size={24} />}
          </button>
          
          <button 
            onClick={() => setIsLocalVideoOff(!isLocalVideoOff)}
            className={`p-4 rounded-2xl transition-all ${isLocalVideoOff ? 'bg-red-500 text-white' : 'bg-slate-800 text-white hover:bg-slate-700'}`}
          >
              {isLocalVideoOff ? <VideoOff size={24} /> : <Video size={24} />}
          </button>

          <button 
            onClick={handleToggleScreenShare}
            disabled={!localCanShareScreen && !isLocalScreenSharing}
            className={`p-4 rounded-2xl transition-all ${isLocalScreenSharing ? 'bg-blue-500 text-white' : !localCanShareScreen ? 'bg-slate-800 text-slate-600 cursor-not-allowed' : 'bg-slate-800 text-white hover:bg-slate-700'}`}
            title={!localCanShareScreen ? "Screen sharing disabled by host" : "Share Screen"}
          >
              {isLocalScreenSharing ? <MonitorUp size={24} /> : <MonitorOff size={24} />}
          </button>

          {isHost && (
              <button 
                onClick={() => setShowHostPanel(true)}
                className="px-6 py-4 bg-slate-800 text-white rounded-2xl font-bold flex items-center gap-2 hover:bg-slate-700 relative ml-4"
              >
                  <Users size={20} /> 
                  <span className="hidden md:inline">Manage</span>
                  {participants.some(p => p.isBlocked) && (
                      <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-slate-900"></span>
                  )}
              </button>
          )}

          <button onClick={() => setPhase('lobby')} className="px-8 py-4 bg-red-600 text-white rounded-2xl font-bold hover:bg-red-700 flex items-center gap-2 ml-4">
              <PhoneOff size={20} /> <span className="hidden md:inline">Leave</span>
          </button>
      </div>

      {/* Host Control Dialog */}
      {showHostPanel && (
          <div className="absolute top-20 right-6 w-96 bg-slate-800 border border-slate-700 rounded-3xl shadow-2xl p-4 z-50 animate-in slide-in-from-right-10">
              <div className="flex justify-between items-center mb-4 pb-4 border-b border-slate-700">
                  <h3 className="text-white font-bold flex items-center gap-2">
                      <ShieldCheck size={18} className="text-blue-400" /> Host Controls
                  </h3>
                  <button onClick={() => setShowHostPanel(false)} className="text-slate-400 hover:text-white"><X size={18}/></button>
              </div>
              
              <div className="space-y-3 max-h-[60vh] overflow-y-auto">
                  {participants.map(p => (
                      <div key={p.id} className="bg-slate-900/50 p-3 rounded-xl flex items-center justify-between border border-slate-700/50">
                          <div className="flex items-center gap-3">
                              {p.image ? (
                                  <img src={p.image} className="w-8 h-8 rounded-full" />
                              ) : (
                                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold">ME</div>
                              )}
                              <div className="min-w-0">
                                  <p className="text-white text-sm font-bold truncate max-w-[100px]">{p.name}</p>
                                  <div className="flex items-center gap-1">
                                      {p.isBlocked && <span className="text-[10px] text-red-400 font-bold uppercase">Blocked</span>}
                                      {p.isScreenSharing && <span className="text-[10px] text-blue-400 font-bold uppercase flex items-center gap-1"><MonitorUp size={8}/> Sharing</span>}
                                  </div>
                              </div>
                          </div>
                          
                          <div className="flex gap-2">
                              {/* Screen Share Control */}
                              <button 
                                onClick={() => handleHostScreenPermission(p.id)}
                                className={`p-2 rounded-lg transition-colors ${
                                    !p.canShareScreen 
                                        ? 'bg-orange-500/20 text-orange-400 hover:bg-orange-500 hover:text-white' 
                                        : p.isScreenSharing 
                                            ? 'bg-blue-500/20 text-blue-400 hover:bg-blue-500 hover:text-white'
                                            : 'bg-slate-800 text-slate-500 hover:text-white'
                                }`}
                                title={!p.canShareScreen ? "Allow Screen Share" : p.isScreenSharing ? "Stop Screen Share" : "Disable Screen Share"}
                              >
                                  {p.isScreenSharing ? <MonitorX size={16} /> : !p.canShareScreen ? <MonitorOff size={16} /> : <MonitorUp size={16} />}
                              </button>

                              {/* Block Control */}
                              <button 
                                onClick={() => handleHostToggleBlock(p.id)}
                                className={`p-2 rounded-lg transition-colors ${p.isBlocked ? 'bg-red-500/20 text-red-400 hover:bg-red-500 hover:text-white' : 'bg-slate-800 text-slate-500 hover:text-white'}`}
                                title={p.isBlocked ? "Unblock User" : "Block User"}
                              >
                                  {p.isBlocked ? <Lock size={16} /> : <ShieldCheck size={16} />}
                              </button>
                          </div>
                      </div>
                  ))}
              </div>
          </div>
      )}

    </div>
  );
};
