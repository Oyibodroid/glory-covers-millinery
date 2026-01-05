import React from "react";
import { Link } from "react-router-dom";
import { ChevronRight, Truck, Shield, RefreshCw } from "lucide-react";
import { products } from "../../data/products";
import ProductCard from "../../components/ProductCard/ProductCard";

const HomePage = () => {
  const featuredProducts = products.filter((p) => p.featured);

  return (
    <>
      {/* Hero Section */}
      <section className="relative h-[70vh] bg-gradient-to-r from-rose-50 to-pink-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center">
          <div className="max-w-xl">
            <h2 className="text-5xl sm:text-6xl font-serif text-gray-900 mb-4">
              Handcrafted Elegance
            </h2>
            <p className="text-xl text-gray-600 mb-8">
              Discover our exquisite collection of artisan millinery, where
              timeless elegance meets modern sophistication.
            </p>
            <Link
              to="/shop"
              className="bg-rose-600 text-white px-8 py-3 rounded-md hover:bg-rose-700 transition inline-flex items-center"
            >
              Shop Collection
              <ChevronRight size={20} className="ml-2" />
            </Link>
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-serif text-gray-900 mb-4">
              Featured Collection
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Handpicked pieces that embody the essence of luxury and
              craftsmanship
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {featuredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>

          <div className="text-center mt-12">
            <Link
              to="/shop"
              className="border-2 border-rose-600 text-rose-600 px-8 py-3 rounded-md hover:bg-rose-600 hover:text-white transition"
            >
              View All Products
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <Truck className="mx-auto text-rose-600 mb-4" size={40} />
              <h3 className="font-semibold text-lg mb-2">Free Shipping</h3>
              <p className="text-gray-600 text-sm">On orders over ₦50,000</p>
            </div>
            <div className="text-center">
              <Shield className="mx-auto text-rose-600 mb-4" size={40} />
              <h3 className="font-semibold text-lg mb-2">Secure Payment</h3>
              <p className="text-gray-600 text-sm">100% secure transactions</p>
            </div>
            <div className="text-center">
              <RefreshCw className="mx-auto text-rose-600 mb-4" size={40} />
              <h3 className="font-semibold text-lg mb-2">Easy Returns</h3>
              <p className="text-gray-600 text-sm">14-day return policy</p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default HomePage;
