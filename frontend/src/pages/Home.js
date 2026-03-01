import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useAI } from '../context/AIContext';
import FeaturedProducts from '../components/home/FeaturedProducts';
import AIStudioShowcase from '../components/home/AIStudioShowcase';
import StatsSection from '../components/home/StatsSection';
import Testimonials from '../components/home/Testimonials';
import ServicesSection from '../components/home/ServicesSection';

const Home = () => {
  const { aiState, getAIRecommendations } = useAI();
  const [recommendations, setRecommendations] = useState([]);

  useEffect(() => {
    // Fetch AI recommendations on load
    const fetchRecommendations = async () => {
      const recs = await getAIRecommendations('homepage');
      setRecommendations(recs);
    };
    fetchRecommendations();
  }, []);

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-blue-900 via-purple-900 to-pink-900 text-white overflow-hidden">
        <div className="absolute inset-0 bg-black opacity-50"></div>
        <div className="container mx-auto px-4 py-24 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center max-w-4xl mx-auto"
          >
            <h1 className="text-5xl md:text-7xl font-bold mb-6">
              Welcome to <span className="text-cyan-400">Apex Digital Studio</span>
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-gray-200">
              Where synthetic intelligence meets creative excellence. 100% faster, better, and more affordable than traditional studios.
            </p>
            <div className="flex flex-col md:flex-row gap-4 justify-center">
              <Link
                to="/ai-design-studio"
                className="bg-cyan-500 hover:bg-cyan-600 text-white font-bold py-3 px-8 rounded-full text-lg transition-all duration-300 transform hover:scale-105"
              >
                🚀 Launch AI Studio
              </Link>
              <Link
                to="/products"
                className="bg-transparent border-2 border-white hover:bg-white hover:text-purple-900 text-white font-bold py-3 px-8 rounded-full text-lg transition-all duration-300"
              >
                Browse Designs
              </Link>
            </div>
          </motion.div>
        </div>
        
        {/* Animated Background Elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full bg-cyan-500 opacity-20"
              style={{
                width: Math.random() * 100 + 50,
                height: Math.random() * 100 + 50,
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
                animation: `float ${Math.random() * 10 + 10}s infinite ease-in-out`
              }}
            />
          ))}
        </div>
      </section>

      {/* AI Stats Section */}
      <StatsSection />

      {/* AI Studio Showcase */}
      <AIStudioShowcase />

      {/* Featured Products */}
      <FeaturedProducts />

      {/* Services Section */}
      <ServicesSection />

      {/* AI Recommendations */}
      {recommendations.length > 0 && (
        <section className="py-16 bg-gradient-to-r from-blue-50 to-cyan-50">
          <div className="container mx-auto px-4">
            <h2 className="text-4xl font-bold text-center mb-12">
              <span className="bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">
                AI-Personalized For You
              </span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {recommendations.map((rec, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white rounded-2xl shadow-xl p-6 border border-gray-200"
                >
                  <div className="flex items-center mb-4">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                      <span className="text-blue-600 text-xl">🤖</span>
                    </div>
                    <h3 className="text-xl font-bold">{rec.title}</h3>
                  </div>
                  <p className="text-gray-600 mb-4">{rec.description}</p>
                  <Link
                    to={rec.link}
                    className="text-blue-600 font-semibold hover:text-blue-800 flex items-center"
                  >
                    Explore Now
                    <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Testimonials */}
      <Testimonials />

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-purple-900 to-blue-900 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Ready to Transform Your Digital Presence?
          </h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto text-gray-200">
            Join thousands of satisfied clients who've experienced the power of AI-driven design.
          </p>
          <div className="flex flex-col md:flex-row gap-4 justify-center items-center">
            <Link
              to="/register"
              className="bg-white text-purple-900 hover:bg-gray-100 font-bold py-4 px-10 rounded-full text-lg transition-all duration-300 transform hover:scale-105"
            >
              Start Free Trial
            </Link>
            <Link
              to="/ai-design-studio"
              className="border-2 border-white hover:bg-white hover:text-purple-900 font-bold py-4 px-10 rounded-full text-lg transition-all duration-300"
            >
              Try AI Studio Demo
            </Link>
          </div>
          <p className="mt-6 text-gray-300">
            No credit card required • 14-day free trial • Cancel anytime
          </p>
        </div>
      </section>
    </div>
  );
};

export default Home;
