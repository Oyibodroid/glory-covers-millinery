import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useCart } from "../../context/CartContext";
import { useWishlist } from "../../context/WishlistContext";
import { ShoppingCart, Search, Menu, X, Heart, User } from "lucide-react";

const Header = () => {
  const location = useLocation();
  const { cartCount } = useCart();
  const { wishlist } = useWishlist();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActive = (path) => location.pathname === path;

  return (
    <header className="bg-white shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <button
            className="lg:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>

          <div className="flex items-center space-x-8">
            <Link to="/" className="text-2xl font-serif">
              Glory Covers
            </Link>
            <nav className="hidden lg:flex space-x-6">
              <Link
                to="/"
                className={`hover:text-rose-600 transition ${
                  isActive("/") ? "text-rose-600" : "text-gray-700"
                }`}
              >
                Home
              </Link>
              <Link
                to="/shop"
                className={`hover:text-rose-600 transition ${
                  isActive("/shop") ? "text-rose-600" : "text-gray-700"
                }`}
              >
                Shop
              </Link>
              <Link
                to="/about"
                className={`hover:text-rose-600 transition ${
                  isActive("/about") ? "text-rose-600" : "text-gray-700"
                }`}
              >
                About
              </Link>
            </nav>
          </div>

          <div className="flex items-center space-x-4">
            <button className="hidden sm:block hover:text-rose-600 transition">
              <Search size={20} />
            </button>
            <Link
              to="/wishlist"
              className="hover:text-rose-600 transition relative"
            >
              <Heart size={20} />
              {wishlist.length > 0 && (
                <span className="absolute -top-2 -right-2 bg-rose-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {wishlist.length}
                </span>
              )}
            </Link>
            <button className="hover:text-rose-600 transition">
              <User size={20} />
            </button>
            <Link
              to="/cart"
              className="hover:text-rose-600 transition relative"
            >
              <ShoppingCart size={20} />
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-rose-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </Link>
          </div>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="lg:hidden border-t">
          <nav className="px-4 py-4 space-y-2">
            <Link
              to="/"
              onClick={() => setMobileMenuOpen(false)}
              className={`block py-2 ${
                isActive("/")
                  ? "text-rose-600 font-medium"
                  : "hover:text-rose-600"
              }`}
            >
              Home
            </Link>
            <Link
              to="/shop"
              onClick={() => setMobileMenuOpen(false)}
              className={`block py-2 ${
                isActive("/shop")
                  ? "text-rose-600 font-medium"
                  : "hover:text-rose-600"
              }`}
            >
              Shop
            </Link>
            <Link
              to="/about"
              onClick={() => setMobileMenuOpen(false)}
              className={`block py-2 ${
                isActive("/about")
                  ? "text-rose-600 font-medium"
                  : "hover:text-rose-600"
              }`}
            >
              About
            </Link>
            <Link
              to="/wishlist"
              onClick={() => setMobileMenuOpen(false)}
              className={`block py-2 ${
                isActive("/wishlist")
                  ? "text-rose-600 font-medium"
                  : "hover:text-rose-600"
              }`}
            >
              Wishlist ({wishlist.length})
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
};

export default Header;
