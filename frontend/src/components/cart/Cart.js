import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSelector, useDispatch } from 'react-redux';
import { Link } from 'react-router-dom';
import { removeFromCart, updateQuantity, clearCart } from '../../redux/slices/cartSlice';
import { useAI } from '../../context/AIContext';

const Cart = () => {
  const dispatch = useDispatch();
  const { cartItems, totalAmount, totalItems } = useSelector((state) => state.cart);
  const { getAIRecommendations } = useAI();
  const [recommendations, setRecommendations] = useState([]);
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  React.useEffect(() => {
    if (cartItems.length > 0) {
      fetchRecommendations();
    }
  }, [cartItems]);

  const fetchRecommendations = async () => {
    const categories = [...new Set(cartItems.map(item => item.category))];
    const recs = await getAIRecommendations(categories.join(','));
    setRecommendations(recs);
  };

  const handleRemoveItem = (id) => {
    dispatch(removeFromCart(id));
  };

  const handleUpdateQuantity = (id, quantity) => {
    if (quantity > 0) {
      dispatch(updateQuantity({ id, quantity }));
    }
  };

  const handleClearCart = () => {
    dispatch(clearCart());
  };

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-blue-50">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="w-32 h-32 mx-auto mb-6 flex items-center justify-center rounded-full bg-gradient-to-r from-blue-100 to-cyan-100">
            <span className="text-6xl">🛒</span>
          </div>
          <h2 className="text-3xl font-bold text-gray-800 mb-4">Your cart is empty</h2>
          <p className="text-gray-600 mb-8 max-w-md mx-auto">
            Add some amazing AI-generated designs to your cart and experience the future of digital creativity!
          </p>
          <Link
            to="/products"
            className="inline-block bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-bold py-3 px-8 rounded-full hover:shadow-lg transform hover:-translate-y-1 transition-all duration-300"
          >
            Browse Designs
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 py-12">
      <div className="container mx-auto px-4">
        <h1 className="text-4xl font-bold text-center mb-2 text-gray-900">
          Your Shopping Cart
        </h1>
        <p className="text-center text-gray-600 mb-8">
          {totalItems} {totalItems === 1 ? 'item' : 'items'} in your cart
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Cart Items</h2>
                <button
                  onClick={handleClearCart}
                  className="text-red-500 hover:text-red-700 font-medium flex items-center"
                >
                  <span className="mr-2">🗑️</span>
                  Clear Cart
                </button>
              </div>

              <AnimatePresence>
                {cartItems.map((item, index) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex flex-col md:flex-row items-center border-b border-gray-200 py-6 last:border-b-0"
                  >
                    <div className="w-24 h-24 md:w-32 md:h-32 rounded-lg overflow-hidden mb-4 md:mb-0 md:mr-6">
                      <img
                        src={item.images?.[0] || 'https://via.placeholder.com/300'}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    <div className="flex-1">
                      <div className="flex justify-between">
                        <div>
                          <h3 className="text-lg font-semibold">{item.name}</h3>
                          <p className="text-gray-600 text-sm mt-1">{item.category}</p>
                          {item.aiGenerated && (
                            <span className="inline-block bg-gradient-to-r from-green-400 to-blue-500 text-white text-xs px-2 py-1 rounded-full mt-2">
                              🤖 AI Generated
                            </span>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="text-xl font-bold">
                            R {item.discountPrice || item.price}
                          </p>
                          {item.discountPrice && (
                            <p className="text-gray-500 line-through text-sm">
                              R {item.price}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-between mt-4">
                        <div className="flex items-center space-x-4">
                          <button
                            onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                            className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center hover:bg-gray-300"
                          >
                            -
                          </button>
                          <span className="font-semibold">{item.quantity}</span>
                          <button
                            onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                            className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center hover:bg-gray-300"
                          >
                            +
                          </button>
                        </div>

                        <button
                          onClick={() => handleRemoveItem(item.id)}
                          className="text-red-500 hover:text-red-700 font-medium"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {/* AI Recommendations */}
            {recommendations.length > 0 && (
              <div className="bg-white rounded-2xl shadow-xl p-6">
                <h3 className="text-xl font-bold mb-6 flex items-center">
                  <span className="mr-2">🤖</span>
                  AI Recommendations for You
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {recommendations.slice(0, 4).map((rec) => (
                    <div
                      key={rec.id}
                      className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-center">
                        <img
                          src={rec.image}
                          alt={rec.name}
                          className="w-16 h-16 rounded-lg object-cover mr-4"
                        />
                        <div>
                          <h4 className="font-semibold">{rec.name}</h4>
                          <p className="text-sm text-gray-600">{rec.category}</p>
                          <p className="font-bold mt-1">R {rec.price}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-xl p-6 sticky top-6">
              <h2 className="text-2xl font-bold mb-6">Order Summary</h2>

              <div className="space-y-4 mb-6">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-semibold">R {totalAmount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Shipping</span>
                  <span className="font-semibold text-green-600">FREE</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Tax</span>
                  <span className="font-semibold">R {(totalAmount * 0.15).toFixed(2)}</span>
                </div>
                <div className="border-t border-gray-300 pt-4">
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total</span>
                    <span>R {(totalAmount * 1.15).toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Discount Code */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Discount Code
                </label>
                <div className="flex">
                  <input
                    type="text"
                    placeholder="Enter code"
                    className="flex-1 border border-gray-300 rounded-l-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button className="bg-gradient-to-r from-blue-600 to-cyan-500 text-white px-4 py-2 rounded-r-lg hover:opacity-90 transition-opacity">
                    Apply
                  </button>
                </div>
              </div>

              {/* Checkout Button */}
              <Link
                to="/checkout"
                onClick={() => setIsCheckingOut(true)}
                className="block w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold py-4 px-6 rounded-xl text-center hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 mb-4"
              >
                {isCheckingOut ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mr-3"></div>
                    Processing...
                  </div>
                ) : (
                  'Proceed to Checkout'
                )}
              </Link>

              {/* Payment Methods */}
              <div className="mb-6">
                <p className="text-sm text-gray-600 mb-3">We accept:</p>
                <div className="flex flex-wrap gap-2">
                  {['Stripe', 'PayPal', 'PayFast', 'PayShap', 'Visa', 'MasterCard'].map((method) => (
                    <span
                      key={method}
                      className="bg-gray-100 text-gray-700 text-xs px-3 py-1 rounded-full"
                    >
                      {method}
                    </span>
                  ))}
                </div>
              </div>

              {/* Security Info */}
              <div className="text-center text-sm text-gray-500">
                <div className="flex items-center justify-center mb-2">
                  <span className="mr-2">🔒</span>
                  <span>Secure encrypted payment</span>
                </div>
                <p>30-day money-back guarantee</p>
              </div>
            </div>

            {/* Continue Shopping */}
            <div className="mt-6 text-center">
              <Link
                to="/products"
                className="inline-block text-blue-600 hover:text-blue-800 font-medium"
              >
                ← Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;
