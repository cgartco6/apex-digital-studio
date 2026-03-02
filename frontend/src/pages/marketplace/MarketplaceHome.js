import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from 'axios';

const MarketplaceHome = () => {
  const [featuredListings, setFeaturedListings] = useState([]);
  const [categories, setCategories] = useState([]);
  const [trendingVendors, setTrendingVendors] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [listingsRes, vendorsRes] = await Promise.all([
        axios.get('/api/marketplace/listings/search?sort=-rating&limit=8'),
        axios.get('/api/marketplace/vendor/public/trending') // you'd need to implement this endpoint
      ]);
      setFeaturedListings(listingsRes.data.data);
      // setTrendingVendors(vendorsRes.data.data);
    } catch (error) {
      console.error('Failed to fetch marketplace data', error);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `/marketplace/search?q=${encodeURIComponent(searchQuery)}`;
    }
  };

  // Example categories - you might fetch from backend
  const categoriesList = [
    { name: 'Logo Templates', icon: '🎨', slug: 'logo-templates' },
    { name: 'Website Templates', icon: '🌐', slug: 'website-templates' },
    { name: 'Social Media Kits', icon: '📱', slug: 'social-media-templates' },
    { name: 'Icons & Graphics', icon: '✨', slug: 'icons' },
    { name: 'Courses', icon: '📚', slug: 'courses' },
    { name: '3D Models', icon: '🧊', slug: '3d-models' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Hero */}
      <section className="bg-gradient-to-r from-purple-600 to-pink-600 text-white py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-5xl font-bold mb-6">Marketplace</h1>
          <p className="text-xl mb-8">Discover thousands of premium design assets created by talented designers using AI</p>
          <div className="max-w-2xl mx-auto">
            <form onSubmit={handleSearch} className="flex">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search for templates, icons, courses..."
                className="flex-1 px-6 py-4 rounded-l-full text-gray-900 focus:outline-none focus:ring-4"
              />
              <button type="submit" className="bg-cyan-500 hover:bg-cyan-600 text-white px-8 py-4 rounded-r-full font-bold transition">
                Search
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Browse Categories</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            {categoriesList.map((cat) => (
              <Link
                key={cat.slug}
                to={`/marketplace/category/${cat.slug}`}
                className="bg-white rounded-2xl shadow-lg p-6 text-center hover:shadow-xl transition-shadow"
              >
                <div className="text-4xl mb-3">{cat.icon}</div>
                <h3 className="font-semibold">{cat.name}</h3>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Listings */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Featured Listings</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {featuredListings.map((listing) => (
              <motion.div
                key={listing._id}
                whileHover={{ scale: 1.05 }}
                className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-200"
              >
                <Link to={`/marketplace/listing/${listing._id}`}>
                  <div className="h-48 bg-gray-200">
                    {listing.previewImages && listing.previewImages[0] && (
                      <img src={listing.previewImages[0].url} alt={listing.title} className="w-full h-full object-cover" />
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-bold text-lg mb-2">{listing.title}</h3>
                    <p className="text-gray-600 text-sm mb-2">{listing.vendor?.storeName}</p>
                    <div className="flex items-center mb-3">
                      <span className="text-yellow-400">★</span>
                      <span className="ml-1">{listing.rating.toFixed(1)}</span>
                      <span className="text-gray-400 ml-2">({listing.reviews?.length || 0})</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        {listing.discountPrice ? (
                          <>
                            <span className="text-gray-400 line-through text-sm">R{listing.price}</span>
                            <span className="text-2xl font-bold ml-2 text-green-600">R{listing.discountPrice}</span>
                          </>
                        ) : (
                          <span className="text-2xl font-bold">R{listing.price}</span>
                        )}
                      </div>
                      <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition">
                        View
                      </button>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Become a Vendor CTA */}
      <section className="py-16 bg-gradient-to-r from-green-500 to-emerald-600 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-6">Sell Your Designs</h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto">Join our marketplace and reach thousands of customers. Set your own prices, earn commissions, and grow your business.</p>
          <Link
            to="/marketplace/become-vendor"
            className="bg-white text-green-600 font-bold py-4 px-10 rounded-full text-lg hover:bg-gray-100 transition"
          >
            Become a Vendor
          </Link>
        </div>
      </section>
    </div>
  );
};

export default MarketplaceHome;
