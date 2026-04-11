import { useApp } from '../context/AppContext';
import ProgressRing from '../components/ProgressRing';
import MacroBar from '../components/MacroBar';
import DateNav from '../components/DateNav';
import { Flame, Zap, Apple, TrendingUp, Utensils, Dumbbell, Trophy } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from 'recharts';
import { useMemo, useState, useEffect } from 'react';
import { todayPST } from '../utils/dateUtils';
import { fetchWeeklyLogs } from '../utils/api';

const motivations = [
  "Every healthy meal is a step forward 💪",
  "Consistency beats perfection 🎯",
  "You're building a stronger you 🔥",
  "Small choices, big results 🌟",
  "Fuel your body, fuel your goals 🚀",
];

export default function Dashboard() {
  const { profile, targets, totalCaloriesIn, totalCaloriesOut, totalProtein, totalCarbs, totalFats, foods, activities, selectedDate } = useApp();
  const remaining = Math.max(targets.calories - totalCaloriesIn + totalCaloriesOut, 0);
  const isToday = selectedDate === todayPST();
  const motivation = motivations[new Date().getDay() % motivations.length];

  const macroData = [
    { name: 'Protein', value: Math.max(totalProtein * 4, 1), color: '#6366f1' },
    { name: 'Carbs', value: Math.max(totalCarbs * 4, 1), color: '#f59e0b' },
    { name: 'Fats', value: Math.max(totalFats * 9, 1), color: '#ef4444' },
  ];

  const [weekData, setWeekData] = useState<{ day: string; calories: number; burned: number }[]>([]);

  useEffect(() => {
    fetchWeeklyLogs().then(logs => {
      const days = logs.map(log => {
        const d = new Date(log.date + 'T12:00:00');
        return {
          day: d.toLocaleDateString('en', { weekday: 'short' }),
          calories: log.foods?.reduce((s: number, f: any) => s + (f.calories || 0), 0) || 0,
          burned: log.activities?.reduce((s: number, a: any) => s + (a.caloriesBurned || 0), 0) || 0,
        };
      }).reverse();
      setWeekData(days);
    }).catch(console.error);
  }, [foods, activities]);

  const mealBreakdown = useMemo(() => {
    const meals: Record<string, number> = { breakfast: 0, lunch: 0, dinner: 0, snack: 0 };
    foods.forEach(f => { meals[f.meal] += f.calories; });
    return Object.entries(meals).map(([name, cal]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      cal,
      icon: name === 'breakfast' ? '🌅' : name === 'lunch' ? '☀️' : name === 'dinner' ? '🌙' : '🍿',
    }));
  }, [foods]);

  return (
    <div className="p-4 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">
            {isToday ? `Good ${new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'}, ${profile?.name?.split(' ')[0] || 'there'}` : 'Day Summary'}
          </h1>
          <p className="text-sm text-gray-400 mt-1">{motivation}</p>
        </div>
        <DateNav />
      </div>

      {/* Top stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 mb-6">
        <div className="bg-white rounded-2xl p-4 lg:p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center"><Apple size={16} className="text-green-600" /></div>
            <span className="text-xs text-gray-400">Eaten</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{totalCaloriesIn}</p>
          <p className="text-xs text-gray-400">calories</p>
        </div>
        <div className="bg-white rounded-2xl p-4 lg:p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center"><Flame size={16} className="text-orange-600" /></div>
            <span className="text-xs text-gray-400">Burned</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{totalCaloriesOut}</p>
          <p className="text-xs text-gray-400">calories</p>
        </div>
        <div className="bg-white rounded-2xl p-4 lg:p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center"><Zap size={16} className="text-blue-600" /></div>
            <span className="text-xs text-gray-400">Remaining</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{remaining}</p>
          <p className="text-xs text-gray-400">calories</p>
        </div>
        <div className="bg-white rounded-2xl p-4 lg:p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center"><Trophy size={16} className="text-purple-600" /></div>
            <span className="text-xs text-gray-400">Target</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{targets.calories}</p>
          <p className="text-xs text-gray-400">calories</p>
        </div>
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
        {/* Progress rings + macros */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
            <h2 className="text-sm font-semibold text-gray-700 mb-5">Calorie Balance</h2>
            <div className="flex justify-around items-end">
              <ProgressRing value={totalCaloriesIn} max={targets.calories} size={110} strokeWidth={10} color="#22c55e" label="Eaten" />
              <ProgressRing value={totalCaloriesOut} max={Math.max(totalCaloriesOut, 500)} size={110} strokeWidth={10} color="#f59e0b" label="Burned" />
              <ProgressRing value={remaining} max={targets.calories} size={110} strokeWidth={10} color="#6366f1" label="Remaining" />
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
            <h2 className="text-sm font-semibold text-gray-700 mb-4">Macronutrients</h2>
            <div className="space-y-3">
              <MacroBar label="Protein" value={totalProtein} target={targets.protein} color="#6366f1" />
              <MacroBar label="Carbs" value={totalCarbs} target={targets.carbs} color="#f59e0b" />
              <MacroBar label="Fats" value={totalFats} target={targets.fats} color="#ef4444" />
            </div>
            {totalCaloriesIn > 0 && (
              <div className="mt-4 flex items-center gap-4">
                <div className="w-20 h-20">
                  <ResponsiveContainer>
                    <PieChart>
                      <Pie data={macroData} dataKey="value" innerRadius={24} outerRadius={36} paddingAngle={3}>
                        {macroData.map((d, i) => <Cell key={i} fill={d.color} />)}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex flex-col gap-1.5 text-xs">
                  {macroData.map(d => (
                    <div key={d.name} className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                      <span className="text-gray-600">{d.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Weekly trend + meals */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
            <h2 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
              <TrendingUp size={16} className="text-brand-600" /> Weekly Trend
            </h2>
            <div className="h-52">
              <ResponsiveContainer>
                <AreaChart data={weekData}>
                  <defs>
                    <linearGradient id="calGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22c55e" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="burnGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="day" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis hide />
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 12, border: '1px solid #e5e7eb' }} />
                  <Area type="monotone" dataKey="calories" stroke="#22c55e" fill="url(#calGrad)" strokeWidth={2.5} name="Eaten" />
                  <Area type="monotone" dataKey="burned" stroke="#f59e0b" fill="url(#burnGrad)" strokeWidth={2} strokeDasharray="5 5" name="Burned" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Meals grid */}
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
            <h2 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
              <Utensils size={16} className="text-brand-600" /> Meals
            </h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {mealBreakdown.map(m => (
                <div key={m.name} className="bg-gray-50 rounded-xl p-4 text-center hover:bg-brand-50 transition-colors">
                  <span className="text-2xl">{m.icon}</span>
                  <p className="text-xl font-bold text-gray-900 mt-2">{m.cal}</p>
                  <p className="text-xs text-gray-400">{m.name}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Activity summary */}
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
            <h2 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <Dumbbell size={16} className="text-orange-500" /> Today's Activity
            </h2>
            {activities.length === 0 ? (
              <p className="text-sm text-gray-300">No activities logged</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {activities.map(a => (
                  <div key={a.id} className="bg-orange-50 rounded-lg px-3 py-2 text-sm">
                    <span className="font-medium text-orange-700">{a.type}</span>
                    <span className="text-orange-400 ml-2">{a.duration}min · {a.caloriesBurned}cal</span>
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
