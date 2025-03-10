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
  limit,
  arrayUnion,
  arrayRemove
} from 'firebase/firestore';
import { createSchedule, getScheduleForChore, updateScheduleNextDue } from './schedules';
import { getAuth } from 'firebase/auth';

/**
 * Create a new chore
 * @param {Object} choreData - The chore data
 * @param {Object} [schedulePattern] Optional schedule pattern for recurring chores
 * @returns {Promise<Object>} The created chore with ID
 */
export const createChore = async (choreData, schedulePattern = null) => {
  try {
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) throw new Error('User must be authenticated to create chores');

    // Add creator and timestamps
    const choreWithMeta = {
      ...choreData,
      reward: parseFloat(choreData.reward) || 0,
      createdBy: user.uid,
      parentAccess: [user.uid], // Initialize with creator's access
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      status: 'pending',
      // Support for multiple assignees and rotation
      assignees: Array.isArray(choreData.assignedTo) ? choreData.assignedTo : [choreData.assignedTo],
      currentAssigneeIndex: 0,
      rotationEnabled: choreData.rotationEnabled || false,
      rotationType: choreData.rotationType || 'completion', // 'completion' or 'schedule'
      rotationSchedule: choreData.rotationSchedule || null, // For schedule-based rotation (e.g., weekly, monthly)
      lastRotation: serverTimestamp(),
    };

    // Add schedule if provided
    if (schedulePattern) {
      choreWithMeta.schedule = schedulePattern;
      choreWithMeta.isRecurring = true;
    }

    const docRef = await addDoc(collection(db, 'chores'), choreWithMeta);
    return { id: docRef.id, ...choreWithMeta };
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
    // Query for both old and new chore structures
    const q1 = query(
      collection(db, 'chores'),
      where('createdBy', '==', parentId),
      orderBy('createdAt', 'desc')
    );

    const q2 = query(
      collection(db, 'chores'),
      where('parentAccess', 'array-contains', parentId),
      orderBy('createdAt', 'desc')
    );

    const [snapshot1, snapshot2] = await Promise.all([
      getDocs(q1),
      getDocs(q2)
    ]);

    // Combine and deduplicate results
    const choresMap = new Map();

    const processSnapshot = (snapshot) => {
      snapshot.docs.forEach(doc => {
        if (!choresMap.has(doc.id)) {
          const data = doc.data();
          // Ensure parentAccess exists
          if (!data.parentAccess) {
            data.parentAccess = [data.createdBy];
          }
          choresMap.set(doc.id, {
            id: doc.id,
            uid: doc.id,
            ...data,
            createdAt: data.createdAt?.toDate(),
            updatedAt: data.updatedAt?.toDate(),
            completedAt: data.completedAt?.toDate(),
            verifiedAt: data.verifiedAt?.toDate()
          });
        }
      });
    };

    processSnapshot(snapshot1);
    processSnapshot(snapshot2);

    return Array.from(choresMap.values());
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
      // Support for multiple assignees and rotation
      assignees: Array.isArray(choreData.assignees) ? choreData.assignees : [choreData.assignedTo],
      currentAssigneeIndex: choreData.currentAssigneeIndex || 0,
      rotationEnabled: choreData.rotationEnabled || false,
      rotationType: choreData.rotationType || 'completion',
      rotationSchedule: choreData.rotationSchedule || null,
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
        await recordEarning({
          childId: choreData.assignedTo,
          amount: choreData.reward,
          source: {
            type: 'chore',
            choreId,
            choreName: choreData.title
          }
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
 * Rotate the assignee for a chore
 * @param {string} choreId - The chore ID
 * @returns {Promise<Object>} The updated chore
 */
export const rotateChoreAssignee = async (choreId) => {
  try {
    const choreRef = doc(db, 'chores', choreId);
    
    return await runTransaction(db, async (transaction) => {
      const choreDoc = await transaction.get(choreRef);
      if (!choreDoc.exists()) {
        throw new Error('Chore not found');
      }

      const choreData = choreDoc.data();
      if (!choreData.rotationEnabled || !Array.isArray(choreData.assignees) || choreData.assignees.length <= 1) {
        return choreData;
      }

      // Calculate next assignee index
      const nextIndex = (choreData.currentAssigneeIndex + 1) % choreData.assignees.length;

      // Update the chore with new assignee
      const updates = {
        currentAssigneeIndex: nextIndex,
        assignedTo: choreData.assignees[nextIndex],
        lastRotation: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      transaction.update(choreRef, updates);

      return {
        ...choreData,
        ...updates
      };
    });
  } catch (error) {
    console.error('Error rotating chore assignee:', error);
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

/**
 * Add a parent's access to manage a chore
 * @param {string} choreId - The chore ID
 * @param {string} parentId - The parent's user ID to add
 * @returns {Promise<void>}
 */
export const addParentAccess = async (choreId, parentId) => {
  try {
    const choreRef = doc(db, 'chores', choreId);
    await updateDoc(choreRef, {
      parentAccess: arrayUnion(parentId),
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error adding parent access:', error);
    throw error;
  }
};

/**
 * Remove a parent's access to manage a chore
 * @param {string} choreId - The chore ID
 * @param {string} parentId - The parent's user ID to remove
 * @returns {Promise<void>}
 */
export const removeParentAccess = async (choreId, parentId) => {
  try {
    const choreRef = doc(db, 'chores', choreId);
    await updateDoc(choreRef, {
      parentAccess: arrayRemove(parentId),
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error removing parent access:', error);
    throw error;
  }
};

/**
 * Record an earning for a child
 * @param {Object} earningData - The earning data
 * @param {string} earningData.childId - The child's ID
 * @param {number} earningData.amount - The amount earned
 * @param {Object} earningData.source - Source of the earning
 * @returns {Promise<Object>} The created earning record
 */
export const recordEarning = async (earningData) => {
  try {
    const data = {
      childId: earningData.childId,
      amount: parseFloat(earningData.amount),
      source: earningData.source,
      createdAt: serverTimestamp()
    };
    
    const docRef = await addDoc(collection(db, 'earnings'), data);
    return { id: docRef.id, ...data };
  } catch (error) {
    console.error('Error recording earning:', error);
    throw error;
  }
};

/**
 * Get earnings history for a child
 * @param {string} childId - The child's ID
 * @returns {Promise<Array>} List of earnings
 */
export const getEarningsHistory = async (childId) => {
  try {
    const q = query(
      collection(db, 'earnings'),
      where('childId', '==', childId),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error getting earnings history:', error);
    throw error;
  }
};

/**
 * Get total earnings for a child
 * @param {string} childId - The child's ID
 * @returns {Promise<number>} Total earnings
 */
export const getTotalEarnings = async (childId) => {
  try {
    const earnings = await getEarningsHistory(childId);
    return earnings.reduce((total, earning) => total + earning.amount, 0);
  } catch (error) {
    console.error('Error getting total earnings:', error);
    throw error;
  }
};

/**
 * Get payment schedule for a child
 * @param {string} childId - The child's ID
 * @returns {Promise<Object>} Payment schedule
 */
export const getPaymentSchedule = async (childId) => {
  try {
    const q = query(
      collection(db, 'paymentSchedules'),
      where('childId', '==', childId),
      limit(1)
    );
    
    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) {
      return null;
    }
    
    const doc = querySnapshot.docs[0];
    return {
      id: doc.id,
      ...doc.data()
    };
  } catch (error) {
    console.error('Error getting payment schedule:', error);
    throw error;
  }
};

/**
 * Setup payment schedule for a child
 * @param {string} childId - The child's ID
 * @param {Object} scheduleData - Payment schedule data
 * @returns {Promise<Object>} Created payment schedule
 */
export const setupPaymentSchedule = async (childId, scheduleData) => {
  try {
    const data = {
      childId,
      frequency: scheduleData.frequency,
      dayOfWeek: scheduleData.dayOfWeek,
      dayOfMonth: scheduleData.dayOfMonth,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    
    const docRef = await addDoc(collection(db, 'paymentSchedules'), data);
    return { id: docRef.id, ...data };
  } catch (error) {
    console.error('Error setting up payment schedule:', error);
    throw error;
  }
};

/**
 * Get payment history for a child
 * @param {string} childId - The child's ID
 * @returns {Promise<Array>} List of payments
 */
export const getPaymentHistory = async (childId) => {
  try {
    const q = query(
      collection(db, 'payments'),
      where('childId', '==', childId),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error getting payment history:', error);
    throw error;
  }
};

/**
 * Record a payment for earnings
 * @param {string} childId - The child's ID
 * @param {Array} earningIds - List of earning IDs being paid
 * @param {string} method - Payment method
 * @returns {Promise<Object>} Created payment record
 */
export const recordPayment = async (childId, earningIds, method) => {
  try {
    const batch = writeBatch(db);
    let totalAmount = 0;
    const earnings = [];
    
    // Get all earnings being paid
    for (const earningId of earningIds) {
      const earningRef = doc(db, 'earnings', earningId);
      const earningDoc = await getDoc(earningRef);
      
      if (!earningDoc.exists()) {
        throw new Error(`Earning ${earningId} not found`);
      }
      
      const earning = earningDoc.data();
      totalAmount += earning.amount;
      earnings.push({
        id: earningId,
        ...earning
      });
      
      // Mark earning as paid
      batch.update(earningRef, {
        paid: true,
        paidAt: serverTimestamp()
      });
    }
    
    // Create payment record
    const paymentRef = await addDoc(collection(db, 'payments'), {
      childId,
      amount: totalAmount,
      method,
      earningIds,
      createdAt: serverTimestamp()
    });
    
    // Commit all updates
    await batch.commit();
    
    return {
      id: paymentRef.id,
      childId,
      amount: totalAmount,
      method,
      earnings
    };
  } catch (error) {
    console.error('Error recording payment:', error);
    throw error;
  }
};
