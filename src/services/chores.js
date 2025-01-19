import { db } from '../config/firebase';
import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  doc,
  updateDoc,
  deleteDoc,
  Timestamp,
  orderBy,
  or
} from 'firebase/firestore';

/**
 * Create a new chore
 * @param {Object} choreData - The chore data
 * @returns {Promise<Object>} The created chore with ID
 */
export const createChore = async (choreData) => {
  try {
    const choresRef = collection(db, 'chores');
    const newChore = {
      title: choreData.title,
      description: choreData.description,
      reward: parseFloat(choreData.reward) || 0,
      timeframe: choreData.timeframe,
      assignedTo: choreData.assignedTo,
      createdBy: choreData.createdBy,
      status: 'pending',
      scheduledDays: choreData.scheduledDays || {},
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    };
    const docRef = await addDoc(choresRef, newChore);
    return { id: docRef.id, ...newChore };
  } catch (error) {
    console.error('Error creating chore:', error);
    throw error;
  }
};

/**
 * Get all chores for a parent
 * @param {string} parentId - The parent's user ID
 * @returns {Promise<Array>} Array of chores
 */
export const getChores = async (parentId) => {
  try {
    console.log('Getting chores for parent:', parentId);
    const choresRef = collection(db, 'chores');
    const q = query(
      choresRef,
      or(
        where('createdBy', '==', parentId),
        where('createdBy', '==', null)
      ),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    console.log('Found chores:', querySnapshot.size);
    
    // Map the results and ensure createdBy is set
    const chores = querySnapshot.docs.map(doc => {
      const data = doc.data();
      // If createdBy is not set, update it
      if (!data.createdBy) {
        const choreRef = doc.ref;
        updateDoc(choreRef, { 
          createdBy: parentId,
          updatedAt: Timestamp.now()
        });
      }
      return {
        id: doc.id,
        ...data,
        createdBy: data.createdBy || parentId,
        reward: parseFloat(data.reward) || 0
      };
    });
    
    return chores;
  } catch (error) {
    console.error('Error getting chores:', error);
    throw error;
  }
};

/**
 * Get chores assigned to a child
 * @param {string} childId - The child's user ID
 * @returns {Promise<Array>} Array of chores
 */
export const getAssignedChores = async (childId) => {
  try {
    console.log('Getting assigned chores for child:', childId);
    const choresRef = collection(db, 'chores');
    const q = query(
      choresRef,
      where('assignedTo', '==', childId),
      orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    console.log('Found assigned chores:', querySnapshot.size);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      reward: parseFloat(doc.data().reward) || 0
    }));
  } catch (error) {
    console.error('Error getting assigned chores:', error);
    throw error;
  }
};

/**
 * Update a chore
 * @param {string} choreId - The chore ID
 * @param {Object} choreData - The updated chore data
 * @returns {Promise<Object>} The updated chore
 */
export const updateChore = async (choreId, choreData) => {
  try {
    const choreRef = doc(db, 'chores', choreId);
    const updates = {
      title: choreData.title,
      description: choreData.description,
      reward: parseFloat(choreData.reward) || 0,
      timeframe: choreData.timeframe,
      assignedTo: choreData.assignedTo,
      scheduledDays: choreData.scheduledDays || {},
      updatedAt: Timestamp.now()
    };
    await updateDoc(choreRef, updates);
    return { id: choreId, ...updates };
  } catch (error) {
    console.error('Error updating chore:', error);
    throw error;
  }
};

/**
 * Delete a chore
 * @param {string} choreId - The chore ID
 * @returns {Promise<string>} The deleted chore ID
 */
export const deleteChore = async (choreId) => {
  try {
    const choreRef = doc(db, 'chores', choreId);
    await deleteDoc(choreRef);
    return choreId;
  } catch (error) {
    console.error('Error deleting chore:', error);
    throw error;
  }
};

/**
 * Mark a chore as complete
 * @param {string} choreId - The chore ID
 * @param {string} userId - The user marking the chore complete
 * @returns {Promise<Object>} The updated chore
 */
export const markChoreComplete = async (choreId, userId) => {
  try {
    const choreRef = doc(db, 'chores', choreId);
    const updates = {
      status: 'completed',
      completedBy: userId,
      completedAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    };
    await updateDoc(choreRef, updates);
    return { id: choreId, ...updates };
  } catch (error) {
    console.error('Error marking chore complete:', error);
    throw error;
  }
};

/**
 * Verify or reject a completed chore
 * @param {string} choreId - The chore ID
 * @param {boolean} isApproved - Whether the chore is approved
 * @param {string} verifiedBy - The user verifying the chore
 * @returns {Promise<Object>} The updated chore
 */
export const verifyChore = async (choreId, isApproved, verifiedBy) => {
  try {
    const choreRef = doc(db, 'chores', choreId);
    const updates = {
      status: isApproved ? 'verified' : 'rejected',
      verifiedBy,
      verifiedAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    };
    await updateDoc(choreRef, updates);
    return { id: choreId, ...updates };
  } catch (error) {
    console.error('Error verifying chore:', error);
    throw error;
  }
};

/**
 * Get stats for a child
 * @param {string} childId - The child's user ID
 * @returns {Promise<Object>} The child's stats
 */
export const getChildStats = async (childId) => {
  try {
    console.log('Getting stats for child:', childId);
    const choresRef = collection(db, 'chores');
    const q = query(
      choresRef,
      where('assignedTo', '==', childId),
      orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    console.log('Found chores for stats:', querySnapshot.size);
    
    const chores = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      reward: parseFloat(doc.data().reward) || 0
    }));

    // Calculate stats
    const now = new Date();
    const weekStart = new Date(now.setDate(now.getDate() - now.getDay()));
    
    const stats = {
      totalChoresCompleted: chores.filter(c => c.status === 'verified').length,
      weeklyChoresCompleted: chores.filter(c => 
        c.status === 'verified' && 
        c.verifiedAt?.toDate() >= weekStart
      ).length,
      totalRewardsEarned: chores
        .filter(c => c.status === 'verified')
        .reduce((sum, c) => sum + (c.reward || 0), 0)
    };
    
    console.log('Child stats:', stats);
    return stats;
  } catch (error) {
    console.error('Error getting child stats:', error);
    throw error;
  }
};
