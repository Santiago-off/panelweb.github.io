import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy, doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { db, mockData, checkFirebaseConnection } from '../../config';
import Modal from './Modal';
import './TicketManagement.css';

// Icono para el botón de ver
const ViewIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>;

const TicketManagement = ({ users }) => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [reply, setReply] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Verificar si hay conexión a Firebase
    if (!checkFirebaseConnection()) {
      console.log("Usando datos simulados para tickets debido a problemas de conexión");
      setTickets(mockData.tickets || []);
      setLoading(false);
      return () => {};
    }

    const ticketsQuery = query(collection(db, 'tickets'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(ticketsQuery, (snapshot) => {
      const ticketsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setTickets(ticketsData);
      setLoading(false);
    }, (error) => {
      console.error("Error al obtener tickets:", error);
      // Usar datos simulados en caso de error
      setTickets(mockData.tickets || []);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const openTicketModal = (ticket) => {
    setSelectedTicket(ticket);
  };

  const closeTicketModal = () => {
    setSelectedTicket(null);
    setReply('');
  };

  const getUserName = (userId) => {
    if (!userId) return 'Usuario Anónimo';
    const user = users.find(u => u.id === userId);
    return user ? (user.displayName || user.email || 'Usuario ' + userId.substring(0, 5)) : 'Usuario ' + userId.substring(0, 5);
  };

  const handleReplySubmit = async (e) => {
    e.preventDefault();
    if (!reply.trim() || !selectedTicket) return;

    setIsSubmitting(true);
    const ticketRef = doc(db, 'tickets', selectedTicket.id);

    const newReply = {
      message: reply,
      sender: 'admin', // O podrías usar el ID del admin actual
      timestamp: new Date().toISOString(),
    };

    try {
      await updateDoc(ticketRef, {
        replies: arrayUnion(newReply),
        lastUpdate: new Date().toISOString(),
        status: 'in-progress', // Cambia el estado a "en progreso"
      });
      setReply(''); // Limpia el campo de respuesta
    } catch (error) {
      console.error("Error al enviar la respuesta:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return <div>Cargando tickets...</div>;
  }

  return (
    <div>
      <div className="section-header">
        <h2>Gestión de Tickets</h2>
      </div>
      <p className="section-description">
        Revisa y responde a las solicitudes de soporte de los usuarios.
      </p>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Asunto</th>
              <th>Usuario</th>
              <th>Estado</th>
              <th>Última Actualización</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {tickets.length > 0 ? (
              tickets.map(ticket => (
                <tr key={ticket.id}>
                  <td className="ticket-subject">{ticket.subject}</td>
                  <td>{getUserName(ticket.userId)}</td>
                  <td><span className={`status-tag ticket-status-${ticket.status}`}>{ticket.status}</span></td>
                  <td>{ticket.lastUpdate?.toDate().toLocaleString()}</td>
                  <td className="action-buttons">
                    <button className="button-icon" onClick={() => openTicketModal(ticket)}><ViewIcon /> Ver</button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" className="empty-table-message">No hay tickets de soporte.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* --- MODAL PARA VER TICKET --- */}
      {selectedTicket && (
        <Modal show={!!selectedTicket} onClose={closeTicketModal} title={`Ticket: ${selectedTicket.subject}`}>
          <div className="ticket-view-container">
            <div className="ticket-details">
              <p><strong>Usuario:</strong> {getUserName(selectedTicket.userId)}</p>
              <p><strong>Estado:</strong> <span className={`status-tag ticket-status-${selectedTicket.status}`}>{selectedTicket.status}</span></p>
              <p><strong>Fecha de Creación:</strong> {selectedTicket.createdAt?.toDate().toLocaleString()}</p>
            </div>

            <div className="ticket-conversation">
              <div className="message user-message">
                <div className="message-header">
                  <strong>{getUserName(selectedTicket.userId)}</strong>
                  <span className="message-timestamp">{selectedTicket.createdAt?.toDate().toLocaleString()}</span>
                </div>
                <div className="message-body">
                  {selectedTicket.message}
                </div>
              </div>
              {/* Mapeo de las respuestas */}
              {selectedTicket.replies?.map((reply, index) => (
                <div key={index} className={`message ${reply.sender === 'admin' ? 'admin-message' : 'user-message'}`}>
                  <div className="message-header">
                    <strong>{reply.sender === 'admin' ? 'Soporte' : getUserName(selectedTicket.userId)}</strong>
                    <span className="message-timestamp">{reply.timestamp?.toDate().toLocaleString()}</span>
                  </div>
                  <div className="message-body">
                    {reply.message}
                  </div>
                </div>
              ))}
            </div>

            <div className="ticket-reply-section">
              <form onSubmit={handleReplySubmit}>
                <fieldset>
                  <legend>Responder al Ticket</legend>
                  <div className="form-group">
                    <textarea name="reply" rows="5" placeholder="Escribe tu respuesta aquí..." value={reply} onChange={(e) => setReply(e.target.value)} required />
                  </div>
                  <div className="modal-footer">
                    <button type="button" className="button-secondary" onClick={closeTicketModal} disabled={isSubmitting}>Cerrar</button>
                    <button type="submit" className="button-primary" disabled={isSubmitting}>{isSubmitting ? 'Enviando...' : 'Enviar Respuesta'}</button>
                  </div>
                </fieldset>
              </form>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default TicketManagement;