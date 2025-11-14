import { useState, useEffect } from 'react';
import { signInWithEmailAndPassword, setPersistence, browserLocalPersistence, browserSessionPersistence } from 'firebase/auth';
import { auth, db } from '../config';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import './Login.css'; // Importa los nuevos estilos

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Verificar si hay credenciales guardadas
  useEffect(() => {
    const savedEmail = localStorage.getItem('userEmail');
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      // Establecer persistencia según la opción de recordar sesión
      const persistenceType = rememberMe ? browserLocalPersistence : browserSessionPersistence;
      await setPersistence(auth, persistenceType);
      
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Guardar email si "recordar sesión" está activado
      if (rememberMe) {
        localStorage.setItem('userEmail', email);
      } else {
        localStorage.removeItem('userEmail');
      }

      // Registrar el inicio de sesión en los logs de auditoría (no bloquear el login si falla)
      try {
        await addDoc(collection(db, 'auditLogs'), {
          timestamp: serverTimestamp(),
          actorId: user.uid,
          actorEmail: user.email,
          action: 'USER_LOGIN',
        });
      } catch (logErr) {
        console.warn('No se pudo registrar el log de login:', logErr?.code || logErr?.message);
      }

      navigate('/'); // Redirect to dashboard on successful login
    } catch (err) {
      console.error(err);
      const isAuthError = (err?.code || '').startsWith('auth/');
      setError(isAuthError ? 'Credenciales inválidas. Verifica tu email y contraseña.' : 'Ocurrió un error al iniciar sesión.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-panel">
        <div className="login-header">
          <h2>Iniciar Sesión</h2>
          <p className="login-subtitle">Ingresa tus credenciales para acceder al panel</p>
        </div>
        
        <form onSubmit={handleLogin} className="login-form">
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              className="login-input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Ingresa tu email"
              required
              disabled={loading}
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="password">Contraseña</label>
            <input
              id="password"
              className="login-input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Ingresa tu contraseña"
              required
              disabled={loading}
            />
          </div>
          
          <div className="form-checkbox">
            <input
              id="remember-me"
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              disabled={loading}
            />
            <label htmlFor="remember-me">Recordar sesión</label>
          </div>
          
          <button 
            type="submit" 
            className="login-button"
            disabled={loading}
          >
            {loading ? 'Iniciando sesión...' : 'Entrar'}
          </button>
        </form>
        
        {error && <p className="login-error">{error}</p>}
      </div>
    </div>
  );
}

export default Login;
