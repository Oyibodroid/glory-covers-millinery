import React from "react";
import { Link } from "react-router-dom";
import { Heart } from "lucide-react";
import { useWishlist } from "../../context/WishlistContext";
import { useCart } from "../../context/CartContext";
import ProductCard from "../../components/ProductCard/ProductCard";

const WishlistPage = () => {
  const { wishlist, toggleWishlist } = useWishlist();
  const { addToCart } = useCart();

  const handleAddToCart = (product, e) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(product);
  };

  const handleRemoveFromWishlist = (product, e) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist(product);
  };

  if (wishlist.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <Heart size={64} className="mx-auto text-gray-400 mb-4" />
            <h2 className="text-2xl font-medium text-gray-900 mb-2">
              Your wishlist is empty
            </h2>
            <p className="text-gray-600 mb-6">
              Save your favorite items here for later
            </p>
            <Link
              to="/shop"
              className="bg-rose-600 text-white px-8 py-3 rounded-md hover:bg-rose-700 transition"
            >
              Browse Products
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-serif text-gray-900">
            My Wishlist ({wishlist.length} items)
          </h1>
          <button
            onClick={() => {
              wishlist.forEach(product => toggleWishlist(product));
            }}
            className="text-rose-600 hover:text-rose-700 font-medium"
          >
            Clear All
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {wishlist.map((product) => (
            <div key={product.id} className="relative group">
              <ProductCard product={product} />
              <div className="mt-4 flex gap-2">
                <button
                  onClick={(e) => handleAddToCart(product, e)}
                  className="flex-1 bg-rose-600 text-white py-2 rounded-md hover:bg-rose-700 transition text-sm"
                >
                  Add to Cart
                </button>
                <button
                  onClick={(e) => handleRemoveFromWishlist(product, e)}
                  className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-md hover:border-rose-600 hover:text-rose-600 transition text-sm"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 flex justify-between items-center">
          <Link
            to="/shop"
            className="border-2 border-rose-600 text-rose-600 px-8 py-3 rounded-md hover:bg-rose-600 hover:text-white transition"
          >
            Continue Shopping
          </Link>
          {wishlist.length > 0 && (
            <button
              onClick={() => {
                wishlist.forEach(product => addToCart(product));
                alert("All items added to cart!");
              }}
              className="bg-rose-600 text-white px-8 py-3 rounded-md hover:bg-rose-700 transition"
            >
              Add All to Cart
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default WishlistPage;