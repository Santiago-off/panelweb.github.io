import { useState } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../../../config';
import { logAdminAction } from '../../../../utils/logs';

const WebInfoTab = ({ web, owner, users }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: web.name || '',
    domain: web.domain || '',
    ownerId: web.ownerId || '',
    hostingType: web.hostingType || 'github',
    githubRepo: web.githubRepo || '',
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSaveChanges = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    const webRef = doc(db, 'sites', web.id);
    try {
      await updateDoc(webRef, formData);
      await logAdminAction('SITE_INFO_UPDATED', { siteId: web.id, newInfo: formData });
      alert('Información de la web actualizada con éxito.');
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
        <h3>Editar Información del Sitio</h3>
        <form onSubmit={handleSaveChanges}>
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="name">Nombre del Sitio</label>
              <input type="text" id="name" name="name" value={formData.name} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label htmlFor="domain">Dominio</label>
              <input type="text" id="domain" name="domain" value={formData.domain} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label htmlFor="ownerId">Propietario</label>
              <select id="ownerId" name="ownerId" value={formData.ownerId} onChange={handleChange}>
                {users.map(user => <option key={user.id} value={user.id}>{user.displayName}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="hostingType">Tipo de Hosting</label>
              <select id="hostingType" name="hostingType" value={formData.hostingType} onChange={handleChange}>
                <option value="github">GitHub/Netlify</option>
                <option value="wordpress">WordPress</option>
              </select>
            </div>
            {formData.hostingType === 'github' && (
              <div className="form-group full-width">
                <label htmlFor="githubRepo">Repositorio GitHub</label>
                <input type="text" id="githubRepo" name="githubRepo" value={formData.githubRepo} onChange={handleChange} />
              </div>
            )}
          </div>
          <div className="modal-footer" style={{padding: 0, border: 0, marginTop: '1rem'}}>
            <button type="button" className="button-secondary" onClick={() => setIsEditing(false)}>Cancelar</button>
            <button type="submit" className="button-primary" disabled={isLoading}>
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
        <h3>Información del Sitio</h3>
        <button className="button-secondary" onClick={() => setIsEditing(true)}>Editar</button>
      </div>
      <ul className="info-list">
        <li><strong>Nombre:</strong> {web.name}</li>
        <li><strong>Dominio:</strong> {web.domain}</li>
        <li><strong>Propietario:</strong> {owner ? owner.displayName : 'No asignado'}</li>
        <li><strong>Tipo de Hosting:</strong> {web.hostingType}</li>
        {web.hostingType === 'github' && (
          <li><strong>Repositorio GitHub:</strong> {web.githubRepo || 'No especificado'}</li>
        )}
        <li><strong>Estado General:</strong> <span className={`tag tag-${web.status === 'online' ? 'success' : 'error'}`}>{web.status}</span></li>
        <li><strong>Gestión Habilitada:</strong> {web.managementStatus === 'enabled' ? <span className="tag tag-success">Sí</span> : <span className="tag tag-warning">No</span>}</li>
      </ul>
    </div>
  );
};

export default WebInfoTab;