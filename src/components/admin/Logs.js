import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { db, mockData, checkFirebaseConnection } from '../../config';

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
    setLoading(true);
    const fetchLogs = async () => {
      try {
        // Verificar si hay conexión a Firebase
        if (!checkFirebaseConnection()) {
          console.log("Usando datos simulados para logs debido a problemas de conexión");
          // Usar datos simulados para logs
          const mockLogs = mockData.logs || [
            { id: 'mock1', action: 'Login', user: 'admin@example.com', timestamp: new Date().toISOString(), details: 'Acceso simulado en modo offline' },
            { id: 'mock2', action: 'Configuración', user: 'admin@example.com', timestamp: new Date().toISOString(), details: 'Cambio de configuración simulado' }
          ];
          setLogs(mockLogs);
          setLoading(false);
          return;
        }

        const logsRef = collection(db, 'auditLogs');
        const q = query(logsRef, orderBy('timestamp', 'desc'), limit(100));
        const querySnapshot = await getDocs(q);
        console.log(`Número de logs obtenidos: ${querySnapshot.docs.length}`);
        const logsData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setLogs(logsData);
      } catch (error) {
        console.error('Error al obtener logs:', error);
        // Usar datos simulados en caso de error
        const mockLogs = mockData.logs || [
          { id: 'mock1', action: 'Login', user: 'admin@example.com', timestamp: new Date().toISOString(), details: 'Acceso simulado en modo offline' },
          { id: 'mock2', action: 'Configuración', user: 'admin@example.com', timestamp: new Date().toISOString(), details: 'Cambio de configuración simulado' }
        ];
        setLogs(mockLogs);
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();
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