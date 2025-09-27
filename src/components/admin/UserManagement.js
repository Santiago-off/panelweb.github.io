import { useState } from 'react';

// Importa los modales que se usarán en esta sección
import AddUserModal from './users/AddUserModal';
import ManageUserModal from './users/ManageUserModal';

const UserManagement = ({ users, sites }) => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [managingUser, setManagingUser] = useState(null);

  // Determina si los datos aún se están cargando.
  // En el futuro, podríamos pasar un prop 'loading' si es necesario.
  const loading = users.length === 0;

  return (
    <section>
      <div className="section-header">
        <h2>Gestión de Usuarios</h2>
        <button className="button-primary" onClick={() => setIsAddModalOpen(true)}>
          Añadir Usuario
        </button>
      </div>
      <p className="section-description">
        Desde aquí podrás administrar todos los usuarios de la plataforma.
      </p>

      {loading ? (
        <p>Cargando usuarios...</p>
      ) : users.length === 0 ? (
        <p>No hay usuarios para mostrar.</p>
      ) : (
        <div className="list-container">
          {users.map(user => (
            <div key={user.id} className="list-item">
              <div className="list-item-info">
                <div className="list-item-header">
                  <strong>{user.displayName}</strong>
                  {user.status === 'disabled' && (
                    <span className="tag tag-warning">Inhabilitado</span>
                  )}
                  {user.accessStatus === 'blocked' && (
                    <span className="tag tag-error">Bloqueado</span>
                  )}
                </div>
                <span>{user.email} - Rol: {user.role}</span>
              </div>
              <button className="button-secondary" onClick={() => setManagingUser(user)}>
                Gestionar
              </button>
            </div>
          ))}
        </div>
      )}

      {isAddModalOpen && <AddUserModal sites={sites} onClose={() => setIsAddModalOpen(false)} />}
      {managingUser && <ManageUserModal user={managingUser} sites={sites} onClose={() => setManagingUser(null)} />}
    </section>
  );
};

export default UserManagement;