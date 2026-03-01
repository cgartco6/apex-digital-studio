import React, { createContext, useState, useContext, useCallback } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';

const AIContext = createContext();

export const useAI = () => {
  const context = useContext(AIContext);
  if (!context) {
    throw new Error('useAI must be used within an AIProvider');
  }
  return context;
};

export const AIProvider = ({ children }) => {
  const [aiState, setAiState] = useState({
    isProcessing: false,
    lastProcessed: null,
    agents: [],
    tasks: [],
    analytics: null
  });

  // Generate design using AI
  const generateDesign = useCallback(async (prompt, style = 'modern', category = 'logo') => {
    setAiState(prev => ({ ...prev, isProcessing: true }));
    
    try {
      const response = await axios.post('/api/ai/generate-design', {
        prompt,
        style,
        category
      });

      toast.success('Design generated successfully!');
      
      setAiState(prev => ({
        ...prev,
        isProcessing: false,
        lastProcessed: new Date()
      }));

      return response.data;
    } catch (error) {
      toast.error('Failed to generate design');
      console.error('AI generation error:', error);
      throw error;
    }
  }, []);

  // Get AI recommendations
  const getAIRecommendations = useCallback(async (context = 'general') => {
    try {
      const response = await axios.get(`/api/ai/recommendations?context=${context}`);
      return response.data;
    } catch (error) {
      console.error('AI recommendations error:', error);
      return [];
    }
  }, []);

  // Optimize design workflow
  const optimizeWorkflow = useCallback(async (workflowId, optimizations) => {
    setAiState(prev => ({ ...prev, isProcessing: true }));
    
    try {
      const response = await axios.post('/api/ai/optimize-workflow', {
        workflowId,
        optimizations
      });

      toast.success('Workflow optimized successfully!');
      
      setAiState(prev => ({
        ...prev,
        isProcessing: false
      }));

      return response.data;
    } catch (error) {
      toast.error('Failed to optimize workflow');
      console.error('Workflow optimization error:', error);
      throw error;
    }
  }, []);

  // Get AI analytics
  const getAIAnalytics = useCallback(async (type = 'general') => {
    try {
      const response = await axios.get(`/api/ai/analytics?type=${type}`);
      return response.data;
    } catch (error) {
      console.error('AI analytics error:', error);
      return null;
    }
  }, []);

  // Submit design for AI review
  const submitForAIReview = useCallback(async (designData) => {
    setAiState(prev => ({ ...prev, isProcessing: true }));
    
    try {
      const response = await axios.post('/api/ai/review', designData);

      toast.success('AI review completed!');
      
      setAiState(prev => ({
        ...prev,
        isProcessing: false
      }));

      return response.data;
    } catch (error) {
      toast.error('AI review failed');
      console.error('AI review error:', error);
      throw error;
    }
  }, []);

  // Generate content using AI
  const generateContent = useCallback(async (type, specifications) => {
    setAiState(prev => ({ ...prev, isProcessing: true }));
    
    try {
      const response = await axios.post('/api/ai/generate-content', {
        type,
        specifications
      });

      toast.success('Content generated successfully!');
      
      setAiState(prev => ({
        ...prev,
        isProcessing: false
      }));

      return response.data;
    } catch (error) {
      toast.error('Content generation failed');
      console.error('Content generation error:', error);
      throw error;
    }
  }, []);

  const value = {
    aiState,
    generateDesign,
    getAIRecommendations,
    optimizeWorkflow,
    getAIAnalytics,
    submitForAIReview,
    generateContent
  };

  return (
    <AIContext.Provider value={value}>
      {children}
    </AIContext.Provider>
  );
};
