import { useState } from 'react';
import { doc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db } from '../../../../config';
import { logAdminAction } from '../../../../utils/logs';

const UserWebsTab = ({ user, sites }) => {
  const [selectedSiteToAssign, setSelectedSiteToAssign] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Filtra para encontrar los sitios ya asignados a este usuario
  const assignedSites = sites.filter(site => site.assignedUsers?.includes(user.id));

  // Filtra para encontrar los sitios que aún no están asignados a este usuario
  const unassignedSites = sites.filter(site => !site.assignedUsers?.includes(user.id));

  const handleAssignSite = async () => {
    if (!selectedSiteToAssign) {
      alert('Por favor, selecciona una web para asignar.');
      return;
    }
    setIsLoading(true);
    const siteRef = doc(db, 'sites', selectedSiteToAssign);
    try {
      await updateDoc(siteRef, { assignedUsers: arrayUnion(user.id) });
      await logAdminAction('USER_ASSIGNED_TO_SITE', { targetUserId: user.id, siteId: selectedSiteToAssign });
      alert('Web asignada con éxito.');
      setSelectedSiteToAssign('');
    } catch (error) {
      console.error("Error al asignar web:", error);
      alert('Ocurrió un error al asignar la web.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveSite = async (siteId) => {
    if (window.confirm('¿Estás seguro de que quieres quitar el acceso a esta web para este usuario?')) {
      setIsLoading(true);
      const siteRef = doc(db, 'sites', siteId);
      try {
        await updateDoc(siteRef, { assignedUsers: arrayRemove(user.id) });
        await logAdminAction('USER_REMOVED_FROM_SITE', { targetUserId: user.id, siteId: siteId });
        alert('Acceso a la web removido con éxito.');
      } catch (error) {
        console.error("Error al remover acceso a la web:", error);
        alert('Ocurrió un error.');
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <div>
      <h3>Páginas Asignadas</h3>
      <p>Gestiona las páginas web a las que <strong>{user.displayName}</strong> tiene acceso.</p>

      <h4 style={{ marginTop: '2rem' }}>Asignar Nueva Página</h4>
      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
        <select value={selectedSiteToAssign} onChange={(e) => setSelectedSiteToAssign(e.target.value)} style={{ flexGrow: 1 }}>
          <option value="">-- Selecciona una página --</option>
          {unassignedSites.map(site => <option key={site.id} value={site.id}>{site.name} ({site.domain})</option>)}
        </select>
        <button onClick={handleAssignSite} className="button-primary" disabled={isLoading || !selectedSiteToAssign}>Asignar</button>
      </div>

      <h4 style={{ marginTop: '2rem' }}>Páginas Actualmente Asignadas</h4>
      {assignedSites.length > 0 ? (
        <div className="list-container">
          {assignedSites.map(site => (
            <div key={site.id} className="list-item">
              <div className="list-item-info">
                <strong>{site.name}</strong>
                <span>{site.domain}</span>
              </div>
              <button onClick={() => handleRemoveSite(site.id)} className="button-secondary button-danger" disabled={isLoading}>
                Remover
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p>Este usuario no tiene ninguna página asignada.</p>
      )}
    </div>
  );
};

export default UserWebsTab;