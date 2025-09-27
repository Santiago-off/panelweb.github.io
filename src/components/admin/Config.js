import { useState, useEffect } from 'react';
import { db } from '../../config';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';

const Config = () => {
  const [isMaintenanceOn, setIsMaintenanceOn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

  const configRef = doc(db, 'panelConfig', 'main');

  useEffect(() => {
    // Escuchar en tiempo real el documento de configuración
    const unsubscribe = onSnapshot(configRef, (docSnap) => {
      if (docSnap.exists()) {
        setIsMaintenanceOn(docSnap.data().maintenanceMode === true);
      } else {
        // Si el documento no existe, asumimos que el modo mantenimiento está desactivado
        setIsMaintenanceOn(false);
      }
      setLoading(false);
    }, (error) => {
      console.error("Error al obtener la configuración del panel:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [configRef]);

  const toggleMaintenanceMode = async () => {
    setIsUpdating(true);
    const newStatus = !isMaintenanceOn;
    const actionText = newStatus ? 'activar' : 'desactivar';

    try {
      // Usamos setDoc con merge: true para crear el documento si no existe, o actualizarlo si sí.
      await setDoc(configRef, { maintenanceMode: newStatus }, { merge: true });
      alert(`El modo mantenimiento del panel ha sido ${actionText}do.`);
    } catch (error) {
      console.error("Error al cambiar el modo mantenimiento del panel:", error);
      alert("Ocurrió un error al actualizar la configuración.");
    } finally {
      setIsUpdating(false);
    }
  };

  if (loading) {
    return <p>Cargando configuración...</p>;
  }

  return (
    <div>
      <div className="section-header">
        <h2>Configuración del Panel</h2>
      </div>
      <p>Ajustes globales que afectan a toda la plataforma.</p>

      <h4 style={{ marginTop: '1.5rem' }}>Modo Mantenimiento Global</h4>
      <p>
        El panel está actualmente
        <strong style={{color: isMaintenanceOn ? '#c53030' : '#48bb78'}}> {isMaintenanceOn ? 'En Mantenimiento' : 'Operativo'}</strong>.
      </p>
      <p>Cuando está activado, solo los administradores pueden iniciar sesión.</p>
      <div className="modal-footer" style={{padding: 0, border: 0, marginTop: '1rem'}}>
        <button
          onClick={toggleMaintenanceMode}
          className="add-button"
          style={{backgroundColor: isMaintenanceOn ? '#48bb78' : '#c53030'}}
          disabled={isUpdating}
        >
          {isUpdating ? 'Actualizando...' : (isMaintenanceOn ? 'Desactivar Mantenimiento' : 'Activar Mantenimiento')}
        </button>
      </div>

      <h4 style={{marginTop: '2rem'}}>Copia de Seguridad de Datos</h4>
      <p>Genera y descarga una copia de seguridad de las colecciones principales de la base de datos.</p>
      <button className="logout-button">Generar Backup (Próximamente)</button>
    </div>
  );
};

export default Config;