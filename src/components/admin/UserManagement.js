import React, { useState } from 'react';
import Modal from './Modal'; // Importa el nuevo componente Modal

// Iconos para los botones de acción
const EditIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>;
const DeleteIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>;

const UserManagement = ({ users, sites }) => {
  // Estado para controlar qué modal está abierto: 'add', 'edit', 'delete', o null
  const [modalState, setModalState] = useState({ type: null, user: null });

  // --- Funciones para manejar los modales ---
  const openModal = (type, user = null) => {
    setModalState({ type, user });
  };

  const closeModal = () => {
    setModalState({ type: null, user: null });
  };

  // --- Lógica para los formularios (a implementar) ---
  const handleAddUser = (e) => {
    e.preventDefault();
    console.log("Lógica para añadir usuario...");
    closeModal();
  };

  const handleEditUser = (e) => {
    e.preventDefault();
    console.log("Lógica para editar usuario...");
    closeModal();
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
        <form className="modal-form" onSubmit={handleAddUser}>
          <div className="form-group">
            <label htmlFor="displayName">Nombre</label>
            <input type="text" id="displayName" name="displayName" />
          </div>
          <div className="form-group">
            <label htmlFor="email">Correo Electrónico</label>
            <input type="email" id="email" name="email" />
          </div>
          <div className="modal-footer">
            <button type="button" className="button-secondary" onClick={closeModal}>Cancelar</button>
            <button type="submit" className="button-primary">Guardar Usuario</button>
          </div>
        </form>
      </Modal>

      {/* --- MODAL PARA EDITAR USUARIO --- */}
      <Modal show={modalState.type === 'edit'} onClose={closeModal} title="Editar Usuario">
        {modalState.user && (
          <form className="modal-form" onSubmit={handleEditUser}>
            <fieldset>
              <legend>Información Básica</legend>
              <div className="form-group">
                <label htmlFor="edit-displayName">Nombre</label>
                <input type="text" id="edit-displayName" name="displayName" defaultValue={modalState.user.displayName} />
              </div>
            </fieldset>

            <fieldset>
              <legend>Permisos y Acceso</legend>
              <div className="form-group">
                <label htmlFor="edit-role">Rol</label>
                <select id="edit-role" name="role" defaultValue={modalState.user.role}>
                  <option value="usuario">Usuario</option>
                  <option value="staff">Staff</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="edit-status">Estado</label>
                <select id="edit-status" name="status" defaultValue={modalState.user.status || 'active'}>
                  <option value="active">Activo</option>
                  <option value="suspended">Suspendido</option>
                  <option value="disabled">Deshabilitado</option>
                </select>
              </div>
            </fieldset>
            
            <fieldset>
              <legend>Asignaciones</legend>
              <div className="form-group">
                <label htmlFor="edit-sites">Webs Asignadas</label>
                <select id="edit-sites" name="sites" multiple defaultValue={modalState.user.sites || []}>
                  {sites.map(site => (<option key={site.id} value={site.id}>{site.name}</option>))}
                </select>
                <small>Mantén pulsado Ctrl (o Cmd en Mac) para seleccionar varias.</small>
              </div>
            </fieldset>

            <div className="modal-footer">
              <button type="button" className="button-secondary" onClick={closeModal}>Cancelar</button>
              <button type="submit" className="button-primary">Guardar Cambios</button>
            </div>
          </form>
        )}
      </Modal>

      {/* --- MODAL DE CONFIRMACIÓN PARA ELIMINAR --- */}
      <Modal show={modalState.type === 'delete'} onClose={closeModal} title="Confirmar Eliminación">
        <p>¿Estás seguro de que quieres eliminar al usuario <strong>{modalState.user?.displayName}</strong>? Esta acción no se puede deshacer.</p>
        <div className="modal-footer">
          <button type="button" className="button-secondary" onClick={closeModal}>Cancelar</button>
          <button type="button" className="button-danger">Confirmar Eliminación</button>
        </div>
      </Modal>
    </div>
  );
};

export default UserManagement;