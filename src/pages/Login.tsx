import { useEffect } from 'react';
import { Sparkles } from 'lucide-react';
import { GOOGLE_CLIENT_ID } from '../context/AuthContext';

export default function Login() {
  useEffect(() => {
    // Re-render Google button after mount
    const timer = setTimeout(() => {
      const btnEl = document.getElementById('google-signin-btn');
      if (btnEl && (window as any).google?.accounts?.id) {
        (window as any).google.accounts.id.renderButton(btnEl, {
          theme: 'outline',
          size: 'large',
          width: 300,
          text: 'signin_with',
          shape: 'pill',
        });
      }
    }, 200);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-brand-50 via-white to-brand-50 flex items-center justify-center p-6">
      <div className="w-full max-w-sm text-center">
        <div className="w-20 h-20 bg-gradient-to-br from-brand-500 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
          <Sparkles size={36} className="text-white" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">NutriTrack AI</h1>
        <p className="text-sm text-gray-400 mb-8">Your intelligent nutrition & fitness companion</p>

        <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
          <p className="text-sm text-gray-600 mb-6">Sign in to sync your data across all your devices</p>
          
          {GOOGLE_CLIENT_ID ? (
            <div className="flex justify-center">
              <div id="google-signin-btn" />
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-xs text-amber-600 bg-amber-50 rounded-lg p-3">
                Google Sign-In not configured. Set VITE_GOOGLE_CLIENT_ID in .env
              </p>
              <button onClick={() => {
                // Dev mode: create a mock user
                const mockUser = { email: 'dev@nutritrack.local', name: 'Dev User', picture: '', sub: 'dev-123' };
                localStorage.setItem('nutritrack_google_user', JSON.stringify(mockUser));
                localStorage.setItem('nutritrack_user_id', mockUser.email);
                window.location.reload();
              }}
                className="w-full bg-brand-600 text-white py-3 rounded-xl text-sm font-medium hover:bg-brand-700">
                Continue as Dev User
              </button>
            </div>
          )}
        </div>

        <p className="text-[10px] text-gray-300 mt-6">Your health data is stored securely and never shared</p>
      </div>
    </div>
  );
}
