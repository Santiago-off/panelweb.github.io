import React, { useState } from 'react';
import Modal from './Modal'; // Importa el nuevo componente Modal
import { doc, updateDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { db } from '../../config';

// Iconos para los botones de acción
const EditIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>;
const DeleteIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>;

const UserManagement = ({ users, sites }) => {
  // Estado para controlar qué modal está abierto: 'add', 'edit', 'delete', o null
  const [modalState, setModalState] = useState({ type: null, user: null });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('info');
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({});

  // --- Funciones para manejar los modales ---
  const openModal = (type, user = null) => {
    setModalState({ type, user });
    if (type === 'edit' && user) {
      // Aplanamos la estructura para el formulario
      setFormData({
        ...user,
        paypalEmail: user.payment?.paypalEmail || user.paypalEmail || '', // Prioritize nested, fallback to root
        paymentType: user.payment?.type || 'transferencia',
      });
    } else if (type === 'add') {
      setFormData({ role: 'usuario', status: 'active', accessStatus: 'active' }); // Inicializa con valores por defecto
    } else {
      setFormData({});
    }
  };

  const closeModal = () => {
    if (!isSubmitting) {
      setModalState({ type: null, user: null }); // Resetea el estado del modal
      setActiveTab('info'); // Resetea la pestaña activa al cerrar
      setFormData({}); // Limpia los datos del formulario
      setShowPassword(false); // Oculta la contraseña al cerrar
    }
  };

  const handleFormChange = (e) => {
    const { name, value, type, options } = e.target;
    if (type === 'select-multiple') {
      const selectedValues = Array.from(options).filter(o => o.selected).map(o => o.value);
      setFormData(prev => ({ ...prev, [name]: selectedValues }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  // --- Lógica para los formularios (a implementar) ---
  const handleAddUser = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    // Usa los datos del estado del formulario
    const newUser = {
      email: formData.email,
      password: formData.password,
      displayName: formData.displayName,
      role: formData.role,
    };

    try {
      const functions = getFunctions();
      const createUser = httpsCallable(functions, 'createUser');
      const result = await createUser(newUser);
      const uid = result.data.uid;

      // Ahora, crea el documento en Firestore para este nuevo usuario
      const userDocRef = doc(db, 'users', uid);
      await setDoc(userDocRef, {
        displayName: newUser.displayName,
        email: newUser.email,
        role: newUser.role,
        status: 'active',
        accessStatus: 'active',
        createdAt: serverTimestamp(),
      });
      console.log("Usuario creado con éxito en Auth y Firestore.");
    } catch (error) {
      console.error("Error al crear el usuario:", error);
    } finally {
      setIsSubmitting(false);
      closeModal();
    }
  };

  const handleEditUser = async (e) => {
    e.preventDefault();
    if (!modalState.user) return;
    setIsSubmitting(true);

    // Usa los datos del estado del formulario en lugar de FormData
    const updatedData = {
      displayName: formData.displayName,
      role: formData.role,
      status: formData.status,
      sites: formData.sites || [],
      phone: formData.phone,
      accessStatus: formData.accessStatus,
      invoiceCode: formData.invoiceCode,
      serviceType: formData.serviceType,
      // El campo paypalEmail se guarda dentro del objeto payment para consistencia
      payment: {
        type: formData.paymentType || 'transferencia',
        paypalEmail: formData.paypalEmail || '',
      },
    };

    try {
      const userRef = doc(db, 'users', modalState.user.id);
      await updateDoc(userRef, updatedData);
      console.log("Usuario actualizado con éxito");
    } catch (error) {
      console.error("Error al actualizar el usuario:", error);
      // Aquí podrías mostrar una notificación de error al usuario
    } finally {
      setIsSubmitting(false);
      closeModal();
    }
  };

  const handleDeleteUser = async () => {
    if (!modalState.user) return;
    setIsSubmitting(true);
    try {
      const functions = getFunctions();
      const deleteUser = httpsCallable(functions, 'deleteUser'); // Llama a la Cloud Function
      await deleteUser({ uid: modalState.user.id });
      console.log("Usuario eliminado con éxito");
    } catch (error) {
      console.error("Error al eliminar el usuario:", error);
    } finally {
      setIsSubmitting(false);
      closeModal();
    }
  };

  return (
    <div>
      <div className="section-header">
        <h2>Gestión de Usuarios</h2>
        <button className="button-primary" onClick={() => openModal('add')}>
          Añadir Usuario
        </button>
      </div>

      <p className="section-description">
        Aquí puedes ver, editar y gestionar todos los usuarios registrados en el sistema.
      </p>

      {/* --- Tabla de Usuarios --- */}
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Email</th>
              <th>Rol</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.id}>
                <td>{user.displayName || 'N/A'}</td>
                <td>{user.email}</td>
                <td><span className={`role-tag role-${user.role}`}>{user.role}</span></td>
                <td><span className={`status-tag status-${user.status || 'active'}`}>{user.status || 'active'}</span></td>
                <td className="action-buttons">
                  <button className="button-icon" onClick={() => openModal('edit', user)}><EditIcon /> Editar</button>
                  <button className="button-icon button-danger" onClick={() => openModal('delete', user)}><DeleteIcon /> Eliminar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* --- MODAL PARA AÑADIR USUARIO --- */}
      <Modal show={modalState.type === 'add'} onClose={closeModal} title="Añadir Nuevo Usuario">
        <form className="modal-form" onSubmit={handleAddUser} noValidate>
          <fieldset>
            <legend>Credenciales de Acceso</legend>
            <div className="form-group">
              <label htmlFor="add-email">Correo Electrónico</label>
              <input type="email" id="add-email" name="email" value={formData.email || ''} onChange={handleFormChange} required />
            </div>
            <div className="form-group">
              <label htmlFor="add-password">Contraseña</label>
              <div className="password-input-wrapper">
                <input type={showPassword ? 'text' : 'password'} id="add-password" name="password" value={formData.password || ''} onChange={handleFormChange} required />
                <button type="button" className="password-toggle-button" onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? 'Ocultar' : 'Mostrar'}
                </button>
              </div>
            </div>
          </fieldset>
          <fieldset>
            <legend>Información y Permisos</legend>
            <div className="form-group">
              <label htmlFor="add-displayName">Nombre Completo</label>
              <input type="text" id="add-displayName" name="displayName" value={formData.displayName || ''} onChange={handleFormChange} required />
            </div>
            <div className="form-group">
              <label htmlFor="add-role">Rol Inicial</label>
              <select id="add-role" name="role" value={formData.role || 'usuario'} onChange={handleFormChange}>
                <option value="usuario">Usuario</option>
                <option value="staff">Staff</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          </fieldset>
          <div className="modal-footer">
            <button type="button" className="button-secondary" onClick={closeModal} disabled={isSubmitting}>Cancelar</button>
            <button type="submit" className="button-primary" disabled={isSubmitting}>{isSubmitting ? 'Creando...' : 'Crear Usuario'}</button>
          </div>
        </form>
      </Modal>

      {/* --- MODAL PARA EDITAR USUARIO --- */}
      <Modal show={modalState.type === 'edit'} onClose={closeModal} title="Editar Usuario">
        {modalState.user && (
          <form className="modal-form" onSubmit={handleEditUser} noValidate>
            <div className="modal-tabs">
              <button type="button" className={`tab-button ${activeTab === 'info' ? 'active' : ''}`} onClick={() => setActiveTab('info')}>Información</button>
              <button type="button" className={`tab-button ${activeTab === 'permissions' ? 'active' : ''}`} onClick={() => setActiveTab('permissions')}>Permisos</button>
              <button type="button" className={`tab-button ${activeTab === 'billing' ? 'active' : ''}`} onClick={() => setActiveTab('billing')}>Facturación</button>
              <button type="button" className={`tab-button ${activeTab === 'assignments' ? 'active' : ''}`} onClick={() => setActiveTab('assignments')}>Asignaciones</button>
            </div>

            <div className="tab-content">
              {activeTab === 'info' && (
                <fieldset>
                  <legend>Información Básica</legend>
                  <div className="form-group">
                    <label htmlFor="edit-displayName">Nombre</label>
                    <input type="text" id="edit-displayName" name="displayName" value={formData.displayName || ''} onChange={handleFormChange} />
                  </div>
                  <div className="form-group">
                    <label htmlFor="edit-email">Correo Electrónico</label>
                    <input type="email" id="edit-email" name="email" value={formData.email || ''} readOnly />
                  </div>
                  <div className="form-group">
                    <label htmlFor="edit-phone">Teléfono</label>
                    <input type="tel" id="edit-phone" name="phone" value={formData.phone || ''} onChange={handleFormChange} />
                  </div>
                  <div className="form-group">
                    <label>Fecha de Creación</label>
                    <input type="text" value={formData.createdAt?.toDate().toLocaleString() || 'N/A'} readOnly />
                  </div>
                </fieldset>
              )}

              {activeTab === 'permissions' && (
                <fieldset>
                  <legend>Permisos y Acceso</legend>
                  <div className="form-group">
                    <label htmlFor="edit-role">Rol</label>
                    <select id="edit-role" name="role" value={formData.role || 'usuario'} onChange={handleFormChange}>
                      <option value="usuario">Usuario</option>
                      <option value="staff">Staff</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label htmlFor="edit-status">Estado de la Cuenta</label>
                    <select id="edit-status" name="status" value={formData.status || 'active'} onChange={handleFormChange}>
                      <option value="active">Activo</option>
                      <option value="suspended">Suspendido</option>
                      <option value="disabled">Deshabilitado</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label htmlFor="edit-accessStatus">Estado de Acceso</label>
                    <select id="edit-accessStatus" name="accessStatus" value={formData.accessStatus || 'active'} onChange={handleFormChange}>
                      <option value="active">Activo</option>
                      <option value="blocked">Bloqueado</option>
                    </select>
                  </div>
                </fieldset>
              )}

              {activeTab === 'billing' && (
                <fieldset>
                  <legend>Facturación y Pagos</legend>
                  <div className="form-group">
                    <label htmlFor="edit-invoiceCode">Código de Factura</label>
                    <input type="text" id="edit-invoiceCode" name="invoiceCode" value={formData.invoiceCode || ''} onChange={handleFormChange} />
                  </div>
                  <div className="form-group">
                    <label htmlFor="edit-serviceType">Tipo de Servicio</label>
                    <input type="text" id="edit-serviceType" name="serviceType" value={formData.serviceType || ''} onChange={handleFormChange} />
                  </div>
                  <div className="form-group">
                    <label htmlFor="edit-paymentType">Método de Pago</label>
                    <select id="edit-paymentType" name="paymentType" value={formData.paymentType || 'transferencia'} onChange={handleFormChange}>
                      <option value="transferencia">Transferencia</option>
                      <option value="paypal">PayPal</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label htmlFor="edit-paypalEmail">Email de PayPal</label>
                    <input type="email" id="edit-paypalEmail" name="paypalEmail" value={formData.paypalEmail || ''} onChange={handleFormChange} />
                  </div>
                </fieldset>
              )}

              {activeTab === 'assignments' && (
                <fieldset>
                  <legend>Asignaciones</legend>
                  <div className="form-group">
                    <label htmlFor="edit-sites">Webs Asignadas</label>
                    <select id="edit-sites" name="sites" multiple value={formData.sites || []} onChange={handleFormChange}>
                      {sites.map(site => (<option key={site.id} value={site.id}>{site.name}</option>))}
                    </select>
                    <small>Mantén pulsado Ctrl (o Cmd en Mac) para seleccionar varias.</small>
                  </div>
                </fieldset>
              )}
            </div>
            <div className="modal-footer">
              <button type="button" className="button-secondary" onClick={closeModal} disabled={isSubmitting}>Cancelar</button>
              <button type="submit" className="button-primary" disabled={isSubmitting}>{isSubmitting ? 'Guardando...' : 'Guardar Cambios'}</button>
            </div>
          </form>
        )}
      </Modal>

      {/* --- MODAL DE CONFIRMACIÓN PARA ELIMINAR --- */}
      <Modal show={modalState.type === 'delete'} onClose={closeModal} title="Confirmar Eliminación">
        <p>¿Estás seguro de que quieres eliminar al usuario <strong>{modalState.user?.displayName}</strong>? Esta acción no se puede deshacer.</p>
        <div className="modal-footer">
          <button type="button" className="button-secondary" onClick={closeModal} disabled={isSubmitting}>Cancelar</button>
          <button type="button" className="button-danger" onClick={handleDeleteUser} disabled={isSubmitting}>{isSubmitting ? 'Eliminando...' : 'Confirmar Eliminación'}</button>
        </div>
      </Modal>
    </div>
  );
};

export default UserManagement;