import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Skeleton } from '@/components/ui/skeleton';

interface ProtectedRouteProps {
  children: React.ReactNode;
  redirectTo?: string;
  requiredRole?: 'admin' | 'coach' | 'vendedor' | 'closer' | 'sdr';
  skipOrgCheck?: boolean; // kept for compatibility
}

const ProtectedRoute = ({ children, redirectTo = '/auth', requiredRole, skipOrgCheck = false }: ProtectedRouteProps) => {
  const { user, profile, role, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!loading && !user) {
      navigate(redirectTo);
    }
  }, [user, loading, navigate, redirectTo]);

  // Redirect users without organization to dashboard (org is auto-assigned on signup)
  useEffect(() => {
    if (!loading && user && profile && !profile.organizationId && !skipOrgCheck) {
      navigate('/auth');
    }
  }, [user, profile, loading, navigate, skipOrgCheck]);

  useEffect(() => {
    if (!loading && user && requiredRole && role !== requiredRole && role !== 'admin') {
      navigate('/dashboard');
    }
  }, [user, role, loading, navigate, requiredRole]);

  // Wait for auth to load, but add a timeout for missing profiles
  const [profileTimeout, setProfileTimeout] = useState(false);

  useEffect(() => {
    if (user && !profile && !loading) {
      const timer = setTimeout(() => setProfileTimeout(true), 3000);
      return () => clearTimeout(timer);
    }
  }, [user, profile, loading]);

  if (loading || (user && !profile && !profileTimeout)) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-md space-y-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-8 w-3/4" />
        </div>
      </div>
    );
  }

  if (!user) return null;

  return <>{children}</>;
};

export default ProtectedRoute;
