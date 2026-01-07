// src/context/OrdersContext.jsx
import React, { createContext, useContext, useState, useEffect } from "react";
import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  doc, 
  getDoc,
  updateDoc 
} from "firebase/firestore";
import { auth, db } from "../firebase/config";
import { onAuthStateChanged } from "firebase/auth";

const OrdersContext = createContext();

export const useOrders = () => {
  const context = useContext(OrdersContext);
  if (!context) {
    throw new Error("useOrders must be used within an OrdersProvider");
  }
  return context;
};

export const OrdersProvider = ({ children }) => {
  const [orders, setOrders] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [orderStats, setOrderStats] = useState({
    total: 0,
    totalSpent: 0,
    pending: 0,
    delivered: 0
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        fetchUserOrders(firebaseUser.uid);
      } else {
        setOrders([]);
        setOrderStats({ total: 0, totalSpent: 0, pending: 0, delivered: 0 });
      }
    });
    return unsubscribe;
  }, []);

  const fetchUserOrders = async (userId) => {
    setLoading(true);
    try {
      const ordersRef = collection(db, "orders");
      const q = query(
        ordersRef, 
        where("userId", "==", userId),
        orderBy("createdAt", "desc")
      );
      
      const querySnapshot = await getDocs(q);
      const ordersList = [];
      let totalSpent = 0;
      let pending = 0;
      let delivered = 0;
      
      querySnapshot.forEach((doc) => {
        const orderData = { id: doc.id, ...doc.data() };
        ordersList.push(orderData);
        totalSpent += orderData.total || 0;
        
        if (orderData.status === 'pending') pending++;
        if (orderData.status === 'delivered') delivered++;
      });
      
      setOrders(ordersList);
      setOrderStats({
        total: ordersList.length,
        totalSpent,
        pending,
        delivered
      });
    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      setLoading(false);
    }
  };

  const createOrder = async (orderData) => {
    try {
      if (!user) throw new Error("User must be logged in to create an order");
      
      const orderWithDetails = {
        ...orderData,
        userId: user.uid,
        orderNumber: `GC-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        status: 'pending',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      const docRef = await addDoc(collection(db, "orders"), orderWithDetails);
      
      // Update order with ID
      await updateDoc(doc(db, "orders", docRef.id), {
        id: docRef.id
      });
      
      // Refresh orders list
      fetchUserOrders(user.uid);
      
      return { 
        success: true, 
        orderId: docRef.id, 
        orderNumber: orderWithDetails.orderNumber 
      };
    } catch (error) {
      console.error("Error creating order:", error);
      return { success: false, error: error.message };
    }
  };

  const getOrderById = async (orderId) => {
    try {
      const orderDoc = await getDoc(doc(db, "orders", orderId));
      if (orderDoc.exists()) {
        return { success: true, order: { id: orderDoc.id, ...orderDoc.data() } };
      }
      return { success: false, error: "Order not found" };
    } catch (error) {
      console.error("Error fetching order:", error);
      return { success: false, error: error.message };
    }
  };

  const updateOrderStatus = async (orderId, status) => {
    try {
      await updateDoc(doc(db, "orders", orderId), {
        status,
        updatedAt: new Date().toISOString()
      });
      
      // Refresh orders list
      if (user) fetchUserOrders(user.uid);
      
      return { success: true };
    } catch (error) {
      console.error("Error updating order:", error);
      return { success: false, error: error.message };
    }
  };

  return (
    <OrdersContext.Provider
      value={{
        orders,
        orderStats,
        loading,
        createOrder,
        getOrderById,
        updateOrderStatus,
        refreshOrders: () => user && fetchUserOrders(user.uid)
      }}
    >
      {children}
    </OrdersContext.Provider>
  );
};