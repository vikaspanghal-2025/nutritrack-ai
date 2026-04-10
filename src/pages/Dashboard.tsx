import { useApp } from '../context/AppContext';
import ProgressRing from '../components/ProgressRing';
import MacroBar from '../components/MacroBar';
import { Flame, TrendingDown, Zap, Apple } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from 'recharts';
import { getAllLogs } from '../utils/storage';
import { useMemo } from 'react';

export default function Dashboard() {
  const { profile, targets, totalCaloriesIn, totalCaloriesOut, totalProtein, totalCarbs, totalFats, foods, activities } = useApp();
  const remaining = Math.max(targets.calories - totalCaloriesIn + totalCaloriesOut, 0);

  const macroData = [
    { name: 'Protein', value: totalProtein * 4, color: '#3b82f6' },
    { name: 'Carbs', value: totalCarbs * 4, color: '#f59e0b' },
    { name: 'Fats', value: totalFats * 9, color: '#ef4444' },
  ];

  const weekData = useMemo(() => {
    const logs = getAllLogs();
    const days: { day: string; calories: number; burned: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split('T')[0];
      const log = logs[key];
      const dayName = d.toLocaleDateString('en', { weekday: 'short' });
      days.push({
        day: dayName,
        calories: log?.foods.reduce((s: number, f: any) => s + f.calories, 0) || 0,
        burned: log?.activities.reduce((s: number, a: any) => s + a.caloriesBurned, 0) || 0,
      });
    }
    return days;
  }, [foods, activities]);

  const mealBreakdown = useMemo(() => {
    const meals: Record<string, number> = { breakfast: 0, lunch: 0, dinner: 0, snack: 0 };
    foods.forEach(f => { meals[f.meal] += f.calories; });
    return Object.entries(meals).map(([name, cal]) => ({ name: name.charAt(0).toUpperCase() + name.slice(1), cal }));
  }, [foods]);

  return (
    <div className="pb-4 space-y-4">
      {/* Header */}
      <div className="bg-gradient-to-br from-brand-600 to-brand-700 text-white p-5 rounded-b-3xl">
        <p className="text-sm opacity-80">Hello, {profile?.name || 'there'} 👋</p>
        <h1 className="text-xl font-bold mt-1">Today's Progress</h1>
        
        <div className="flex items-center justify-around mt-5">
          <div className="relative">
            <ProgressRing value={totalCaloriesIn} max={targets.calories} size={130} color="#fff" label="" />
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-bold">{remaining}</span>
              <span className="text-xs opacity-80">remaining</span>
            </div>
          </div>
          <div className="space-y-3 text-sm">
            <div className="flex items-center gap-2">
              <Apple size={16} /> <span>{totalCaloriesIn} eaten</span>
            </div>
            <div className="flex items-center gap-2">
              <Flame size={16} /> <span>{totalCaloriesOut} burned</span>
            </div>
            <div className="flex items-center gap-2">
              <Zap size={16} /> <span>{targets.calories} target</span>
            </div>
          </div>
        </div>
      </div>

      {/* Macros */}
      <div className="mx-4 bg-white rounded-2xl p-4 shadow-sm">
        <h2 className="text-sm font-semibold text-gray-800 mb-3">Macronutrients</h2>
        <div className="flex gap-4">
          <MacroBar label="Protein" value={totalProtein} target={targets.protein} color="#3b82f6" />
          <MacroBar label="Carbs" value={totalCarbs} target={targets.carbs} color="#f59e0b" />
          <MacroBar label="Fats" value={totalFats} target={targets.fats} color="#ef4444" />
        </div>
        {totalCaloriesIn > 0 && (
          <div className="mt-4 flex items-center gap-4">
            <div className="w-20 h-20">
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={macroData} dataKey="value" innerRadius={22} outerRadius={35} paddingAngle={3}>
                    {macroData.map((d, i) => <Cell key={i} fill={d.color} />)}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex gap-3 text-xs">
              {macroData.map(d => (
                <div key={d.name} className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: d.color }} />
                  {d.name}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Meal Breakdown */}
      <div className="mx-4 bg-white rounded-2xl p-4 shadow-sm">
        <h2 className="text-sm font-semibold text-gray-800 mb-3">Meals Today</h2>
        <div className="grid grid-cols-4 gap-2">
          {mealBreakdown.map(m => (
            <div key={m.name} className="text-center p-2 bg-gray-50 rounded-xl">
              <p className="text-lg font-bold text-gray-800">{m.cal}</p>
              <p className="text-[10px] text-gray-500">{m.name}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Weekly Trend */}
      <div className="mx-4 bg-white rounded-2xl p-4 shadow-sm">
        <h2 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
          <TrendingDown size={16} /> Weekly Trend
        </h2>
        <div className="h-40">
          <ResponsiveContainer>
            <AreaChart data={weekData}>
              <defs>
                <linearGradient id="calGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="day" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis hide />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
              <Area type="monotone" dataKey="calories" stroke="#22c55e" fill="url(#calGrad)" strokeWidth={2} name="Eaten" />
              <Area type="monotone" dataKey="burned" stroke="#f59e0b" fill="none" strokeWidth={2} strokeDasharray="4 4" name="Burned" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
