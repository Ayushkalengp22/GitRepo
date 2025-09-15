import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Types
interface User {
  id: string;
  email: string;
  role: {
    id: string;
    name: string;
  };
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (token: string, userData: User) => Promise<void>;
  logout: () => Promise<void>;
}

// Create Context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Auth Provider Component
interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({children}) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check if user is already logged in on app start
  useEffect(() => {
    checkAuthState();
  }, []);

  const checkAuthState = async () => {
    try {
      console.log('🔍 Checking authentication state...');

      const storedToken = await AsyncStorage.getItem('userToken');
      const storedUser = await AsyncStorage.getItem('userData');

      if (storedToken && storedUser) {
        console.log('✅ Found stored authentication data');
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      } else {
        console.log('❌ No stored authentication data found');
      }
    } catch (error) {
      console.log('❌ Error checking auth state:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (authToken: string, userData: User) => {
    try {
      console.log('💾 Storing authentication data...');

      // Store in AsyncStorage
      await AsyncStorage.setItem('userToken', authToken);
      await AsyncStorage.setItem('userData', JSON.stringify(userData));

      // Update state
      setToken(authToken);
      setUser(userData);

      console.log('✅ Authentication data stored successfully');
      console.log('👤 User:', userData.email);
      console.log('🔑 Token stored');
    } catch (error) {
      console.log('❌ Error storing auth data:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      console.log('🚪 Logging out user...');

      // Remove from AsyncStorage
      await AsyncStorage.multiRemove(['userToken', 'userData']);

      // Clear state
      setToken(null);
      setUser(null);

      console.log('✅ User logged out successfully');
    } catch (error) {
      console.log('❌ Error during logout:', error);
    }
  };

  const contextValue: AuthContextType = {
    user,
    token,
    isLoading,
    isAuthenticated: !!token && !!user,
    login,
    logout,
  };

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
};

// Custom hook to use auth context
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
};
