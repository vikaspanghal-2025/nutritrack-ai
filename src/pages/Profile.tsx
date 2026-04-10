import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { UserProfile } from '../types';
import { calculateBMR, calculateTDEE, calculateTargets } from '../utils/nutrition';
import { Target, Flame, Scale, Activity } from 'lucide-react';
import FitnessSync from '../components/FitnessSync';

const GOALS = [
  { value: 'weight_loss' as const, label: 'Weight Loss', icon: '🏃', desc: 'Calorie deficit for fat loss' },
  { value: 'muscle_building' as const, label: 'Muscle Building', icon: '💪', desc: 'Calorie surplus for gains' },
  { value: 'endurance' as const, label: 'Endurance', icon: '🚴', desc: 'Balanced for performance' },
];

export default function Profile() {
  const { profile, setProfile, targets } = useApp();
  const [form, setForm] = useState<UserProfile>(profile || {
    name: '', age: 28, gender: 'male', heightCm: 170, weightKg: 72,
    goal: 'weight_loss', activityLevel: 'moderate',
  });
  const [saved, setSaved] = useState(false);

  function handleSave() {
    setProfile(form);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  const bmr = calculateBMR(form);
  const tdee = calculateTDEE(form);
  const preview = calculateTargets(form);

  return (
    <div className="pb-24 p-4">
      <h1 className="text-lg font-bold text-gray-800 mb-4">Profile & Goals</h1>

      <div className="bg-white rounded-2xl p-4 shadow-sm space-y-4">
        <div>
          <label className="text-xs font-medium text-gray-600">Name</label>
          <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
            className="w-full mt-1 px-3 py-2 bg-gray-50 rounded-xl text-sm border border-gray-200 focus:border-brand-500 outline-none"
            placeholder="Your name" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-gray-600">Age</label>
            <input type="number" value={form.age} onChange={e => setForm({ ...form, age: Number(e.target.value) })}
              className="w-full mt-1 px-3 py-2 bg-gray-50 rounded-xl text-sm border border-gray-200 focus:border-brand-500 outline-none" />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600">Gender</label>
            <select value={form.gender} onChange={e => setForm({ ...form, gender: e.target.value as any })}
              className="w-full mt-1 px-3 py-2 bg-gray-50 rounded-xl text-sm border border-gray-200 focus:border-brand-500 outline-none">
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-gray-600">Height (cm)</label>
            <input type="number" value={form.heightCm} onChange={e => setForm({ ...form, heightCm: Number(e.target.value) })}
              className="w-full mt-1 px-3 py-2 bg-gray-50 rounded-xl text-sm border border-gray-200 focus:border-brand-500 outline-none" />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600">Weight (kg)</label>
            <input type="number" value={form.weightKg} onChange={e => setForm({ ...form, weightKg: Number(e.target.value) })}
              className="w-full mt-1 px-3 py-2 bg-gray-50 rounded-xl text-sm border border-gray-200 focus:border-brand-500 outline-none" />
          </div>
        </div>

        <div>
          <label className="text-xs font-medium text-gray-600 mb-2 block">Activity Level</label>
          <select value={form.activityLevel} onChange={e => setForm({ ...form, activityLevel: e.target.value as any })}
            className="w-full px-3 py-2 bg-gray-50 rounded-xl text-sm border border-gray-200 focus:border-brand-500 outline-none">
            <option value="sedentary">Sedentary (desk job)</option>
            <option value="light">Light (1-2 days/week)</option>
            <option value="moderate">Moderate (3-5 days/week)</option>
            <option value="active">Active (6-7 days/week)</option>
            <option value="very_active">Very Active (athlete)</option>
          </select>
        </div>

        <div>
          <label className="text-xs font-medium text-gray-600 mb-2 block">Goal</label>
          <div className="space-y-2">
            {GOALS.map(g => (
              <button key={g.value} onClick={() => setForm({ ...form, goal: g.value })}
                className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-colors text-left ${
                  form.goal === g.value ? 'border-brand-500 bg-brand-50' : 'border-gray-200 bg-gray-50'
                }`}>
                <span className="text-2xl">{g.icon}</span>
                <div>
                  <p className="text-sm font-medium text-gray-800">{g.label}</p>
                  <p className="text-xs text-gray-500">{g.desc}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Calculated stats */}
      <div className="mt-4 bg-white rounded-2xl p-4 shadow-sm">
        <h2 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
          <Target size={16} /> Your Calculated Targets
        </h2>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-gray-50 rounded-xl p-3 text-center">
            <Flame size={18} className="mx-auto text-orange-500 mb-1" />
            <p className="text-xs text-gray-500">BMR</p>
            <p className="text-lg font-bold text-gray-800">{Math.round(bmr)}</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-3 text-center">
            <Activity size={18} className="mx-auto text-blue-500 mb-1" />
            <p className="text-xs text-gray-500">TDEE</p>
            <p className="text-lg font-bold text-gray-800">{tdee}</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-3 text-center">
            <Scale size={18} className="mx-auto text-brand-500 mb-1" />
            <p className="text-xs text-gray-500">Daily Target</p>
            <p className="text-lg font-bold text-gray-800">{preview.calories}</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-3 text-center">
            <p className="text-xs text-gray-500">Macros (P/C/F)</p>
            <p className="text-sm font-bold text-gray-800 mt-1">{preview.protein}g / {preview.carbs}g / {preview.fats}g</p>
          </div>
        </div>
      </div>

      <button onClick={handleSave}
        className={`mt-4 w-full py-3 rounded-xl font-medium text-white transition-all ${
          saved ? 'bg-brand-500' : 'bg-brand-600 hover:bg-brand-700'
        }`}>
        {saved ? '✓ Saved!' : 'Save Profile'}
      </button>

      {/* Fitness App Integration */}
      <div className="mt-4">
        <FitnessSync />
      </div>
    </div>
  );
}
