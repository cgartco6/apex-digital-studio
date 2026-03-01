import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import useAddictionEngine from '../hooks/useAddictionEngine';
import { Check, Clock, Users, TrendingUp, Award, Star, Zap, Shield } from 'lucide-react';

const CourseLanding = () => {
  const { rewardAction, createScarcityTimer, triggerFOMO } = useAddictionEngine();
  const [timer, setTimer] = useState(null);
  const [spotsLeft, setSpotsLeft] = useState(42);
  const [enrolledCount, setEnrolledCount] = useState(1237);
  const [showPayment, setShowPayment] = useState(false);
  const [autoEnrolling, setAutoEnrolling] = useState([]);

  useEffect(() => {
    // Create scarcity timer (48 hours)
    const scarcityTimer = createScarcityTimer(48 * 60 * 60); // 48 hours
    setTimer(scarcityTimer.endTime);
    
    // Simulate people enrolling
    const enrollInterval = setInterval(() => {
      if (spotsLeft > 0) {
        setEnrolledCount(prev => prev + Math.floor(Math.random() * 3) + 1);
        setSpotsLeft(prev => Math.max(0, prev - 1));
        
        // Show auto-enrolling notifications
        setAutoEnrolling(prev => {
          const names = ['Sarah', 'Mike', 'David', 'Lisa', 'John', 'Emma'];
          const name = names[Math.floor(Math.random() * names.length)];
          const newEntry = { id: Date.now(), name, time: 'just now' };
          return [newEntry, ...prev.slice(0, 4)];
        });
      }
    }, 5000); // Every 5 seconds
    
    // Trigger FOMO every 30 seconds
    const fomoInterval = setInterval(() => {
      triggerFOMO('limited_offer');
    }, 30000);
    
    return () => {
      clearInterval(enrollInterval);
      clearInterval(fomoInterval);
    };
  }, [createScarcityTimer, triggerFOMO]);

  const formatTimer = () => {
    if (!timer) return null;
    
    const now = Date.now();
    const diff = timer - now;
    
    if (diff <= 0) return null;
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleEnroll = () => {
    rewardAction('first_purchase');
    setShowPayment(true);
  };

  const modules = [
    {
      title: "🚀 Module 1: The AI Design Revolution",
      lessons: [
        "Why 90% of designers will be replaced by AI in 2024",
        "How AI design tools actually work (no tech skills needed)",
        "Setting up your AI design workstation in 10 minutes"
      ],
      bonus: "AI Tool Comparison Sheet (R500 value)"
    },
    {
      title: "🎨 Module 2: Logo & Brand Identity AI",
      lessons: [
        "Generating 10 professional logo options in 60 seconds",
        "Creating complete brand identities (colors, fonts, guidelines)",
        "Client-winning presentation techniques that close deals"
      ],
      bonus: "50 Premium Logo Templates (R1,000 value)"
    },
    {
      title: "🌐 Module 3: Web & UI Design at Scale",
      lessons: [
        "AI website design in 5 minutes (no coding)",
        "Converting Figma to code with AI (save 20+ hours)",
        "Creating 100+ social media posts in batch (1 hour)"
      ],
      bonus: "100 Website Template Pack (R2,000 value)"
    },
    {
      title: "💰 Module 4: Client Acquisition System",
      lessons: [
        "Finding high-paying clients (R5k-R20k projects)",
        "The 3-email closing system (85% conversion rate)",
        "Building a waitlist of 100+ paying clients"
      ],
      bonus: "Client Proposal Templates (R800 value)"
    },
    {
      title: "📈 Module 5: Scaling to R50k/month",
      lessons: [
        "Building a 6-figure design agency with AI",
        "Hiring and managing AI designers (2x output)",
        "Automating delivery and revisions (save 30 hours/week)"
      ],
      bonus: "Agency Operations Playbook (R1,500 value)"
    }
  ];

  const bonuses = [
    "🎁 BONUS 1: AI Design Template Library (R2,000 value)",
    "🎁 BONUS 2: Client Acquisition System (R1,500 value)",
    "🎁 BONUS 3: 1-on-1 AI Coaching Session (R1,000 value)",
    "🎁 BONUS 4: Private Mastermind Community (Priceless)",
    "🎁 BONUS 5: 500 AI Credits for Apex Digital Studio (R500 value)"
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black text-white">
      {/* Scarcity Banner */}
      <div className="bg-gradient-to-r from-red-600 to-orange-600 py-3 px-4 text-center">
        <div className="container mx-auto flex flex-col md:flex-row items-center justify-center space-y-2 md:space-y-0 md:space-x-6">
          <div className="flex items-center">
            <Clock className="w-5 h-5 mr-2" />
            <span className="font-bold">OFFER ENDS IN:</span>
            <span className="ml-2 text-2xl font-bold tracking-wider">{formatTimer()}</span>
          </div>
          <div className="flex items-center">
            <Users className="w-5 h-5 mr-2" />
            <span className="font-bold">{spotsLeft} SPOTS LEFT at R200</span>
          </div>
          <div className="flex items-center">
            <TrendingUp className="w-5 h-5 mr-2" />
            <span className="font-bold">{enrolledCount.toLocaleString()} ENROLLED IN 48H</span>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <div className="container mx-auto px-4 py-12">
        <div className="text-center max-w-4xl mx-auto mb-12">
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl md:text-7xl font-bold mb-6"
          >
            <span className="bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">
              AI Design Mastery
            </span>
          </motion.h1>
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            From Zero to <span className="text-green-400">R50k/month</span> in 2024
          </h2>
          <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto">
            Join 1,237+ designers who replaced their income in 30 days using AI.
            The traditional design industry is ending. <span className="text-yellow-300 font-bold">Will you adapt or get left behind?</span>
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Left Column - Course Details */}
          <div>
            {/* Results Proof */}
            <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-8 mb-8 border border-gray-700">
              <h3 className="text-2xl font-bold mb-6 flex items-center">
                <TrendingUp className="w-6 h-6 mr-3 text-green-400" />
                REAL STUDENT RESULTS (LAST 30 DAYS)
              </h3>
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-gray-800/50 p-4 rounded-xl text-center">
                  <div className="text-3xl font-bold text-green-400">R87k</div>
                  <div className="text-sm text-gray-400">Sarah J. - Month 1</div>
                </div>
                <div className="bg-gray-800/50 p-4 rounded-xl text-center">
                  <div className="text-3xl font-bold text-green-400">R142k</div>
                  <div className="text-sm text-gray-400">Mike T. - Month 2</div>
                </div>
                <div className="bg-gray-800/50 p-4 rounded-xl text-center">
                  <div className="text-3xl font-bold text-green-400">R56k</div>
                  <div className="text-sm text-gray-400">Lisa M. - Month 1</div>
                </div>
                <div className="bg-gray-800/50 p-4 rounded-xl text-center">
                  <div className="text-3xl font-bold text-green-400">4.9★</div>
                  <div className="text-sm text-gray-400">842 Reviews</div>
                </div>
              </div>
            </div>

            {/* Modules */}
            <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-8 mb-8 border border-gray-700">
              <h3 className="text-2xl font-bold mb-6">🎓 WHAT YOU'LL MASTER</h3>
              <div className="space-y-6">
                {modules.map((module, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-gray-800/30 rounded-xl p-6 border border-gray-700"
                  >
                    <h4 className="text-xl font-bold mb-3">{module.title}</h4>
                    <ul className="space-y-2 mb-4">
                      {module.lessons.map((lesson, i) => (
                        <li key={i} className="flex items-start">
                          <Check className="w-5 h-5 text-green-400 mr-2 mt-1 flex-shrink-0" />
                          <span>{lesson}</span>
                        </li>
                      ))}
                    </ul>
                    <div className="bg-gradient-to-r from-blue-900/50 to-purple-900/50 p-3 rounded-lg">
                      <span className="font-bold text-cyan-300">BONUS:</span> {module.bonus}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Bonuses */}
            <div className="bg-gradient-to-br from-purple-900/30 to-pink-900/30 rounded-2xl p-8 border border-purple-700">
              <h3 className="text-2xl font-bold mb-6">🎁 FREE BONUSES (R5,800+ VALUE)</h3>
              <div className="space-y-4">
                {bonuses.map((bonus, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center bg-white/5 p-4 rounded-xl border border-white/10"
                  >
                    <div className="w-10 h-10 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full flex items-center justify-center mr-4">
                      <span className="text-xl">🎁</span>
                    </div>
                    <span className="font-medium">{bonus}</span>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column - Enrollment */}
          <div className="space-y-8">
            {/* Price Card */}
            <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-8 border border-gray-700 sticky top-8">
              <div className="text-center mb-8">
                <div className="flex items-center justify-center mb-4">
                  <Award className="w-8 h-8 text-yellow-400 mr-3" />
                  <span className="text-2xl font-bold">LIMITED TIME OFFER</span>
                </div>
                
                <div className="mb-6">
                  <div className="text-5xl font-bold">
                    R<span className="text-6xl">200</span>
                  </div>
                  <div className="text-gray-400 line-through text-2xl mt-2">R1,000</div>
                  <div className="text-green-400 font-bold text-lg mt-1">80% OFF + R5,800 in Bonuses</div>
                </div>
                
                <div className="bg-gradient-to-r from-red-900/50 to-orange-900/50 p-4 rounded-xl mb-6">
                  <div className="font-bold mb-2">⚠️ PRICE INCREASES IN:</div>
                  <div className="text-3xl font-bold tracking-wider">{formatTimer()}</div>
                  <div className="text-sm text-gray-300 mt-2">Then returns to R1,000</div>
                </div>
              </div>

              {/* Enrollment Button */}
              <button
                onClick={handleEnroll}
                className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold py-5 rounded-2xl text-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300 mb-6 relative overflow-hidden group"
              >
                <span className="relative z-10">🚀 ENROLL NOW - R200 (80% OFF)</span>
                <div className="absolute inset-0 bg-gradient-to-r from-green-600 to-emerald-700 transform translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
              </button>

              {/* Guarantee */}
              <div className="text-center">
                <div className="flex items-center justify-center mb-3">
                  <Shield className="w-6 h-6 text-green-400 mr-2" />
                  <span className="font-bold">30-DAY MONEY BACK GUARANTEE</span>
                </div>
                <p className="text-gray-400 text-sm">
                  If you don't make at least R5,000 in your first month, get 100% refund.
                  No questions asked.
                </p>
              </div>

              {/* Social Proof */}
              <div className="mt-8 pt-8 border-t border-gray-700">
                <h4 className="font-bold mb-4 flex items-center">
                  <Users className="w-5 h-5 mr-2" />
                  ENROLLING RIGHT NOW:
                </h4>
                <div className="space-y-3">
                  {autoEnrolling.map((entry) => (
                    <div key={entry.id} className="flex items-center justify-between bg-gray-800/30 p-3 rounded-lg">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center mr-3">
                          <span className="font-bold">{entry.name.charAt(0)}</span>
                        </div>
                        <span>{entry.name} enrolled</span>
                      </div>
                      <span className="text-gray-400 text-sm">{entry.time}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Testimonials */}
            <div className="bg-gradient-to-br from-blue-900/30 to-cyan-900/30 rounded-2xl p-8 border border-blue-700">
              <h3 className="text-2xl font-bold mb-6 flex items-center">
                <Star className="w-6 h-6 mr-3 text-yellow-400" />
                4.9★ FROM 842 STUDENTS
              </h3>
              <div className="space-y-4">
                <div className="bg-white/5 p-4 rounded-xl">
                  <div className="flex items-center mb-2">
                    <div className="text-yellow-400">★★★★★</div>
                    <span className="ml-2 font-bold">Sarah J.</span>
                    <span className="ml-auto text-sm text-gray-400">2 days ago</span>
                  </div>
                  <p>"Made R87k in my first month! This course is insane. The AI tools alone are worth R5,000."</p>
                </div>
                <div className="bg-white/5 p-4 rounded-xl">
                  <div className="flex items-center mb-2">
                    <div className="text-yellow-400">★★★★★</div>
                    <span className="ml-2 font-bold">Mike T.</span>
                    <span className="ml-auto text-sm text-gray-400">1 day ago</span>
                  </div>
                  <p>"Replaced my R45k/month job in 2 weeks. Now making R142k/month with AI design agency."</p>
                </div>
                <div className="bg-white/5 p-4 rounded-xl">
                  <div className="flex items-center mb-2">
                    <div className="text-yellow-400">★★★★★</div>
                    <span className="ml-2 font-bold">David K.</span>
                    <span className="ml-auto text-sm text-gray-400">5 hours ago</span>
                  </div>
                  <p>"From unemployed to R56k/month. The client acquisition module is pure gold."</p>
                </div>
              </div>
            </div>

            {/* Comparison */}
            <div className="bg-gradient-to-br from-red-900/30 to-orange-900/30 rounded-2xl p-8 border border-red-700">
              <h3 className="text-2xl font-bold mb-6">⚡ WHY THIS IS 10X BETTER</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
                  <span className="font-medium">Traditional Design Course</span>
                  <span className="text-red-400">R5,000+</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
                  <span className="font-medium">Freelance Mentorship</span>
                  <span className="text-red-400">R10,000+</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-lg border border-green-500">
                  <span className="font-bold">THIS AI MASTERY COURSE</span>
                  <span className="text-green-400 font-bold">R200</span>
                </div>
                <div className="text-center text-lg font-bold mt-4">
                  💰 You Save: <span className="text-green-400">R4,800+</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Auto-scrolling counter */}
      <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-r from-purple-900 to-blue-900 py-3 px-4 z-40">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center">
            <Zap className="w-5 h-5 mr-2 text-yellow-400" />
            <span className="font-bold">{enrolledCount.toLocaleString()} ENROLLED</span>
          </div>
          <div className="flex items-center space-x-6">
            <span className="text-sm">{spotsLeft} spots left at R200</span>
            <button
              onClick={handleEnroll}
              className="bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold px-6 py-2 rounded-lg hover:shadow-lg"
            >
              CLAIM YOUR SPOT
            </button>
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      <AnimatePresence>
        {showPayment && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowPayment(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-8 max-w-md w-full border border-gray-700"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-2xl font-bold mb-6 text-center">Complete Enrollment</h3>
              
              <div className="mb-6 p-4 bg-gradient-to-r from-green-900/30 to-emerald-900/30 rounded-xl">
                <div className="text-center">
                  <div className="text-3xl font-bold">R200</div>
                  <div className="text-gray-400 line-through">R1,000</div>
                  <div className="text-green-400 font-bold">80% OFF</div>
                </div>
              </div>
              
              <div className="space-y-4">
                <input
                  type="email"
                  placeholder="Your email"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                
                <div className="grid grid-cols-2 gap-4">
                  <button className="bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-bold py-3 rounded-lg">
                    Pay with Card
                  </button>
                  <button className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white font-bold py-3 rounded-lg">
                    Pay with EFT
                  </button>
                </div>
                
                <div className="text-center text-sm text-gray-400">
                  <div className="flex items-center justify-center mb-2">
                    <Shield className="w-4 h-4 mr-2 text-green-400" />
                    30-day money back guarantee
                  </div>
                  <p>Secure payment • Instant access • Lifetime updates</p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CourseLanding;
