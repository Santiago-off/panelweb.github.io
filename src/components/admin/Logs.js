import { useState, useEffect } from 'react';
import { db } from '../../config';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';

const Logs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Creamos una consulta a la colección 'auditLogs'
    const logsQuery = query(
      collection(db, 'auditLogs'),
      // 2. Ordenamos los logs por fecha de creación en orden descendente
      orderBy('timestamp', 'desc')
    );

    // 3. Usamos onSnapshot para escuchar cambios en tiempo real
    const unsubscribe = onSnapshot(logsQuery, (querySnapshot) => {
      const logsData = [];
      querySnapshot.forEach((doc) => {
        logsData.push({ id: doc.id, ...doc.data() });
      });
      setLogs(logsData);
      setLoading(false);
    }, (error) => {
      console.error("Error al obtener los logs: ", error);
      setLoading(false);
    });

    // 4. Limpiamos el listener cuando el componente se desmonte
    return () => unsubscribe();
  }, []);

  const formatDate = (timestamp) => {
    if (!timestamp?.seconds) return 'Fecha no disponible';
    return new Date(timestamp.seconds * 1000).toLocaleString('es-ES', {
      year: 'numeric', month: 'long', day: 'numeric',
      hour: '2-digit', minute: '2-digit', second: '2-digit'
    });
  };

  const getActionDetails = (log) => {
    let details = `Acción: ${log.action}`;
    if (log.details) {
      const detailParts = Object.entries(log.details).map(([key, value]) => `${key}: ${value}`);
      if (detailParts.length > 0) {
        details += ` (${detailParts.join(', ')})`;
      }
    }
    return details;
  };

  return (
    <div>
      <div className="section-header">
        <h2>Logs del Sistema</h2>
      </div>
      <p>Registro detallado de toda la actividad para auditoría y depuración.</p>

      {loading ? (
        <p>Cargando logs...</p>
      ) : (
        <div className="log-list">
          {logs.map(log => (
            <div key={log.id} className="log-list-item">
              <div className="log-info">
                <strong>{formatDate(log.timestamp)}</strong>
                <span>Usuario: {log.actorEmail}</span>
              </div>
              <div className="log-details">
                {getActionDetails(log)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Logs;