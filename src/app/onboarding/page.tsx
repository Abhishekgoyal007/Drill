'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, ArrowLeft, ListTodo, Clock, Check, Mic, MicOff, Globe } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';

const TIMEZONE_OPTIONS = [
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'America/Sao_Paulo',
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'Asia/Dubai',
  'Asia/Kolkata',
  'Asia/Shanghai',
  'Asia/Tokyo',
  'Australia/Sydney',
  'Pacific/Auckland',
];

function getTimezoneLabel(tz: string) {
  try {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
    const time = formatter.format(now);
    const city = tz.split('/').pop()?.replace(/_/g, ' ') || tz;
    return `${city} (${time})`;
  } catch {
    return tz;
  }
}

export default function OnboardingPage() {
  const router = useRouter();
  const { user, profile, loading, updateProfile } = useAuth();
  const [step, setStep] = useState(1);
  const [mounted, setMounted] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [micError, setMicError] = useState('');
  const recognitionRef = useRef<any>(null);
  const [formData, setFormData] = useState({
    tasks: '',
    callTime: '09:00',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
    }
    if (!loading && profile?.onboarded) {
      router.push('/dashboard');
    }
  }, [loading, user, profile, router]);

  // Speech recognition setup
  const startRecording = () => {
    setMicError('');
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setMicError('Speech recognition not supported. Please type your tasks instead.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    let baseText = formData.tasks;

    recognition.onresult = (event: any) => {
      let transcript = '';
      for (let i = 0; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      setFormData((prev) => ({
        ...prev,
        tasks: baseText ? baseText + ' ' + transcript : transcript,
      }));
    };

    recognition.onerror = (event: any) => {
      setIsRecording(false);
      if (event.error === 'network') {
        setMicError('Voice input blocked (ad blocker or network issue). Please type your tasks instead.');
      } else if (event.error === 'not-allowed') {
        setMicError('Microphone access denied. Please allow mic access in browser settings.');
      } else {
        setMicError(`Voice input error. Please type your tasks instead.`);
      }
    };

    recognition.onend = () => {
      setIsRecording(false);
    };

    recognitionRef.current = recognition;
    try {
      recognition.start();
      setIsRecording(true);
    } catch {
      setMicError('Could not start voice input. Please type your tasks instead.');
    }
  };

  const stopRecording = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsRecording(false);
  };

  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  if (!mounted || loading || !user || !profile) return null;

  const canProceed = () => {
    if (step === 1) return formData.tasks.trim().length > 0;
    if (step === 2) return formData.callTime && formData.timezone;
    return false;
  };

  const handleNext = async () => {
    if (step < 2) {
      setStep(step + 1);
    } else {
      await updateProfile({
        project: formData.tasks,
        callTime: formData.callTime,
        timezone: formData.timezone,
        onboarded: true,
      });
      router.push('/dashboard');
    }
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full"
        style={{
          background:
            'radial-gradient(circle, rgba(77, 159, 255, 0.06) 0%, transparent 70%)',
        }}
      />

      <div className="relative z-10 w-full max-w-lg">
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 mb-4"
        >
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#4D9FFF] to-[#0066FF] flex items-center justify-center shadow-lg shadow-[rgba(77,159,255,0.2)]">
            <span className="text-white font-black text-sm">D</span>
          </div>
          <span className="text-white font-bold text-xl tracking-tight">Drill</span>
        </motion.div>

        {/* Welcome */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex items-center gap-3 mb-10 rounded-2xl border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.02)] p-4"
        >
          {profile.photoURL && (
            <img
              src={profile.photoURL}
              alt={profile.name}
              className="w-10 h-10 rounded-full ring-2 ring-[rgba(77,159,255,0.2)]"
              referrerPolicy="no-referrer"
            />
          )}
          <div>
            <p className="text-white font-medium text-sm">Welcome, {profile.name}!</p>
            <p className="text-[#888] text-xs">{profile.email}</p>
          </div>
        </motion.div>

        {/* Step indicator */}
        <div className="flex items-center gap-3 mb-8">
          {[1, 2].map((s) => (
            <div key={s} className="flex items-center gap-3">
              <div
                className="flex items-center justify-center w-8 h-8 rounded-full transition-all"
                style={{
                  background:
                    s < step
                      ? '#00FF94'
                      : s === step
                      ? '#4D9FFF'
                      : 'rgba(255,255,255,0.06)',
                }}
              >
                {s < step ? (
                  <Check className="w-4 h-4 text-black" />
                ) : (
                  <span className={`text-xs font-bold ${s === step ? 'text-white' : 'text-[#555]'}`}>
                    {s}
                  </span>
                )}
              </div>
              {s < 2 && (
                <div
                  className="w-12 h-[2px] rounded-full transition-all"
                  style={{ background: s < step ? '#00FF94' : 'rgba(255,255,255,0.06)' }}
                />
              )}
            </div>
          ))}
        </div>

        {/* Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.3 }}
          >
            {/* === STEP 1: Tasks === */}
            {step === 1 && (
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-[rgba(77,159,255,0.1)]">
                    <ListTodo className="w-5 h-5 text-[#4D9FFF]" />
                  </div>
                  <h1 className="text-2xl font-bold text-white">What&apos;s on your plate?</h1>
                </div>
                <p className="text-[#888] mb-6 ml-[52px]">
                  Tell Drill what you&apos;re working on. Type it out or tap the mic to speak.
                </p>

                {/* Guide pills */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {[
                    '📋 What did you do yesterday?',
                    '🎯 What will you do today?',
                    '📅 What\'s planned for tomorrow?',
                  ].map((hint) => (
                    <span
                      key={hint}
                      className="text-xs px-3 py-1.5 rounded-full bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.06)] text-[#888]"
                    >
                      {hint}
                    </span>
                  ))}
                </div>

                {/* Text area with mic button */}
                <div className="relative">
                  <textarea
                    value={formData.tasks}
                    onChange={(e) => setFormData({ ...formData, tasks: e.target.value })}
                    placeholder="Yesterday I completed my resume draft, hit the gym, and studied 2 chapters. Today I'll apply to 3 jobs, finish chapter 3, and attend the networking event. Tomorrow I need to follow up on applications and start the online course..."
                    className="drill-input min-h-[160px] resize-none pr-14"
                    autoFocus
                    id="onboarding-tasks-input"
                  />
                  {/* Mic button */}
                  <button
                    onClick={toggleRecording}
                    className={`absolute right-3 top-3 w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                      isRecording
                        ? 'bg-[#FF3D3D] text-white shadow-lg shadow-[rgba(255,61,61,0.3)] animate-pulse'
                        : 'bg-[rgba(77,159,255,0.1)] text-[#4D9FFF] hover:bg-[rgba(77,159,255,0.2)]'
                    }`}
                    id="onboarding-mic-button"
                    type="button"
                  >
                    {isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                  </button>
                </div>
                {isRecording && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-xs text-[#FF3D3D] mt-2 flex items-center gap-2"
                  >
                    <span className="w-2 h-2 rounded-full bg-[#FF3D3D] animate-pulse" />
                    Listening... Speak your tasks and tap the mic again to stop.
                  </motion.p>
                )}
                {micError && !isRecording && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-xs text-[#FF8C00] mt-2 flex items-center gap-2"
                  >
                    ⚠️ {micError}
                  </motion.p>
                )}
                {!isRecording && !micError && (
                  <p className="text-xs text-[#555] mt-2">
                    💡 Mention yesterday, today, and tomorrow — Drill will track all of it.
                  </p>
                )}
              </div>
            )}

            {/* === STEP 2: Time + Timezone === */}
            {step === 2 && (
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-[rgba(77,159,255,0.1)]">
                    <Clock className="w-5 h-5 text-[#4D9FFF]" />
                  </div>
                  <h1 className="text-2xl font-bold text-white">When should Drill call you?</h1>
                </div>
                <p className="text-[#888] mb-6 ml-[52px]">
                  Pick your daily check-in time. Drill will be there. Every. Single. Day.
                </p>

                {/* Time input */}
                <label className="block text-sm text-[#888] mb-2 font-medium">
                  Daily check-in time
                </label>
                <input
                  type="time"
                  value={formData.callTime}
                  onChange={(e) => setFormData({ ...formData, callTime: e.target.value })}
                  className="drill-input text-center text-2xl font-mono"
                  id="onboarding-time-input"
                />

                <div className="flex gap-2 mt-3 flex-wrap">
                  {['07:00', '08:00', '09:00', '10:00'].map((time) => (
                    <button
                      key={time}
                      onClick={() => setFormData({ ...formData, callTime: time })}
                      className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                        formData.callTime === time
                          ? 'bg-gradient-to-r from-[#4D9FFF] to-[#0066FF] text-white shadow-lg shadow-[rgba(77,159,255,0.2)]'
                          : 'bg-[rgba(255,255,255,0.04)] text-[#888] hover:bg-[rgba(255,255,255,0.08)] hover:text-white'
                      }`}
                    >
                      {time}
                    </button>
                  ))}
                </div>

                {/* Timezone selector */}
                <label className="flex items-center gap-2 text-sm text-[#888] mb-2 font-medium mt-6">
                  <Globe className="w-4 h-4" />
                  Your timezone
                </label>
                <select
                  value={formData.timezone}
                  onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
                  className="drill-input cursor-pointer"
                  id="onboarding-timezone-select"
                >
                  {TIMEZONE_OPTIONS.map((tz) => (
                    <option key={tz} value={tz} className="bg-[#151515] text-white">
                      {getTimezoneLabel(tz)}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-[#555] mt-2">
                  Drill will call you at {formData.callTime} in your selected timezone. No excuses.
                </p>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-10">
          <button
            onClick={handleBack}
            className={`flex items-center gap-2 text-sm text-[#888] hover:text-white transition-colors ${
              step === 1 ? 'invisible' : ''
            }`}
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
          <button
            onClick={handleNext}
            disabled={!canProceed()}
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-[#4D9FFF] to-[#0066FF] text-white font-semibold text-sm shadow-lg shadow-[rgba(77,159,255,0.25)] disabled:opacity-40 disabled:shadow-none transition-all"
            id="onboarding-next-button"
          >
            {step === 2 ? (
              <>
                Start Drilling
                <Check className="w-5 h-5" />
              </>
            ) : (
              <>
                Continue
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
