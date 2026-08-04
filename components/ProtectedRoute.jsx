import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="spinner-overlay" style={{ minHeight: '100vh' }}>
        <div className="spinner"></div>
        <p className="spinner-text">Loading...</p>
      </div>
    );
  }

  if (!user) {
    // The user requested that if someone tries to enter without an account, they must "Sign in first" 
    // (which in their terminology means Sign Up / register).
    return <Navigate to="/signup" replace />;
  }

  return children;
}
