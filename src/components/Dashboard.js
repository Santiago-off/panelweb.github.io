import { useState, useEffect } from 'react';
import { signOut } from 'firebase/auth';
import { doc, onSnapshot, collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
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

// Iconos para la interfaz
const SunIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="5"></circle>
    <line x1="12" y1="1" x2="12" y2="3"></line>
    <line x1="12" y1="21" x2="12" y2="23"></line>
    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
    <line x1="1" y1="12" x2="3" y2="12"></line>
    <line x1="21" y1="12" x2="23" y2="12"></line>
    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
  </svg>
);

const MoonIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
  </svg>
);

const BellIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
    <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
  </svg>
);

function Dashboard() {
  const navigate = useNavigate();
  const { user, userData, loading: userLoading } = useUserData();
  const [isMaintenance, setIsMaintenance] = useState(false);
  const [loadingConfig, setLoadingConfig] = useState(true);
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('theme') || 'dark';
  });
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [stats, setStats] = useState({
    activeUsers: 0,
    totalTasks: 0,
    completedTasks: 0
  });

  // Cambiar tema claro/oscuro
  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    
    if (newTheme === 'light') {
      document.body.classList.add('light-theme');
    } else {
      document.body.classList.remove('light-theme');
    }
  };

  // Aplicar tema al cargar
  useEffect(() => {
    if (theme === 'light') {
      document.body.classList.add('light-theme');
    } else {
      document.body.classList.remove('light-theme');
    }
  }, [theme]);

  const handleLogout = async () => {
    try {
      await logAdminAction('USER_LOGOUT');
      await signOut(auth);
      navigate('/login');
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
    }
  };

  // Cargar configuración del panel
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

  // Cargar notificaciones
  useEffect(() => {
    if (user && userData) {
      const fetchNotifications = async () => {
        try {
          const notificationsRef = collection(db, 'users', user.uid, 'notifications');
          const q = query(notificationsRef, orderBy('timestamp', 'desc'), limit(5));
          const querySnapshot = await getDocs(q);
          
          const notificationsData = [];
          querySnapshot.forEach((doc) => {
            notificationsData.push({
              id: doc.id,
              ...doc.data()
            });
          });
          
          setNotifications(notificationsData);
        } catch (error) {
          console.error("Error al cargar notificaciones:", error);
        }
      };
      
      fetchNotifications();
    }
  }, [user, userData]);

  // Cargar estadísticas desde Firebase
  useEffect(() => {
    if (userData?.role === 'admin' || userData?.role === 'staff') {
      const fetchStats = async () => {
        try {
          // Obtener usuarios activos
          const usersRef = collection(db, 'users');
          const usersSnapshot = await getDocs(usersRef);
          const activeUsersCount = usersSnapshot.docs.filter(doc => 
            doc.data().status === 'active' || doc.data().status === true
          ).length;
          
          // Obtener tickets/tareas
          const ticketsRef = collection(db, 'tickets');
          const ticketsSnapshot = await getDocs(ticketsRef);
          const totalTickets = ticketsSnapshot.size;
          const completedTickets = ticketsSnapshot.docs.filter(doc => 
            doc.data().status === 'completed' || doc.data().status === 'closed'
          ).length;
          
          setStats({
            activeUsers: activeUsersCount,
            totalTasks: totalTickets,
            completedTasks: completedTickets
          });
        } catch (error) {
          console.error("Error al cargar estadísticas:", error);
        }
      };
      
      fetchStats();
    }
  }, [userData]);

  if (userLoading || loadingConfig) {
    return (
      <div className="loading-fullscreen">
        <div className="spinner"></div>
        <p>Cargando panel...</p>
      </div>
    );
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
        <div className="header-left">
          <h1 className="header-title">Panel de Control</h1>
        </div>
        <div className="header-actions">
          <button 
            onClick={toggleTheme} 
            className="icon-button" 
            title={theme === 'dark' ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro'}
          >
            {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
          </button>
          
          <div className="notifications-dropdown">
            <button 
              onClick={() => setShowNotifications(!showNotifications)} 
              className="icon-button notification-button"
              title="Notificaciones"
            >
              <BellIcon />
              {notifications.length > 0 && (
                <span className="notification-badge">{notifications.length}</span>
              )}
            </button>
            
            {showNotifications && (
              <div className="notifications-panel">
                <h3>Notificaciones</h3>
                {notifications.length > 0 ? (
                  <ul className="notifications-list">
                    {notifications.map(notification => (
                      <li key={notification.id} className="notification-item">
                        <div className="notification-content">
                          <p className="notification-message">{notification.message}</p>
                          <span className="notification-time">
                            {notification.timestamp?.toDate().toLocaleString() || 'Fecha desconocida'}
                          </span>
                        </div>
                        {!notification.read && <span className="unread-indicator"></span>}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="no-notifications">No tienes notificaciones nuevas</p>
                )}
                <button className="view-all-button">Ver todas</button>
              </div>
            )}
          </div>
          
          <div className="user-info">
            <span>Bienvenido, <strong>{userData?.displayName || user?.email}</strong></span>
            <span className="user-role-badge badge badge-primary">{userData?.role}</span>
          </div>
          
          <button onClick={handleLogout} className="button-secondary logout-button">
            Cerrar Sesión
          </button>
        </div>
      </header>
      
      {(userData?.role === 'admin' || userData?.role === 'staff') && (
        <div className="stats-container">
          <div className="stat-card">
            <h3>Usuarios Activos</h3>
            <p className="stat-value">{stats.activeUsers}</p>
          </div>
          <div className="stat-card">
            <h3>Tareas Totales</h3>
            <p className="stat-value">{stats.totalTasks}</p>
          </div>
          <div className="stat-card">
            <h3>Tareas Completadas</h3>
            <p className="stat-value">{stats.completedTasks}</p>
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{width: `${(stats.completedTasks / stats.totalTasks) * 100}%`}}
              ></div>
            </div>
          </div>
        </div>
      )}
      
      <main className="dashboard-content">
        {/* Renderizado condicional basado en el rol */}
        <div className="dashboard-card">
          {userData?.role === 'admin' && <AdminDashboard />}
          {userData?.role === 'staff' && <StaffDashboard />}
          {userData?.role === 'usuario' && <UserDashboard />}
        </div>
      </main>
      
      <footer className="dashboard-footer">
        <p>&copy; {new Date().getFullYear()} Panel Web Pro. Todos los derechos reservados.</p>
      </footer>
    </div>
  );
}

export default Dashboard;