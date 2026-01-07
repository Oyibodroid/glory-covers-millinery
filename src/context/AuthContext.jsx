import React, { createContext, useContext, useState, useEffect } from "react";
import { 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
  deleteUser
} from "firebase/auth";
import { 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc,
  deleteDoc,
  collection,
  query,
  where,
  getDocs,
  orderBy
} from "firebase/firestore";
import { auth, db } from "../firebase/config";

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null); // Add user profile state
  const [loading, setLoading] = useState(true);

  // Fetch user profile from Firestore
  const fetchUserProfile = async (userId) => {
    try {
      const userDoc = await getDoc(doc(db, "users", userId));
      if (userDoc.exists()) {
        return userDoc.data();
      }
      return null;
    } catch (error) {
      console.error("Error fetching user profile:", error);
      return null;
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        // Fetch additional user data from Firestore
        const profile = await fetchUserProfile(firebaseUser.uid);
        setUserProfile(profile);
      } else {
        setUser(null);
        setUserProfile(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

// Updated signup with user data storage - FIXED VERSION
const signup = async (email, password, userData = {}) => {
  try {
    console.log("🚀 Starting signup process...");
    
    // 1. Create user with email and password
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    console.log("✅ User created in Firebase Auth:", userCredential.user.uid);
    
    // 2. Update user profile with display name
    if (userData.firstName || userData.lastName) {
      await updateProfile(userCredential.user, {
        displayName: `${userData.firstName || ''} ${userData.lastName || ''}`.trim()
      });
    }
    
    // 3. Save additional user data to Firestore
    const userProfileData = {
      uid: userCredential.user.uid,
      email: email,
      firstName: userData.firstName || '',
      lastName: userData.lastName || '',
      phone: userData.phone || '',
      address: userData.address || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    console.log("📝 Saving user to Firestore users collection...");
    await setDoc(doc(db, "users", userCredential.user.uid), userProfileData);
    console.log("✅ User saved to Firestore!");
    
    // 4. Create empty cart in Firestore
    console.log("🛒 Creating cart in Firestore...");
    await setDoc(doc(db, "cart_items", userCredential.user.uid), {
      userId: userCredential.user.uid,
      items: [],
      updatedAt: new Date().toISOString()
    });
    console.log("✅ Cart created!");
    
    // 5. Create empty wishlist in Firestore
    console.log("❤️ Creating wishlist in Firestore...");
    await setDoc(doc(db, "wishlist_items", userCredential.user.uid), {
      userId: userCredential.user.uid,
      items: [],
      updatedAt: new Date().toISOString()
    });
    console.log("✅ Wishlist created!");
    
    // 6. Update state
    setUserProfile(userProfileData);
    
    console.log("🎉 Signup completed successfully!");
    
    return { success: true, user: userCredential.user };
    
  } catch (error) {
    console.error("🔥 SIGNUP ERROR:", error.code, error.message);
    
    let errorMessage = "Signup failed. Please try again.";
    switch (error.code) {
      case "auth/email-already-in-use":
        errorMessage = "This email is already registered.";
        break;
      case "auth/invalid-email":
        errorMessage = "Please enter a valid email address.";
        break;
      case "auth/weak-password":
        errorMessage = "Password should be at least 6 characters.";
        break;
      case "auth/operation-not-allowed":
        errorMessage = "Email/password signup is not enabled.";
        break;
    }
    
    return { success: false, error: errorMessage };
  }
};
  // Google sign-in
const signInWithGoogle = async () => {
  try {
    console.log("Starting Google sign-in...");
    
    const provider = new GoogleAuthProvider();
    // Add scopes if needed
    provider.addScope('email');
    provider.addScope('profile');
    
    console.log("Opening Google popup...");
    const result = await signInWithPopup(auth, provider);
    console.log("Google sign-in successful:", result.user.uid);
    
    // Check if user exists in Firestore
    const userDoc = await getDoc(doc(db, "users", result.user.uid));
    console.log("User exists in Firestore?", userDoc.exists());
    
    if (!userDoc.exists()) {
      console.log("First-time Google user, creating profile...");
      // First time Google sign-in, create user profile
      const userProfileData = {
        uid: result.user.uid,
        email: result.user.email,
        firstName: result.user.displayName?.split(' ')[0] || '',
        lastName: result.user.displayName?.split(' ').slice(1).join(' ') || '',
        phone: '',
        address: '',
        googleAccount: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      await setDoc(doc(db, "users", result.user.uid), userProfileData);
      console.log("User profile created in Firestore");
      
      // Also create empty cart and wishlist
      await setDoc(doc(db, "cart_items", result.user.uid), {
        userId: result.user.uid,
        items: [],
        updatedAt: new Date().toISOString()
      });
      
      await setDoc(doc(db, "wishlist_items", result.user.uid), {
        userId: result.user.uid,
        items: [],
        updatedAt: new Date().toISOString()
      });
      
      setUserProfile(userProfileData);
    } else {
      console.log("Existing user, loading profile...");
      setUserProfile(userDoc.data());
    }
    
    console.log("Google sign-in completed successfully!");
    return { success: true, user: result.user };
    
  } catch (error) {
    console.error("🔥 GOOGLE SIGN-IN ERROR:", error.code, error.message);
    
    let errorMessage = "Google sign-in failed. Please try again.";
    switch (error.code) {
      case "auth/popup-blocked":
        errorMessage = "Popup was blocked by your browser. Please allow popups for this site.";
        break;
      case "auth/popup-closed-by-user":
        errorMessage = "Sign-in was cancelled.";
        break;
      case "auth/unauthorized-domain":
        errorMessage = "This domain is not authorized for Google sign-in.";
        break;
      case "auth/operation-not-allowed":
        errorMessage = "Google sign-in is not enabled. Please contact support.";
        break;
    }
    
    return { success: false, error: errorMessage };
  }
};

  const login = async (email, password) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      // Fetch user profile on login
      const profile = await fetchUserProfile(userCredential.user.uid);
      setUserProfile(profile);
      return { success: true, user: userCredential.user };
    } catch (error) {
      let errorMessage = "Login failed. Please try again.";
      switch (error.code) {
        case "auth/user-not-found":
        case "auth/wrong-password":
          errorMessage = "Invalid email or password.";
          break;
        case "auth/too-many-requests":
          errorMessage = "Too many attempts. Please try again later.";
          break;
      }
      return { success: false, error: errorMessage };
    }
  };

  // Update user profile in Firestore
  const updateUserProfile = async (profileData) => {
    try {
      if (!user) throw new Error("No user logged in");
      
      const updatedProfile = {
        ...userProfile,
        ...profileData,
        updatedAt: new Date().toISOString()
      };
      
      await updateDoc(doc(db, "users", user.uid), updatedProfile);
      setUserProfile(updatedProfile);
      
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  // Change password
  const changePassword = async (currentPassword, newPassword) => {
    try {
      if (!user) throw new Error("No user logged in");
      
      // Re-authenticate user
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);
      
      // Update password
      await updatePassword(user, newPassword);
      
      return { success: true };
    } catch (error) {
      let errorMessage = "Failed to change password.";
      switch (error.code) {
        case "auth/wrong-password":
          errorMessage = "Current password is incorrect.";
          break;
        case "auth/weak-password":
          errorMessage = "New password is too weak.";
          break;
      }
      return { success: false, error: errorMessage };
    }
  };

  // Delete account
  const deleteAccount = async (currentPassword) => {
    try {
      if (!user) throw new Error("No user logged in");
      
      // Re-authenticate first
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);
      
      // Delete user data from Firestore
      await deleteDoc(doc(db, "users", user.uid));
      
      // Delete user from Firebase Auth
      await deleteUser(user);
      
      return { success: true };
    } catch (error) {
      let errorMessage = "Failed to delete account.";
      switch (error.code) {
        case "auth/wrong-password":
          errorMessage = "Password is incorrect.";
          break;
        case "auth/requires-recent-login":
          errorMessage = "Please log in again to delete your account.";
          break;
      }
      return { success: false, error: errorMessage };
    }
  };

  // Fetch user orders from Firestore
  const fetchUserOrders = async () => {
    try {
      if (!user) return [];
      
      const ordersRef = collection(db, "orders");
      const q = query(
        ordersRef, 
        where("userId", "==", user.uid),
        orderBy("createdAt", "desc")
      );
      
      const querySnapshot = await getDocs(q);
      const orders = [];
      querySnapshot.forEach((doc) => {
        orders.push({ id: doc.id, ...doc.data() });
      });
      
      return orders;
    } catch (error) {
      console.error("Error fetching orders:", error);
      return [];
    }
  };

const logout = async () => {
  try {
    await signOut(auth);
    
    // Clear ALL user data from context
    setUser(null);
    setUserProfile(null);
    
    // Dispatch custom event to notify other contexts
    window.dispatchEvent(new CustomEvent('userLoggedOut'));
    
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};
  const value = {
    user,
    userProfile,
    loading,
    signup,
    login,
    logout,
    signInWithGoogle,
    updateUserProfile,
    changePassword,
    deleteAccount,
    fetchUserOrders,
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};


