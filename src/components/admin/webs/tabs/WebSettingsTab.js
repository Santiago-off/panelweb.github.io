import { useState } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../../../config';
import { logAdminAction } from '../../../../utils/logs';

const WebSettingsTab = ({ web }) => {
  const [isLoading, setIsLoading] = useState(false);

  const toggleMaintenanceMode = async () => {
    const isMaintenance = web.status === 'maintenance';
    const newStatus = isMaintenance ? 'online' : 'maintenance';
    const actionText = isMaintenance ? 'desactivar' : 'activar';

    if (window.confirm(`¿Estás seguro de que quieres ${actionText} el modo mantenimiento para ${web.name}?`)) {
      setIsLoading(true);
      const webRef = doc(db, 'sites', web.id);
      try {
        await updateDoc(webRef, { status: newStatus });
        await logAdminAction(isMaintenance ? 'SITE_MAINTENANCE_MODE_DEACTIVATED' : 'SITE_MAINTENANCE_MODE_ACTIVATED', { siteId: web.id });
        alert(`Modo mantenimiento ${actionText.slice(0, -1)}do con éxito.`);
        // No cerramos el modal para que el admin vea el cambio.
      } catch (error) {
        console.error(`Error al ${actionText} el modo mantenimiento:`, error);
        alert('Ocurrió un error.');
      } finally {
        setIsLoading(false);
      }
    }
  };

  const isMaintenance = web.status === 'maintenance';

  return (
    <div>
      <h3>Configuración Avanzada</h3>

      <h4 style={{marginTop: '1rem'}}>Modo Mantenimiento</h4>
      <div className={`status-banner ${isMaintenance ? 'status-banner-warning' : 'status-banner-success'}`}>
        El sitio web está actualmente <strong>{isMaintenance ? 'en mantenimiento' : 'online'}</strong>.
      </div>
      <p>Poner la página web en modo mantenimiento de forma remota. Esto mostrará una página de aviso a los visitantes.</p>
      <button onClick={toggleMaintenanceMode} className={`button-primary ${isMaintenance ? 'button-success' : 'button-warning'}`} disabled={isLoading}>
        {isLoading ? 'Actualizando...' : (isMaintenance ? 'Desactivar Mantenimiento' : 'Activar Mantenimiento')}
      </button>

      <h4 style={{marginTop: '2rem'}}>Extracción de Datos</h4>
      <p>Descargar un archivo con los datos de la página (métricas, base de datos de la web, etc.).</p>
      <div className="placeholder-content">
        <p>Funcionalidad pendiente de implementación.</p>
      </div>
      <button className="button-secondary" disabled>Descargar Datos</button>
    </div>
  );
};

export default WebSettingsTab;