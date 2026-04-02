import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { api } from '@/lib/api';

type UserRole = 'admin' | 'coach' | 'vendedor' | 'closer' | 'sdr';

interface Profile {
  id: string;
  userId: string;
  organizationId: string | null;
  name: string;
  email: string;
  team: string | null;
  phone: string | null;
  hireDate: string | null;
  specialties: string[] | null;
  notes: string | null;
  status: string | null;
  onboardingCompleted: boolean | null;
  visitedPages: unknown | null;
  createdAt: string;
  updatedAt: string;
}

interface AuthUser {
  id: string;
  email: string;
}

interface AuthContextType {
  user: AuthUser | null;
  session: { accessToken: string } | null;
  profile: Profile | null;
  role: UserRole | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  profile: null,
  role: null,
  loading: true,
  signOut: async () => {},
  refreshUser: async () => {},
});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [session, setSession] = useState<{ accessToken: string } | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);

  const loadUser = async () => {
    if (!api.isAuthenticated()) {
      setLoading(false);
      return;
    }

    try {
      const data = await api.get<{
        id: string;
        email: string;
        profile: Profile | null;
        role: UserRole;
        organizationId: string | null;
      }>('/auth/me');

      setUser({ id: data.id, email: data.email });
      setSession({ accessToken: api.getAccessToken()! });
      setProfile(data.profile);
      setRole(data.role);
    } catch {
      api.clearTokens();
      setUser(null);
      setSession(null);
      setProfile(null);
      setRole(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUser();
  }, []);

  const signOut = async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // Ignore errors on logout
    } finally {
      api.clearTokens();
      setUser(null);
      setSession(null);
      setProfile(null);
      setRole(null);
    }
  };

  const refreshUser = async () => {
    await loadUser();
  };

  return (
    <AuthContext.Provider value={{ user, session, profile, role, loading, signOut, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};
