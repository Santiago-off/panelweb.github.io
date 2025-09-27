import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../../config';
import './UserDashboard.css'; // Importa los estilos del panel de usuario
import { useUserData } from '../../hooks/useUserData';
import CreateTicketModal from './CreateTicketModal';

const SiteCard = ({ site }) => (
  <div className="site-card">
    <div className="site-card-header">
      <h4>{site.name}</h4>
      <span className={`status-indicator status-${site.status || 'offline'}`}></span>
    </div>
    <p className="site-card-domain">{site.domain}</p>
    <div className="site-card-footer">
      <span className={`tag tag-${site.status === 'online' ? 'success' : 'warning'}`}>{site.status}</span>
      {/* Podríamos añadir un botón de "Gestionar" aquí en el futuro */}
    </div>
  </div>
);

const UserDashboard = () => {
  const { user } = useUserData();
  const [assignedSites, setAssignedSites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isCreateTicketModalOpen, setCreateTicketModalOpen] = useState(false);

  useEffect(() => {
    if (!user?.uid) {
      setLoading(false);
      return;
    };

    // Consulta para obtener los sitios asignados al usuario y que no estén inhabilitados para gestión
    const sitesRef = collection(db, 'sites');
    const q = query(
      sitesRef,
      where('assignedUsers', 'array-contains', user.uid),
      where('managementStatus', '!=', 'disabled')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const sitesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setAssignedSites(sitesData);
      setLoading(false);
    }, (error) => {
      console.error("Error al obtener los sitios del usuario:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  return (
    <div className="user-dashboard">
      <div className="section-header">
        <h2>Mis Sitios Web</h2>
        <button className="button-primary" onClick={() => setCreateTicketModalOpen(true)}>
          Crear Ticket de Soporte
        </button>
      </div>
      <p className="section-description">
        Aquí puedes ver el estado de tus sitios web y solicitar ayuda.
      </p>

      {loading ? (
        <p>Cargando sitios...</p>
      ) : assignedSites.length === 0 ? (
        <div className="placeholder-content">
          <p>Aún no tienes ningún sitio web asignado.</p>
          <p>Contacta con un administrador para que te dé acceso.</p>
        </div>
      ) : (
        <div className="sites-grid">
          {assignedSites.map(site => (
            <SiteCard key={site.id} site={site} />
          ))}
        </div>
      )}

      {isCreateTicketModalOpen && (
        <CreateTicketModal
          sites={assignedSites}
          onClose={() => setCreateTicketModalOpen(false)}
        />
      )}
    </div>
  );
};

export default UserDashboard;