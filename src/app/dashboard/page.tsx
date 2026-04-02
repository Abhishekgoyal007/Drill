'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Flame,
  TrendingUp,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Phone,
  Calendar,
  Target,
  Clock,
  Settings,
  Loader2,
  Sparkles,
  Zap,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import Heatmap from '@/components/Heatmap';
import { useAuth } from '@/lib/auth-context';
import {
  getRecentStandups,
  getHeatmapData,
  calculateStreak,
  detectPatterns,
} from '@/lib/firestore';
import { Standup, PatternDetection } from '@/lib/types';

function AnimatedCounter({ value, suffix = '', color }: { value: number; suffix?: string; color: string }) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const duration = 1200;
    const steps = 30;
    const stepValue = value / steps;
    let current = 0;
    const timer = setInterval(() => {
      current += stepValue;
      if (current >= value) {
        setDisplayValue(value);
        clearInterval(timer);
      } else {
        setDisplayValue(Math.floor(current));
      }
    }, duration / steps);
    return () => clearInterval(timer);
  }, [value]);

  return (
    <span style={{ color }} className="font-black">
      {displayValue}{suffix}
    </span>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const { user, profile, loading: authLoading } = useAuth();
  const [dataLoading, setDataLoading] = useState(true);
  const [stats, setStats] = useState({ streak: 0, longestStreak: 0, total: 0, deliveryRate: 100 });
  const [recentStandups, setRecentStandups] = useState<Standup[]>([]);
  const [heatmapData, setHeatmapData] = useState<Record<string, boolean>>({});
  const [patterns, setPatterns] = useState<PatternDetection[]>([]);
  const [expandedStandup, setExpandedStandup] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/');
    }
    if (!authLoading && profile && !profile.onboarded) {
      router.push('/onboarding');
    }
  }, [authLoading, user, profile, router]);

  useEffect(() => {
    if (user && profile?.onboarded) {
      loadData();
    }
  }, [user, profile]);

  const loadData = async () => {
    if (!user) return;
    setDataLoading(true);
    try {
      const [standups, heatmap, streakData, patternsData] = await Promise.all([
        getRecentStandups(user.uid, 7),
        getHeatmapData(user.uid),
        calculateStreak(user.uid),
        detectPatterns(user.uid),
      ]);
      setRecentStandups(standups);
      setHeatmapData(heatmap);
      setStats(streakData);
      setPatterns(patternsData);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setDataLoading(false);
    }
  };



  if (authLoading || !user || !profile) return null;

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] pb-20 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full blur-[150px] bg-[rgba(77,159,255,0.04)] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full blur-[120px] bg-[rgba(0,255,148,0.03)] pointer-events-none" />

      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="sticky top-0 z-50 backdrop-blur-xl bg-[rgba(10,10,10,0.8)] border-b border-[rgba(255,255,255,0.06)]"
      >
        <div className="max-w-5xl mx-auto flex items-center justify-between px-6 py-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#4D9FFF] to-[#0066FF] flex items-center justify-center shadow-lg shadow-[rgba(77,159,255,0.2)]">
              <span className="text-white font-black text-sm">D</span>
            </div>
            <div className="hidden sm:block">
              <span className="text-white font-bold text-lg tracking-tight">Drill</span>
              <span className="text-[#555] text-xs ml-2">Dashboard</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => router.push('/call')}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#4D9FFF] to-[#0066FF] text-white font-semibold text-sm shadow-lg shadow-[rgba(77,159,255,0.25)] hover:shadow-[rgba(77,159,255,0.4)] transition-shadow"
              id="start-drill-button"
            >
              <Phone className="w-4 h-4" />
              Start Drill
            </motion.button>
            <button
              onClick={() => router.push('/settings')}
              className="p-2.5 text-[#555] hover:text-white hover:bg-[rgba(255,255,255,0.04)] rounded-xl transition-all"
              id="settings-button"
            >
              <Settings className="w-4 h-4" />
            </button>
            {profile.photoURL && (
              <button
                onClick={() => router.push('/settings')}
                className="relative group"
              >
                <img
                  src={profile.photoURL}
                  alt={profile.name}
                  className="w-8 h-8 rounded-full ring-2 ring-[rgba(255,255,255,0.06)] hover:ring-[rgba(77,159,255,0.4)] transition-all"
                  referrerPolicy="no-referrer"
                />
              </button>
            )}
          </div>
        </div>
      </motion.header>

      <div className="max-w-5xl mx-auto px-6 pt-8 relative z-10">
        {/* Welcome */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
            <div>
              <h1 className="text-3xl font-black text-white mb-1 flex items-center gap-3">
                {greeting()}, {profile.name.split(' ')[0]}
                {stats.streak >= 3 && <Sparkles className="w-6 h-6 text-[#FFD700]" />}
              </h1>
              <p className="text-[#888]">
                {stats.streak > 0
                  ? `${stats.streak}-day streak. ${stats.streak >= 7 ? "You're a machine. 🔥" : stats.streak >= 3 ? "Keep pushing. 💪" : "Building momentum."}`
                  : 'Time to start your streak. No excuses.'}
              </p>
            </div>

            {/* DEMO TRIGGER CARD */}
            <motion.div 
              whileHover={{ scale: 1.02 }}
              className="relative p-4 rounded-3xl bg-gradient-to-br from-blue-600/20 to-blue-900/10 border border-blue-500/20 backdrop-blur-xl overflow-hidden group cursor-pointer"
              onClick={() => {
                // Vibration physics
                if (navigator.vibrate) navigator.vibrate([200, 100, 200, 100, 500]);
                
                // Fire notification after 3s delay for "magic" effect
                setTimeout(() => {
                  if ('Notification' in window && Notification.permission === 'granted') {
                    new Notification("It's Drill Time! 🥊", {
                      body: `Morning Abhishek. Ready to ship your goals for today?`,
                      icon: '/icons/icon-192.png',
                      tag: 'drill-call'
                    });
                  }
                  router.push('/call');
                }, 3000);
              }}
            >
              <div className="absolute top-0 right-0 p-3 opacity-20 group-hover:opacity-40 transition-opacity">
                <Phone className="w-12 h-12 text-blue-400 rotate-12" />
              </div>
              <div className="relative z-10 flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-blue-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
                  <Zap className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-white font-bold text-sm">Simulator Trigger</h3>
                  <p className="text-[10px] text-blue-400 font-bold uppercase tracking-wider">Demo morning call</p>
                </div>
              </div>
            </motion.div>
          </div>

        {/* Loading */}
        {dataLoading && (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="w-8 h-8 text-[#4D9FFF] animate-spin" />
            <p className="text-sm text-[#555]">Loading your data...</p>
          </div>
        )}

        {!dataLoading && (
          <>
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              {/* Streak Card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="relative overflow-hidden rounded-2xl border border-[rgba(0,255,148,0.15)] bg-[rgba(0,255,148,0.03)] p-6 text-center group hover:border-[rgba(0,255,148,0.3)] transition-all"
              >
                <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-[rgba(0,255,148,0.08)] to-transparent" />
                <div className="relative z-10">
                  <div className="flex items-center justify-center gap-2 mb-3">
                    <Flame className="w-5 h-5 text-[#00FF94]" />
                    <span className="text-sm text-[#888] font-medium">Current Streak</span>
                  </div>
                  <p className="text-6xl font-black text-[#00FF94]">
                    <AnimatedCounter value={stats.streak} color="#00FF94" />
                  </p>
                  <p className="text-xs text-[#555] mt-2">
                    Longest: {stats.longestStreak} days
                  </p>
                </div>
                {stats.streak >= 7 && (
                  <div className="absolute top-3 right-3">
                    <Zap className="w-4 h-4 text-[#FFD700]" />
                  </div>
                )}
              </motion.div>

              {/* Delivery Rate Card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="relative overflow-hidden rounded-2xl border border-[rgba(77,159,255,0.15)] bg-[rgba(77,159,255,0.03)] p-6 text-center group hover:border-[rgba(77,159,255,0.3)] transition-all"
              >
                <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-[rgba(77,159,255,0.08)] to-transparent" />
                <div className="relative z-10">
                  <div className="flex items-center justify-center gap-2 mb-3">
                    <Target className="w-5 h-5 text-[#4D9FFF]" />
                    <span className="text-sm text-[#888] font-medium">Delivery Rate</span>
                  </div>
                  <p className="text-6xl font-black">
                    <AnimatedCounter value={stats.deliveryRate} suffix="%" color="#4D9FFF" />
                  </p>
                  <p className="text-xs text-[#555] mt-2">
                    How often you do what you say
                  </p>
                </div>
                {/* Progress ring visual */}
                <div className="absolute -bottom-4 -right-4 w-20 h-20 rounded-full border-4 border-[rgba(77,159,255,0.1)] opacity-50" />
              </motion.div>

              {/* Total Standups Card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="relative overflow-hidden rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.02)] p-6 text-center group hover:border-[rgba(255,255,255,0.15)] transition-all"
              >
                <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-[rgba(255,255,255,0.03)] to-transparent" />
                <div className="relative z-10">
                  <div className="flex items-center justify-center gap-2 mb-3">
                    <Calendar className="w-5 h-5 text-white" />
                    <span className="text-sm text-[#888] font-medium">Total Standups</span>
                  </div>
                  <p className="text-6xl font-black">
                    <AnimatedCounter value={stats.total} color="#ffffff" />
                  </p>
                  <p className="text-xs text-[#555] mt-2">
                    Since {new Date(profile.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </p>
                </div>
              </motion.div>
            </div>

            {/* Patterns Detected */}
            <AnimatePresence>
              {patterns.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="mb-8"
                >
                  <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-[rgba(255,61,61,0.1)] flex items-center justify-center">
                      <AlertTriangle className="w-4 h-4 text-[#FF3D3D]" />
                    </div>
                    Patterns Detected
                    <span className="text-xs text-[#FF3D3D] bg-[rgba(255,61,61,0.1)] px-2 py-0.5 rounded-full font-medium">
                      {patterns.length}
                    </span>
                  </h2>
                  <div className="space-y-3">
                    {patterns.map((pattern, i) => (
                      <PatternCard key={i} pattern={pattern} index={i} />
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Heatmap */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="rounded-2xl border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.02)] p-6 mb-8 hover:border-[rgba(0,255,148,0.15)] transition-all"
            >
              <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[rgba(0,255,148,0.1)] flex items-center justify-center">
                  <TrendingUp className="w-4 h-4 text-[#00FF94]" />
                </div>
                Standup History
              </h2>
              <Heatmap data={heatmapData} />
            </motion.div>

            {/* Recent Standups */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
            >
              <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[rgba(77,159,255,0.1)] flex items-center justify-center">
                  <Clock className="w-4 h-4 text-[#4D9FFF]" />
                </div>
                Recent Standups
              </h2>
              <div className="space-y-3">
                {recentStandups.length === 0 ? (
                  <motion.div
                    className="rounded-2xl border border-dashed border-[rgba(255,255,255,0.1)] p-12 text-center"
                  >
                    <div className="w-16 h-16 rounded-2xl bg-[rgba(77,159,255,0.1)] flex items-center justify-center mx-auto mb-4">
                      <Phone className="w-7 h-7 text-[#4D9FFF]" />
                    </div>
                    <p className="text-white font-semibold mb-1">No standups yet</p>
                    <p className="text-sm text-[#888] mb-5">Start your first drill and build your streak</p>
                    <button
                      onClick={() => router.push('/call')}
                      className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-[#4D9FFF] to-[#0066FF] text-white font-semibold text-sm shadow-lg shadow-[rgba(77,159,255,0.25)]"
                    >
                      <Phone className="w-4 h-4" />
                      Start Your First Drill
                    </button>
                  </motion.div>
                ) : (
                  recentStandups.map((standup, i) => (
                    <motion.div
                      key={standup.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.8 + i * 0.05 }}
                      layout
                      className="rounded-2xl border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.02)] overflow-hidden cursor-pointer group hover:border-[rgba(255,255,255,0.12)] transition-all"
                      onClick={() =>
                        setExpandedStandup(expandedStandup === standup.id ? null : standup.id)
                      }
                    >
                      <div className="p-5 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          {/* Status indicator */}
                          <div className="relative">
                            <div
                              className="w-10 h-10 rounded-xl flex items-center justify-center"
                              style={{
                                background:
                                  standup.delivered === true
                                    ? 'rgba(0,255,148,0.1)'
                                    : standup.delivered === false
                                    ? 'rgba(255,61,61,0.1)'
                                    : 'rgba(77,159,255,0.1)',
                              }}
                            >
                              <div
                                className="w-3 h-3 rounded-full"
                                style={{
                                  background:
                                    standup.delivered === true
                                      ? '#00FF94'
                                      : standup.delivered === false
                                      ? '#FF3D3D'
                                      : '#4D9FFF',
                                  boxShadow:
                                    standup.delivered === true
                                      ? '0 0 8px rgba(0,255,148,0.5)'
                                      : standup.delivered === false
                                      ? '0 0 8px rgba(255,61,61,0.5)'
                                      : '0 0 8px rgba(77,159,255,0.5)',
                                }}
                              />
                            </div>
                          </div>
                          <div>
                            <p className="text-white font-semibold text-sm">
                              {new Date(standup.date).toLocaleDateString('en-US', {
                                weekday: 'long',
                                month: 'short',
                                day: 'numeric',
                              })}
                            </p>
                            <p className="text-[#888] text-xs mt-0.5 line-clamp-1 max-w-[250px]">
                              {standup.summary}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          {standup.commitments.length > 0 && (
                            <span className="text-[10px] text-[#555] bg-[rgba(255,255,255,0.04)] px-2 py-1 rounded-lg hidden sm:block">
                              {standup.commitments.length} commitment{standup.commitments.length > 1 ? 's' : ''}
                            </span>
                          )}
                          {standup.duration > 0 && (
                            <span className="text-xs text-[#555] font-mono">
                              {Math.floor(standup.duration / 60)}:{(standup.duration % 60).toString().padStart(2, '0')}
                            </span>
                          )}
                          <div className="text-[#555] group-hover:text-[#888] transition-colors">
                            {expandedStandup === standup.id ? (
                              <ChevronUp className="w-4 h-4" />
                            ) : (
                              <ChevronDown className="w-4 h-4" />
                            )}
                          </div>
                        </div>
                      </div>

                      <AnimatePresence>
                        {expandedStandup === standup.id && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                          >
                            <div className="px-5 pb-5 border-t border-[rgba(255,255,255,0.06)]">
                              <div className="pt-4 space-y-4">
                                {/* Summary */}
                                <div>
                                  <p className="text-[10px] text-[#555] font-bold uppercase tracking-wider mb-1.5">Summary</p>
                                  <p className="text-sm text-[#ccc] leading-relaxed">{standup.summary}</p>
                                </div>

                                {/* Commitments */}
                                {standup.commitments.length > 0 && (
                                  <div>
                                    <p className="text-[10px] text-[#555] font-bold uppercase tracking-wider mb-1.5">Commitments</p>
                                    <div className="space-y-1.5">
                                      {standup.commitments.map((c, j) => (
                                        <div key={j} className="flex items-start gap-2.5 text-sm text-[#ccc]">
                                          <div className="w-5 h-5 rounded-md bg-[rgba(77,159,255,0.1)] flex items-center justify-center mt-0.5 flex-shrink-0">
                                            <span className="text-[9px] text-[#4D9FFF] font-bold">{j + 1}</span>
                                          </div>
                                          {c}
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {/* Blockers */}
                                {standup.blockers.length > 0 && (
                                  <div>
                                    <p className="text-[10px] text-[#555] font-bold uppercase tracking-wider mb-1.5">Blockers</p>
                                    <div className="space-y-1.5">
                                      {standup.blockers.map((b, j) => (
                                        <div key={j} className="flex items-start gap-2.5 text-sm text-[#FF3D3D]">
                                          <div className="w-5 h-5 rounded-md bg-[rgba(255,61,61,0.1)] flex items-center justify-center mt-0.5 flex-shrink-0">
                                            <AlertTriangle className="w-3 h-3 text-[#FF3D3D]" />
                                          </div>
                                          {b}
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {/* Delivery status */}
                                <div className="flex items-center gap-3 pt-2 border-t border-[rgba(255,255,255,0.04)]">
                                  <span className="text-[10px] text-[#555] font-bold uppercase tracking-wider">Delivered:</span>
                                  <span
                                    className="text-xs font-semibold px-2.5 py-1 rounded-lg"
                                    style={{
                                      background:
                                        standup.delivered === true
                                          ? 'rgba(0,255,148,0.1)'
                                          : standup.delivered === false
                                          ? 'rgba(255,61,61,0.1)'
                                          : 'rgba(255,255,255,0.04)',
                                      color:
                                        standup.delivered === true
                                          ? '#00FF94'
                                          : standup.delivered === false
                                          ? '#FF3D3D'
                                          : '#888',
                                    }}
                                  >
                                    {standup.delivered === true
                                      ? '✅ Yes'
                                      : standup.delivered === false
                                      ? '❌ No'
                                      : '⏳ Pending'}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  ))
                )}
              </div>
            </motion.div>
          </>
        )}
      </div>
    </div>
  );
}

function PatternCard({ pattern, index }: { pattern: PatternDetection; index: number }) {
  const severityConfig = {
    low: { bg: 'rgba(255, 159, 67, 0.08)', border: 'rgba(255, 159, 67, 0.2)', text: '#FF9F43', label: 'LOW' },
    medium: { bg: 'rgba(255, 61, 61, 0.08)', border: 'rgba(255, 61, 61, 0.2)', text: '#FF3D3D', label: 'MED' },
    high: { bg: 'rgba(255, 61, 61, 0.12)', border: 'rgba(255, 61, 61, 0.3)', text: '#FF3D3D', label: 'HIGH' },
  };
  const config = severityConfig[pattern.severity];

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1 }}
      className={`rounded-2xl p-5 border-l-[3px] ${pattern.severity === 'high' ? 'animate-red-flash' : ''}`}
      style={{
        borderLeftColor: config.text,
        background: config.bg,
        borderTop: `1px solid ${config.border}`,
        borderRight: `1px solid ${config.border}`,
        borderBottom: `1px solid ${config.border}`,
      }}
    >
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <AlertTriangle className="w-4 h-4" style={{ color: config.text }} />
            <span
              className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded"
              style={{ background: config.bg, color: config.text }}
            >
              {config.label} · {pattern.type}
            </span>
          </div>
          <p className="text-white font-semibold text-sm capitalize">{pattern.description}</p>
          <p className="text-[#888] text-xs mt-1">
            {pattern.frequency}× in last 7 days · Since{' '}
            {new Date(pattern.firstSeen).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </p>
        </div>
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-black"
          style={{ background: config.bg, color: config.text }}
        >
          {pattern.frequency}×
        </div>
      </div>
    </motion.div>
  );
}
