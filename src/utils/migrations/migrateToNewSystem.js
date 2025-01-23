import {
  collection,
  query,
  where,
  getDocs,
  writeBatch,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../../config/firebase';
import { calculateNextDue } from '../../services/schedules';

/**
 * Migrate chores and rewards data to the new system
 * @returns {Promise<Object>} Migration results
 */
export const migrateToNewSystem = async () => {
  const results = {
    choresProcessed: 0,
    schedulesCreated: 0,
    earningsCreated: 0,
    errors: []
  };

  try {
    // Get all chores
    const choresRef = collection(db, 'chores');
    const choresSnapshot = await getDocs(choresRef);
    
    // Get all rewards
    const rewardsRef = collection(db, 'rewards');
    const rewardsSnapshot = await getDocs(rewardsRef);

    // Process in batches of 500 (Firestore limit)
    const batches = [];
    let currentBatch = writeBatch(db);
    let operationCount = 0;

    // Process recurring chores
    for (const doc of choresSnapshot.docs) {
      try {
        const chore = doc.data();
        
        // Only process recurring chores
        if (chore.recurring) {
          // Create schedule
          const scheduleRef = doc(collection(db, 'schedules'));
          const pattern = {
            type: chore.frequency || 'weekly',
            days: chore.recurringDays || [],
            time: chore.dueTime || null
          };

          currentBatch.set(scheduleRef, {
            choreId: doc.id,
            pattern,
            lastGenerated: serverTimestamp(),
            nextDue: calculateNextDue(pattern),
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          });

          // Update chore with schedule reference
          currentBatch.update(doc.ref, {
            scheduleId: scheduleRef.id,
            updatedAt: serverTimestamp()
          });

          results.schedulesCreated++;
          operationCount += 2;
        }

        results.choresProcessed++;
      } catch (error) {
        results.errors.push(`Error processing chore ${doc.id}: ${error.message}`);
      }

      // Create new batch if needed
      if (operationCount >= 499) {
        batches.push(currentBatch);
        currentBatch = writeBatch(db);
        operationCount = 0;
      }
    }

    // Process rewards into earnings
    for (const doc of rewardsSnapshot.docs) {
      try {
        const reward = doc.data();
        
        // Create earning record
        const earningRef = doc(collection(db, 'earnings'));
        currentBatch.set(earningRef, {
          childId: reward.childId,
          amount: parseFloat(reward.amount) || 0,
          source: {
            type: 'chore',
            referenceId: reward.choreId
          },
          earnedAt: reward.createdAt || serverTimestamp()
        });

        results.earningsCreated++;
        operationCount++;
      } catch (error) {
        results.errors.push(`Error processing reward ${doc.id}: ${error.message}`);
      }

      // Create new batch if needed
      if (operationCount >= 499) {
        batches.push(currentBatch);
        currentBatch = writeBatch(db);
        operationCount = 0;
      }
    }

    // Add final batch if it has operations
    if (operationCount > 0) {
      batches.push(currentBatch);
    }

    // Commit all batches
    for (const batch of batches) {
      await batch.commit();
    }

    return results;
  } catch (error) {
    console.error('Migration error:', error);
    results.errors.push(`Global error: ${error.message}`);
    return results;
  }
};

/**
 * Validate migration results
 * @returns {Promise<Object>} Validation results
 */
export const validateMigration = async () => {
  const results = {
    originalChores: 0,
    newSchedules: 0,
    originalRewards: 0,
    newEarnings: 0,
    isValid: false,
    errors: []
  };

  try {
    // Count original data
    const choresSnapshot = await getDocs(collection(db, 'chores'));
    const rewardsSnapshot = await getDocs(collection(db, 'rewards'));
    results.originalChores = choresSnapshot.docs.length;
    results.originalRewards = rewardsSnapshot.docs.length;

    // Count migrated data
    const schedulesSnapshot = await getDocs(collection(db, 'schedules'));
    const earningsSnapshot = await getDocs(collection(db, 'earnings'));
    results.newSchedules = schedulesSnapshot.docs.length;
    results.newEarnings = earningsSnapshot.docs.length;

    // Validate
    if (results.newEarnings < results.originalRewards) {
      results.errors.push('Some rewards were not migrated to earnings');
    }

    const recurringChores = choresSnapshot.docs.filter(doc => doc.data().recurring).length;
    if (results.newSchedules < recurringChores) {
      results.errors.push('Some recurring chores were not migrated to schedules');
    }

    results.isValid = results.errors.length === 0;
    return results;
  } catch (error) {
    console.error('Validation error:', error);
    results.errors.push(`Validation error: ${error.message}`);
    return results;
  }
};
