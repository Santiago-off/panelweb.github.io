import { useState } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../../../config';
import { logAdminAction } from '../../../../utils/logs';

const WebDisableTab = ({ web, onClose }) => {
  const [isLoading, setIsLoading] = useState(false);

  const toggleManagementStatus = async () => {
    const isEnabled = web.managementStatus !== 'disabled';
    const newStatus = isEnabled ? 'disabled' : 'enabled';
    const actionText = isEnabled ? 'inhabilitar' : 'habilitar';

    if (window.confirm(`¿Estás seguro de que quieres ${actionText} la gestión de esta página para sus usuarios?`)) {
      setIsLoading(true);
      const webRef = doc(db, 'sites', web.id);
      try {
        await updateDoc(webRef, {
          managementStatus: newStatus
        });
        await logAdminAction(isEnabled ? 'SITE_MANAGEMENT_DISABLED' : 'SITE_MANAGEMENT_ENABLED', { siteId: web.id });
        alert(`Gestión de la página ${actionText}da con éxito.`);
        onClose();
      } catch (error) {
        console.error(`Error al ${actionText} la gestión:`, error);
        alert(`Ocurrió un error.`);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const isEnabled = web.managementStatus !== 'disabled';

  return (
    <div>
      <h3>Inhabilitar Gestión de Página</h3>
      <div className={`status-banner ${isEnabled ? 'status-banner-success' : 'status-banner-warning'}`}>
        La gestión de esta página para sus usuarios está actualmente <strong>{isEnabled ? 'habilitada' : 'inhabilitada'}</strong>.
      </div>
      <p>{isEnabled ? 'Al inhabilitarla, los usuarios asignados no podrán ver ni gestionar esta web desde su panel.' : 'Al habilitarla, los usuarios asignados recuperarán el acceso a la gestión de esta web.'}</p>
      <div className="modal-footer" style={{padding: 0, border: 0, marginTop: '1rem'}}>
        <button onClick={toggleManagementStatus} className={`button-primary ${isEnabled ? 'button-danger' : 'button-success'}`} disabled={isLoading}>
          {isLoading ? 'Actualizando...' : (isEnabled ? 'Inhabilitar Gestión' : 'Habilitar Gestión')}
        </button>
      </div>
    </div>
  );
};

export default WebDisableTab;