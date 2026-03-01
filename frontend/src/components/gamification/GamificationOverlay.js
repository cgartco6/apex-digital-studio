import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import useAddictionEngine from '../../hooks/useAddictionEngine';
import { Trophy, Zap, TrendingUp, Gift, Clock, Users } from 'lucide-react';

const GamificationOverlay = () => {
  const {
    streak,
    points,
    level,
    notifications,
    getProgressData,
    trackAddictiveAction,
    triggerSocialProof
  } = useAddictionEngine();

  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [scarcityTimer, setScarcityTimer] = useState(null);
  const [showProgress, setShowProgress] = useState(true);

  useEffect(() => {
    // Track page view
    const cleanup = trackAddictiveAction('page_view');
    
    // Trigger random social proof
    const socialProofInterval = setInterval(() => {
      if (Math.random() > 0.8) {
        triggerSocialProof();
      }
    }, 30000); // Every 30 seconds

    // Check for scarcity timer
    const timerEnd = localStorage.getItem('apex_scarcity_timer');
    if (timerEnd) {
      const endTime = parseInt(timerEnd);
      if (Date.now() < endTime) {
        setScarcityTimer(endTime);
      }
    }

    // Update unread count
    setUnreadCount(notifications.filter(n => !n.read).length);

    return () => {
      cleanup?.();
      clearInterval(socialProofInterval);
    };
  }, [notifications, trackAddictiveAction, triggerSocialProof]);

  const progressData = getProgressData();

  // Format timer
  const formatTimer = (endTime) => {
    const now = Date.now();
    const diff = endTime - now;
    
    if (diff <= 0) return null;
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <>
      {/* Floating Progress Bar */}
      {showProgress && (
        <motion.div
          initial={{ y: -100 }}
          animate={{ y: 0 }}
          className="fixed top-0 left-0 right-0 bg-gradient-to-r from-purple-600 to-pink-600 text-white z-50 shadow-lg"
        >
          <div className="container mx-auto px-4 py-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="flex items-center">
                  <Trophy className="w-5 h-5 mr-2" />
                  <span className="font-bold">Level {level}</span>
                </div>
                <div className="flex items-center">
                  <Zap className="w-5 h-5 mr-2" />
                  <span className="font-bold">{points} Points</span>
                </div>
                <div className="flex items-center">
                  <TrendingUp className="w-5 h-5 mr-2" />
                  <span className="font-bold">{streak} Day Streak</span>
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                {/* Progress Bar */}
                <div className="w-64">
                  <div className="flex justify-between text-sm mb-1">
                    <span>Level {level}</span>
                    <span>{progressData.currentLevelPoints}/{progressData.levelPoints}</span>
                    <span>Level {level + 1}</span>
                  </div>
                  <div className="w-full bg-white/30 rounded-full h-2">
                    <motion.div
                      className="bg-yellow-400 h-2 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${progressData.progress}%` }}
                      transition={{ duration: 1 }}
                    />
                  </div>
                </div>

                {/* Scarcity Timer */}
                {scarcityTimer && (
                  <motion.div
                    initial={{ scale: 0.9 }}
                    animate={{ scale: 1 }}
                    className="bg-red-600 px-3 py-1 rounded-full flex items-center"
                  >
                    <Clock className="w-4 h-4 mr-2" />
                    <span className="font-bold">{formatTimer(scarcityTimer)}</span>
                  </motion.div>
                )}

                {/* Notifications Bell */}
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="relative"
                >
                  <Gift className="w-6 h-6" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {unreadCount}
                    </span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Notifications Panel */}
      <AnimatePresence>
        {showNotifications && (
          <motion.div
            initial={{ opacity: 0, x: 300 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 300 }}
            className="fixed top-16 right-4 w-96 bg-white rounded-xl shadow-2xl z-50 border border-gray-200"
          >
            <div className="p-4 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h3 className="font-bold text-lg">Notifications</h3>
                <button
                  onClick={() => setShowNotifications(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
            </div>
            
            <div className="max-h-96 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  No notifications yet
                </div>
              ) : (
                notifications.slice().reverse().map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 border-b border-gray-100 ${!notification.read ? 'bg-blue-50' : ''}`}
                  >
                    <div className="flex items-start">
                      <div className="flex-1">
                        <div className="flex justify-between">
                          <h4 className="font-bold">{notification.title}</h4>
                          <span className="text-sm text-gray-500">
                            {new Date(notification.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-gray-700 mt-1">{notification.message}</p>
                        {notification.urgency === 'critical' && (
                          <span className="inline-block bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full mt-2">
                            ⏰ Urgent
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
            
            {notifications.length > 0 && (
              <div className="p-3 border-t border-gray-200">
                <button className="w-full text-center text-blue-600 hover:text-blue-800 font-medium">
                  Mark all as read
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Social Proof Popups */}
      <AnimatePresence>
        {Math.random() > 0.9 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed bottom-4 right-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl shadow-xl z-40 p-4 max-w-sm"
          >
            <div className="flex items-center">
              <Users className="w-6 h-6 mr-3" />
              <div>
                <p className="font-bold">🔥 Hot right now!</p>
                <p className="text-sm opacity-90">5 people are designing logos like yours!</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Points Earned Toast Replacement */}
      <div className="fixed bottom-4 left-4 space-y-2 z-40">
        {/* This would show points earned notifications */}
      </div>
    </>
  );
};

export default GamificationOverlay;
