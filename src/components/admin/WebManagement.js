import React, { useState, useEffect, useRef } from 'react';
import Modal from './Modal';
import { db, checkFirebaseConnection } from '../../config';
import { collection, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { generateCoreJs } from '../../utils/coreGenerator';

// Iconos para los botones de acción
const EditIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>;
const DeleteIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>;

const WebManagement = ({ sites, users }) => {
  const [modalState, setModalState] = useState({ type: null, site: null });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('info');
  const [formData, setFormData] = useState({});
  const verifyMessageRef = useRef(null);
  const verifyWindowRef = useRef(null);
  const [verificationStatus, setVerificationStatus] = useState('idle');

  const openModal = (type, site = null) => {
    setModalState({ type, site });
    // Inicializa el estado del formulario con los datos del sitio o un objeto vacío
    setFormData(site || { name: '', url: '', domain: '', status: 'active', assignedUser: '', notes: '' });
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
    if (!siteData.domain && siteData.url) {
      try {
        const u = new URL(siteData.url);
        siteData.domain = u.hostname;
      } catch {}
    }

    try {
      // Verificar si hay conexión a Firebase
      if (!checkFirebaseConnection()) {
        console.log("Simulando guardar sitio en modo offline");
        // Simular éxito en modo offline
        setTimeout(() => {
          setIsSubmitting(false);
          closeModal();
        }, 500);
        return;
      }

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
      // Verificar si es un error de red
      if (!navigator.onLine || error.code === 'failed-precondition' || error.code === 'unavailable') {
        console.log("Simulando guardar sitio debido a error de red");
        // Simular éxito en caso de error de red
      }
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

  const openCoreModal = (site) => {
    setModalState({ type: 'generateCore', site });
  };

  const downloadCoreFile = (site) => {
    if (!site?.id) return;
    const content = generateCoreJs({ siteId: site.id });
    const blob = new Blob([content], { type: 'application/javascript;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'core.js';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const openVerifyModal = (site) => {
    setVerificationStatus('idle');
    setModalState({ type: 'verify', site });
  };

  const openVerifyInTab = (site) => {
    setVerificationStatus('idle');
    verifyWindowRef.current = window.open(site?.url || '', '_blank');
  };

  useEffect(() => {
    const handler = (ev) => {
      const data = ev?.data;
      if (!data) return;
      let expectedOrigin = '*';
      try { expectedOrigin = new URL(modalState.site?.url || '').origin; } catch {}
      if (expectedOrigin !== '*' && ev.origin !== expectedOrigin) return;
      if (data.type === 'PANEL_CORE_HANDSHAKE' && data.siteId === modalState.site?.id) {
        setVerificationStatus('linked');
      } else if (data.type === 'PONG' && data.siteId === modalState.site?.id) {
        setVerificationStatus('pong');
      }
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [modalState.site?.id, modalState.site?.url]);

  useEffect(() => {
    const updateLinked = async () => {
      if (!modalState.site?.id) return;
      if (verificationStatus === 'linked' || verificationStatus === 'pong') {
        try {
          const siteRef = doc(db, 'sites', modalState.site.id);
          await updateDoc(siteRef, { status: 'online', linked: true });
        } catch {}
      }
    };
    updateLinked();
  }, [verificationStatus, modalState.site?.id]);

  const sendPing = () => {
    if (!verifyMessageRef.current) return;
    const frame = verifyMessageRef.current;
    const cw = frame.contentWindow;
    if (!cw) return;
    let origin = '*';
    try { origin = new URL(modalState.site?.url || '').origin; } catch {}
    cw.postMessage({ type: 'PANEL_TO_CORE', siteId: modalState.site?.id, command: { type: 'PING' } }, origin);
    if (verifyWindowRef.current) {
      try {
        verifyWindowRef.current.postMessage({ type: 'PANEL_TO_CORE', siteId: modalState.site?.id, command: { type: 'PING' } }, origin);
      } catch {}
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
                    <button className="button-icon" onClick={() => openCoreModal(site)}>Generar core.js</button>
                    <button className="button-icon" onClick={() => openVerifyModal(site)}>Verificar vinculación</button>
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
                  <label htmlFor="site-domain">Dominio</label>
                  <input type="text" id="site-domain" name="domain" value={formData.domain || ''} onChange={handleFormChange} placeholder="ejemplo.com" />
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

      <Modal show={modalState.type === 'generateCore'} onClose={closeModal} title="Generar core.js">
        <div className="form-group">
          <label>Instrucción para index.html</label>
          <input readOnly value={`<script src="core.js"></script>`} />
          <small>Pega esta línea en el &lt;head&gt; o antes de cerrar el &lt;/body&gt;.</small>
        </div>
        <div className="modal-footer">
          <button type="button" className="button-secondary" onClick={closeModal}>Cerrar</button>
          <button type="button" className="button-primary" onClick={() => downloadCoreFile(modalState.site)}>Descargar core.js</button>
        </div>
      </Modal>

      <Modal show={modalState.type === 'verify'} onClose={closeModal} title="Verificar vinculación">
        <div className="form-group full-width">
          <label>Vista previa del sitio</label>
          <iframe ref={verifyMessageRef} title="verificacion" src={modalState.site?.url} style={{ width: '100%', height: '400px', border: '1px solid #333' }} />
        </div>
        <div className="form-group">
          <label>Estado</label>
          <input readOnly value={verificationStatus} />
        </div>
        <div className="modal-footer">
          <button type="button" className="button-secondary" onClick={closeModal}>Cerrar</button>
          <button type="button" className="button-primary" onClick={sendPing}>Enviar ping</button>
          <button type="button" className="button-outline" onClick={() => openVerifyInTab(modalState.site)}>Abrir en nueva pestaña</button>
        </div>
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
