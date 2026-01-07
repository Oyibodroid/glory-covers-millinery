// src/context/CartContext.jsx
import React, { createContext, useContext, useState, useEffect } from "react";
import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  arrayUnion,
  arrayRemove,
} from "firebase/firestore";
import { auth, db } from "../firebase/config";
import { onAuthStateChanged } from "firebase/auth";

const CartContext = createContext();

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load cart from localStorage or Firestore
useEffect(() => {
  const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
    console.log("Auth state changed to:", firebaseUser?.uid || "null");
    
    if (firebaseUser) {
      setUser(firebaseUser);
      // Load from Firestore
      try {
        const cartDoc = await getDoc(doc(db, "cart_items", firebaseUser.uid));
        if (cartDoc.exists()) {
          const firestoreCart = cartDoc.data().items || [];
          setCart(firestoreCart);
          localStorage.setItem("gloryCoversCart", JSON.stringify(firestoreCart));
        } else {
          // No cart in Firestore, check localStorage
          const savedCart = localStorage.getItem("gloryCoversCart");
          if (savedCart) {
            const localStorageCart = JSON.parse(savedCart);
            if (localStorageCart.length > 0) {
              // Migrate to Firestore
              await setDoc(doc(db, "cart_items", firebaseUser.uid), {
                userId: firebaseUser.uid,
                items: localStorageCart,
                updatedAt: new Date().toISOString()
              });
              setCart(localStorageCart);
            } else {
              setCart([]);
            }
          } else {
            setCart([]);
          }
        }
      } catch (error) {
        console.error("Error loading cart:", error);
        const savedCart = localStorage.getItem("gloryCoversCart");
        setCart(savedCart ? JSON.parse(savedCart) : []);
      }
    } else {
      // USER LOGGED OUT - Clear everything
      setUser(null);
      setCart([]);
      localStorage.removeItem("gloryCoversCart");
    }
    
    setLoading(false);
  });
  
  return unsubscribe;
}, []);


  // Sync cart to Firestore when user is logged in
  const syncCartToFirestore = async (cartItems) => {
    if (!user) return;

    try {
      await setDoc(
        doc(db, "cart_items", user.uid),
        {
          userId: user.uid,
          items: cartItems,
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );
    } catch (error) {
      console.error("Error syncing cart to Firestore:", error);
    }
  };

  // Save to localStorage and Firestore
  useEffect(() => {
    // Save to localStorage
    localStorage.setItem("gloryCoversCart", JSON.stringify(cart));

    // Sync to Firestore if user is logged in
    if (user && cart.length > 0) {
      syncCartToFirestore(cart);
    }
  }, [cart, user]);

  useEffect(() => {
    // Listen for logout event
    const handleLogout = () => {
      console.log("Logout detected, clearing cart...");
      setCart([]);
      localStorage.removeItem("gloryCoversCart");
    };

    window.addEventListener("userLoggedOut", handleLogout);

    // Also clear on auth state change to null
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (!firebaseUser) {
        // User logged out
        setCart([]);
        localStorage.removeItem("gloryCoversCart");
      }
    });

    return () => {
      window.removeEventListener("userLoggedOut", handleLogout);
      unsubscribe();
    };
  }, []);

  const addToCart = async (product, quantity = 1) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find((item) => item.id === product.id);
      let newCart;

      if (existingItem) {
        newCart = prevCart.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      } else {
        newCart = [
          ...prevCart,
          {
            ...product,
            quantity,
            addedAt: new Date().toISOString(),
          },
        ];
      }

      return newCart;
    });
  };

  const removeFromCart = (productId) => {
    setCart((prevCart) => prevCart.filter((item) => item.id !== productId));
  };

  const updateQuantity = (productId, quantity) => {
    if (quantity === 0) {
      removeFromCart(productId);
    } else {
      setCart((prevCart) =>
        prevCart.map((item) =>
          item.id === productId ? { ...item, quantity } : item
        )
      );
    }
  };

  const clearCart = () => {
    setCart([]);
  };

  // Merge guest cart with user cart on login
  const mergeCartOnLogin = async (guestCart) => {
    if (!user || guestCart.length === 0) return;

    try {
      // Get user's existing cart from Firestore
      const cartDoc = await getDoc(doc(db, "cart_items", user.uid));
      let existingCart = [];

      if (cartDoc.exists()) {
        existingCart = cartDoc.data().items || [];
      }

      // Merge carts (avoid duplicates)
      const mergedCart = [...existingCart];
      guestCart.forEach((guestItem) => {
        const existingIndex = mergedCart.findIndex(
          (item) => item.id === guestItem.id
        );
        if (existingIndex > -1) {
          mergedCart[existingIndex].quantity += guestItem.quantity;
        } else {
          mergedCart.push(guestItem);
        }
      });

      // Save merged cart
      await setDoc(doc(db, "cart_items", user.uid), {
        userId: user.uid,
        items: mergedCart,
        updatedAt: new Date().toISOString(),
      });

      setCart(mergedCart);
    } catch (error) {
      console.error("Error merging carts:", error);
    }
  };

  const cartTotal = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        cartTotal,
        cartCount,
        user,
        loading,
        mergeCartOnLogin,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};
