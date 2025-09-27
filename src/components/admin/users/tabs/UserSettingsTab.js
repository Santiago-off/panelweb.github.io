import { useState } from 'react';
import { doc, updateDoc, deleteField } from 'firebase/firestore';
import { db } from '../../../../config';
import { logAdminAction } from '../../../../utils/logs';

const UserSettingsTab = ({ user, onClose }) => {
  const [isLoading, setIsLoading] = useState(false);

  const toggleAccessStatus = async () => {
    const isBlocked = user.accessStatus === 'blocked';
    const action = isBlocked ? 'desbloquear' : 'bloquear';
    const newStatus = isBlocked ? 'active' : 'blocked';

    let reason = '';
    if (!isBlocked) {
      reason = window.prompt(`Por favor, introduce un motivo para bloquear a ${user.displayName}:`);
      if (!reason) { // Si el admin cancela o no pone motivo, no hacer nada.
        return;
      }
    }

    if (window.confirm(`¿Estás seguro de que quieres ${action} a ${user.displayName}?`)) {
      setIsLoading(true);
      const userRef = doc(db, 'users', user.id);
      try {
        const updateData = { accessStatus: newStatus };
        if (isBlocked) {
          updateData.blockReason = deleteField(); // Elimina el motivo al desbloquear
        } else {
          updateData.blockReason = reason; // Añade el motivo al bloquear
        }

        await updateDoc(userRef, updateData);
        await logAdminAction(isBlocked ? 'USER_ACCESS_UNBLOCKED' : 'USER_ACCESS_BLOCKED', {
          targetUserId: user.id,
          targetUserEmail: user.email,
          reason: isBlocked ? undefined : reason
        });

        alert(`Acceso de usuario ${action}do con éxito.`);
        onClose();
      } catch (error) {
        console.error(`Error al ${action} el acceso:`, error);
        alert('Ocurrió un error.');
      } finally {
        setIsLoading(false);
      }
    }
  };

  const isBlocked = user.accessStatus === 'blocked';

  return (
    <div>
      <h3>Configuración de Cuenta</h3>
      <div className={`status-banner ${isBlocked ? 'status-banner-error' : 'status-banner-success'}`}>
        El acceso de este usuario está actualmente <strong>{isBlocked ? 'Bloqueado' : 'Activo'}</strong>.
      </div>
      <p>
        {isBlocked
          ? `Motivo: "${user.blockReason || 'No se especificó un motivo.'}"`
          : 'Puedes bloquear el acceso para impedir que el usuario entre al panel.'}
      </p>
      <div className="modal-footer" style={{padding: 0, border: 0, marginTop: '1rem'}}>
        <button onClick={toggleAccessStatus} className={`button-primary ${isBlocked ? 'button-success' : 'button-danger'}`} disabled={isLoading}>
          {isLoading ? 'Actualizando...' : (isBlocked ? 'Desbloquear Acceso' : 'Bloquear Acceso')}
        </button>
      </div>
    </div>
  );
};

export default UserSettingsTab;