import { signOut } from 'firebase/auth';
import { auth } from '../config';

const BlockedPage = ({ userData }) => (
  <div className="fullscreen-centered-container">
    <div className="status-panel">
      <h1>Acceso Bloqueado</h1>
      <p>Tu acceso a esta plataforma ha sido bloqueado por un administrador.</p>
      {userData?.blockReason && (
        <p className="error-message">
          <strong>Motivo:</strong> {userData.blockReason}
        </p>
      )}
      <p>Por favor, contacta con el soporte si crees que se trata de un error.</p>
      <button onClick={() => signOut(auth)} className="button-secondary">
        Cerrar Sesión
      </button>
    </div>
  </div>
);

export default BlockedPage;