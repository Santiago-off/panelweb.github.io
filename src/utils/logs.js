import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../config';

/**
 * Registra una acción de un administrador o del sistema en la colección de auditoría.
 * @param {string} action - El tipo de acción realizada (p. ej., 'USER_CREATED', 'SITE_DELETED').
 * @param {Object} [details={}] - Un objeto con detalles adicionales sobre la acción.
 */
export const logAdminAction = async (action, details = {}) => {
  const currentUser = auth.currentUser;
  // Si no hay un usuario logueado, la acción podría ser del sistema, pero necesitamos un actor.
  // Por ahora, solo logueamos si hay un usuario. Podríamos expandir esto en el futuro.
  if (!currentUser) {
    console.warn("Intento de log sin usuario autenticado. Acción:", action);
    return;
  }

  try {
    await addDoc(collection(db, 'auditLogs'), {
      timestamp: serverTimestamp(),
      actorId: currentUser.uid,
      actorEmail: currentUser.email,
      action,
      details,
      type: 'PANEL' // Para diferenciar logs del panel de los de las webs de clientes
    });
  } catch (error) {
    console.error("Error al escribir en el log de auditoría:", error);
  }
};