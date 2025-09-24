import { signOut } from 'firebase/auth';
import { auth } from '../firebase/config';

function AccountDisabled({ userData }) {
  const handleCopy = () => {
    navigator.clipboard.writeText(userData.verificationToken);
    alert('Token copiado al portapapeles');
  };

  return (
    <div style={{ padding: '50px', textAlign: 'center' }}>
      <h1>Cuenta Inhabilitada</h1>
      <p>Tu cuenta ha sido creada pero está pendiente de activación por un administrador.</p>
      <p>Proporciona el siguiente token al administrador para habilitar tu cuenta:</p>
      <div style={{ background: '#eee', padding: '20px', borderRadius: '8px', display: 'inline-block', margin: '20px 0' }}>
        <strong style={{ fontSize: '1.5rem', letterSpacing: '2px' }}>
          {userData.verificationToken}
        </strong>
      </div>
      <br />
      <button onClick={handleCopy} className="add-button" style={{ marginRight: '1rem' }}>
        Copiar Token
      </button>
      <button onClick={() => signOut(auth)} className="logout-button">
        Cerrar Sesión
      </button>
    </div>
  );
}

export default AccountDisabled;