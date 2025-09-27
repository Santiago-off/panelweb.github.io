import { useState } from 'react';
import { db } from '../../config';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

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

export default AddWebModal;