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
  serverTimestamp,
  orderBy,
  or,
  getDoc,
  runTransaction,
  increment,
  writeBatch,
  limit
} from 'firebase/firestore';
import { createSchedule, getScheduleForChore, updateScheduleNextDue } from './schedules';
import { recordEarning } from './allowances';

/**
 * Create a new chore
 * @param {Object} choreData - The chore data
 * @param {Object} [schedulePattern] Optional schedule pattern for recurring chores
 * @returns {Promise<Object>} The created chore with ID
 */
export const createChore = async (choreData, schedulePattern = null) => {
  const batch = writeBatch(db);

  try {
    // Create chore document
    const choreRef = doc(collection(db, 'chores'));
    const timestamp = serverTimestamp();
    
    const chore = {
      title: choreData.title,
      description: choreData.description,
      reward: parseFloat(choreData.reward) || 0,
      timeframe: choreData.timeframe,
      assignedTo: choreData.assignedTo,
      createdBy: choreData.createdBy,
      status: 'pending',
      scheduledDays: choreData.scheduledDays || {},
      startDate: choreData.startDate || null,
      room: choreData.room || '',
      createdAt: timestamp,
      updatedAt: timestamp
    };

    batch.set(choreRef, chore);

    // If recurring, create schedule
    if (schedulePattern) {
      const schedule = await createSchedule(choreRef.id, schedulePattern);
      chore.scheduleId = schedule.id;
      batch.update(choreRef, { scheduleId: schedule.id });
    }

    await batch.commit();

    return {
      id: choreRef.id,
      ...chore
    };
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
    const q = query(
      collection(db, 'chores'),
      where('createdBy', '==', parentId),
      orderBy('createdAt', 'desc')
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      uid: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate(),
      updatedAt: doc.data().updatedAt?.toDate(),
      completedAt: doc.data().completedAt?.toDate(),
      verifiedAt: doc.data().verifiedAt?.toDate()
    }));
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
    const q = query(
      collection(db, 'chores'),
      where('assignedTo', '==', childId),
      orderBy('createdAt', 'desc')
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      uid: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate(),
      updatedAt: doc.data().updatedAt?.toDate(),
      completedAt: doc.data().completedAt?.toDate(),
      verifiedAt: doc.data().verifiedAt?.toDate()
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
    const updatedChore = {
      title: choreData.title,
      description: choreData.description,
      reward: choreData.resetRewards ? 0 : (parseFloat(choreData.reward) || 0),
      timeframe: choreData.timeframe,
      assignedTo: choreData.assignedTo,
      scheduledDays: choreData.scheduledDays || {},
      startDate: choreData.startDate || null,
      status: choreData.status || 'pending',
      completedAt: choreData.completedAt || null,
      verifiedAt: choreData.verifiedAt || null,
      verifiedBy: choreData.verifiedBy || null,
      completionComment: choreData.completionComment || null,
      verificationComment: choreData.verificationComment || null,
      room: choreData.room || '',
      updatedAt: serverTimestamp(),
      ...(choreData.resetRewards && { rewardsResetDate: serverTimestamp() })
    };

    await updateDoc(choreRef, updatedChore);

    return {
      id: choreId,
      ...updatedChore
    };
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
 * @param {string} [comment] - Optional completion comment
 * @returns {Promise<Object>} The updated chore
 */
export const markChoreComplete = async (choreId, userId, comment = "") => {
  try {
    const choreRef = doc(db, 'chores', choreId);
    const choreSnapshot = await getDoc(choreRef);
    
    if (!choreSnapshot.exists()) {
      throw new Error('Chore not found');
    }
    
    const choreData = choreSnapshot.data();
    
    // Update chore status
    const updateData = {
      status: 'completed',
      completedBy: userId,
      completedAt: serverTimestamp(),
      completionComment: comment || null
    };
    
    await updateDoc(choreRef, updateData);
    
    return { 
      id: choreId, 
      ...choreData, 
      ...updateData,
      status: 'completed',
      completionComment: comment || null
    };
  } catch (error) {
    console.error('Error marking chore complete:', error);
    throw error;
  }
};

/**
 * Verify a completed chore
 * @param {string} choreId - The chore ID
 * @param {boolean} isApproved - Whether the chore is approved
 * @param {string} verifiedBy - The user ID of the person verifying
 * @param {string} [comment] - Optional verification comment
 * @returns {Promise<void>}
 */
export const verifyChore = async (choreId, isApproved, verifiedBy, comment = "") => {
  try {
    const choreRef = doc(db, 'chores', choreId);
    const choreDoc = await getDoc(choreRef);

    if (!choreDoc.exists()) {
      throw new Error('Chore not found');
    }

    const choreData = choreDoc.data();

    if (isApproved) {
      // If approved, update status and add verification details
      await updateDoc(choreRef, {
        status: 'verified',
        verifiedBy,
        verifiedAt: serverTimestamp(),
        verificationComment: comment || null
      });

      // Record the reward if approved
      if (choreData.reward && choreData.reward > 0) {
        await recordEarning(choreData.assignedTo, choreData.reward, {
          type: 'chore',
          choreId,
          choreName: choreData.title
        });
      }
    } else {
      // If rejected, reset the chore to pending
      await updateDoc(choreRef, {
        status: 'pending',
        completedAt: null,
        completedBy: null,
        completionComment: null,
        verifiedBy,
        verifiedAt: serverTimestamp(),
        verificationComment: comment || null
      });
    }
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
    const rewardsRef = collection(db, 'rewards');

    // Query chores for the child
    const choresQuery = query(
      choresRef,
      where('assignedTo', '==', childId),
      orderBy('createdAt', 'desc')
    );
    const choresSnapshot = await getDocs(choresQuery);
    
    const chores = choresSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Query rewards for the child
    const rewardsQuery = query(
      rewardsRef,
      where('childId', '==', childId)
    );
    const rewardsSnapshot = await getDocs(rewardsQuery);
    
    // Calculate total rewards from rewards collection
    const totalRewardsEarned = rewardsSnapshot.docs.reduce((sum, doc) => {
      const reward = doc.data();
      return sum + (parseFloat(reward.amount) || 0);
    }, 0);

    // Calculate stats
    const now = new Date();
    const weekStart = new Date(now.setDate(now.getDate() - now.getDay()));
    
    const stats = {
      totalChoresCompleted: chores.filter(c => c.status === 'verified').length,
      weeklyChoresCompleted: chores.filter(c => 
        c.status === 'verified' && 
        c.verifiedAt?.toDate() >= weekStart
      ).length,
      totalRewardsEarned
    };
    
    return stats;
  } catch (error) {
    console.error('Error getting child stats:', error);
    throw error;
  }
};

/**
 * Get all chores for a child
 * @param {string} childId - The child's user ID
 * @param {string} [status] - Optional status filter
 * @returns {Promise<Array>} List of chores
 */
export const getChildChores = async (childId, status = null) => {
  try {
    const choresRef = collection(db, 'chores');
    let q = query(
      choresRef,
      where('assignedTo', '==', childId),
      orderBy('createdAt', 'desc')
    );

    if (status) {
      q = query(q, where('status', '==', status));
    }

    const snapshot = await getDocs(q);
    const chores = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Fetch schedule details for recurring chores
    for (const chore of chores) {
      if (chore.scheduleId) {
        chore.schedule = await getScheduleForChore(chore.id);
      }
    }

    return chores;
  } catch (error) {
    console.error('Error getting child chores:', error);
    throw error;
  }
};
