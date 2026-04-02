import { User, Standup, PatternDetection, UserSession } from './types';

const STORAGE_KEY = 'drill_session';

// Generate a simple ID
function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// Get session from localStorage
export function getSession(): UserSession | null {
  if (typeof window === 'undefined') return null;
  const data = localStorage.getItem(STORAGE_KEY);
  if (!data) return null;
  try {
    return JSON.parse(data) as UserSession;
  } catch {
    return null;
  }
}

// Save session to localStorage
export function saveSession(session: UserSession): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
}

// Create a new user session
export function createUser(name: string, email: string, project: string, callTime: string): UserSession {
  const session: UserSession = {
    user: {
      id: generateId(),
      name,
      email,
      project,
      callTime,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      createdAt: new Date().toISOString(),
    },
    standups: [],
    streak: 0,
    longestStreak: 0,
    patterns: [],
    deliveryRate: 0,
  };
  saveSession(session);
  return session;
}

// Add a standup
export function addStandup(
  transcript: string,
  summary: string,
  commitments: string[],
  blockers: string[],
  duration: number = 0
): Standup {
  const session = getSession();
  if (!session) throw new Error('No session found');

  const today = new Date().toISOString().split('T')[0];
  
  const standup: Standup = {
    id: generateId(),
    date: today,
    transcript,
    summary,
    commitments,
    blockers,
    delivered: null,
    deliveryChecked: false,
    duration,
  };

  session.standups.push(standup);
  
  // Update streak
  session.streak = calculateStreak(session.standups);
  if (session.streak > session.longestStreak) {
    session.longestStreak = session.streak;
  }
  
  // Detect patterns
  session.patterns = detectPatterns(session.standups);
  
  // Update delivery rate
  session.deliveryRate = calculateDeliveryRate(session.standups);

  saveSession(session);
  return standup;
}

// Calculate current streak
function calculateStreak(standups: Standup[]): number {
  if (standups.length === 0) return 0;
  
  const sortedDates = [...new Set(standups.map(s => s.date))].sort().reverse();
  let streak = 0;
  const today = new Date();
  
  for (let i = 0; i < sortedDates.length; i++) {
    const expectedDate = new Date(today);
    expectedDate.setDate(expectedDate.getDate() - i);
    const expectedStr = expectedDate.toISOString().split('T')[0];
    
    if (sortedDates[i] === expectedStr) {
      streak++;
    } else {
      break;
    }
  }
  
  return streak;
}

// Detect patterns in recent standups
function detectPatterns(standups: Standup[]): PatternDetection[] {
  const patterns: PatternDetection[] = [];
  const recentStandups = standups.slice(-7);
  
  if (recentStandups.length < 2) return patterns;
  
  // Check for repeated blockers
  const blockerFrequency: Record<string, { count: number; firstSeen: string }> = {};
  
  for (const standup of recentStandups) {
    for (const blocker of standup.blockers) {
      const normalized = blocker.toLowerCase().trim();
      // Simple word matching - check if any existing blocker is similar
      let matched = false;
      for (const key of Object.keys(blockerFrequency)) {
        if (similarStrings(key, normalized)) {
          blockerFrequency[key].count++;
          matched = true;
          break;
        }
      }
      if (!matched) {
        blockerFrequency[normalized] = { count: 1, firstSeen: standup.date };
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
  const undelivered = recentStandups.filter(
    s => s.deliveryChecked && s.delivered === false
  );
  
  if (undelivered.length >= 3) {
    patterns.push({
      type: 'avoidance',
      description: `Missed commitments ${undelivered.length} out of last ${recentStandups.length} days`,
      frequency: undelivered.length,
      firstSeen: undelivered[0].date,
      severity: undelivered.length >= 5 ? 'high' : 'medium',
    });
  }
  
  return patterns;
}

// Simple string similarity check
function similarStrings(a: string, b: string): boolean {
  const wordsA = a.split(/\s+/).filter(w => w.length > 3);
  const wordsB = b.split(/\s+/).filter(w => w.length > 3);
  
  let matchCount = 0;
  for (const word of wordsA) {
    if (wordsB.some(w => w.includes(word) || word.includes(w))) {
      matchCount++;
    }
  }
  
  return matchCount >= Math.min(wordsA.length, wordsB.length) * 0.5 && matchCount > 0;
}

// Calculate delivery rate
function calculateDeliveryRate(standups: Standup[]): number {
  const checked = standups.filter(s => s.deliveryChecked);
  if (checked.length === 0) return 100;
  
  const delivered = checked.filter(s => s.delivered === true);
  return Math.round((delivered.length / checked.length) * 100);
}

// Get last N standups
export function getRecentStandups(n: number = 7): Standup[] {
  const session = getSession();
  if (!session) return [];
  return session.standups.slice(-n).reverse();
}

// Get standups for heatmap (last 12 weeks)
export function getHeatmapData(): Record<string, boolean> {
  const session = getSession();
  if (!session) return {};
  
  const map: Record<string, boolean> = {};
  const today = new Date();
  
  for (let i = 0; i < 84; i++) { // 12 weeks
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    map[dateStr] = session.standups.some(s => s.date === dateStr);
  }
  
  return map;
}

// Mark yesterday's commitments as delivered or not
export function markDelivery(standupId: string, delivered: boolean): void {
  const session = getSession();
  if (!session) return;
  
  const standup = session.standups.find(s => s.id === standupId);
  if (standup) {
    standup.delivered = delivered;
    standup.deliveryChecked = true;
    session.deliveryRate = calculateDeliveryRate(session.standups);
    saveSession(session);
  }
}

// Get yesterday's uncommitted standup (for accountability check)
export function getYesterdayStandup(): Standup | null {
  const session = getSession();
  if (!session) return null;
  
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];
  
  return session.standups.find(s => s.date === yesterdayStr && !s.deliveryChecked) || null;
}

// Clear session (for testing)
export function clearSession(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEY);
}

// Seed demo data
export function seedDemoData(): UserSession {
  const session = createUser('Abhishek', 'abhishek@drill.dev', 'Building Drill — an AI scrum master app', '09:00');
  
  const demoStandups: Partial<Standup>[] = [
    {
      date: getDateNDaysAgo(6),
      summary: 'Set up Next.js project, configured Tailwind, built landing page',
      commitments: ['Finish onboarding flow', 'Set up ElevenLabs agent'],
      blockers: [],
      delivered: true,
      deliveryChecked: true,
    },
    {
      date: getDateNDaysAgo(5),
      summary: 'Built onboarding flow, started ElevenLabs integration',
      commitments: ['Complete voice call interface', 'Test ElevenLabs connection'],
      blockers: ['ElevenLabs API key setup taking time'],
      delivered: true,
      deliveryChecked: true,
    },
    {
      date: getDateNDaysAgo(4),
      summary: 'Voice call interface working, basic conversation flow done',
      commitments: ['Build dashboard', 'Add pattern detection'],
      blockers: ['Auth flow complexity'],
      delivered: true,
      deliveryChecked: true,
    },
    {
      date: getDateNDaysAgo(3),
      summary: 'Dashboard layout done, heatmap component built',
      commitments: ['Finish pattern detection', 'Build post-call screen'],
      blockers: ['Auth flow complexity'],
      delivered: false,
      deliveryChecked: true,
    },
    {
      date: getDateNDaysAgo(2),
      summary: 'Pattern detection logic working, post-call screen started',
      commitments: ['Complete post-call screen', 'Deploy to Cloudflare'],
      blockers: ['Auth flow complexity'],
      delivered: true,
      deliveryChecked: true,
    },
    {
      date: getDateNDaysAgo(1),
      summary: 'Post-call screen done, started Cloudflare Workers setup',
      commitments: ['Finish Cloudflare deployment', 'Test full flow end-to-end'],
      blockers: ['Cloudflare D1 schema migrations'],
      delivered: null,
      deliveryChecked: false,
    },
  ];
  
  for (const demo of demoStandups) {
    const standup: Standup = {
      id: generateId(),
      date: demo.date!,
      transcript: `Standup for ${demo.date}: ${demo.summary}`,
      summary: demo.summary!,
      commitments: demo.commitments!,
      blockers: demo.blockers!,
      delivered: demo.delivered ?? null,
      deliveryChecked: demo.deliveryChecked ?? false,
      duration: Math.floor(Math.random() * 60) + 60,
    };
    session.standups.push(standup);
  }
  
  session.streak = 6;
  session.longestStreak = 6;
  session.deliveryRate = 80;
  session.patterns = [
    {
      type: 'blocker',
      description: 'Auth flow complexity',
      frequency: 3,
      firstSeen: getDateNDaysAgo(4),
      severity: 'high',
    },
  ];
  
  saveSession(session);
  return session;
}

function getDateNDaysAgo(n: number): string {
  const date = new Date();
  date.setDate(date.getDate() - n);
  return date.toISOString().split('T')[0];
}
