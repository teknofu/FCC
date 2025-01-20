import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  onAuthStateChanged,
  signOut as firebaseSignOut
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import { useDispatch } from 'react-redux';
import { setUser, setRole } from '../store/slices/authSlice';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const dispatch = useDispatch();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Get additional user data from Firestore
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const userData = {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName,
            ...userDoc.data()
          };
          setCurrentUser(userData);
          dispatch(setUser(userData));
          dispatch(setRole(userData.role || null));
        } else {
          const serializedUser = {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName
          };
          setCurrentUser(serializedUser);
          dispatch(setUser(serializedUser));
        }
      } else {
        setCurrentUser(null);
        dispatch(setUser(null));
        dispatch(setRole(null));
      }
      setLoading(false);
    });

    return unsubscribe;
  }, [dispatch]);

  const signOut = () => {
    return firebaseSignOut(auth);
  };

  const value = {
    currentUser,
    signOut
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
