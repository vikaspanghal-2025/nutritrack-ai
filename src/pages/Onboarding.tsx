import { useState } from 'react';
import { UserProfile } from '../types';
import { useApp } from '../context/AppContext';
import { Sparkles, ArrowRight } from 'lucide-react';

export default function Onboarding() {
  const { setProfile } = useApp();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<UserProfile>({
    name: '', age: 28, gender: 'male', heightCm: 170, weightKg: 72,
    goal: 'weight_loss', activityLevel: 'moderate',
  });

  function finish() {
    setProfile(form);
  }

  const steps = [
    // Welcome
    <div key="welcome" className="text-center">
      <div className="w-20 h-20 bg-brand-100 rounded-full flex items-center justify-center mx-auto mb-6">
        <Sparkles size={36} className="text-brand-600" />
      </div>
      <h1 className="text-2xl font-bold text-gray-800 mb-2">NutriTrack AI</h1>
      <p className="text-gray-500 mb-8">Your intelligent nutrition & fitness companion. Let's set up your profile in 30 seconds.</p>
      <button onClick={() => setStep(1)}
        className="bg-brand-600 text-white px-8 py-3 rounded-xl font-medium flex items-center gap-2 mx-auto hover:bg-brand-700">
        Get Started <ArrowRight size={18} />
      </button>
    </div>,

    // Basic info
    <div key="basics" className="space-y-4">
      <h2 className="text-lg font-bold text-gray-800">About You</h2>
      <input type="text" placeholder="Your name" value={form.name}
        onChange={e => setForm({ ...form, name: e.target.value })}
        className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-gray-200 text-sm focus:border-brand-500 outline-none" />
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="text-xs text-gray-500">Age</label>
          <input type="number" value={form.age} onChange={e => setForm({ ...form, age: Number(e.target.value) })}
            className="w-full mt-1 px-3 py-2 bg-gray-50 rounded-xl border border-gray-200 text-sm focus:border-brand-500 outline-none" />
        </div>
        <div>
          <label className="text-xs text-gray-500">Height (cm)</label>
          <input type="number" value={form.heightCm} onChange={e => setForm({ ...form, heightCm: Number(e.target.value) })}
            className="w-full mt-1 px-3 py-2 bg-gray-50 rounded-xl border border-gray-200 text-sm focus:border-brand-500 outline-none" />
        </div>
        <div>
          <label className="text-xs text-gray-500">Weight (kg)</label>
          <input type="number" value={form.weightKg} onChange={e => setForm({ ...form, weightKg: Number(e.target.value) })}
            className="w-full mt-1 px-3 py-2 bg-gray-50 rounded-xl border border-gray-200 text-sm focus:border-brand-500 outline-none" />
        </div>
      </div>
      <div className="flex gap-2">
        {(['male', 'female', 'other'] as const).map(g => (
          <button key={g} onClick={() => setForm({ ...form, gender: g })}
            className={`flex-1 py-2 rounded-xl text-sm font-medium capitalize ${
              form.gender === g ? 'bg-brand-600 text-white' : 'bg-gray-100 text-gray-600'
            }`}>{g}</button>
        ))}
      </div>
      <button onClick={() => setStep(2)} className="w-full bg-brand-600 text-white py-3 rounded-xl font-medium mt-2">
        Next
      </button>
    </div>,

    // Goal
    <div key="goal" className="space-y-4">
      <h2 className="text-lg font-bold text-gray-800">What's your goal?</h2>
      {[
        { v: 'weight_loss' as const, icon: '🏃', label: 'Lose Weight', desc: 'Burn fat, get lean' },
        { v: 'muscle_building' as const, icon: '💪', label: 'Build Muscle', desc: 'Gain strength & size' },
        { v: 'endurance' as const, icon: '🚴', label: 'Build Endurance', desc: 'Athletic performance' },
      ].map(g => (
        <button key={g.v} onClick={() => setForm({ ...form, goal: g.v })}
          className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 text-left transition-colors ${
            form.goal === g.v ? 'border-brand-500 bg-brand-50' : 'border-gray-200'
          }`}>
          <span className="text-3xl">{g.icon}</span>
          <div>
            <p className="font-medium text-gray-800">{g.label}</p>
            <p className="text-xs text-gray-500">{g.desc}</p>
          </div>
        </button>
      ))}
      <button onClick={finish} className="w-full bg-brand-600 text-white py-3 rounded-xl font-medium mt-2">
        Let's Go! 🚀
      </button>
    </div>,
  ];

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-b from-brand-50 to-white">
      <div className="w-full max-w-sm">
        {steps[step]}
      </div>
    </div>
  );
}
