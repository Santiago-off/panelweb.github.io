import { useState } from 'react';
import { db } from '../../config';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

const AddUserModal = ({ onClose }) => {
  const [paymentType, setPaymentType] = useState('paypal');
  const [formData, setFormData] = useState({
    nombre: '',
    uid: '', // Nuevo campo para el UID
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
      // 1. Verificamos que el perfil no exista ya en la colección 'users'
      const userRef = doc(db, 'users', formData.uid);
      if ((await getDoc(userRef)).exists()) {
        throw new Error("Ya existe un perfil para este UID.");
      }

      // 2. Si no existe, creamos el documento del usuario con estado 'inhabilitado'
      const verificationToken = Math.random().toString(36).substring(2, 10).toUpperCase();
      const newUserDoc = {
        displayName: `${formData.nombre} ${formData.apellidos}`,
        email: formData.email,
        phone: formData.telefono || "",
        role: "usuario",
        status: "disabled", // Estado inicial
        verificationToken: verificationToken, // Token para habilitación
        payment: {
          type: paymentType,
          paypalEmail: formData.paypalEmail || "",
        },
        invoiceCode: formData.invoiceCode || "",
        serviceType: formData.serviceType || "",
        createdAt: serverTimestamp(),
      };

      await setDoc(userRef, newUserDoc);

      console.log(`Perfil inhabilitado para ${formData.uid} creado con éxito.`);
      onClose(); // Cierra el modal
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
              <label htmlFor="uid">UID del Usuario</label>
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
          {error && <p className="login-error" style={{marginTop: '1rem'}}>{error}</p>}
          <div className="modal-footer">
            <button type="button" className="logout-button" onClick={onClose}>Cancelar</button>
            <button type="submit" className="add-button" disabled={isLoading}>
              {isLoading ? 'Guardando...' : 'Guardar Usuario'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddUserModal;