'use client';

import { useEffect, useState } from 'react';
import { collection, onSnapshot, query, doc, getDoc } from 'firebase/firestore'; 
import { db } from '../../../src/firebase';

export default function DemoPage() {
  const [pageContent, setPageContent] = useState('');
  const [websiteName, setWebsiteName] = useState('Cargando...');

  useEffect(() => {
    const q = query(collection(db, 'websites'));
    const unsubscribe = onSnapshot(q, async (snapshot) => {
      if (!snapshot.empty) {
        // Obtenemos el ID del primer sitio web en la lista
        const websiteDoc = snapshot.docs[0];
        const websiteId = websiteDoc.id;
        const websiteData = websiteDoc.data();
        setWebsiteName(websiteData.nombre);

        // Obtenemos el contenido de la página de inicio
        const pageDocRef = doc(db, 'websites', websiteId, 'pages', 'homepage');
        const pageDoc = await getDoc(pageDocRef);

        if (pageDoc.exists()) {
          setPageContent(pageDoc.data().content);
        } else {
          setPageContent('¡Bienvenido! Este contenido aún no ha sido editado.');
        }
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-8">
      <div className="w-full max-w-4xl p-10 bg-white rounded-xl shadow-lg">
        <h1 className="text-4xl font-bold text-center text-gray-800 mb-6">
          Página de Demostración - {websiteName}
        </h1>
        <div className="text-lg text-gray-700 leading-relaxed prose max-w-none">
          {pageContent.split('\n').map((line, index) => (
            <p key={index} className="my-2">{line}</p>
          ))}
        </div>
      </div>
    </div>
  );
}
