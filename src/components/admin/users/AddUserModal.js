import { useState } from 'react';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../../config';
import { logAdminAction } from '../../../utils/logs'; // Asumiendo que moveremos logAdminAction a utils

const AddUserModal = ({ onClose }) => {
  const [paymentType, setPaymentType] = useState('paypal');
  const [formData, setFormData] = useState({
    nombre: '',
    uid: '',
    apellidos: '',
    telefono: '',
    email: '',
    paypalEmail: '',
    invoiceCode: '',
    serviceType: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    if (!formData.uid.trim()) {
      setError('El campo UID es obligatorio.');
      setIsLoading(false);
      return;
    }

    try {
      const userRef = doc(db, 'users', formData.uid);
      if ((await getDoc(userRef)).exists()) {
        throw new Error("Ya existe un perfil para este UID.");
      }

      const verificationToken = Math.random().toString(36).substring(2, 10).toUpperCase();
      const newUserDoc = {
        displayName: `${formData.nombre} ${formData.apellidos}`,
        email: formData.email,
        phone: formData.telefono || "",
        role: "usuario",
        status: "disabled",
        verificationToken: verificationToken,
        accessStatus: 'active', // Nuevo estado de acceso
        payment: {
          type: paymentType,
          paypalEmail: formData.paypalEmail || "",
        },
        invoiceCode: formData.invoiceCode || "",
        serviceType: formData.serviceType || "",
        createdAt: serverTimestamp(),
      };

      await setDoc(userRef, newUserDoc);
      await logAdminAction('USER_PROFILE_CREATED', { targetUserId: formData.uid, targetUserEmail: formData.email });

      alert(`Perfil inhabilitado para ${formData.displayName} creado con éxito.`);
      onClose();
    } catch (err) {
      console.error("Error al crear usuario:", err);
      setError(err.message || 'Ocurrió un error. Inténtalo de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Añadir Nuevo Usuario</h3>
          <button onClick={onClose} className="close-button">&times;</button>
        </div>
        <form onSubmit={handleFormSubmit}>
          <div className="modal-form">
            <div className="form-group">
              <label htmlFor="uid">UID del Usuario (de Firebase Auth)</label>
              <input type="text" id="uid" value={formData.uid} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label htmlFor="nombre">Nombre</label>
              <input type="text" id="nombre" value={formData.nombre} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label htmlFor="apellidos">Apellidos</label>
              <input type="text" id="apellidos" value={formData.apellidos} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label htmlFor="telefono">Teléfono</label>
              <input type="tel" id="telefono" value={formData.telefono} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input type="email" id="email" value={formData.email} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label htmlFor="paymentType">Tipo de Pago</label>
              <select id="paymentType" value={paymentType} onChange={(e) => setPaymentType(e.target.value)}>
                <option value="paypal">PayPal</option>
                <option value="transferencia">Transferencia</option>
              </select>
            </div>

            {paymentType === 'paypal' && (
              <div className="form-group">
                <label htmlFor="paypalEmail">Email de PayPal</label>
                <input type="email" id="paypalEmail" value={formData.paypalEmail} onChange={handleChange} placeholder="correo@paypal.com" />
              </div>
            )}

            <div className="form-group full-width">
              <label htmlFor="invoiceCode">Código de Factura</label>
              <input type="text" id="invoiceCode" value={formData.invoiceCode} onChange={handleChange} />
            </div>
            <div className="form-group full-width">
              <label htmlFor="serviceType">Tipo de Servicio</label>
              <input type="text" id="serviceType" value={formData.serviceType} onChange={handleChange} />
            </div>
          </div>
          {error && <p className="error-message">{error}</p>}
          <div className="modal-footer">
            <button type="button" className="button-secondary" onClick={onClose}>Cancelar</button>
            <button type="submit" className="button-primary" disabled={isLoading}>
              {isLoading ? 'Guardando...' : 'Guardar Usuario'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddUserModal;