const { OpenAIClient } = require('@azure/openai');
const { PineconeClient } = require('@pinecone-database/pinecone');
const sentiment = require('sentiment');

class MegsService {
  constructor() {
    this.openai = new OpenAIClient(process.env.OPENAI_ENDPOINT, new AzureKeyCredential(process.env.OPENAI_KEY));
    this.pinecone = new PineconeClient();
    this.memory = {}; // per-user conversation memory
  }

  async processMessage(userId, message, context = {}) {
    // Detect emotion
    const emotion = this.detectEmotion(message);
    
    // Load conversation history from vector store
    const history = await this.getHistory(userId);
    
    // Build prompt with emotion and context
    const prompt = this.buildPrompt(message, emotion, history, context);
    
    // Call LLM
    const response = await this.openai.getChatCompletions('gpt-4', prompt, { temperature: 0.7 });
    
    // Save to history
    await this.saveToHistory(userId, message, response.choices[0].message.content);
    
    return {
      message: response.choices[0].message.content,
      emotion: emotion,
      suggestions: this.generateSuggestions(response)
    };
  }

  detectEmotion(text) {
    const result = sentiment(text);
    // Map score to emotion
    if (result.score > 2) return 'happy';
    if (result.score < -2) return 'angry';
    if (result.score < -1) return 'sad';
    return 'neutral';
  }

  buildPrompt(message, emotion, history, context) {
    return [
      { role: 'system', content: `You are Megs, an empathetic AI assistant for Apex Digital Studio. Current user emotion: ${emotion}. Respond with warmth and helpfulness.` },
      ...history.slice(-5).map(m => ({ role: m.sender === 'user' ? 'user' : 'assistant', content: m.text })),
      { role: 'user', content: message }
    ];
  }

  async getHistory(userId) {
    // Retrieve from vector DB
    return this.memory[userId] || [];
  }

  async saveToHistory(userId, userMsg, botMsg) {
    if (!this.memory[userId]) this.memory[userId] = [];
    this.memory[userId].push({ sender: 'user', text: userMsg, timestamp: new Date() });
    this.memory[userId].push({ sender: 'bot', text: botMsg, timestamp: new Date() });
    // Keep last 50 messages
    if (this.memory[userId].length > 50) this.memory[userId].shift();
  }
}
