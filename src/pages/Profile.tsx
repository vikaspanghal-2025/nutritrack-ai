import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { UserProfile } from '../types';
import { calculateBMR, calculateTDEE, calculateTargets } from '../utils/nutrition';
import { Target, Flame, Scale, Activity, User } from 'lucide-react';
import FitnessSync from '../components/FitnessSync';

const GOALS = [
  { value: 'weight_loss' as const, label: 'Weight Loss', icon: '🏃', desc: 'Calorie deficit for fat loss', color: 'border-green-400 bg-green-50' },
  { value: 'muscle_building' as const, label: 'Muscle Building', icon: '💪', desc: 'Calorie surplus for gains', color: 'border-blue-400 bg-blue-50' },
  { value: 'endurance' as const, label: 'Endurance', icon: '🚴', desc: 'Balanced for performance', color: 'border-purple-400 bg-purple-50' },
];

export default function Profile() {
  const { profile, setProfile } = useApp();
  const [form, setForm] = useState<UserProfile>(profile || {
    name: '', age: 28, gender: 'male', heightCm: 170, weightKg: 72, goal: 'weight_loss', activityLevel: 'moderate',
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
    <div className="p-4 lg:p-8 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <User size={24} className="text-brand-600" /> Profile & Goals
        </h1>
        <p className="text-sm text-gray-400 mt-1">Manage your biometrics and fitness targets</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Form */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-2xl p-5 lg:p-6 border border-gray-100 shadow-sm space-y-4">
            <h2 className="text-sm font-semibold text-gray-700">Personal Info</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">Name</label>
                <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                  className="w-full px-4 py-2.5 bg-gray-50 rounded-xl text-sm border border-gray-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none" placeholder="Your name" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">Gender</label>
                <div className="flex gap-2">
                  {(['male', 'female', 'other'] as const).map(g => (
                    <button key={g} onClick={() => setForm({ ...form, gender: g })}
                      className={`flex-1 py-2.5 rounded-xl text-sm font-medium capitalize transition-all ${
                        form.gender === g ? 'bg-brand-600 text-white shadow-md' : 'bg-gray-50 text-gray-500 border border-gray-200'
                      }`}>{g}</button>
                  ))}
                </div>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">Age</label>
                <input type="number" value={form.age} onChange={e => setForm({ ...form, age: Number(e.target.value) })}
                  className="w-full px-4 py-2.5 bg-gray-50 rounded-xl text-sm border border-gray-200 focus:border-brand-500 outline-none" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">Height (cm)</label>
                <input type="number" value={form.heightCm} onChange={e => setForm({ ...form, heightCm: Number(e.target.value) })}
                  className="w-full px-4 py-2.5 bg-gray-50 rounded-xl text-sm border border-gray-200 focus:border-brand-500 outline-none" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">Weight (kg)</label>
                <input type="number" value={form.weightKg} onChange={e => setForm({ ...form, weightKg: Number(e.target.value) })}
                  className="w-full px-4 py-2.5 bg-gray-50 rounded-xl text-sm border border-gray-200 focus:border-brand-500 outline-none" />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">Activity Level</label>
              <select value={form.activityLevel} onChange={e => setForm({ ...form, activityLevel: e.target.value as any })}
                className="w-full px-4 py-2.5 bg-gray-50 rounded-xl text-sm border border-gray-200 focus:border-brand-500 outline-none">
                <option value="sedentary">Sedentary (desk job)</option>
                <option value="light">Light (1-2 days/week)</option>
                <option value="moderate">Moderate (3-5 days/week)</option>
                <option value="active">Active (6-7 days/week)</option>
                <option value="very_active">Very Active (athlete)</option>
              </select>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 lg:p-6 border border-gray-100 shadow-sm">
            <h2 className="text-sm font-semibold text-gray-700 mb-3">Fitness Goal</h2>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
              {GOALS.map(g => (
                <button key={g.value} onClick={() => setForm({ ...form, goal: g.value })}
                  className={`flex flex-col items-center p-5 rounded-xl border-2 transition-all text-center ${
                    form.goal === g.value ? g.color + ' shadow-md' : 'border-gray-200 bg-gray-50 hover:bg-gray-100'
                  }`}>
                  <span className="text-3xl mb-2">{g.icon}</span>
                  <p className="text-sm font-semibold text-gray-800">{g.label}</p>
                  <p className="text-xs text-gray-500 mt-1">{g.desc}</p>
                </button>
              ))}
            </div>
          </div>

          <button onClick={handleSave}
            className={`w-full py-3 rounded-xl font-medium text-white transition-all shadow-md hover:shadow-lg ${
              saved ? 'bg-green-500' : 'bg-brand-600 hover:bg-brand-700'
            }`}>
            {saved ? '✓ Profile Saved!' : 'Save Profile'}
          </button>
        </div>

        {/* Right: Stats + Sync */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
            <h2 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
              <Target size={16} className="text-brand-600" /> Calculated Targets
            </h2>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-orange-50 rounded-xl p-4 text-center">
                <Flame size={18} className="mx-auto text-orange-500 mb-1" />
                <p className="text-xs text-gray-500">BMR</p>
                <p className="text-xl font-bold text-gray-800">{Math.round(bmr)}</p>
              </div>
              <div className="bg-blue-50 rounded-xl p-4 text-center">
                <Activity size={18} className="mx-auto text-blue-500 mb-1" />
                <p className="text-xs text-gray-500">TDEE</p>
                <p className="text-xl font-bold text-gray-800">{tdee}</p>
              </div>
              <div className="bg-green-50 rounded-xl p-4 text-center">
                <Scale size={18} className="mx-auto text-green-500 mb-1" />
                <p className="text-xs text-gray-500">Daily Target</p>
                <p className="text-xl font-bold text-gray-800">{preview.calories}</p>
              </div>
              <div className="bg-purple-50 rounded-xl p-4 text-center">
                <p className="text-xs text-gray-500 mb-1">Macros (P/C/F)</p>
                <p className="text-sm font-bold text-gray-800">{preview.protein}g / {preview.carbs}g / {preview.fats}g</p>
              </div>
            </div>
          </div>

          <FitnessSync />
        </div>
      </div>
    </div>
  );
}
