import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { api } from '@/lib/api';

interface SystemConfigContextType {
  isInitialized: boolean;
  isLoading: boolean;
  error: string | null;
  initializeSystem: () => Promise<boolean>;
  refetch: () => Promise<void>;
}

const SystemConfigContext = createContext<SystemConfigContextType>({
  isInitialized: false,
  isLoading: true,
  error: null,
  initializeSystem: async () => false,
  refetch: async () => {},
});

export const useSystemConfig = () => {
  const context = useContext(SystemConfigContext);
  if (!context) {
    throw new Error('useSystemConfig must be used within a SystemConfigProvider');
  }
  return context;
};

interface SystemConfigProviderProps {
  children: ReactNode;
}

export const SystemConfigProvider = ({ children }: SystemConfigProviderProps) => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const checkInitialized = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const data = await api.get<{ initialized: boolean }>('/system/initialized');
      setIsInitialized(data.initialized === true);
    } catch (err) {
      console.error('System config check error:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      setIsInitialized(false);
    } finally {
      setIsLoading(false);
    }
  };

  const initializeSystem = async (): Promise<boolean> => {
    try {
      setError(null);

      const data = await api.post<{ success: boolean }>('/system/initialize');

      if (data.success) {
        setIsInitialized(true);
        return true;
      }

      // Already initialized
      setIsInitialized(true);
      return true;
    } catch (err) {
      console.error('System initialization error:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      return false;
    }
  };

  const refetch = async () => {
    await checkInitialized();
  };

  useEffect(() => {
    checkInitialized();
  }, []);

  return (
    <SystemConfigContext.Provider value={{
      isInitialized,
      isLoading,
      error,
      initializeSystem,
      refetch
    }}>
      {children}
    </SystemConfigContext.Provider>
  );
};
