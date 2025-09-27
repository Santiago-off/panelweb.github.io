import { useState, useEffect } from 'react';
import { auth, db } from '../config';
import { signOut } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { useUserData } from '../hooks/useUserData';
import {
  collection,
  onSnapshot,
  doc,
  serverTimestamp,
  addDoc
} from 'firebase/firestore';
import './Dashboard.css'; // Importa los estilos del Dashboard
import './AdminDashboard.css'; // Importa los estilos del Admin Dashboard

// Import refactored components
import AccountDisabled from './AccountDisabled';
import FirstLogin from './FirstLogin';
import AdminDashboard from './admin/AdminDashboard';
import UserDashboard from './user/UserDashboard';
import StaffDashboard from './user/StaffDashboard';
import MaintenancePage from './common/MaintenancePage';
import BlockedPage from './common/BlockedPage';

// --- Helper para Logs ---
const logAdminAction = async (action, details = {}) => {
  const currentUser = auth.currentUser;
  if (!currentUser) return; // No debería ocurrir si el usuario es admin

  try {
    await addDoc(collection(db, 'auditLogs'), {
      timestamp: serverTimestamp(),
      actorId: currentUser.uid,
      actorEmail: currentUser.email,
      action,
      details,
      type: 'PANEL' // Para diferenciar logs de panel de los de web
    });
  } catch (error) {
    console.error("Error al escribir en el log de auditoría:", error);
  }
};

function Dashboard() {
  const navigate = useNavigate();
  const user = auth.currentUser;
  const { userData, loading } = useUserData();
  const [isMaintenance, setIsMaintenance] = useState(false);
  const [loadingConfig, setLoadingConfig] = useState(true);

  const handleLogout = async () => {
    try {
      await logAdminAction('USER_LOGOUT');
      await signOut(auth);
      navigate('/login'); // Redirect to login after logout
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

  // Muestra un mensaje de carga mientras se obtienen los datos del usuario
  if (loading || loadingConfig) {
    return <div>Cargando panel...</div>;
  }

  // Si el modo mantenimiento está activo y el usuario no es admin, muestra la página de mantenimiento.
  if (isMaintenance && userData?.role !== 'admin') {
    return <MaintenancePage />;
  }

  // Si el usuario está autenticado pero no tiene datos (perfil), es su primer login.
  if (user && !userData) {
    return <FirstLogin user={user} />;
  }

  // Si el usuario tiene su acceso bloqueado, lo deslogueamos y mostramos un mensaje.
  if (userData?.accessStatus === 'blocked') {
    // Mostramos la página de bloqueo con la información del usuario.
    return <BlockedPage userData={userData} />;
  }

  // Si el usuario tiene perfil pero está inhabilitado, le mostramos la pantalla de token.
  if (userData?.status === 'disabled') {
    return <AccountDisabled userData={userData} />;
  }

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <h1 className="header-title">Panel de Control</h1>
        <button onClick={handleLogout} className="logout-button">
          Cerrar Sesión
        </button>
      </header>
      <main className="dashboard-content">
        <div className="welcome-message">
          {/* Saludamos usando el nombre de Firestore si existe */}
          <h1>Bienvenido, {userData?.displayName || user?.email}</h1>
          <p>Rol: <strong>{userData?.role || 'No definido'}</strong></p>
        </div>

        {/* 3. Renderizado condicional basado en el rol */}
        {userData?.role === 'admin' && <AdminDashboard />}
        {userData?.role === 'staff' && <StaffDashboard />}
        {userData?.role === 'usuario' && <UserDashboard />}
      </main>
    </div>
  );
}

export default Dashboard;