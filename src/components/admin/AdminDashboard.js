import { useState, useEffect } from 'react';
import { onSnapshot, collection } from 'firebase/firestore';
import { db, mockData, checkFirebaseConnection } from '../../config';

// Importa los nuevos componentes de las secciones
import UserManagement from './UserManagement';
import WebManagement from './WebManagement';
import TicketManagement from './TicketManagement';
import Metrics from './Metrics';
import Logs from './Logs';
import Config from './Config';

// Importa los estilos específicos para el AdminDashboard
import './AdminDashboard.css';

// --- Iconos SVG para el menú lateral ---
const Icon = ({ children }) => <span className="sidebar-icon">{children}</span>;
const UsersIcon = () => <Icon><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg></Icon>;
const WebIcon = () => <Icon><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg></Icon>;
const TicketIcon = () => <Icon><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9V7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v2M3 9l-1.35 4.06A2 2 0 0 0 3.5 16h17a2 2 0 0 0 1.85-2.94L21 9M3 9h18"></path><path d="M12 16v-4"></path><path d="M10 12h4"></path></svg></Icon>;
const MetricsIcon = () => <Icon><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20V10"></path><path d="M18 20V4"></path><path d="M6 20V16"></path></svg></Icon>;
const LogsIcon = () => <Icon><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg></Icon>;
const ConfigIcon = () => <Icon><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg></Icon>;

const AdminDashboard = () => {
  const [activeSection, setActiveSection] = useState('usuarios');
  const [users, setUsers] = useState([]);
  const [sites, setSites] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadingSites, setLoadingSites] = useState(true);

  useEffect(() => {
    // Verificar si hay conexión a Firebase
    if (!checkFirebaseConnection()) {
      console.log("Usando datos simulados debido a problemas de conexión");
      setUsers(mockData.users);
      setSites(mockData.sites);
      setLoadingUsers(false);
      setLoadingSites(false);
      return;
    }
    
    // Cargar la lista de usuarios y sitios para todo el panel de admin
    const usersUnsubscribe = onSnapshot(collection(db, "users"), (snapshot) => {
      const usersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setUsers(usersData);
      setLoadingUsers(false);
    }, (error) => {
      console.error("Error al obtener la lista de usuarios:", error);
      // Usar datos simulados en caso de error
      setUsers(mockData.users);
      setLoadingUsers(false);
    });

    const sitesUnsubscribe = onSnapshot(collection(db, "sites"), (snapshot) => {
      const sitesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setSites(sitesData);
      setLoadingSites(false);
    }, (error) => {
      console.error("Error al obtener la lista de sitios:", error);
      // Usar datos simulados en caso de error
      setSites(mockData.sites);
      setLoadingSites(false);
    });

    return () => {
      usersUnsubscribe();
      sitesUnsubscribe();
    };
  }, []);

  const renderSection = () => {
    if (loadingUsers || loadingSites) {
      return <div>Cargando datos...</div>;
    }

    switch (activeSection) {
      case 'usuarios':
        return <UserManagement users={users} sites={sites} />;
      case 'webs':
        return <WebManagement sites={sites} users={users} />;
      case 'tickets':
        return <TicketManagement users={users} />;
      case 'metricas':
        return <Metrics users={users} sites={sites} />;
      case 'logs':
        return <Logs />;
      case 'config':
        return <Config />;
      default:
        return <UserManagement users={users} sites={sites} />;
    }
  };

  const sections = [
    { id: 'usuarios', label: 'Usuarios', icon: <UsersIcon /> },
    { id: 'webs', label: 'Webs', icon: <WebIcon /> },
    { id: 'tickets', label: 'Tickets', icon: <TicketIcon /> },
    { id: 'metricas', label: 'Métricas', icon: <MetricsIcon /> },
    { id: 'logs', label: 'Logs', icon: <LogsIcon /> },
    { id: 'config', label: 'Configuración', icon: <ConfigIcon /> },
  ];

  return (
    <div className="admin-dashboard">
      <aside className="admin-sidebar">
        <nav className="admin-sidebar-nav">
          <ul>
            {sections.map((section) => (
              <li
                key={section.id}
                className={activeSection === section.id ? 'active' : ''}
                onClick={() => setActiveSection(section.id)}
              >
                {section.icon}
                {section.label}
              </li>
            ))}
          </ul>
        </nav>
      </aside>
      <main className="admin-content">
        {renderSection()}
      </main>
    </div>
  );
};

export default AdminDashboard;