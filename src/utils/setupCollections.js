import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';

/**
 * Create initial allowance for a child
 * @param {string} childId Child's user ID
 * @returns {Promise<void>}
 */
export const createInitialAllowance = async (childId) => {
  try {
    // Create base weekly allowance
    await addDoc(collection(db, 'allowances'), {
      childId,
      type: 'base',
      amount: 10.00,  // $10 weekly allowance
      frequency: 'weekly',
      nextPaymentDue: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week from now
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    console.log('Created initial allowance for child:', childId);
  } catch (error) {
    console.error('Error creating initial allowance:', error);
    throw error;
  }
};

/**
 * Create initial chore schedule
 * @param {string} choreId Chore ID
 * @param {Object} pattern Schedule pattern
 * @returns {Promise<void>}
 */
export const createInitialSchedule = async (choreId, pattern) => {
  try {
    await addDoc(collection(db, 'schedules'), {
      choreId,
      pattern,
      lastGenerated: serverTimestamp(),
      nextDue: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    console.log('Created initial schedule for chore:', choreId);
  } catch (error) {
    console.error('Error creating initial schedule:', error);
    throw error;
  }
};

/**
 * Record an initial earning
 * @param {string} childId Child's user ID
 * @param {number} amount Amount earned
 * @param {Object} source Source of earning
 * @returns {Promise<void>}
 */
export const recordInitialEarning = async (childId, amount, source) => {
  try {
    await addDoc(collection(db, 'earnings'), {
      childId,
      amount,
      source,
      earnedAt: serverTimestamp()
    });

    console.log('Recorded initial earning for child:', childId);
  } catch (error) {
    console.error('Error recording initial earning:', error);
    throw error;
  }
};
