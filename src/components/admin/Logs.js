import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../../config';

const formatTimestamp = (timestamp) => {
  if (!timestamp?.seconds) {
    return 'Fecha no disponible';
  }
  return new Date(timestamp.seconds * 1000).toLocaleString('es-ES', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
};

const LogItem = ({ log }) => {
  return (
    <div className="list-item log-item">
      <div className="log-item-main">
        <span className="log-action-tag">{log.action}</span>
        <div className="log-details">
          <p><strong>Actor:</strong> {log.actorEmail} ({log.actorId})</p>
          {Object.keys(log.details).length > 0 && (
            <pre className="log-details-json">
              {JSON.stringify(log.details, null, 2)}
            </pre>
          )}
        </div>
      </div>
      <div className="log-item-meta">
        <span>{formatTimestamp(log.timestamp)}</span>
      </div>
    </div>
  );
};

const Logs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const logsCollectionRef = collection(db, 'auditLogs');
    // Consulta para ordenar los logs por fecha de creación descendente
    const q = query(logsCollectionRef, orderBy('timestamp', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const logsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setLogs(logsData);
      setLoading(false);
    }, (error) => {
      console.error("Error al obtener los logs:", error);
      setLoading(false);
    });

    // Limpia la suscripción al desmontar el componente
    return () => unsubscribe();
  }, []);

  return (
    <section>
      <div className="section-header">
        <h2>Logs del Sistema</h2>
      </div>
      <p className="section-description">
        Registro detallado de toda la actividad en el panel para auditoría y depuración.
      </p>

      {loading ? (
        <p>Cargando logs...</p>
      ) : logs.length === 0 ? (
        <div className="placeholder-content">
          <p>No se han encontrado registros de actividad.</p>
        </div>
      ) : (
        <div className="list-container">
          {logs.map(log => (
            <LogItem key={log.id} log={log} />
          ))}
        </div>
      )}
    </section>
  );
};

export default Logs;