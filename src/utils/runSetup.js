import { createInitialAllowance, createInitialSchedule, recordInitialEarning } from './setupCollections';

// Example usage:
const setupCollections = async () => {
  try {
    // Replace 'CHILD_USER_ID' with an actual child user ID from your database
    const childId = 'CHILD_USER_ID';
    
    // Create initial allowance
    await createInitialAllowance(childId);

    // Create a sample schedule for a daily chore
    await createInitialSchedule('CHORE_ID', {
      type: 'daily',
      days: [0, 1, 2, 3, 4, 5, 6], // Every day
      time: '09:00' // 9 AM
    });

    // Record a sample earning
    await recordInitialEarning(childId, 5.00, {
      type: 'chore',
      referenceId: 'CHORE_ID'
    });

    console.log('Setup completed successfully!');
  } catch (error) {
    console.error('Setup failed:', error);
  }
};

// Run the setup
setupCollections();
