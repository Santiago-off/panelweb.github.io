import { useState } from 'react';

// Importa las pestañas que se usarán en este modal
import WebInfoTab from './tabs/WebInfoTab';
import WebUsersTab from './tabs/WebUsersTab';
import WebDisableTab from './tabs/WebDisableTab';
import WebMetricsTab from './tabs/WebMetricsTab';
import WebSettingsTab from './tabs/WebSettingsTab';

const ManageWebModal = ({ web, users, onClose }) => {
  const [activeTab, setActiveTab] = useState('informacion');

  // Encuentra el nombre del propietario de la web usando el ownerId
  const owner = users.find(u => u.id === web.ownerId);

  const renderTabContent = () => {
    switch (activeTab) {
      case 'informacion':
        return <WebInfoTab web={web} owner={owner} users={users} />;
      case 'usuarios':
        return <WebUsersTab web={web} users={users} />;
      case 'inhabilitar':
        return <WebDisableTab web={web} onClose={onClose} />;
      case 'metricas':
        return <WebMetricsTab web={web} />;
      case 'configuracion':
        return <WebSettingsTab web={web} />;
      default:
        return <WebInfoTab web={web} owner={owner} users={users}/>;
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Gestionar Web: {web.name}</h3>
          <button onClick={onClose} className="close-button">&times;</button>
        </div>
        <div className="manage-modal-body">
          <ul className="manage-modal-tabs">
            <li className={activeTab === 'informacion' ? 'active' : ''} onClick={() => setActiveTab('informacion')}>Información</li>
            <li className={activeTab === 'usuarios' ? 'active' : ''} onClick={() => setActiveTab('usuarios')}>Usuarios</li>
            <li className={activeTab === 'inhabilitar' ? 'active' : ''} onClick={() => setActiveTab('inhabilitar')}>Inhabilitar</li>
            <li className={activeTab === 'metricas' ? 'active' : ''} onClick={() => setActiveTab('metricas')}>Métricas</li>
            <li className={activeTab === 'configuracion' ? 'active' : ''} onClick={() => setActiveTab('configuracion')}>Configuración</li>
          </ul>
          <div className="tab-content">
            {renderTabContent()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManageWebModal;