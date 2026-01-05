import React from "react";
import { Link } from "react-router-dom";
import { Heart, Star } from "lucide-react";
import { useWishlist } from "../../context/WishlistContext";
import { formatPrice } from "../../utils/formatters";

const ProductCard = ({ product }) => {
  const { toggleWishlist, isInWishlist } = useWishlist();
  const inWishlist = isInWishlist(product.id);

  return (
    <div className="group">
      <div className="relative overflow-hidden rounded-lg mb-4 bg-gray-100 aspect-square">
        <Link to={`/product/${product.id}`}>
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
          />
        </Link>
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleWishlist(product);
          }}
          className="absolute top-4 right-4 bg-white p-2 rounded-full shadow-md hover:bg-rose-50 transition"
        >
          <Heart
            size={20}
            className={
              inWishlist ? "fill-rose-600 text-rose-600" : "text-gray-600"
            }
          />
        </button>
      </div>
      <Link to={`/product/${product.id}`}>
        <h3 className="font-medium text-gray-900 mb-1 hover:text-rose-600 transition">
          {product.name}
        </h3>
        <div className="flex items-center mb-2">
          <div className="flex items-center">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                size={14}
                className={
                  i < product.rating
                    ? "fill-yellow-400 text-yellow-400"
                    : "text-gray-300"
                }
              />
            ))}
          </div>
          <span className="text-sm text-gray-500 ml-2">
            ({product.reviews})
          </span>
        </div>
        <p className="text-rose-600 font-semibold">
          {formatPrice(product.price)}
        </p>
      </Link>
    </div>
  );
};

export default ProductCard;