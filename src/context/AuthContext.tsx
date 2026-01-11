import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { auth } from '../lib/firebase';
import { User as FirebaseUser } from 'firebase/auth';
import api from '../lib/api';

interface DeliveryProfile {
  status: 'pending' | 'approved' | 'rejected';
}

interface User {
  _id: string;
  uid: string;
  username: string;
  email: string;
  role: 'user' | 'admin' | 'delivery'; // Add role field
  addresses: Address[];
  deliveryProfile?: DeliveryProfile; // Add deliveryProfile
}

interface Address {
  address: string;
  city: string;
  postalCode: string;
  country: string;
}

interface AuthContextType {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  token: string | null;
  login: (idToken: string) => void;
  logout: () => Promise<void>;
  loading: boolean;
  error: string | null;
  fetchUserProfile: () => Promise<void>;
  isAdmin: boolean;
  isDelivery: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (fUser) => {
      setFirebaseUser(fUser);
      if (fUser) {
        try {
          const idToken = await fUser.getIdToken();
          setToken(idToken);
          localStorage.setItem('firebaseIdToken', idToken);
          await fetchUserProfile();
        } catch (err) {
          console.error('Error getting Firebase ID token:', err);
          setError('Failed to get authentication token.');
          setToken(null);
          setUser(null);
          localStorage.removeItem('firebaseIdToken');
          localStorage.removeItem('authUser');
        }
      } else {
        setToken(null);
        setUser(null);
        localStorage.removeItem('firebaseIdToken');
        localStorage.removeItem('authUser');
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const login = (idToken: string) => {
    setToken(idToken);
    localStorage.setItem('firebaseIdToken', idToken);
    // User data will be fetched by fetchUserProfile which is called by onAuthStateChanged
  };


  const logout = async () => {
    setLoading(true);
    setError(null);
    try {
      await auth.signOut();
      setToken(null);
      setUser(null);
      setFirebaseUser(null);
      localStorage.removeItem('firebaseIdToken');
      localStorage.removeItem('authUser');
    } catch (err: any) {
      console.error('Failed to log out', err);
      setError(err.message || 'Failed to log out');
    } finally {
      setLoading(false);
    }
  };

  const fetchUserProfile = async () => {
    if (!firebaseUser) {
      setUser(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get(`/auth/profile`);
      setUser(data);
      localStorage.setItem('authUser', JSON.stringify(data));
    } catch (err: any) {
      console.error('Failed to fetch user profile', err);
      setError(err.response?.data?.message || 'Failed to fetch user profile');
      // If profile fetching fails, it means the backend user might not exist or token is bad
      // In this case, we should ensure local state is cleared for the user
      setToken(null);
      setUser(null);
      localStorage.removeItem('firebaseIdToken');
      localStorage.removeItem('authUser');
      await auth.signOut(); // Ensure Firebase state is also cleared
    } finally {
      setLoading(false);
    }
  };

  const isAdmin = user?.role === 'admin' || false;
  const isDelivery = user?.role === 'delivery' || false;

  return (
    <AuthContext.Provider value={{ user, firebaseUser, token, login, logout, loading, error, fetchUserProfile, isAdmin, isDelivery }}>
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
