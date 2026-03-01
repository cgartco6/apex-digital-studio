const { Configuration, OpenAIApi } = require('openai');
const logger = require('../utils/logger');

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
  organization: process.env.OPENAI_ORGANIZATION
});

const openai = new OpenAIApi(configuration);

// Rate limiting and retry logic
const withRetry = async (fn, maxRetries = 3, delay = 1000) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (error.response?.status === 429 && i < maxRetries - 1) {
        // Rate limited, wait and retry
        const waitTime = delay * Math.pow(2, i); // Exponential backoff
        logger.warn(`Rate limited, retrying in ${waitTime}ms...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        continue;
      }
      throw error;
    }
  }
};

// Enhanced OpenAI wrapper with error handling
exports.generateImage = async (prompt, options = {}) => {
  const {
    model = 'dall-e-3',
    size = '1024x1024',
    quality = 'standard',
    n = 1,
    style = 'vivid'
  } = options;

  try {
    const response = await withRetry(() =>
      openai.createImage({
        prompt,
        model,
        size,
        quality,
        n,
        style
      })
    );

    return {
      success: true,
      data: response.data.data[0],
      usage: response.data.usage
    };
  } catch (error) {
    logger.error('OpenAI image generation error:', error);
    return {
      success: false,
      error: error.message,
      code: error.response?.status
    };
  }
};

exports.generateChatCompletion = async (messages, options = {}) => {
  const {
    model = 'gpt-4',
    temperature = 0.7,
    max_tokens = 2000,
    functions,
    function_call
  } = options;

  try {
    const response = await withRetry(() =>
      openai.createChatCompletion({
        model,
        messages,
        temperature,
        max_tokens,
        functions,
        function_call
      })
    );

    return {
      success: true,
      data: response.data.choices[0].message,
      usage: response.data.usage
    };
  } catch (error) {
    logger.error('OpenAI chat completion error:', error);
    return {
      success: false,
      error: error.message,
      code: error.response?.status
    };
  }
};

exports.analyzeImage = async (imageUrl, prompt) => {
  try {
    const response = await withRetry(() =>
      openai.createChatCompletion({
        model: 'gpt-4-vision-preview',
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: prompt },
              { type: 'image_url', image_url: { url: imageUrl } }
            ]
          }
        ],
        max_tokens: 1000
      })
    );

    return {
      success: true,
      data: response.data.choices[0].message.content,
      usage: response.data.usage
    };
  } catch (error) {
    logger.error('OpenAI image analysis error:', error);
    return {
      success: false,
      error: error.message,
      code: error.response?.status
    };
  }
};

exports.createEmbedding = async (text, model = 'text-embedding-ada-002') => {
  try {
    const response = await withRetry(() =>
      openai.createEmbedding({
        model,
        input: text
      })
    );

    return {
      success: true,
      data: response.data.data[0].embedding,
      usage: response.data.usage
    };
  } catch (error) {
    logger.error('OpenAI embedding error:', error);
    return {
      success: false,
      error: error.message,
      code: error.response?.status
    };
  }
};

// Batch processing for multiple prompts
exports.batchGenerateImages = async (prompts, options = {}) => {
  const results = [];
  const batchSize = 5; // OpenAI rate limit

  for (let i = 0; i < prompts.length; i += batchSize) {
    const batch = prompts.slice(i, i + batchSize);
    const batchPromises = batch.map(prompt =>
      exports.generateImage(prompt, options)
    );

    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);

    // Rate limiting delay between batches
    if (i + batchSize < prompts.length) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  return results;
};

// Cost estimation
exports.estimateCost = (usage, model) => {
  const pricing = {
    'gpt-4': { input: 0.03, output: 0.06 }, // per 1K tokens
    'gpt-4-32k': { input: 0.06, output: 0.12 },
    'gpt-3.5-turbo': { input: 0.0015, output: 0.002 },
    'dall-e-3': { standard: 0.04, hd: 0.08 }, // per image
    'text-embedding-ada-002': { input: 0.0001 }
  };

  const modelPricing = pricing[model];
  if (!modelPricing) return 0;

  if (model.startsWith('dall-e')) {
    const count = usage?.images || 1;
    return modelPricing[options?.quality || 'standard'] * count;
  }

  const inputTokens = usage?.prompt_tokens || 0;
  const outputTokens = usage?.completion_tokens || 0;

  return (
    (inputTokens / 1000) * modelPricing.input +
    (outputTokens / 1000) * modelPricing.output
  );
};

module.exports = exports;
