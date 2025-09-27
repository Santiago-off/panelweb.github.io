import { useState, useEffect } from 'react';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { db } from '../../config';
import { logAdminAction } from '../../utils/logs';

const Config = () => {
  const [isMaintenance, setIsMaintenance] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const configRef = doc(db, 'panelConfig', 'main');
    const unsubscribe = onSnapshot(configRef, (docSnap) => {
      if (docSnap.exists()) {
        setIsMaintenance(docSnap.data().maintenanceMode === true);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const toggleMaintenanceMode = async () => {
    const newMode = !isMaintenance;
    const configRef = doc(db, 'panelConfig', 'main');
    try {
      await updateDoc(configRef, { maintenanceMode: newMode });
      await logAdminAction(newMode ? 'PANEL_MAINTENANCE_MODE_ACTIVATED' : 'PANEL_MAINTENANCE_MODE_DEACTIVATED');
      alert(`Modo mantenimiento del panel ${newMode ? 'activado' : 'desactivado'}.`);
    } catch (error) {
      console.error("Error al cambiar el modo mantenimiento:", error);
      alert("Ocurrió un error al actualizar la configuración.");
    }
  };

  if (loading) {
    return <p>Cargando configuración...</p>;
  }

  return (
    <section>
      <div className="section-header">
        <h2>Configuración del Panel</h2>
      </div>
      <p className="section-description">
        Ajustes globales para la plataforma.
      </p>

      <div className="config-item">
        <h4>Modo Mantenimiento del Panel</h4>
        <div className={`status-banner ${isMaintenance ? 'status-banner-warning' : 'status-banner-success'}`}>
          El panel está actualmente <strong>{isMaintenance ? 'en mantenimiento' : 'operativo'}</strong>.
        </div>
        <p>Cuando está activo, solo los administradores pueden iniciar sesión.</p>
        <button
          onClick={toggleMaintenanceMode}
          className={`button-primary ${isMaintenance ? 'button-success' : 'button-warning'}`}
        >
          {isMaintenance ? 'Desactivar Modo Mantenimiento' : 'Activar Modo Mantenimiento'}
        </button>
      </div>

      <div className="config-item">
        <h4>Extracción de Datos</h4>
        <p>Opciones para la extracción y copia de seguridad de datos de la plataforma.</p>
        <div className="placeholder-content">
          <p>Funcionalidad pendiente de implementación.</p>
        </div>
        <button className="button-secondary" disabled>Generar Copia de Seguridad</button>
      </div>
    </section>
  );
};

export default Config;