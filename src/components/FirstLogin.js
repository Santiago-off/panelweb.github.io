import { useEffect } from 'react';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/config';

function FirstLogin({ user }) {
  // Genera un token aleatorio y seguro
  const verificationToken = Math.random().toString(36).substring(2, 10).toUpperCase();

  useEffect(() => {
    // Guarda este token en un documento temporal en Firestore
    const setupToken = async () => {
      const tokenRef = doc(db, 'verificationTokens', user.uid);
      await setDoc(tokenRef, {
        token: verificationToken,
        createdAt: serverTimestamp(),
      });
    };
    setupToken();
  }, [user.uid, verificationToken]);

  const handleCopy = () => {
    navigator.clipboard.writeText(verificationToken);
    alert('Token copiado al portapapeles');
  };

  return (
    <div style={{ padding: '50px', textAlign: 'center' }}>
      <h1>Verificación de Cuenta</h1>
      <p>Este es un token de un solo uso para completar tu registro.</p>
      <p>Cópialo y pégalo en el panel de administrador.</p>
      <div style={{ background: '#eee', padding: '20px', borderRadius: '8px', display: 'inline-block', margin: '20px 0' }}>
        <strong style={{ fontSize: '1.5rem', letterSpacing: '2px' }}>{verificationToken}</strong>
      </div>
      <br />
      <button onClick={handleCopy} className="add-button">Copiar Token</button>
    </div>
  );
}

export default FirstLogin;