'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  User,
  Rocket,
  Clock,
  Save,
  Trash2,
  Check,
  AlertTriangle,
  LogOut,
  Sparkles,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { calculateStreak } from '@/lib/firestore';
import { doc, deleteDoc, collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export default function SettingsPage() {
  const router = useRouter();
  const { user, profile, loading: authLoading, updateProfile, signOut } = useAuth();
  const [formData, setFormData] = useState({
    project: '',
    callTime: '09:00',
  });
  const [stats, setStats] = useState({ streak: 0, longestStreak: 0, total: 0, deliveryRate: 100 });
  const [saved, setSaved] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/');
      return;
    }
    if (profile) {
      setFormData({
        project: profile.project || '',
        callTime: profile.callTime || '09:00',
      });
    }
    if (user) {
      calculateStreak(user.uid).then(setStats).catch(console.error);
    }
  }, [authLoading, user, profile, router]);

  const handleSave = async () => {
    if (!profile) return;
    await updateProfile({
      project: formData.project,
      callTime: formData.callTime,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleDelete = async () => {
    if (!user) return;
    try {
      const standupsRef = collection(db, 'users', user.uid, 'standups');
      const snapshot = await getDocs(standupsRef);
      for (const docSnap of snapshot.docs) {
        await deleteDoc(docSnap.ref);
      }
      await deleteDoc(doc(db, 'users', user.uid));
    } catch (error) {
      console.error('Error deleting data:', error);
    }
    await signOut();
    router.push('/');
  };

  if (authLoading || !user || !profile) return null;

  const hasChanges =
    formData.project !== (profile.project || '') ||
    formData.callTime !== (profile.callTime || '09:00');

  return (
    <div className="min-h-screen bg-[#0A0A0A] pb-20 relative overflow-hidden">
      {/* Background */}
      <div className="absolute top-0 left-1/3 w-[400px] h-[400px] rounded-full blur-[120px] bg-[rgba(77,159,255,0.03)] pointer-events-none" />

      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="sticky top-0 z-50 backdrop-blur-xl bg-[rgba(10,10,10,0.8)] border-b border-[rgba(255,255,255,0.06)]"
      >
        <div className="max-w-2xl mx-auto flex items-center justify-between px-6 py-4">
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
            <span className="text-white font-semibold text-sm">Settings</span>
          </div>
        </div>
      </motion.header>

      <div className="max-w-2xl mx-auto px-6 pt-8 relative z-10">
        {/* Save confirmation toast */}
        <AnimatePresence>
          {saved && (
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.9 }}
              className="fixed top-20 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-5 py-3 rounded-xl bg-[#00FF94] text-black font-semibold text-sm shadow-lg shadow-[rgba(0,255,148,0.3)]"
            >
              <Check className="w-4 h-4" />
              Settings saved
            </motion.div>
          )}
        </AnimatePresence>

        {/* Profile Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-2xl border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.02)] p-6 mb-6"
        >
          <div className="flex items-center gap-3 mb-6">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: 'rgba(77, 159, 255, 0.1)', color: '#4D9FFF' }}
            >
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-white font-bold">Profile</h2>
              <p className="text-xs text-[#555]">Signed in with Google</p>
            </div>
          </div>

          <div className="flex items-center gap-4 p-4 rounded-xl bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.04)]">
            {profile.photoURL && (
              <img
                src={profile.photoURL}
                alt={profile.name}
                className="w-12 h-12 rounded-full ring-2 ring-[rgba(77,159,255,0.2)]"
                referrerPolicy="no-referrer"
              />
            )}
            <div>
              <p className="text-white font-semibold">{profile.name}</p>
              <p className="text-sm text-[#888]">{profile.email}</p>
            </div>
          </div>
        </motion.div>

        {/* Project Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-2xl border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.02)] p-6 mb-6"
        >
          <div className="flex items-center gap-3 mb-6">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: 'rgba(0, 255, 148, 0.1)', color: '#00FF94' }}
            >
              <Rocket className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-white font-bold">Project</h2>
              <p className="text-xs text-[#555]">Context for smarter standups</p>
            </div>
          </div>

          <textarea
            value={formData.project}
            onChange={(e) => setFormData({ ...formData, project: e.target.value })}
            className="drill-input min-h-[120px] resize-none"
            placeholder="Describe your project..."
            id="settings-project-input"
          />
        </motion.div>

        {/* Schedule Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="rounded-2xl border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.02)] p-6 mb-6"
        >
          <div className="flex items-center gap-3 mb-6">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: 'rgba(77, 159, 255, 0.1)', color: '#4D9FFF' }}
            >
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-white font-bold">Schedule</h2>
              <p className="text-xs text-[#555]">When Drill holds you accountable</p>
            </div>
          </div>

          <input
            type="time"
            value={formData.callTime}
            onChange={(e) => setFormData({ ...formData, callTime: e.target.value })}
            className="drill-input text-center text-xl font-mono"
            id="settings-time-input"
          />

          <div className="flex gap-2 mt-4 flex-wrap">
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

          <p className="text-xs text-[#555] mt-3">
            Timezone: {Intl.DateTimeFormat().resolvedOptions().timeZone}
          </p>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="rounded-2xl border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.02)] p-6 mb-6"
        >
          <h2 className="text-white font-bold mb-4 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#FFD700]" />
            Your Stats
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {[
              { value: stats.streak, label: 'Current Streak', color: '#00FF94' },
              { value: stats.longestStreak, label: 'Longest Streak', color: '#ffffff' },
              { value: `${stats.deliveryRate}%`, label: 'Delivery Rate', color: '#4D9FFF' },
              { value: stats.total, label: 'Total Standups', color: '#ffffff' },
            ].map((stat, i) => (
              <div
                key={stat.label}
                className="text-center p-4 rounded-xl bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.04)]"
              >
                <p className="text-3xl font-black" style={{ color: stat.color }}>
                  {stat.value}
                </p>
                <p className="text-[10px] text-[#555] mt-1 uppercase tracking-wider font-medium">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
          <p className="text-xs text-[#555] mt-3">
            Member since {new Date(profile.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </p>
        </motion.div>

        {/* Save Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mb-6"
        >
          <button
            onClick={handleSave}
            disabled={!hasChanges}
            className={`w-full flex items-center justify-center gap-2 px-5 py-4 rounded-xl font-bold text-sm transition-all ${
              hasChanges
                ? 'bg-gradient-to-r from-[#4D9FFF] to-[#0066FF] text-white shadow-lg shadow-[rgba(77,159,255,0.25)] hover:shadow-[rgba(77,159,255,0.4)]'
                : 'bg-[rgba(255,255,255,0.04)] text-[#555]'
            }`}
            id="settings-save-button"
          >
            <Save className="w-5 h-5" />
            {saved ? 'Saved!' : hasChanges ? 'Save Changes' : 'No Changes'}
          </button>
        </motion.div>

        {/* Sign Out */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55 }}
          className="mb-6"
        >
          <button
            onClick={async () => {
              await signOut();
              router.push('/');
            }}
            className="w-full flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl border border-[rgba(255,255,255,0.08)] text-[#888] hover:text-white hover:border-[rgba(255,255,255,0.15)] hover:bg-[rgba(255,255,255,0.02)] transition-all text-sm font-medium"
            id="sign-out-button"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </motion.div>

        {/* Danger Zone */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="rounded-2xl p-6 border border-[rgba(255,61,61,0.12)] bg-[rgba(255,61,61,0.02)]"
        >
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-4 h-4 text-[#FF3D3D]" />
            <h2 className="text-[#FF3D3D] font-bold text-sm">Danger Zone</h2>
          </div>
          <p className="text-xs text-[#888] mb-4">
            This will permanently delete your account, all standups, and sign you out. This action cannot be undone.
          </p>

          <AnimatePresence mode="wait">
            {!showDeleteConfirm ? (
              <motion.button
                key="delete-btn"
                onClick={() => setShowDeleteConfirm(true)}
                className="text-sm text-[#FF3D3D] hover:text-white border border-[rgba(255,61,61,0.2)] hover:bg-[rgba(255,61,61,0.1)] px-4 py-2.5 rounded-xl transition-all font-medium"
                id="delete-account-button"
              >
                Delete Account & Data
              </motion.button>
            ) : (
              <motion.div
                key="confirm"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-3"
              >
                <button
                  onClick={handleDelete}
                  className="flex items-center gap-2 text-sm font-semibold px-4 py-2.5 rounded-xl bg-[#FF3D3D] text-white shadow-lg shadow-[rgba(255,61,61,0.3)]"
                >
                  <Trash2 className="w-4 h-4" />
                  Yes, delete everything
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="text-sm text-[#888] hover:text-white transition-colors"
                >
                  Cancel
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}
