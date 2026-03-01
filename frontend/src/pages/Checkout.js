import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { clearCart } from '../redux/slices/cartSlice';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-hot-toast';

const Checkout = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useAuth();
  const cart = useSelector((state) => state.cart);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('stripe');
  const [formData, setFormData] = useState({
    email: user?.email || '',
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    phone: '',
    street: '',
    city: '',
    state: '',
    country: 'South Africa',
    postalCode: '',
    sameAsShipping: true
  });

  const paymentMethods = [
    { id: 'stripe', name: 'Credit/Debit Card', icon: '💳', description: 'Visa, Mastercard, Amex' },
    { id: 'paypal', name: 'PayPal', icon: '🔗', description: 'Pay with PayPal account' },
    { id: 'payfast', name: 'PayFast', icon: '🇿🇦', description: 'South African payments' },
    { id: 'payshap', name: 'PayShap', icon: '⚡', description: 'Instant EFT in South Africa' },
    { id: 'direct-eft', name: 'Direct EFT', icon: '🏦', description: 'Bank transfer' }
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleNextStep = () => {
    if (step === 1 && (!formData.firstName || !formData.email || !formData.phone)) {
      toast.error('Please fill in all required fields');
      return;
    }
    
    if (step === 2 && (!formData.street || !formData.city || !formData.postalCode)) {
      toast.error('Please fill in all address fields');
      return;
    }
    
    setStep(step + 1);
  };

  const handlePreviousStep = () => {
    setStep(step - 1);
  };

  const handleSubmitOrder = async () => {
    setLoading(true);
    
    try {
      // Prepare order data
      const orderData = {
        items: cart.items.map(item => ({
          product: item.id,
          quantity: item.quantity,
          designSpecs: item.designSpecs || {},
          aiCustomizations: item.aiCustomizations || []
        })),
        shippingAddress: {
          street: formData.street,
          city: formData.city,
          state: formData.state,
          country: formData.country,
          postalCode: formData.postalCode
        },
        billingAddress: formData.sameAsShipping ? undefined : {
          street: formData.billingStreet,
          city: formData.billingCity,
          state: formData.billingState,
          country: formData.billingCountry,
          postalCode: formData.billingPostalCode
        },
        paymentMethod,
        notes: ''
      };

      // Create order
      const response = await axios.post('/api/orders', orderData);
      const order = response.data.data;

      // Process payment based on method
      if (paymentMethod === 'stripe') {
        // Redirect to Stripe payment
        const paymentResponse = await axios.post('/api/payments/create-intent', {
          amount: cart.totalAmount * 1.15, // Include tax
          orderId: order.orderId
        });
        
        // This would redirect to Stripe Checkout
        // For now, just show success
        toast.success('Order placed successfully!');
        
      } else if (paymentMethod === 'payfast') {
        // Redirect to PayFast
        const paymentResponse = await axios.post('/api/payments/payfast/create', {
          amount: cart.totalAmount * 1.15,
          orderId: order.orderId
        });
        
        window.location.href = paymentResponse.data.paymentUrl;
        return;
      } else {
        // Other payment methods
        toast.success('Order placed successfully! Payment instructions sent to your email.');
      }

      // Clear cart
      dispatch(clearCart());
      
      // Navigate to success page
      navigate(`/order-confirmation/${order._id}`);
      
    } catch (error) {
      console.error('Checkout error:', error);
      toast.error(error.response?.data?.message || 'Failed to place order');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 py-12">
      <div className="container mx-auto px-4">
        {/* Progress Steps */}
        <div className="max-w-4xl mx-auto mb-12">
          <div className="flex items-center justify-between">
            {['Contact', 'Address', 'Payment', 'Confirm'].map((label, index) => (
              <div key={label} className="flex flex-col items-center">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 ${step > index + 1 ? 'bg-green-500 text-white' : step === index + 1 ? 'bg-blue-500 text-white' : 'bg-gray-300 text-gray-600'}`}>
                  {step > index + 1 ? '✓' : index + 1}
                </div>
                <span className={`text-sm font-medium ${step >= index + 1 ? 'text-blue-600' : 'text-gray-500'}`}>
                  {label}
                </span>
              </div>
            ))}
          </div>
          <div className="relative h-1 bg-gray-300 mt-6 -mb-6">
            <motion.div
              className="absolute top-0 left-0 h-1 bg-blue-500"
              initial={{ width: '0%' }}
              animate={{ width: `${((step - 1) / 3) * 100}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>

        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Form */}
            <div className="lg:col-span-2">
              <AnimatePresence mode="wait">
                {/* Step 1: Contact Information */}
                {step === 1 && (
                  <motion.div
                    key="step1"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="bg-white rounded-2xl shadow-xl p-6 mb-6"
                  >
                    <h2 className="text-2xl font-bold mb-6">Contact Information</h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          First Name *
                        </label>
                        <input
                          type="text"
                          name="firstName"
                          value={formData.firstName}
                          onChange={handleInputChange}
                          className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Last Name *
                        </label>
                        <input
                          type="text"
                          name="lastName"
                          value={formData.lastName}
                          onChange={handleInputChange}
                          className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required
                        />
                      </div>
                      
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Email Address *
                        </label>
                        <input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required
                        />
                      </div>
                      
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Phone Number *
                        </label>
                        <input
                          type="tel"
                          name="phone"
                          value={formData.phone}
                          onChange={handleInputChange}
                          className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required
                        />
                      </div>
                    </div>
                    
                    <button
                      onClick={handleNextStep}
                      className="w-full bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-bold py-3 rounded-xl hover:opacity-90 transition-opacity"
                    >
                      Continue to Shipping
                    </button>
                  </motion.div>
                )}

                {/* Step 2: Shipping Address */}
                {step === 2 && (
                  <motion.div
                    key="step2"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="bg-white rounded-2xl shadow-xl p-6 mb-6"
                  >
                    <h2 className="text-2xl font-bold mb-6">Shipping Address</h2>
                    
                    <div className="space-y-4 mb-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Street Address *
                        </label>
                        <input
                          type="text"
                          name="street"
                          value={formData.street}
                          onChange={handleInputChange}
                          className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required
                        />
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            City *
                          </label>
                          <input
                            type="text"
                            name="city"
                            value={formData.city}
                            onChange={handleInputChange}
                            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            State/Province
                          </label>
                          <input
                            type="text"
                            name="state"
                            value={formData.state}
                            onChange={handleInputChange}
                            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Country *
                          </label>
                          <select
                            name="country"
                            value={formData.country}
                            onChange={handleInputChange}
                            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="South Africa">South Africa</option>
                            <option value="United States">United States</option>
                            <option value="United Kingdom">United Kingdom</option>
                            <option value="Australia">Australia</option>
                            <option value="Germany">Germany</option>
                          </select>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Postal Code *
                          </label>
                          <input
                            type="text"
                            name="postalCode"
                            value={formData.postalCode}
                            onChange={handleInputChange}
                            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                          />
                        </div>
                      </div>
                      
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="sameAsShipping"
                          checked={formData.sameAsShipping}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            sameAsShipping: e.target.checked
                          }))}
                          className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                        />
                        <label htmlFor="sameAsShipping" className="ml-2 text-sm text-gray-700">
                          Billing address same as shipping address
                        </label>
                      </div>
                    </div>
                    
                    <div className="flex gap-4">
                      <button
                        onClick={handlePreviousStep}
                        className="flex-1 border border-gray-300 text-gray-700 font-medium py-3 rounded-xl hover:bg-gray-50 transition-colors"
                      >
                        Back
                      </button>
                      <button
                        onClick={handleNextStep}
                        className="flex-1 bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-bold py-3 rounded-xl hover:opacity-90 transition-opacity"
                      >
                        Continue to Payment
                      </button>
                    </div>
                  </motion.div>
                )}

                {/* Step 3: Payment Method */}
                {step === 3 && (
                  <motion.div
                    key="step3"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="bg-white rounded-2xl shadow-xl p-6 mb-6"
                  >
                    <h2 className="text-2xl font-bold mb-6">Payment Method</h2>
                    
                    <div className="space-y-4 mb-6">
                      {paymentMethods.map((method) => (
                        <div
                          key={method.id}
                          onClick={() => setPaymentMethod(method.id)}
                          className={`border rounded-xl p-4 cursor-pointer transition-all ${paymentMethod === method.id ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-300'}`}
                        >
                          <div className="flex items-center">
                            <div className={`w-6 h-6 rounded-full border flex items-center justify-center mr-3 ${paymentMethod === method.id ? 'border-blue-500 bg-blue-500' : 'border-gray-400'}`}>
                              {paymentMethod === method.id && (
                                <div className="w-2 h-2 rounded-full bg-white"></div>
                              )}
                            </div>
                            <div>
                              <div className="flex items-center">
                                <span className="text-xl mr-2">{method.icon}</span>
                                <h3 className="font-semibold">{method.name}</h3>
                              </div>
                              <p className="text-sm text-gray-600 mt-1">{method.description}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    {/* Payment Form based on selection */}
                    {paymentMethod === 'stripe' && (
                      <div className="mb-6 p-4 border border-gray-200 rounded-xl">
                        <h3 className="font-semibold mb-4">Card Details</h3>
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Card Number
                            </label>
                            <input
                              type="text"
                              placeholder="1234 5678 9012 3456"
                              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Expiry Date
                              </label>
                              <input
                                type="text"
                                placeholder="MM/YY"
                                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                            </div>
                            
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                CVC
                              </label>
                              <input
                                type="text"
                                placeholder="123"
                                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    <div className="flex gap-4">
                      <button
                        onClick={handlePreviousStep}
                        className="flex-1 border border-gray-300 text-gray-700 font-medium py-3 rounded-xl hover:bg-gray-50 transition-colors"
                      >
                        Back
                      </button>
                      <button
                        onClick={handleNextStep}
                        className="flex-1 bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-bold py-3 rounded-xl hover:opacity-90 transition-opacity"
                      >
                        Review Order
                      </button>
                    </div>
                  </motion.div>
                )}

                {/* Step 4: Order Review */}
                {step === 4 && (
                  <motion.div
                    key="step4"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="bg-white rounded-2xl shadow-xl p-6 mb-6"
                  >
                    <h2 className="text-2xl font-bold mb-6">Review Your Order</h2>
                    
                    <div className="space-y-6">
                      {/* Order Summary */}
                      <div>
                        <h3 className="font-semibold mb-4">Order Items</h3>
                        <div className="space-y-3">
                          {cart.items.map((item) => (
                            <div key={item.id} className="flex items-center border-b pb-3">
                              <div className="w-16 h-16 rounded-lg overflow-hidden mr-4">
                                <img
                                  src={item.images?.[0] || 'https://via.placeholder.com/300'}
                                  alt={item.name}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              <div className="flex-1">
                                <h4 className="font-medium">{item.name}</h4>
                                <p className="text-sm text-gray-600">{item.category}</p>
                                {item.aiGenerated && (
                                  <span className="inline-block bg-gradient-to-r from-green-400 to-blue-500 text-white text-xs px-2 py-1 rounded-full mt-1">
                                    🤖 AI Generated
                                  </span>
                                )}
                              </div>
                              <div className="text-right">
                                <p className="font-bold">
                                  R {(item.discountPrice || item.price) * item.quantity}
                                </p>
                                <p className="text-sm text-gray-600">
                                  {item.quantity} × R {item.discountPrice || item.price}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      {/* Shipping Address */}
                      <div>
                        <h3 className="font-semibold mb-2">Shipping to:</h3>
                        <p className="text-gray-700">
                          {formData.firstName} {formData.lastName}<br />
                          {formData.street}<br />
                          {formData.city}, {formData.state} {formData.postalCode}<br />
                          {formData.country}<br />
                          {formData.phone}
                        </p>
                      </div>
                      
                      {/* Payment Method */}
                      <div>
                        <h3 className="font-semibold mb-2">Payment Method:</h3>
                        <p className="text-gray-700">
                          {paymentMethods.find(m => m.id === paymentMethod)?.name}
                        </p>
                      </div>
                      
                      {/* Terms Agreement */}
                      <div className="flex items-start">
                        <input
                          type="checkbox"
                          id="terms"
                          className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 mt-1"
                          required
                        />
                        <label htmlFor="terms" className="ml-2 text-sm text-gray-700">
                          I agree to the Terms of Service and Privacy Policy. I understand that 
                          digital designs are non-refundable once the design process has begun.
                        </label>
                      </div>
                    </div>
                    
                    <div className="flex gap-4 mt-8">
                      <button
                        onClick={handlePreviousStep}
                        className="flex-1 border border-gray-300 text-gray-700 font-medium py-3 rounded-xl hover:bg-gray-50 transition-colors"
                      >
                        Back
                      </button>
                      <button
                        onClick={handleSubmitOrder}
                        disabled={loading}
                        className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold py-3 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {loading ? (
                          <div className="flex items-center justify-center">
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                            Processing...
                          </div>
                        ) : (
                          'Place Order & Pay'
                        )}
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Right Column - Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl shadow-xl p-6 sticky top-6">
                <h2 className="text-2xl font-bold mb-6">Order Summary</h2>
                
                <div className="space-y-4 mb-6">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="font-semibold">R {cart.totalAmount.toFixed(2)}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-600">Shipping</span>
                    <span className="font-semibold text-green-600">FREE</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tax (15%)</span>
                    <span className="font-semibold">R {(cart.totalAmount * 0.15).toFixed(2)}</span>
                  </div>
                  
                  {cart.discount && (
                    <div className="flex justify-between text-green-600">
                      <span>Discount ({cart.discount.code})</span>
                      <span className="font-semibold">-R {cart.discount.amount}</span>
                    </div>
                  )}
                  
                  <div className="border-t border-gray-300 pt-4">
                    <div className="flex justify-between text-lg font-bold">
                      <span>Total</span>
                      <span>
                        R {((cart.totalAmount * 1.15) - (cart.discount?.amount || 0)).toFixed(2)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">Including VAT</p>
                  </div>
                </div>
                
                {/* Security Badges */}
                <div className="border-t border-gray-200 pt-6">
                  <div className="grid grid-cols-3 gap-2 mb-4">
                    <div className="bg-gray-100 rounded-lg p-2 text-center">
                      <div className="text-lg">🔒</div>
                      <div className="text-xs font-medium">Secure</div>
                    </div>
                    <div className="bg-gray-100 rounded-lg p-2 text-center">
                      <div className="text-lg">🛡️</div>
                      <div className="text-xs font-medium">Protected</div>
                    </div>
                    <div className="bg-gray-100 rounded-lg p-2 text-center">
                      <div className="text-lg">✓</div>
                      <div className="text-xs font-medium">Guaranteed</div>
                    </div>
                  </div>
                  
                  <div className="text-sm text-gray-600 space-y-2">
                    <p className="flex items-center">
                      <span className="mr-2">✓</span>
                      30-day money-back guarantee
                    </p>
                    <p className="flex items-center">
                      <span className="mr-2">✓</span>
                      Professional quality designs
                    </p>
                    <p className="flex items-center">
                      <span className="mr-2">✓</span>
                      Unlimited revisions included
                    </p>
                    <p className="flex items-center">
                      <span className="mr-2">✓</span>
                      AI-powered design assistance
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Need Help */}
              <div className="mt-6 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl p-6 text-white">
                <h3 className="font-bold mb-2">Need Help?</h3>
                <p className="text-sm opacity-90 mb-4">
                  Our AI support agent is available 24/7 to assist you.
                </p>
                <button className="w-full bg-white text-blue-600 font-bold py-2 rounded-lg hover:bg-gray-100 transition-colors">
                  Chat with AI Support
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
