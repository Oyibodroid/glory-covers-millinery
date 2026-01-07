import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import ProductCard from "../../components/ProductCard/ProductCard";
import { productsService } from "../../services/productsService";

const ShopPage = () => {
  const [searchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const selectedCategory = searchParams.get("category") || "All";

  useEffect(() => {
    const loadProducts = async () => {
      setLoading(true);
      const result = await productsService.getProductsByCategory(selectedCategory);
      
      if (result.success) {
        setProducts(result.products);
      } else {
        setError(result.error);
      }
      setLoading(false);
    };
    
    loadProducts();
  }, [selectedCategory]);

  // Get categories (hardcoded for now, will fetch from Firestore later)
  const categories = [
    { id: 1, name: "All", value: "All" },
    { id: 2, name: "Fascinators", value: "Fascinators" },
    { id: 3, name: "Hats", value: "Hats" },
    { id: 4, name: "Headpieces", value: "Headpieces" },
    { id: 5, name: "Crowns", value: "Crowns" },
    { id: 6, name: "Headbands", value: "Headbands" },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading products...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 mb-4">Error: {error}</div>
          <button 
            onClick={() => window.location.reload()}
            className="bg-rose-600 text-white px-4 py-2 rounded"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white py-8 border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-serif text-gray-900 mb-4">
            Shop Collection
          </h1>
          <p className="text-gray-600">
            Explore our handcrafted millinery pieces
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filters */}
          <div className="lg:w-64 space-y-6">
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="font-semibold mb-4">Categories</h3>
              <div className="space-y-2">
                {categories.map((category) => (
                  <a
                    key={category.id}
                    href={`/shop?category=${category.value}`}
                    className={`block py-2 px-3 rounded transition ${
                      selectedCategory === category.value
                        ? "bg-rose-50 text-rose-600"
                        : "hover:bg-gray-50"
                    }`}
                  >
                    {category.name}
                  </a>
                ))}
              </div>
            </div>
          </div>

          {/* Products Grid */}
          <div className="flex-1">
            <div className="mb-6 flex justify-between items-center">
              <p className="text-gray-600">
                {products.length} product{products.length !== 1 ? 's' : ''}
              </p>
            </div>

            {products.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-gray-500 text-lg">
                  No products found in this category.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShopPage;