export interface UserProfile {
  name: string;
  age: number;
  gender: 'male' | 'female' | 'other';
  heightCm: number;
  weightKg: number;
  goal: 'weight_loss' | 'muscle_building' | 'endurance';
  activityLevel: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
}

export interface FoodEntry {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  meal: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  quantity: number;
  unit: string;
  timestamp: string;
  imageUrl?: string;
  aiDetected?: boolean;
}

export interface ActivityEntry {
  id: string;
  type: string;
  duration: number; // minutes
  caloriesBurned: number;
  intensity: 'low' | 'moderate' | 'high';
  timestamp: string;
  source: 'manual' | 'healthkit';
}

export interface DailyLog {
  date: string;
  foods: FoodEntry[];
  activities: ActivityEntry[];
  weight?: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface NutritionTarget {
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
}
