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

// ---- AI Food Analysis ----
export interface AnalyzedFoodItem {
  name: string;
  quantity: number;
  unit: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
}

export async function analyzeFoodText(text: string): Promise<AnalyzedFoodItem[]> {
  if (!USE_API) {
    // Fallback to local parsing when no API
    const { parseNaturalLanguageFood, INDIAN_FOOD_DB } = await import('./nutrition');
    const parsed = parseNaturalLanguageFood(text);
    if (parsed.length > 0) {
      return parsed.map(p => {
        const db = INDIAN_FOOD_DB[p.name];
        return {
          name: p.name,
          quantity: p.quantity,
          unit: db?.unit || 'serving',
          calories: db ? db.calories * p.quantity : 150 * p.quantity,
          protein: db ? db.protein * p.quantity : 5 * p.quantity,
          carbs: db ? db.carbs * p.quantity : 20 * p.quantity,
          fats: db ? db.fats * p.quantity : 5 * p.quantity,
        };
      });
    }
    return [{ name: text, quantity: 1, unit: 'serving', calories: 150, protein: 5, carbs: 20, fats: 5 }];
  }

  const result = await apiFetch('/api/analyze-food', {
    method: 'POST',
    body: JSON.stringify({ text }),
  });
  return result.items || [];
}

export async function analyzeFoodImage(imageBase64: string, text?: string): Promise<AnalyzedFoodItem[]> {
  if (!USE_API) {
    // Fallback mock for local dev
    return [
      { name: 'Dal', quantity: 1, unit: 'bowl', calories: 150, protein: 9, carbs: 20, fats: 3 },
      { name: 'Roti', quantity: 2, unit: 'piece', calories: 140, protein: 5, carbs: 30, fats: 1 },
      { name: 'Sabzi', quantity: 1, unit: 'bowl', calories: 120, protein: 4, carbs: 15, fats: 5 },
    ];
  }

  const result = await apiFetch('/api/analyze-food', {
    method: 'POST',
    body: JSON.stringify({ imageBase64, text }),
  });
  return result.items || [];
}
