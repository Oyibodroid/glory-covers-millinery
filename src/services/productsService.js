// src/services/productsService.js - COMPLETE WORKING VERSION
import { 
  collection, 
  getDocs, 
  query, 
  where,
  doc,
  getDoc 
} from "firebase/firestore";
import { db } from "../firebase/config";

// 1. Get featured products
export const getFeaturedProducts = async () => {
  try {
    const q = query(
      collection(db, "products"),
      where("featured", "==", true)
    );
    
    const querySnapshot = await getDocs(q);
    const products = [];
    
    querySnapshot.forEach((doc) => {
      products.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    return { success: true, products };
  } catch (error) {
    console.error("Error getting featured products:", error);
    return { 
      success: false, 
      error: "Failed to load featured products",
      products: [] 
    };
  }
};

// 2. Get products by category
export const getProductsByCategory = async (category) => {
  try {
    let q;
    
    if (category === "All") {
      q = collection(db, "products");
    } else {
      q = query(
        collection(db, "products"),
        where("category", "==", category)
      );
    }
    
    const querySnapshot = await getDocs(q);
    const products = [];
    
    querySnapshot.forEach((doc) => {
      products.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    return { success: true, products };
  } catch (error) {
    console.error("Error getting products by category:", error);
    return { 
      success: false, 
      error: "Failed to load products",
      products: [] 
    };
  }
};

// 3. Get product by ID
export const getProductById = async (productId) => {
  try {
    if (!productId) {
      return { 
        success: false, 
        error: "Product ID is required",
        product: null 
      };
    }
    
    const productDoc = doc(db, "products", productId);
    const productSnap = await getDoc(productDoc);
    
    if (productSnap.exists()) {
      return { 
        success: true, 
        product: {
          id: productSnap.id,
          ...productSnap.data()
        }
      };
    } else {
      return { 
        success: false, 
        error: "Product not found",
        product: null 
      };
    }
  } catch (error) {
    console.error("Error getting product:", error);
    return { 
      success: false, 
      error: "Failed to load product",
      product: null 
    };
  }
};

// 4. Get all products (optional)
export const getAllProducts = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, "products"));
    const products = [];
    
    querySnapshot.forEach((doc) => {
      products.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    return { success: true, products };
  } catch (error) {
    console.error("Error getting products:", error);
    return { 
      success: false, 
      error: "Failed to load products",
      products: [] 
    };
  }
};

// 5. Optional: Also export as a service object
export const productsService = {
  getFeaturedProducts,
  getProductsByCategory,
  getProductById,
  getAllProducts
};

// 6. Optional: Default export
export default productsService;