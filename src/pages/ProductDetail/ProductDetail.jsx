import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  Star,
  Truck,
  Shield,
  RefreshCw,
  ArrowLeft,
  MessageCircle,
  Heart,
  ShoppingCart,
  Package,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { useCart } from "../../context/CartContext";
import { useWishlist } from "../../context/WishlistContext";
import { useReviews } from "../../context/ReviewsContext";
import { useAuth } from "../../context/AuthContext";
import { formatPrice } from "../../utils/formatters";
import { toast } from "react-toastify";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../firebase/config";

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const { getProductReviews, addReview, user } = useReviews();
  const { user: authUser } = useAuth();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: "" });
  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [averageRating, setAverageRating] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);

  // Fetch product from Firestore
  useEffect(() => {
    const loadProduct = async () => {
      setLoading(true);
      setError(null);

      try {
        if (!id) {
          throw new Error("Product ID is required");
        }

        const productDoc = await getDoc(doc(db, "products", id));

        if (productDoc.exists()) {
          const productData = {
            id: productDoc.id,
            ...productDoc.data(),
          };

          // Ensure all required fields exist
          const completeProduct = {
            ...productData,
            name: productData.name || "Unnamed Product",
            price: productData.price || 0,
            description: productData.description || "No description available",
            category: productData.category || "Uncategorized",
            inStock:
              productData.inStock !== undefined ? productData.inStock : true,
            image: productData.image || "https://via.placeholder.com/600",
            rating: productData.rating || 0,
            reviews: productData.reviews || 0,
            featured: productData.featured || false,
            createdAt: productData.createdAt || new Date().toISOString(),
          };

          setProduct(completeProduct);
          loadProductReviews(id);
        } else {
          setError("Product not found");
        }
      } catch (err) {
        console.error("Error loading product:", err);
        setError(err.message || "Failed to load product details");
      } finally {
        setLoading(false);
      }
    };

    loadProduct();
  }, [id]);

  // Fetch reviews for this product
  const loadProductReviews = async (productId) => {
    setReviewsLoading(true);
    try {
      const result = await getProductReviews(productId);
      if (result.success) {
        setReviews(result.reviews);
        setAverageRating(parseFloat(result.averageRating) || 0);
        setTotalReviews(result.totalReviews);
      } else {
        setReviews([]);
        setAverageRating(0);
        setTotalReviews(0);
      }
    } catch (err) {
      console.error("Error loading reviews:", err);
      setReviews([]);
      setAverageRating(0);
      setTotalReviews(0);
    } finally {
      setReviewsLoading(false);
    }
  };

  const handleAddToCart = () => {
    if (!product) return;

    if (!product.inStock) {
      toast.error("This product is out of stock");
      return;
    }

    addToCart(product, quantity);
    toast.success(`${quantity} × ${product.name} added to cart!`);
  };

  const handleToggleWishlist = () => {
    if (!product) return;

    toggleWishlist(product);
    const inWishlist = isInWishlist(product.id);

    if (inWishlist) {
      toast.success(`${product.name} added to wishlist!`);
    } else {
      toast.info(`${product.name} removed from wishlist`);
    }
  };

const handleSubmitReview = async (e) => {
  e.preventDefault();
  
  if (!authUser) {
    toast.error("Please log in to submit a review");
    navigate("/login");
    return;
  }
  
  if (!reviewForm.comment.trim()) {
    toast.error("Please write a review comment");
    return;
  }
  
  try {
    const result = await addReview(id, reviewForm);
    if (result.success) {
      toast.success("Review submitted successfully!");
      setReviewForm({ rating: 5, comment: "" });
      setShowReviewForm(false);
      
      // Force reload reviews after a short delay to ensure Firestore updates
      setTimeout(() => {
        loadProductReviews(id);
      }, 1000);
      
      // Also update the product's rating in local state
      const newReviewCount = totalReviews + 1;
      const newAverageRating = ((averageRating * totalReviews) + reviewForm.rating) / newReviewCount;
      setAverageRating(parseFloat(newAverageRating.toFixed(1)));
      setTotalReviews(newReviewCount);
    } else {
      toast.error(result.error);
    }
  } catch (error) {
    console.error("Review submission error:", error);
    toast.error("Failed to submit review");
  }
};


  const incrementQuantity = () => {
    if (product?.inStock) {
      setQuantity((prev) => prev + 1);
    }
  };

  const decrementQuantity = () => {
    if (quantity > 1) {
      setQuantity((prev) => prev - 1);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 text-rose-600 animate-spin mx-auto" />
          <p className="mt-4 text-gray-600">Loading product details...</p>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center text-rose-600 hover:text-rose-700 mb-8"
          >
            <ArrowLeft size={20} className="mr-2" />
            Back to Shop
          </button>

          <div className="text-center py-16">
            <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              Product Not Found
            </h2>
            <p className="text-gray-600 mb-6">
              {error ||
                "The product you're looking for doesn't exist or has been removed."}
            </p>
            <div className="space-x-4">
              <button
                onClick={() => navigate(-1)}
                className="bg-gray-200 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-300 transition"
              >
                Go Back
              </button>
              <Link
                to="/shop"
                className="bg-rose-600 text-white px-6 py-3 rounded-lg hover:bg-rose-700 transition inline-block"
              >
                Browse Products
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const inWishlist = isInWishlist(product.id);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Breadcrumb */}
        <nav className="flex items-center text-sm text-gray-500 mb-8">
          <Link to="/" className="hover:text-rose-600">
            Home
          </Link>
          <span className="mx-2">/</span>
          <Link to="/shop" className="hover:text-rose-600">
            Shop
          </Link>
          <span className="mx-2">/</span>
          <Link
            to={`/shop?category=${product.category}`}
            className="hover:text-rose-600 capitalize"
          >
            {product.category}
          </Link>
          <span className="mx-2">/</span>
          <span className="text-gray-900 font-medium truncate">
            {product.name}
          </span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Product Images */}
          <div>
            <div className="aspect-square rounded-xl overflow-hidden bg-white shadow-lg mb-4">
              <img
                src={product.image}
                alt={product.name}
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
              />
            </div>

            {!product.inStock && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
                <p className="text-red-700 font-medium">Out of Stock</p>
                <p className="text-sm text-red-600 mt-1">
                  This item is currently unavailable
                </p>
              </div>
            )}
          </div>

          {/* Product Info */}
          <div>
            {/* Category & Stock Status */}
            <div className="flex items-center justify-between mb-4">
              <span className="px-3 py-1 bg-rose-100 text-rose-700 rounded-full text-sm font-medium">
                {product.category}
              </span>
              <div className="flex items-center">
                {product.inStock ? (
                  <span className="flex items-center text-green-600">
                    <div className="w-2 h-2 bg-green-600 rounded-full mr-2"></div>
                    In Stock
                  </span>
                ) : (
                  <span className="flex items-center text-red-600">
                    <div className="w-2 h-2 bg-red-600 rounded-full mr-2"></div>
                    Out of Stock
                  </span>
                )}
              </div>
            </div>

            <h1 className="text-4xl font-serif text-gray-900 mb-3">
              {product.name}
            </h1>

            {/* Rating */}
            <div className="flex items-center mb-6">
              <div className="flex items-center">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    size={20}
                    className={
                      i < averageRating
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-gray-300"
                    }
                  />
                ))}
              </div>
              <span className="text-gray-600 ml-2">
                {averageRating} ({totalReviews}{" "}
                {totalReviews === 1 ? "review" : "reviews"})
              </span>
            </div>

            {/* Price */}
            <div className="mb-6">
              <p className="text-4xl text-rose-600 font-bold">
                {formatPrice(product.price)}
              </p>
              {product.originalPrice && (
                <p className="text-lg text-gray-400 line-through">
                  {formatPrice(product.originalPrice)}
                </p>
              )}
            </div>

            {/* Description */}
            <div className="mb-8">
              <h3 className="font-semibold text-gray-900 mb-2">Description</h3>
              <p className="text-gray-600 leading-relaxed whitespace-pre-line">
                {product.description}
              </p>
            </div>

            {/* Quantity Selector */}
            <div className="mb-8">
              <h3 className="font-semibold text-gray-900 mb-3">Quantity</h3>
              <div className="flex items-center">
                <button
                  onClick={decrementQuantity}
                  disabled={quantity <= 1}
                  className="w-10 h-10 border rounded-l-lg flex items-center justify-center hover:bg-gray-50 disabled:opacity-50"
                >
                  -
                </button>
                <div className="w-16 h-10 border-t border-b flex items-center justify-center font-medium">
                  {quantity}
                </div>
                <button
                  onClick={incrementQuantity}
                  disabled={!product.inStock}
                  className="w-10 h-10 border rounded-r-lg flex items-center justify-center hover:bg-gray-50 disabled:opacity-50"
                >
                  +
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-4 mb-8">
              <button
                onClick={handleAddToCart}
                disabled={!product.inStock}
                className="w-full flex items-center justify-center bg-rose-600 text-white py-4 rounded-lg hover:bg-rose-700 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ShoppingCart className="h-5 w-5 mr-2" />
                Add to Cart
              </button>

              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={handleToggleWishlist}
                  className={`flex items-center justify-center py-4 rounded-lg transition font-medium ${
                    inWishlist
                      ? "bg-rose-50 text-rose-600 border border-rose-200"
                      : "border-2 border-gray-300 text-gray-700 hover:border-rose-600 hover:text-rose-600"
                  }`}
                >
                  <Heart
                    className={`h-5 w-5 mr-2 ${
                      inWishlist ? "fill-current" : ""
                    }`}
                  />
                  {inWishlist ? "Saved" : "Wishlist"}
                </button>

                <button
                  onClick={() => {
                    handleAddToCart();
                    navigate("/checkout");
                  }}
                  disabled={!product.inStock}
                  className="flex items-center justify-center border-2 border-rose-600 text-rose-600 py-4 rounded-lg hover:bg-rose-50 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Buy Now
                </button>
              </div>
            </div>

            {/* Features */}
            <div className="border-t pt-8 space-y-6">
              <div className="flex items-start">
                <Truck
                  className="text-rose-600 mr-4 mt-1 flex-shrink-0"
                  size={24}
                />
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">
                    Free Shipping
                  </h4>
                  <p className="text-sm text-gray-600">
                    Free delivery on orders over ₦50,000. Standard shipping:
                    ₦2,000.
                  </p>
                </div>
              </div>
              <div className="flex items-start">
                <Shield
                  className="text-rose-600 mr-4 mt-1 flex-shrink-0"
                  size={24}
                />
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">
                    Secure Payment
                  </h4>
                  <p className="text-sm text-gray-600">
                    100% secure transactions with encrypted payment processing.
                  </p>
                </div>
              </div>
              <div className="flex items-start">
                <RefreshCw
                  className="text-rose-600 mr-4 mt-1 flex-shrink-0"
                  size={24}
                />
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">
                    Easy Returns
                  </h4>
                  <p className="text-sm text-gray-600">
                    14-day return policy. No questions asked.
                  </p>
                </div>
              </div>
            </div>

            {/* Additional Details */}
            <div className="mt-8 pt-8 border-t">
              <h3 className="font-semibold text-lg text-gray-900 mb-4">
                Product Details
              </h3>
              <div className="space-y-3 text-gray-600">
                <div className="flex items-center">
                  <Package className="h-4 w-4 mr-3 text-gray-400" />
                  <span>
                    SKU:{" "}
                    <span className="font-medium">
                      {product.id?.slice(0, 8).toUpperCase()}
                    </span>
                  </span>
                </div>
                <div className="flex items-center">
                  <Package className="h-4 w-4 mr-3 text-gray-400" />
                  <span>
                    Category:{" "}
                    <span className="font-medium capitalize">
                      {product.category}
                    </span>
                  </span>
                </div>
                {product.featured && (
                  <div className="flex items-center">
                    <Star className="h-4 w-4 mr-3 text-yellow-400" />
                    <span className="text-yellow-600 font-medium">
                      Featured Product
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Reviews Section */}
        <div className="mt-16">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center">
              <MessageCircle className="h-6 w-6 mr-3" />
              Customer Reviews
              {averageRating > 0 && (
                <span className="ml-3 text-lg font-normal text-gray-600">
                  {averageRating} ⭐ ({totalReviews})
                </span>
              )}
            </h2>
            {authUser && (
              <button
                onClick={() => setShowReviewForm(!showReviewForm)}
                className="px-6 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition font-medium"
              >
                Write a Review
              </button>
            )}
          </div>

          {/* Review Form */}
          {showReviewForm && authUser && (
            <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
              <h3 className="font-semibold text-gray-900 mb-4">
                Write Your Review
              </h3>
              <form onSubmit={handleSubmitReview}>
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Your Rating
                  </label>
                  <div className="flex space-x-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        type="button"
                        key={star}
                        onClick={() =>
                          setReviewForm({ ...reviewForm, rating: star })
                        }
                        className="text-3xl transition-transform hover:scale-110"
                      >
                        {star <= reviewForm.rating ? "⭐" : "☆"}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Your Review
                  </label>
                  <textarea
                    value={reviewForm.comment}
                    onChange={(e) =>
                      setReviewForm({ ...reviewForm, comment: e.target.value })
                    }
                    className="w-full p-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                    rows="4"
                    placeholder="Share your experience with this product..."
                    required
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    type="submit"
                    className="px-6 py-3 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition font-medium"
                  >
                    Submit Review
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowReviewForm(false)}
                    className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition font-medium"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Reviews List */}
          {reviewsLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 text-rose-600 animate-spin" />
            </div>
          ) : reviews.length > 0 ? (
            <div className="space-y-6">
              {reviews.map((review) => (
                <div
                  key={review.id}
                  className="bg-white rounded-xl shadow-sm p-6"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <p className="font-semibold text-gray-900">
                        {review.userName}
                      </p>
                      <div className="flex items-center mt-1">
                        <div className="flex">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`h-4 w-4 ${
                                i < review.rating
                                  ? "text-yellow-400 fill-yellow-400"
                                  : "text-gray-300"
                              }`}
                            />
                          ))}
                        </div>
                        <span className="ml-3 text-sm text-gray-500">
                          {new Date(review.createdAt).toLocaleDateString(
                            "en-US",
                            {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            }
                          )}
                        </span>
                      </div>
                    </div>
                    {authUser?.uid === review.userId && (
                      <button
                        className="text-sm text-gray-500 hover:text-red-600"
                        onClick={async () => {
                          if (
                            window.confirm(
                              "Are you sure you want to delete this review?"
                            )
                          ) {
                            // You can add delete functionality here
                            toast.info(
                              "Delete functionality would be added here"
                            );
                          }
                        }}
                      >
                        Delete
                      </button>
                    )}
                  </div>
                  <p className="text-gray-700 whitespace-pre-line">
                    {review.comment}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-white rounded-xl shadow-sm">
              <MessageCircle className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No Reviews Yet
              </h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                Be the first to share your thoughts about this product!
              </p>
              {!authUser && (
                <div className="space-x-4">
                  <Link
                    to="/login"
                    className="inline-block px-6 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700"
                  >
                    Sign In to Review
                  </Link>
                  <Link
                    to="/signup"
                    className="inline-block px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Create Account
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
