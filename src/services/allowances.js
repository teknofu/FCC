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
  serverTimestamp,
  orderBy,
  limit
} from 'firebase/firestore';
import { db } from '../config/firebase';

/**
 * Record an earning for a child from a completed chore
 * @param {Object} earningData Earning data
 * @returns {Promise<Object>} Created earning
 */
export const recordEarning = async (earningData) => {
  try {
    const data = {
      childId: earningData.childId,
      amount: parseFloat(earningData.amount),
      source: earningData.source,
      createdAt: serverTimestamp(),
      paid: false
    };

    const docRef = await addDoc(collection(db, 'earnings'), data);
    return {
      id: docRef.id,
      ...data
    };
  } catch (error) {
    console.error('Error recording earning:', error);
    throw error;
  }
};

/**
 * Get earnings history for a child
 * @param {string} childId Child's user ID
 * @param {number} [limit] Optional limit of records to return
 * @returns {Promise<Array>} List of earnings
 */
export const getEarningsHistory = async (childId, limitCount = 50) => {
  try {
    const q = query(
      collection(db, 'earnings'),
      where('childId', '==', childId),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
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
 * @param {string} childId Child's user ID
 * @returns {Promise<number>} Total earnings
 */
export const getTotalEarnings = async (childId) => {
  try {
    const q = query(
      collection(db, 'earnings'),
      where('childId', '==', childId)
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.reduce((total, doc) => {
      const earning = doc.data();
      return total + (parseFloat(earning.amount) || 0);
    }, 0);
  } catch (error) {
    console.error('Error getting total earnings:', error);
    throw error;
  }
};

/**
 * Set up payment schedule for a child
 * @param {Object} scheduleData Payment schedule data
 * @returns {Promise<Object>} Created or updated payment schedule
 */
export const setupPaymentSchedule = async (scheduleData) => {
  try {
    // Check if a schedule already exists
    const q = query(
      collection(db, 'paymentSchedules'),
      where('childId', '==', scheduleData.childId),
      limit(1)
    );

    const snapshot = await getDocs(q);
    const data = {
      childId: scheduleData.childId,
      frequency: scheduleData.frequency, // 'biweekly' or 'monthly'
      nextPaymentDue: calculateNextPaymentDate(scheduleData.frequency),
      updatedAt: serverTimestamp()
    };

    let docRef;
    if (snapshot.empty) {
      // Create new schedule
      data.createdAt = serverTimestamp();
      docRef = await addDoc(collection(db, 'paymentSchedules'), data);
    } else {
      // Update existing schedule
      docRef = snapshot.docs[0].ref;
      await updateDoc(docRef, data);
    }

    return {
      id: docRef.id,
      ...data
    };
  } catch (error) {
    console.error('Error setting up payment schedule:', error);
    throw error;
  }
};

/**
 * Calculate next payment date based on frequency
 * @param {string} frequency Payment frequency ('biweekly'|'monthly')
 * @param {Date} [baseDate] Optional base date
 * @returns {Date} Next payment date
 */
const calculateNextPaymentDate = (frequency, baseDate = new Date()) => {
  const date = new Date(baseDate);
  
  switch (frequency) {
    case 'biweekly':
      date.setDate(date.getDate() + 14);
      break;
    case 'monthly':
      date.setMonth(date.getMonth() + 1);
      // Set to first of next month
      date.setDate(1);
      break;
    default:
      throw new Error('Invalid frequency');
  }
  
  return date;
};

/**
 * Record a payment made to a child
 * @param {Object} paymentData Payment data
 * @returns {Promise<Object>} Created payment record
 */
export const recordPayment = async (paymentData) => {
  const batch = writeBatch(db);
  
  try {
    // Get unpaid earnings
    const earningsQuery = query(
      collection(db, 'earnings'),
      where('childId', '==', paymentData.childId),
      where('paid', '==', false)
    );
    
    const earningsSnapshot = await getDocs(earningsQuery);
    const totalAmount = earningsSnapshot.docs.reduce((total, doc) => {
      const earning = doc.data();
      return total + (parseFloat(earning.amount) || 0);
    }, 0);

    if (totalAmount <= 0) {
      throw new Error('No unpaid earnings to process');
    }

    // Create payment record
    const paymentRef = doc(collection(db, 'payments'));
    const payment = {
      childId: paymentData.childId,
      amount: totalAmount,
      date: serverTimestamp(),
      earningIds: earningsSnapshot.docs.map(doc => doc.id)
    };
    
    batch.set(paymentRef, payment);

    // Mark earnings as paid
    earningsSnapshot.docs.forEach(doc => {
      batch.update(doc.ref, { 
        paid: true,
        paymentId: paymentRef.id
      });
    });

    // Update next payment date
    const scheduleQuery = query(
      collection(db, 'paymentSchedules'),
      where('childId', '==', paymentData.childId),
      limit(1)
    );
    
    const scheduleSnapshot = await getDocs(scheduleQuery);
    if (!scheduleSnapshot.empty) {
      const schedule = scheduleSnapshot.docs[0];
      batch.update(schedule.ref, {
        nextPaymentDue: calculateNextPaymentDate(schedule.data().frequency),
        updatedAt: serverTimestamp()
      });
    }

    await batch.commit();
    
    return {
      id: paymentRef.id,
      ...payment
    };
  } catch (error) {
    console.error('Error recording payment:', error);
    throw error;
  }
};

/**
 * Get payment schedule for a child
 * @param {string} childId Child's user ID
 * @returns {Promise<Object>} Payment schedule
 */
export const getPaymentSchedule = async (childId) => {
  try {
    const q = query(
      collection(db, 'paymentSchedules'),
      where('childId', '==', childId),
      limit(1)
    );

    const snapshot = await getDocs(q);
    if (snapshot.empty) {
      return null;
    }

    return {
      id: snapshot.docs[0].id,
      ...snapshot.docs[0].data()
    };
  } catch (error) {
    console.error('Error getting payment schedule:', error);
    throw error;
  }
};

/**
 * Get payment history for a child
 * @param {string} childId Child's user ID
 * @param {number} [limit] Optional limit of records to return
 * @returns {Promise<Array>} List of payments
 */
export const getPaymentHistory = async (childId, limitCount = 50) => {
  try {
    const q = query(
      collection(db, 'payments'),
      where('childId', '==', childId),
      orderBy('date', 'desc'),
      limit(limitCount)
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error getting payment history:', error);
    throw error;
  }
};

/**
 * Create a new allowance for a child
 * @param {Object} allowanceData Allowance data
 * @returns {Promise<Object>} Created allowance
 */
export const createAllowance = async (allowanceData) => {
  try {
    const data = {
      childId: allowanceData.childId,
      amount: parseFloat(allowanceData.amount),
      frequency: allowanceData.frequency,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    const docRef = await addDoc(collection(db, 'allowances'), data);
    return {
      id: docRef.id,
      ...data
    };
  } catch (error) {
    console.error('Error creating allowance:', error);
    throw error;
  }
};

/**
 * Get allowances for a child
 * @param {string} childId Child's user ID
 * @returns {Promise<Array>} List of allowances
 */
export const getChildAllowances = async (childId) => {
  try {
    const q = query(
      collection(db, 'allowances'),
      where('childId', '==', childId),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error getting child allowances:', error);
    throw error;
  }
};

/**
 * Process allowance payments for a child
 * @param {string} childId Child's user ID
 * @returns {Promise<Object>} Payment result
 */
export const processAllowancePayments = async (childId) => {
  try {
    const batch = writeBatch(db);
    const earningsQuery = query(
      collection(db, 'earnings'),
      where('childId', '==', childId),
      where('paid', '==', false)
    );
    
    const earningsSnapshot = await getDocs(earningsQuery);
    if (earningsSnapshot.empty) {
      return { success: true, message: 'No unpaid earnings to process' };
    }

    let totalAmount = 0;
    earningsSnapshot.docs.forEach(doc => {
      totalAmount += doc.data().amount;
      batch.update(doc.ref, { paid: true, paidAt: serverTimestamp() });
    });

    const paymentData = {
      childId,
      amount: totalAmount,
      createdAt: serverTimestamp(),
      source: {
        type: 'allowance_payment',
        earningCount: earningsSnapshot.size
      }
    };

    const paymentRef = doc(collection(db, 'payments'));
    batch.set(paymentRef, paymentData);

    await batch.commit();

    return {
      success: true,
      payment: {
        id: paymentRef.id,
        ...paymentData,
        earnings: earningsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
      }
    };
  } catch (error) {
    console.error('Error processing allowance payments:', error);
    throw error;
  }
};
