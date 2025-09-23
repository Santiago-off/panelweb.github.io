'use client'

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../../../src/firebase'; 

export default function DashboardPage() {
  const [user, setUser] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (authUser) => {
      if (authUser) {
        setUser(authUser);
      } else {
        router.push('/login');
      }
    });

    return () => unsubscribe();
  }, [router]);

  if (!user) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p>Cargando...</p>
      </div>
    );
  }

  return (
    <div className="p-8">
      <h1 className="text-4xl font-bold text-gray-800">Bienvenido al Panel de Administración</h1>
      <p className="mt-4 text-lg text-gray-600">
        Has iniciado sesión con el correo electrónico: {user.email}
      </p>
    </div>
  );
}
