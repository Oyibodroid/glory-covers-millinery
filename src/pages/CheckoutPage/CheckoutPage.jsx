import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Shield, CreditCard, AlertCircle } from "lucide-react";
import { useCart } from "../../context/CartContext";
import { useAuth } from "../../context/AuthContext";
import { useOrders } from "../../context/OrdersContext";
import { formatPrice } from "../../utils/formatters";
import { toast } from "react-toastify";

const CheckoutPage = () => {
  const navigate = useNavigate();
  const { cart, cartTotal, clearCart } = useCart();
  const { user, userProfile } = useAuth();
  const { createOrder } = useOrders();
  
  const [checkoutStep, setCheckoutStep] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState("");
  
  // Pre-fill user data if logged in
  const [checkoutData, setCheckoutData] = useState({
    email: user?.email || "",
    firstName: userProfile?.firstName || "",
    lastName: userProfile?.lastName || "",
    address: userProfile?.address || "",
    city: "",
    state: "",
    zipCode: "",
    phone: userProfile?.phone || "",
    paymentMethod: "card",
    saveShippingInfo: false
  });

  // Auto-fill user data when user logs in or profile loads
  useEffect(() => {
    if (user && userProfile) {
      setCheckoutData(prev => ({
        ...prev,
        email: user.email || prev.email,
        firstName: userProfile.firstName || prev.firstName,
        lastName: userProfile.lastName || prev.lastName,
        address: userProfile.address || prev.address,
        phone: userProfile.phone || prev.phone
      }));
    }
  }, [user, userProfile]);

  // Redirect if cart is empty
  useEffect(() => {
    if (cart.length === 0 && checkoutStep === 1) {
      navigate("/cart");
    }
  }, [cart, navigate, checkoutStep]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setCheckoutData({
      ...checkoutData,
      [name]: type === 'checkbox' ? checked : value,
    });
    setError("");
  };

  const validateShippingInfo = () => {
    const requiredFields = ['firstName', 'lastName', 'email', 'address', 'city', 'state', 'zipCode', 'phone'];
    const missingFields = requiredFields.filter(field => !checkoutData[field]?.trim());
    
    if (missingFields.length > 0) {
      setError(`Please fill in: ${missingFields.join(', ')}`);
      return false;
    }
    
    if (!/\S+@\S+\.\S+/.test(checkoutData.email)) {
      setError("Please enter a valid email address");
      return false;
    }
    
    if (!/^\d{10,15}$/.test(checkoutData.phone.replace(/\D/g, ''))) {
      setError("Please enter a valid phone number (10-15 digits)");
      return false;
    }
    
    return true;
  };

  const handleShippingSubmit = (e) => {
    e.preventDefault();
    if (validateShippingInfo()) {
      setCheckoutStep(2);
    }
  };

  const handlePlaceOrder = async () => {
    setIsProcessing(true);
    setError("");

    try {
      // Validate cart
      if (cart.length === 0) {
        throw new Error("Your cart is empty");
      }

      // Create order data
      const orderData = {
        items: cart.map(item => ({
          productId: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          image: item.image || "",
          variant: item.variant || null
        })),
        total: totalAmount,
        subtotal: cartTotal,
        shippingCost: shippingCost,
        shippingAddress: {
          street: checkoutData.address,
          city: checkoutData.city,
          state: checkoutData.state,
          zipCode: checkoutData.zipCode,
          country: "Nigeria" // Default, you can make this a field
        },
        billingAddress: {
          street: checkoutData.address, // Same as shipping for now
          city: checkoutData.city,
          state: checkoutData.state,
          zipCode: checkoutData.zipCode,
          country: "Nigeria"
        },
        paymentMethod: checkoutData.paymentMethod,
        paymentStatus: 'pending', // Will be updated by payment gateway
        customerEmail: checkoutData.email,
        customerName: `${checkoutData.firstName} ${checkoutData.lastName}`,
        customerPhone: checkoutData.phone,
        customerNotes: "",
        status: 'pending'
      };

      // If user is logged in, add userId
      if (user) {
        orderData.userId = user.uid;
      }

      console.log("Creating order:", orderData);
      
      // Create order in Firestore
      const result = await createOrder(orderData);
      
      if (result.success) {
        console.log("Order created successfully:", result);
        
        // In production: Redirect to payment gateway here
        // For now, simulate successful payment
        setTimeout(() => {
          // Clear cart after successful order
          clearCart();
          
          // Show success message
          toast.success(`Order #${result.orderNumber} placed successfully!`);
          
          // Redirect to order confirmation
          navigate(`/order-confirmation/${result.orderId}`, {
            state: { orderNumber: result.orderNumber }
          });
        }, 1500);
        
      } else {
        throw new Error(result.error || "Failed to create order");
      }
      
    } catch (error) {
      console.error("Order placement error:", error);
      setError(error.message || "Failed to place order. Please try again.");
      toast.error("Order placement failed");
    } finally {
      setIsProcessing(false);
    }
  };

  const shippingCost = cartTotal >= 50000 ? 0 : 2000;
  const totalAmount = cartTotal + shippingCost;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-4xl font-serif text-gray-900 mb-8">Checkout</h1>

        {/* Progress Steps */}
        <div className="flex items-center mb-12">
          <div
            className={`flex items-center ${
              checkoutStep >= 1 ? "text-rose-600" : "text-gray-400"
            }`}
          >
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center ${
                checkoutStep >= 1 ? "bg-rose-600 text-white" : "bg-gray-200"
              }`}
            >
              1
            </div>
            <span className="ml-2 font-medium">Shipping</span>
          </div>
          <div
            className={`flex-1 h-1 mx-4 ${
              checkoutStep >= 2 ? "bg-rose-600" : "bg-gray-200"
            }`}
          ></div>
          <div
            className={`flex items-center ${
              checkoutStep >= 2 ? "text-rose-600" : "text-gray-400"
            }`}
          >
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center ${
                checkoutStep >= 2 ? "bg-rose-600 text-white" : "bg-gray-200"
              }`}
            >
              2
            </div>
            <span className="ml-2 font-medium">Payment</span>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center">
            <AlertCircle className="h-5 w-5 text-red-400 mr-2" />
            <span className="text-red-600">{error}</span>
          </div>
        )}

        {checkoutStep === 1 ? (
          <form
            onSubmit={handleShippingSubmit}
            className="bg-white rounded-lg shadow-sm p-8"
          >
            <h2 className="text-2xl font-semibold mb-6">
              Shipping Information
            </h2>
            
            {user && (
              <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-700">
                  <span className="font-medium">Logged in as:</span> {user.email}
                  {userProfile?.firstName && (
                    <span className="ml-2">({userProfile.firstName} {userProfile.lastName})</span>
                  )}
                </p>
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  First Name *
                </label>
                <input
                  type="text"
                  name="firstName"
                  required
                  value={checkoutData.firstName}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-600"
                  placeholder="John"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Last Name *
                </label>
                <input
                  type="text"
                  name="lastName"
                  required
                  value={checkoutData.lastName}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-600"
                  placeholder="Doe"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  name="email"
                  required
                  value={checkoutData.email}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-600"
                  placeholder="you@example.com"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone *
                </label>
                <input
                  type="tel"
                  name="phone"
                  required
                  value={checkoutData.phone}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-600"
                  placeholder="+234 801 234 5678"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Address *
                </label>
                <input
                  type="text"
                  name="address"
                  required
                  value={checkoutData.address}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-600"
                  placeholder="123 Main Street"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  City *
                </label>
                <input
                  type="text"
                  name="city"
                  required
                  value={checkoutData.city}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-600"
                  placeholder="Lagos"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  State *
                </label>
                <input
                  type="text"
                  name="state"
                  required
                  value={checkoutData.state}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-600"
                  placeholder="Lagos State"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Zip Code *
                </label>
                <input
                  type="text"
                  name="zipCode"
                  required
                  value={checkoutData.zipCode}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-600"
                  placeholder="100001"
                />
              </div>
            </div>
            
            {user && (
              <div className="mt-6 flex items-center">
                <input
                  type="checkbox"
                  id="saveShippingInfo"
                  name="saveShippingInfo"
                  checked={checkoutData.saveShippingInfo}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-rose-600 rounded"
                />
                <label htmlFor="saveShippingInfo" className="ml-2 text-sm text-gray-700">
                  Save this shipping information to my profile
                </label>
              </div>
            )}
            
            <button
              type="submit"
              disabled={cart.length === 0}
              className="w-full mt-8 bg-rose-600 text-white py-4 rounded-lg hover:bg-rose-700 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Continue to Payment
            </button>
          </form>
        ) : (
          <div className="bg-white rounded-lg shadow-sm p-8">
            <h2 className="text-2xl font-semibold mb-6">
              Payment Information
            </h2>
            
            {/* Payment Method Selection */}
            <div className="mb-8">
              <h3 className="font-medium text-gray-900 mb-4">Select Payment Method</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className={`relative border-2 rounded-lg p-4 cursor-pointer transition-all ${
                  checkoutData.paymentMethod === 'card' 
                    ? 'border-rose-500 bg-rose-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}>
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="card"
                    checked={checkoutData.paymentMethod === 'card'}
                    onChange={handleInputChange}
                    className="sr-only"
                  />
                  <div className="flex items-center">
                    <CreditCard className="h-6 w-6 mr-3" />
                    <div>
                      <p className="font-medium">Credit/Debit Card</p>
                      <p className="text-sm text-gray-500">Pay securely with your card</p>
                    </div>
                  </div>
                </label>
                
                <label className={`relative border-2 rounded-lg p-4 cursor-pointer transition-all ${
                  checkoutData.paymentMethod === 'transfer' 
                    ? 'border-rose-500 bg-rose-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}>
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="transfer"
                    checked={checkoutData.paymentMethod === 'transfer'}
                    onChange={handleInputChange}
                    className="sr-only"
                  />
                  <div className="flex items-center">
                    <Shield className="h-6 w-6 mr-3" />
                    <div>
                      <p className="font-medium">Bank Transfer</p>
                      <p className="text-sm text-gray-500">Pay via bank transfer</p>
                    </div>
                  </div>
                </label>
              </div>
            </div>

            {/* Secure Payment Notice */}
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center mb-8 bg-gray-50">
              <Shield size={48} className="mx-auto text-green-500 mb-4" />
              <p className="text-gray-700 font-medium mb-2">Secure Payment</p>
              <p className="text-sm text-gray-600">
                Your payment information is encrypted and secure
              </p>
              <p className="text-xs text-gray-500 mt-2">
                This is a demo. In production, this would integrate with Stripe/Paystack.
              </p>
            </div>

            {/* Order Summary */}
            <div className="bg-gray-50 rounded-lg p-6 mb-8">
              <h3 className="font-semibold mb-4 text-lg">Order Summary</h3>
              {cart.map((item) => (
                <div key={item.id} className="flex justify-between items-center mb-3 pb-3 border-b border-gray-200">
                  <div className="flex items-center">
                    {item.image && (
                      <img 
                        src={item.image} 
                        alt={item.name} 
                        className="w-12 h-12 rounded object-cover mr-3"
                      />
                    )}
                    <div>
                      <p className="font-medium text-gray-900">{item.name}</p>
                      <p className="text-sm text-gray-600">Qty: {item.quantity}</p>
                    </div>
                  </div>
                  <span className="font-medium">
                    {formatPrice(item.price * item.quantity)}
                  </span>
                </div>
              ))}
              
              <div className="mt-4 pt-4 border-t border-gray-200 space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-medium">{formatPrice(cartTotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Shipping</span>
                  <span className="font-medium">
                    {shippingCost === 0 ? 'FREE' : formatPrice(shippingCost)}
                    {cartTotal < 50000 && (
                      <span className="text-xs text-gray-500 ml-1">
                        (Free shipping on orders over ₦50,000)
                      </span>
                    )}
                  </span>
                </div>
                <div className="flex justify-between text-lg font-bold pt-3 border-t">
                  <span>Total</span>
                  <span className="text-rose-600">
                    {formatPrice(totalAmount)}
                  </span>
                </div>
              </div>
            </div>

            {/* Terms & Conditions */}
            <div className="mb-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                By clicking "Place Order", you agree to our Terms of Service and Privacy Policy.
                This is a demo transaction - no real payment will be processed.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => setCheckoutStep(1)}
                className="flex-1 border-2 border-gray-300 text-gray-700 py-4 rounded-lg hover:border-rose-600 hover:text-rose-600 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isProcessing}
              >
                Back to Shipping
              </button>
              <button
                type="button"
                onClick={handlePlaceOrder}
                disabled={isProcessing}
                className="flex-1 bg-rose-600 text-white py-4 rounded-lg hover:bg-rose-700 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isProcessing ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing Order...
                  </span>
                ) : (
                  "Place Order"
                )}
              </button>
            </div>
          </div>
        )}

        {/* Cart Summary Sidebar (Mobile) */}
        <div className="mt-8 lg:hidden">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="font-semibold mb-4">Order Summary</h3>
            <div className="space-y-3">
              {cart.slice(0, 3).map((item) => (
                <div key={item.id} className="flex justify-between">
                  <span className="text-gray-600">
                    {item.name} x {item.quantity}
                  </span>
                  <span>{formatPrice(item.price * item.quantity)}</span>
                </div>
              ))}
              {cart.length > 3 && (
                <p className="text-sm text-gray-500">
                  +{cart.length - 3} more items
                </p>
              )}
              <div className="border-t pt-3">
                <div className="flex justify-between font-bold">
                  <span>Total</span>
                  <span className="text-rose-600">{formatPrice(totalAmount)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;