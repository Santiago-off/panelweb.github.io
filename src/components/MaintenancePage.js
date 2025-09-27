import { signOut } from 'firebase/auth';
import { auth } from '../config';

const MaintenancePage = () => (
  <div className="fullscreen-centered-container">
    <div className="status-panel">
      <h1>Panel en Mantenimiento</h1>
      <p>Estamos realizando mejoras en la plataforma. Por favor, vuelve a intentarlo más tarde.</p>
      <p>Si eres administrador, puedes acceder para desactivar este modo desde la sección de configuración.</p>
      <button onClick={() => signOut(auth)} className="button-secondary">
        Cerrar Sesión
      </button>
    </div>
  </div>
);

export default MaintenancePage;