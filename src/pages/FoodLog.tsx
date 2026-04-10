import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { FoodEntry } from '../types';
import { parseNaturalLanguageFood, INDIAN_FOOD_DB } from '../utils/nutrition';
import { Camera, Send, Trash2, Plus, Minus, Sparkles, X } from 'lucide-react';

type Meal = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export default function FoodLog() {
  const { foods, addFood, removeFood } = useApp();
  const [textInput, setTextInput] = useState('');
  const [selectedMeal, setSelectedMeal] = useState<Meal>('lunch');
  const [pendingItems, setPendingItems] = useState<{ name: string; quantity: number }[]>([]);
  const [showConfirm, setShowConfirm] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);

  const meals: Meal[] = ['breakfast', 'lunch', 'dinner', 'snack'];

  function handleTextSubmit() {
    if (!textInput.trim()) return;
    const parsed = parseNaturalLanguageFood(textInput);
    if (parsed.length > 0) {
      setPendingItems(parsed);
      setShowConfirm(true);
    } else {
      // Fallback: treat as single custom item
      setPendingItems([{ name: textInput.trim(), quantity: 1 }]);
      setShowConfirm(true);
    }
  }

  function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setAnalyzing(true);
    // Simulate AI photo analysis
    setTimeout(() => {
      const sampleDetections = [
        { name: 'Dal (Toor/Arhar)', quantity: 1 },
        { name: 'Mixed Veg Sabzi', quantity: 1 },
        { name: 'Roti / Chapati', quantity: 2 },
        { name: 'Salad (Green)', quantity: 1 },
      ];
      setPendingItems(sampleDetections);
      setShowConfirm(true);
      setAnalyzing(false);
    }, 1500);
  }

  function confirmItems() {
    pendingItems.forEach(item => {
      const dbEntry = INDIAN_FOOD_DB[item.name];
      const entry: FoodEntry = {
        id: crypto.randomUUID(),
        name: item.name,
        calories: dbEntry ? dbEntry.calories * item.quantity : 150 * item.quantity,
        protein: dbEntry ? dbEntry.protein * item.quantity : 5 * item.quantity,
        carbs: dbEntry ? dbEntry.carbs * item.quantity : 20 * item.quantity,
        fats: dbEntry ? dbEntry.fats * item.quantity : 5 * item.quantity,
        meal: selectedMeal,
        quantity: item.quantity,
        unit: dbEntry?.unit || 'serving',
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
    setPendingItems(prev => prev.map((item, i) =>
      i === idx ? { ...item, quantity: Math.max(1, item.quantity + delta) } : item
    ));
  }

  function removePending(idx: number) {
    setPendingItems(prev => prev.filter((_, i) => i !== idx));
  }

  const groupedFoods = meals.map(meal => ({
    meal,
    items: foods.filter(f => f.meal === meal),
    total: foods.filter(f => f.meal === meal).reduce((s, f) => s + f.calories, 0),
  }));

  return (
    <div className="pb-24">
      <div className="bg-white p-4 sticky top-0 z-10 border-b">
        <h1 className="text-lg font-bold text-gray-800 mb-3">Log Food</h1>
        
        {/* Meal selector */}
        <div className="flex gap-2 mb-3">
          {meals.map(m => (
            <button key={m} onClick={() => setSelectedMeal(m)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                selectedMeal === m ? 'bg-brand-600 text-white' : 'bg-gray-100 text-gray-600'
              }`}>
              {m.charAt(0).toUpperCase() + m.slice(1)}
            </button>
          ))}
        </div>

        {/* Input area */}
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <input type="text" value={textInput} onChange={e => setTextInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleTextSubmit()}
              placeholder="e.g. 2 aloo parathas with curd"
              className="w-full pl-3 pr-10 py-2.5 bg-gray-50 rounded-xl text-sm border border-gray-200 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none" />
            <button onClick={handleTextSubmit}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-brand-600 p-1">
              <Send size={18} />
            </button>
          </div>
          <label className="flex items-center justify-center w-11 h-11 bg-brand-50 rounded-xl cursor-pointer hover:bg-brand-100 transition-colors">
            <Camera size={20} className="text-brand-600" />
            <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handlePhotoUpload} />
          </label>
        </div>

        {analyzing && (
          <div className="mt-3 flex items-center gap-2 text-sm text-brand-600">
            <Sparkles size={16} className="animate-pulse" /> Analyzing your meal...
          </div>
        )}
      </div>

      {/* Confirmation modal */}
      {showConfirm && pendingItems.length > 0 && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end justify-center">
          <div className="bg-white w-full max-w-lg rounded-t-3xl p-5 animate-slide-up">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-base font-bold flex items-center gap-2">
                <Sparkles size={18} className="text-brand-600" /> AI Detected Items
              </h2>
              <button onClick={() => { setShowConfirm(false); setPendingItems([]); }}>
                <X size={20} className="text-gray-400" />
              </button>
            </div>
            <div className="space-y-3 max-h-60 overflow-y-auto">
              {pendingItems.map((item, idx) => {
                const db = INDIAN_FOOD_DB[item.name];
                return (
                  <div key={idx} className="flex items-center justify-between bg-gray-50 rounded-xl p-3">
                    <div>
                      <p className="text-sm font-medium text-gray-800">{item.name}</p>
                      <p className="text-xs text-gray-500">
                        {db ? `${db.calories * item.quantity} cal · ${db.protein * item.quantity}g P` : `~${150 * item.quantity} cal`}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => adjustPending(idx, -1)} className="w-7 h-7 rounded-full bg-white border flex items-center justify-center">
                        <Minus size={14} />
                      </button>
                      <span className="text-sm font-bold w-6 text-center">{item.quantity}</span>
                      <button onClick={() => adjustPending(idx, 1)} className="w-7 h-7 rounded-full bg-white border flex items-center justify-center">
                        <Plus size={14} />
                      </button>
                      <button onClick={() => removePending(idx)} className="ml-1 text-red-400">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-4 flex justify-between items-center">
              <p className="text-sm text-gray-500">
                Total: {pendingItems.reduce((s, item) => {
                  const db = INDIAN_FOOD_DB[item.name];
                  return s + (db ? db.calories * item.quantity : 150 * item.quantity);
                }, 0)} cal
              </p>
              <button onClick={confirmItems}
                className="bg-brand-600 text-white px-6 py-2.5 rounded-xl text-sm font-medium hover:bg-brand-700 transition-colors">
                Confirm & Log
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Logged foods */}
      <div className="p-4 space-y-4">
        {groupedFoods.map(group => (
          <div key={group.meal}>
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-sm font-semibold text-gray-700 capitalize">{group.meal}</h3>
              <span className="text-xs text-gray-400">{group.total} cal</span>
            </div>
            {group.items.length === 0 ? (
              <p className="text-xs text-gray-300 italic">Nothing logged yet</p>
            ) : (
              <div className="space-y-2">
                {group.items.map(food => (
                  <div key={food.id} className="flex items-center justify-between bg-white rounded-xl p-3 shadow-sm">
                    <div>
                      <p className="text-sm font-medium text-gray-800">{food.name}</p>
                      <p className="text-xs text-gray-500">
                        {food.calories} cal · {food.protein}g P · {food.carbs}g C · {food.fats}g F
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-400">{food.quantity} {food.unit}</span>
                      <button onClick={() => removeFood(food.id)} className="text-red-300 hover:text-red-500">
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
  );
}
