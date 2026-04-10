import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';
import Sidebar from './components/Sidebar';
import BottomNav from './components/BottomNav';
import Dashboard from './pages/Dashboard';
import FoodLog from './pages/FoodLog';
import Activity from './pages/Activity';
import Coach from './pages/Coach';
import Profile from './pages/Profile';
import Onboarding from './pages/Onboarding';

function AppRoutes() {
  const { profile, loading } = useApp();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-gray-500">Loading NutriTrack AI...</p>
        </div>
      </div>
    );
  }

  if (!profile) return <Onboarding />;

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 min-h-screen pb-20 lg:pb-0 overflow-y-auto">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/food" element={<FoodLog />} />
          <Route path="/activity" element={<Activity />} />
          <Route path="/coach" element={<Coach />} />
          <Route path="/profile" element={<Profile />} />
        </Routes>
      </main>
      <BottomNav />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppProvider>
        <AppRoutes />
      </AppProvider>
    </BrowserRouter>
  );
}
