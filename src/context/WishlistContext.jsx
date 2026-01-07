// src/context/WishlistContext.jsx
import React, { createContext, useContext, useState, useEffect } from "react";
import { doc, setDoc, getDoc, updateDoc } from "firebase/firestore";
import { auth, db } from "../firebase/config";
import { onAuthStateChanged } from "firebase/auth";

const WishlistContext = createContext();

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error("useWishlist must be used within a WishlistProvider");
  }
  return context;
};

export const WishlistProvider = ({ children }) => {
  const [wishlist, setWishlist] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load wishlist from localStorage or Firestore
useEffect(() => {
  const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
    console.log("Wishlist: Auth state changed to:", firebaseUser?.uid || "null");
    
    if (firebaseUser) {
      setUser(firebaseUser);
      // Load from Firestore
      try {
        const wishlistDoc = await getDoc(doc(db, "wishlist_items", firebaseUser.uid));
        if (wishlistDoc.exists()) {
          const firestoreWishlist = wishlistDoc.data().items || [];
          setWishlist(firestoreWishlist);
          localStorage.setItem("gloryCoversWishlist", JSON.stringify(firestoreWishlist));
        } else {
          // No wishlist in Firestore
          const savedWishlist = localStorage.getItem("gloryCoversWishlist");
          if (savedWishlist) {
            const localStorageWishlist = JSON.parse(savedWishlist);
            if (localStorageWishlist.length > 0) {
              // Migrate to Firestore
              await setDoc(doc(db, "wishlist_items", firebaseUser.uid), {
                userId: firebaseUser.uid,
                items: localStorageWishlist,
                updatedAt: new Date().toISOString()
              });
              setWishlist(localStorageWishlist);
            } else {
              setWishlist([]);
            }
          } else {
            setWishlist([]);
          }
        }
      } catch (error) {
        console.error("Error loading wishlist:", error);
        const savedWishlist = localStorage.getItem("gloryCoversWishlist");
        setWishlist(savedWishlist ? JSON.parse(savedWishlist) : []);
      }
    } else {
      // USER LOGGED OUT - Clear everything
      setUser(null);
      setWishlist([]);
      localStorage.removeItem("gloryCoversWishlist");
    }
    
    setLoading(false);
  });
  
  return unsubscribe;
}, []);

  // Sync wishlist to Firestore when user is logged in
  const syncWishlistToFirestore = async (wishlistItems) => {
    if (!user) return;
    
    try {
      await setDoc(doc(db, "wishlist_items", user.uid), {
        userId: user.uid,
        items: wishlistItems,
        updatedAt: new Date().toISOString()
      }, { merge: true });
    } catch (error) {
      console.error("Error syncing wishlist to Firestore:", error);
    }
  };

  // Save to localStorage and Firestore
  useEffect(() => {
    // Save to localStorage
    localStorage.setItem("gloryCoversWishlist", JSON.stringify(wishlist));
    
    // Sync to Firestore if user is logged in
    if (user && wishlist.length > 0) {
      syncWishlistToFirestore(wishlist);
    }
  }, [wishlist, user]);

  // Remove wishlist on logout
  useEffect(() => {
  const handleLogout = () => {
    console.log("Logout detected, clearing wishlist...");
    setWishlist([]);
    localStorage.removeItem("gloryCoversWishlist");
  };
  
  window.addEventListener('userLoggedOut', handleLogout);
  
  const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
    if (!firebaseUser) {
      setWishlist([]);
      localStorage.removeItem("gloryCoversWishlist");
    }
  });
  
  return () => {
    window.removeEventListener('userLoggedOut', handleLogout);
    unsubscribe();
  };
}, []);

  const toggleWishlist = (product) => {
    setWishlist((prev) => {
      const exists = prev.find((item) => item.id === product.id);
      let newWishlist;
      
      if (exists) {
        newWishlist = prev.filter((item) => item.id !== product.id);
      } else {
        newWishlist = [...prev, { 
          ...product, 
          addedAt: new Date().toISOString() 
        }];
      }
      
      return newWishlist;
    });
  };

  const isInWishlist = (productId) => {
    return wishlist.some((item) => item.id === productId);
  };

  const clearWishlist = () => {
    setWishlist([]);
  };

  // Merge guest wishlist with user wishlist on login
  const mergeWishlistOnLogin = async (guestWishlist) => {
    if (!user || guestWishlist.length === 0) return;
    
    try {
      // Get user's existing wishlist from Firestore
      const wishlistDoc = await getDoc(doc(db, "wishlist_items", user.uid));
      let existingWishlist = [];
      
      if (wishlistDoc.exists()) {
        existingWishlist = wishlistDoc.data().items || [];
      }
      
      // Merge wishlists (avoid duplicates)
      const mergedWishlist = [...existingWishlist];
      guestWishlist.forEach((guestItem) => {
        if (!mergedWishlist.find(item => item.id === guestItem.id)) {
          mergedWishlist.push(guestItem);
        }
      });
      
      // Save merged wishlist
      await setDoc(doc(db, "wishlist_items", user.uid), {
        userId: user.uid,
        items: mergedWishlist,
        updatedAt: new Date().toISOString()
      });
      
      setWishlist(mergedWishlist);
    } catch (error) {
      console.error("Error merging wishlists:", error);
    }
  };

  return (
    <WishlistContext.Provider
      value={{
        wishlist,
        toggleWishlist,
        isInWishlist,
        clearWishlist,
        user,
        loading,
        mergeWishlistOnLogin,
        // Add fetchWishlist function for ProfilePage
        fetchWishlist: async () => {
          if (!user) return;
          const wishlistDoc = await getDoc(doc(db, "wishlist_items", user.uid));
          if (wishlistDoc.exists()) {
            setWishlist(wishlistDoc.data().items || []);
          }
        }
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
};