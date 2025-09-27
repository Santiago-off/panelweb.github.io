import { signOut } from 'firebase/auth';
import { auth } from '../../config';

const MaintenancePage = () => (
  <div style={{ padding: '50px', textAlign: 'center' }}>
    <h1>Panel en Mantenimiento</h1>
    <p>Estamos realizando mejoras en la plataforma. Por favor, vuelve a intentarlo más tarde.</p>
    <p>Si eres administrador, puedes acceder para desactivar este modo.</p>
    <button onClick={() => signOut(auth)} className="logout-button">Cerrar Sesión</button>
  </div>
);

export default MaintenancePage;