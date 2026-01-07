// src/pages/User/ProfilePage.jsx
import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useWishlist } from "../../context/WishlistContext";
import { 
  collection, query, where, getDocs, orderBy
} from "firebase/firestore";
import { db } from "../../firebase/config";
import { toast } from "react-toastify";
import { 
  User, Mail, Calendar, LogOut, Settings, MapPin, 
  Phone, Edit, Package, Heart, Shield, CreditCard,
  ChevronRight, AlertCircle, CheckCircle, Loader2,
  ArrowRight, Eye, EyeOff, Trash2, ShoppingBag
} from "lucide-react";

const ProfilePage = () => {
  const { user, userProfile, logout, updateUserProfile, changePassword, deleteAccount, fetchUserOrders } = useAuth();
  const { wishlist, fetchWishlist } = useWishlist();
  const navigate = useNavigate();
  
  // States
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState({
    profile: false,
    orders: false,
    password: false,
    delete: false,
    stats: false
  });
  const [errors, setErrors] = useState({});
  const [activeTab, setActiveTab] = useState("overview");
  const [recentOrders, setRecentOrders] = useState([]);
  const [orderStats, setOrderStats] = useState({
    totalOrders: 0,
    totalSpent: 0,
    pendingOrders: 0
  });

  // Form states
  const [profileForm, setProfileForm] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    address: "",
  });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [deleteForm, setDeleteForm] = useState({
    password: "",
    confirm: false
  });
  const [showPassword, setShowPassword] = useState({
    current: false,
    new: false,
    confirm: false,
    delete: false
  });

  // Fetch data on component mount
  useEffect(() => {
    if (user) {
      fetchUserData();
      if (userProfile) {
        setProfileForm({
          firstName: userProfile.firstName || "",
          lastName: userProfile.lastName || "",
          phone: userProfile.phone || "",
          address: userProfile.address || "",
        });
      }
    }
  }, [user, userProfile]);

  // Fetch all user data from Firestore
  const fetchUserData = async () => {
    await Promise.all([
      fetchUserOrdersData(),
      // Add other data fetching here if needed
    ]);
  };

  // Fetch user orders from Firestore
  const fetchUserOrdersData = async () => {
    setLoading(prev => ({ ...prev, orders: true, stats: true }));
    try {
      if (!user) return;
      
      const ordersRef = collection(db, "orders");
      const q = query(
        ordersRef, 
        where("userId", "==", user.uid),
        orderBy("createdAt", "desc")
      );
      
      const querySnapshot = await getDocs(q);
      const orders = [];
      let totalSpent = 0;
      let pendingOrders = 0;
      
      querySnapshot.forEach((doc) => {
        const orderData = { id: doc.id, ...doc.data() };
        orders.push(orderData);
        totalSpent += orderData.total || 0;
        
        if (orderData.status === 'pending' || orderData.status === 'processing') {
          pendingOrders++;
        }
      });
      
      setRecentOrders(orders);
      setOrderStats({
        totalOrders: orders.length,
        totalSpent,
        pendingOrders
      });
    } catch (error) {
      console.error("Error fetching orders:", error);
      toast.error("Failed to load orders. Please try again.");
    } finally {
      setLoading(prev => ({ ...prev, orders: false, stats: false }));
    }
  };

  // Fetch wishlist items from Firestore (if stored there)
  const fetchWishlistFromFirestore = async () => {
    if (!user) return;
    
    try {
      const wishlistRef = collection(db, "wishlists");
      const q = query(wishlistRef, where("userId", "==", user.uid));
      const querySnapshot = await getDocs(q);
      
      const wishlistItems = [];
      querySnapshot.forEach((doc) => {
        wishlistItems.push({ id: doc.id, ...doc.data() });
      });
      
      // Note: Your WishlistContext uses localStorage, so you might want to sync
      // or migrate to Firestore. For now, we'll work with localStorage.
    } catch (error) {
      console.error("Error fetching wishlist:", error);
    }
  };

  // Update profile
  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setLoading(prev => ({ ...prev, profile: true }));
    setErrors({});

    // Validation
    if (!profileForm.firstName.trim() || !profileForm.lastName.trim()) {
      setErrors({ general: "First and last name are required" });
      setLoading(prev => ({ ...prev, profile: false }));
      return;
    }

    try {
      const result = await updateUserProfile(profileForm);
      if (result.success) {
        toast.success("Profile updated successfully!");
        setIsEditing(false);
      } else {
        toast.error(result.error || "Failed to update profile");
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setLoading(prev => ({ ...prev, profile: false }));
    }
  };

  // Change password
  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setLoading(prev => ({ ...prev, password: true }));
    setErrors({});

    // Validation
    const validationErrors = {};
    if (!passwordForm.currentPassword) {
      validationErrors.currentPassword = "Current password is required";
    }
    if (passwordForm.newPassword.length < 6) {
      validationErrors.newPassword = "Password must be at least 6 characters";
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      validationErrors.confirmPassword = "Passwords do not match";
    }

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      setLoading(prev => ({ ...prev, password: false }));
      return;
    }

    try {
      const result = await changePassword(
        passwordForm.currentPassword,
        passwordForm.newPassword
      );
      
      if (result.success) {
        toast.success("Password changed successfully!");
        setPasswordForm({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
        setErrors({});
      } else {
        toast.error(result.error || "Failed to change password");
      }
    } catch (error) {
      console.error("Error changing password:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setLoading(prev => ({ ...prev, password: false }));
    }
  };

  // Delete account
  const handleDeleteAccount = async () => {
    if (!deleteForm.confirm) {
      toast.error("Please confirm account deletion");
      return;
    }

    if (!deleteForm.password) {
      setErrors({ delete: "Password is required to delete account" });
      return;
    }

    setLoading(prev => ({ ...prev, delete: true }));
    try {
      const result = await deleteAccount(deleteForm.password);
      if (result.success) {
        await logout();
        toast.success("Account deleted successfully");
        navigate("/");
      } else {
        toast.error(result.error || "Failed to delete account");
      }
    } catch (error) {
      console.error("Error deleting account:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setLoading(prev => ({ ...prev, delete: false }));
    }
  };

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount || 0);
  };

  // Get user initials
  const getInitials = () => {
    if (userProfile?.firstName && userProfile?.lastName) {
      return `${userProfile.firstName[0]}${userProfile.lastName[0]}`.toUpperCase();
    }
    if (user?.displayName) {
      return user.displayName.split(' ').map(n => n[0]).join('').toUpperCase();
    }
    return user?.email?.[0]?.toUpperCase() || "U";
  };

  // Handle logout
  const handleLogout = async () => {
    try {
      await logout();
      navigate("/");
      toast.success("Logged out successfully");
    } catch (error) {
      console.error("Error logging out:", error);
      toast.error("Failed to logout");
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Authentication Required</h2>
          <p className="text-gray-600 mb-6">
            Please log in to view your profile and manage your account.
          </p>
          <div className="space-y-3">
            <Link
              to="/login"
              className="inline-block w-full sm:w-auto px-6 py-3 bg-rose-600 text-white font-medium rounded-md hover:bg-rose-700 transition-colors"
            >
              Sign In
            </Link>
            <p className="text-sm text-gray-500">
              Don't have an account?{" "}
              <Link to="/signup" className="text-rose-600 hover:text-rose-700">
                Create one
              </Link>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <nav className="flex items-center space-x-2 text-sm text-gray-500 mb-4">
            <Link to="/" className="hover:text-gray-700">Home</Link>
            <ChevronRight className="h-4 w-4" />
            <span className="text-gray-900 font-medium">My Account</span>
          </nav>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">My Account</h1>
              <p className="text-gray-600 mt-1">
                Welcome back, <span className="font-medium">
                  {userProfile?.firstName || user.email?.split('@')[0]}
                </span>!
              </p>
            </div>
            <div className="text-sm text-gray-500">
              Member since{" "}
              <span className="font-medium">
                {user.metadata?.creationTime
                  ? new Date(user.metadata.creationTime).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long'
                    })
                  : 'Recently'}
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar */}
          <div className="lg:w-1/4">
            {/* Profile Card */}
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <div className="flex items-center space-x-4 mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-rose-500 to-pink-500 rounded-full flex items-center justify-center text-white text-xl font-bold">
                  {getInitials()}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold text-gray-900 truncate">
                    {userProfile?.firstName && userProfile?.lastName
                      ? `${userProfile.firstName} ${userProfile.lastName}`
                      : user.displayName || user.email?.split('@')[0]}
                  </h3>
                  <p className="text-sm text-gray-500 truncate">{user.email}</p>
                  <p className="text-xs text-rose-600 mt-1 font-medium">
                    {orderStats.totalOrders >= 10 ? "Gold Member" : 
                     orderStats.totalOrders >= 5 ? "Silver Member" : "New Member"}
                  </p>
                </div>
              </div>

              <nav className="space-y-1">
                <button
                  onClick={() => setActiveTab("overview")}
                  className={`w-full flex items-center justify-between px-3 py-3 rounded-lg text-sm font-medium transition-colors ${
                    activeTab === "overview"
                      ? "bg-rose-50 text-rose-600"
                      : "text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <span>Overview</span>
                  <ChevronRight className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setActiveTab("profile")}
                  className={`w-full flex items-center justify-between px-3 py-3 rounded-lg text-sm font-medium transition-colors ${
                    activeTab === "profile"
                      ? "bg-rose-50 text-rose-600"
                      : "text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <span>Profile Information</span>
                  <ChevronRight className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setActiveTab("orders")}
                  className={`w-full flex items-center justify-between px-3 py-3 rounded-lg text-sm font-medium transition-colors ${
                    activeTab === "orders"
                      ? "bg-rose-50 text-rose-600"
                      : "text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <div className="flex items-center">
                    <span>My Orders</span>
                    {orderStats.totalOrders > 0 && (
                      <span className="ml-2 bg-rose-100 text-rose-600 text-xs px-2 py-1 rounded-full">
                        {orderStats.totalOrders}
                      </span>
                    )}
                  </div>
                  <ChevronRight className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setActiveTab("wishlist")}
                  className={`w-full flex items-center justify-between px-3 py-3 rounded-lg text-sm font-medium transition-colors ${
                    activeTab === "wishlist"
                      ? "bg-rose-50 text-rose-600"
                      : "text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <div className="flex items-center">
                    <span>Wishlist</span>
                    {wishlist.length > 0 && (
                      <span className="ml-2 bg-rose-100 text-rose-600 text-xs px-2 py-1 rounded-full">
                        {wishlist.length}
                      </span>
                    )}
                  </div>
                  <ChevronRight className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setActiveTab("security")}
                  className={`w-full flex items-center justify-between px-3 py-3 rounded-lg text-sm font-medium transition-colors ${
                    activeTab === "security"
                      ? "bg-rose-50 text-rose-600"
                      : "text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <span>Security</span>
                  <ChevronRight className="h-4 w-4" />
                </button>
              </nav>

              <div className="mt-8 pt-6 border-t border-gray-200">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center px-4 py-3 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors font-medium"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </button>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="bg-gradient-to-br from-rose-500 to-pink-500 rounded-lg shadow p-6 text-white">
              <h4 className="font-semibold mb-4 text-lg">Account Summary</h4>
              {loading.stats ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex justify-between items-center pb-3 border-b border-white/20">
                    <span className="text-sm opacity-90">Total Orders</span>
                    <span className="font-bold text-lg">{orderStats.totalOrders}</span>
                  </div>
                  <div className="flex justify-between items-center pb-3 border-b border-white/20">
                    <span className="text-sm opacity-90">Wishlist Items</span>
                    <span className="font-bold text-lg">{wishlist.length}</span>
                  </div>
                  <div className="flex justify-between items-center pb-3 border-b border-white/20">
                    <span className="text-sm opacity-90">Total Spent</span>
                    <span className="font-bold text-lg">{formatCurrency(orderStats.totalSpent)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm opacity-90">Pending Orders</span>
                    <span className="font-bold text-lg">{orderStats.pendingOrders}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:w-3/4">
            {/* Overview Tab */}
            {activeTab === "overview" && (
              <div className="space-y-6">
                {/* Welcome Card */}
                <div className="bg-white rounded-xl shadow p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900">
                        Dashboard Overview
                      </h2>
                      <p className="text-gray-600 mt-1">
                        Track your orders, wishlist, and account activity
                      </p>
                    </div>
                    <Link
                      to="/shop"
                      className="inline-flex items-center text-rose-600 hover:text-rose-700 font-medium"
                    >
                      Continue Shopping
                      <ArrowRight className="h-4 w-4 ml-1" />
                    </Link>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-gradient-to-br from-rose-50 to-pink-50 p-5 rounded-xl border border-rose-100">
                      <div className="flex items-center mb-3">
                        <div className="w-10 h-10 bg-rose-100 rounded-lg flex items-center justify-center mr-3">
                          <Package className="h-5 w-5 text-rose-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">Recent Orders</h3>
                          <p className="text-2xl font-bold text-gray-900 mt-1">{orderStats.totalOrders}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => setActiveTab("orders")}
                        className="text-sm text-rose-600 hover:text-rose-700 font-medium inline-flex items-center"
                      >
                        View all orders
                        <ArrowRight className="h-3 w-3 ml-1" />
                      </button>
                    </div>

                    <div className="bg-gradient-to-br from-rose-50 to-pink-50 p-5 rounded-xl border border-rose-100">
                      <div className="flex items-center mb-3">
                        <div className="w-10 h-10 bg-rose-100 rounded-lg flex items-center justify-center mr-3">
                          <Heart className="h-5 w-5 text-rose-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">Wishlist</h3>
                          <p className="text-2xl font-bold text-gray-900 mt-1">{wishlist.length}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => setActiveTab("wishlist")}
                        className="text-sm text-rose-600 hover:text-rose-700 font-medium inline-flex items-center"
                      >
                        View wishlist
                        <ArrowRight className="h-3 w-3 ml-1" />
                      </button>
                    </div>

                    <div className="bg-gradient-to-br from-rose-50 to-pink-50 p-5 rounded-xl border border-rose-100">
                      <div className="flex items-center mb-3">
                        <div className="w-10 h-10 bg-rose-100 rounded-lg flex items-center justify-center mr-3">
                          <CreditCard className="h-5 w-5 text-rose-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">Total Spent</h3>
                          <p className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(orderStats.totalSpent)}</p>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600">
                        Across {orderStats.totalOrders} orders
                      </p>
                    </div>
                  </div>
                </div>

                {/* Recent Orders Preview */}
                <div className="bg-white rounded-xl shadow">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <h2 className="text-xl font-semibold text-gray-900">Recent Orders</h2>
                      {recentOrders.length > 0 && (
                        <button
                          onClick={() => setActiveTab("orders")}
                          className="text-rose-600 hover:text-rose-700 text-sm font-medium inline-flex items-center"
                        >
                          View All Orders
                          <ArrowRight className="h-4 w-4 ml-1" />
                        </button>
                      )}
                    </div>
                  </div>
                  
                  <div className="p-6">
                    {loading.orders ? (
                      <div className="flex justify-center py-10">
                        <Loader2 className="h-8 w-8 text-rose-600 animate-spin" />
                      </div>
                    ) : recentOrders.length > 0 ? (
                      <div className="space-y-4">
                        {recentOrders.slice(0, 3).map((order) => (
                          <div key={order.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                            <div className="mb-3 sm:mb-0">
                              <p className="font-medium text-gray-900">{order.orderNumber || `ORDER-${order.id.slice(-8)}`}</p>
                              <p className="text-sm text-gray-500 mt-1">
                                {order.createdAt?.toDate 
                                  ? new Date(order.createdAt.toDate()).toLocaleDateString('en-US', {
                                      year: 'numeric',
                                      month: 'short',
                                      day: 'numeric'
                                    })
                                  : new Date().toLocaleDateString()} • {order.items?.length || 0} item{order.items?.length !== 1 ? 's' : ''}
                              </p>
                            </div>
                            <div className="flex flex-col sm:items-end gap-2">
                              <p className="font-semibold text-gray-900 text-lg">{formatCurrency(order.total)}</p>
                              <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                                order.status === 'delivered' 
                                  ? 'bg-green-100 text-green-800'
                                  : order.status === 'processing'
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : order.status === 'shipped'
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-gray-100 text-gray-800'
                              }`}>
                                {order.status?.charAt(0).toUpperCase() + order.status?.slice(1) || 'Pending'}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-10">
                        <ShoppingBag className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500 font-medium">No orders yet</p>
                        <p className="text-gray-400 text-sm mt-1">Your order history will appear here</p>
                        <Link
                          to="/shop"
                          className="mt-4 inline-block px-6 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition-colors font-medium"
                        >
                          Start Shopping
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Profile Information Tab */}
            {activeTab === "profile" && (
              <div className="bg-white rounded-xl shadow">
                <div className="px-6 py-4 border-b border-gray-200">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <h2 className="text-xl font-semibold text-gray-900">Profile Information</h2>
                    {!isEditing && (
                      <button
                        onClick={() => setIsEditing(true)}
                        className="inline-flex items-center px-4 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition-colors font-medium"
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Edit Profile
                      </button>
                    )}
                  </div>
                </div>

                <div className="p-6">
                  {isEditing ? (
                    <form onSubmit={handleProfileSubmit} className="space-y-6 max-w-2xl">
                      {errors.general && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                          <p className="text-sm text-red-600">{errors.general}</p>
                        </div>
                      )}

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            First Name *
                          </label>
                          <input
                            type="text"
                            value={profileForm.firstName}
                            onChange={(e) => setProfileForm({...profileForm, firstName: e.target.value})}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Last Name *
                          </label>
                          <input
                            type="text"
                            value={profileForm.lastName}
                            onChange={(e) => setProfileForm({...profileForm, lastName: e.target.value})}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                            required
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Phone Number
                        </label>
                        <input
                          type="tel"
                          value={profileForm.phone}
                          onChange={(e) => setProfileForm({...profileForm, phone: e.target.value})}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                          placeholder="+1 (555) 123-4567"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Shipping Address
                        </label>
                        <textarea
                          value={profileForm.address}
                          onChange={(e) => setProfileForm({...profileForm, address: e.target.value})}
                          rows="3"
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                          placeholder="123 Main Street, City, State, ZIP Code"
                        />
                      </div>

                      <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-200">
                        <button
                          type="button"
                          onClick={() => setIsEditing(false)}
                          className="px-6 py-3 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                          disabled={loading.profile}
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={loading.profile}
                          className="px-6 py-3 bg-rose-600 text-white rounded-lg text-sm font-medium hover:bg-rose-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {loading.profile ? (
                            <span className="flex items-center justify-center">
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Saving...
                            </span>
                          ) : "Save Changes"}
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div className="space-y-6 max-w-2xl">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <p className="text-sm text-gray-500 mb-1">Full Name</p>
                          <p className="font-medium text-gray-900">
                            {userProfile?.firstName && userProfile?.lastName
                              ? `${userProfile.firstName} ${userProfile.lastName}`
                              : "Not provided"}
                          </p>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <p className="text-sm text-gray-500 mb-1">Email Address</p>
                          <p className="font-medium text-gray-900">{user.email}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <p className="text-sm text-gray-500 mb-1">Phone Number</p>
                          <p className="font-medium text-gray-900">
                            {userProfile?.phone || "Not provided"}
                          </p>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <p className="text-sm text-gray-500 mb-1">Member Since</p>
                          <p className="font-medium text-gray-900">
                            {user.metadata?.creationTime
                              ? new Date(user.metadata.creationTime).toLocaleDateString('en-US', {
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric'
                                })
                              : 'Recently'}
                          </p>
                        </div>
                      </div>

                      {userProfile?.address && (
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <p className="text-sm text-gray-500 mb-1">Shipping Address</p>
                          <p className="font-medium text-gray-900 whitespace-pre-line">
                            {userProfile.address}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Orders Tab */}
            {activeTab === "orders" && (
              <div className="bg-white rounded-xl shadow overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h2 className="text-xl font-semibold text-gray-900">Order History</h2>
                  <p className="text-gray-600 text-sm mt-1">
                    View and track your orders
                  </p>
                </div>
                
                {loading.orders ? (
                  <div className="flex items-center justify-center h-64">
                    <Loader2 className="h-8 w-8 text-rose-600 animate-spin" />
                  </div>
                ) : recentOrders.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Order #
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Date
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Items
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Total
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {recentOrders.map((order) => (
                          <tr key={order.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="font-medium text-gray-900">
                                {order.orderNumber || `ORDER-${order.id.slice(-8)}`}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {order.createdAt?.toDate 
                                ? new Date(order.createdAt.toDate()).toLocaleDateString()
                                : new Date().toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {order.items?.length || 0}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap font-semibold text-gray-900">
                              {formatCurrency(order.total)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                                order.status === 'delivered' 
                                  ? 'bg-green-100 text-green-800'
                                  : order.status === 'processing'
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : order.status === 'shipped'
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-gray-100 text-gray-800'
                              }`}>
                                {order.status?.charAt(0).toUpperCase() + order.status?.slice(1) || 'Pending'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-16">
                    <ShoppingBag className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No orders yet</h3>
                    <p className="text-gray-500 mb-6 max-w-md mx-auto">
                      You haven't placed any orders yet. Start shopping to see your order history here.
                    </p>
                    <Link
                      to="/shop"
                      className="inline-flex items-center px-6 py-3 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition-colors font-medium"
                    >
                      Browse Products
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Link>
                  </div>
                )}
                
                {recentOrders.length > 0 && (
                  <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
                    <div className="flex justify-center">
                      <button
                        onClick={fetchUserOrdersData}
                        disabled={loading.orders}
                        className="text-sm text-gray-600 hover:text-gray-900 font-medium disabled:opacity-50"
                      >
                        {loading.orders ? "Refreshing..." : "Refresh Orders"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Wishlist Tab */}
            {activeTab === "wishlist" && (
              <div className="bg-white rounded-xl shadow overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900">My Wishlist</h2>
                      <p className="text-gray-600 text-sm mt-1">
                        {wishlist.length} item{wishlist.length !== 1 ? 's' : ''} saved for later
                      </p>
                    </div>
                    {wishlist.length > 0 && (
                      <button
                        onClick={() => window.location.reload()}
                        className="text-sm text-rose-600 hover:text-rose-700 font-medium"
                      >
                        Refresh
                      </button>
                    )}
                  </div>
                </div>
                
                <div className="p-6">
                  {wishlist.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                      {wishlist.map((item) => (
                        <div key={item.id} className="group border border-gray-200 rounded-xl p-4 hover:shadow-lg transition-all">
                          <div className="aspect-square bg-gray-100 rounded-lg mb-4 overflow-hidden">
                            {item.image ? (
                              <img 
                                src={item.image} 
                                alt={item.name}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-gray-400">
                                <Package className="h-12 w-12" />
                              </div>
                            )}
                          </div>
                          <h3 className="font-medium text-gray-900 truncate mb-1">{item.name}</h3>
                          <p className="text-rose-600 font-bold text-lg mb-4">
                            {formatCurrency(item.price)}
                          </p>
                          <div className="flex gap-2">
                            <Link
                              to={`/product/${item.id}`}
                              className="flex-1 bg-rose-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-rose-700 transition-colors text-center"
                            >
                              View Product
                            </Link>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-16">
                      <Heart className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">Your wishlist is empty</h3>
                      <p className="text-gray-500 mb-6 max-w-md mx-auto">
                        Save items you love to your wishlist. Review them anytime and easily move them to your cart.
                      </p>
                      <Link
                        to="/shop"
                        className="inline-flex items-center px-6 py-3 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition-colors font-medium"
                      >
                        Start Shopping
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Security Tab */}
            {activeTab === "security" && (
              <div className="space-y-6">
                {/* Change Password */}
                <div className="bg-white rounded-xl shadow p-6">
                  <div className="flex items-start space-x-3 mb-6">
                    <Shield className="h-6 w-6 text-rose-600 mt-1" />
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900">Change Password</h2>
                      <p className="text-gray-600 mt-1">Update your password to keep your account secure</p>
                    </div>
                  </div>

                  <form onSubmit={handlePasswordChange} className="space-y-6 max-w-2xl">
                    {errors.server && (
                      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-sm text-red-600">{errors.server}</p>
                      </div>
                    )}

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Current Password
                      </label>
                      <div className="relative">
                        <input
                          type={showPassword.current ? "text" : "password"}
                          value={passwordForm.currentPassword}
                          onChange={(e) => setPasswordForm({...passwordForm, currentPassword: e.target.value})}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent pr-12"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword({...showPassword, current: !showPassword.current})}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                        >
                          {showPassword.current ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                        </button>
                      </div>
                      {errors.currentPassword && (
                        <p className="mt-2 text-sm text-red-600">{errors.currentPassword}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        New Password
                      </label>
                      <div className="relative">
                        <input
                          type={showPassword.new ? "text" : "password"}
                          value={passwordForm.newPassword}
                          onChange={(e) => setPasswordForm({...passwordForm, newPassword: e.target.value})}
                          className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent pr-12 ${
                            errors.newPassword ? 'border-red-300' : 'border-gray-300'
                          }`}
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword({...showPassword, new: !showPassword.new})}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                        >
                          {showPassword.new ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                        </button>
                      </div>
                      {errors.newPassword && (
                        <p className="mt-2 text-sm text-red-600">{errors.newPassword}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Confirm New Password
                      </label>
                      <div className="relative">
                        <input
                          type={showPassword.confirm ? "text" : "password"}
                          value={passwordForm.confirmPassword}
                          onChange={(e) => setPasswordForm({...passwordForm, confirmPassword: e.target.value})}
                          className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent pr-12 ${
                            errors.confirmPassword ? 'border-red-300' : 'border-gray-300'
                          }`}
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword({...showPassword, confirm: !showPassword.confirm})}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                        >
                          {showPassword.confirm ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                        </button>
                      </div>
                      {errors.confirmPassword && (
                        <p className="mt-2 text-sm text-red-600">{errors.confirmPassword}</p>
                      )}
                    </div>

                    <div className="flex gap-3 pt-4 border-t border-gray-200">
                      <button
                        type="submit"
                        disabled={loading.password}
                        className="px-6 py-3 bg-rose-600 text-white rounded-lg text-sm font-medium hover:bg-rose-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {loading.password ? (
                          <span className="flex items-center justify-center">
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Updating...
                          </span>
                        ) : "Update Password"}
                      </button>
                    </div>
                  </form>
                </div>

                {/* Delete Account */}
                <div className="bg-red-50 border border-red-200 rounded-xl p-6">
                  <div className="flex items-start space-x-3 mb-4">
                    <AlertCircle className="h-6 w-6 text-red-600 mt-1" />
                    <div>
                      <h2 className="text-xl font-semibold text-red-900">Delete Account</h2>
                      <p className="text-red-700 mt-1">
                        Permanently delete your account and all associated data
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="bg-white p-4 rounded-lg border border-red-300">
                      <h4 className="font-medium text-red-800 mb-2">Warning</h4>
                      <ul className="text-sm text-red-700 space-y-1 list-disc pl-5">
                        <li>Your account will be permanently deleted</li>
                        <li>All orders and wishlist items will be removed</li>
                        <li>This action cannot be undone</li>
                        <li>You will need to create a new account to shop again</li>
                      </ul>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="confirmDelete"
                          checked={deleteForm.confirm}
                          onChange={(e) => setDeleteForm({...deleteForm, confirm: e.target.checked})}
                          className="h-4 w-4 text-red-600 rounded"
                        />
                        <label htmlFor="confirmDelete" className="ml-2 text-sm text-red-700">
                          I understand this action cannot be undone
                        </label>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-red-700 mb-2">
                          Enter your password to confirm
                        </label>
                        <div className="relative">
                          <input
                            type={showPassword.delete ? "text" : "password"}
                            value={deleteForm.password}
                            onChange={(e) => setDeleteForm({...deleteForm, password: e.target.value})}
                            className="w-full px-4 py-3 border border-red-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent pr-12"
                            placeholder="Current password"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword({...showPassword, delete: !showPassword.delete})}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-red-500 hover:text-red-700"
                          >
                            {showPassword.delete ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                          </button>
                        </div>
                        {errors.delete && (
                          <p className="mt-2 text-sm text-red-600">{errors.delete}</p>
                        )}
                      </div>

                      <button
                        onClick={handleDeleteAccount}
                        disabled={loading.delete || !deleteForm.confirm || !deleteForm.password}
                        className="w-full sm:w-auto px-6 py-3 bg-white border border-red-600 text-red-600 rounded-lg text-sm font-medium hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {loading.delete ? (
                          <span className="flex items-center justify-center">
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Deleting...
                          </span>
                        ) : (
                          <span className="flex items-center justify-center">
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete My Account
                          </span>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;