import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAI } from '../context/AIContext';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-hot-toast';

const AIDesignStudio = () => {
  const { user } = useAuth();
  const { generateDesign, aiState } = useAI();
  const [activeTab, setActiveTab] = useState('logo');
  const [prompt, setPrompt] = useState('');
  const [style, setStyle] = useState('modern');
  const [generatedDesigns, setGeneratedDesigns] = useState([]);
  const [selectedDesign, setSelectedDesign] = useState(null);
  const [isCustomizing, setIsCustomizing] = useState(false);
  const canvasRef = useRef(null);

  const designCategories = [
    { id: 'logo', name: 'Logo Design', icon: '🎨', color: 'from-blue-500 to-cyan-500' },
    { id: 'brand', name: 'Brand Identity', icon: '🏢', color: 'from-purple-500 to-pink-500' },
    { id: 'web', name: 'Web Design', icon: '🌐', color: 'from-green-500 to-emerald-500' },
    { id: 'social', name: 'Social Media', icon: '📱', color: 'from-orange-500 to-red-500' },
    { id: 'print', name: 'Print Design', icon: '📄', color: 'from-indigo-500 to-blue-500' },
    { id: 'motion', name: 'Motion Graphics', icon: '🎬', color: 'from-pink-500 to-rose-500' }
  ];

  const designStyles = [
    { id: 'modern', name: 'Modern', description: 'Clean and minimalist' },
    { id: 'vintage', name: 'Vintage', description: 'Classic and retro' },
    { id: 'futuristic', name: 'Futuristic', description: 'Tech and innovative' },
    { id: 'organic', name: 'Organic', description: 'Natural and flowing' },
    { id: 'corporate', name: 'Corporate', description: 'Professional and formal' },
    { id: 'playful', name: 'Playful', description: 'Fun and colorful' }
  ];

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast.error('Please enter a design prompt');
      return;
    }

    if (user?.availableCredits < 1) {
      toast.error('Insufficient AI credits. Please purchase more.');
      return;
    }

    try {
      const result = await generateDesign(prompt, style, activeTab);
      setGeneratedDesigns(prev => [result, ...prev]);
      toast.success(`Generated ${activeTab} design!`);
    } catch (error) {
      toast.error('Failed to generate design');
    }
  };

  const handleCustomize = (design) => {
    setSelectedDesign(design);
    setIsCustomizing(true);
  };

  const handleDownload = (design, format = 'png') => {
    // Download logic here
    toast.success(`Downloading design in ${format.toUpperCase()} format`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black text-white">
      {/* Header */}
      <div className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-5xl font-bold mb-4">
            <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
              AI Design Studio
            </span>
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Create professional designs in seconds using artificial intelligence.
            100x faster than traditional design studios.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Left Sidebar - Controls */}
          <div className="lg:col-span-1 space-y-6">
            {/* Design Categories */}
            <div className="bg-gray-800/50 backdrop-blur-lg rounded-2xl p-6 border border-gray-700">
              <h3 className="text-lg font-bold mb-4 flex items-center">
                <span className="mr-2">📁</span>
                Design Type
              </h3>
              <div className="space-y-2">
                {designCategories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => setActiveTab(category.id)}
                    className={`w-full p-3 rounded-xl text-left transition-all ${activeTab === category.id
                        ? `bg-gradient-to-r ${category.color} text-white`
                        : 'bg-gray-700/50 hover:bg-gray-700'
                      }`}
                  >
                    <div className="flex items-center">
                      <span className="text-xl mr-3">{category.icon}</span>
                      <span className="font-medium">{category.name}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Design Style */}
            <div className="bg-gray-800/50 backdrop-blur-lg rounded-2xl p-6 border border-gray-700">
              <h3 className="text-lg font-bold mb-4 flex items-center">
                <span className="mr-2">🎭</span>
                Design Style
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {designStyles.map((styleItem) => (
                  <button
                    key={styleItem.id}
                    onClick={() => setStyle(styleItem.id)}
                    className={`p-3 rounded-xl text-center transition-all ${style === styleItem.id
                        ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                        : 'bg-gray-700/50 hover:bg-gray-700'
                      }`}
                  >
                    <div className="font-medium">{styleItem.name}</div>
                    <div className="text-xs text-gray-400 mt-1">{styleItem.description}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* AI Credits */}
            <div className="bg-gradient-to-br from-blue-900/50 to-cyan-900/50 rounded-2xl p-6 border border-cyan-500/30">
              <h3 className="text-lg font-bold mb-4 flex items-center">
                <span className="mr-2">⚡</span>
                AI Credits
              </h3>
              <div className="text-center">
                <div className="text-4xl font-bold mb-2">{user?.availableCredits || 0}</div>
                <div className="text-gray-300 mb-4">credits available</div>
                <button className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-bold py-3 rounded-xl hover:opacity-90 transition-opacity">
                  Buy More Credits
                </button>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Prompt Input */}
            <div className="bg-gray-800/50 backdrop-blur-lg rounded-2xl p-6 border border-gray-700 mb-8">
              <h3 className="text-lg font-bold mb-4 flex items-center">
                <span className="mr-2">✨</span>
                Describe Your Design
              </h3>
              <div className="space-y-4">
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Describe what you want to create. Be as detailed as possible. Example: 'A modern tech company logo with a circuit board pattern, blue and silver colors, clean and professional'"
                  className="w-full h-32 bg-gray-900/70 border border-gray-600 rounded-xl p-4 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent resize-none"
                />
                <div className="flex flex-col md:flex-row gap-4">
                  <button
                    onClick={handleGenerate}
                    disabled={aiState.isProcessing}
                    className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold py-4 px-6 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {aiState.isProcessing ? (
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mr-3"></div>
                        Generating...
                      </div>
                    ) : (
                      '🚀 Generate Design (1 credit)'
                    )}
                  </button>
                  <button className="px-6 py-4 border border-gray-600 rounded-xl hover:bg-gray-700 transition-colors">
                    🎲 Random Idea
                  </button>
                  <button className="px-6 py-4 border border-gray-600 rounded-xl hover:bg-gray-700 transition-colors">
                    📋 Load Example
                  </button>
                </div>
              </div>
            </div>

            {/* Generated Designs */}
            <AnimatePresence>
              {generatedDesigns.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="bg-gray-800/50 backdrop-blur-lg rounded-2xl p-6 border border-gray-700 mb-8"
                >
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-bold flex items-center">
                      <span className="mr-2">🎨</span>
                      Generated Designs
                    </h3>
                    <div className="text-gray-400">
                      {generatedDesigns.length} designs
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {generatedDesigns.map((design, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.1 }}
                        className="bg-gray-900/70 rounded-xl overflow-hidden border border-gray-700 hover:border-cyan-500/50 transition-colors"
                      >
                        <div className="p-4">
                          <div className="aspect-square bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg mb-4 flex items-center justify-center">
                            <div className="text-4xl">🎨</div>
                          </div>
                          <div className="space-y-3">
                            <div>
                              <h4 className="font-bold truncate">{design.prompt}</h4>
                              <div className="flex items-center justify-between text-sm text-gray-400 mt-1">
                                <span className="capitalize">{design.style}</span>
                                <span>{new Date(design.generated_at).toLocaleDateString()}</span>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleCustomize(design)}
                                className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-500 text-white py-2 px-4 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
                              >
                                Customize
                              </button>
                              <button
                                onClick={() => handleDownload(design)}
                                className="flex-1 bg-gray-700 text-white py-2 px-4 rounded-lg text-sm font-medium hover:bg-gray-600 transition-colors"
                              >
                                Download
                              </button>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* AI Design Assistant */}
            <div className="bg-gradient-to-br from-purple-900/50 to-pink-900/50 rounded-2xl p-6 border border-purple-500/30">
              <h3 className="text-lg font-bold mb-4 flex items-center">
                <span className="mr-2">🤖</span>
                AI Design Assistant
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button className="bg-white/10 hover:bg-white/20 p-4 rounded-xl transition-all text-left">
                  <div className="text-2xl mb-3">🎯</div>
                  <h4 className="font-semibold">Design Brief Analyzer</h4>
                  <p className="text-sm text-gray-300 mt-2">Get AI suggestions to improve your design brief</p>
                </button>
                <button className="bg-white/10 hover:bg-white/20 p-4 rounded-xl transition-all text-left">
                  <div className="text-2xl mb-3">🔍</div>
                  <h4 className="font-semibold">Competitor Analysis</h4>
                  <p className="text-sm text-gray-300 mt-2">See what your competitors are doing</p>
                </button>
                <button className="bg-white/10 hover:bg-white/20 p-4 rounded-xl transition-all text-left">
                  <div className="text-2xl mb-3">📈</div>
                  <h4 className="font-semibold">Trend Predictions</h4>
                  <p className="text-sm text-gray-300 mt-2">Get insights on design trends</p>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Customization Modal */}
      <AnimatePresence>
        {isCustomizing && selectedDesign && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setIsCustomizing(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-gray-900 rounded-2xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold">Customize Design</h3>
                <button
                  onClick={() => setIsCustomizing(false)}
                  className="text-gray-400 hover:text-white text-2xl"
                >
                  ×
                </button>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div>
                  <div className="bg-gray-800 rounded-xl p-4 mb-4">
                    <div className="aspect-square bg-gradient-to-br from-gray-700 to-gray-900 rounded-lg flex items-center justify-center">
                      <div className="text-6xl">🎨</div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Design Prompt
                      </label>
                      <input
                        type="text"
                        defaultValue={selectedDesign.prompt}
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Color Scheme
                      </label>
                      <div className="flex gap-2">
                        {['#3B82F6', '#8B5CF6', '#10B981', '#F59E0B'].map((color) => (
                          <button
                            key={color}
                            className="w-8 h-8 rounded-full border-2 border-gray-700"
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="text-lg font-bold mb-4">AI Suggestions</h4>
                  <div className="space-y-4">
                    <div className="bg-gray-800/50 p-4 rounded-xl">
                      <h5 className="font-semibold mb-2">Color Optimization</h5>
                      <p className="text-sm text-gray-400">Try using a monochromatic color scheme for better brand recognition</p>
                    </div>
                    <div className="bg-gray-800/50 p-4 rounded-xl">
                      <h5 className="font-semibold mb-2">Layout Improvement</h5>
                      <p className="text-sm text-gray-400">Increase negative space by 15% for better readability</p>
                    </div>
                    <div className="bg-gray-800/50 p-4 rounded-xl">
                      <h5 className="font-semibold mb-2">Trend Alert</h5>
                      <p className="text-sm text-gray-400">Gradient overlays are trending in your industry</p>
                    </div>
                  </div>
                  
                  <div className="mt-8 space-y-4">
                    <button className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-bold py-3 rounded-xl hover:opacity-90 transition-opacity">
                      Apply AI Suggestions
                    </button>
                    <button className="w-full bg-gray-800 text-white font-bold py-3 rounded-xl hover:bg-gray-700 transition-colors">
                      Generate Variation (1 credit)
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AIDesignStudio;
