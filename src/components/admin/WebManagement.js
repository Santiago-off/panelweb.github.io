import { useState, useEffect } from 'react';
import { db } from '../../config';
import { collection, onSnapshot } from 'firebase/firestore';
import AddWebModal from '../modals/AddWebModal';
import ManageWebModal from '../modals/ManageWebModal';

const WebManagement = ({ users }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [managingWeb, setManagingWeb] = useState(null);
  const [webs, setWebs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Cargar la lista de webs
    const websUnsubscribe = onSnapshot(collection(db, "sites"), (snapshot) => {
      const websData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setWebs(websData);
      setLoading(false);
    });

    return () => {
      websUnsubscribe();
    };
  }, []);

  return (
    <div>
      <div className="section-header">
        <h2>Gestión de Webs</h2>
        <button className="add-button" onClick={() => setIsModalOpen(true)}>Añadir Web</button>
      </div>
      <p>Visualiza y administra todos los sitios web alojados.</p>

      {webs.length === 0 && !loading ? <p>No hay webs para mostrar.</p> : null}
      {loading ? <p>Cargando webs...</p> : (
        <div className="user-list">
          {webs.map(web => (
            <div key={web.id} className="user-list-item web-list-item">
              <div className="user-info">
                <span className={`status-indicator status-${web.status || 'offline'}`}></span>
                <strong>{web.name}</strong>
                <span>{web.domain}</span>
              </div>
              <button className="logout-button" onClick={() => setManagingWeb(web)}>Gestionar</button>
            </div>
          ))}
        </div>
      )}

      {isModalOpen && <AddWebModal users={users} onClose={() => setIsModalOpen(false)} />}
      {managingWeb && <ManageWebModal web={managingWeb} users={users} onClose={() => setManagingWeb(null)} />}
    </div>
  );
};

export default WebManagement;