import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebase/config';
import { useEffect, useState } from 'react';

import Login from './components/Login';
import Dashboard from './components/Dashboard';

/**
 * A component to protect routes.
 * If the user is authenticated, it renders the child routes (Outlet).
 * Otherwise, it redirects to the /login page.
 */
const ProtectedRoute = ({ user, redirectPath = '/login' }) => {
  if (!user) {
    return <Navigate to={redirectPath} replace />;
  }

  return <Outlet />;
};

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Listen for authentication state changes
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  if (loading) {
    return <div>Cargando...</div>; // Or a spinner component
  }

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<ProtectedRoute user={user} />}>
        <Route path="/" element={<Dashboard />} />
        {/* Add other protected routes here */}
      </Route>
    </Routes>
  );
}

export default App;