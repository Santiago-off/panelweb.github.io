import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy, limit } from 'firebase/firestore';
import { db } from '../../config';

const LogItem = ({ log }) => {
  // El error ocurría aquí porque 'log.details' podía ser null o undefined.
  // Añadimos una comprobación para asegurarnos de que 'details' es un objeto antes de usar Object.keys.
  const details = log.details || {};

  return (
    <div className="log-item">
      <div className="log-header">
        <span className="log-action">{log.action}</span>
        <span className="log-timestamp">{new Date(log.timestamp?.toDate()).toLocaleString()}</span>
      </div>
      <div className="log-body">
        <p><strong>Usuario:</strong> {log.userEmail} (ID: {log.userId})</p>
        {Object.keys(details).length > 0 && (
          <div className="log-details">
            <strong>Detalles:</strong>
            <pre>{JSON.stringify(details, null, 2)}</pre>
          </div>
        )}
      </div>
    </div>
  );
};

const Logs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const logsQuery = query(collection(db, 'adminLogs'), orderBy('timestamp', 'desc'), limit(50));
    const unsubscribe = onSnapshot(logsQuery, (snapshot) => {
      const logsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setLogs(logsData);
      setLoading(false);
    }, (error) => {
      console.error("Error al obtener logs:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return <div>Cargando logs...</div>;
  }

  return (
    <div>
      <h2>Registros de Actividad</h2>
      <div className="logs-container">{logs.map(log => <LogItem key={log.id} log={log} />)}</div>
    </div>
  );
};

export default Logs;