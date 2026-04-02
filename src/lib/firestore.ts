import {
  collection,
  doc,
  addDoc,
  getDocs,
  getDoc,
  updateDoc,
  query,
  orderBy,
  limit,
  where,
  Timestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import { Standup, PatternDetection } from './types';

// ─── Standups ───────────────────────────────────────────────

/**
 * Add a standup to the user's subcollection
 */
export async function addStandupToFirestore(
  uid: string,
  data: {
    transcript: string;
    summary: string;
    commitments: string[];
    blockers: string[];
    duration: number;
  }
): Promise<string> {
  const today = new Date().toISOString().split('T')[0];
  const standupData = {
    ...data,
    date: today,
    delivered: null,
    deliveryChecked: false,
    createdAt: Timestamp.now(),
  };

  const docRef = await addDoc(
    collection(db, 'users', uid, 'standups'),
    standupData
  );
  return docRef.id;
}

/**
 * Get recent standups (ordered by date desc)
 */
export async function getRecentStandups(
  uid: string,
  count: number = 7
): Promise<Standup[]> {
  const q = query(
    collection(db, 'users', uid, 'standups'),
    orderBy('date', 'desc'),
    limit(count)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Standup[];
}

/**
 * Get all standups for heatmap (last 84 days)
 */
export async function getHeatmapData(
  uid: string
): Promise<Record<string, boolean>> {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 84);
  const cutoffStr = cutoff.toISOString().split('T')[0];

  const q = query(
    collection(db, 'users', uid, 'standups'),
    where('date', '>=', cutoffStr),
    orderBy('date', 'desc')
  );
  const snapshot = await getDocs(q);

  const map: Record<string, boolean> = {};
  const today = new Date();

  // Initialize all 84 days as false
  for (let i = 0; i < 84; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    map[dateStr] = false;
  }

  // Mark completed days
  snapshot.docs.forEach((doc) => {
    const data = doc.data();
    if (data.date) {
      map[data.date] = true;
    }
  });

  return map;
}

/**
 * Get yesterday's unchecked standup for accountability
 */
export async function getYesterdayStandup(
  uid: string
): Promise<(Standup & { id: string }) | null> {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  const q = query(
    collection(db, 'users', uid, 'standups'),
    where('date', '==', yesterdayStr),
    where('deliveryChecked', '==', false),
    limit(1)
  );
  const snapshot = await getDocs(q);

  if (snapshot.empty) return null;
  const doc_data = snapshot.docs[0];
  return { id: doc_data.id, ...doc_data.data() } as Standup & { id: string };
}

/**
 * Mark a standup's delivery status
 */
export async function markDelivery(
  uid: string,
  standupId: string,
  delivered: boolean
): Promise<void> {
  const docRef = doc(db, 'users', uid, 'standups', standupId);
  await updateDoc(docRef, {
    delivered,
    deliveryChecked: true,
  });
}

// ─── Stats Calculation ──────────────────────────────────────

/**
 * Calculate current streak from standups
 */
export async function calculateStreak(uid: string): Promise<{
  streak: number;
  longestStreak: number;
  total: number;
  deliveryRate: number;
}> {
  const q = query(
    collection(db, 'users', uid, 'standups'),
    orderBy('date', 'desc')
  );
  const snapshot = await getDocs(q);

  if (snapshot.empty) {
    return { streak: 0, longestStreak: 0, total: 0, deliveryRate: 100 };
  }

  const dates = [...new Set(snapshot.docs.map((d) => d.data().date as string))].sort().reverse();
  const total = snapshot.size;

  // Calculate current streak
  let streak = 0;
  const today = new Date();
  for (let i = 0; i < dates.length; i++) {
    const expected = new Date(today);
    expected.setDate(expected.getDate() - i);
    const expectedStr = expected.toISOString().split('T')[0];
    if (dates[i] === expectedStr) {
      streak++;
    } else {
      break;
    }
  }

  // Calculate longest streak
  let longestStreak = 0;
  let currentRun = 1;
  const sortedDates = [...dates].sort();
  for (let i = 1; i < sortedDates.length; i++) {
    const prev = new Date(sortedDates[i - 1]);
    const curr = new Date(sortedDates[i]);
    const diffDays = (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24);
    if (diffDays === 1) {
      currentRun++;
    } else {
      longestStreak = Math.max(longestStreak, currentRun);
      currentRun = 1;
    }
  }
  longestStreak = Math.max(longestStreak, currentRun, streak);

  // Calculate delivery rate
  const checked = snapshot.docs.filter((d) => d.data().deliveryChecked === true);
  const delivered = checked.filter((d) => d.data().delivered === true);
  const deliveryRate =
    checked.length === 0 ? 100 : Math.round((delivered.length / checked.length) * 100);

  return { streak, longestStreak, total, deliveryRate };
}

// ─── Pattern Detection ──────────────────────────────────────

/**
 * Detect patterns from recent standups
 */
export async function detectPatterns(uid: string): Promise<PatternDetection[]> {
  const q = query(
    collection(db, 'users', uid, 'standups'),
    orderBy('date', 'desc'),
    limit(7)
  );
  const snapshot = await getDocs(q);
  const patterns: PatternDetection[] = [];

  if (snapshot.size < 2) return patterns;

  const standups = snapshot.docs.map((d) => d.data());

  // Check for repeated blockers
  const blockerFrequency: Record<string, { count: number; firstSeen: string }> = {};
  for (const standup of standups) {
    const blockers = (standup.blockers || []) as string[];
    for (const blocker of blockers) {
      const normalized = blocker.toLowerCase().trim();
      let matched = false;
      for (const key of Object.keys(blockerFrequency)) {
        if (similarStrings(key, normalized)) {
          blockerFrequency[key].count++;
          matched = true;
          break;
        }
      }
      if (!matched) {
        blockerFrequency[normalized] = { count: 1, firstSeen: standup.date as string };
      }
    }
  }

  for (const [blocker, data] of Object.entries(blockerFrequency)) {
    if (data.count >= 2) {
      patterns.push({
        type: 'blocker',
        description: blocker,
        frequency: data.count,
        firstSeen: data.firstSeen,
        severity: data.count >= 4 ? 'high' : data.count >= 3 ? 'medium' : 'low',
      });
    }
  }

  // Check for undelivered commitments
  const undelivered = standups.filter(
    (s) => s.deliveryChecked === true && s.delivered === false
  );
  if (undelivered.length >= 3) {
    patterns.push({
      type: 'avoidance',
      description: `Missed commitments ${undelivered.length} out of last ${standups.length} days`,
      frequency: undelivered.length,
      firstSeen: undelivered[undelivered.length - 1].date as string,
      severity: undelivered.length >= 5 ? 'high' : 'medium',
    });
  }

  return patterns;
}

function similarStrings(a: string, b: string): boolean {
  const wordsA = a.split(/\s+/).filter((w) => w.length > 3);
  const wordsB = b.split(/\s+/).filter((w) => w.length > 3);
  let matchCount = 0;
  for (const word of wordsA) {
    if (wordsB.some((w) => w.includes(word) || word.includes(w))) {
      matchCount++;
    }
  }
  return matchCount >= Math.min(wordsA.length, wordsB.length) * 0.5 && matchCount > 0;
}

// ─── Demo Data ──────────────────────────────────────────────

/**
 * Seed demo standups for a user
 */
export async function seedDemoData(uid: string): Promise<void> {
  const demoStandups = [
    {
      date: getDateNDaysAgo(6),
      summary: 'Set up Next.js project, configured Tailwind, built landing page',
      commitments: ['Finish onboarding flow', 'Set up ElevenLabs agent'],
      blockers: [],
      delivered: true,
      deliveryChecked: true,
      duration: 95,
    },
    {
      date: getDateNDaysAgo(5),
      summary: 'Built onboarding flow, started ElevenLabs integration',
      commitments: ['Complete voice call interface', 'Test ElevenLabs connection'],
      blockers: ['ElevenLabs API key setup taking time'],
      delivered: true,
      deliveryChecked: true,
      duration: 82,
    },
    {
      date: getDateNDaysAgo(4),
      summary: 'Voice call interface working, basic conversation flow done',
      commitments: ['Build dashboard', 'Add pattern detection'],
      blockers: ['Auth flow complexity'],
      delivered: true,
      deliveryChecked: true,
      duration: 110,
    },
    {
      date: getDateNDaysAgo(3),
      summary: 'Dashboard layout done, heatmap component built',
      commitments: ['Finish pattern detection', 'Build post-call screen'],
      blockers: ['Auth flow complexity'],
      delivered: false,
      deliveryChecked: true,
      duration: 75,
    },
    {
      date: getDateNDaysAgo(2),
      summary: 'Pattern detection logic working, post-call screen started',
      commitments: ['Complete post-call screen', 'Deploy to Cloudflare'],
      blockers: ['Auth flow complexity'],
      delivered: true,
      deliveryChecked: true,
      duration: 90,
    },
    {
      date: getDateNDaysAgo(1),
      summary: 'Post-call screen done, started Firebase integration',
      commitments: ['Finish Firebase integration', 'Test full flow end-to-end'],
      blockers: ['Firestore schema design'],
      delivered: null,
      deliveryChecked: false,
      duration: 120,
    },
  ];

  for (const standup of demoStandups) {
    await addDoc(collection(db, 'users', uid, 'standups'), {
      ...standup,
      transcript: `Standup for ${standup.date}: ${standup.summary}`,
      createdAt: Timestamp.now(),
    });
  }
}

function getDateNDaysAgo(n: number): string {
  const date = new Date();
  date.setDate(date.getDate() - n);
  return date.toISOString().split('T')[0];
}
