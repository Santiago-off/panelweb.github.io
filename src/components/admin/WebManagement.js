import { useState, useEffect } from 'react';
import { onSnapshot, collection } from 'firebase/firestore';
import { db } from '../../config';

// Importa los modales que se usarán en esta sección
import AddWebModal from './webs/AddWebModal';
import ManageWebModal from './webs/ManageWebModal';

const WebManagement = ({ users }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [managingWeb, setManagingWeb] = useState(null);
  const [webs, setWebs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const websUnsubscribe = onSnapshot(collection(db, "sites"), (snapshot) => {
      const websData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setWebs(websData);
      setLoading(false);
    }, (error) => {
      console.error("Error al obtener la lista de webs:", error);
      setLoading(false);
    });

    return () => websUnsubscribe();
  }, []);

  return (
    <section>
      <div className="section-header">
        <h2>Gestión de Webs</h2>
        <button className="button-primary" onClick={() => setIsModalOpen(true)}>Añadir Web</button>
      </div>
      <p className="section-description">Visualiza y administra todos los sitios web alojados.</p>

      {loading ? (
        <p>Cargando webs...</p>
      ) : webs.length === 0 ? (
        <p>No hay webs para mostrar.</p>
      ) : (
        <div className="list-container">
          {webs.map(web => (
            <div key={web.id} className="list-item web-list-item">
              <div className="list-item-info">
                <span className={`status-indicator status-${web.status || 'offline'}`}></span>
                <strong>{web.name}</strong>
                <span>{web.domain}</span>
              </div>
              <button className="button-secondary" onClick={() => setManagingWeb(web)}>Gestionar</button>
            </div>
          ))}
        </div>
      )}

      {isModalOpen && <AddWebModal users={users} onClose={() => setIsModalOpen(false)} />}
      {managingWeb && <ManageWebModal web={managingWeb} users={users} onClose={() => setManagingWeb(null)} />}
    </section>
  );
};

export default WebManagement;