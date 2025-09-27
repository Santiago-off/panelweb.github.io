import { useState } from 'react';
import { doc, updateDoc, deleteField } from 'firebase/firestore';
import { db } from '../../../../config';
import { logAdminAction } from '../../../../utils/logs';

const UserEnableDisableTab = ({ user, onClose }) => {
  const [token, setToken] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleEnable = async () => {
    if (!token) {
      setError('El token es obligatorio para habilitar la cuenta.');
      return;
    }
    if (token.toUpperCase() !== user.verificationToken) {
      setError('El token de verificación es incorrecto.');
      return;
    }

    setIsLoading(true);
    setError('');
    try {
      const userRef = doc(db, 'users', user.id);
      await updateDoc(userRef, {
        status: 'enabled',
        verificationToken: deleteField() // Borramos el token para que no se pueda reutilizar
      });
      await logAdminAction('USER_ENABLED', { targetUserId: user.id, targetUserEmail: user.email });
      alert('¡Usuario habilitado con éxito!');
      onClose();
    } catch (err) {
      console.error("Error al habilitar usuario:", err);
      setError('Ocurrió un error al intentar habilitar el usuario.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisable = async () => {
    if (window.confirm(`¿Estás seguro de que quieres inhabilitar a ${user.displayName}? El usuario no podrá acceder al panel hasta que lo habilites de nuevo.`)) {
      setIsLoading(true);
      setError('');
      try {
        const userRef = doc(db, 'users', user.id);
        const newVerificationToken = Math.random().toString(36).substring(2, 10).toUpperCase();
        await updateDoc(userRef, {
          status: 'disabled',
          verificationToken: newVerificationToken
        });
        await logAdminAction('USER_DISABLED', { targetUserId: user.id, targetUserEmail: user.email });
        alert('¡Usuario inhabilitado con éxito! Se ha generado un nuevo token de verificación.');
        onClose();
      } catch (err) {
        console.error("Error al inhabilitar usuario:", err);
        setError('Ocurrió un error al intentar inhabilitar el usuario.');
      } finally {
        setIsLoading(false);
      }
    }
  };

  if (user.status === 'disabled') {
    return (
      <div>
        <h3>Habilitar Cuenta</h3>
        <p>Introduce el token de verificación que te ha proporcionado el usuario para activar su cuenta.</p>
        <div className="form-group" style={{marginTop: '1rem'}}>
          <label htmlFor="token">Token de Verificación</label>
          <input type="text" id="token" value={token} onChange={(e) => setToken(e.target.value.toUpperCase())} />
        </div>
        {error && <p className="error-message">{error}</p>}
        <div className="modal-footer" style={{padding: 0, border: 0, marginTop: '1rem'}}>
          <button onClick={handleEnable} className="button-primary button-success" disabled={isLoading}>
            {isLoading ? 'Habilitando...' : 'Habilitar Usuario'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h3>Inhabilitar Cuenta</h3>
      <div className="status-banner status-banner-success">
        Esta cuenta está actualmente <strong>activa</strong>.
      </div>
      <p>Al inhabilitar la cuenta, el usuario no podrá acceder, y se generará un nuevo token que necesitará para volver a ser habilitado.</p>
      <div className="modal-footer" style={{padding: 0, border: 0, marginTop: '1rem'}}>
        <button onClick={handleDisable} className="button-primary button-danger" disabled={isLoading}>
          {isLoading ? 'Inhabilitando...' : 'Inhabilitar Usuario'}
        </button>
      </div>
    </div>
  );
};

export default UserEnableDisableTab;