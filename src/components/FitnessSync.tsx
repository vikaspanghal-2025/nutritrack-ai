import { useState, useEffect } from 'react';
import { Smartphone, RefreshCw, Check, Copy, CheckCheck, ExternalLink, Heart, ChevronDown, ChevronUp } from 'lucide-react';
import { useApp } from '../context/AppContext';

const API_URL = import.meta.env.VITE_API_URL || '';

export default function FitnessSync() {
  const { refresh } = useApp();
  const [appleSetup, setAppleSetup] = useState(false);
  const [syncToken, setSyncToken] = useState('');
  const [copied, setCopied] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<string | null>(localStorage.getItem('nutritrack_last_health_sync'));
  const [showSteps, setShowSteps] = useState(false);

  useEffect(() => {
    // Get sync token for this user
    const userId = localStorage.getItem('nutritrack_user_id');
    if (userId) setSyncToken(userId);
  }, []);

  const apiEndpoint = `${API_URL}/api/health-sync`;

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function testSync() {
    setSyncing(true);
    try {
      const res = await fetch(apiEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-User-Id': syncToken },
        body: JSON.stringify({
          syncToken,
          steps: 8500,
          activeCalories: 320,
          activities: [
            { type: 'Walking', duration: 45, calories: 180, startDate: new Date().toISOString() },
            { type: 'Yoga', duration: 30, calories: 140, startDate: new Date().toISOString() },
          ],
        }),
      });
      if (res.ok) {
        const now = new Date().toLocaleString();
        setLastSync(now);
        localStorage.setItem('nutritrack_last_health_sync', now);
        refresh();
      }
    } catch (e) {
      console.error('Sync test failed:', e);
    } finally {
      setSyncing(false);
    }
  }

  // The Shortcut instructions — this is what the user builds in Apple Shortcuts
  const shortcutJSON = `{
  "syncToken": "${syncToken}",
  "steps": <Steps from Find Health Samples>,
  "activeCalories": <Active Energy from Find Health Samples>,
  "activities": [
    {
      "type": "<Workout Type>",
      "duration": <Duration in minutes>,
      "calories": <Active Calories>,
      "startDate": "<Start Date>"
    }
  ]
}`;

  return (
    <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
      <h2 className="text-sm font-semibold text-gray-800 flex items-center gap-2 mb-4">
        <Smartphone size={16} /> Fitness App Sync
      </h2>

      {/* Apple Health — primary integration */}
      <div className="border border-gray-200 rounded-xl overflow-hidden">
        <button onClick={() => setAppleSetup(!appleSetup)}
          className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center">
              <Heart size={20} className="text-red-500" />
            </div>
            <div className="text-left">
              <p className="text-sm font-medium text-gray-800">Apple Health</p>
              <p className="text-xs text-gray-400">
                {lastSync ? `Last synced: ${lastSync}` : 'Steps, workouts, active calories'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {lastSync && <span className="w-2 h-2 bg-green-400 rounded-full" />}
            {appleSetup ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
          </div>
        </button>

        {appleSetup && (
          <div className="border-t border-gray-100 p-4 space-y-4 bg-gray-50">
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800">
              <p className="font-medium mb-1">Why a Shortcut?</p>
              <p>Apple HealthKit is iOS-native only — no web API exists. An iOS Shortcut reads your health data on-device and sends it to NutriTrack securely. This is the official Apple-recommended approach for web apps.</p>
            </div>

            <button onClick={() => setShowSteps(!showSteps)}
              className="w-full text-left text-sm font-medium text-brand-600 flex items-center gap-1">
              {showSteps ? 'Hide' : 'Show'} setup instructions
              {showSteps ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>

            {showSteps && (
              <div className="space-y-3 text-xs text-gray-600">
                <div className="bg-white rounded-lg p-3 border border-gray-200">
                  <p className="font-semibold text-gray-800 mb-2">Create an iOS Shortcut (one-time setup, ~3 min):</p>
                  <ol className="space-y-2 list-decimal list-inside">
                    <li>Open the <span className="font-medium">Shortcuts</span> app on your iPhone</li>
                    <li>Tap <span className="font-medium">+</span> to create a new Shortcut</li>
                    <li>Add action: <span className="font-medium text-brand-700">Find Health Samples</span> → Type: <span className="font-medium">Active Energy</span> → Start Date: Today → Sort by: Start Date</li>
                    <li>Add action: <span className="font-medium text-brand-700">Find Health Samples</span> → Type: <span className="font-medium">Steps</span> → Start Date: Today</li>
                    <li>Add action: <span className="font-medium text-brand-700">Find Health Samples</span> → Type: <span className="font-medium">Workouts</span> → Start Date: Today</li>
                    <li>Add action: <span className="font-medium text-brand-700">Get Contents of URL</span>
                      <div className="ml-4 mt-1 space-y-1">
                        <p>URL: <code className="bg-gray-100 px-1 rounded text-[10px] break-all">{apiEndpoint}</code></p>
                        <p>Method: <span className="font-medium">POST</span></p>
                        <p>Headers: <code className="bg-gray-100 px-1 rounded text-[10px]">Content-Type: application/json</code></p>
                        <p>Body: JSON with your sync token and health data (see below)</p>
                      </div>
                    </li>
                    <li>Optional: Add to <span className="font-medium">Automation</span> → Time of Day → run daily at 10 PM</li>
                  </ol>
                </div>

                <div className="bg-white rounded-lg p-3 border border-gray-200">
                  <div className="flex justify-between items-center mb-2">
                    <p className="font-semibold text-gray-800">Your Sync Token & API Endpoint:</p>
                  </div>
                  <div className="space-y-2">
                    <div>
                      <p className="text-[10px] text-gray-400 mb-1">API Endpoint:</p>
                      <div className="flex items-center gap-2">
                        <code className="flex-1 bg-gray-100 px-2 py-1.5 rounded text-[10px] break-all font-mono">{apiEndpoint}</code>
                        <button onClick={() => copyToClipboard(apiEndpoint)}
                          className="shrink-0 p-1.5 rounded-lg bg-brand-50 text-brand-600 hover:bg-brand-100">
                          {copied ? <CheckCheck size={14} /> : <Copy size={14} />}
                        </button>
                      </div>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-400 mb-1">Sync Token (your user ID):</p>
                      <div className="flex items-center gap-2">
                        <code className="flex-1 bg-gray-100 px-2 py-1.5 rounded text-[10px] break-all font-mono">{syncToken}</code>
                        <button onClick={() => copyToClipboard(syncToken)}
                          className="shrink-0 p-1.5 rounded-lg bg-brand-50 text-brand-600 hover:bg-brand-100">
                          {copied ? <CheckCheck size={14} /> : <Copy size={14} />}
                        </button>
                      </div>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-400 mb-1">JSON Body Template:</p>
                      <pre className="bg-gray-100 px-2 py-1.5 rounded text-[10px] overflow-x-auto font-mono whitespace-pre">{shortcutJSON}</pre>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <button onClick={testSync} disabled={syncing}
                className="flex-1 bg-brand-600 text-white py-2.5 rounded-xl text-xs font-medium hover:bg-brand-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50">
                {syncing ? <RefreshCw size={14} className="animate-spin" /> : <RefreshCw size={14} />}
                {syncing ? 'Syncing...' : 'Test Sync (Demo Data)'}
              </button>
            </div>
            {lastSync && (
              <p className="text-[10px] text-green-600 flex items-center gap-1">
                <Check size={12} /> Last synced: {lastSync}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Other providers */}
      <div className="mt-3 space-y-2">
        {[
          { name: 'Strava', icon: '🏃', desc: 'Running, cycling, swimming', note: 'OAuth integration (coming soon)' },
          { name: 'Google Fit', icon: '❤️', desc: 'Steps, heart rate, workouts', note: 'OAuth integration (coming soon)' },
          { name: 'Fitbit', icon: '⌚', desc: 'Activity, sleep, heart rate', note: 'OAuth integration (coming soon)' },
        ].map(p => (
          <div key={p.name} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl opacity-75">
            <div className="flex items-center gap-3">
              <span className="text-lg">{p.icon}</span>
              <div>
                <p className="text-sm font-medium text-gray-700">{p.name}</p>
                <p className="text-[10px] text-gray-400">{p.note}</p>
              </div>
            </div>
            <span className="text-[10px] text-gray-400 bg-gray-200 px-2 py-1 rounded-full">Soon</span>
          </div>
        ))}
      </div>
    </div>
  );
}
