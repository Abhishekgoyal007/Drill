'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Phone, PhoneOff, Mic, MicOff, AlertCircle, ArrowLeft, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Waveform from '@/components/Waveform';
import { useAuth } from '@/lib/auth-context';
import { addStandupToFirestore } from '@/lib/firestore';
import { parseTranscript } from '@/lib/transcript-parser';
import { CallState } from '@/lib/types';

// ElevenLabs agent ID
const AGENT_ID = process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID || '';

type MicStatus = 'pending' | 'granted' | 'denied' | 'checking';

export default function CallPage() {
  const router = useRouter();
  const { user, profile, loading: authLoading } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [callState, setCallState] = useState<CallState>({
    status: 'idle',
    startTime: null,
    duration: 0,
    currentTopic: 'yesterday',
    isSpeaking: 'none',
  });
  const [isMuted, setIsMuted] = useState(false);
  const [timer, setTimer] = useState(0);
  const [transcript, setTranscript] = useState<string[]>([]);
  const [currentPill, setCurrentPill] = useState('Connecting...');
  const [micStatus, setMicStatus] = useState<MicStatus>('checking');
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const conversationRef = useRef<any>(null);

  useEffect(() => {
    setMounted(true);
    checkMicPermission();
  }, []);

  useEffect(() => {
    if (!authLoading && !user) router.push('/');
    if (!authLoading && profile && !profile.onboarded) router.push('/onboarding');
  }, [authLoading, user, profile, router]);

  const checkMicPermission = async () => {
    try {
      if (navigator.permissions) {
        const result = await navigator.permissions.query({ name: 'microphone' as PermissionName });
        if (result.state === 'granted') { setMicStatus('granted'); return; }
        else if (result.state === 'denied') { setMicStatus('denied'); return; }
      }
      setMicStatus('pending');
    } catch { setMicStatus('pending'); }
  };

  const requestMicPermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((track) => track.stop());
      setMicStatus('granted');
    } catch { setMicStatus('denied'); }
  };

  useEffect(() => {
    if (callState.status === 'active') {
      timerRef.current = setInterval(() => setTimer((t) => t + 1), 1000);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [callState.status]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const startCall = useCallback(async () => {
    if (!user || !profile) return;
    if (micStatus === 'denied') { startDemoCall(); return; }
    if (micStatus !== 'granted') await requestMicPermission();

    setCallState((prev) => ({ ...prev, status: 'connecting' }));
    setCurrentPill('Syncing Audio...');

    try {
      const { Conversation } = await import('@elevenlabs/react');
      const conversation = await Conversation.startSession({
        agentId: AGENT_ID,
        onConnect: () => {
          setCallState((prev) => ({ ...prev, status: 'active', startTime: Date.now() }));
          setCurrentPill("Yesterday's work");
        },
        onDisconnect: () => handleEndCall(),
        onMessage: (message: { message: string; source: string }) => {
          setTranscript((prev) => [...prev, `${message.source === 'ai' ? 'Drill' : profile.name}: ${message.message}`]);
          if (message.source === 'ai') {
            const msg = message.message.toLowerCase();
            if (msg.includes('yesterday')) setCurrentPill("Yesterday's work");
            else if (msg.includes('today')) setCurrentPill("Today's plan");
            else if (msg.includes('block')) setCurrentPill('Blockers');
          }
        },
        onModeChange: (mode: { mode: string }) => {
          setCallState((prev) => ({
            ...prev,
            isSpeaking: mode.mode === 'speaking' ? 'ai' : mode.mode === 'listening' ? 'user' : 'none',
          }));
        },
      });
      conversationRef.current = conversation;
    } catch { startDemoCall(); }
  }, [user, profile, micStatus]);

  const startDemoCall = useCallback(() => {
    if (!profile) return;
    setCallState({ status: 'active', startTime: Date.now(), duration: 0, currentTopic: 'yesterday', isSpeaking: 'ai' });
    setCurrentPill("Yesterday's work");
    setTranscript(["Drill: Morning. Let's get to it. What did you finish yesterday?"]);
    setTimeout(() => setCallState(p => ({ ...p, isSpeaking: 'none' })), 3000);
  }, [profile]);

  const handleEndCall = useCallback(() => {
    if (conversationRef.current) {
      try { conversationRef.current.endSession(); } catch {}
      conversationRef.current = null;
    }
    if (timerRef.current) clearInterval(timerRef.current);
    setCallState((prev) => ({ ...prev, status: 'ended' }));
    setTimeout(() => router.push('/post-call'), 2000);
  }, [router]);

  if (!mounted || authLoading || !user || !profile) return null;

  const waveformColor = callState.isSpeaking === 'user' ? 'green' : 'blue';

  return (
    <div className="fixed inset-0 bg-[#050505] flex flex-col items-center justify-between safe-top safe-bottom overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 pointer-events-none">
        <motion.div 
          className="absolute inset-0 transition-colors duration-1000"
          animate={{
            background: callState.isSpeaking === 'ai' 
              ? 'radial-gradient(circle at 50% 40%, rgba(77,159,255,0.15) 0%, transparent 70%)'
              : callState.isSpeaking === 'user'
              ? 'radial-gradient(circle at 50% 40%, rgba(0,255,148,0.15) 0%, transparent 70%)'
              : 'radial-gradient(circle at 50% 40%, rgba(20,20,20,0.4) 0%, transparent 70%)'
          }}
        />
        <div className="absolute inset-0 opacity-[0.03] grayscale pointer-events-none" style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/dark-matter.png")' }} />
      </div>

      {/* Header */}
      <motion.header 
        initial={{ y: -30, opacity: 0 }} 
        animate={{ y: 0, opacity: 1 }}
        className="w-full px-6 py-8 flex items-center justify-between relative z-50 mt-4"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#4D9FFF] to-[#0066FF] flex items-center justify-center shadow-xl shadow-blue-900/20">
            <span className="text-white font-black text-xs">D</span>
          </div>
          <div>
            <h1 className="text-white font-bold text-base leading-none">Drill</h1>
            <p className="text-[10px] text-blue-400 font-bold uppercase tracking-widest mt-1">Live AI Sessions</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {callState.status === 'active' && (
            <div className="px-4 py-2 rounded-2xl bg-white/[0.03] border border-white/[0.05] flex items-center gap-2 backdrop-blur-md">
              <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
              <span className="text-white font-mono text-sm">{formatTime(timer)}</span>
            </div>
          )}
        </div>
      </motion.header>

      {/* Center Display */}
      <div className="flex-1 w-full flex flex-col items-center justify-center px-6 -mt-10 relative z-20">
        <AnimatePresence mode="wait">
          {callState.status === 'idle' ? (
            <motion.div 
              key="idle"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center gap-12"
            >
              <div className="relative">
                <div className="w-52 h-52 rounded-full border border-white/5 flex items-center justify-center">
                  <div className="w-32 h-32 rounded-full bg-blue-500/5 flex items-center justify-center border border-blue-500/10">
                    <Phone className="w-12 h-12 text-blue-500 fill-blue-500/20" />
                  </div>
                </div>
                <motion.div 
                  className="absolute -inset-4 rounded-full border border-blue-500/10" 
                  animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.6, 0.3] }}
                  transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                />
              </div>
              <div className="text-center">
                <h2 className="text-2xl font-black text-white mb-3">Ready for Drill?</h2>
                <p className="text-sm text-gray-500 leading-relaxed max-w-[240px]">
                  Take a deep breath. Your 90-second accountability session is ready.
                </p>
              </div>
            </motion.div>
          ) : callState.status === 'connecting' ? (
            <motion.div 
              key="connecting"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 1.2, opacity: 0 }}
              className="flex flex-col items-center gap-8"
            >
              <div className="relative">
                <div className="w-40 h-40 rounded-full border-2 border-white/5 flex items-center justify-center">
                  <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
                </div>
                <motion.div 
                  className="absolute inset-0 rounded-full border-b-2 border-blue-500" 
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                />
              </div>
              <div className="text-center">
                <h2 className="text-xl font-bold text-white mb-2">Establishing Link</h2>
                <p className="text-sm text-gray-500">Wait a second, things are getting ready...</p>
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key="active"
              className="w-full flex flex-col items-center gap-12"
            >
              {/* Topic Pill */}
              <motion.div 
                className="px-6 py-2 rounded-full border border-white/10 bg-white/5 backdrop-blur-xl text-xs font-bold uppercase tracking-wider text-blue-400"
                animate={{ scale: [1, 1.05, 1] }} transition={{ duration: 2, repeat: Infinity }}
              >
                {currentPill}
              </motion.div>

              {/* Waveform */}
              <div className="w-full h-40 flex items-center justify-center">
                <Waveform 
                  isActive={callState.status === 'active' && callState.isSpeaking !== 'none'} 
                  color={waveformColor}
                  barCount={40}
                  size="xl"
                />
              </div>

              {/* Status Text */}
              <div className="text-center space-y-4 max-w-xs">
                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-gray-600">
                  {callState.isSpeaking === 'ai' ? 'Drill Thinking' : callState.isSpeaking === 'user' ? 'Listening...' : 'Active Connection'}
                </p>
                <AnimatePresence mode="wait">
                  {transcript.length > 0 && (
                    <motion.div
                      key={transcript.length}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="px-6 py-5 rounded-[2.5rem] bg-white/[0.03] border border-white/[0.06] backdrop-blur-2xl shadow-2xl"
                    >
                      <p className="text-sm text-gray-300 leading-relaxed font-medium capitalize">
                        &ldquo;{transcript[transcript.length - 1].split(': ').slice(1).join(': ')}&rdquo;
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom Controls */}
      <footer className="w-full px-8 pb-12 pt-8 relative z-50">
        <div className="flex items-center justify-center gap-6">
          <AnimatePresence>
            {callState.status === 'active' ? (
              <motion.div 
                initial={{ y: 50, opacity: 0 }} 
                animate={{ y: 0, opacity: 1 }}
                className="flex items-center gap-5 w-full max-w-xs"
              >
                <button 
                  onClick={() => setIsMuted(!isMuted)}
                  className={`flex-1 h-16 rounded-[2rem] flex items-center justify-center transition-all border ${isMuted ? 'bg-red-500/10 border-red-500/20 text-red-500' : 'bg-white/5 border-white/10 text-white'}`}
                >
                  {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
                </button>
                <button 
                  onClick={handleEndCall}
                  className="w-24 h-16 rounded-[2rem] bg-red-600 flex items-center justify-center shadow-2xl shadow-red-900/40"
                >
                  <PhoneOff className="w-7 h-7 text-white" />
                </button>
              </motion.div>
            ) : callState.status === 'idle' && (
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={startCall}
                className="w-full h-18 rounded-[2.5rem] bg-blue-600 font-bold text-white flex items-center justify-center gap-3 shadow-2xl shadow-blue-900/40"
              >
                <Phone className="w-6 h-6 fill-white" />
                Join Standup Call
              </motion.button>
            )}
          </AnimatePresence>
        </div>
        
        {/* Safe Area Padding */}
        <div className="h-4" />
      </footer>
    </div>
  );
}
