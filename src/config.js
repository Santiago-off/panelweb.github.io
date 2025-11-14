import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, enableIndexedDbPersistence, CACHE_SIZE_UNLIMITED } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY || "AIzaSyBXMk0gVdlQdY9FVbLcQf9uO0hQEwI6rRk",
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || "panelweb-76d15.firebaseapp.com",
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID || "panelweb-76d15",
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET || "panelweb-76d15.appspot.com",
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || "1234567890",
  appId: process.env.REACT_APP_FIREBASE_APP_ID || "1:1234567890:web:abcdef1234567890"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore with offline persistence
export const auth = getAuth(app);
export const db = getFirestore(app);
export { firebaseConfig };

// Enable offline persistence
enableIndexedDbPersistence(db, {cacheSizeBytes: CACHE_SIZE_UNLIMITED})
  .then(() => {
    console.log("Firestore persistence habilitada correctamente");
  })
  .catch((err) => {
    console.error("Error al habilitar la persistencia:", err);
    if (err.code === 'failed-precondition') {
      console.warn("La persistencia no pudo ser habilitada porque múltiples pestañas están abiertas");
    } else if (err.code === 'unimplemented') {
      console.warn("El navegador actual no soporta todas las características necesarias para la persistencia");
    }
  });

// Función para verificar la conexión a Firebase
export const checkFirebaseConnection = () => {
  return navigator.onLine;
};

// Datos simulados para usar cuando no hay conexión
export const mockData = {
  users: [
    { id: 'user1', email: 'usuario@ejemplo.com', role: 'user', displayName: 'Usuario Demo' },
    { id: 'admin1', email: 'admin@ejemplo.com', role: 'admin', displayName: 'Admin Demo' }
  ],
  sites: [
    { id: 'site1', name: 'Sitio Demo 1', url: 'https://demo1.ejemplo.com', assignedUsers: ['user1'] },
    { id: 'site2', name: 'Sitio Demo 2', url: 'https://demo2.ejemplo.com', assignedUsers: ['user1'] }
  ],
  tickets: [
    { id: 'ticket1', title: 'Problema de acceso', description: 'No puedo acceder a mi sitio', status: 'open', createdBy: 'user1' },
    { id: 'ticket2', title: 'Error en formulario', description: 'El formulario de contacto no funciona', status: 'in_progress', createdBy: 'user1' }
  ]
};

export default app;
