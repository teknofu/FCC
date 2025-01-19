import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../config/firebase';

const handleAuthError = (error) => {
  console.error('Auth error:', error);
  let message = 'An error occurred during authentication.';
  
  switch (error.code) {
    case 'auth/user-not-found':
      message = 'No user found with this email address.';
      break;
    case 'auth/wrong-password':
      message = 'Incorrect password.';
      break;
    case 'auth/email-already-in-use':
      message = 'This email is already registered.';
      break;
    case 'auth/weak-password':
      message = 'Password should be at least 6 characters.';
      break;
    case 'auth/invalid-email':
      message = 'Invalid email address.';
      break;
    case 'auth/operation-not-allowed':
      message = 'Email/password accounts are not enabled. Please contact support.';
      break;
  }
  
  throw new Error(message);
};

export const registerUser = async (email, password, displayName, role) => {
  try {
    console.log('Starting user registration with role:', role);
    
    // Create user with Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Update profile with display name
    await updateProfile(user, { displayName });

    // Store additional user data in Firestore
    const userData = {
      email,
      displayName,
      role,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    console.log('Creating user document in Firestore:', userData);
    await setDoc(doc(db, 'users', user.uid), userData);

    return {
      uid: user.uid,
      email: user.email,
      displayName,
      role
    };
  } catch (error) {
    console.error('Registration error:', error);
    handleAuthError(error);
  }
};

export const loginUser = async (email, password) => {
  try {
    console.log('Attempting login for:', email);
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Get additional user data from Firestore
    console.log('Getting user document from Firestore for UID:', user.uid);
    const userDocRef = doc(db, 'users', user.uid);
    const userDoc = await getDoc(userDocRef);
    
    if (!userDoc.exists()) {
      console.error('User document not found in Firestore');
      throw new Error('User data not found. Please contact support.');
    }

    const userData = userDoc.data();
    console.log('Retrieved user data:', userData);

    if (!userData.role) {
      console.error('No role found in user data:', userData);
      throw new Error('User role not found. Please contact support.');
    }

    const userInfo = {
      uid: user.uid,
      email: user.email,
      displayName: userData.displayName || user.displayName,
      role: userData.role
    };

    console.log('Returning user info:', userInfo);
    return userInfo;
  } catch (error) {
    console.error('Login error:', error);
    handleAuthError(error);
  }
};

export const logoutUser = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error('Logout error:', error);
    throw new Error('Failed to log out. Please try again.');
  }
};

export const getCurrentUser = async () => {
  const user = auth.currentUser;
  if (!user) return null;

  try {
    console.log('Getting current user data for UID:', user.uid);
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    
    if (!userDoc.exists()) {
      console.error('User document not found for current user');
      return null;
    }

    const userData = userDoc.data();
    console.log('Current user data:', userData);

    if (!userData.role) {
      console.error('No role found in current user data');
      return null;
    }

    return {
      uid: user.uid,
      email: user.email,
      displayName: userData.displayName || user.displayName,
      role: userData.role
    };
  } catch (error) {
    console.error('Error getting current user data:', error);
    return null;
  }
};
