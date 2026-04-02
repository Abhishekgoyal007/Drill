'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Phone, PhoneOff, Mic, MicOff, AlertCircle, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Waveform from '@/components/Waveform';
import { useAuth } from '@/lib/auth-context';
import { addStandupToFirestore } from '@/lib/firestore';
import { parseTranscript } from '@/lib/transcript-parser';
import { CallState } from '@/lib/types';

// ElevenLabs agent ID — set this in .env.local as NEXT_PUBLIC_ELEVENLABS_AGENT_ID
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

  // Calculate streak locally from profile context (will be computed after save)
  const streakCount = 0; // Will show on dashboard

  useEffect(() => {
    setMounted(true);
    checkMicPermission();
  }, []);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/');
    }
    if (!authLoading && profile && !profile.onboarded) {
      router.push('/onboarding');
    }
  }, [authLoading, user, profile, router]);

  // Check / request microphone permission
  const checkMicPermission = async () => {
    try {
      // Check if permissions API is available
      if (navigator.permissions) {
        const result = await navigator.permissions.query({ name: 'microphone' as PermissionName });
        if (result.state === 'granted') {
          setMicStatus('granted');
          return;
        } else if (result.state === 'denied') {
          setMicStatus('denied');
          return;
        }
      }
      setMicStatus('pending');
    } catch {
      // permissions API not supported, mark as pending
      setMicStatus('pending');
    }
  };

  const requestMicPermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // Stop tracks immediately — we just needed permission
      stream.getTracks().forEach((track) => track.stop());
      setMicStatus('granted');
    } catch {
      setMicStatus('denied');
    }
  };

  // Timer
  useEffect(() => {
    if (callState.status === 'active') {
      timerRef.current = setInterval(() => {
        setTimer((t) => t + 1);
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [callState.status]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const startCall = useCallback(async () => {
    if (!user || !profile) return;

    if (micStatus === 'denied') {
      startDemoCall();
      return;
    }

    // Request mic if not yet granted
    if (micStatus !== 'granted') {
      await requestMicPermission();
    }

    setCallState((prev) => ({ ...prev, status: 'connecting' }));
    setCurrentPill('Connecting to Drill...');

    try {
      // Dynamic import of ElevenLabs
      const { Conversation } = await import('@elevenlabs/react');

      const conversation = await Conversation.startSession({
        agentId: AGENT_ID,
        onConnect: () => {
          setCallState((prev) => ({
            ...prev,
            status: 'active',
            startTime: Date.now(),
          }));
          setCurrentPill(`Today's standup — Yesterday's work`);

        },
        onDisconnect: () => {
          handleEndCall();
        },
        onMessage: (message: { message: string; source: string }) => {
          setTranscript((prev) => [
            ...prev,
            `${message.source === 'ai' ? 'Drill' : profile.name}: ${message.message}`,
          ]);

          // Update topic pill based on AI messages
          if (message.source === 'ai') {
            const msg = message.message.toLowerCase();
            if (msg.includes('yesterday') || msg.includes('ship')) {
              setCurrentPill("Yesterday's work");
              setCallState((prev) => ({ ...prev, currentTopic: 'yesterday' }));
            } else if (msg.includes('today') || msg.includes('plan')) {
              setCurrentPill("Today's plan");
              setCallState((prev) => ({ ...prev, currentTopic: 'today' }));
            } else if (msg.includes('block') || msg.includes('stuck')) {
              setCurrentPill('Blockers');
              setCallState((prev) => ({ ...prev, currentTopic: 'blockers' }));
            } else if (msg.includes('so today') || msg.includes('remember')) {
              setCurrentPill('Summary');
              setCallState((prev) => ({ ...prev, currentTopic: 'summary' }));
            }
          }
        },
        onModeChange: (mode: { mode: string }) => {
          setCallState((prev) => ({
            ...prev,
            isSpeaking:
              mode.mode === 'speaking' ? 'ai' : mode.mode === 'listening' ? 'user' : 'none',
          }));
        },
        onError: (message: string) => {
          console.error('ElevenLabs error:', message);
          // Fall back to demo mode
          startDemoCall();
        },
      });

      conversationRef.current = conversation;
    } catch (error) {
      console.error('Failed to start ElevenLabs session:', error);
      // Start demo call if ElevenLabs isn't configured
      startDemoCall();
    }
  }, [user, profile, micStatus]);

  // Demo mode when ElevenLabs is not configured
  const startDemoCall = useCallback(() => {
    if (!profile) return;

    setCallState({
      status: 'active',
      startTime: Date.now(),
      duration: 0,
      currentTopic: 'yesterday',
      isSpeaking: 'ai',
    });

    const day = 1;
    const demoMessages = [
      {
        delay: 1000,
        speaker: 'Drill',
        text: `Morning ${profile.name.split(' ')[0]}. Day ${day}. Let's go. What did you ship yesterday?`,
        topic: "Yesterday's work",
      },
      {
        delay: 8000,
        speaker: 'Drill',
        text: "That's not specific enough. What exactly did you complete?",
        topic: "Yesterday's work",
      },
      {
        delay: 16000,
        speaker: 'Drill',
        text: "Good. What's the plan for today?",
        topic: "Today's plan",
      },
      {
        delay: 24000,
        speaker: 'Drill',
        text: 'Anything blocking you?',
        topic: 'Blockers',
      },
      {
        delay: 32000,
        speaker: 'Drill',
        text: `So today: finish the deployment pipeline and write tests. I'll remember that. Don't let me down.`,
        topic: 'Summary',
      },
    ];

    // Also add simulated user responses for demo
    const userName = profile.name;
    const demoUserResponses: { delay: number; speaker: string; text: string; topic?: string }[] = [
      {
        delay: 5000,
        speaker: userName,
        text: "I will finish the API integration and deploy the staging environment",
      },
      {
        delay: 12000,
        speaker: userName,
        text: "I completed the database schema and wrote the migration scripts",
      },
      {
        delay: 20000,
        speaker: userName,
        text: "I'm going to work on the deployment pipeline and write unit tests",
      },
      {
        delay: 28000,
        speaker: userName,
        text: "I'm stuck on the CI/CD configuration, waiting for DevOps team access",
      },
    ];

    const allMessages = [...demoMessages, ...demoUserResponses].sort((a, b) => a.delay - b.delay);

    allMessages.forEach(({ delay, speaker, text, topic }) => {
      setTimeout(() => {
        setTranscript((prev) => [...prev, `${speaker}: ${text}`]);
        if (topic) {
          setCurrentPill(topic);
          setCallState((prev) => ({
            ...prev,
            currentTopic: topic.toLowerCase().includes('yesterday')
              ? 'yesterday'
              : topic.toLowerCase().includes('today')
              ? 'today'
              : topic.toLowerCase().includes('block')
              ? 'blockers'
              : 'summary',
            isSpeaking: speaker === 'Drill' ? 'ai' : 'user',
          }));
        } else {
          setCallState((prev) => ({ ...prev, isSpeaking: 'user' }));
        }

        // Clear speaking after 2.5 seconds
        setTimeout(() => {
          setCallState((prev) => ({ ...prev, isSpeaking: 'none' }));
        }, 2500);
      }, delay);
    });
  }, [profile]);

  const handleEndCall = useCallback(() => {
    if (conversationRef.current) {
      try {
        conversationRef.current.endSession();
      } catch {
        // Session may already be ended
      }
      conversationRef.current = null;
    }

    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    // Parse transcript and save standup to Firestore
    if (user && profile && transcript.length > 0) {
      const fullTranscript = transcript.join('\n');
      const parsed = parseTranscript(fullTranscript, profile.name);

      addStandupToFirestore(user.uid, {
        transcript: fullTranscript,
        summary: parsed.summary,
        commitments: parsed.commitments.length > 0 ? parsed.commitments : ['Continue current work'],
        blockers: parsed.blockers,
        duration: timer,
      }).catch(console.error);
    } else if (user) {
      addStandupToFirestore(user.uid, {
        transcript: 'Demo standup completed',
        summary: 'Completed daily standup',
        commitments: ['Continue current work'],
        blockers: [],
        duration: timer,
      }).catch(console.error);
    }

    setCallState((prev) => ({ ...prev, status: 'ended' }));

    // Redirect to post-call after brief delay
    setTimeout(() => {
      router.push('/post-call');
    }, 1500);
  }, [user, profile, transcript, timer, router]);

  const toggleMute = useCallback(() => {
    setIsMuted((prev) => {
      const newMuted = !prev;
      // Toggle ElevenLabs input audio if available
      if (conversationRef.current) {
        try {
          if (newMuted) {
            conversationRef.current.setVolume({ inputVolume: 0 });
          } else {
            conversationRef.current.setVolume({ inputVolume: 1 });
          }
        } catch {
          // setVolume may not be available in all versions
        }
      }
      return newMuted;
    });
  }, []);

  if (!mounted || authLoading || !user || !profile) return null;

  const waveformColor =
    callState.isSpeaking === 'ai' ? 'blue' : callState.isSpeaking === 'user' ? 'green' : 'blue';
  const isActive = callState.isSpeaking !== 'none' && callState.status === 'active';

  const topicColors: Record<string, string> = {
    yesterday: '#4D9FFF',
    today: '#4D9FFF',
    blockers: '#FF3D3D',
    summary: '#00FF94',
  };

  return (
    <div className="fixed inset-0 bg-[#0A0A0A] flex flex-col items-center justify-center overflow-hidden">
      {/* Multi-layer background */}
      <div className="absolute inset-0">
        {/* Grid */}
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }}
        />
        {/* Dynamic glow */}
        <motion.div
          className="absolute inset-0 transition-all duration-1000"
          animate={{
            background: `radial-gradient(circle at 50% 40%, ${
              callState.isSpeaking === 'ai'
                ? 'rgba(77,159,255,0.12)'
                : callState.isSpeaking === 'user'
                ? 'rgba(0,255,148,0.12)'
                : callState.status === 'active'
                ? 'rgba(77,159,255,0.05)'
                : 'rgba(77,159,255,0.03)'
            } 0%, transparent 60%)`,
          }}
          transition={{ duration: 1 }}
        />
      </div>

      {/* Orbiting particles during active call */}
      {callState.status === 'active' && (
        <div className="absolute inset-0 pointer-events-none">
          {Array.from({ length: 6 }).map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1.5 h-1.5 rounded-full"
              style={{
                background: i % 2 === 0 ? '#4D9FFF' : '#00FF94',
                left: '50%',
                top: '50%',
              }}
              animate={{
                x: [
                  Math.cos((i / 6) * Math.PI * 2) * 160,
                  Math.cos(((i + 3) / 6) * Math.PI * 2) * 180,
                  Math.cos((i / 6) * Math.PI * 2) * 160,
                ],
                y: [
                  Math.sin((i / 6) * Math.PI * 2) * 160,
                  Math.sin(((i + 3) / 6) * Math.PI * 2) * 180,
                  Math.sin((i / 6) * Math.PI * 2) * 160,
                ],
                opacity: [0.3, 0.7, 0.3],
              }}
              transition={{
                duration: 6 + i,
                repeat: Infinity,
                ease: 'linear',
              }}
            />
          ))}
        </div>
      )}

      {/* Status bar */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="absolute top-0 left-0 right-0 z-10 backdrop-blur-xl bg-[rgba(10,10,10,0.6)]"
      >
        <div className="flex items-center justify-between px-6 py-4 max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            {callState.status === 'idle' && (
              <button
                onClick={() => router.push('/dashboard')}
                className="p-2 -ml-2 text-[#555] hover:text-white transition-colors rounded-lg hover:bg-[rgba(255,255,255,0.04)]"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#4D9FFF] to-[#0066FF] flex items-center justify-center shadow-lg shadow-[rgba(77,159,255,0.2)]">
              <span className="text-white font-black text-[10px]">D</span>
            </div>
            <span className="text-white font-bold text-sm">Drill</span>
            {callState.status === 'active' && (
              <span className="text-[10px] text-[#555] uppercase tracking-wider font-medium ml-1">Live</span>
            )}
          </div>
          {callState.status === 'active' && (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[rgba(255,61,61,0.08)] border border-[rgba(255,61,61,0.15)]">
                <div className="w-2 h-2 rounded-full bg-[#FF3D3D] animate-pulse" />
                <span className="text-white font-mono text-sm tracking-wider">{formatTime(timer)}</span>
              </div>
              {isMuted && (
                <span className="text-[10px] text-[#FF3D3D] font-bold uppercase bg-[rgba(255,61,61,0.1)] px-2 py-1 rounded">Muted</span>
              )}
            </div>
          )}
        </div>
      </motion.div>

      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center gap-8">
        {/* Mic permission denied warning */}
        {micStatus === 'denied' && callState.status === 'idle' && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-[rgba(255,61,61,0.08)] border border-[rgba(255,61,61,0.15)]"
          >
            <AlertCircle className="w-4 h-4 text-[#FF3D3D]" />
            <span className="text-sm text-[#FF3D3D]">
              Microphone blocked. Enable it in browser settings to use voice.
            </span>
          </motion.div>
        )}

        {/* Topic pill */}
        <AnimatePresence mode="wait">
          {callState.status !== 'idle' && (
            <motion.div
              key={currentPill}
              initial={{ opacity: 0, y: -10, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.9 }}
              className="px-5 py-2 rounded-full border backdrop-blur-sm"
              style={{
                borderColor: `${topicColors[callState.currentTopic]}30`,
                background: `${topicColors[callState.currentTopic]}10`,
                color: topicColors[callState.currentTopic],
              }}
            >
              <span className="text-sm font-medium">{currentPill}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* === IDLE STATE === */}
        {callState.status === 'idle' ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center gap-8"
          >
            {/* Waveform with ring */}
            <div className="relative">
              <Waveform isActive={false} color="blue" barCount={50} size="xl" />
              <div className="absolute -inset-8 rounded-full border border-[rgba(77,159,255,0.08)] pointer-events-none" />
              <div className="absolute -inset-16 rounded-full border border-[rgba(77,159,255,0.04)] pointer-events-none" />
            </div>

            <div className="text-center">
              <h1 className="text-3xl md:text-4xl font-black text-white mb-2">Ready for your standup?</h1>
              <p className="text-[#888] text-lg">{profile.name}</p>
            </div>

            {micStatus === 'pending' ? (
              <div className="flex flex-col items-center gap-4">
                <div className="relative">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={requestMicPermission}
                    className="w-20 h-20 rounded-full bg-gradient-to-br from-[#4D9FFF] to-[#0066FF] flex items-center justify-center shadow-lg shadow-[rgba(77,159,255,0.3)]"
                    id="mic-permission-button"
                  >
                    <Mic className="w-8 h-8 text-white" />
                  </motion.button>
                  <motion.div
                    className="absolute -inset-2 rounded-full border-2 border-[rgba(77,159,255,0.3)]"
                    animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                </div>
                <p className="text-sm text-[#888]">Allow microphone access first</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-4">
                <div className="relative">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={startCall}
                    className="relative z-50 cursor-pointer pointer-events-auto w-20 h-20 rounded-full bg-gradient-to-br from-[#00FF94] to-[#00CC75] flex items-center justify-center shadow-lg shadow-[rgba(0,255,148,0.3)]"
                    id="start-call-button"
                  >
                    <Phone className="w-8 h-8 text-black" />
                  </motion.button>
                  <motion.div
                    className="absolute -inset-2 rounded-full border-2 border-[rgba(0,255,148,0.3)]"
                    animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                </div>
                <p className="text-sm text-[#555]">
                  {micStatus === 'denied' ? 'Start in demo mode' : 'Tap to start your drill'}
                </p>
              </div>
            )}
          </motion.div>

        // === CONNECTING STATE ===
        ) : callState.status === 'connecting' ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center gap-6"
          >
            <div className="relative">
              <Waveform isActive={false} color="blue" barCount={50} size="xl" />
              {/* Spinning ring */}
              <motion.div
                className="absolute -inset-8 rounded-full border-2 border-transparent"
                style={{ borderTopColor: '#4D9FFF', borderRightColor: 'rgba(77,159,255,0.3)' }}
                animate={{ rotate: 360 }}
                transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
              />
            </div>
            <div className="flex flex-col items-center gap-3">
              <p className="text-lg text-white font-semibold">Connecting to Drill...</p>
              <div className="flex gap-1.5">
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    className="w-2.5 h-2.5 rounded-full bg-[#4D9FFF]"
                    animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1, 0.8] }}
                    transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                  />
                ))}
              </div>
            </div>
          </motion.div>

        // === ENDED STATE ===
        ) : callState.status === 'ended' ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center gap-6"
          >
            <motion.div
              className="relative w-24 h-24 rounded-full bg-gradient-to-br from-[rgba(0,255,148,0.15)] to-[rgba(0,255,148,0.05)] flex items-center justify-center"
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              <Phone className="w-10 h-10 text-[#00FF94]" />
              <motion.div
                className="absolute -inset-2 rounded-full border border-[rgba(0,255,148,0.2)]"
                animate={{ scale: [1, 1.2], opacity: [0.5, 0] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
            </motion.div>
            <div className="text-center">
              <p className="text-xl text-white font-bold mb-1">Standup complete</p>
              <p className="text-sm text-[#888]">Analyzing your commitments...</p>
            </div>
            <div className="flex gap-1.5 mt-2">
              {[0, 1, 2, 3, 4].map((i) => (
                <motion.div
                  key={i}
                  className="w-1.5 h-6 rounded-full bg-[#00FF94]"
                  animate={{ height: [6, 20, 6], opacity: [0.3, 1, 0.3] }}
                  transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.1 }}
                />
              ))}
            </div>
          </motion.div>

        // === ACTIVE CALL ===
        ) : (
          <>
            {/* Active call — waveform with gradient ring */}
            <div className="relative">
              <Waveform
                isActive={isActive}
                color={waveformColor}
                barCount={60}
                size="xl"
              />
              {/* Pulsing ring */}
              <motion.div
                className="absolute -inset-6 rounded-full border"
                style={{
                  borderColor: callState.isSpeaking === 'ai' ? 'rgba(77,159,255,0.2)' : callState.isSpeaking === 'user' ? 'rgba(0,255,148,0.2)' : 'rgba(255,255,255,0.05)',
                }}
                animate={{
                  scale: callState.isSpeaking !== 'none' ? [1, 1.05, 1] : 1,
                  opacity: callState.isSpeaking !== 'none' ? [0.5, 1, 0.5] : 0.3,
                }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
              <motion.div
                className="absolute -inset-12 rounded-full border"
                style={{
                  borderColor: callState.isSpeaking === 'ai' ? 'rgba(77,159,255,0.08)' : callState.isSpeaking === 'user' ? 'rgba(0,255,148,0.08)' : 'rgba(255,255,255,0.02)',
                }}
                animate={{
                  scale: callState.isSpeaking !== 'none' ? [1, 1.03, 1] : 1,
                }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            </div>

            {/* Speaking indicator */}
            <div className="flex items-center gap-2.5 mt-2">
              <motion.div
                className="w-2.5 h-2.5 rounded-full"
                animate={{
                  background:
                    callState.isSpeaking === 'ai'
                      ? '#4D9FFF'
                      : callState.isSpeaking === 'user'
                      ? '#00FF94'
                      : '#555',
                  scale: callState.isSpeaking !== 'none' ? [1, 1.4, 1] : 1,
                  boxShadow: callState.isSpeaking === 'ai'
                    ? '0 0 12px rgba(77,159,255,0.5)'
                    : callState.isSpeaking === 'user'
                    ? '0 0 12px rgba(0,255,148,0.5)'
                    : 'none',
                }}
                transition={{
                  scale: { repeat: Infinity, duration: 1 },
                  background: { duration: 0.3 },
                }}
              />
              <span className="text-sm font-medium" style={{
                color: callState.isSpeaking === 'ai' ? '#4D9FFF' : callState.isSpeaking === 'user' ? '#00FF94' : '#888',
              }}>
                {callState.isSpeaking === 'ai'
                  ? 'Drill is speaking'
                  : callState.isSpeaking === 'user'
                  ? 'Listening to you...'
                  : 'Processing...'}
              </span>
            </div>

            {/* Live transcript (last message) — glassmorphic card */}
            <AnimatePresence mode="wait">
              {transcript.length > 0 && (
                <motion.div
                  key={transcript.length}
                  initial={{ opacity: 0, y: 15, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  className="max-w-md text-center px-6 py-4 rounded-2xl backdrop-blur-sm bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.06)]"
                >
                  <p className="text-sm text-[#ccc] italic leading-relaxed">
                    &ldquo;{transcript[transcript.length - 1].split(': ').slice(1).join(': ')}&rdquo;
                  </p>
                  <p className="text-[10px] text-[#555] mt-2 font-medium uppercase tracking-wider">
                    {transcript[transcript.length - 1].split(':')[0]}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Transcript count */}
            {transcript.length > 1 && (
              <p className="text-[11px] text-[#444] px-3 py-1 rounded-full bg-[rgba(255,255,255,0.02)]">
                {transcript.length} messages
              </p>
            )}
          </>
        )}
      </div>

      {/* Bottom controls — glassmorphic bar */}
      {callState.status === 'active' && (
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute bottom-8 flex items-center gap-4 px-6 py-4 rounded-2xl backdrop-blur-xl bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.06)]"
        >
          {/* Mute button */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={toggleMute}
            className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${
              isMuted
                ? 'bg-[rgba(255,61,61,0.15)] text-[#FF3D3D] ring-2 ring-[rgba(255,61,61,0.3)]'
                : 'bg-[rgba(255,255,255,0.08)] text-white hover:bg-[rgba(255,255,255,0.12)]'
            }`}
            id="mute-button"
          >
            {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
          </motion.button>

          {/* End call button */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={handleEndCall}
            className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#FF3D3D] to-[#CC0000] flex items-center justify-center shadow-lg shadow-[rgba(255,61,61,0.3)]"
            id="end-call-button"
          >
            <PhoneOff className="w-7 h-7 text-white" />
          </motion.button>
        </motion.div>
      )}
    </div>
  );
}
