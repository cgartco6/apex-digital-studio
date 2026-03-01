import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('token'));

  // Set axios default headers
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      localStorage.setItem('token', token);
    } else {
      delete axios.defaults.headers.common['Authorization'];
      localStorage.removeItem('token');
    }
  }, [token]);

  // Load user on mount
  useEffect(() => {
    const loadUser = async () => {
      if (token) {
        try {
          const response = await axios.get('/api/auth/me');
          setUser(response.data.user);
        } catch (error) {
          console.error('Failed to load user:', error);
          logout();
        }
      }
      setLoading(false);
    };

    loadUser();
  }, [token]);

  // Register
  const register = async (userData) => {
    try {
      const response = await axios.post('/api/auth/register', userData);
      const { token, user } = response.data;
      
      setToken(token);
      setUser(user);
      
      toast.success('Registration successful! Please check your email to verify your account.');
      return { success: true };
    } catch (error) {
      toast.error(error.response?.data?.message || 'Registration failed');
      return { success: false, error: error.response?.data };
    }
  };

  // Login
  const login = async (email, password) => {
    try {
      const response = await axios.post('/api/auth/login', { email, password });
      const { token, user } = response.data;
      
      setToken(token);
      setUser(user);
      
      toast.success(`Welcome back, ${user.firstName}!`);
      return { success: true };
    } catch (error) {
      toast.error(error.response?.data?.message || 'Login failed');
      return { success: false, error: error.response?.data };
    }
  };

  // Logout
  const logout = () => {
    setToken(null);
    setUser(null);
    delete axios.defaults.headers.common['Authorization'];
    localStorage.removeItem('token');
    toast.success('Logged out successfully');
  };

  // Forgot password
  const forgotPassword = async (email) => {
    try {
      await axios.post('/api/auth/forgot-password', { email });
      toast.success('Password reset email sent. Please check your inbox.');
      return { success: true };
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send reset email');
      return { success: false };
    }
  };

  // Reset password
  const resetPassword = async (token, password) => {
    try {
      const response = await axios.put(`/api/auth/reset-password/${token}`, { password });
      setToken(response.data.token);
      setUser(response.data.user);
      
      toast.success('Password reset successful!');
      return { success: true };
    } catch (error) {
      toast.error(error.response?.data?.message || 'Password reset failed');
      return { success: false };
    }
  };

  // Update profile
  const updateProfile = async (profileData) => {
    try {
      const response = await axios.put('/api/auth/update-profile', profileData);
      setUser(response.data.user);
      
      toast.success('Profile updated successfully!');
      return { success: true, user: response.data.user };
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update profile');
      return { success: false };
    }
  };

  // Update password
  const updatePassword = async (currentPassword, newPassword) => {
    try {
      const response = await axios.put('/api/auth/update-password', {
        currentPassword,
        newPassword
      });
      
      setToken(response.data.token);
      toast.success('Password updated successfully!');
      return { success: true };
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update password');
      return { success: false };
    }
  };

  // Verify email
  const verifyEmail = async (token) => {
    try {
      const response = await axios.get(`/api/auth/verify-email/${token}`);
      setToken(response.data.token);
      setUser(response.data.user);
      
      toast.success('Email verified successfully!');
      return { success: true };
    } catch (error) {
      toast.error(error.response?.data?.message || 'Email verification failed');
      return { success: false };
    }
  };

  // Check if user has role
  const hasRole = (role) => {
    return user?.role === role;
  };

  // Check if user has subscription
  const hasSubscription = (plan) => {
    if (!plan) return user?.subscription?.status === 'active';
    return user?.subscription?.plan === plan && user?.subscription?.status === 'active';
  };

  const value = {
    user,
    loading,
    token,
    register,
    login,
    logout,
    forgotPassword,
    resetPassword,
    updateProfile,
    updatePassword,
    verifyEmail,
    hasRole,
    hasSubscription
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
