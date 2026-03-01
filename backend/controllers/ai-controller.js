const openai = require('../config/openai');
const { 
  generateDesign, 
  analyzeDesign, 
  optimizeWorkflow,
  generateContent,
  getMarketInsights 
} = require('../services/ai.service');
const asyncHandler = require('express-async-handler');

// Generate design with AI
exports.generateDesign = asyncHandler(async (req, res) => {
  const { 
    prompt, 
    style = 'modern', 
    category = 'logo',
    colorPalette,
    iterations = 3 
  } = req.body;

  // Check user credits
  const user = req.user;
  if (user.aiCredits.available < 1) {
    return res.status(400).json({
      success: false,
      message: 'Insufficient AI credits. Please purchase more.'
    });
  }

  try {
    // Deduct credit
    user.aiCredits.used += 1;
    await user.save();

    // Generate design using AI service
    const design = await generateDesign({
      prompt,
      style,
      category,
      colorPalette,
      userId: user._id,
      iterations
    });

    // Store design in user's history
    if (!user.aiDesigns) user.aiDesigns = [];
    user.aiDesigns.push({
      designId: design.id,
      prompt,
      category,
      generatedAt: new Date(),
      creditsUsed: 1
    });
    await user.save();

    res.status(200).json({
      success: true,
      data: design,
      creditsUsed: 1,
      creditsRemaining: user.aiCredits.available
    });
  } catch (error) {
    // Refund credit on error
    user.aiCredits.used -= 1;
    await user.save();

    console.error('AI design generation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate design',
      error: error.message
    });
  }
});

// Analyze design with AI
exports.analyzeDesign = asyncHandler(async (req, res) => {
  const { designUrl, analysisType = 'general' } = req.body;

  if (!designUrl) {
    return res.status(400).json({
      success: false,
      message: 'Design URL is required'
    });
  }

  try {
    const analysis = await analyzeDesign(designUrl, analysisType);

    res.status(200).json({
      success: true,
      data: analysis
    });
  } catch (error) {
    console.error('AI design analysis error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to analyze design',
      error: error.message
    });
  }
});

// Optimize workflow
exports.optimizeWorkflow = asyncHandler(async (req, res) => {
  const { workflowId, optimizations } = req.body;

  try {
    const optimizedWorkflow = await optimizeWorkflow(workflowId, optimizations);

    res.status(200).json({
      success: true,
      data: optimizedWorkflow
    });
  } catch (error) {
    console.error('Workflow optimization error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to optimize workflow',
      error: error.message
    });
  }
});

// Generate marketing content
exports.generateContent = asyncHandler(async (req, res) => {
  const { 
    type, 
    topic, 
    tone = 'professional',
    length = 'medium',
    keywords = [] 
  } = req.body;

  if (!type || !topic) {
    return res.status(400).json({
      success: false,
      message: 'Type and topic are required'
    });
  }

  try {
    const content = await generateContent({
      type,
      topic,
      tone,
      length,
      keywords,
      userId: req.user._id
    });

    res.status(200).json({
      success: true,
      data: content
    });
  } catch (error) {
    console.error('Content generation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate content',
      error: error.message
    });
  }
});

// Get market insights
exports.getMarketInsights = asyncHandler(async (req, res) => {
  const { industry, location, timeframe = '30d' } = req.query;

  try {
    const insights = await getMarketInsights({
      industry: industry || 'digital-design',
      location: location || 'global',
      timeframe
    });

    res.status(200).json({
      success: true,
      data: insights
    });
  } catch (error) {
    console.error('Market insights error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get market insights',
      error: error.message
    });
  }
});

// Get AI recommendations
exports.getRecommendations = asyncHandler(async (req, res) => {
  const { context = 'general', limit = 10 } = req.query;

  try {
    const recommendations = await getAIRecommendations({
      userId: req.user._id,
      context,
      limit: parseInt(limit)
    });

    res.status(200).json({
      success: true,
      data: recommendations
    });
  } catch (error) {
    console.error('Recommendations error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get recommendations',
      error: error.message
    });
  }
});

// Train custom AI model
exports.trainModel = asyncHandler(async (req, res) => {
  const { 
    modelName, 
    trainingData, 
    modelType = 'design',
    epochs = 10 
  } = req.body;

  // This is a premium feature
  if (req.user.subscription.plan !== 'enterprise') {
    return res.status(403).json({
      success: false,
      message: 'Custom model training requires enterprise subscription'
    });
  }

  try {
    // This would initiate training with your AI infrastructure
    const trainingJob = {
      jobId: `train_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      modelName,
      modelType,
      status: 'queued',
      startedAt: new Date(),
      estimatedCompletion: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
    };

    // Store training job in database
    // await TrainingJob.create(trainingJob);

    res.status(202).json({
      success: true,
      message: 'Training job queued successfully',
      data: trainingJob
    });
  } catch (error) {
    console.error('Model training error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to start training',
      error: error.message
    });
  }
});

// Get AI agent status
exports.getAgentStatus = asyncHandler(async (req, res) => {
  const { agentId } = req.params;

  try {
    // This would fetch from your AI agent service
    const agentStatus = {
      id: agentId,
      status: 'active',
      tasksCompleted: 142,
      successRate: 98.7,
      currentTask: 'logo_generation',
      lastActive: new Date(),
      performance: {
        avgResponseTime: 2.3,
        accuracy: 94.2,
        efficiency: 97.8
      }
    };

    res.status(200).json({
      success: true,
      data: agentStatus
    });
  } catch (error) {
    console.error('Agent status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get agent status',
      error: error.message
    });
  }
});

// Process batch design generation
exports.batchGenerate = asyncHandler(async (req, res) => {
  const { prompts, style, category, batchSize = 5 } = req.body;

  if (!prompts || prompts.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Prompts are required'
    });
  }

  // Check credits
  const requiredCredits = Math.min(prompts.length, batchSize);
  if (req.user.aiCredits.available < requiredCredits) {
    return res.status(400).json({
      success: false,
      message: `Insufficient credits. Need ${requiredCredits}, have ${req.user.aiCredits.available}`
    });
  }

  try {
    const results = [];
    const processedPrompts = prompts.slice(0, batchSize);

    for (const prompt of processedPrompts) {
      const design = await generateDesign({
        prompt,
        style,
        category,
        userId: req.user._id
      });
      results.push(design);
    }

    // Deduct credits
    req.user.aiCredits.used += results.length;
    await req.user.save();

    res.status(200).json({
      success: true,
      data: results,
      creditsUsed: results.length,
      creditsRemaining: req.user.aiCredits.available
    });
  } catch (error) {
    console.error('Batch generation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate batch designs',
      error: error.message
    });
  }
});
