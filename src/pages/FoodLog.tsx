import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { FoodEntry } from '../types';
import { Camera, Send, Trash2, Plus, Minus, Sparkles, X, UtensilsCrossed, Brain } from 'lucide-react';
import DateNav from '../components/DateNav';

type Meal = 'breakfast' | 'lunch' | 'dinner' | 'snack';
const MEAL_ICONS: Record<Meal, string> = { breakfast: '🌅', lunch: '☀️', dinner: '🌙', snack: '🍿' };

const API_URL = import.meta.env.VITE_API_URL || '';

interface AnalyzedItem {
  name: string;
  quantity: number;
  unit: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
}

export default function FoodLog() {
  const { foods, addFood, removeFood, totalCaloriesIn, targets } = useApp();
  const [textInput, setTextInput] = useState('');
  const [selectedMeal, setSelectedMeal] = useState<Meal>('lunch');
  const [pendingItems, setPendingItems] = useState<AnalyzedItem[]>([]);
  const [showConfirm, setShowConfirm] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState('');

  const meals: Meal[] = ['breakfast', 'lunch', 'dinner', 'snack'];

  async function analyzeWithClaude(text: string, imageBase64?: string) {
    setAnalyzing(true);
    setError('');
    try {
      const body: any = {};
      if (text) body.text = text;
      if (imageBase64) body.imageBase64 = imageBase64;

      const res = await fetch(`${API_URL}/api/analyze-food`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-User-Id': localStorage.getItem('nutritrack_user_id') || 'anon' },
        body: JSON.stringify(body),
      });

      if (!res.ok) throw new Error(`Analysis failed (${res.status})`);
      const data = await res.json();

      if (data.items && data.items.length > 0) {
        setPendingItems(data.items);
        setShowConfirm(true);
      } else {
        setError('Could not identify any food items. Try being more specific.');
      }
    } catch (e: any) {
      console.error('Analysis error:', e);
      setError(e.message || 'Failed to analyze food. Please try again.');
    } finally {
      setAnalyzing(false);
    }
  }

  function handleTextSubmit() {
    if (!textInput.trim()) return;
    analyzeWithClaude(textInput.trim());
  }

  function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(',')[1];
      analyzeWithClaude('Identify all food items in this image', base64);
    };
    reader.readAsDataURL(file);
  }

  function confirmItems() {
    pendingItems.forEach(item => {
      const entry: FoodEntry = {
        id: crypto.randomUUID(),
        name: item.name,
        calories: item.calories,
        protein: item.protein,
        carbs: item.carbs,
        fats: item.fats,
        meal: selectedMeal,
        quantity: item.quantity,
        unit: item.unit,
        timestamp: new Date().toISOString(),
        aiDetected: true,
      };
      addFood(entry);
    });
    setPendingItems([]);
    setShowConfirm(false);
    setTextInput('');
  }

  function adjustPending(idx: number, delta: number) {
    setPendingItems(prev => prev.map((item, i) => {
      if (i !== idx) return item;
      const newQty = Math.max(1, item.quantity + delta);
      const ratio = newQty / item.quantity;
      return {
        ...item,
        quantity: newQty,
        calories: Math.round(item.calories * ratio),
        protein: Math.round(item.protein * ratio),
        carbs: Math.round(item.carbs * ratio),
        fats: Math.round(item.fats * ratio),
      };
    }));
  }

  function removePending(idx: number) {
    setPendingItems(prev => prev.filter((_, i) => i !== idx));
  }

  const totalPending = pendingItems.reduce((s, item) => s + item.calories, 0);

  const groupedFoods = meals.map(meal => ({
    meal,
    items: foods.filter(f => f.meal === meal),
    total: foods.filter(f => f.meal === meal).reduce((s, f) => s + f.calories, 0),
  }));

  return (
    <div className="p-4 lg:p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <UtensilsCrossed size={24} className="text-brand-600" /> Food Log
          </h1>
          <p className="text-sm text-gray-400 mt-1">{totalCaloriesIn} of {targets.calories} calories logged</p>
        </div>
        <DateNav />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Input panel */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm sticky top-4">
            <h2 className="text-sm font-semibold text-gray-700 mb-1">Add Food</h2>
            <p className="text-xs text-gray-400 mb-3 flex items-center gap-1">
              <Brain size={12} /> Powered by Claude AI — describe any food
            </p>

            {/* Meal selector */}
            <div className="flex gap-2 mb-4">
              {meals.map(m => (
                <button key={m} onClick={() => setSelectedMeal(m)}
                  className={`flex-1 py-2 rounded-xl text-xs font-medium transition-all ${
                    selectedMeal === m ? 'bg-brand-600 text-white shadow-md' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
                  }`}>
                  {MEAL_ICONS[m]} {m.charAt(0).toUpperCase() + m.slice(1)}
                </button>
              ))}
            </div>

            {/* Text input */}
            <div className="relative mb-3">
              <input type="text" value={textInput} onChange={e => setTextInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleTextSubmit()}
                placeholder='e.g. "2 aloo parathas with curd and chai"'
                disabled={analyzing}
                className="w-full pl-4 pr-10 py-3 bg-gray-50 rounded-xl text-sm border border-gray-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none transition-all disabled:opacity-50" />
              <button onClick={handleTextSubmit} disabled={analyzing || !textInput.trim()}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-600 hover:text-brand-700 p-1 disabled:opacity-30">
                <Send size={18} />
              </button>
            </div>

            {/* Photo upload */}
            <label className={`flex items-center justify-center gap-2 w-full py-3 bg-gray-50 rounded-xl border border-dashed border-gray-300 hover:border-brand-400 transition-all ${analyzing ? 'opacity-50 pointer-events-none' : 'cursor-pointer hover:bg-brand-50'}`}>
              <Camera size={18} className="text-gray-400" />
              <span className="text-sm text-gray-500">Upload food photo</span>
              <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handlePhotoUpload} disabled={analyzing} />
            </label>

            {analyzing && (
              <div className="mt-4 flex items-center gap-2 text-sm text-brand-600 bg-brand-50 rounded-xl p-3">
                <Sparkles size={16} className="animate-pulse" />
                <span>Claude is analyzing your food...</span>
              </div>
            )}

            {error && (
              <div className="mt-3 text-sm text-red-500 bg-red-50 rounded-xl p-3">
                {error}
              </div>
            )}
          </div>
        </div>

        {/* Right: Food list */}
        <div className="lg:col-span-2 space-y-4">
          {groupedFoods.map(group => (
            <div key={group.meal} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <span className="text-lg">{MEAL_ICONS[group.meal as Meal]}</span>
                  <span className="capitalize">{group.meal}</span>
                </h3>
                <span className="text-xs font-medium text-gray-400 bg-gray-50 px-2.5 py-1 rounded-full">{group.total} cal</span>
              </div>
              {group.items.length === 0 ? (
                <p className="text-xs text-gray-300 italic py-2">Nothing logged</p>
              ) : (
                <div className="space-y-2">
                  {group.items.map(food => (
                    <div key={food.id} className="flex items-center justify-between bg-gray-50 rounded-xl p-3 hover:bg-gray-100 transition-colors group">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-800">{food.name}</p>
                        <div className="flex gap-3 mt-0.5">
                          <span className="text-xs text-gray-400">{food.calories} cal</span>
                          <span className="text-xs text-indigo-400">{food.protein}g P</span>
                          <span className="text-xs text-amber-400">{food.carbs}g C</span>
                          <span className="text-xs text-red-400">{food.fats}g F</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-gray-400">{food.quantity} {food.unit}</span>
                        <button onClick={() => removeFood(food.id)}
                          className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all">
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Confirmation modal */}
      {showConfirm && pendingItems.length > 0 && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => { setShowConfirm(false); setPendingItems([]); }}>
          <div className="bg-white w-full max-w-md rounded-2xl p-6 shadow-2xl animate-slide-up" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <Brain size={20} className="text-brand-600" /> Claude's Analysis
              </h2>
              <button onClick={() => { setShowConfirm(false); setPendingItems([]); }}
                className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200">
                <X size={16} className="text-gray-500" />
              </button>
            </div>

            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {pendingItems.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between bg-gray-50 rounded-xl p-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{item.name}</p>
                    <div className="flex gap-2 mt-0.5">
                      <span className="text-xs text-gray-500">{item.calories} cal</span>
                      <span className="text-xs text-indigo-400">{item.protein}g P</span>
                      <span className="text-xs text-amber-400">{item.carbs}g C</span>
                      <span className="text-xs text-red-400">{item.fats}g F</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-2">
                    <button onClick={() => adjustPending(idx, -1)}
                      className="w-7 h-7 rounded-full bg-white border border-gray-200 flex items-center justify-center hover:bg-gray-100">
                      <Minus size={14} />
                    </button>
                    <span className="text-sm font-bold w-6 text-center">{item.quantity}</span>
                    <button onClick={() => adjustPending(idx, 1)}
                      className="w-7 h-7 rounded-full bg-white border border-gray-200 flex items-center justify-center hover:bg-gray-100">
                      <Plus size={14} />
                    </button>
                    <button onClick={() => removePending(idx)} className="ml-1 text-gray-300 hover:text-red-500">
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-5 flex justify-between items-center pt-4 border-t border-gray-100">
              <div>
                <p className="text-sm font-medium text-gray-700">Total: {totalPending} cal</p>
                <p className="text-xs text-gray-400">Adding to {selectedMeal}</p>
              </div>
              <button onClick={confirmItems}
                className="bg-brand-600 text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-brand-700 transition-colors shadow-md hover:shadow-lg">
                ✓ Confirm & Log
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
