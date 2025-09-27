import { useState } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../config';
import { useUserData } from '../../hooks/useUserData';

const CreateTicketModal = ({ sites, onClose }) => {
  const { user, userData } = useUserData();
  const [formData, setFormData] = useState({
    subject: '',
    message: '',
    priority: 'media',
    relatedSite: sites.length > 0 ? sites[0].id : '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    if (!formData.subject.trim() || !formData.message.trim()) {
      setError('El asunto y el mensaje son obligatorios.');
      setIsLoading(false);
      return;
    }

    try {
      const newTicket = {
        subject: formData.subject,
        priority: formData.priority,
        relatedSite: formData.relatedSite,
        status: 'abierto',
        createdById: user.uid,
        createdByEmail: userData.email,
        createdAt: serverTimestamp(),
        messages: [
          {
            text: formData.message,
            senderId: user.uid,
            senderEmail: userData.email,
            timestamp: serverTimestamp(), // Firestore reemplazará esto
          },
        ],
      };

      await addDoc(collection(db, 'tickets'), newTicket);

      alert('¡Ticket creado con éxito! Nos pondremos en contacto contigo pronto.');
      onClose();
    } catch (err) {
      console.error("Error al crear el ticket:", err);
      setError('Ocurrió un error al crear el ticket. Inténtalo de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Crear Nuevo Ticket de Soporte</h3>
          <button onClick={onClose} className="close-button">&times;</button>
        </div>
        <form onSubmit={handleFormSubmit}>
          <div className="modal-form" style={{gridTemplateColumns: '1fr'}}>
            <div className="form-group">
              <label htmlFor="subject">Asunto</label>
              <input type="text" id="subject" name="subject" value={formData.subject} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label htmlFor="message">Describe tu problema</label>
              <textarea id="message" name="message" value={formData.message} onChange={handleChange} rows="6" required></textarea>
            </div>
            <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-4)'}}>
              <div className="form-group">
                <label htmlFor="relatedSite">Sitio Web Relacionado</label>
                <select id="relatedSite" name="relatedSite" value={formData.relatedSite} onChange={handleChange}>
                  <option value="">Ninguno</option>
                  {sites.map(site => <option key={site.id} value={site.id}>{site.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="priority">Prioridad</label>
                <select id="priority" name="priority" value={formData.priority} onChange={handleChange}>
                  <option value="baja">Baja</option>
                  <option value="media">Media</option>
                  <option value="alta">Alta</option>
                </select>
              </div>
            </div>
          </div>
          {error && <p className="error-message" style={{margin: '0 1.5rem'}}>{error}</p>}
          <div className="modal-footer">
            <button type="button" className="button-secondary" onClick={onClose}>Cancelar</button>
            <button type="submit" className="button-primary" disabled={isLoading}>
              {isLoading ? 'Enviando...' : 'Crear Ticket'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateTicketModal;