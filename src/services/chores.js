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
  or,
  getDoc
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
  // Validate input
  if (!childId) {
    console.error('getAssignedChores called with undefined childId');
    throw new Error('Child ID is required to fetch assigned chores');
  }

  try {
    const choresRef = collection(db, 'chores');
    const q = query(
      choresRef,
      where('assignedTo', '==', childId),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    
    const chores = querySnapshot.docs.map(doc => {
      const choreData = doc.data();
      
      return {
        id: doc.id,
        ...choreData,
        reward: parseFloat(choreData.reward) || 0
      };
    });
    
    return chores;
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
      reward: choreData.resetRewards ? 0 : (parseFloat(choreData.reward) || 0),
      timeframe: choreData.timeframe,
      assignedTo: choreData.assignedTo,
      scheduledDays: choreData.scheduledDays || {},
      status: choreData.status || 'pending',
      completedAt: choreData.completedAt || null,
      verifiedAt: choreData.verifiedAt || null,
      verifiedBy: choreData.verifiedBy || null,
      updatedAt: Timestamp.now(),
      // Only update rewardsResetDate if rewards are manually reset
      ...(choreData.resetRewards && { rewardsResetDate: Timestamp.now() })
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
    
    // First, get the current chore to validate
    const choreDoc = await getDoc(choreRef);
    if (!choreDoc.exists()) {
      throw new Error('Chore not found');
    }
    
    const choreData = choreDoc.data();
    
    // Validate that the chore is assigned to the user
    if (choreData.assignedTo !== userId) {
      throw new Error('Not authorized to mark this chore complete');
    }
    
    // Only update status, completedAt, and updatedAt
    const updates = {
      status: 'completed',
      completedAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    };
    
    await updateDoc(choreRef, updates);
    
    return { 
      id: choreId, 
      ...updates,
      ...choreData
    };
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
    const choresRef = collection(db, 'chores');
    const q = query(
      choresRef,
      where('assignedTo', '==', childId),
      orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    
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
    
    return stats;
  } catch (error) {
    console.error('Error getting child stats:', error);
    throw error;
  }
};
