import { useState } from 'react';
import { doc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db } from '../../../../config';
import { logAdminAction } from '../../../../utils/logs';

const WebUsersTab = ({ web, users }) => {
  const [selectedUserToAssign, setSelectedUserToAssign] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Obtiene los IDs de los usuarios ya asignados a esta web
  const assignedUserIds = web.assignedUsers || [];

  // Filtra la lista completa de usuarios para obtener los detalles de los asignados
  const assignedUsersDetails = users.filter(user => assignedUserIds.includes(user.id));

  // Filtra para obtener los usuarios que aún no han sido asignados (y no son admins)
  const unassignedUsers = users.filter(user => !assignedUserIds.includes(user.id) && user.role !== 'admin');

  const handleAssignUser = async () => {
    if (!selectedUserToAssign) {
      alert('Por favor, selecciona un usuario para asignar.');
      return;
    }
    setIsLoading(true);
    const webRef = doc(db, 'sites', web.id);
    try {
      await updateDoc(webRef, {
        assignedUsers: arrayUnion(selectedUserToAssign)
      });
      await logAdminAction('SITE_ACCESS_GRANTED_TO_USER', { siteId: web.id, targetUserId: selectedUserToAssign });
      alert('Usuario asignado con éxito.');
      setSelectedUserToAssign(''); // Resetea el selector
    } catch (error) {
      console.error("Error al asignar usuario:", error);
      alert('Ocurrió un error al asignar el usuario.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveUser = async (userIdToRemove) => {
    if (window.confirm('¿Estás seguro de que quieres quitar el acceso a este usuario?')) {
      setIsLoading(true);
      const webRef = doc(db, 'sites', web.id);
      try {
        await updateDoc(webRef, {
          assignedUsers: arrayRemove(userIdToRemove)
        });
        await logAdminAction('SITE_ACCESS_REVOKED_FROM_USER', { siteId: web.id, targetUserId: userIdToRemove });
        alert('Usuario removido con éxito.');
      } catch (error) {
        console.error("Error al remover usuario:", error);
        alert('Ocurrió un error al remover el usuario.');
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <div>
      <h3>Gestionar Usuarios de la Web</h3>
      <p>Asigna o remueve usuarios que pueden ver y gestionar esta web desde su panel.</p>

      <h4 style={{marginTop: '2rem'}}>Asignar Nuevo Usuario</h4>
      <div style={{display: 'flex', gap: '1rem', alignItems: 'center'}}>
        <select value={selectedUserToAssign} onChange={(e) => setSelectedUserToAssign(e.target.value)} style={{flexGrow: 1}}>
          <option value="">-- Selecciona un usuario --</option>
          {unassignedUsers.map(user => <option key={user.id} value={user.id}>{user.displayName} ({user.email})</option>)}
        </select>
        <button onClick={handleAssignUser} className="button-primary" disabled={isLoading || !selectedUserToAssign}>Asignar</button>
      </div>

      <h4 style={{marginTop: '2rem'}}>Usuarios Asignados</h4>
      {assignedUsersDetails.length > 0 ? (
        <div className="list-container">
          {assignedUsersDetails.map(user => (
            <div key={user.id} className="list-item">
              <div className="list-item-info">
                <strong>{user.displayName}</strong>
                <span>{user.email}</span>
              </div>
              <button onClick={() => handleRemoveUser(user.id)} className="button-secondary button-danger" disabled={isLoading}>
                Remover
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p>No hay usuarios asignados a esta web (aparte de los administradores).</p>
      )}
    </div>
  );
};

export default WebUsersTab;