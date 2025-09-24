import { useState, useEffect } from 'react';
import { auth, db } from '../config';
import { signOut } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { useUserData } from '../hooks/useUserData';
import {
  collection,
  onSnapshot,
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
  updateDoc,
  deleteField,
  arrayUnion,
  arrayRemove,
  addDoc
} from 'firebase/firestore';
import './Dashboard.css'; // Importa los estilos del Dashboard
import './AdminDashboard.css'; // Importa los estilos del Admin Dashboard
import AccountDisabled from './AccountDisabled'; // Importamos la nueva pantalla
import FirstLogin from './FirstLogin'; // Importamos el nuevo componente

// --- Helper para Logs ---
const logAdminAction = async (action, details = {}) => {
  const currentUser = auth.currentUser;
  if (!currentUser) return; // No debería ocurrir si el usuario es admin

  try {
    await addDoc(collection(db, 'auditLogs'), {
      timestamp: serverTimestamp(),
      actorId: currentUser.uid,
      actorEmail: currentUser.email,
      action,
      details,
      type: 'PANEL' // Para diferenciar logs de panel de los de web
    });
  } catch (error) {
    console.error("Error al escribir en el log de auditoría:", error);
  }
};

function Dashboard() {
  const navigate = useNavigate();
  const user = auth.currentUser;
  const { userData, loading } = useUserData();
  const [isMaintenance, setIsMaintenance] = useState(false);
  const [loadingConfig, setLoadingConfig] = useState(true);

  const handleLogout = async () => {
    try {
      await logAdminAction('USER_LOGOUT');
      await signOut(auth);
      navigate('/login'); // Redirect to login after logout
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
    }
  };

  useEffect(() => {
    const configRef = doc(db, 'panelConfig', 'main');
    const unsubscribe = onSnapshot(configRef, (docSnap) => {
      if (docSnap.exists() && docSnap.data().maintenanceMode === true) {
        setIsMaintenance(true);
      } else {
        setIsMaintenance(false);
      }
      setLoadingConfig(false);
    });
    return () => unsubscribe();
  }, []);

  // Muestra un mensaje de carga mientras se obtienen los datos del usuario
  if (loading || loadingConfig) {
    return <div>Cargando panel...</div>;
  }

  // Si el modo mantenimiento está activo y el usuario no es admin, muestra la página de mantenimiento.
  if (isMaintenance && userData?.role !== 'admin') {
    return <MaintenancePage />;
  }

  // Si el usuario está autenticado pero no tiene datos (perfil), es su primer login.
  if (user && !userData) {
    return <FirstLogin user={user} />;
  }

  // Si el usuario tiene su acceso bloqueado, lo deslogueamos y mostramos un mensaje.
  if (userData?.accessStatus === 'blocked') {
    // Mostramos la página de bloqueo con la información del usuario.
    return <BlockedPage userData={userData} />;
  }

  // Si el usuario tiene perfil pero está inhabilitado, le mostramos la pantalla de token.
  if (userData?.status === 'disabled') {
    return <AccountDisabled userData={userData} />;
  }

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <h1 className="header-title">Panel de Control</h1>
        <button onClick={handleLogout} className="logout-button">
          Cerrar Sesión
        </button>
      </header>
      <main className="dashboard-content">
        <div className="welcome-message">
          {/* Saludamos usando el nombre de Firestore si existe */}
          <h1>Bienvenido, {userData?.displayName || user?.email}</h1>
          <p>Rol: <strong>{userData?.role || 'No definido'}</strong></p>
        </div>

        {/* 3. Renderizado condicional basado en el rol */}
        {userData?.role === 'admin' && <AdminDashboard />}
        {userData?.role === 'staff' && <StaffDashboard />}
        {userData?.role === 'usuario' && <UserDashboard />}
      </main>
    </div>
  );
}

// --- Componentes específicos para cada rol ---
// Por ahora, son solo marcadores de posición.

const AdminDashboard = () => {
  const [activeSection, setActiveSection] = useState('usuarios');
  const [users, setUsers] = useState([]);
  const [sites, setSites] = useState([]);

  useEffect(() => {
    // Cargar la lista de usuarios una sola vez para todo el panel de admin
    const usersUnsubscribe = onSnapshot(collection(db, "users"), (snapshot) => {
      const usersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setUsers(usersData);
    }, (error) => {
      console.error("Error al obtener la lista de usuarios para el admin:", error);
    });

    // Cargar la lista de sitios una sola vez para todo el panel de admin
    const sitesUnsubscribe = onSnapshot(collection(db, "sites"), (snapshot) => {
      const sitesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setSites(sitesData);
    }, (error) => {
      console.error("Error al obtener la lista de sitios para el admin:", error);
    });

    return () => {
      usersUnsubscribe();
      sitesUnsubscribe();
    };
  }, []);

  const renderSection = () => {
    switch (activeSection) {
      case 'usuarios':
        return <UserManagement users={users} sites={sites} />;
      case 'webs':
        return <WebManagement users={users} />;
      case 'tickets':
        return <TicketManagement users={users} />;
      case 'metricas':
        return <Metrics />;
      case 'logs':
        return <Logs />;
      case 'config':
        return <Config />;
      default:
        return <UserManagement />;
    }
  };

  const sections = [
    { id: 'usuarios', label: 'Usuarios' },
    { id: 'webs', label: 'Webs' },
    { id: 'tickets', label: 'Tickets' },
    { id: 'metricas', label: 'Métricas' },
    { id: 'logs', label: 'Logs' },
    { id: 'config', label: 'Configuración' },
  ];

  return (
    <div className="admin-dashboard">
      <aside className="admin-sidebar">
        <nav className="admin-sidebar-nav">
          <ul>
            {sections.map((section) => (
              <li
                key={section.id}
                className={activeSection === section.id ? 'active' : ''}
                onClick={() => setActiveSection(section.id)}
              >
                {section.label}
              </li>
            ))}
          </ul>
        </nav>
      </aside>
      <main className="admin-content">
        {renderSection()}
      </main>
    </div>
  );
};

// --- Secciones del Panel de Administrador (Marcadores de posición) ---

const UserManagement = ({ users, sites, logAdminAction }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [managingUser, setManagingUser] = useState(null); // Estado para el usuario a gestionar
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Esta lógica ahora se ejecutará solo si el componente se renderiza,
    // y solo se renderizará para un admin.
      setLoading(false);
  }, []); // Este useEffect ahora solo controla el estado de 'loading'

  return (
    <div>
      <div className="section-header">
        <h2>Gestión de Usuarios</h2>
        <button className="add-button" onClick={() => setIsModalOpen(true)}>
          Añadir Usuario
        </button>
      </div>
      <p>Desde aquí podrás administrar todos los usuarios de la plataforma.</p>
      
      {users.length === 0 && !loading ? <p>No hay usuarios para mostrar.</p> : null}
      {loading ? <p>Cargando usuarios...</p> : (
        <div className="user-list">
        {users.map(user => (
          <div key={user.id} className="user-list-item">
            <div className="user-info">
              <div className="user-info-header">
                <strong>{user.displayName}</strong>
                {user.status === 'disabled' && (
                  <span className="user-status-tag status-disabled">Inhabilitado</span>
                )}
              </div>
              <span>{user.email} - Rol: {user.role}</span>
            </div>
            <button className="logout-button" onClick={() => setManagingUser(user)}>Gestionar</button>
          </div>
        ))}
        </div>
      )}

      {isModalOpen && <AddUserModal onClose={() => setIsModalOpen(false)} />}
      {managingUser && <ManageUserModal user={managingUser} sites={sites} onClose={() => setManagingUser(null)} />}
    </div>
  );
};

const AddUserModal = ({ onClose }) => {
  const [paymentType, setPaymentType] = useState('paypal');
  const [formData, setFormData] = useState({
    nombre: '',
    uid: '', // Nuevo campo para el UID
    apellidos: '',
    telefono: '',
    email: '',
    paypalEmail: '',
    invoiceCode: '',
    serviceType: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    if (!formData.uid.trim()) {
      setError('El campo UID es obligatorio.');
      setIsLoading(false);
      return;
    }

    try {
      // 1. Verificamos que el perfil no exista ya en la colección 'users'
      const userRef = doc(db, 'users', formData.uid);
      if ((await getDoc(userRef)).exists()) {
        throw new Error("Ya existe un perfil para este UID.");
      }

      // 2. Si no existe, creamos el documento del usuario con estado 'inhabilitado'
      const verificationToken = Math.random().toString(36).substring(2, 10).toUpperCase();
      const newUserDoc = {
        displayName: `${formData.nombre} ${formData.apellidos}`,
        email: formData.email,
        phone: formData.telefono || "",
        role: "usuario",
        status: "disabled", // Estado inicial
        verificationToken: verificationToken, // Token para habilitación
        payment: {
          type: paymentType,
          paypalEmail: formData.paypalEmail || "",
        },
        invoiceCode: formData.invoiceCode || "",
        serviceType: formData.serviceType || "",
        createdAt: serverTimestamp(),
      };

      await setDoc(userRef, newUserDoc);

      console.log(`Perfil inhabilitado para ${formData.uid} creado con éxito.`);
      onClose(); // Cierra el modal
    } catch (err) {
      console.error("Error al crear usuario:", err);
      setError(err.message || 'Ocurrió un error. Inténtalo de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Añadir Nuevo Usuario</h3>
          <button onClick={onClose} className="close-button">&times;</button>
        </div>
        <form onSubmit={handleFormSubmit}>
          <div className="modal-form">
            <div className="form-group">
              <label htmlFor="uid">UID del Usuario</label>
              <input type="text" id="uid" value={formData.uid} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label htmlFor="nombre">Nombre</label>
              <input type="text" id="nombre" value={formData.nombre} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label htmlFor="apellidos">Apellidos</label>
              <input type="text" id="apellidos" value={formData.apellidos} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label htmlFor="telefono">Teléfono</label>
              <input type="tel" id="telefono" value={formData.telefono} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input type="email" id="email" value={formData.email} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label htmlFor="paymentType">Tipo de Pago</label>
              <select id="paymentType" value={paymentType} onChange={(e) => setPaymentType(e.target.value)}>
                <option value="paypal">PayPal</option>
                <option value="transferencia">Transferencia</option>
              </select>
            </div>
            
            {paymentType === 'paypal' && (
              <div className="form-group">
                <label htmlFor="paypalEmail">Email de PayPal</label>
                <input type="email" id="paypalEmail" value={formData.paypalEmail} onChange={handleChange} placeholder="correo@paypal.com" />
              </div>
            )}

            <div className="form-group full-width">
              <label htmlFor="invoiceCode">Código de Factura</label>
              <input type="text" id="invoiceCode" value={formData.invoiceCode} onChange={handleChange} />
            </div>
            <div className="form-group full-width">
              <label htmlFor="serviceType">Tipo de Servicio</label>
              <input type="text" id="serviceType" value={formData.serviceType} onChange={handleChange} />
            </div>
          </div>
          {error && <p className="login-error" style={{marginTop: '1rem'}}>{error}</p>}
          <div className="modal-footer">
            <button type="button" className="logout-button" onClick={onClose}>Cancelar</button>
            <button type="submit" className="add-button" disabled={isLoading}>
              {isLoading ? 'Guardando...' : 'Guardar Usuario'}
            </button>
          </div>
        </form>
      </div>
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
        return <EnableDisableTab user={user} onClose={onClose} logAdminAction={logAdminAction} />;
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

const EnableDisableTab = ({ user, onClose, logAdminAction }) => {
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

const UserInfoTab = ({ user, onClose }) => {
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
      // Nota: Cambiar el email aquí no lo cambia en Firebase Authentication.
      // Eso requeriría una Firebase Function para mayor seguridad.
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

  // Filtra para encontrar los sitios ya asignados a este usuario
  const assignedSites = sites.filter(site => site.assignedUsers?.includes(user.id));

  // Filtra para encontrar los sitios que aún no están asignados a este usuario
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
    if (isBlocked) {
      // Lógica para desbloquear
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
      // Lógica para bloquear, pidiendo un motivo
      const reason = window.prompt(`Por favor, introduce un motivo para bloquear a ${user.displayName}:`);
      if (reason) { // Solo proceder si el admin escribe un motivo
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

const AddWebModal = ({ users, onClose }) => {
  const [hostingType, setHostingType] = useState('github');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    const formData = new FormData(e.target);
    const webUid = formData.get('webUid');

    if (!webUid || !webUid.trim()) {
      setError('El campo UID de la Web es obligatorio.');
      setIsLoading(false);
      return;
    }

    const newWebData = {
      name: formData.get('webName'),
      domain: formData.get('domain'),
      hostingType: hostingType,
      githubRepo: formData.get('githubRepo') || '',
      ownerId: formData.get('ownerId'),
      status: 'online', // Estado por defecto
      createdAt: serverTimestamp(),
    };

    try {
      const webDocRef = doc(db, 'sites', webUid);
      const docSnap = await getDoc(webDocRef);

      if (docSnap.exists()) {
        throw new Error("Ya existe una web con este UID. Por favor, elige otro.");
      }

      await setDoc(webDocRef, newWebData);
      console.log("Nueva web añadida con éxito");
      onClose();
    } catch (err) {
      console.error("Error al añadir la web:", err);
      setError(err.message || "Ocurrió un error al guardar la web.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Añadir Nueva Web</h3>
          <button onClick={onClose} className="close-button">&times;</button>
        </div>
        <form onSubmit={handleFormSubmit} id="add-web-form">
          <div className="modal-form">
            <div className="form-group full-width">
              <label htmlFor="webUid">UID de la Web (ID único)</label>
              <input type="text" id="webUid" name="webUid" required />
            </div>
            <div className="form-group full-width">
              <label htmlFor="webName">Nombre del Sitio</label>
              <input type="text" id="webName" name="webName" required />
            </div>
            <div className="form-group">
              <label htmlFor="domain">Dominio</label>
              <input type="text" id="domain" name="domain" placeholder="ejemplo.com" required />
            </div>
            <div className="form-group">
              <label htmlFor="hostingType">Tipo de Hosting</label>
              <select id="hostingType" name="hostingType" value={hostingType} onChange={(e) => setHostingType(e.target.value)}>
                <option value="github">GitHub/Netlify</option>
                <option value="wordpress">WordPress</option>
              </select>
            </div>
            
            {hostingType === 'github' && (
              <div className="form-group full-width">
                <label htmlFor="githubRepo">Repositorio de GitHub</label>
                <input type="text" id="githubRepo" name="githubRepo" placeholder="usuario/repo-name" />
              </div>
            )}

            <div className="form-group full-width">
              <label htmlFor="ownerId">Propietario</label>
              <select id="ownerId" name="ownerId" required>
                <option value="">-- Selecciona un usuario --</option>
                {users.map(user => <option key={user.id} value={user.id}>{user.displayName}</option>)}
              </select>
            </div>
          </div>
          {error && <p className="login-error" style={{marginTop: '1rem'}}>{error}</p>}
          <div className="modal-footer">
            <button type="button" className="logout-button" onClick={onClose}>Cancelar</button>
            <button type="submit" className="add-button" disabled={isLoading}>
              {isLoading ? 'Guardando...' : 'Guardar Web'}
            </button>
          </div>
        </form>
      </div>
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
  return (
    <div>
      <h3>Configuración de la Web</h3>
      <h4>Modo Mantenimiento</h4>
      <p>Poner la página web real en modo mantenimiento de forma remota.</p>
      <button className="add-button">Activar Mantenimiento</button>
      <h4 style={{marginTop: '2rem'}}>Extracción de Datos</h4>
      <p>Descargar un archivo con los datos de la página (métricas, base de datos, etc.).</p>
      <button className="logout-button">Descargar Datos</button>
    </div>
  );
};

const TicketManagement = () => (
  <div>
    <h2>Gestión de Tickets</h2>
    <p>Centro de soporte para gestionar las solicitudes de los clientes.</p>
    <ul>
      <li>Ver todos los tickets: nuevos, en proceso y cerrados.</li>
      <li>Los tickets nuevos tendrán una etiqueta distintiva.</li>
      <li>Al abrir un ticket, se te asignará y quedará bloqueado para otros miembros del staff.</li>
    </ul>
  </div>
);

const Metrics = () => <div><h2>Métricas del Panel</h2><p>Visualización de datos clave sobre la actividad en el panel de control.</p></div>;

const Logs = () => (
  <div>
    <h2>Logs del Sistema</h2>
    <p>Registro detallado de toda la actividad para auditoría y depuración.</p>
    <ul>
      <li><b>Logs del Panel:</b> Intentos de login, sesiones activas, acciones realizadas por cada usuario (creación, edición, etc.).</li>
      <li><b>Logs de Web:</b> Acceso a los registros específicos de cada sitio web individualmente.</li>
    </ul>
  </div>
);

const Config = () => <div><h2>Configuración del Panel</h2><p>Ajustes globales para la plataforma.</p><ul><li>Activar/desactivar el modo mantenimiento.</li><li>Opciones para la extracción y copia de seguridad de datos.</li></ul></div>;

const StaffDashboard = () => (
  <div>
    <h2>Vista de Staff</h2>
    <p>Aquí podrás ver los tickets de soporte y tus sitios personales.</p>
  </div>
);

const UserDashboard = () => (
  <div className="sites-grid">
    {/* Este es el contenido que ya tenías para el usuario */}
    <div className="site-card">
      <h3>Mi Sitio Web Corporativo</h3>
      <p>cliente-acme.netlify.app</p>
    </div>
  </div>
);

const MaintenancePage = () => (
  <div style={{ padding: '50px', textAlign: 'center' }}>
    <h1>Panel en Mantenimiento</h1>
    <p>Estamos realizando mejoras en la plataforma. Por favor, vuelve a intentarlo más tarde.</p>
    <p>Si eres administrador, puedes acceder para desactivar este modo.</p>
    <button onClick={() => signOut(auth)} className="logout-button">Cerrar Sesión</button>
  </div>
);

const BlockedPage = ({ userData }) => (
  <div style={{ padding: '50px', textAlign: 'center' }}>
    <h1>Acceso Bloqueado</h1>
    <p>Tu acceso a esta plataforma ha sido bloqueado por un administrador.</p>
    {userData?.blockReason && (
      <p style={{ color: '#c53030' }}><strong>Motivo:</strong> {userData.blockReason}</p>
    )}
    <p>Por favor, contacta con el soporte si crees que se trata de un error.</p>
    <button onClick={() => signOut(auth)} className="logout-button">Cerrar Sesión</button>
  </div>
);

export default Dashboard;