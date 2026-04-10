import { UserProfile, DailyLog, ChatMessage } from '../types';

const KEYS = {
  profile: 'nutritrack_profile',
  logs: 'nutritrack_logs',
  chat: 'nutritrack_chat',
  onboarded: 'nutritrack_onboarded',
};

export function getProfile(): UserProfile | null {
  const data = localStorage.getItem(KEYS.profile);
  return data ? JSON.parse(data) : null;
}

export function saveProfile(profile: UserProfile) {
  localStorage.setItem(KEYS.profile, JSON.stringify(profile));
}

export function getTodayKey(): string {
  return new Date().toISOString().split('T')[0];
}

export function getAllLogs(): Record<string, DailyLog> {
  const data = localStorage.getItem(KEYS.logs);
  return data ? JSON.parse(data) : {};
}

export function getDailyLog(date?: string): DailyLog {
  const key = date || getTodayKey();
  const logs = getAllLogs();
  return logs[key] || { date: key, foods: [], activities: [] };
}

export function saveDailyLog(log: DailyLog) {
  const logs = getAllLogs();
  logs[log.date] = log;
  localStorage.setItem(KEYS.logs, JSON.stringify(logs));
}

export function getChatHistory(): ChatMessage[] {
  const data = localStorage.getItem(KEYS.chat);
  return data ? JSON.parse(data) : [];
}

export function saveChatHistory(messages: ChatMessage[]) {
  localStorage.setItem(KEYS.chat, JSON.stringify(messages));
}

export function isOnboarded(): boolean {
  return localStorage.getItem(KEYS.onboarded) === 'true';
}

export function setOnboarded() {
  localStorage.setItem(KEYS.onboarded, 'true');
}
