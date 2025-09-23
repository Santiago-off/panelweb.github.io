'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import {
  collection,
  onSnapshot,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  setDoc,
  getDoc,
} from 'firebase/firestore';
import { auth, db } from '../../firebase';
import { v4 as uuidv4 } from 'uuid';

const navItems = [
  { name: 'Sitios Web', id: 'websites' },
  { name: 'Usuarios', id: 'users' },
  { name: 'Logs del Servidor', id: 'logs' },
];

export default function DashboardPage() {
  const [user, setUser] = useState(null);
  const [websites, setWebsites] = useState([]);
  const [dashboardUsers, setDashboardUsers] = useState([]);
  const [editingWebsite, setEditingWebsite] = useState(null);
  const [editContent, setEditContent] = useState('');
  const [editImageUrl, setEditImageUrl] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [activeSection, setActiveSection] = useState('websites');
  const [userRole, setUserRole] = useState(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedUserForAssignment, setSelectedUserForAssignment] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Custom Modal States
  const [showModal, setShowModal] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalMessage, setModalMessage] = useState('');
  const [modalOnConfirm, setModalOnConfirm] = useState(null);
  const [modalType, setModalType] = useState('alert'); // 'alert', 'confirm', 'form'
  const [modalFormValues, setModalFormValues] = useState({});

  const router = useRouter();

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        // Cargar el rol del usuario
        const userDocRef = doc(db, 'panel-users', currentUser.email);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          setUserRole(userDoc.data().role);
        }
      } else {
        router.push('/login');
      }
    });

    const unsubscribeFirestoreWebsites = onSnapshot(collection(db, 'websites'), (snapshot) => {
      const websitesData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setWebsites(websitesData);
    });
    
    const unsubscribeFirestoreUsers = onSnapshot(collection(db, 'panel-users'), (snapshot) => {
      const usersData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setDashboardUsers(usersData);
    });

    return () => {
      unsubscribeAuth();
      unsubscribeFirestoreWebsites();
      unsubscribeFirestoreUsers();
    };
  }, [router]);
  
  const openAlert = (title, message) => {
    setModalTitle(title);
    setModalMessage(message);
    setModalType('alert');
    setModalOnConfirm(() => {
      setShowModal(false);
    });
    setShowModal(true);
  };

  const openConfirm = (title, message, onConfirm) => {
    setModalTitle(title);
    setModalMessage(message);
    setModalType('confirm');
    setModalOnConfirm(() => onConfirm);
    setShowModal(true);
  };
  
  const openFormModal = (title, fields, onConfirm) => {
    setModalTitle(title);
    setModalMessage('');
    setModalType('form');
    setModalFormValues(fields.reduce((acc, field) => ({...acc, [field.name]: ''}), {}));
    setModalOnConfirm(() => onConfirm);
    setShowModal(true);
  };

  const handleLogout = async () => {
    await signOut(auth);
    router.push('/login');
  };

  const handleAddWebsite = async () => {
    openFormModal('Agregar Nuevo Sitio Web', [{name: 'name', placeholder: 'Nombre'}, {name: 'url', placeholder: 'URL'}], async (values) => {
      if (values.name && values.url) {
        await addDoc(collection(db, 'websites'), { name: values.name, url: values.url, assignedUsers: [] });
        openAlert('Éxito', 'Sitio web agregado correctamente.');
      } else {
        openAlert('Error', 'El nombre y la URL no pueden estar vacíos.');
      }
    });
  };

  const handleDeleteWebsite = async (id) => {
    openConfirm('Confirmar Eliminación', '¿Estás seguro de que quieres eliminar este sitio?', async () => {
      await deleteDoc(doc(db, 'websites', id));
      openAlert('Éxito', 'Sitio web eliminado correctamente.');
    });
  };

  const handleEditPage = async (websiteId, pageId) => {
    const pageDocRef = doc(db, 'websites', websiteId, 'pages', pageId);
    const pageDoc = await getDoc(pageDocRef);

    if (pageDoc.exists()) {
      const data = pageDoc.data();
      setEditContent(data.content || '');
      setEditImageUrl(data.imageUrl || '');
    } else {
      setEditContent('');
      setEditImageUrl('');
    }
    setIsEditing(true);
  };

  const handleSavePage = async () => {
    const websiteId = editingWebsite.id;
    const pageDocRef = doc(db, 'websites', websiteId, 'pages', 'homepage');
    await setDoc(pageDocRef, { content: editContent, imageUrl: editImageUrl });
    openAlert('Éxito', 'Contenido guardado con éxito!');
    setIsEditing(false);
    setEditingWebsite(null);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditingWebsite(null);
  };
  
  const handleToggleUserRole = async (userId, currentRole) => {
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    const userDocRef = doc(db, 'panel-users', userId);
    await updateDoc(userDocRef, { role: newRole });
    openAlert('Éxito', `Rol del usuario cambiado a ${newRole}.`);
  };
  
  const handleAddNewUser = async () => {
    openFormModal('Agregar Nuevo Usuario', [{name: 'email', placeholder: 'Correo Electrónico'}], async (values) => {
      if (values.email) {
        await setDoc(doc(db, 'panel-users', values.email), { role: 'user' });
        openAlert('Éxito', 'Usuario agregado correctamente.');
      } else {
        openAlert('Error', 'El correo electrónico no puede estar vacío.');
      }
    });
  };

  const handleDeleteUser = async (userId) => {
    openConfirm('Confirmar Eliminación', '¿Estás seguro de que quieres eliminar a este usuario?', async () => {
      await deleteDoc(doc(db, 'panel-users', userId));
      openAlert('Éxito', 'Usuario eliminado correctamente.');
    });
  };

  const openAssignModal = (user) => {
    setSelectedUserForAssignment(user);
    setShowAssignModal(true);
  };

  const handleAssignWebsiteToUser = async (websiteId) => {
    if (selectedUserForAssignment) {
      const websiteDocRef = doc(db, 'websites', websiteId);
      const websiteDoc = await getDoc(websiteDocRef);
      if (websiteDoc.exists()) {
        const websiteData = websiteDoc.data();
        const assignedUsers = websiteData.assignedUsers || [];
        if (!assignedUsers.includes(selectedUserForAssignment.id)) {
          assignedUsers.push(selectedUserForAssignment.id);
          await updateDoc(websiteDocRef, { assignedUsers });
          openAlert('Éxito', `Sitio web asignado a ${selectedUserForAssignment.id} con éxito!`);
          setShowAssignModal(false);
          setSelectedUserForAssignment(null);
        } else {
          openAlert('Advertencia', 'El usuario ya está asignado a este sitio.');
        }
      }
    }
  };

  const filteredWebsites = websites.filter(website =>
    (website.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (website.url || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderContent = () => {
    if (isEditing) {
      return (
        <div className="bg-gray-800 p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-semibold mb-4">
            Editando Página: {editingWebsite?.name}
          </h2>
          <div className="space-y-4">
            <div>
              <label htmlFor="content" className="block text-gray-400">Contenido</label>
              <textarea
                id="content"
                className="w-full h-48 bg-gray-700 text-gray-100 p-4 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="imageUrl" className="block text-gray-400">URL de la Imagen</label>
              <input
                id="imageUrl"
                type="text"
                className="w-full bg-gray-700 text-gray-100 p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={editImageUrl}
                onChange={(e) => setEditImageUrl(e.target.value)}
                placeholder="Pega aquí la URL de la imagen"
              />
            </div>
            {editImageUrl && (
                <div className="mt-4">
                  <h3 className="text-gray-400">Vista previa de la imagen:</h3>
                  <img src={editImageUrl} alt="Vista previa" className="mt-2 rounded-md object-cover w-full max-h-64" />
                </div>
            )}
          </div>
          <div className="mt-6 flex space-x-4">
            <button onClick={handleSavePage} className="px-4 py-2 bg-green-600 rounded-lg shadow-lg hover:bg-green-700 transition duration-300">
              Guardar Contenido
            </button>
            <button onClick={handleCancelEdit} className="px-4 py-2 bg-red-600 rounded-lg shadow-lg hover:bg-red-700 transition duration-300">
              Cancelar
            </button>
          </div>
        </div>
      );
    }
    
    switch (activeSection) {
      case 'websites':
        return (
          <>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-semibold">Sitios Web</h2>
              <button onClick={handleAddWebsite} className="px-4 py-2 bg-blue-600 rounded-lg shadow-lg hover:bg-blue-700 transition duration-300">
                Agregar Sitio
              </button>
            </div>
            <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {websites.map((website) => (
                <li key={website.id} className="bg-gray-800 p-6 rounded-lg shadow-md flex flex-col justify-between">
                  <div>
                    <h3 className="text-xl font-bold">{website.name}</h3>
                    <p className="text-gray-400">{website.url}</p>
                    <div className="mt-2">
                      <h4 className="text-md font-semibold text-gray-300">Usuarios Asignados:</h4>
                      <p className="text-gray-400 text-sm">
                        {website.assignedUsers && website.assignedUsers.length > 0 ? website.assignedUsers.join(', ') : 'Ninguno'}
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 flex space-x-2">
                    <button onClick={() => { setEditingWebsite(website); handleEditPage(website.id, 'homepage'); }} className="flex-1 px-3 py-2 bg-green-500 rounded-lg shadow-md hover:bg-green-600 transition duration-300">
                      Editar Página
                    </button>
                    <button onClick={() => handleDeleteWebsite(website.id)} className="px-3 py-2 bg-red-500 rounded-lg shadow-md hover:bg-red-600 transition duration-300">
                      Eliminar
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </>
        );
      case 'users':
        return (
          <>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-semibold">Gestión de Usuarios</h2>
              {userRole === 'admin' && (
                <button onClick={handleAddNewUser} className="px-4 py-2 bg-blue-600 rounded-lg shadow-lg hover:bg-blue-700 transition duration-300">
                  Agregar Usuario
                </button>
              )}
            </div>
            <ul className="space-y-4">
              {dashboardUsers.map((u) => (
                <li key={u.id} className="bg-gray-800 p-6 rounded-lg shadow-md flex justify-between items-center">
                  <div>
                    <p className="text-xl font-bold">{u.id}</p>
                    <p className="text-gray-400">Rol: {u.role}</p>
                  </div>
                  <div className="flex space-x-2">
                    {userRole === 'admin' && (
                      <>
                        <button
                          onClick={() => handleToggleUserRole(u.id, u.role)}
                          className="px-4 py-2 bg-purple-600 rounded-lg shadow-lg hover:bg-purple-700 transition duration-300"
                        >
                          Cambiar a {u.role === 'admin' ? 'User' : 'Admin'}
                        </button>
                        <button
                          onClick={() => openAssignModal(u)}
                          className="px-4 py-2 bg-yellow-600 rounded-lg shadow-lg hover:bg-yellow-700 transition duration-300"
                        >
                          Asignar Página
                        </button>
                        <button
                          onClick={() => handleDeleteUser(u.id)}
                          className="px-4 py-2 bg-red-600 rounded-lg shadow-lg hover:bg-red-700 transition duration-300"
                        >
                          Eliminar
                        </button>
                      </>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </>
        );
      case 'logs':
        return (
          <>
            <h2 className="text-2xl font-semibold mb-4">Logs del Servidor</h2>
            <div className="bg-gray-800 p-6 rounded-lg shadow-md">
              <p className="text-gray-400">
                Esta sección mostrará los logs del servidor. (Funcionalidad pendiente)
              </p>
            </div>
          </>
        );
      default:
        return null;
    }
  };
  
  const renderModal = () => {
    if (!showModal) return null;

    const handleFormSubmit = (e) => {
      e.preventDefault();
      modalOnConfirm(modalFormValues);
      setShowModal(false);
    };

    return (
      <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center p-4">
        <div className="bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-sm">
          <h3 className="text-xl font-semibold mb-4">{modalTitle}</h3>
          {modalType === 'alert' && (
            <p className="text-gray-300 mb-4">{modalMessage}</p>
          )}
          {modalType === 'confirm' && (
            <p className="text-gray-300 mb-4">{modalMessage}</p>
          )}
          {modalType === 'form' && (
            <form onSubmit={handleFormSubmit} className="space-y-4">
              {Object.keys(modalFormValues).map(key => (
                <input
                  key={key}
                  type="text"
                  placeholder={key.charAt(0).toUpperCase() + key.slice(1)}
                  value={modalFormValues[key]}
                  onChange={(e) => setModalFormValues({...modalFormValues, [key]: e.target.value})}
                  className="w-full bg-gray-700 text-gray-100 p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              ))}
              <div className="flex justify-end space-x-2">
                <button type="submit" className="px-4 py-2 bg-green-600 rounded-lg hover:bg-green-700 transition duration-300">
                  Confirmar
                </button>
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 bg-red-600 rounded-lg hover:bg-red-700 transition duration-300">
                  Cancelar
                </button>
              </div>
            </form>
          )}
          {(modalType === 'alert' || modalType === 'confirm') && (
            <div className="flex justify-end space-x-2">
              <button onClick={() => modalOnConfirm()} className="px-4 py-2 bg-green-600 rounded-lg hover:bg-green-700 transition duration-300">
                Aceptar
              </button>
              {modalType === 'confirm' && (
                <button onClick={() => setShowModal(false)} className="px-4 py-2 bg-red-600 rounded-lg hover:bg-red-700 transition duration-300">
                  Cancelar
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };
  
  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 flex">
      <div className="w-64 bg-gray-800 p-6 flex flex-col justify-between">
        <nav className="space-y-2">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveSection(item.id)}
              className={`w-full text-left px-4 py-2 rounded-lg transition duration-300 ${
                activeSection === item.id ? 'bg-blue-600' : 'hover:bg-gray-700'
              }`}
            >
              {item.name}
            </button>
          ))}
        </nav>
        <button onClick={handleLogout} className="w-full px-4 py-2 bg-red-600 rounded-lg shadow-lg hover:bg-red-700 transition duration-300">
          Cerrar Sesión
        </button>
      </div>

      <div className="flex-1 p-8">
        {renderContent()}
      </div>

      {showAssignModal && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center p-4">
          <div className="bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-lg">
            <h3 className="text-xl font-semibold mb-4">Asignar Página a {selectedUserForAssignment?.id}</h3>
            <div className="mb-4">
              <input
                type="text"
                placeholder="Buscar sitios web..."
                className="w-full bg-gray-700 text-gray-100 p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="max-h-64 overflow-y-auto space-y-2 mb-4">
              {filteredWebsites.length > 0 ? (
                filteredWebsites.map((website) => (
                  <div key={website.id} className="bg-gray-700 p-3 rounded-lg flex justify-between items-center">
                    <div>
                      <p className="font-medium">{website.name}</p>
                      <p className="text-sm text-gray-400">{website.url}</p>
                    </div>
                    <button
                      onClick={() => handleAssignWebsiteToUser(website.id)}
                      className="px-4 py-2 bg-green-600 rounded-lg shadow-lg hover:bg-green-700 transition duration-300"
                    >
                      Asignar
                    </button>
                  </div>
                ))
              ) : (
                <p className="text-gray-400 text-center">No se encontraron sitios web.</p>
              )}
            </div>
            <div className="flex justify-end">
              <button
                onClick={() => { setShowAssignModal(false); setSelectedUserForAssignment(null); setSearchQuery(''); }}
                className="px-4 py-2 bg-red-600 rounded-lg shadow-lg hover:bg-red-700 transition duration-300"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
      {renderModal()}
    </div>
  );
}
