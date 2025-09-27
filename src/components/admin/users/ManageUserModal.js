import { useState } from 'react';

// Importa las pestañas que se usarán en este modal
import UserInfoTab from './tabs/UserInfoTab';
import UserWebsTab from './tabs/UserWebsTab';
import UserSettingsTab from './tabs/UserSettingsTab';
import UserEnableDisableTab from './tabs/UserEnableDisableTab';

const ManageUserModal = ({ user, sites, onClose }) => {
  const [activeTab, setActiveTab] = useState('informacion');

  const renderTabContent = () => {
    switch (activeTab) {
      case 'informacion':
        return <UserInfoTab user={user} />;
      case 'paginas':
        return <UserWebsTab user={user} sites={sites} />;
      case 'configuracion':
        return <UserSettingsTab user={user} onClose={onClose} />;
      case 'habilitar':
        return <UserEnableDisableTab user={user} onClose={onClose} />;
      default:
        return null;
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Gestionar a {user.displayName}</h3>
          <button onClick={onClose} className="close-button">&times;</button>
        </div>
        <div className="manage-modal-body">
          <ul className="manage-modal-tabs">
            <li className={activeTab === 'informacion' ? 'active' : ''} onClick={() => setActiveTab('informacion')}>Información</li>
            <li className={activeTab === 'paginas' ? 'active' : ''} onClick={() => setActiveTab('paginas')}>Páginas</li>
            <li className={activeTab === 'configuracion' ? 'active' : ''} onClick={() => setActiveTab('configuracion')}>Configuración</li>
            <li className={activeTab === 'habilitar' ? 'active' : ''} onClick={() => setActiveTab('habilitar')}>Habilitar/Inhabilitar</li>
          </ul>
          <div className="tab-content">
            {renderTabContent()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManageUserModal;