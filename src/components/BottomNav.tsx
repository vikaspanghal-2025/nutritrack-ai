import { useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, UtensilsCrossed, Dumbbell, MessageCircle, User } from 'lucide-react';

const tabs = [
  { path: '/', icon: LayoutDashboard, label: 'Home' },
  { path: '/food', icon: UtensilsCrossed, label: 'Food' },
  { path: '/activity', icon: Dumbbell, label: 'Activity' },
  { path: '/coach', icon: MessageCircle, label: 'Coach' },
  { path: '/profile', icon: User, label: 'Profile' },
];

export default function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-gray-200 z-50 safe-area-bottom">
      <div className="flex justify-around py-2 px-1">
        {tabs.map(tab => {
          const active = location.pathname === tab.path;
          return (
            <button key={tab.path} onClick={() => navigate(tab.path)}
              className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg transition-colors ${active ? 'text-brand-600' : 'text-gray-400'}`}
              aria-label={tab.label}>
              <tab.icon size={21} strokeWidth={active ? 2.4 : 1.7} />
              <span className="text-[10px] font-medium">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
