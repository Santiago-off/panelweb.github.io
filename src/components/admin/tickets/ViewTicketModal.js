import { useState } from 'react';
import { doc, updateDoc, arrayUnion, serverTimestamp } from 'firebase/firestore';
import { db } from '../../../config';
import { logAdminAction } from '../../../utils/logs';
import { auth } from '../../../config';

const formatTimestamp = (timestamp) => {
  if (!timestamp?.seconds) return 'N/A';
  return new Date(timestamp.seconds * 1000).toLocaleString('es-ES', {
    dateStyle: 'long',
    timeStyle: 'short',
  });
};

const ViewTicketModal = ({ ticket, users, onClose }) => {
  const [newReply, setNewReply] = useState('');
  const [isReplying, setIsReplying] = useState(false);
  const currentUser = auth.currentUser;

  const handleReplySubmit = async (e) => {
    e.preventDefault();
    if (!newReply.trim()) return;

    setIsReplying(true);
    const ticketRef = doc(db, 'tickets', ticket.id);

    const reply = {
      text: newReply,
      senderId: currentUser.uid,
      senderEmail: currentUser.email,
      timestamp: serverTimestamp(),
    };

    try {
      await updateDoc(ticketRef, {
        messages: arrayUnion(reply),
        status: 'en-proceso', // Cambia a 'en-proceso' al responder
      });
      await logAdminAction('TICKET_REPLIED', { ticketId: ticket.id });
      setNewReply('');
    } catch (error) {
      console.error("Error al enviar la respuesta:", error);
      alert('Ocurrió un error al enviar la respuesta.');
    } finally {
      setIsReplying(false);
    }
  };

  const handleStatusChange = async (newStatus) => {
    const ticketRef = doc(db, 'tickets', ticket.id);
    try {
        await updateDoc(ticketRef, { status: newStatus });
        await logAdminAction('TICKET_STATUS_CHANGED', { ticketId: ticket.id, newStatus });
    } catch (error) {
        console.error("Error al cambiar el estado:", error);
        alert("Ocurrió un error al cambiar el estado.");
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Ticket: {ticket.subject}</h3>
          <button onClick={onClose} className="close-button">&times;</button>
        </div>

        <div className="ticket-modal-body">
          <div className="ticket-conversation">
            <div className="ticket-message-list">
              {ticket.messages?.map((msg, index) => (
                <div key={index} className={`ticket-message ${msg.senderId === currentUser.uid ? 'sent' : 'received'}`}>
                  <div className="message-bubble">
                    <p className="message-sender">{msg.senderEmail}</p>
                    <p>{msg.text}</p>
                    <p className="message-timestamp">{formatTimestamp(msg.timestamp)}</p>
                  </div>
                </div>
              ))}
            </div>
            <form onSubmit={handleReplySubmit} className="ticket-reply-form">
              <textarea
                value={newReply}
                onChange={(e) => setNewReply(e.target.value)}
                placeholder="Escribe tu respuesta..."
                rows="4"
                required
              />
              <button type="submit" className="button-primary" disabled={isReplying}>
                {isReplying ? 'Enviando...' : 'Enviar Respuesta'}
              </button>
            </form>
          </div>

          <div className="ticket-sidebar">
            <h4>Detalles del Ticket</h4>
            <ul className="info-list">
              <li><strong>Cliente:</strong> {ticket.createdByEmail}</li>
              <li><strong>Prioridad:</strong> <span className="tag">{ticket.priority}</span></li>
              <li><strong>Estado:</strong> <span className="tag">{ticket.status}</span></li>
              <li><strong>Creado:</strong> {formatTimestamp(ticket.createdAt)}</li>
              <li><strong>Web:</strong> {ticket.relatedSite || 'N/A'}</li>
            </ul>

            <h4>Acciones</h4>
            <div className="ticket-actions">
                <label htmlFor="status-select">Cambiar Estado:</label>
                <select
                    id="status-select"
                    value={ticket.status}
                    onChange={(e) => handleStatusChange(e.target.value)}
                >
                    <option value="abierto">Abierto</option>
                    <option value="en-proceso">En Proceso</option>
                    <option value="cerrado">Cerrado</option>
                </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewTicketModal;