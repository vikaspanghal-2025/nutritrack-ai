import { UserProfile, NutritionTarget } from '../types';

export function calculateBMR(profile: UserProfile): number {
  // Mifflin-St Jeor Equation
  const { weightKg, heightCm, age, gender } = profile;
  if (gender === 'male') {
    return 10 * weightKg + 6.25 * heightCm - 5 * age + 5;
  }
  return 10 * weightKg + 6.25 * heightCm - 5 * age - 161;
}

export function calculateTDEE(profile: UserProfile): number {
  const bmr = calculateBMR(profile);
  const multipliers = {
    sedentary: 1.2,
    light: 1.375,
    moderate: 1.55,
    active: 1.725,
    very_active: 1.9,
  };
  return Math.round(bmr * multipliers[profile.activityLevel]);
}

export function calculateTargets(profile: UserProfile): NutritionTarget {
  const tdee = calculateTDEE(profile);
  let calories: number;
  let proteinRatio: number;
  let carbRatio: number;
  let fatRatio: number;

  switch (profile.goal) {
    case 'weight_loss':
      calories = tdee - 500;
      proteinRatio = 0.35;
      carbRatio = 0.40;
      fatRatio = 0.25;
      break;
    case 'muscle_building':
      calories = tdee + 300;
      proteinRatio = 0.35;
      carbRatio = 0.45;
      fatRatio = 0.20;
      break;
    case 'endurance':
      calories = tdee + 200;
      proteinRatio = 0.25;
      carbRatio = 0.55;
      fatRatio = 0.20;
      break;
  }

  return {
    calories: Math.round(calories),
    protein: Math.round((calories * proteinRatio) / 4),
    carbs: Math.round((calories * carbRatio) / 4),
    fats: Math.round((calories * fatRatio) / 9),
  };
}

// Indian food database for AI recognition
export const INDIAN_FOOD_DB: Record<string, { calories: number; protein: number; carbs: number; fats: number; unit: string }> = {
  'Aloo Paratha': { calories: 210, protein: 5, carbs: 30, fats: 8, unit: 'piece' },
  'Roti / Chapati': { calories: 70, protein: 2.5, carbs: 15, fats: 0.4, unit: 'piece' },
  'Dal (Toor/Arhar)': { calories: 150, protein: 9, carbs: 20, fats: 3, unit: 'bowl' },
  'Dal Makhani': { calories: 230, protein: 10, carbs: 25, fats: 10, unit: 'bowl' },
  'Paneer Tikka': { calories: 260, protein: 18, carbs: 8, fats: 18, unit: 'serving' },
  'Paneer Butter Masala': { calories: 340, protein: 14, carbs: 12, fats: 26, unit: 'bowl' },
  'Curd / Yogurt': { calories: 60, protein: 3, carbs: 5, fats: 3, unit: 'bowl' },
  'Rice (Steamed)': { calories: 200, protein: 4, carbs: 45, fats: 0.5, unit: 'bowl' },
  'Dosa (Plain)': { calories: 120, protein: 3, carbs: 18, fats: 4, unit: 'piece' },
  'Masala Dosa': { calories: 250, protein: 6, carbs: 35, fats: 10, unit: 'piece' },
  'Idli': { calories: 40, protein: 2, carbs: 8, fats: 0.2, unit: 'piece' },
  'Sambar': { calories: 130, protein: 6, carbs: 18, fats: 3, unit: 'bowl' },
  'Rajma': { calories: 180, protein: 10, carbs: 28, fats: 3, unit: 'bowl' },
  'Chole': { calories: 200, protein: 10, carbs: 30, fats: 5, unit: 'bowl' },
  'Mixed Veg Sabzi': { calories: 120, protein: 4, carbs: 15, fats: 5, unit: 'bowl' },
  'Palak Paneer': { calories: 280, protein: 14, carbs: 10, fats: 20, unit: 'bowl' },
  'Raita': { calories: 70, protein: 3, carbs: 6, fats: 3, unit: 'bowl' },
  'Salad (Green)': { calories: 20, protein: 1, carbs: 4, fats: 0.2, unit: 'bowl' },
  'Poha': { calories: 180, protein: 4, carbs: 30, fats: 5, unit: 'bowl' },
  'Upma': { calories: 200, protein: 5, carbs: 32, fats: 6, unit: 'bowl' },
  'Khichdi': { calories: 220, protein: 8, carbs: 35, fats: 5, unit: 'bowl' },
  'Roasted Makhana': { calories: 90, protein: 3, carbs: 14, fats: 2, unit: 'cup' },
  'Lassi (Sweet)': { calories: 160, protein: 5, carbs: 25, fats: 4, unit: 'glass' },
  'Chai (with milk)': { calories: 80, protein: 2, carbs: 12, fats: 2, unit: 'cup' },
  'Puri': { calories: 100, protein: 2, carbs: 12, fats: 5, unit: 'piece' },
  'Naan': { calories: 260, protein: 8, carbs: 45, fats: 5, unit: 'piece' },
  'Biryani (Veg)': { calories: 350, protein: 8, carbs: 50, fats: 12, unit: 'plate' },
  'Tofu Stir Fry': { calories: 180, protein: 14, carbs: 8, fats: 10, unit: 'serving' },
  'Sprouts Salad': { calories: 100, protein: 8, carbs: 14, fats: 1, unit: 'bowl' },
  'Banana': { calories: 105, protein: 1.3, carbs: 27, fats: 0.4, unit: 'piece' },
  'Apple': { calories: 95, protein: 0.5, carbs: 25, fats: 0.3, unit: 'piece' },
};

export function parseNaturalLanguageFood(text: string): { name: string; quantity: number }[] {
  const results: { name: string; quantity: number }[] = [];
  const lower = text.toLowerCase();

  for (const food of Object.keys(INDIAN_FOOD_DB)) {
    const foodLower = food.toLowerCase();
    const aliases = [foodLower, ...foodLower.split(' / ').map(s => s.trim())];
    
    for (const alias of aliases) {
      if (lower.includes(alias)) {
        // Try to find quantity
        const regex = new RegExp(`(\\d+)\\s*(?:medium\\s*(?:sized?)?\\s*)?${alias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'i');
        const match = lower.match(regex);
        const qty = match ? parseInt(match[1]) : 1;
        results.push({ name: food, quantity: qty });
        break;
      }
    }
  }

  return results;
}
