import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import api from '../lib/api';

interface DeliveryProfile {
  status: 'pending' | 'approved' | 'rejected';
}

interface User {
  _id: string;
  username: string;
  email: string;
  role: 'user' | 'admin' | 'delivery' | 'delivery-pending'; // Add role field
  addresses: Address[];
  deliveryProfile?: DeliveryProfile; // Add deliveryProfile
  newsletterSubscribed?: boolean; // Add newsletterSubscribed
}

interface Address {
  address: string;
  city: string;
  postalCode: string;
  country: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (token: string) => void;
  logout: () => Promise<void>;
  loading: boolean;
  error: string | null;
  fetchUserProfile: () => Promise<void>;
  updateUser: (updates: Partial<User>) => void; // Scalable: update user without full refetch
  isAdmin: boolean;
  isDelivery: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('userToken')); // Initialize token from localStorage
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [newsletterSubscribed, setNewsletterSubscribed] = useState<boolean>(false);

  // Effect to load user profile on initial mount or when token changes
  useEffect(() => {
    const loadUser = async () => {
      if (token) {
        await fetchUserProfile();
      } else {
        setUser(null);
        setLoading(false);
      }
    };
    loadUser();
  }, [token]);

  const login = (jwtToken: string) => {
    setToken(jwtToken);
    localStorage.setItem('userToken', jwtToken);
    // User data will be fetched by the useEffect hook watching the token
  };

  const logout = async () => {
    setLoading(true);
    setError(null);
    try {
      setToken(null);
      setUser(null);
      localStorage.removeItem('userToken');
      localStorage.removeItem('authUser');
    } catch (err: any) {
      console.error('Failed to log out', err);
      setError(err.message || 'Failed to log out');
    } finally {
      setLoading(false);
    }
  };

  const fetchUserProfile = async () => {
    setLoading(true);
    setError(null);
    try {
      const storedToken = localStorage.getItem('userToken');
      if (!storedToken) {
        // If no token, no profile to fetch
        setUser(null);
        setLoading(false);
        return;
      }
      const { data } = await api.get(`/auth/profile`);
      setUser(data);
      setNewsletterSubscribed(data.newsletterSubscribed || false);
      localStorage.setItem('authUser', JSON.stringify(data));
    } catch (err: any) {
      console.error('Failed to fetch user profile', err);
      setError(err.response?.data?.message || 'Failed to fetch user profile');
      // If profile fetching fails, ensure local state is cleared
      setToken(null);
      setUser(null);
      localStorage.removeItem('userToken');
      localStorage.removeItem('authUser');
    } finally {
      setLoading(false);
    }
  };

  // Scalable: Update user object partially without full refetch
  const updateUser = (updates: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...updates };
      setUser(updatedUser);
      // Also update localStorage to keep it in sync
      localStorage.setItem('authUser', JSON.stringify(updatedUser));
      // Update newsletterSubscribed if it's in the updates
      if ('newsletterSubscribed' in updates) {
        setNewsletterSubscribed(updates.newsletterSubscribed || false);
      }
    }
  };

  const isAdmin = user?.role === 'admin' || false;
  const isDelivery = user?.role === 'delivery' || false;

  return (
    <AuthContext.Provider value={{ user, token, login, logout, loading, error, fetchUserProfile, updateUser, isAdmin, isDelivery }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};