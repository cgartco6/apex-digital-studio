import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import useAddictionEngine from '../../hooks/useAddictionEngine';
import { Sparkles, ChevronRight, Flame, Target } from 'lucide-react';

const AddictiveCTA = ({ 
  type = 'primary', 
  text, 
  onClick, 
  size = 'lg',
  showCountdown = false,
  urgencyLevel = 'medium'
}) => {
  const { trackAddictiveAction, createScarcityTimer } = useAddictionEngine();
  const [hoverCount, setHoverCount] = useState(0);
  const [clickCount, setClickCount] = useState(0);
  const [countdown, setCountdown] = useState(null);
  const [showSparkle, setShowSparkle] = useState(false);

  useEffect(() => {
    if (showCountdown) {
      const timer = createScarcityTimer();
      setCountdown(timer.endTime);
    }
  }, [showCountdown, createScarcityTimer]);

  // Update countdown
  useEffect(() => {
    if (countdown) {
      const interval = setInterval(() => {
        if (Date.now() >= countdown) {
          setCountdown(null);
          clearInterval(interval);
        }
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [countdown]);

  const handleHover = () => {
    setHoverCount(prev => prev + 1);
    
    // Show sparkle effect on 3rd hover
    if (hoverCount === 2) {
      setShowSparkle(true);
      setTimeout(() => setShowSparkle(false), 1000);
    }
  };

  const handleClick = (e) => {
    setClickCount(prev => prev + 1);
    
    // Track addictive action
    if (type === 'purchase') {
      trackAddictiveAction('cart_addition');
    }
    
    onClick?.(e);
  };

  const getButtonStyle = () => {
    const baseStyles = {
      primary: 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700',
      secondary: 'bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600',
      success: 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700',
      danger: 'bg-gradient-to-r from-red-500 to-orange-600 hover:from-red-600 hover:to-orange-700',
      premium: 'bg-gradient-to-r from-yellow-500 via-orange-500 to-red-500 hover:from-yellow-600 hover:via-orange-600 hover:to-red-600'
    };

    const sizeStyles = {
      sm: 'px-4 py-2 text-sm',
      md: 'px-6 py-3 text-base',
      lg: 'px-8 py-4 text-lg font-bold'
    };

    const urgencyStyles = {
      low: '',
      medium: 'ring-2 ring-offset-2 ring-opacity-50',
      high: 'animate-pulse ring-4 ring-offset-2',
      critical: 'animate-pulse ring-4 ring-offset-2 ring-red-500 shadow-2xl'
    };

    return `${baseStyles[type]} ${sizeStyles[size]} ${urgencyStyles[urgencyLevel]} text-white rounded-xl transition-all duration-300 transform hover:scale-105 hover:shadow-2xl`;
  };

  const formatCountdown = () => {
    if (!countdown) return null;
    
    const now = Date.now();
    const diff = countdown - now;
    
    if (diff <= 0) return 'Offer expired!';
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${hours}h ${minutes}m left`;
  };

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      onHoverStart={handleHover}
      className="relative inline-block"
    >
      {/* Sparkle effect */}
      {showSparkle && (
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 2, opacity: 0 }}
          className="absolute inset-0"
        >
          <Sparkles className="absolute -top-4 -left-4 w-8 h-8 text-yellow-400 animate-spin" />
          <Sparkles className="absolute -top-4 -right-4 w-8 h-8 text-yellow-400 animate-spin" />
          <Sparkles className="absolute -bottom-4 -left-4 w-8 h-8 text-yellow-400 animate-spin" />
          <Sparkles className="absolute -bottom-4 -right-4 w-8 h-8 text-yellow-400 animate-spin" />
        </motion.div>
      )}

      {/* Streak indicator */}
      {clickCount >= 3 && (
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-red-600 text-white px-3 py-1 rounded-full text-sm font-bold whitespace-nowrap"
        >
          <Flame className="w-4 h-4 inline mr-1" />
          Power User!
        </motion.div>
      )}

      {/* Main button */}
      <button
        onClick={handleClick}
        className={`relative overflow-hidden group ${getButtonStyle()}`}
      >
        {/* Animated background */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
          initial={{ x: '-100%' }}
          whileHover={{ x: '100%' }}
          transition={{ duration: 0.6 }}
        />

        <div className="relative flex items-center justify-center">
          {/* Icon based on type */}
          {type === 'premium' && <Target className="w-5 h-5 mr-2" />}
          {type === 'danger' && <Flame className="w-5 h-5 mr-2" />}
          
          <span>{text}</span>
          
          {/* Countdown badge */}
          {countdown && (
            <span className="ml-3 bg-white/30 px-2 py-1 rounded-full text-sm">
              {formatCountdown()}
            </span>
          )}
          
          <ChevronRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
        </div>

        {/* Click counter badge */}
        {clickCount > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-2 -right-2 bg-yellow-500 text-black text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center"
          >
            {clickCount}
          </motion.span>
        )}
      </button>

      {/* Micro-interaction hints */}
      {hoverCount === 1 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 text-xs text-gray-600 whitespace-nowrap"
        >
          Click me! 🎯
        </motion.div>
      )}
    </motion.div>
  );
};

export default AddictiveCTA;
