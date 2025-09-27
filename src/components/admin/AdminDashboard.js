import { useState, useEffect } from 'react';
import { db } from '../../config';
import { collection, onSnapshot } from 'firebase/firestore';

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

  useEffect(() => {
    // Cargar la lista de usuarios una sola vez para todo el panel de admin
    const usersUnsubscribe = onSnapshot(collection(db, "users"), (snapshot) => {
      const usersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setUsers(usersData);
    }, (error) => {
      console.error("Error al obtener la lista de usuarios para el admin:", error);
    });

    // Cargar la lista de sitios una sola vez para todo el panel de admin
    const sitesUnsubscribe = onSnapshot(collection(db, "sites"), (snapshot) => {
      const sitesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setSites(sitesData);
    }, (error) => {
      console.error("Error al obtener la lista de sitios para el admin:", error);
    });

    return () => {
      usersUnsubscribe();
      sitesUnsubscribe();
    };
  }, []);

  const renderSection = () => {
    switch (activeSection) {
      case 'usuarios':
        return <UserManagement users={users} sites={sites} />;
      case 'webs':
        return <WebManagement users={users} />;
      case 'tickets':
        return <TicketManagement />;
      case 'metricas':
        return <Metrics />;
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