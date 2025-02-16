import { createInitialSchedule, recordInitialEarning } from './setupCollections';

// Example usage:
export const runSetup = async (childId) => {
  try {
    // Create initial schedule
    await createInitialSchedule(childId);
    
    // Record initial earning for testing
    await recordInitialEarning(childId);
    
    console.log('Setup completed successfully');
  } catch (error) {
    console.error('Error running setup:', error);
    throw error;
  }
};

// Run the setup
// Replace 'CHILD_USER_ID' with an actual child user ID from your database
const childId = 'CHILD_USER_ID';
runSetup(childId);
