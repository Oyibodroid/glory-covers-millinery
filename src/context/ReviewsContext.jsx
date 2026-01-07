// src/context/ReviewsContext.jsx
import React, { createContext, useContext, useState, useEffect } from "react";
import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where, 
  orderBy,
  doc,
  updateDoc,
  deleteDoc
} from "firebase/firestore";
import { auth, db } from "../firebase/config";
import { onAuthStateChanged } from "firebase/auth";

const ReviewsContext = createContext();

export const useReviews = () => {
  const context = useContext(ReviewsContext);
  if (!context) {
    throw new Error("useReviews must be used within a ReviewsProvider");
  }
  return context;
};

export const ReviewsProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return unsubscribe;
  }, []);

const getProductReviews = async (productId) => {
  try {
    const reviewsRef = collection(db, "reviews");
    const q = query(
      reviewsRef,
      where("productId", "==", productId),
      orderBy("createdAt", "desc")
    );
    
    const querySnapshot = await getDocs(q);
    const reviews = [];
    let totalRating = 0;
    
    querySnapshot.forEach((doc) => {
      const reviewData = doc.data();
      const review = { 
        id: doc.id, 
        ...reviewData,
        // Ensure date is properly formatted
        createdAt: reviewData.createdAt ? 
          (reviewData.createdAt.toDate ? reviewData.createdAt.toDate().toISOString() : reviewData.createdAt) 
          : new Date().toISOString()
      };
      reviews.push(review);
      totalRating += review.rating || 0;
    });
    
    const averageRating = reviews.length > 0 ? (totalRating / reviews.length).toFixed(1) : "0.0";
    
    return { 
      success: true, 
      reviews, 
      averageRating,
      totalReviews: reviews.length 
    };
  } catch (error) {
    console.error("Error fetching reviews:", error);
    return { success: false, error: error.message };
  }
};

  const addReview = async (productId, reviewData) => {
    try {
      if (!user) throw new Error("You must be logged in to add a review");
      
      // Check if user already reviewed this product
      const existingReview = await getUserProductReview(productId, user.uid);
      if (existingReview.success && existingReview.review) {
        return { 
          success: false, 
          error: "You have already reviewed this product" 
        };
      }
      
      const reviewWithDetails = {
        productId,
        userId: user.uid,
        userEmail: user.email,
        userName: user.displayName || user.email.split('@')[0],
        rating: reviewData.rating,
        comment: reviewData.comment,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      const docRef = await addDoc(collection(db, "reviews"), reviewWithDetails);
      
      return { 
        success: true, 
        reviewId: docRef.id,
        message: "Review added successfully!" 
      };
    } catch (error) {
      console.error("Error adding review:", error);
      return { success: false, error: error.message };
    }
  };

  const getUserProductReview = async (productId, userId) => {
    try {
      const reviewsRef = collection(db, "reviews");
      const q = query(
        reviewsRef,
        where("productId", "==", productId),
        where("userId", "==", userId)
      );
      
      const querySnapshot = await getDocs(q);
      if (querySnapshot.empty) {
        return { success: true, review: null };
      }
      
      const reviewDoc = querySnapshot.docs[0];
      return { 
        success: true, 
        review: { id: reviewDoc.id, ...reviewDoc.data() } 
      };
    } catch (error) {
      console.error("Error fetching user review:", error);
      return { success: false, error: error.message };
    }
  };

  const updateReview = async (reviewId, reviewData) => {
    try {
      if (!user) throw new Error("You must be logged in to update a review");
      
      await updateDoc(doc(db, "reviews", reviewId), {
        ...reviewData,
        updatedAt: new Date().toISOString()
      });
      
      return { success: true, message: "Review updated successfully!" };
    } catch (error) {
      console.error("Error updating review:", error);
      return { success: false, error: error.message };
    }
  };

  const deleteReview = async (reviewId) => {
    try {
      if (!user) throw new Error("You must be logged in to delete a review");
      
      await deleteDoc(doc(db, "reviews", reviewId));
      
      return { success: true, message: "Review deleted successfully!" };
    } catch (error) {
      console.error("Error deleting review:", error);
      return { success: false, error: error.message };
    }
  };

  return (
    <ReviewsContext.Provider
      value={{
        getProductReviews,
        addReview,
        getUserProductReview,
        updateReview,
        deleteReview,
        user
      }}
    >
      {children}
    </ReviewsContext.Provider>
  );
};