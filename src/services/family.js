import {
  collection,
  doc,
  query,
  where,
  getDocs,
  updateDoc,
  serverTimestamp,
  limit,
  getDoc,
  onSnapshot,
  setDoc,
  writeBatch,
  deleteDoc,
} from "firebase/firestore";
import { createUserWithEmailAndPassword, fetchSignInMethodsForEmail, deleteUser } from "firebase/auth";
import { auth, db } from "../config/firebase";
import { registerUser } from "./auth";

// Get family members for a parent
export const getFamilyMembers = async (parentUid) => {
  try {
    

    if (!parentUid) {
      console.error("No parent ID provided");
      console.log("Parent ID:", parentUid);
      throw new Error("No parent ID provided");
    }

    // First verify the parent's role
    const parentDoc = await getDoc(doc(db, "users", parentUid));
    if (!parentDoc.exists()) {
      console.error("Parent document not found");
      throw new Error("Parent document not found");
    }

    const parentData = parentDoc.data();
    if (parentData.role !== "parent") {
      console.error("User is not a parent");
      throw new Error("User is not a parent");
    }

    // Query users collection for children of this parent
    const usersRef = collection(db, "users");
    const q = query(
      usersRef,
      where("parentUid", "==", parentUid),
      where("role", "==", "child")
    );

    const querySnapshot = await getDocs(q);

    const members = querySnapshot.docs.map((doc) => ({
      uid: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate(),
      updatedAt: doc.data().updatedAt?.toDate(),
    }));

    
    return members;
  } catch (error) {
    console.error("Error getting family members:", error);
    throw error;
  }
};

// Add a child account
export const addChildAccount = async (parentUid, childData) => {
  try {
    console.log("Adding child account:", childData);

    // Create auth account for child
    const { user } = await createUserWithEmailAndPassword(
      auth,
      childData.email,
      "temppass123" // Temporary password
    );

    // Create user document
    const userData = {
      displayName: childData.displayName,
      email: childData.email,
      role: "child",
      parentUid: parentUid,
      dateOfBirth: childData.dateOfBirth,
      allowance: parseFloat(childData.allowance) || 0,
      balance: 0, // Initialize balance for rewards
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    await registerUser(user.uid, userData);

    return {
      id: user.uid,
      ...userData,
    };
  } catch (error) {
    console.error("Error adding child account:", error);
    throw error;
  }
};

// Update a child account
export const updateChildAccount = async (childId, updates) => {
  try {
    
    const childRef = doc(db, "users", childId);
    const childDoc = await getDoc(childRef);
    const updateData = {
      ...updates,
      allowance: parseFloat(updates.allowance) || 0,
      dateOfBirth: updates.dateOfBirth,
      updatedAt: serverTimestamp(),
    };

    if (childDoc.exists()) {
      await updateDoc(childRef, updateData);
    } else {
      await setDoc(childRef, updateData);
    }
    return { id: childId, ...updateData };
  } catch (error) {
    console.error("Error updating child account:", error);
    throw error;
  }
};

// Remove a child from the family and delete their account
export const removeChildAccount = async (childUid) => {
  try {
    if (!childUid || typeof childUid !== 'string') {
      throw new Error("Invalid child UID provided");
    }

    // Verify the child exists first
    const childRef = doc(db, "users", childUid);
    const childDoc = await getDoc(childRef);
    
    if (!childDoc.exists()) {
      throw new Error("Child account not found");
    }

    // Delete chores first
    const choresQuery = query(
      collection(db, "chores"),
      where("assignedTo", "==", childUid)
    );
    const choresSnapshot = await getDocs(choresQuery);
    if (!choresSnapshot.empty) {
      const batch1 = writeBatch(db);
      choresSnapshot.forEach((choreDoc) => {
        batch1.delete(choreDoc.ref);
      });
      await batch1.commit();
    }

    // Delete completed chores history
    const historyQuery = query(
      collection(db, "completedChores"),
      where("userId", "==", childUid)
    );
    const historySnapshot = await getDocs(historyQuery);
    if (!historySnapshot.empty) {
      const batch2 = writeBatch(db);
      historySnapshot.forEach((historyDoc) => {
        batch2.delete(historyDoc.ref);
      });
      await batch2.commit();
    }

    // Finally delete the user document
    await deleteDoc(childRef);
    
    return { success: true, childUid };
  } catch (error) {
    console.error("Error removing child account:", error);
    throw error;
  }
};

// Get statistics for a child
export const getChildStats = async (childId) => {
  try {
    
    // Get completed chores count
    const completedChoresQuery = query(
      collection(db, "chores"),
      where("assignedTo", "==", childId),
      where("status", "==", "verified"),
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
      collection(db, "chores"),
      where("assignedTo", "==", childId),
      where("completedAt", ">=", startOfWeek),
      limit(50)
    );
    const weeklyChores = await getDocs(weeklyChoresQuery);

    const stats = {
      totalChoresCompleted: completedChores.size,
      totalRewardsEarned: rewardsEarned,
      weeklyChoresCompleted: weeklyChores.size,
    };

    
    return stats;
  } catch (error) {
    console.error("Error getting child stats:", error);
    throw error;
  }
};

/**
 * Subscribe to real-time updates for family members
 * @param {string} parentUid - The parent's user ID
 * @param {function} onUpdate - Callback function for updates
 * @returns {function} Unsubscribe function
 */
export const subscribeFamilyMembers = (parentUid, onUpdate) => {
  if (!parentUid) {
    console.error("No parent ID provided");
    return () => {};
  }

  const usersRef = collection(db, "users");
  const q = query(
    usersRef,
    where("parentUid", "==", parentUid),
    where("role", "==", "child")
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const members = snapshot.docs.map((doc) => ({
        uid: doc.id,
        ...doc.data(),
        balance: parseFloat(doc.data().balance) || 0,
      }));
      onUpdate(members);
    },
    (error) => {
      console.error("Error subscribing to family members:", error);
    }
  );
};

/**
 * Subscribe to real-time updates for a child's stats
 * @param {string} childId - The child's user ID
 * @param {function} onUpdate - Callback function for updates
 * @returns {function} Unsubscribe function
 */
export const subscribeChildStats = (childId, onUpdate) => {
  if (!childId) {
    console.error("No child ID provided");
    return () => {};
  }

  // Subscribe to rewards collection for the child
  const rewardsRef = collection(db, "rewards");
  const rewardsQuery = query(rewardsRef, where("childId", "==", childId));

  return onSnapshot(
    rewardsQuery,
    (snapshot) => {
      // Calculate total rewards from all reward documents
      const totalRewardsEarned = snapshot.docs.reduce((sum, doc) => {
        const reward = doc.data();
        return sum + (parseFloat(reward.amount) || 0);
      }, 0);

      onUpdate({
        totalRewardsEarned,
        updatedAt: serverTimestamp(),
      });
    },
    (error) => {
      console.error("Error subscribing to child stats:", error);
    }
  );
};
