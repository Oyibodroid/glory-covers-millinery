// src/pages/Order/OrderConfirmationPage.jsx
import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useOrders } from "../../context/OrdersContext";
import { CheckCircle, Package, Truck, Home } from "lucide-react";

const OrderConfirmationPage = () => {
  const { orderId } = useParams();
  const { getOrderById } = useOrders();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrder = async () => {
      if (orderId) {
        const result = await getOrderById(orderId);
        if (result.success) {
          setOrder(result.order);
        }
        setLoading(false);
      }
    };
    fetchOrder();
  }, [orderId]);

  if (loading) return <div>Loading order details...</div>;
  if (!order) return <div>Order not found</div>;

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-3xl mx-auto px-4">
        <div className="text-center mb-8">
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-gray-900">Order Confirmed!</h1>
          <p className="text-gray-600 mt-2">
            Thank you for your purchase. Your order #{order.orderNumber} has been received.
          </p>
        </div>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="text-center p-4 border rounded-lg">
              <Package className="h-8 w-8 text-blue-500 mx-auto mb-2" />
              <h3 className="font-semibold">Order Status</h3>
              <p className="text-sm text-gray-600 capitalize">{order.status}</p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <Truck className="h-8 w-8 text-green-500 mx-auto mb-2" />
              <h3 className="font-semibold">Estimated Delivery</h3>
              <p className="text-sm text-gray-600">3-5 business days</p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <Package className="h-8 w-8 text-purple-500 mx-auto mb-2" />
              <h3 className="font-semibold">Items</h3>
              <p className="text-sm text-gray-600">{order.items.length} items</p>
            </div>
          </div>

          {/* Order Summary */}
          <div className="border-t pt-6">
            <h3 className="font-semibold text-lg mb-4">Order Summary</h3>
            {order.items.map((item, index) => (
              <div key={index} className="flex justify-between items-center py-3 border-b">
                <div className="flex items-center">
                  <img src={item.image} alt={item.name} className="w-12 h-12 rounded mr-4" />
                  <div>
                    <p className="font-medium">{item.name}</p>
                    <p className="text-sm text-gray-600">Qty: {item.quantity}</p>
                  </div>
                </div>
                <p className="font-semibold">${(item.price * item.quantity).toFixed(2)}</p>
              </div>
            ))}
            
            <div className="mt-4 pt-4 border-t">
              <div className="flex justify-between py-2">
                <span>Subtotal</span>
                <span>${order.total.toFixed(2)}</span>
              </div>
              <div className="flex justify-between py-2">
                <span>Shipping</span>
                <span>$0.00</span>
              </div>
              <div className="flex justify-between py-2 font-bold text-lg">
                <span>Total</span>
                <span>${order.total.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="text-center">
          <Link
            to="/orders"
            className="inline-block px-6 py-3 bg-rose-600 text-white rounded-lg hover:bg-rose-700 mr-4"
          >
            View All Orders
          </Link>
          <Link
            to="/"
            className="inline-flex items-center px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <Home className="h-4 w-4 mr-2" />
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
};

export default OrderConfirmationPage;