import { useState, useEffect } from 'react';
import { signOut } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../config';
import { useUserData } from '../hooks/useUserData';
import { logAdminAction } from '../utils/logs';

// Importa los componentes principales de los roles
import AdminDashboard from './admin/AdminDashboard';
import StaffDashboard from './staff/StaffDashboard';
import UserDashboard from './user/UserDashboard';

// Importa los estilos para este componente
import './Dashboard.css';

// Importa los componentes de estado de la cuenta
import AccountDisabled from './AccountDisabled';
import FirstLogin from './FirstLogin';
import MaintenancePage from './MaintenancePage';
import BlockedPage from './BlockedPage';

function Dashboard() {
  const navigate = useNavigate();
  const { user, userData, loading: userLoading } = useUserData();
  const [isMaintenance, setIsMaintenance] = useState(false);
  const [loadingConfig, setLoadingConfig] = useState(true);

  const handleLogout = async () => {
    try {
      await logAdminAction('USER_LOGOUT');
      await signOut(auth);
      navigate('/login');
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
    }
  };

  useEffect(() => {
    const configRef = doc(db, 'panelConfig', 'main');
    const unsubscribe = onSnapshot(configRef, (docSnap) => {
      if (docSnap.exists() && docSnap.data().maintenanceMode === true) {
        setIsMaintenance(true);
      } else {
        setIsMaintenance(false);
      }
      setLoadingConfig(false);
    });
    return () => unsubscribe();
  }, []);

  if (userLoading || loadingConfig) {
    return <div className="loading-fullscreen">Cargando panel...</div>;
  }

  // El flujo de renderizado condicional ahora es mucho más claro
  if (isMaintenance && userData?.role !== 'admin') {
    return <MaintenancePage />;
  }

  if (user && !userData) {
    return <FirstLogin user={user} />;
  }

  if (userData?.accessStatus === 'blocked') {
    return <BlockedPage userData={userData} />;
  }

  if (userData?.status === 'disabled') {
    return <AccountDisabled userData={userData} />;
  }

  // Renderizado del dashboard principal
  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <h1 className="header-title">Panel de Control</h1>
        <div className="header-actions">
          <span>Bienvenido, <strong>{userData?.displayName || user?.email}</strong></span>
          <span className="user-role-tag">{userData?.role}</span>
          <button onClick={handleLogout} className="button-secondary">
            Cerrar Sesión
          </button>
        </div>
      </header>
      <main className="dashboard-content">
        {/* Renderizado condicional basado en el rol */}
        {userData?.role === 'admin' && <AdminDashboard />}
        {userData?.role === 'staff' && <StaffDashboard />}
        {userData?.role === 'usuario' && <UserDashboard />}
      </main>
    </div>
  );
}

export default Dashboard;