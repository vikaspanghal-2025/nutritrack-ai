import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

interface GoogleUser {
  email: string;
  name: string;
  picture: string;
  sub: string; // Google user ID
}

interface AuthState {
  user: GoogleUser | null;
  loading: boolean;
  userId: string;
  signOut: () => void;
}

const AuthContext = createContext<AuthState>({} as AuthState);

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

function parseJwt(token: string): any {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(atob(base64));
  } catch { return null; }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<GoogleUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Check for saved session
  useEffect(() => {
    const saved = localStorage.getItem('nutritrack_google_user');
    if (saved) {
      try {
        setUser(JSON.parse(saved));
      } catch { localStorage.removeItem('nutritrack_google_user'); }
    }
    setLoading(false);
  }, []);

  // Load Google Identity Services script
  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) { setLoading(false); return; }

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => {
      (window as any).google?.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: handleCredentialResponse,
        auto_select: true,
      });

      // If no saved user, render the button (will be picked up by LoginPage)
      if (!localStorage.getItem('nutritrack_google_user')) {
        setTimeout(() => {
          const btnEl = document.getElementById('google-signin-btn');
          if (btnEl) {
            (window as any).google?.accounts.id.renderButton(btnEl, {
              theme: 'outline',
              size: 'large',
              width: 300,
              text: 'signin_with',
              shape: 'pill',
            });
          }
        }, 100);
      }
      setLoading(false);
    };
    document.head.appendChild(script);

    return () => { script.remove(); };
  }, []);

  function handleCredentialResponse(response: any) {
    const payload = parseJwt(response.credential);
    if (payload) {
      const googleUser: GoogleUser = {
        email: payload.email,
        name: payload.name,
        picture: payload.picture,
        sub: payload.sub,
      };
      setUser(googleUser);
      localStorage.setItem('nutritrack_google_user', JSON.stringify(googleUser));
      // Use email as the stable user ID
      localStorage.setItem('nutritrack_user_id', payload.email);
    }
  }

  // Expose globally so Google callback can find it
  useEffect(() => {
    (window as any).__nutritrack_handleCredential = handleCredentialResponse;
  }, []);

  const signOut = useCallback(() => {
    setUser(null);
    localStorage.removeItem('nutritrack_google_user');
    localStorage.removeItem('nutritrack_user_id');
    localStorage.removeItem('nutritrack_profile');
    (window as any).google?.accounts.id.disableAutoSelect();
    window.location.reload();
  }, []);

  const userId = user?.email || localStorage.getItem('nutritrack_user_id') || '';

  return (
    <AuthContext.Provider value={{ user, loading, userId, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
export { GOOGLE_CLIENT_ID };
