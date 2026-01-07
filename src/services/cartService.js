import { db } from "../firebase/config";
import { 
  collection, 
  getDocs, 
  query, 
  where, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc 
} from "firebase/firestore";

export const cartService = {
  // Get user's cart from Firestore
  async getUserCart(userId) {
    try {
      const q = query(collection(db, "cart_items"), where("userId", "==", userId));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error("Error getting cart:", error);
      return [];
    }
  },

  // Add item to Firestore cart
  async addToFirestoreCart(userId, product) {
    try {
      // Check if item already exists
      const q = query(
        collection(db, "cart_items"),
        where("userId", "==", userId),
        where("productId", "==", product.id)
      );
      const snapshot = await getDocs(q);
      
      if (!snapshot.empty) {
        // Update quantity
        const item = snapshot.docs[0];
        await updateDoc(doc(db, "cart_items", item.id), {
          quantity: item.data().quantity + 1
        });
      } else {
        // Add new item
        await addDoc(collection(db, "cart_items"), {
          userId,
          productId: product.id,
          name: product.name,
          price: product.price,
          image: product.image,
          quantity: 1,
          addedAt: new Date().toISOString()
        });
      }
      return { success: true };
    } catch (error) {
      console.error("Error adding to cart:", error);
      return { success: false, error: error.message };
    }
  },

  // Remove item from Firestore cart
  async removeFromFirestoreCart(cartItemId) {
    try {
      await deleteDoc(doc(db, "cart_items", cartItemId));
      return { success: true };
    } catch (error) {
      console.error("Error removing from cart:", error);
      return { success: false, error: error.message };
    }
  },

  // Update quantity in Firestore
  async updateCartItemQuantity(cartItemId, quantity) {
    try {
      if (quantity === 0) {
        await this.removeFromFirestoreCart(cartItemId);
      } else {
        await updateDoc(doc(db, "cart_items", cartItemId), { quantity });
      }
      return { success: true };
    } catch (error) {
      console.error("Error updating cart:", error);
      return { success: false, error: error.message };
    }
  }
};