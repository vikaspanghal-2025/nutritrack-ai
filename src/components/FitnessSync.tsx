import { useState } from 'react';
import { Smartphone, RefreshCw, Check, ExternalLink } from 'lucide-react';

interface FitnessProvider {
  id: string;
  name: string;
  icon: string;
  color: string;
  connected: boolean;
  description: string;
}

export default function FitnessSync() {
  const [providers, setProviders] = useState<FitnessProvider[]>([
    { id: 'strava', name: 'Strava', icon: '🏃', color: '#FC4C02', connected: false, description: 'Running, cycling, swimming' },
    { id: 'google_fit', name: 'Google Fit', icon: '❤️', color: '#4285F4', connected: false, description: 'Steps, heart rate, workouts' },
    { id: 'fitbit', name: 'Fitbit', icon: '⌚', color: '#00B0B9', connected: false, description: 'Activity, sleep, heart rate' },
    { id: 'apple_health', name: 'Apple Health', icon: '🍎', color: '#FF2D55', connected: false, description: 'Via iOS Shortcuts (see guide)' },
  ]);
  const [syncing, setSyncing] = useState<string | null>(null);
  const [showGuide, setShowGuide] = useState(false);

  function handleConnect(id: string) {
    // In production, this would initiate OAuth flow
    setSyncing(id);
    setTimeout(() => {
      setProviders(prev => prev.map(p =>
        p.id === id ? { ...p, connected: !p.connected } : p
      ));
      setSyncing(null);
    }, 1500);
  }

  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm">
      <div className="flex justify-between items-center mb-3">
        <h2 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
          <Smartphone size={16} /> Fitness App Sync
        </h2>
        <button onClick={() => setShowGuide(!showGuide)} className="text-xs text-brand-600">
          How it works
        </button>
      </div>

      {showGuide && (
        <div className="mb-3 p-3 bg-blue-50 rounded-xl text-xs text-blue-800 space-y-1">
          <p>NutriTrack syncs with fitness apps to automatically import your workouts and calories burned.</p>
          <p>• Strava, Google Fit, Fitbit: Connect via OAuth — we pull your activity data automatically.</p>
          <p>• Apple Health: Since HealthKit is iOS-native only, use our iOS Shortcut to push data to NutriTrack. <a href="#" className="underline">Download Shortcut</a></p>
          <p>• You can always log activities manually on the Activity tab.</p>
        </div>
      )}

      <div className="space-y-2">
        {providers.map(p => (
          <div key={p.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
            <div className="flex items-center gap-3">
              <span className="text-xl">{p.icon}</span>
              <div>
                <p className="text-sm font-medium text-gray-800">{p.name}</p>
                <p className="text-[10px] text-gray-500">{p.description}</p>
              </div>
            </div>
            <button onClick={() => handleConnect(p.id)}
              disabled={syncing === p.id}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1 ${
                p.connected
                  ? 'bg-green-100 text-green-700'
                  : 'bg-brand-600 text-white hover:bg-brand-700'
              }`}>
              {syncing === p.id ? (
                <RefreshCw size={12} className="animate-spin" />
              ) : p.connected ? (
                <><Check size={12} /> Connected</>
              ) : (
                'Connect'
              )}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
