import { UserProfile, FoodEntry, ActivityEntry, DailyLog } from '../types';

const BASE_URL = import.meta.env.VITE_API_URL || '';
const USE_API = !!BASE_URL;

function getUserId(): string {
  let id = localStorage.getItem('nutritrack_user_id');
  if (!id) { id = crypto.randomUUID(); localStorage.setItem('nutritrack_user_id', id); }
  return id;
}

async function apiFetch(path: string, options: RequestInit = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', 'X-User-Id': getUserId(), ...options.headers },
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

function todayKey(): string { return new Date().toISOString().split('T')[0]; }

function getLocalLogs(): Record<string, { foods: FoodEntry[]; activities: ActivityEntry[] }> {
  return JSON.parse(localStorage.getItem('nutritrack_logs') || '{}');
}
function saveLocalLogs(logs: Record<string, any>) {
  localStorage.setItem('nutritrack_logs', JSON.stringify(logs));
}

// ---- Profile ----
export async function fetchProfile(): Promise<UserProfile | null> {
  if (!USE_API) { const d = localStorage.getItem('nutritrack_profile'); return d ? JSON.parse(d) : null; }
  return apiFetch('/api/profile');
}
export async function saveProfile(profile: UserProfile): Promise<void> {
  localStorage.setItem('nutritrack_profile', JSON.stringify(profile));
  localStorage.setItem('nutritrack_onboarded', 'true');
  if (USE_API) await apiFetch('/api/profile', { method: 'PUT', body: JSON.stringify(profile) });
}

// ---- Food ----
export async function fetchFoods(date?: string): Promise<FoodEntry[]> {
  const d = date || todayKey();
  if (!USE_API) { return getLocalLogs()[d]?.foods || []; }
  return apiFetch(`/api/food?date=${d}`);
}
export async function addFoodApi(food: FoodEntry, date?: string): Promise<void> {
  const d = date || todayKey();
  if (!USE_API) {
    const logs = getLocalLogs();
    if (!logs[d]) logs[d] = { foods: [], activities: [] };
    logs[d].foods.push(food);
    saveLocalLogs(logs);
    return;
  }
  await apiFetch('/api/food', { method: 'POST', body: JSON.stringify({ ...food, date: d }) });
}
export async function removeFoodApi(id: string, date?: string): Promise<void> {
  const d = date || todayKey();
  if (!USE_API) {
    const logs = getLocalLogs();
    if (logs[d]) { logs[d].foods = logs[d].foods.filter((f: FoodEntry) => f.id !== id); saveLocalLogs(logs); }
    return;
  }
  await apiFetch(`/api/food/${id}?date=${d}`, { method: 'DELETE' });
}

// ---- Activity ----
export async function fetchActivities(date?: string): Promise<ActivityEntry[]> {
  const d = date || todayKey();
  if (!USE_API) { return getLocalLogs()[d]?.activities || []; }
  return apiFetch(`/api/activity?date=${d}`);
}
export async function addActivityApi(activity: ActivityEntry, date?: string): Promise<void> {
  const d = date || todayKey();
  if (!USE_API) {
    const logs = getLocalLogs();
    if (!logs[d]) logs[d] = { foods: [], activities: [] };
    logs[d].activities.push(activity);
    saveLocalLogs(logs);
    return;
  }
  await apiFetch('/api/activity', { method: 'POST', body: JSON.stringify({ ...activity, date: d }) });
}
export async function removeActivityApi(id: string, date?: string): Promise<void> {
  const d = date || todayKey();
  if (!USE_API) {
    const logs = getLocalLogs();
    if (logs[d]) { logs[d].activities = logs[d].activities.filter((a: ActivityEntry) => a.id !== id); saveLocalLogs(logs); }
    return;
  }
  await apiFetch(`/api/activity/${id}?date=${d}`, { method: 'DELETE' });
}

// ---- Weekly logs ----
export async function fetchWeeklyLogs(): Promise<DailyLog[]> {
  if (!USE_API) {
    const logs = getLocalLogs();
    const result: DailyLog[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      const key = d.toISOString().split('T')[0];
      result.push({ date: key, foods: logs[key]?.foods || [], activities: logs[key]?.activities || [] });
    }
    return result;
  }
  return apiFetch('/api/logs?days=7');
}
