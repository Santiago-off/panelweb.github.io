import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, updateDoc, doc, setDoc } from 'firebase/firestore';
import { db, mockData, checkFirebaseConnection } from '../../config';
import './UserDashboard.css'; // Importa los estilos del panel de usuario
import { useUserData } from '../../hooks/useUserData';
import CreateTicketModal from './CreateTicketModal';

const SiteCard = ({ site, onManage, onCreateTicket }) => (
  <div className="site-card">
    <div className="site-card-header">
      <h4>{site.name}</h4>
      <span className={`status-indicator status-${site.status || 'offline'}`}></span>
    </div>
    <p className="site-card-domain">{site.domain}</p>
    <div className="site-details">
      <div className="site-info-row">
        <span className="site-info-label">Servidor:</span>
        <span className="site-info-value">{site.server || 'No asignado'}</span>
      </div>
      <div className="site-info-row">
        <span className="site-info-label">Plan:</span>
        <span className="site-info-value">{site.plan || 'Básico'}</span>
      </div>
      <div className="site-info-row">
        <span className="site-info-label">Espacio:</span>
        <span className="site-info-value">{site.diskUsage || '0'} / {site.diskQuota || '1GB'}</span>
      </div>
    </div>
    <div className="site-card-footer">
      <span className={`tag tag-${site.status === 'online' ? 'success' : 'warning'}`}>{site.status}</span>
      <div className="site-actions">
        <button 
          className="button-secondary button-small" 
          onClick={() => onManage(site)}
        >
          Gestionar
        </button>
        <button 
          className="button-outline button-small" 
          onClick={() => onCreateTicket(site)}
        >
          Soporte
        </button>
      </div>
    </div>
  </div>
);

const UserDashboard = () => {
  const { userData } = useUserData();
  const [assignedSites, setAssignedSites] = useState([]);
  
  const [loading, setLoading] = useState(true);
  
  const [isCreateTicketModalOpen, setCreateTicketModalOpen] = useState(false);
  const [selectedSite, setSelectedSite] = useState(null);
  const [isManageSiteModalOpen, setManageSiteModalOpen] = useState(false);
  const [toggling, setToggling] = useState(false);

  const handleToggleMaintenance = async () => {
    if (!selectedSite?.id) return;
    setToggling(true);
    try {
      const nextStatus = selectedSite.status === 'maintenance' ? 'online' : 'maintenance';
      await updateDoc(doc(db, 'sites', selectedSite.id), { status: nextStatus });
      await setDoc(doc(db, 'publicSites', selectedSite.id), { status: nextStatus }, { merge: true });
      const updated = { ...selectedSite, status: nextStatus };
      setSelectedSite(updated);
      setAssignedSites(prev => prev.map(s => s.id === updated.id ? updated : s));
    } catch (e) {
      console.error('No se pudo cambiar el estado de mantenimiento', e);
    } finally {
      setToggling(false);
    }
  };

  useEffect(() => {
    if (!userData?.uid) {
      setLoading(false);
      return;
    };

    // Verificar si hay conexión a Firebase
    if (!checkFirebaseConnection()) {
      console.log("Usando datos simulados para sitios debido a problemas de conexión");
      // Filtrar sitios simulados asignados al usuario actual
      const filteredSites = mockData.sites || [
        {
          id: 'site1',
          name: 'Mi Sitio Web',
          domain: 'misitio.com',
          status: 'online',
          server: 'Servidor 1',
          plan: 'Premium',
          diskUsage: '500MB',
          diskQuota: '1GB',
          assignedUsers: [userData?.uid || 'user1']
        },
        {
          id: 'site2',
          name: 'Mi Tienda Online',
          domain: 'mitienda.com',
          status: 'online',
          server: 'Servidor 2',
          plan: 'Empresarial',
          diskUsage: '1.2GB',
          diskQuota: '2GB',
          assignedUsers: [userData?.uid || 'user1']
        }
      ];
      setAssignedSites(filteredSites);
      setLoading(false);
      return;
    }

    // Consulta para obtener los sitios asignados al usuario
    const sitesRef = collection(db, 'sites');
    // Simplificamos la consulta para asegurar que funcione correctamente
    const q = query(
      sitesRef,
      where('assignedUsers', 'array-contains', userData.uid)
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
  }, [userData]);

  const handleManageSite = (site) => {
    setSelectedSite(site);
    setManageSiteModalOpen(true);
  };

  const handleCreateTicket = (site) => {
    setSelectedSite(site);
    setCreateTicketModalOpen(true);
  };

  // Modal de gestión de sitios
  const ManageSiteModal = () => {
    if (!isManageSiteModalOpen || !selectedSite) return null;
    
    return (
      <div className="modal-overlay">
        <div className="modal-container">
          <div className="modal-header">
            <h3>Gestionar {selectedSite.name}</h3>
            <button className="modal-close-button" onClick={() => setManageSiteModalOpen(false)}>
              &times;
            </button>
          </div>
          <div className="modal-body">
            <div className="server-info-section">
              <h4>Información del Servidor</h4>
              <div className="info-grid">
                <div className="info-item">
                  <span className="info-label">Servidor</span>
                  <span className="info-value">{selectedSite.server || 'No asignado'}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">IP</span>
                  <span className="info-value">{selectedSite.ip || 'No disponible'}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Estado</span>
                  <span className={`status-badge status-${selectedSite.status === 'online' ? 'online' : 'offline'}`}>
                    {selectedSite.status || 'Offline'}
                  </span>
                </div>
                <div className="info-item">
                  <span className="info-label">Plan</span>
                  <span className="info-value">{selectedSite.plan || 'Básico'}</span>
                </div>
              </div>
            </div>
            
            <div className="resource-usage-section">
              <h4>Uso de Recursos</h4>
              <div className="resource-bars">
                <div className="resource-item">
                  <div className="resource-header">
                    <span>Espacio en Disco</span>
                    <span>{selectedSite.diskUsage || '0'} / {selectedSite.diskQuota || '1GB'}</span>
                  </div>
                  <div className="progress-bar">
                    <div 
                      className="progress-fill" 
                      style={{ 
                        width: `${Math.min(
                          parseInt(selectedSite.diskUsage || '0') / 
                          parseInt(selectedSite.diskQuota || '1') * 100, 100
                        )}%` 
                      }}
                    ></div>
                  </div>
                </div>
                
                <div className="resource-item">
                  <div className="resource-header">
                    <span>Ancho de Banda</span>
                    <span>{selectedSite.bandwidthUsage || '0'} / {selectedSite.bandwidthQuota || '10GB'}</span>
                  </div>
                  <div className="progress-bar">
                    <div 
                      className="progress-fill" 
                      style={{ 
                        width: `${Math.min(
                          parseInt(selectedSite.bandwidthUsage || '0') / 
                          parseInt(selectedSite.bandwidthQuota || '10') * 100, 100
                        )}%` 
                      }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="site-actions-section">
              <h4>Acciones</h4>
              <div className="action-buttons">
                <button className="button-secondary" onClick={handleToggleMaintenance} disabled={toggling}>
                  {selectedSite.status === 'maintenance' ? 'Desactivar Mantenimiento' : 'Activar Mantenimiento'}
                </button>
                <button className="button-primary">
                  Panel de Control
                </button>
                <button className="button-secondary">
                  Reiniciar Servidor
                </button>
                <button className="button-outline">
                  Cambiar Plan
                </button>
                <button 
                  className="button-danger"
                  onClick={() => handleCreateTicket(selectedSite)}
                >
                  Reportar Problema
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

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
        <div className="loading-indicator">
          <div className="spinner"></div>
          <p>Cargando tus sitios...</p>
        </div>
      ) : assignedSites.length === 0 ? (
        <div className="empty-state">
          <p>No tienes sitios web asignados actualmente.</p>
        </div>
      ) : (
        <div className="sites-grid">
          {assignedSites.map(site => (
            <SiteCard 
              key={site.id} 
              site={site} 
              onManage={handleManageSite}
              onCreateTicket={handleCreateTicket}
            />
          ))}
        </div>
      )}
      
      {/* Modal de gestión de sitios */}
      <ManageSiteModal />
      
      {/* Modal de creación de tickets */}
      <CreateTicketModal 
        isOpen={isCreateTicketModalOpen}
        onClose={() => setCreateTicketModalOpen(false)}
        selectedSite={selectedSite}
      />


    </div>
  );
};

export default UserDashboard;
