import { useState, useEffect } from 'react';
import { auth, db } from '../../config';
import { collection, query, where, onSnapshot, doc, updateDoc } from 'firebase/firestore';

// Sub-componente para mostrar cada sitio web
const SiteCard = ({ site }) => {
  const [isLoading, setIsLoading] = useState(false);

  // Determina si la gestión general de la página está habilitada por un admin
  const isManagementEnabled = site.managementStatus !== 'disabled';
  // Determina si el modo mantenimiento específico está activo
  const isMaintenanceOn = site.maintenanceMode === true;

  const toggleMaintenanceMode = async () => {
    // No permitir la acción si la gestión está inhabilitada por un admin
    if (!isManagementEnabled) return;

    setIsLoading(true);
    const webRef = doc(db, 'sites', site.id);
    try {
      // Invierte el estado actual del modo mantenimiento en Firestore
      await updateDoc(webRef, {
        maintenanceMode: !isMaintenanceOn
      });
      // La UI se actualizará automáticamente gracias al listener onSnapshot
    } catch (error) {
      console.error("Error al cambiar el modo mantenimiento:", error);
      alert("Ocurrió un error al intentar cambiar el modo de mantenimiento.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    // Añade una clase 'disabled' si el admin ha inhabilitado la gestión
    <div className={`site-card ${!isManagementEnabled ? 'disabled' : ''}`}>
      <div className="site-card-header">
        <h3>{site.name}</h3>
        <span className={`user-status-tag ${isManagementEnabled ? 'status-enabled' : 'status-disabled'}`}>
          {isManagementEnabled ? 'Gestión Habilitada' : 'Gestión Inhabilitada'}
        </span>
      </div>
      <p>{site.domain}</p>

      <div className="site-card-maintenance">
        <span>Modo Mantenimiento:</span>
        <span className={`maintenance-status ${isMaintenanceOn ? 'on' : 'off'}`}>
          {isMaintenanceOn ? 'Activado' : 'Desactivado'}
        </span>
      </div>

      <div className="site-card-footer">
        <button
          className="logout-button"
          disabled={!isManagementEnabled || isLoading}
          onClick={toggleMaintenanceMode}
          title={!isManagementEnabled ? 'La gestión de este sitio ha sido inhabilitada por un administrador.' : ''}
        >
          {isLoading ? 'Cambiando...' : (isMaintenanceOn ? 'Desactivar' : 'Activar')}
        </button>
      </div>
    </div>
  );
};

const UserDashboard = () => {
  const [sites, setSites] = useState([]);
  const [loading, setLoading] = useState(true);
  const user = auth.currentUser;

  useEffect(() => {
    if (!user) return;

    const sitesQuery = query(
      collection(db, 'sites'),
      where('assignedUsers', 'array-contains', user.uid)
    );

    const unsubscribe = onSnapshot(sitesQuery, (querySnapshot) => {
      const userSites = [];
      querySnapshot.forEach((doc) => {
        userSites.push({ id: doc.id, ...doc.data() });
      });
      setSites(userSites);
      setLoading(false);
    }, (error) => {
      console.error("Error al obtener los sitios del usuario: ", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  if (loading) {
    return <div>Cargando tus sitios...</div>;
  }

  return (
    <div>
      <div className="section-header">
        <h2>Mis Sitios Web</h2>
      </div>
      {sites.length > 0 ? (
        <div className="sites-grid">
          {sites.map(site => (
            <SiteCard key={site.id} site={site} />
          ))}
        </div>
      ) : (
        <p>No tienes ningún sitio web asignado todavía. Contacta a un administrador para obtener acceso.</p>
      )}
    </div>
  );
};

export default UserDashboard;