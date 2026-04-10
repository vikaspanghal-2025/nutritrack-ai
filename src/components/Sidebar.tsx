import { useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, UtensilsCrossed, Dumbbell, MessageCircle, User, Sparkles } from 'lucide-react';
import { useApp } from '../context/AppContext';

const tabs = [
  { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/food', icon: UtensilsCrossed, label: 'Food Log' },
  { path: '/activity', icon: Dumbbell, label: 'Activity' },
  { path: '/coach', icon: MessageCircle, label: 'AI Coach' },
  { path: '/profile', icon: User, label: 'Profile' },
];

export default function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { profile, totalCaloriesIn, targets, selectedDate } = useApp();
  const pct = Math.min(Math.round((totalCaloriesIn / targets.calories) * 100), 100);
  const today = new Date().toISOString().split('T')[0];
  const isToday = selectedDate === today;
  const dateLabel = isToday
    ? "Today's Progress"
    : new Date(selectedDate + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

  return (
    <aside className="hidden lg:flex flex-col w-64 bg-white border-r border-gray-200 h-screen sticky top-0">
      {/* Logo */}
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-brand-500 to-emerald-600 rounded-xl flex items-center justify-center">
            <Sparkles size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900">NutriTrack</h1>
            <p className="text-[10px] text-gray-400 -mt-0.5">AI-Powered Nutrition</p>
          </div>
        </div>
      </div>

      {/* Quick stats */}
      <div className="px-5 py-4 border-b border-gray-100">
        <p className="text-xs text-gray-400 mb-2">{dateLabel}</p>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-brand-500 to-emerald-500 rounded-full transition-all duration-700"
            style={{ width: `${pct}%` }} />
        </div>
        <p className="text-xs text-gray-500 mt-1.5">{totalCaloriesIn} / {targets.calories} cal</p>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {tabs.map(tab => {
          const active = location.pathname === tab.path;
          return (
            <button key={tab.path} onClick={() => navigate(tab.path)}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                active
                  ? 'bg-brand-50 text-brand-700 shadow-sm'
                  : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
              }`}>
              <tab.icon size={19} strokeWidth={active ? 2.2 : 1.7} />
              {tab.label}
            </button>
          );
        })}
      </nav>

      {/* User */}
      <div className="p-4 border-t border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-brand-100 rounded-full flex items-center justify-center text-brand-700 font-bold text-sm">
            {profile?.name?.charAt(0)?.toUpperCase() || '?'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-800 truncate">{profile?.name || 'User'}</p>
            <p className="text-[10px] text-gray-400 capitalize">{profile?.goal?.replace('_', ' ') || 'Set goal'}</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
