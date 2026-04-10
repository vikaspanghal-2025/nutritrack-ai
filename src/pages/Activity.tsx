import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { ActivityEntry } from '../types';
import { Trash2, Plus, Dumbbell, Clock, Flame, Zap } from 'lucide-react';
import DateNav from '../components/DateNav';

const ACTIVITY_TYPES = [
  { name: 'Running', calPerMin: 10, icon: '🏃' },
  { name: 'Walking', calPerMin: 5, icon: '🚶' },
  { name: 'Yoga', calPerMin: 4, icon: '🧘' },
  { name: 'Weightlifting', calPerMin: 7, icon: '🏋️' },
  { name: 'Cycling', calPerMin: 8, icon: '🚴' },
  { name: 'Swimming', calPerMin: 9, icon: '🏊' },
  { name: 'HIIT', calPerMin: 12, icon: '⚡' },
  { name: 'Dancing', calPerMin: 6, icon: '💃' },
  { name: 'Cricket', calPerMin: 6, icon: '🏏' },
  { name: 'Badminton', calPerMin: 7, icon: '🏸' },
];

export default function Activity() {
  const { activities, addActivity, removeActivity } = useApp();
  const [showForm, setShowForm] = useState(false);
  const [selectedType, setSelectedType] = useState(ACTIVITY_TYPES[0]);
  const [duration, setDuration] = useState(30);
  const [intensity, setIntensity] = useState<'low' | 'moderate' | 'high'>('moderate');

  const intensityMultiplier = { low: 0.7, moderate: 1, high: 1.3 };

  function handleAdd() {
    const cal = Math.round(selectedType.calPerMin * duration * intensityMultiplier[intensity]);
    const entry: ActivityEntry = {
      id: crypto.randomUUID(),
      type: selectedType.name,
      duration,
      caloriesBurned: cal,
      intensity,
      timestamp: new Date().toISOString(),
      source: 'manual',
    };
    addActivity(entry);
    setShowForm(false);
    setDuration(30);
  }

  const totalBurned = activities.reduce((s, a) => s + a.caloriesBurned, 0);
  const totalMinutes = activities.reduce((s, a) => s + a.duration, 0);

  return (
    <div className="p-4 lg:p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Dumbbell size={24} className="text-orange-500" /> Activity
          </h1>
          <p className="text-sm text-gray-400 mt-1">Track your workouts and calories burned</p>
        </div>
        <DateNav />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 lg:gap-4 mb-6">
        <div className="bg-white rounded-2xl p-4 lg:p-5 border border-gray-100 shadow-sm text-center">
          <Flame size={20} className="mx-auto text-orange-500 mb-2" />
          <p className="text-2xl font-bold text-gray-900">{totalBurned}</p>
          <p className="text-xs text-gray-400">calories burned</p>
        </div>
        <div className="bg-white rounded-2xl p-4 lg:p-5 border border-gray-100 shadow-sm text-center">
          <Clock size={20} className="mx-auto text-blue-500 mb-2" />
          <p className="text-2xl font-bold text-gray-900">{totalMinutes}</p>
          <p className="text-xs text-gray-400">minutes active</p>
        </div>
        <div className="bg-white rounded-2xl p-4 lg:p-5 border border-gray-100 shadow-sm text-center">
          <Zap size={20} className="mx-auto text-purple-500 mb-2" />
          <p className="text-2xl font-bold text-gray-900">{activities.length}</p>
          <p className="text-xs text-gray-400">workouts</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Add form */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm sticky top-4">
            <button onClick={() => setShowForm(!showForm)}
              className="w-full bg-gradient-to-r from-orange-500 to-amber-500 text-white py-3 rounded-xl font-medium flex items-center justify-center gap-2 hover:shadow-lg transition-all">
              <Plus size={18} /> Log Activity
            </button>

            {showForm && (
              <div className="mt-4 space-y-4">
                <div>
                  <label className="text-xs font-medium text-gray-500 mb-2 block">Activity Type</label>
                  <div className="grid grid-cols-5 gap-1.5">
                    {ACTIVITY_TYPES.map(t => (
                      <button key={t.name} onClick={() => setSelectedType(t)}
                        className={`flex flex-col items-center p-2 rounded-xl text-xs transition-all ${
                          selectedType.name === t.name ? 'bg-orange-100 border-2 border-orange-400 shadow-sm' : 'bg-gray-50 border-2 border-transparent hover:bg-gray-100'
                        }`}>
                        <span className="text-lg">{t.icon}</span>
                        <span className="mt-0.5 text-[9px] leading-tight text-center">{t.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-gray-500 mb-2 block">Duration: {duration} min</label>
                  <input type="range" min={5} max={180} step={5} value={duration}
                    onChange={e => setDuration(Number(e.target.value))}
                    className="w-full accent-orange-500" />
                  <div className="flex justify-between text-[10px] text-gray-300 mt-1">
                    <span>5 min</span><span>180 min</span>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-gray-500 mb-2 block">Intensity</label>
                  <div className="flex gap-2">
                    {(['low', 'moderate', 'high'] as const).map(i => (
                      <button key={i} onClick={() => setIntensity(i)}
                        className={`flex-1 py-2.5 rounded-xl text-xs font-medium capitalize transition-all ${
                          intensity === i ? 'bg-orange-500 text-white shadow-md' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
                        }`}>{i}</button>
                    ))}
                  </div>
                </div>

                <div className="flex justify-between items-center pt-3 border-t border-gray-100">
                  <p className="text-sm text-gray-500">
                    Est. burn: <span className="font-bold text-orange-600">
                      {Math.round(selectedType.calPerMin * duration * intensityMultiplier[intensity])} cal
                    </span>
                  </p>
                  <button onClick={handleAdd}
                    className="bg-orange-500 text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-orange-600 shadow-md">
                    Add
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right: Activity list */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
            <h2 className="text-sm font-semibold text-gray-700 mb-4">Logged Activities</h2>
            {activities.length === 0 ? (
              <div className="text-center py-12">
                <Dumbbell size={40} className="mx-auto text-gray-200 mb-3" />
                <p className="text-sm text-gray-300">No activities logged for this day</p>
              </div>
            ) : (
              <div className="space-y-2">
                {activities.map(a => (
                  <div key={a.id} className="flex items-center justify-between bg-gray-50 rounded-xl p-4 hover:bg-orange-50 transition-colors group">
                    <div className="flex items-center gap-4">
                      <span className="text-2xl">{ACTIVITY_TYPES.find(t => t.name === a.type)?.icon || '🏃'}</span>
                      <div>
                        <p className="text-sm font-medium text-gray-800">{a.type}</p>
                        <p className="text-xs text-gray-400">{a.duration} min · {a.intensity} intensity</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-sm font-bold text-orange-600">{a.caloriesBurned} cal</span>
                      <button onClick={() => removeActivity(a.id)}
                        className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all">
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
