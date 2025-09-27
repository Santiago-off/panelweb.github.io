import { useState } from 'react';
import { db, auth } from '../../config';
import {
  doc,
  updateDoc,
  deleteField,
  arrayUnion,
  arrayRemove,
  addDoc,
  collection,
  serverTimestamp,
} from 'firebase/firestore';

// --- Helper para Logs ---
// Duplicating this helper here for now. A better approach would be to move it to a shared utility file.
const logAdminAction = async (action, details = {}) => {
  const currentUser = auth.currentUser;
  if (!currentUser) return;

  try {
    await addDoc(collection(db, 'auditLogs'), {
      timestamp: serverTimestamp(),
      actorId: currentUser.uid,
      actorEmail: currentUser.email,
      action,
      details,
      type: 'PANEL'
    });
  } catch (error) {
    console.error("Error al escribir en el log de auditoría:", error);
  }
};


const EnableDisableTab = ({ user, onClose }) => {
  const [token, setToken] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleEnable = async () => {
    if (!token) {
      setError('El token es obligatorio para habilitar la cuenta.');
      return;
    }
    if (token.toUpperCase() !== user.verificationToken) {
      setError('El token de verificación es incorrecto.');
      return;
    }

    setIsLoading(true);
    setError('');
    try {
      const userRef = doc(db, 'users', user.id);
      await updateDoc(userRef, {
        status: 'enabled',
        verificationToken: deleteField() // Borramos el token para que no se pueda reutilizar
      });
      await logAdminAction('USER_ENABLED', { targetUserId: user.id, targetUserEmail: user.email });
      alert('¡Usuario habilitado con éxito!');
      onClose();
    } catch (err) {
      console.error("Error al habilitar usuario:", err);
      setError('Ocurrió un error al intentar habilitar el usuario.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisable = async () => {
    if (window.confirm(`¿Estás seguro de que quieres inhabilitar a ${user.displayName}? El usuario no podrá acceder al panel.`)) {
      setIsLoading(true);
      setError('');
      try {
        const userRef = doc(db, 'users', user.id);
        const newVerificationToken = Math.random().toString(36).substring(2, 10).toUpperCase();
        await updateDoc(userRef, {
          status: 'disabled',
          verificationToken: newVerificationToken
        });
        await logAdminAction('USER_DISABLED', { targetUserId: user.id, targetUserEmail: user.email });
        alert('¡Usuario inhabilitado con éxito!');
        onClose();
      } catch (err) {
        console.error("Error al inhabilitar usuario:", err);
        setError('Ocurrió un error al intentar inhabilitar el usuario.');
      } finally {
        setIsLoading(false);
      }
    }
  };

  if (user.status === 'disabled') {
    return (
      <div>
        <h3>Habilitar Cuenta</h3>
        <p>Introduce el token de verificación proporcionado por el usuario para activar su cuenta.</p>
        <div className="form-group" style={{marginTop: '1rem'}}>
          <label htmlFor="token">Token de Verificación</label>
          <input type="text" id="token" value={token} onChange={(e) => setToken(e.target.value)} />
        </div>
        {error && <p className="login-error">{error}</p>}
        <div className="modal-footer" style={{padding: 0, border: 0, marginTop: '1rem'}}>
          <button onClick={handleEnable} className="add-button" disabled={isLoading}>
            {isLoading ? 'Habilitando...' : 'Habilitar Usuario'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h3>Inhabilitar Cuenta</h3>
      <p>Esta cuenta está actualmente <strong>activa</strong>.</p>
      <div className="modal-footer" style={{padding: 0, border: 0, marginTop: '1rem'}}>
        <button onClick={handleDisable} className="add-button" style={{backgroundColor: '#c53030'}} disabled={isLoading}>
          {isLoading ? 'Inhabilitando...' : 'Inhabilitar Usuario'}
        </button>
      </div>
    </div>
  );
};

const UserInfoTab = ({ user }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    displayName: user.displayName || '',
    email: user.email || '',
    phone: user.phone || '',
  });

  const formatDate = (timestamp) => {
    if (!timestamp?.seconds) return 'N/A';
    return new Date(timestamp.seconds * 1000).toLocaleDateString('es-ES', {
      year: 'numeric', month: 'long', day: 'numeric'
    });
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSaveChanges = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    const userRef = doc(db, 'users', user.id);
    try {
      await updateDoc(userRef, {
        displayName: formData.displayName,
        email: formData.email,
        phone: formData.phone,
      });
      await logAdminAction('USER_INFO_UPDATED', { targetUserId: user.id, targetUserEmail: user.email });
      alert('Información del usuario actualizada con éxito.');
      setIsEditing(false);
    } catch (error) {
      console.error("Error al actualizar la información:", error);
      alert('Ocurrió un error al guardar los cambios.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isEditing) {
    return (
      <div>
        <h3>Editar Información</h3>
        <form onSubmit={handleSaveChanges}>
          <div className="form-group" style={{marginBottom: '1rem'}}>
            <label htmlFor="displayName">Nombre Completo</label>
            <input type="text" id="displayName" name="displayName" value={formData.displayName} onChange={handleChange} />
          </div>
          <div className="form-group" style={{marginBottom: '1rem'}}>
            <label htmlFor="email">Email</label>
            <input type="email" id="email" name="email" value={formData.email} onChange={handleChange} />
          </div>
          <div className="form-group" style={{marginBottom: '1rem'}}>
            <label htmlFor="phone">Teléfono</label>
            <input type="tel" id="phone" name="phone" value={formData.phone} onChange={handleChange} />
          </div>
          <div className="modal-footer" style={{padding: 0, border: 0, marginTop: '1rem'}}>
            <button type="button" className="logout-button" onClick={() => setIsEditing(false)}>Cancelar</button>
            <button type="submit" className="add-button" disabled={isLoading}>
              {isLoading ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div>
      <div className="section-header" style={{border: 0, padding: 0, marginBottom: '1.5rem'}}>
        <h3>Información del Usuario</h3>
        <button className="logout-button" onClick={() => setIsEditing(true)}>Editar</button>
      </div>
      <ul>
        <li><strong>Nombre Completo:</strong> {user.displayName}</li>
        <li><strong>Email:</strong> {user.email}</li>
        <li><strong>Teléfono:</strong> {user.phone || 'No especificado'}</li>
        <li><strong>Rol:</strong> {user.role}</li>
        <li><strong>Estado:</strong> {user.status === 'enabled' ? 'Habilitado' : 'Inhabilitado'}</li>
        <li><strong>Miembro desde:</strong> {formatDate(user.createdAt)}</li>
      </ul>
      <h4>Información de Pago</h4>
      <ul>
        <li><strong>Método de pago:</strong> {user.payment?.type || 'No especificado'}</li>
        {user.payment?.type === 'paypal' && (
          <li><strong>Email de PayPal:</strong> {user.payment.paypalEmail}</li>
        )}
        <li><strong>Código de Factura:</strong> {user.invoiceCode || 'No especificado'}</li>
        <li><strong>Tipo de Servicio:</strong> {user.serviceType || 'No especificado'}</li>
      </ul>
    </div>
  );
};

const WebsTab = ({ user, sites }) => {
  const [selectedSiteToAssign, setSelectedSiteToAssign] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const assignedSites = sites.filter(site => site.assignedUsers?.includes(user.id));
  const unassignedSites = sites.filter(site => !site.assignedUsers?.includes(user.id));

  const handleAssignSite = async () => {
    if (!selectedSiteToAssign) {
      alert('Por favor, selecciona una web para asignar.');
      return;
    }
    setIsLoading(true);
    const siteRef = doc(db, 'sites', selectedSiteToAssign);
    try {
      await updateDoc(siteRef, { assignedUsers: arrayUnion(user.id) });
      alert('Web asignada con éxito.');
      setSelectedSiteToAssign('');
    } catch (error) {
      console.error("Error al asignar web:", error);
      alert('Ocurrió un error al asignar la web.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveSite = async (siteId) => {
    if (window.confirm('¿Estás seguro de que quieres quitar el acceso a esta web para este usuario?')) {
      setIsLoading(true);
      const siteRef = doc(db, 'sites', siteId);
      try {
        await updateDoc(siteRef, { assignedUsers: arrayRemove(user.id) });
        alert('Acceso a la web removido con éxito.');
      } catch (error) {
        console.error("Error al remover acceso a la web:", error);
        alert('Ocurrió un error.');
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <div>
      <h3>Páginas Asignadas</h3>
      <p>Gestiona las páginas web a las que <strong>{user.displayName}</strong> tiene acceso.</p>

      <h4 style={{ marginTop: '2rem' }}>Asignar Nueva Página</h4>
      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
        <select value={selectedSiteToAssign} onChange={(e) => setSelectedSiteToAssign(e.target.value)} style={{ flexGrow: 1 }}>
          <option value="">-- Selecciona una página --</option>
          {unassignedSites.map(site => <option key={site.id} value={site.id}>{site.name} ({site.domain})</option>)}
        </select>
        <button onClick={handleAssignSite} className="add-button" disabled={isLoading || !selectedSiteToAssign}>Asignar</button>
      </div>

      <h4 style={{ marginTop: '2rem' }}>Páginas Actualmente Asignadas</h4>
      {assignedSites.length > 0 ? (
        <div className="user-list">
          {assignedSites.map(site => (
            <div key={site.id} className="user-list-item">
              <div className="user-info"><strong>{site.name}</strong><span>{site.domain}</span></div>
              <button onClick={() => handleRemoveSite(site.id)} className="logout-button" style={{ borderColor: '#c53030', color: '#c53030' }} disabled={isLoading}>Remover</button>
            </div>
          ))}
        </div>
      ) : (
        <p>Este usuario no tiene ninguna página asignada.</p>
      )}
    </div>
  );
};

const SettingsTab = ({ user, onClose }) => {
  const [isLoading, setIsLoading] = useState(false);

  const toggleAccessStatus = async () => {
    const isBlocked = user.accessStatus === 'blocked';
    if (isBlocked) {
      if (window.confirm(`¿Estás seguro de que quieres desbloquear a ${user.displayName}?`)) {
        setIsLoading(true);
        const userRef = doc(db, 'users', user.id);
        try {
          await updateDoc(userRef, { accessStatus: 'active', blockReason: deleteField() });
          await logAdminAction('USER_ACCESS_UNBLOCKED', { targetUserId: user.id, targetUserEmail: user.email});
          alert('Acceso de usuario desbloqueado con éxito.');
          onClose();
        } catch (error) {
          console.error("Error al desbloquear el acceso:", error);
          alert('Ocurrió un error.');
        } finally {
          setIsLoading(false);
        }
      }
    } else {
      const reason = window.prompt(`Por favor, introduce un motivo para bloquear a ${user.displayName}:`);
      if (reason) {
        setIsLoading(true);
        const userRef = doc(db, 'users', user.id);
        try {
          await updateDoc(userRef, { accessStatus: 'blocked', blockReason: reason });
          await logAdminAction('USER_ACCESS_BLOCKED', { targetUserId: user.id, targetUserEmail: user.email, reason: reason});
          alert('Acceso de usuario bloqueado con éxito.');
          onClose();
        } catch (error) {
          console.error("Error al bloquear el acceso:", error);
          alert('Ocurrió un error.');
        } finally {
          setIsLoading(false);
        }
      }
    }
  };

  const isBlocked = user.accessStatus === 'blocked';

  return (
    <div>
      <h3>Configuración de Cuenta</h3>
      <p>El acceso de este usuario está actualmente <strong>{isBlocked ? 'Bloqueado' : 'Activo'}</strong>.</p>
      <p>{isBlocked ? 'El usuario no podrá iniciar sesión.' : 'Puedes bloquear el acceso para impedir que el usuario entre al panel.'}</p>
      <button onClick={toggleAccessStatus} className="add-button" style={{ backgroundColor: isBlocked ? '#48bb78' : '#c53030' }} disabled={isLoading}>
        {isLoading ? 'Actualizando...' : (isBlocked ? 'Desbloquear Acceso' : 'Bloquear Acceso')}
      </button>
    </div>
  );
};


const ManageUserModal = ({ user, sites, onClose }) => {
  const [activeTab, setActiveTab] = useState('informacion');

  const renderTabContent = () => {
    switch (activeTab) {
      case 'informacion':
        return <UserInfoTab user={user} />;
      case 'paginas':
        return <WebsTab user={user} sites={sites} />;
      case 'configuracion':
        return <SettingsTab user={user} onClose={onClose} />;
      case 'habilitar':
        return <EnableDisableTab user={user} onClose={onClose} />;
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
          <div className="admin-content" style={{ flexGrow: 1, minHeight: '250px' }}>
            {renderTabContent()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManageUserModal;