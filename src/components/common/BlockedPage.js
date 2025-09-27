import { signOut } from 'firebase/auth';
import { auth } from '../../config';

const BlockedPage = ({ userData }) => (
  <div style={{ padding: '50px', textAlign: 'center' }}>
    <h1>Acceso Bloqueado</h1>
    <p>Tu acceso a esta plataforma ha sido bloqueado por un administrador.</p>
    {userData?.blockReason && (
      <p style={{ color: '#c53030' }}><strong>Motivo:</strong> {userData.blockReason}</p>
    )}
    <p>Por favor, contacta con el soporte si crees que se trata de un error.</p>
    <button onClick={() => signOut(auth)} className="logout-button">Cerrar Sesión</button>
  </div>
);

export default BlockedPage;