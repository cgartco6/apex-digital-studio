import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useAI } from '../context/AIContext';
import { toast } from 'react-hot-toast';
import confetti from 'canvas-confetti';

const useAddictionEngine = () => {
  const { user } = useAuth();
  const { aiState } = useAI();
  const [streak, setStreak] = useState(0);
  const [points, setPoints] = useState(0);
  const [level, setLevel] = useState(1);
  const [notifications, setNotifications] = useState([]);
  const [gamificationEnabled, setGamificationEnabled] = useState(true);

  // Load user stats
  useEffect(() => {
    const loadStats = () => {
      const savedStats = JSON.parse(localStorage.getItem('apex_addiction_stats')) || {};
      setStreak(savedStats.streak || 0);
      setPoints(savedStats.points || 0);
      setLevel(savedStats.level || 1);
      setNotifications(savedStats.notifications || []);
    };
    loadStats();
  }, []);

  // Save stats
  const saveStats = useCallback((stats) => {
    localStorage.setItem('apex_addiction_stats', JSON.stringify(stats));
  }, []);

  // Calculate FOMO triggers
  const triggerFOMO = useCallback((type) => {
    const fomoTriggers = {
      'design_completed': {
        title: '🚀 Design Completed!',
        message: 'Another user just completed a design similar to yours!',
        urgency: 'high'
      },
      'limited_offer': {
        title: '⏰ Limited Time Offer!',
        message: 'Special discount ending in 2 hours! Complete your design now.',
        urgency: 'critical'
      },
      'streak_risk': {
        title: '🔥 Streak at Risk!',
        message: 'Your 7-day streak will be lost if you don\'t design today!',
        urgency: 'high'
      },
      'exclusive_feature': {
        title: '🎁 Exclusive Feature Unlocked!',
        message: 'Level up to access AI-powered 3D design!',
        urgency: 'medium'
      }
    };

    const trigger = fomoTriggers[type];
    if (trigger && gamificationEnabled) {
      setNotifications(prev => [...prev, {
        id: Date.now(),
        ...trigger,
        timestamp: new Date(),
        read: false
      }]);

      // Show toast notification
      toast(trigger.message, {
        icon: '🔥',
        duration: 5000,
        position: 'top-right'
      });
    }
  }, [gamificationEnabled]);

  // Addictive reward system
  const rewardAction = useCallback((actionType, value = 10) => {
    if (!gamificationEnabled) return;

    let pointsToAdd = value;
    let message = '';
    let effect = null;

    switch(actionType) {
      case 'design_generated':
        pointsToAdd = 25;
        message = '🎨 +25 points for generating a design!';
        effect = 'confetti';
        break;
      case 'daily_login':
        pointsToAdd = streak > 0 ? 50 + (streak * 10) : 50;
        message = `📅 Daily login! +${pointsToAdd} points (${streak + 1} day streak)`;
        effect = 'streak';
        break;
      case 'first_purchase':
        pointsToAdd = 500;
        message = '💰 +500 points for your first purchase!';
        effect = 'money';
        break;
      case 'share_design':
        pointsToAdd = 100;
        message = '📤 +100 points for sharing your design!';
        break;
      case 'complete_profile':
        pointsToAdd = 200;
        message = '👤 +200 points for completing your profile!';
        break;
      case 'invite_friend':
        pointsToAdd = 250;
        message = '👥 +250 points for inviting a friend!';
        break;
    }

    const newPoints = points + pointsToAdd;
    const newLevel = Math.floor(newPoints / 1000) + 1;
    
    setPoints(newPoints);
    if (newLevel > level) {
      setLevel(newLevel);
      triggerLevelUp(newLevel);
    }

    // Save stats
    saveStats({
      streak,
      points: newPoints,
      level: newLevel,
      notifications
    });

    // Visual effects
    if (effect === 'confetti') {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
    }

    toast.success(message);
    
    // Trigger dopamine release
    setTimeout(() => triggerFOMO('exclusive_feature'), 3000);

    return { points: pointsToAdd, level: newLevel };
  }, [points, level, streak, notifications, gamificationEnabled]);

  // Trigger level up
  const triggerLevelUp = (newLevel) => {
    confetti({
      particleCount: 200,
      angle: 60,
      spread: 80,
      origin: { x: 0 },
      colors: ['#ff0000', '#00ff00', '#0000ff']
    });
    
    confetti({
      particleCount: 200,
      angle: 120,
      spread: 80,
      origin: { x: 1 },
      colors: ['#ff0000', '#00ff00', '#0000ff']
    });

    toast.success(`🎉 LEVEL UP! You're now level ${newLevel}!`, {
      duration: 5000,
      icon: '🏆'
    });

    setNotifications(prev => [...prev, {
      id: Date.now(),
      title: '🏆 Level Up!',
      message: `Congratulations! You've reached level ${newLevel}`,
      urgency: 'high',
      timestamp: new Date(),
      read: false
    }]);
  };

  // Streak tracking
  const updateStreak = useCallback(() => {
    const lastLogin = localStorage.getItem('apex_last_login');
    const today = new Date().toDateString();
    
    if (lastLogin !== today) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      
      if (lastLogin === yesterday.toDateString()) {
        // Consecutive day
        const newStreak = streak + 1;
        setStreak(newStreak);
        
        if (newStreak % 7 === 0) {
          // Weekly streak bonus
          rewardAction('streak_bonus', 1000);
          toast.success(`🔥 ${newStreak} DAY STREAK! +1000 bonus points!`);
        }
      } else if (streak > 0) {
        // Streak broken - trigger loss aversion
        toast.error(`😢 Streak broken! You lost your ${streak} day streak.`, {
          duration: 8000
        });
        setStreak(0);
        
        // Trigger FOMO to get them back
        setTimeout(() => {
          triggerFOMO('streak_risk');
        }, 5000);
      }
      
      localStorage.setItem('apex_last_login', today);
    }
  }, [streak, rewardAction, triggerFOMO]);

  // Progress bars
  const getProgressData = useCallback(() => {
    const pointsToNextLevel = (level * 1000) - points;
    const progress = ((points % 1000) / 1000) * 100;
    
    return {
      progress,
      pointsToNextLevel,
      currentLevelPoints: points % 1000,
      levelPoints: 1000
    };
  }, [points, level]);

  // Social proof notifications
  const triggerSocialProof = useCallback(() => {
    const socialEvents = [
      "🎨 Sarah just purchased a logo design!",
      "🚀 Mike upgraded to Pro plan!",
      "💡 Emma generated 5 designs today!",
      "🔥 John reached level 10!",
      "✨ Lisa shared her design on social media!",
      "👑 David became a top designer this week!"
    ];

    const randomEvent = socialEvents[Math.floor(Math.random() * socialEvents.length)];
    
    setNotifications(prev => [...prev, {
      id: Date.now(),
      title: '👥 Community Activity',
      message: randomEvent,
      urgency: 'low',
      timestamp: new Date(),
      read: false
    }]);

    // Show as toast occasionally
    if (Math.random() > 0.7) {
      toast(randomEvent, {
        icon: '👥',
        duration: 4000
      });
    }
  }, []);

  // Scarcity timer
  const createScarcityTimer = useCallback((duration = 7200) => { // 2 hours
    const endTime = Date.now() + (duration * 1000);
    localStorage.setItem('apex_scarcity_timer', endTime);
    
    return {
      endTime,
      duration,
      message: '⏰ Special offer ends in'
    };
  }, []);

  // Variable rewards
  const getRandomReward = useCallback(() => {
    const rewards = [
      { type: 'points', value: 50, probability: 0.6 },
      { type: 'points', value: 100, probability: 0.25 },
      { type: 'points', value: 500, probability: 0.1 },
      { type: 'credit', value: 1, probability: 0.04 },
      { type: 'feature', value: 'premium_template', probability: 0.01 }
    ];

    const rand = Math.random();
    let cumulative = 0;
    
    for (const reward of rewards) {
      cumulative += reward.probability;
      if (rand <= cumulative) {
        return reward;
      }
    }
    
    return rewards[0];
  }, []);

  // Hook into user actions
  const trackAddictiveAction = useCallback((action, data = {}) => {
    switch(action) {
      case 'page_view':
        // Track time spent
        const startTime = Date.now();
        return () => {
          const timeSpent = Date.now() - startTime;
          if (timeSpent > 30000) { // 30 seconds
            rewardAction('time_spent', Math.floor(timeSpent / 1000));
          }
        };
      
      case 'design_interaction':
        rewardAction('design_generated');
        triggerFOMO('design_completed');
        break;
      
      case 'cart_addition':
        // Trigger scarcity
        createScarcityTimer();
        triggerFOMO('limited_offer');
        break;
      
      case 'checkout_started':
        // Show social proof
        triggerSocialProof();
        break;
    }
  }, [rewardAction, triggerFOMO, createScarcityTimer, triggerSocialProof]);

  return {
    streak,
    points,
    level,
    notifications,
    gamificationEnabled,
    setGamificationEnabled,
    rewardAction,
    triggerFOMO,
    updateStreak,
    getProgressData,
    createScarcityTimer,
    getRandomReward,
    trackAddictiveAction,
    triggerSocialProof
  };
};

export default useAddictionEngine;
