import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Star, Truck, Shield, RefreshCw } from "lucide-react";
import { useCart } from "../../context/CartContext";
import { useWishlist } from "../../context/WishlistContext";
import { products } from "../../data/products";
import { formatPrice } from "../../utils/formatters";

const ProductDetail = () => {
  const { id } = useParams();
  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const foundProduct = products.find(p => p.id === parseInt(id));
    setProduct(foundProduct);
    setLoading(false);
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading product...</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Product Not Found</h2>
          <p className="text-gray-600 mb-6">The product you're looking for doesn't exist.</p>
          <Link to="/shop" className="bg-rose-600 text-white px-6 py-3 rounded-md hover:bg-rose-700 transition">
            Browse Products
          </Link>
        </div>
      </div>
    );
  }

  const inWishlist = isInWishlist(product.id);

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Product Image */}
          <div className="aspect-square rounded-lg overflow-hidden bg-gray-100">
            <img
              src={product.image}
              alt={product.name}
              className="w-full h-full object-cover"
            />
          </div>

          {/* Product Info */}
          <div>
            <h1 className="text-4xl font-serif text-gray-900 mb-4">
              {product.name}
            </h1>

            <div className="flex items-center mb-6">
              <div className="flex items-center">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    size={18}
                    className={
                      i < product.rating
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-gray-300"
                    }
                  />
                ))}
              </div>
              <span className="text-gray-600 ml-2">
                ({product.reviews} reviews)
              </span>
            </div>

            <p className="text-3xl text-rose-600 font-semibold mb-6">
              {formatPrice(product.price)}
            </p>

            <p className="text-gray-600 mb-8 leading-relaxed">
              {product.description}
            </p>

            <div className="space-y-4 mb-8">
              <button
                onClick={() => {
                  addToCart(product);
                }}
                className="w-full bg-rose-600 text-white py-4 rounded-md hover:bg-rose-700 transition font-medium"
              >
                Add to Cart
              </button>

              <button
                onClick={() => toggleWishlist(product)}
                className="w-full border-2 border-gray-300 text-gray-700 py-4 rounded-md hover:border-rose-600 hover:text-rose-600 transition font-medium"
              >
                {inWishlist ? "Remove from Wishlist" : "Add to Wishlist"}
              </button>
            </div>

            <div className="border-t pt-8 space-y-4">
              <div className="flex items-start">
                <Truck className="text-rose-600 mr-3 mt-1" size={20} />
                <div>
                  <h4 className="font-medium mb-1">Free Shipping</h4>
                  <p className="text-sm text-gray-600">
                    On orders over ₦50,000
                  </p>
                </div>
              </div>
              <div className="flex items-start">
                <Shield className="text-rose-600 mr-3 mt-1" size={20} />
                <div>
                  <h4 className="font-medium mb-1">Secure Payment</h4>
                  <p className="text-sm text-gray-600">
                    100% secure transactions
                  </p>
                </div>
              </div>
              <div className="flex items-start">
                <RefreshCw className="text-rose-600 mr-3 mt-1" size={20} />
                <div>
                  <h4 className="font-medium mb-1">Easy Returns</h4>
                  <p className="text-sm text-gray-600">
                    14-day return policy
                  </p>
                </div>
              </div>
            </div>

            {/* Product Details */}
            <div className="mt-8 pt-8 border-t">
              <h3 className="font-semibold text-lg mb-4">Product Details</h3>
              <ul className="space-y-2 text-gray-600">
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-rose-600 rounded-full mr-3"></span>
                  Category: {product.category}
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-rose-600 rounded-full mr-3"></span>
                  Availability: {product.inStock ? "In Stock" : "Out of Stock"}
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-rose-600 rounded-full mr-3"></span>
                  Material: Premium quality materials
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-rose-600 rounded-full mr-3"></span>
                  Handcrafted with care
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;