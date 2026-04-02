export interface User {
  id: string;
  name: string;
  email: string;
  project: string;
  callTime: string; // HH:MM format
  timezone: string;
  createdAt: string;
}

export interface Standup {
  id: string;
  date: string; // YYYY-MM-DD
  transcript: string;
  summary: string;
  commitments: string[];
  blockers: string[];
  delivered: boolean | null; // null = not yet checked
  deliveryChecked: boolean;
  duration: number; // seconds
}

export interface PatternDetection {
  type: 'blocker' | 'commitment' | 'avoidance';
  description: string;
  frequency: number; // days appeared
  firstSeen: string;
  severity: 'low' | 'medium' | 'high';
}

export interface UserSession {
  user: User;
  standups: Standup[];
  streak: number;
  longestStreak: number;
  patterns: PatternDetection[];
  deliveryRate: number; // percentage
}

export interface CallState {
  status: 'idle' | 'connecting' | 'active' | 'ended';
  startTime: number | null;
  duration: number;
  currentTopic: 'yesterday' | 'today' | 'blockers' | 'summary';
  isSpeaking: 'user' | 'ai' | 'none';
}
