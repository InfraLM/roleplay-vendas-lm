import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSystemConfig } from '@/hooks/useSystemConfig';
import { Skeleton } from '@/components/ui/skeleton';

interface RemixGateProps {
  children: React.ReactNode;
}

// Routes that don't require system initialization
const PUBLIC_ROUTES = ['/', '/setup', '/auth', '/reset-password'];

const RemixGate = ({ children }: RemixGateProps) => {
  const { isInitialized, isLoading } = useSystemConfig();
  const navigate = useNavigate();
  const location = useLocation();

  const isPublicRoute = PUBLIC_ROUTES.includes(location.pathname);

  useEffect(() => {
    if (!isLoading && !isInitialized && !isPublicRoute) {
      // System not initialized, redirect to setup
      navigate('/setup', { replace: true });
    }
  }, [isInitialized, isLoading, isPublicRoute, navigate]);

  // Show loading while checking system status
  if (isLoading) {
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

  // If not initialized and not on a public route, redirect handled by useEffect
  if (!isInitialized && !isPublicRoute) {
    return null;
  }

  return <>{children}</>;
};

export default RemixGate;
