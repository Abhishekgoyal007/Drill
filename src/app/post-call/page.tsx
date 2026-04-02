'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Check,
  X,
  ArrowRight,
  Share2,
  BarChart3,
  MessageSquareQuote,
  Loader2,
  ArrowLeft,
  Trophy,
  Sparkles,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import {
  getRecentStandups,
  getYesterdayStandup,
  markDelivery,
  calculateStreak,
} from '@/lib/firestore';
import { Standup } from '@/lib/types';

export default function PostCallPage() {
  const router = useRouter();
  const { user, profile, loading: authLoading } = useAuth();
  const [dataLoading, setDataLoading] = useState(true);
  const [latestStandup, setLatestStandup] = useState<Standup | null>(null);
  const [yesterdayStandup, setYesterdayStandup] = useState<(Standup & { id: string }) | null>(null);
  const [commitmentChecks, setCommitmentChecks] = useState<Record<number, boolean>>({});
  const [streak, setStreak] = useState(0);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/');
      return;
    }
    if (user) {
      loadData();
    }
  }, [authLoading, user, router]);

  const loadData = async () => {
    if (!user) return;
    setDataLoading(true);
    try {
      const [recent, yesterday, stats] = await Promise.all([
        getRecentStandups(user.uid, 1),
        getYesterdayStandup(user.uid),
        calculateStreak(user.uid),
      ]);
      if (recent.length > 0) {
        setLatestStandup(recent[0]);
      }
      setYesterdayStandup(yesterday);
      setStreak(stats.streak);
    } catch (error) {
      console.error('Error loading post-call data:', error);
    } finally {
      setDataLoading(false);
    }
  };

  const handleShare = () => {
    const text = `Day ${streak} ✅\n\nJust completed my daily drill with @DrillAI\n\nStreak: ${streak} days 🔥\n\nThe scrum master that never lets you off the hook.`;
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  if (authLoading || !user || !profile) return null;

  const brutalQuotes = [
    "You showed up. That's more than most. Don't let it get to your head.",
    "Talk is cheap. Execution is everything. Prove it today.",
    "Another day, another standup. Now go actually do the work.",
    "I've heard a lot of promises. I only count delivered results.",
    "You're only as good as your last delivery. Clock's ticking.",
    "Showing up is step one. Delivering is the only step that matters.",
  ];

  const randomQuote = brutalQuotes[new Date().getDate() % brutalQuotes.length];

  return (
    <div className="min-h-screen bg-[#0A0A0A] relative overflow-hidden">
      {/* Background */}
      <div className="absolute top-0 right-1/4 w-[400px] h-[400px] rounded-full blur-[120px] bg-[rgba(0,255,148,0.04)] pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-[300px] h-[300px] rounded-full blur-[100px] bg-[rgba(77,159,255,0.03)] pointer-events-none" />

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="sticky top-0 z-50 backdrop-blur-xl bg-[rgba(10,10,10,0.8)] border-b border-[rgba(255,255,255,0.06)]"
      >
        <div className="max-w-lg mx-auto flex items-center justify-between px-6 py-4">
          <button
            onClick={() => router.push('/dashboard')}
            className="flex items-center gap-2 text-sm text-[#888] hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Dashboard
          </button>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-gradient-to-br from-[#4D9FFF] to-[#0066FF] flex items-center justify-center">
              <span className="text-white font-black text-[8px]">D</span>
            </div>
            <span className="text-white font-semibold text-sm">Post-Call</span>
          </div>
        </div>
      </motion.div>

      <div className="flex items-start justify-center p-6 pt-8">
        <div className="w-full max-w-lg">
          {/* Success header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', delay: 0.2 }}
              className="relative w-20 h-20 rounded-2xl bg-gradient-to-br from-[rgba(0,255,148,0.2)] to-[rgba(0,255,148,0.05)] flex items-center justify-center mx-auto mb-5"
            >
              <Check className="w-9 h-9 text-[#00FF94]" />
              <motion.div
                className="absolute -inset-2 rounded-2xl border border-[rgba(0,255,148,0.2)]"
                animate={{ scale: [1, 1.15], opacity: [0.5, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
              {streak >= 3 && (
                <motion.div
                  className="absolute -top-2 -right-2"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1, rotate: [0, 10, -10, 0] }}
                  transition={{ delay: 0.5, rotate: { delay: 1, duration: 0.5 } }}
                >
                  <Sparkles className="w-5 h-5 text-[#FFD700]" />
                </motion.div>
              )}
            </motion.div>
            <h1 className="text-2xl font-black text-white mb-1">Standup Complete</h1>
            <p className="text-[#888]">
              Day {streak} — {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
            </p>

            {/* Streak badge */}
            {streak >= 3 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="inline-flex items-center gap-2 mt-3 px-4 py-1.5 rounded-full bg-[rgba(255,215,0,0.08)] border border-[rgba(255,215,0,0.2)]"
              >
                <Trophy className="w-3.5 h-3.5 text-[#FFD700]" />
                <span className="text-xs text-[#FFD700] font-semibold">
                  {streak >= 7 ? '🔥 On fire!' : `${streak}-day streak!`}
                </span>
              </motion.div>
            )}
          </motion.div>

          {/* Brutal quote */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="rounded-2xl p-5 mb-6 border-l-[3px] border-l-[#FF3D3D] bg-[rgba(255,61,61,0.04)] border border-[rgba(255,61,61,0.1)]"
          >
            <div className="flex items-start gap-3">
              <MessageSquareQuote className="w-5 h-5 text-[#FF3D3D] mt-0.5 flex-shrink-0" />
              <p className="text-sm text-[#FF3D3D] italic font-medium leading-relaxed">
                &ldquo;{randomQuote}&rdquo;
              </p>
            </div>
          </motion.div>

          {dataLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 text-[#4D9FFF] animate-spin" />
            </div>
          ) : (
            <>
              {/* Yesterday's accountability */}
              <AnimatePresence>
                {yesterdayStandup && !yesterdayStandup.deliveryChecked && !submitted && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20, height: 0 }}
                    transition={{ delay: 0.3 }}
                    className="rounded-2xl p-5 mb-6 border border-[rgba(77,159,255,0.15)] bg-[rgba(77,159,255,0.03)]"
                  >
                    <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-[rgba(77,159,255,0.1)] flex items-center justify-center">
                        <BarChart3 className="w-3.5 h-3.5 text-[#4D9FFF]" />
                      </div>
                      Yesterday&apos;s Commitments — Did you deliver?
                    </h3>
                    <div className="space-y-3">
                      {yesterdayStandup.commitments.map((commitment, i) => (
                        <div key={i} className="flex items-center justify-between gap-3">
                          <span className="text-sm text-[#ccc] flex-1">{commitment}</span>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() =>
                                setCommitmentChecks({ ...commitmentChecks, [i]: true })
                              }
                              className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
                                commitmentChecks[i] === true
                                  ? 'bg-[#00FF94] text-black shadow-lg shadow-[rgba(0,255,148,0.3)]'
                                  : 'bg-[rgba(255,255,255,0.04)] text-[#555] hover:bg-[rgba(0,255,148,0.1)] hover:text-[#00FF94]'
                              }`}
                            >
                              <Check className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() =>
                                setCommitmentChecks({ ...commitmentChecks, [i]: false })
                              }
                              className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
                                commitmentChecks[i] === false
                                  ? 'bg-[#FF3D3D] text-white shadow-lg shadow-[rgba(255,61,61,0.3)]'
                                  : 'bg-[rgba(255,255,255,0.04)] text-[#555] hover:bg-[rgba(255,61,61,0.1)] hover:text-[#FF3D3D]'
                              }`}
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                    <button
                      onClick={async () => {
                        const allDelivered = Object.values(commitmentChecks).every(
                          (v) => v === true
                        );
                        await markDelivery(user.uid, yesterdayStandup.id, allDelivered);
                        setSubmitted(true);
                      }}
                      className="w-full mt-4 px-5 py-3 rounded-xl bg-gradient-to-r from-[#4D9FFF] to-[#0066FF] text-white font-semibold text-sm shadow-lg shadow-[rgba(77,159,255,0.2)] disabled:opacity-40 disabled:shadow-none transition-all"
                      disabled={
                        Object.keys(commitmentChecks).length !==
                        yesterdayStandup.commitments.length
                      }
                    >
                      Submit
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Today's commitments */}
              {latestStandup && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="rounded-2xl p-5 mb-6 border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.02)]"
                >
                  <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-[rgba(0,255,148,0.1)] flex items-center justify-center">
                      <Check className="w-3.5 h-3.5 text-[#00FF94]" />
                    </div>
                    Today&apos;s Commitments
                  </h3>
                  <div className="space-y-2.5">
                    {latestStandup.commitments.map((commitment, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.5 + i * 0.1 }}
                        className="flex items-center gap-3"
                      >
                        <div className="w-6 h-6 rounded-lg border border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.02)] flex items-center justify-center flex-shrink-0">
                          <span className="text-[10px] text-[#555] font-bold">{i + 1}</span>
                        </div>
                        <span className="text-sm text-[#ccc]">{commitment}</span>
                      </motion.div>
                    ))}
                  </div>
                  {latestStandup.blockers.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-[rgba(255,255,255,0.06)]">
                      <p className="text-xs text-[#FF3D3D] font-bold mb-2 uppercase tracking-wider">
                        ⚠️ Blockers
                      </p>
                      {latestStandup.blockers.map((blocker, i) => (
                        <p key={i} className="text-sm text-[#888] mb-1">
                          • {blocker}
                        </p>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}

              {/* Summary */}
              {latestStandup && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="rounded-2xl p-5 mb-6 border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.02)]"
                >
                  <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-[rgba(255,255,255,0.04)] flex items-center justify-center">
                      <MessageSquareQuote className="w-3.5 h-3.5 text-[#888]" />
                    </div>
                    Call Summary
                  </h3>
                  <p className="text-sm text-[#888] leading-relaxed ml-9">
                    {latestStandup.summary || 'Completed daily standup.'}
                  </p>
                </motion.div>
              )}
            </>
          )}

          {/* Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="flex flex-col gap-3 pb-8"
          >
            <button
              onClick={() => router.push('/dashboard')}
              className="w-full flex items-center justify-center gap-2 px-5 py-4 rounded-xl bg-gradient-to-r from-[#4D9FFF] to-[#0066FF] text-white font-bold text-sm shadow-lg shadow-[rgba(77,159,255,0.25)] hover:shadow-[rgba(77,159,255,0.4)] transition-shadow"
              id="go-to-dashboard-button"
            >
              Go to Dashboard
              <ArrowRight className="w-5 h-5" />
            </button>
            <button
              onClick={handleShare}
              className="w-full flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl border border-[rgba(255,255,255,0.08)] text-[#888] hover:text-white hover:border-[rgba(255,255,255,0.15)] hover:bg-[rgba(255,255,255,0.02)] transition-all text-sm font-medium"
              id="share-button"
            >
              <Share2 className="w-4 h-4" />
              Share to Twitter
            </button>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
