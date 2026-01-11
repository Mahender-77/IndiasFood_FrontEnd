import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

interface DeliveryProtectedRouteProps {
  children: ReactNode;
}

const DeliveryProtectedRoute = ({ children }: DeliveryProtectedRouteProps) => {
  const { user, loading, isDelivery } = useAuth();

  if (loading) {
    return <div>Loading...</div>; // Or a spinner component
  }

  if (!user || !isDelivery) {
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
};

export default DeliveryProtectedRoute;

