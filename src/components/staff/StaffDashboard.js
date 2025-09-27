import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../../config';
import ViewTicketModal from '../admin/tickets/ViewTicketModal'; // Reutilizamos el modal de admin

// Reutilizamos los helpers visuales de TicketManagement
const formatTimestamp = (timestamp) => {
  if (!timestamp?.seconds) return 'N/A';
  return new Date(timestamp.seconds * 1000).toLocaleDateString('es-ES');
};

const getPriorityClass = (priority) => {
  switch (priority) {
    case 'alta': return 'tag-error';
    case 'media': return 'tag-warning';
    case 'baja': return 'tag-success';
    default: return '';
  }
};

const getStatusClass = (status) => {
  switch (status) {
    case 'abierto': return 'tag-success';
    case 'en-proceso': return 'tag-warning';
    case 'cerrado': return 'tag';
    default: return '';
  }
};

const TicketListItem = ({ ticket, onView }) => (
  <div className="list-item" onClick={onView}>
    <div className="list-item-info">
      <div className="list-item-header">
        <strong>{ticket.subject}</strong>
      </div>
      <span>Creado por: {ticket.createdByEmail || 'Desconocido'} | Creado el: {formatTimestamp(ticket.createdAt)}</span>
    </div>
    <div className="ticket-tags">
      <span className={`tag ${getStatusClass(ticket.status)}`}>{ticket.status}</span>
      <span className={`tag ${getPriorityClass(ticket.priority)}`}>{ticket.priority}</span>
      <button className="button-secondary">Ver</button>
    </div>
  </div>
);


const StaffDashboard = () => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState(null);
  // En el futuro, podríamos necesitar la lista de usuarios para el modal
  const [users, setUsers] = useState([]);

  useEffect(() => {
    // Por ahora, el staff ve todos los tickets. En el futuro se podría filtrar por `assignedTo`.
    const ticketsCollectionRef = collection(db, 'tickets');
    const q = query(ticketsCollectionRef, orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const ticketsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setTickets(ticketsData);
      setLoading(false);
    }, (error) => {
      console.error("Error al obtener los tickets:", error);
      setLoading(false);
    });

    // También cargamos los usuarios por si el modal los necesita
    const usersUnsubscribe = onSnapshot(collection(db, "users"), (snapshot) => {
        setUsers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => {
        unsubscribe();
        usersUnsubscribe();
    };
  }, []);

  return (
    <section>
      <div className="section-header">
        <h2>Tickets de Soporte</h2>
      </div>
      <p className="section-description">
        Gestiona las solicitudes de soporte de los clientes.
      </p>

      {loading ? (
        <p>Cargando tickets...</p>
      ) : tickets.length === 0 ? (
        <div className="placeholder-content">
          <p>No hay tickets de soporte para mostrar.</p>
        </div>
      ) : (
        <div className="list-container">
          {tickets.map(ticket => (
            <TicketListItem
              key={ticket.id}
              ticket={ticket}
              onView={() => setSelectedTicket(ticket)}
            />
          ))}
        </div>
      )}

      {selectedTicket && (
        <ViewTicketModal
          ticket={selectedTicket}
          users={users}
          onClose={() => setSelectedTicket(null)}
        />
      )}
    </section>
  );
};

export default StaffDashboard;