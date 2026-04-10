import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { ActivityEntry } from '../types';
import { Trash2, Plus } from 'lucide-react';

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
    <div className="pb-24">
      <div className="bg-white p-4 border-b">
        <h1 className="text-lg font-bold text-gray-800">Activity</h1>
        <div className="flex gap-4 mt-3">
          <div className="flex-1 bg-orange-50 rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-orange-600">{totalBurned}</p>
            <p className="text-xs text-orange-400">calories burned</p>
          </div>
          <div className="flex-1 bg-blue-50 rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-blue-600">{totalMinutes}</p>
            <p className="text-xs text-blue-400">minutes active</p>
          </div>
          <div className="flex-1 bg-purple-50 rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-purple-600">{activities.length}</p>
            <p className="text-xs text-purple-400">workouts</p>
          </div>
        </div>
      </div>

      <div className="p-4">
        <button onClick={() => setShowForm(!showForm)}
          className="w-full bg-brand-600 text-white py-3 rounded-xl font-medium flex items-center justify-center gap-2 hover:bg-brand-700 transition-colors">
          <Plus size={18} /> Log Activity
        </button>

        {showForm && (
          <div className="mt-4 bg-white rounded-2xl p-4 shadow-sm space-y-4">
            <div>
              <label className="text-xs font-medium text-gray-600 mb-2 block">Activity Type</label>
              <div className="grid grid-cols-5 gap-2">
                {ACTIVITY_TYPES.map(t => (
                  <button key={t.name} onClick={() => setSelectedType(t)}
                    className={`flex flex-col items-center p-2 rounded-xl text-xs transition-colors ${
                      selectedType.name === t.name ? 'bg-brand-100 border-2 border-brand-500' : 'bg-gray-50 border-2 border-transparent'
                    }`}>
                    <span className="text-xl">{t.icon}</span>
                    <span className="mt-1 text-[10px]">{t.name}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-gray-600 mb-2 block">Duration: {duration} min</label>
              <input type="range" min={5} max={180} step={5} value={duration}
                onChange={e => setDuration(Number(e.target.value))}
                className="w-full accent-brand-600" />
            </div>

            <div>
              <label className="text-xs font-medium text-gray-600 mb-2 block">Intensity</label>
              <div className="flex gap-2">
                {(['low', 'moderate', 'high'] as const).map(i => (
                  <button key={i} onClick={() => setIntensity(i)}
                    className={`flex-1 py-2 rounded-xl text-xs font-medium capitalize transition-colors ${
                      intensity === i ? 'bg-brand-600 text-white' : 'bg-gray-100 text-gray-600'
                    }`}>{i}</button>
                ))}
              </div>
            </div>

            <div className="flex justify-between items-center pt-2">
              <p className="text-sm text-gray-500">
                Est. burn: <span className="font-bold text-orange-600">
                  {Math.round(selectedType.calPerMin * duration * intensityMultiplier[intensity])} cal
                </span>
              </p>
              <button onClick={handleAdd}
                className="bg-brand-600 text-white px-5 py-2 rounded-xl text-sm font-medium hover:bg-brand-700">
                Add
              </button>
            </div>
          </div>
        )}

        {/* Activity list */}
        <div className="mt-4 space-y-2">
          {activities.length === 0 && (
            <p className="text-center text-gray-300 text-sm py-8">No activities logged today</p>
          )}
          {activities.map(a => (
            <div key={a.id} className="flex items-center justify-between bg-white rounded-xl p-3 shadow-sm">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{ACTIVITY_TYPES.find(t => t.name === a.type)?.icon || '🏃'}</span>
                <div>
                  <p className="text-sm font-medium text-gray-800">{a.type}</p>
                  <p className="text-xs text-gray-500">{a.duration} min · {a.intensity}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-bold text-orange-600">{a.caloriesBurned} cal</span>
                <button onClick={() => removeActivity(a.id)} className="text-red-300 hover:text-red-500">
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
