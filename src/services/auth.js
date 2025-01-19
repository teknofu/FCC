import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  updateProfile as firebaseUpdateProfile,
  updatePassword as firebaseUpdatePassword,
  EmailAuthProvider,
  reauthenticateWithCredential
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp, updateDoc } from 'firebase/firestore';
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
    await firebaseUpdateProfile(user, { displayName });

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
    const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));
    const userData = userDoc.data();
    
    // Check if this is the first login with a temporary password
    if (userData.temporaryPassword) {
      return {
        user: userCredential.user,
        requiresPasswordChange: true,
        ...userData
      };
    }
    
    return {
      user: userCredential.user,
      ...userData
    };
  } catch (error) {
    console.error('Login error:', error);
    handleAuthError(error);
  }
};

export const logoutUser = async () => {
  try {
    await firebaseSignOut(auth);
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

export const updatePassword = async (currentPassword, newPassword) => {
  try {
    const user = auth.currentUser;
    const credential = EmailAuthProvider.credential(
      user.email,
      currentPassword
    );
    
    // Re-authenticate user before password change
    await reauthenticateWithCredential(user, credential);
    
    // Update password
    await firebaseUpdatePassword(user, newPassword);
    
    // Update user document to remove temporary password flag
    await updateDoc(doc(db, 'users', user.uid), {
      temporaryPassword: false
    });
  } catch (error) {
    throw new Error(error.message);
  }
};

export const updateUserProfile = async (profileData) => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error('No user logged in');

    // Update Firebase Auth profile
    await firebaseUpdateProfile(user, {
      displayName: profileData.displayName,
      photoURL: profileData.photoURL
    });

    // Update Firestore user document
    const userRef = doc(db, 'users', user.uid);
    await updateDoc(userRef, {
      displayName: profileData.displayName,
      photoURL: profileData.photoURL,
      updatedAt: new Date()
    });

    return {
      success: true,
      message: 'Profile updated successfully'
    };
  } catch (error) {
    console.error('Error updating profile:', error);
    throw new Error(error.message);
  }
};
