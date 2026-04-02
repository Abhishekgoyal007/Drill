'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import {
  User,
  GoogleAuthProvider,
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from './firebase';

interface UserProfile {
  uid: string;
  name: string;
  email: string;
  photoURL: string;
  project: string;
  callTime: string;
  timezone: string;
  createdAt: string;
  onboarded: boolean;
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (data: Partial<UserProfile>) => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  signInWithGoogle: async () => {},
  signOut: async () => {},
  updateProfile: async () => {},
  refreshProfile: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch user profile from Firestore
  const fetchProfile = async (uid: string): Promise<UserProfile | null> => {
    try {
      const docRef = doc(db, 'users', uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return docSnap.data() as UserProfile;
      }
      return null;
    } catch (error) {
      console.error('Error fetching profile:', error);
      return null;
    }
  };

  // Listen to auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        const p = await fetchProfile(firebaseUser.uid);
        setProfile(p);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const firebaseUser = result.user;

      // Check if profile already exists
      const existing = await fetchProfile(firebaseUser.uid);
      if (!existing) {
        // Create initial profile (not yet onboarded)
        const newProfile: UserProfile = {
          uid: firebaseUser.uid,
          name: firebaseUser.displayName || '',
          email: firebaseUser.email || '',
          photoURL: firebaseUser.photoURL || '',
          project: '',
          callTime: '09:00',
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          createdAt: new Date().toISOString(),
          onboarded: false,
        };
        await setDoc(doc(db, 'users', firebaseUser.uid), newProfile);
        setProfile(newProfile);
      } else {
        setProfile(existing);
      }
    } catch (error) {
      console.error('Google sign-in error:', error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
      setUser(null);
      setProfile(null);
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const updateProfile = async (data: Partial<UserProfile>) => {
    if (!user) return;
    try {
      const docRef = doc(db, 'users', user.uid);
      await setDoc(docRef, data, { merge: true });
      setProfile((prev) => (prev ? { ...prev, ...data } : null));
    } catch (error) {
      console.error('Error updating profile:', error);
    }
  };

  const refreshProfile = async () => {
    if (!user) return;
    const p = await fetchProfile(user.uid);
    setProfile(p);
  };

  return (
    <AuthContext.Provider
      value={{ user, profile, loading, signInWithGoogle, signOut, updateProfile, refreshProfile }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
