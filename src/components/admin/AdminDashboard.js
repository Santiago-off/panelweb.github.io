import { useState, useEffect } from 'react';
import { onSnapshot, collection } from 'firebase/firestore';
import { db } from '../../config';

// Importa los nuevos componentes de las secciones
import UserManagement from './UserManagement';
import WebManagement from './WebManagement';
import TicketManagement from './TicketManagement';
import Metrics from './Metrics';
import Logs from './Logs';
import Config from './Config';

const AdminDashboard = () => {
  const [activeSection, setActiveSection] = useState('usuarios');
  const [users, setUsers] = useState([]);
  const [sites, setSites] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Cargar la lista de usuarios y sitios para todo el panel de admin
    const usersUnsubscribe = onSnapshot(collection(db, "users"), (snapshot) => {
      const usersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setUsers(usersData);
      setLoading(false);
    }, (error) => {
      console.error("Error al obtener la lista de usuarios:", error);
      setLoading(false);
    });

    const sitesUnsubscribe = onSnapshot(collection(db, "sites"), (snapshot) => {
      const sitesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setSites(sitesData);
    }, (error) => {
      console.error("Error al obtener la lista de sitios:", error);
    });

    return () => {
      usersUnsubscribe();
      sitesUnsubscribe();
    };
  }, []);

  const renderSection = () => {
    if (loading) {
      return <div>Cargando datos...</div>;
    }

    switch (activeSection) {
      case 'usuarios':
        return <UserManagement users={users} sites={sites} />;
      case 'webs':
        return <WebManagement users={users} sites={sites} />;
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
    { id: 'usuarios', label: 'Usuarios' },
    { id: 'webs', label: 'Webs' },
    { id: 'tickets', label: 'Tickets' },
    { id: 'metricas', label: 'Métricas' },
    { id: 'logs', label: 'Logs' },
    { id: 'config', label: 'Configuración' },
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
                {/* Aquí podríamos añadir iconos en el futuro */}
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