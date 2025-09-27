import React, { useState } from 'react';
import Modal from './Modal';
import { db } from '../../config';
import { collection, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';

// Iconos para los botones de acción
const EditIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>;
const DeleteIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>;

const WebManagement = ({ sites, users }) => {
  const [modalState, setModalState] = useState({ type: null, site: null });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('info');
  const [formData, setFormData] = useState({});

  const openModal = (type, site = null) => {
    setModalState({ type, site });
    // Inicializa el estado del formulario con los datos del sitio o un objeto vacío
    setFormData(site || { name: '', url: '', status: 'active', assignedUser: '', notes: '' });
    setActiveTab('info'); // Siempre empieza en la primera pestaña
  };
  const closeModal = () => {
    if (!isSubmitting) {
      setModalState({ type: null, site: null });
      setFormData({}); // Limpia los datos del formulario al cerrar
    }
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Usa los datos del estado del formulario en lugar de FormData
    const siteData = { ...formData, assignedUser: formData.assignedUser || null };

    try {
      if (modalState.type === 'add') {
        await addDoc(collection(db, 'sites'), siteData);
        console.log("Sitio añadido con éxito");
      } else if (modalState.type === 'edit' && modalState.site) {
        const siteRef = doc(db, 'sites', modalState.site.id);
        await updateDoc(siteRef, siteData);
        console.log("Sitio actualizado con éxito");
      }
    } catch (error) {
      console.error("Error al guardar el sitio:", error);
    } finally {
      setIsSubmitting(false);
      closeModal();
    }
  };

  const handleDelete = async () => {
    if (!modalState.site) return;
    setIsSubmitting(true);
    try {
      const siteRef = doc(db, 'sites', modalState.site.id);
      await deleteDoc(siteRef);
      console.log("Sitio eliminado con éxito");
    } catch (error) {
      console.error("Error al eliminar el sitio:", error);
    } finally {
      setIsSubmitting(false);
      closeModal();
    }
  };

  // Función para encontrar el nombre del usuario asignado a un sitio
  const getAssignedUserName = (userId) => {
    if (!userId) return <span className="unassigned-user">No asignado</span>;
    const user = users.find(u => u.id === userId);
    return user ? user.displayName : 'Usuario no encontrado';
  };

  return (
    <div>
      <div className="section-header">
        <h2>Gestión de Sitios Web</h2>
        <button className="button-primary" onClick={() => openModal('add')}>
          Añadir Sitio Web
        </button>
      </div>

      <p className="section-description">
        Administra los sitios web de los clientes, asigna usuarios y gestiona su estado.
      </p>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Nombre del Sitio</th>
              <th>URL</th>
              <th>Usuario Asignado</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {sites.length > 0 ? (
              sites.map(site => (
                <tr key={site.id}>
                  <td>{site.name}</td>
                  <td><a href={site.url} target="_blank" rel="noopener noreferrer">{site.url}</a></td>
                  <td>{getAssignedUserName(site.assignedUser)}</td>
                  <td><span className={`status-tag status-${site.status || 'active'}`}>{site.status || 'active'}</span></td>
                  <td className="action-buttons">
                    <button className="button-icon" onClick={() => openModal('edit', site)}><EditIcon /> Editar</button>
                    <button className="button-icon button-danger" onClick={() => openModal('delete', site)}><DeleteIcon /> Eliminar</button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" className="empty-table-message">No hay sitios web registrados.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* --- MODAL PARA AÑADIR/EDITAR SITIO --- */}
      <Modal 
        show={modalState.type === 'add' || modalState.type === 'edit'} 
        onClose={closeModal} 
        title={modalState.type === 'add' ? 'Añadir Nuevo Sitio Web' : 'Editar Sitio Web'}
      >
        <form className="modal-form" onSubmit={handleSubmit}>
          <div className="modal-tabs">
            <button type="button" className={`tab-button ${activeTab === 'info' ? 'active' : ''}`} onClick={() => setActiveTab('info')}>Información</button>
            <button type="button" className={`tab-button ${activeTab === 'assignment' ? 'active' : ''}`} onClick={() => setActiveTab('assignment')}>Asignación</button>
            <button type="button" className={`tab-button ${activeTab === 'notes' ? 'active' : ''}`} onClick={() => setActiveTab('notes')}>Notas</button>
          </div>

          <div className="tab-content">
            {activeTab === 'info' && (
              <fieldset>
                <legend>Información del Sitio</legend>
                <div className="form-group">
                  <label htmlFor="site-name">Nombre del Sitio</label>
                  <input type="text" id="site-name" name="name" value={formData.name || ''} onChange={handleFormChange} required />
                </div>
                <div className="form-group">
                  <label htmlFor="site-url">URL</label>
                  <input type="url" id="site-url" name="url" value={formData.url || ''} onChange={handleFormChange} required />
                </div>
                <div className="form-group">
                  <label htmlFor="site-status">Estado</label>
                  <select id="site-status" name="status" value={formData.status || 'active'} onChange={handleFormChange}>
                    <option value="active">Activo</option>
                    <option value="maintenance">Mantenimiento</option>
                    <option value="disabled">Deshabilitado</option>
                  </select>
                </div>
              </fieldset>
            )}
            {activeTab === 'assignment' && (
              <fieldset>
                <legend>Asignación</legend>
                <div className="form-group">
                  <label htmlFor="site-user">Asignar a Usuario</label>
                  <select id="site-user" name="assignedUser" value={formData.assignedUser || ''} onChange={handleFormChange}>
                    <option value="">-- No asignar --</option>
                    {users.map(user => (<option key={user.id} value={user.id}>{user.displayName} ({user.email})</option>))}
                  </select>
                </div>
              </fieldset>
            )}
            {activeTab === 'notes' && (
              <fieldset>
                <legend>Notas Adicionales</legend>
                <div className="form-group">
                  <label htmlFor="site-notes">Notas internas (no visibles para el cliente)</label>
                  <textarea id="site-notes" name="notes" rows="5" value={formData.notes || ''} onChange={handleFormChange}></textarea>
                </div>
              </fieldset>
            )}
          </div>
          <div className="modal-footer">
            <button type="button" className="button-secondary" onClick={closeModal} disabled={isSubmitting}>Cancelar</button>
            <button type="submit" className="button-primary" disabled={isSubmitting}>{isSubmitting ? 'Guardando...' : 'Guardar'}</button>
          </div>
        </form>
      </Modal>

      {/* --- MODAL DE CONFIRMACIÓN PARA ELIMINAR --- */}
      <Modal show={modalState.type === 'delete'} onClose={closeModal} title="Confirmar Eliminación">
        <p>¿Estás seguro de que quieres eliminar el sitio <strong>{modalState.site?.name}</strong>? Esta acción no se puede deshacer.</p>
        <div className="modal-footer">
          <button type="button" className="button-secondary" onClick={closeModal} disabled={isSubmitting}>Cancelar</button>
          <button type="button" className="button-danger" onClick={handleDelete} disabled={isSubmitting}>{isSubmitting ? 'Eliminando...' : 'Confirmar Eliminación'}</button>
        </div>
      </Modal>
    </div>
  );
};

export default WebManagement;