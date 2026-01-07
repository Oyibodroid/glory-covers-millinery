import React, { useState, useRef, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { useCart } from "../../context/CartContext";
import { useWishlist } from "../../context/WishlistContext";
import { ShoppingCart, Search, Menu, X, Heart, User, ChevronDown } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

const Header = () => {
  const location = useLocation();
  const { cartCount } = useCart();
  const { wishlist } = useWishlist();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const { user, logout, userProfile } = useAuth();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const isActive = (path) => location.pathname === path;

  const handleLogout = async () => {
    await logout();
    setIsDropdownOpen(false);
  };

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
            <Link to="/" className="text-2xl font-serif flex items-center space-x-2">
              <img className="w-10" src="glory-covers-logo.png" alt="Glory Covers Logo" /> 
              <div>Glory Covers</div>
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
            
            {/* User/Auth buttons - Updated */}
            {user ? (
              <div className="relative" ref={dropdownRef}>
                <button 
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  onMouseEnter={() => setIsDropdownOpen(true)}
                  className="hover:text-rose-600 transition flex items-center focus:outline-none"
                >
                  <div className="relative">
                    <User size={20} className="mr-1" />
                  </div>
                  <span className="hidden md:inline text-sm mr-1">
                    {userProfile?.firstName || user.email?.split('@')[0] || "Account"}
                  </span>
                  <ChevronDown 
                    size={16} 
                    className={`transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`}
                  />
                </button>
                
                {/* Dropdown Menu */}
                <div 
                  className={`absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 border border-gray-100 transition-all duration-200 ${
                    isDropdownOpen 
                      ? "opacity-100 visible translate-y-0" 
                      : "opacity-0 invisible -translate-y-2"
                  }`}
                  onMouseLeave={() => setIsDropdownOpen(false)}
                >
                  {/* User Info Header */}
                  <div className="px-4 py-2 border-b border-gray-100">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {userProfile?.firstName && userProfile?.lastName
                        ? `${userProfile.firstName} ${userProfile.lastName}`
                        : user.displayName || user.email?.split('@')[0]}
                    </p>
                    <p className="text-xs text-gray-500 truncate">{user.email}</p>
                  </div>
                  
                  <Link 
                    to="/profile" 
                    onClick={() => {
                      setIsDropdownOpen(false);
                      setMobileMenuOpen(false);
                    }}
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-rose-600"
                  >
                    My Profile
                  </Link>
                  <Link 
                    to="/orders" 
                    onClick={() => {
                      setIsDropdownOpen(false);
                      setMobileMenuOpen(false);
                    }}
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-rose-600"
                  >
                    My Orders
                  </Link>
                  <Link 
                    to="/wishlist" 
                    onClick={() => {
                      setIsDropdownOpen(false);
                      setMobileMenuOpen(false);
                    }}
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-rose-600"
                  >
                    My Wishlist
                  </Link>
                  
                  <div className="border-t border-gray-100 my-1"></div>
                  
                  <button
                    onClick={handleLogout}
                    className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-50"
                  >
                    Logout
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Link
                  to="/login"
                  className="text-sm text-gray-700 hover:text-rose-600 transition"
                >
                  Login
                </Link>
                <span className="text-gray-300">|</span>
                <Link
                  to="/signup"
                  className="text-sm bg-rose-600 text-white px-3 py-1 rounded hover:bg-rose-700 transition"
                >
                  Sign Up
                </Link>
              </div>
            )}
            
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
            {user ? (
              <>
                <Link
                  to="/profile"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block py-2 ${
                    isActive("/profile")
                      ? "text-rose-600 font-medium"
                      : "hover:text-rose-600"
                  }`}
                >
                  My Profile
                </Link>
                <Link
                  to="/orders"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block py-2 ${
                    isActive("/orders")
                      ? "text-rose-600 font-medium"
                      : "hover:text-rose-600"
                  }`}
                >
                  My Orders
                </Link>
                <button
                  onClick={() => {
                    logout();
                    setMobileMenuOpen(false);
                  }}
                  className="block w-full text-left py-2 text-red-600 hover:text-red-700"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block py-2 ${
                    isActive("/login")
                      ? "text-rose-600 font-medium"
                      : "hover:text-rose-600"
                  }`}
                >
                  Login
                </Link>
                <Link
                  to="/signup"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block py-2 ${
                    isActive("/signup")
                      ? "text-rose-600 font-medium"
                      : "hover:text-rose-600"
                  }`}
                >
                  Sign Up
                </Link>
              </>
            )}
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