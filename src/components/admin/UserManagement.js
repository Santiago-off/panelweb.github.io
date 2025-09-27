import { useState, useEffect } from 'react';
import AddUserModal from '../modals/AddUserModal';
import ManageUserModal from '../modals/ManageUserModal';

const UserManagement = ({ users, sites }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [managingUser, setManagingUser] = useState(null); // Estado para el usuario a gestionar
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Esta lógica ahora se ejecutará solo si el componente se renderiza,
    // y solo se renderizará para un admin.
      setLoading(false);
  }, []); // Este useEffect ahora solo controla el estado de 'loading'

  return (
    <div>
      <div className="section-header">
        <h2>Gestión de Usuarios</h2>
        <button className="add-button" onClick={() => setIsModalOpen(true)}>
          Añadir Usuario
        </button>
      </div>
      <p>Desde aquí podrás administrar todos los usuarios de la plataforma.</p>

      {users.length === 0 && !loading ? <p>No hay usuarios para mostrar.</p> : null}
      {loading ? <p>Cargando usuarios...</p> : (
        <div className="user-list">
        {users.map(user => (
          <div key={user.id} className="user-list-item">
            <div className="user-info">
              <div className="user-info-header">
                <strong>{user.displayName}</strong>
                {user.status === 'disabled' && (
                  <span className="user-status-tag status-disabled">Inhabilitado</span>
                )}
              </div>
              <span>{user.email} - Rol: {user.role}</span>
            </div>
            <button className="logout-button" onClick={() => setManagingUser(user)}>Gestionar</button>
          </div>
        ))}
        </div>
      )}

      {isModalOpen && <AddUserModal onClose={() => setIsModalOpen(false)} />}
      {managingUser && <ManageUserModal user={managingUser} sites={sites} onClose={() => setManagingUser(null)} />}
    </div>
  );
};

export default UserManagement;