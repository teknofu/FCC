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
        
        // Create a serializable user object with only the data we need
        const serializedUser = {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          emailVerified: user.emailVerified,
          // Add any other primitive fields you need from the user object
          ...(userDoc.exists() ? userDoc.data() : {})
        };

        setCurrentUser(serializedUser);
        dispatch(setUser(serializedUser));
        dispatch(setRole(serializedUser.role || null));
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
