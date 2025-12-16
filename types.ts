

export type View = 'dashboard' | 'summarizer' | 'mindmap' | 'word' | 'mentor' | 'math' | 'todo' | 'profile' | 'quiz' | 'periodic' | 'news' | 'planner' | 'research';

export interface ActivityLog {
  id: string;
  date: string; // ISO Date String YYYY-MM-DD
  timestamp: number;
  type: 'Focus Session' | 'Quiz' | 'Math Workout' | 'Summary' | 'Study Group' | 'Research';
  durationMinutes: number;
  score?: number; // For quizzes/games
  subject?: string;
  notes?: string;
}

export interface Todo {
  id: string;
  text: string;
  completed: boolean;
  category: 'Study' | 'Homework' | 'Revision';
  dueDate?: string;
  reminderTime?: string; // ISO string for reminder
  reminded?: boolean; // Track if notification has been sent
}

export interface MathQuestion {
  id: number;
  question: string;
  answer: number;
  options: number[];
}

export interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface StudySession {
  date: string; // YYYY-MM-DD
  minutes: number;
  subject: string;
}

export interface MindMapNode {
  name: string;
  children?: MindMapNode[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}

// Gamification Types
export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string; // Lucide icon name
  condition: string;
}

export interface Rank {
  id: string;
  name: string;
  minLevel: number;
  color: string;
  image: string;
}

export interface UserProgress {
  xp: number;
  level: number;
  badges: string[]; // List of badge IDs
  streak: number;
}

// Chemistry Lab Types (Kept for compatibility if backend types rely on them, but could be removed)
export interface Chemical {
  id: string;
  symbol: string;
  name: string;
  formula: string;
  type: 'solid' | 'liquid' | 'gas' | 'acid' | 'base' | 'solution' | 'indicator';
  color: string;
  category: string;
  image: string;
  desc: string;
}

export interface LabTool {
  id: string;
  name: string;
  type: 'container' | 'heat';
}

export interface ExperimentStep {
  stepNo: number;
  text: string;
  mentorLine: string;
  criteria: {
    type: 'tool' | 'add' | 'wait' | 'heat';
    id?: string;
  };
  visualFx?: 'none' | 'bubbles' | 'smoke' | 'eruption' | 'crystals' | 'color_change';
  nextColor?: string;
}

export interface Experiment {
  id: string;
  title: string;
  category: string;
  objective: string;
  difficulty: string;
  requiredMaterials: string[];
  steps: ExperimentStep[];
  quiz: {
    question: string;
    options: string[];
    correctIndex: number;
    explanation: string;
  }[];
}

// Research Types
export interface ResearchSource {
  id: string;
  type: 'thinking' | 'web' | 'video' | 'file' | 'audio';
  title: string;
  content: string;
  summary?: string;
  url?: string;
  metadata?: any;
  timestamp: number;
}

// Notes App Types
export interface Note {
  id: string;
  title: string;
  content: string; // HTML content
  folderId: string;
  color: string;
  createdAt: number;
  updatedAt: number;
  tags: string[];
  drawingData?: string; // Base64 canvas image
}

export interface NoteFolder {
  id: string;
  name: string;
  icon: string; // Icon name
  type: 'system' | 'user';
  count: number;
}

// Study Group Types
export interface GroupMessage {
  id: string;
  userId: string;
  userName: string;
  text: string;
  timestamp: number;
  isMe?: boolean;
}

export interface GroupEvent {
  id: string;
  title: string;
  date: string;
  type: 'session' | 'deadline';
}

export interface GroupResource {
  id: string;
  name: string;
  type: 'pdf' | 'link' | 'image';
  url: string;
  uploadedBy: string;
}

export interface StudyGroup {
  id: string;
  name: string;
  subject: string;
  members: number;
  description: string;
  messages: GroupMessage[];
  events: GroupEvent[];
  resources: GroupResource[];
}

// BioDigital Types
export interface BioHotspot {
  id: string;
  x: number;
  y: number;
  label: string;
}

export interface BioModel {
  id: string;
  name: string;
  category: string;
  description: string;
  image: string;
  hotspots: BioHotspot[];
  video?: string;
}

// Sleep Tracker Types
export interface SleepData {
  date: string;
  score: number;
  durationHours: number;
  durationMinutes: number;
  bedTime: string;
  wakeTime: string;
  heartRate: number[];
  stats: {
    deep: string;
    light: string;
    rem: string;
    awake: string;
  };
  stages: {
    time: string;
    level: string; // 'Awake' | 'Light' | 'Deep' | 'REM'
    value: number;
  }[];
}

export interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  time: string;
  type: 'exam' | 'study' | 'assignment' | 'chill' | 'other';
  color: string;
}