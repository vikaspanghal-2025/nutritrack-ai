import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { UserProfile, FoodEntry, ActivityEntry, NutritionTarget } from '../types';
import { calculateTargets } from '../utils/nutrition';
import * as api from '../utils/api';

interface AppState {
  profile: UserProfile | null;
  foods: FoodEntry[];
  activities: ActivityEntry[];
  targets: NutritionTarget;
  loading: boolean;
  setProfile: (p: UserProfile) => void;
  addFood: (food: FoodEntry) => void;
  removeFood: (id: string) => void;
  addActivity: (activity: ActivityEntry) => void;
  removeActivity: (id: string) => void;
  refresh: () => void;
  totalCaloriesIn: number;
  totalCaloriesOut: number;
  totalProtein: number;
  totalCarbs: number;
  totalFats: number;
}

const defaultTargets: NutritionTarget = { calories: 2000, protein: 100, carbs: 250, fats: 65 };

const AppContext = createContext<AppState>({} as AppState);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfileState] = useState<UserProfile | null>(null);
  const [foods, setFoods] = useState<FoodEntry[]>([]);
  const [activities, setActivities] = useState<ActivityEntry[]>([]);
  const [targets, setTargets] = useState<NutritionTarget>(defaultTargets);
  const [loading, setLoading] = useState(true);

  // Load initial data
  useEffect(() => {
    (async () => {
      try {
        const p = await api.fetchProfile();
        setProfileState(p);
        if (p) setTargets(calculateTargets(p));
        const f = await api.fetchFoods();
        setFoods(f);
        const a = await api.fetchActivities();
        setActivities(a);
      } catch (e) {
        console.error('Failed to load data:', e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (profile) setTargets(calculateTargets(profile));
  }, [profile]);

  const setProfile = useCallback(async (p: UserProfile) => {
    setProfileState(p);
    await api.saveProfile(p);
  }, []);

  const refresh = useCallback(async () => {
    const [f, a] = await Promise.all([api.fetchFoods(), api.fetchActivities()]);
    setFoods(f);
    setActivities(a);
  }, []);

  const addFood = useCallback(async (food: FoodEntry) => {
    setFoods(prev => [...prev, food]);
    await api.addFoodApi(food);
  }, []);

  const removeFood = useCallback(async (id: string) => {
    setFoods(prev => prev.filter(f => f.id !== id));
    await api.removeFoodApi(id);
  }, []);

  const addActivity = useCallback(async (activity: ActivityEntry) => {
    setActivities(prev => [...prev, activity]);
    await api.addActivityApi(activity);
  }, []);

  const removeActivity = useCallback(async (id: string) => {
    setActivities(prev => prev.filter(a => a.id !== id));
    await api.removeActivityApi(id);
  }, []);

  const totalCaloriesIn = foods.reduce((s, f) => s + f.calories, 0);
  const totalCaloriesOut = activities.reduce((s, a) => s + a.caloriesBurned, 0);
  const totalProtein = foods.reduce((s, f) => s + f.protein, 0);
  const totalCarbs = foods.reduce((s, f) => s + f.carbs, 0);
  const totalFats = foods.reduce((s, f) => s + f.fats, 0);

  return (
    <AppContext.Provider value={{
      profile, foods, activities, targets, loading,
      setProfile, addFood, removeFood,
      addActivity, removeActivity, refresh,
      totalCaloriesIn, totalCaloriesOut,
      totalProtein, totalCarbs, totalFats,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => useContext(AppContext);
