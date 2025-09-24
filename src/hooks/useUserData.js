import { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../../config';

/**
 * Custom hook to get real-time user data from Firestore.
 * @returns {object} An object containing the user data and a loading state.
 */
export function useUserData() {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const currentUser = auth.currentUser;
    if (currentUser) {
      // Path to the user's document in the 'users' collection
      const userDocRef = doc(db, 'users', currentUser.uid);

      // Listen for real-time updates to the user document
      const unsubscribe = onSnapshot(userDocRef, (doc) => {
        if (doc.exists()) {
          setUserData({ uid: doc.id, ...doc.data() });
        } else {
          // Handle case where user is authenticated but has no user document
          setUserData(null);
        }
        setLoading(false);
      });

      return () => unsubscribe(); // Cleanup listener on unmount
    }
  }, []);

  return { userData, loading };
}