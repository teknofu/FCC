import { 
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  query,
  where,
  orderBy,
  Timestamp 
} from 'firebase/firestore';
import { db } from '../config/firebase';

export const createChore = async (choreData) => {
  try {
    const choresRef = collection(db, 'chores');
    const newChore = {
      ...choreData,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      status: 'pending'
    };
    const docRef = await addDoc(choresRef, newChore);
    return { id: docRef.id, ...newChore };
  } catch (error) {
    throw error;
  }
};

export const updateChore = async (choreId, updates) => {
  try {
    const choreRef = doc(db, 'chores', choreId);
    const updatedData = {
      ...updates,
      updatedAt: Timestamp.now()
    };
    await updateDoc(choreRef, updatedData);
    return { id: choreId, ...updatedData };
  } catch (error) {
    throw error;
  }
};

export const deleteChore = async (choreId) => {
  try {
    const choreRef = doc(db, 'chores', choreId);
    await deleteDoc(choreRef);
    return choreId;
  } catch (error) {
    throw error;
  }
};

export const getChores = async (filters = {}) => {
  try {
    const choresRef = collection(db, 'chores');
    let q = query(choresRef, orderBy('createdAt', 'desc'));

    // Apply filters
    if (filters.assignedTo) {
      q = query(q, where('assignedTo', '==', filters.assignedTo));
    }
    if (filters.status && filters.status !== 'all') {
      q = query(q, where('status', '==', filters.status));
    }
    if (filters.timeframe && filters.timeframe !== 'all') {
      q = query(q, where('timeframe', '==', filters.timeframe));
    }

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    throw error;
  }
};

export const markChoreComplete = async (choreId, userId) => {
  try {
    const choreRef = doc(db, 'chores', choreId);
    await updateDoc(choreRef, {
      status: 'completed',
      completedBy: userId,
      completedAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });
    return choreId;
  } catch (error) {
    throw error;
  }
};

export const verifyChore = async (choreId, verifiedBy, approved) => {
  try {
    const choreRef = doc(db, 'chores', choreId);
    await updateDoc(choreRef, {
      status: approved ? 'verified' : 'rejected',
      verifiedBy,
      verifiedAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });
    return choreId;
  } catch (error) {
    throw error;
  }
};
