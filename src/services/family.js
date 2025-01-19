import {
  collection,
  doc,
  query,
  where,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  limit,
  getDoc
} from 'firebase/firestore';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '../config/firebase';
import { registerUser } from './auth';

// Get family members for a parent
export const getFamilyMembers = async (parentId) => {
  try {
    console.log('Getting family members for parent:', parentId);
    
    if (!parentId) {
      console.error('No parent ID provided');
      throw new Error('No parent ID provided');
    }

    // First verify the parent's role
    const parentDoc = await getDoc(doc(db, 'users', parentId));
    if (!parentDoc.exists()) {
      console.error('Parent document not found');
      throw new Error('Parent document not found');
    }
    
    const parentData = parentDoc.data();
    if (parentData.role !== 'parent') {
      console.error('User is not a parent');
      throw new Error('User is not a parent');
    }

    // Query users collection for children of this parent
    const usersRef = collection(db, 'users');
    const q = query(
      usersRef,
      where('parentId', '==', parentId),
      where('role', '==', 'child')
    );
    
    const querySnapshot = await getDocs(q);
    
    const members = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate(),
      updatedAt: doc.data().updatedAt?.toDate()
    }));
    
    console.log('Found family members:', members);
    return members;
  } catch (error) {
    console.error('Error getting family members:', error);
    throw error;
  }
};

// Add a child account
export const addChildAccount = async (parentId, childData) => {
  try {
    console.log('Adding child account with parent:', parentId);
    // Generate a temporary password
    const tempPassword = Math.random().toString(36).slice(-8);
    
    // Register the child user
    const childUser = await registerUser(
      childData.email,
      tempPassword,
      childData.displayName,
      'child'
    );

    // Add additional child-specific data
    const childRef = doc(db, 'users', childUser.uid);
    const childUpdateData = {
      parentId,
      dateOfBirth: childData.dateOfBirth || null,
      allowance: parseFloat(childData.allowance) || 0,
      updatedAt: serverTimestamp()
    };

    console.log('Updating child document with:', childUpdateData);
    await updateDoc(childRef, childUpdateData);

    return {
      ...childUser,
      ...childUpdateData,
      temporaryPassword: tempPassword
    };
  } catch (error) {
    console.error('Error adding child account:', error);
    throw error;
  }
};

// Update a child account
export const updateChildAccount = async (childId, updates) => {
  try {
    console.log('Updating child account:', childId, updates);
    const childRef = doc(db, 'users', childId);
    const updateData = {
      ...updates,
      allowance: parseFloat(updates.allowance) || 0,
      updatedAt: serverTimestamp()
    };
    
    await updateDoc(childRef, updateData);
    return { id: childId, ...updateData };
  } catch (error) {
    console.error('Error updating child account:', error);
    throw error;
  }
};

// Remove a child from the family
export const removeChildAccount = async (childId) => {
  try {
    console.log('Removing child account:', childId);
    // Note: This only removes the child from the family
    // The user account remains but is unlinked
    const childRef = doc(db, 'users', childId);
    await updateDoc(childRef, {
      parentId: null,
      updatedAt: serverTimestamp()
    });
    return childId;
  } catch (error) {
    console.error('Error removing child account:', error);
    throw error;
  }
};

// Get statistics for a child
export const getChildStats = async (childId) => {
  try {
    console.log('Getting stats for child:', childId);
    // Get completed chores count
    const completedChoresQuery = query(
      collection(db, 'chores'),
      where('assignedTo', '==', childId),
      where('status', '==', 'verified'),
      limit(50)
    );
    const completedChores = await getDocs(completedChoresQuery);

    // Get total rewards earned
    const rewardsEarned = completedChores.docs.reduce((total, doc) => {
      return total + (doc.data().reward || 0);
    }, 0);

    // Get current week's progress
    const startOfWeek = new Date();
    startOfWeek.setHours(0, 0, 0, 0);
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());

    const weeklyChoresQuery = query(
      collection(db, 'chores'),
      where('assignedTo', '==', childId),
      where('completedAt', '>=', startOfWeek),
      limit(50)
    );
    const weeklyChores = await getDocs(weeklyChoresQuery);

    const stats = {
      totalChoresCompleted: completedChores.size,
      totalRewardsEarned: rewardsEarned,
      weeklyChoresCompleted: weeklyChores.size
    };

    console.log('Child stats:', stats);
    return stats;
  } catch (error) {
    console.error('Error getting child stats:', error);
    throw error;
  }
};
