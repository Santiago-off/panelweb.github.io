import { useState } from 'react';
import { db } from '../../config';
import {
  doc,
  updateDoc,
  arrayUnion,
  arrayRemove,
} from 'firebase/firestore';


const WebInfoTab = ({ web, owner }) => {
  return (
    <div>
      <h3>Información del Sitio</h3>
      <ul>
        <li><strong>Nombre:</strong> {web.name}</li>
        <li><strong>Dominio:</strong> {web.domain}</li>
        <li><strong>Propietario:</strong> {owner ? owner.displayName : 'No asignado'}</li>
        <li><strong>Tipo de Hosting:</strong> {web.hostingType}</li>
        {web.hostingType === 'github' && (
          <li><strong>Repositorio GitHub:</strong> {web.githubRepo || 'No especificado'}</li>
        )}
        <li><strong>Estado:</strong> {web.status}</li>
      </ul>
      {/* Aquí podrías añadir un botón para editar esta información */}
    </div>
  );
};

const WebUsersTab = ({ web, users }) => {
  const [selectedUserToAssign, setSelectedUserToAssign] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Obtiene los IDs de los usuarios ya asignados a esta web
  const assignedUserIds = web.assignedUsers || [];

  // Filtra la lista completa de usuarios para obtener los detalles de los asignados
  const assignedUsersDetails = users.filter(user => assignedUserIds.includes(user.id));

  // Filtra para obtener los usuarios que aún no han sido asignados
  const unassignedUsers = users.filter(user => !assignedUserIds.includes(user.id) && user.role !== 'admin');

  const handleAssignUser = async () => {
    if (!selectedUserToAssign) {
      alert('Por favor, selecciona un usuario para asignar.');
      return;
    }
    setIsLoading(true);
    const webRef = doc(db, 'sites', web.id);
    try {
      await updateDoc(webRef, {
        assignedUsers: arrayUnion(selectedUserToAssign)
      });
      alert('Usuario asignado con éxito.');
      setSelectedUserToAssign(''); // Resetea el selector
    } catch (error) {
      console.error("Error al asignar usuario:", error);
      alert('Ocurrió un error al asignar el usuario.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveUser = async (userIdToRemove) => {
    if (window.confirm('¿Estás seguro de que quieres quitar el acceso a este usuario?')) {
      setIsLoading(true);
      const webRef = doc(db, 'sites', web.id);
      try {
        await updateDoc(webRef, {
          assignedUsers: arrayRemove(userIdToRemove)
        });
        alert('Usuario removido con éxito.');
      } catch (error) {
        console.error("Error al remover usuario:", error);
        alert('Ocurrió un error al remover el usuario.');
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <div>
      <h3>Gestionar Usuarios de la Web</h3>
      <p>Asigna o remueve usuarios que pueden ver y gestionar esta web desde su panel.</p>

      <h4 style={{marginTop: '2rem'}}>Asignar Nuevo Usuario</h4>
      <div style={{display: 'flex', gap: '1rem', alignItems: 'center'}}>
        <select value={selectedUserToAssign} onChange={(e) => setSelectedUserToAssign(e.target.value)} style={{flexGrow: 1}}>
          <option value="">-- Selecciona un usuario --</option>
          {unassignedUsers.map(user => <option key={user.id} value={user.id}>{user.displayName} ({user.email})</option>)}
        </select>
        <button onClick={handleAssignUser} className="add-button" disabled={isLoading || !selectedUserToAssign}>Asignar</button>
      </div>

      <h4 style={{marginTop: '2rem'}}>Usuarios Asignados</h4>
      {assignedUsersDetails.length > 0 ? (
        <div className="user-list">
          {assignedUsersDetails.map(user => (
            <div key={user.id} className="user-list-item">
              <div className="user-info">
                <strong>{user.displayName}</strong>
                <span>{user.email}</span>
              </div>
              <button onClick={() => handleRemoveUser(user.id)} className="logout-button" style={{borderColor: '#c53030', color: '#c53030'}} disabled={isLoading}>
                Remover
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p>No hay usuarios asignados a esta web.</p>
      )}
    </div>
  );
};

const WebDisableTab = ({ web, onClose }) => {
  const [isLoading, setIsLoading] = useState(false);

  const toggleManagementStatus = async () => {
    const newStatus = web.managementStatus === 'disabled' ? 'enabled' : 'disabled';
    const actionText = newStatus === 'disabled' ? 'inhabilitar' : 'habilitar';

    if (window.confirm(`¿Estás seguro de que quieres ${actionText} la gestión de esta página para sus usuarios?`)) {
      setIsLoading(true);
      const webRef = doc(db, 'sites', web.id);
      try {
        await updateDoc(webRef, {
          managementStatus: newStatus
        });
        alert(`Gestión de la página ${actionText}da con éxito.`);
        onClose();
      } catch (error) {
        console.error(`Error al ${actionText} la gestión:`, error);
        alert(`Ocurrió un error.`);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const isEnabled = web.managementStatus !== 'disabled';

  return (
    <div>
      <h3>Inhabilitar Gestión de Página</h3>
      <p>La gestión de esta página para sus usuarios está actualmente <strong>{isEnabled ? 'habilitada' : 'inhabilitada'}</strong>.</p>
      <p>{isEnabled ? 'Al inhabilitarla, los usuarios asignados no podrán ver ni gestionar esta web desde su panel.' : 'Al habilitarla, los usuarios asignados recuperarán el acceso a la gestión de esta web.'}</p>
      <div className="modal-footer" style={{padding: 0, border: 0, marginTop: '1rem'}}>
        <button onClick={toggleManagementStatus} className="add-button" style={{backgroundColor: isEnabled ? '#c53030' : '#48bb78'}} disabled={isLoading}>
          {isLoading ? 'Actualizando...' : (isEnabled ? 'Inhabilitar Gestión' : 'Habilitar Gestión')}
        </button>
      </div>
    </div>
  );
};

const WebMetricsTab = ({ web }) => {
  return (
    <div>
      <h3>Métricas de la Web</h3>
      <p>Esta sección mostrará gráficos y datos de rendimiento para <strong>{web.name}</strong>.</p>
      <p>Funcionalidad pendiente de implementación.</p>
    </div>
  );
};

const WebSettingsTab = ({ web }) => {
  const [isLoading, setIsLoading] = useState(false);
  const isMaintenanceOn = web.maintenanceMode === true;

  const toggleMaintenanceMode = async () => {
    const newStatus = !isMaintenanceOn;
    const actionText = newStatus ? 'activar' : 'desactivar';

    if (window.confirm(`¿Estás seguro de que quieres ${actionText} el modo mantenimiento para ${web.name}?`)) {
      setIsLoading(true);
      const webRef = doc(db, 'sites', web.id);
      try {
        await updateDoc(webRef, {
          maintenanceMode: newStatus
        });
        alert(`Modo mantenimiento ${actionText}do con éxito.`);
        // The modal will now reflect the new state on its own due to real-time listeners.
      } catch (error) {
        console.error(`Error al ${actionText} el modo mantenimiento:`, error);
        alert('Ocurrió un error al actualizar el estado.');
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <div>
      <h3>Configuración de la Web</h3>

      <h4 style={{marginTop: '1.5rem'}}>Modo Mantenimiento</h4>
      <p>
        El modo mantenimiento para <strong>{web.name}</strong> está actualmente
        <strong style={{color: isMaintenanceOn ? '#c53030' : '#48bb78'}}> {isMaintenanceOn ? 'Activado' : 'Desactivado'}</strong>.
      </p>
      <p>Esto permite mostrar una página de "en obras" en el sitio web del cliente.</p>
      <div className="modal-footer" style={{padding: 0, border: 0, marginTop: '1rem'}}>
        <button
          onClick={toggleMaintenanceMode}
          className="add-button"
          style={{backgroundColor: isMaintenanceOn ? '#48bb78' : '#c53030'}}
          disabled={isLoading}
        >
          {isLoading ? 'Actualizando...' : (isMaintenanceOn ? 'Desactivar Mantenimiento' : 'Activar Mantenimiento')}
        </button>
      </div>

      <h4 style={{marginTop: '2rem'}}>Extracción de Datos</h4>
      <p>Descargar un archivo con los datos de la página (métricas, base de datos, etc.).</p>
      <button className="logout-button">Descargar Datos (Próximamente)</button>
    </div>
  );
};


const ManageWebModal = ({ web, users, onClose }) => {
  const [activeTab, setActiveTab] = useState('informacion');

  // Encuentra el nombre del propietario de la web usando el ownerId
  const owner = users.find(u => u.id === web.ownerId);

  const renderTabContent = () => {
    switch (activeTab) {
      case 'informacion':
        return <WebInfoTab web={web} owner={owner} />;
      case 'usuarios':
        return <WebUsersTab web={web} users={users} />;
      case 'inhabilitar':
        return <WebDisableTab web={web} onClose={onClose} />;
      case 'metricas':
        return <WebMetricsTab web={web} />;
      case 'configuracion':
        return <WebSettingsTab web={web} />;
      default:
        return <WebInfoTab web={web} owner={owner} />;
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
          <div className="admin-content" style={{ flexGrow: 1, minHeight: '250px' }}>
            {renderTabContent()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManageWebModal;