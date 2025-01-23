import {
  collection,
  doc,
  query,
  where,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  writeBatch,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../config/firebase';

/**
 * Calculate the next due date based on a schedule pattern
 * @param {Object} pattern Schedule pattern object
 * @param {Date} [baseDate] Optional base date to calculate from
 * @returns {Date} Next due date
 */
export const calculateNextDue = (pattern, baseDate = new Date()) => {
  const nextDue = new Date(baseDate);
  
  switch (pattern.type) {
    case 'daily':
      nextDue.setDate(nextDue.getDate() + 1);
      break;
      
    case 'weekly':
      // Find the next occurrence of any specified days
      if (pattern.days && pattern.days.length > 0) {
        const today = nextDue.getDay();
        const nextDays = pattern.days
          .map(day => (day - today + 7) % 7)
          .filter(diff => diff > 0);
        
        if (nextDays.length > 0) {
          nextDue.setDate(nextDue.getDate() + Math.min(...nextDays));
        } else {
          // If no days left this week, get first day next week
          nextDue.setDate(nextDue.getDate() + ((7 + pattern.days[0] - today) % 7));
        }
      } else {
        // Default to same day next week if no days specified
        nextDue.setDate(nextDue.getDate() + 7);
      }
      break;
      
    case 'monthly':
      nextDue.setMonth(nextDue.getMonth() + 1);
      break;
      
    default:
      throw new Error(`Unknown schedule type: ${pattern.type}`);
  }

  // If time is specified, set it
  if (pattern.time) {
    const [hours, minutes] = pattern.time.split(':').map(Number);
    nextDue.setHours(hours, minutes, 0, 0);
  } else {
    // Default to start of day
    nextDue.setHours(0, 0, 0, 0);
  }

  return nextDue;
};

/**
 * Create a new schedule for a chore
 * @param {string} choreId ID of the chore
 * @param {Object} pattern Schedule pattern
 * @returns {Promise<Object>} Created schedule
 */
export const createSchedule = async (choreId, pattern) => {
  try {
    const scheduleData = {
      choreId,
      pattern,
      lastGenerated: serverTimestamp(),
      nextDue: calculateNextDue(pattern),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    const docRef = await addDoc(collection(db, 'schedules'), scheduleData);
    return {
      id: docRef.id,
      ...scheduleData
    };
  } catch (error) {
    console.error('Error creating schedule:', error);
    throw error;
  }
};

/**
 * Get schedule for a specific chore
 * @param {string} choreId Chore ID
 * @returns {Promise<Object|null>} Schedule object or null if not found
 */
export const getScheduleForChore = async (choreId) => {
  try {
    const schedulesRef = collection(db, 'schedules');
    const q = query(schedulesRef, where('choreId', '==', choreId));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return null;
    }

    const doc = snapshot.docs[0];
    return {
      id: doc.id,
      ...doc.data()
    };
  } catch (error) {
    console.error('Error getting schedule:', error);
    throw error;
  }
};

/**
 * Update a schedule's next due date
 * @param {string} scheduleId Schedule ID
 * @param {Date} [completionDate] Optional completion date to calculate from
 * @returns {Promise<void>}
 */
export const updateScheduleNextDue = async (scheduleId, completionDate) => {
  try {
    const scheduleRef = doc(db, 'schedules', scheduleId);
    const schedule = await getDoc(scheduleRef);

    if (!schedule.exists()) {
      throw new Error('Schedule not found');
    }

    const data = schedule.data();
    const nextDue = calculateNextDue(data.pattern, completionDate);

    await updateDoc(scheduleRef, {
      lastGenerated: serverTimestamp(),
      nextDue,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error updating schedule:', error);
    throw error;
  }
};

/**
 * Delete a schedule
 * @param {string} scheduleId Schedule ID
 * @returns {Promise<void>}
 */
export const deleteSchedule = async (scheduleId) => {
  try {
    await deleteDoc(doc(db, 'schedules', scheduleId));
  } catch (error) {
    console.error('Error deleting schedule:', error);
    throw error;
  }
};
