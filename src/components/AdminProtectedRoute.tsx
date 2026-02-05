
import { useAuth } from '@/contexts/AuthContext';
import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';


interface AdminProtectedRouteProps {
  children: ReactNode;
}

const AdminProtectedRoute = ({ children }: AdminProtectedRouteProps) => {
  const { user, loading, isAdmin } = useAuth();

  if (loading) {
    return <div>Loading...</div>; // Or a spinner component
  }

  if (!user || !isAdmin) {
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
};

export default AdminProtectedRoute;
