import { useState } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../../../config';
import { logAdminAction } from '../../../../utils/logs';

const UserInfoTab = ({ user }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    displayName: user.displayName || '',
    email: user.email || '',
    phone: user.phone || '',
    role: user.role || 'usuario', // Añadido para poder cambiar el rol
  });

  const formatDate = (timestamp) => {
    if (!timestamp?.seconds) return 'N/A';
    return new Date(timestamp.seconds * 1000).toLocaleDateString('es-ES', {
      year: 'numeric', month: 'long', day: 'numeric'
    });
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSaveChanges = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    const userRef = doc(db, 'users', user.id);
    try {
      await updateDoc(userRef, {
        displayName: formData.displayName,
        email: formData.email,
        phone: formData.phone,
        role: formData.role,
      });
      // Nota: Cambiar el email aquí no lo cambia en Firebase Authentication.
      await logAdminAction('USER_INFO_UPDATED', { targetUserId: user.id, newInfo: formData });
      alert('Información del usuario actualizada con éxito.');
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
        <h3>Editar Información</h3>
        <form onSubmit={handleSaveChanges}>
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="displayName">Nombre Completo</label>
              <input type="text" id="displayName" name="displayName" value={formData.displayName} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input type="email" id="email" name="email" value={formData.email} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label htmlFor="phone">Teléfono</label>
              <input type="tel" id="phone" name="phone" value={formData.phone} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label htmlFor="role">Rol</label>
              <select id="role" name="role" value={formData.role} onChange={handleChange}>
                <option value="usuario">Usuario</option>
                <option value="staff">Staff</option>
                <option value="admin">Admin</option>
              </select>
            </div>
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
        <h3>Información del Usuario</h3>
        <button className="button-secondary" onClick={() => setIsEditing(true)}>Editar</button>
      </div>
      <ul className="info-list">
        <li><strong>Nombre Completo:</strong> {user.displayName}</li>
        <li><strong>Email:</strong> {user.email}</li>
        <li><strong>Teléfono:</strong> {user.phone || 'No especificado'}</li>
        <li><strong>Rol:</strong> <span className="tag">{user.role}</span></li>
        <li><strong>Estado:</strong> {user.status === 'enabled' ? <span className="tag tag-success">Habilitado</span> : <span className="tag tag-warning">Inhabilitado</span>}</li>
        <li><strong>Miembro desde:</strong> {formatDate(user.createdAt)}</li>
      </ul>
      <h4>Información de Pago</h4>
      <ul className="info-list">
        <li><strong>Método de pago:</strong> {user.payment?.type || 'No especificado'}</li>
        {user.payment?.type === 'paypal' && (
          <li><strong>Email de PayPal:</strong> {user.payment.paypalEmail}</li>
        )}
        <li><strong>Código de Factura:</strong> {user.invoiceCode || 'No especificado'}</li>
        <li><strong>Tipo de Servicio:</strong> {user.serviceType || 'No especificado'}</li>
      </ul>
    </div>
  );
};

export default UserInfoTab;