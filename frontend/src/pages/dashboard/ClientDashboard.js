import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useAI } from '../../context/AIContext';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

const ClientDashboard = () => {
  const { user } = useAuth();
  const { aiState, getAIAnalytics } = useAI();
  const [analytics, setAnalytics] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    const data = await getAIAnalytics('client');
    setAnalytics(data);
  };

  // Mock data for charts
  const designProgressData = [
    { name: 'Week 1', progress: 20 },
    { name: 'Week 2', progress: 45 },
    { name: 'Week 3', progress: 70 },
    { name: 'Week 4', progress: 90 },
    { name: 'Week 5', progress: 100 },
  ];

  const categoryDistribution = [
    { name: 'Logo Design', value: 35, color: '#8884d8' },
    { name: 'Web Design', value: 25, color: '#82ca9d' },
    { name: 'Social Media', value: 20, color: '#ffc658' },
    { name: 'Print Design', value: 15, color: '#ff8042' },
    { name: 'UI/UX', value: 5, color: '#0088fe' },
  ];

  const recentProjects = [
    { id: 1, name: 'Brand Identity', status: 'completed', progress: 100 },
    { id: 2, name: 'Website Redesign', status: 'in-progress', progress: 75 },
    { id: 3, name: 'Social Media Kit', status: 'in-progress', progress: 30 },
    { id: 4, name: 'Product Packaging', status: 'pending', progress: 0 },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-4 md:p-8">
      {/* Header */}
      <div className="mb-8">
        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl font-bold text-gray-900 mb-2"
        >
          Welcome back, {user?.firstName}!
        </motion.h1>
        <p className="text-gray-600">
          Your AI-powered design studio dashboard. Everything you need to manage your projects.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <motion.div
          whileHover={{ scale: 1.05 }}
          className="bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl p-6 text-white shadow-xl"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-90">Active Projects</p>
              <p className="text-3xl font-bold">4</p>
            </div>
            <div className="text-3xl">🎨</div>
          </div>
          <div className="mt-4 text-sm">
            <span className="opacity-90">2 nearing completion</span>
          </div>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.05 }}
          className="bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl p-6 text-white shadow-xl"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-90">Designs Created</p>
              <p className="text-3xl font-bold">27</p>
            </div>
            <div className="text-3xl">🤖</div>
          </div>
          <div className="mt-4 text-sm">
            <span className="opacity-90">+5 this month</span>
          </div>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.05 }}
          className="bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl p-6 text-white shadow-xl"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-90">Total Spent</p>
              <p className="text-3xl font-bold">R 8,450</p>
            </div>
            <div className="text-3xl">💰</div>
          </div>
          <div className="mt-4 text-sm">
            <span className="opacity-90">Saved 40% with AI</span>
          </div>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.05 }}
          className="bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl p-6 text-white shadow-xl"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-90">AI Credits Left</p>
              <p className="text-3xl font-bold">142</p>
            </div>
            <div className="text-3xl">⚡</div>
          </div>
          <div className="mt-4 text-sm">
            <Link to="/ai-design-studio" className="underline opacity-90">
              Get more credits
            </Link>
          </div>
        </motion.div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column */}
        <div className="lg:col-span-2">
          {/* Tabs */}
          <div className="bg-white rounded-2xl shadow-xl p-6 mb-8">
            <div className="flex border-b border-gray-200 mb-6">
              {['overview', 'projects', 'analytics', 'ai-assistant'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 font-medium capitalize ${activeTab === tab
                      ? 'border-b-2 border-blue-500 text-blue-600'
                      : 'text-gray-600 hover:text-gray-900'
                    }`}
                >
                  {tab.replace('-', ' ')}
                </button>
              ))}
            </div>

            {/* Active Tab Content */}
            {activeTab === 'overview' && (
              <div>
                <h3 className="text-xl font-bold mb-6">Design Progress Overview</h3>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={designProgressData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="name" stroke="#666" />
                      <YAxis stroke="#666" />
                      <Tooltip />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="progress"
                        stroke="#8884d8"
                        strokeWidth={3}
                        dot={{ r: 6 }}
                        activeDot={{ r: 8 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {activeTab === 'projects' && (
              <div>
                <h3 className="text-xl font-bold mb-6">Recent Projects</h3>
                <div className="space-y-4">
                  {recentProjects.map((project) => (
                    <div
                      key={project.id}
                      className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex justify-between items-center mb-2">
                        <h4 className="font-semibold">{project.name}</h4>
                        <span className={`px-3 py-1 rounded-full text-sm ${project.status === 'completed'
                            ? 'bg-green-100 text-green-800'
                            : project.status === 'in-progress'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                          {project.status}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                        <div
                          className="bg-gradient-to-r from-blue-500 to-cyan-500 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${project.progress}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-sm text-gray-600">
                        <span>{project.progress}% complete</span>
                        <Link to={`/dashboard/design-projects/${project.id}`} className="text-blue-600 hover:text-blue-800">
                          View Details →
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* AI Assistant Section */}
          <div className="bg-gradient-to-br from-gray-900 to-black rounded-2xl shadow-xl p-6 text-white">
            <h3 className="text-xl font-bold mb-4 flex items-center">
              <span className="mr-2">🤖</span>
              AI Design Assistant
            </h3>
            <p className="text-gray-300 mb-6">
              Your personal AI assistant is ready to help with your next design project!
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button className="bg-white/10 hover:bg-white/20 p-4 rounded-xl transition-all">
                <div className="text-2xl mb-2">🎨</div>
                <h4 className="font-semibold">Generate Design</h4>
                <p className="text-sm text-gray-300 mt-1">Create new designs with AI</p>
              </button>
              <button className="bg-white/10 hover:bg-white/20 p-4 rounded-xl transition-all">
                <div className="text-2xl mb-2">🔍</div>
                <h4 className="font-semibold">Analyze Trends</h4>
                <p className="text-sm text-gray-300 mt-1">Get market insights</p>
              </button>
              <button className="bg-white/10 hover:bg-white/20 p-4 rounded-xl transition-all">
                <div className="text-2xl mb-2">💡</div>
                <h4 className="font-semibold">Get Ideas</h4>
                <p className="text-sm text-gray-300 mt-1">Creative suggestions</p>
              </button>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-8">
          {/* Category Distribution */}
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <h3 className="text-xl font-bold mb-6">Design Categories</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {categoryDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <h3 className="text-xl font-bold mb-6">Quick Actions</h3>
            <div className="space-y-3">
              <Link
                to="/ai-design-studio"
                className="flex items-center p-3 bg-gradient-to-r from-blue-50 to-cyan-50 hover:from-blue-100 hover:to-cyan-100 rounded-xl transition-all"
              >
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                  <span className="text-blue-600">🚀</span>
                </div>
                <div>
                  <h4 className="font-semibold">AI Design Studio</h4>
                  <p className="text-sm text-gray-600">Create new designs</p>
                </div>
              </Link>
              <Link
                to="/dashboard/orders"
                className="flex items-center p-3 bg-gradient-to-r from-purple-50 to-pink-50 hover:from-purple-100 hover:to-pink-100 rounded-xl transition-all"
              >
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
                  <span className="text-purple-600">📦</span>
                </div>
                <div>
                  <h4 className="font-semibold">My Orders</h4>
                  <p className="text-sm text-gray-600">Track your purchases</p>
                </div>
              </Link>
              <Link
                to="/dashboard/settings"
                className="flex items-center p-3 bg-gradient-to-r from-green-50 to-emerald-50 hover:from-green-100 hover:to-emerald-100 rounded-xl transition-all"
              >
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                  <span className="text-green-600">⚙️</span>
                </div>
                <div>
                  <h4 className="font-semibold">Settings</h4>
                  <p className="text-sm text-gray-600">Account preferences</p>
                </div>
              </Link>
            </div>
          </div>

          {/* AI Insights */}
          {analytics && (
            <div className="bg-gradient-to-br from-cyan-500 to-blue-500 rounded-2xl shadow-xl p-6 text-white">
              <h3 className="text-xl font-bold mb-4">AI Insights</h3>
              <div className="space-y-3">
                <div className="bg-white/10 p-3 rounded-xl">
                  <p className="text-sm opacity-90">Design Efficiency</p>
                  <p className="text-lg font-bold">+87% faster</p>
                  <p className="text-sm opacity-90 mt-1">vs traditional methods</p>
                </div>
                <div className="bg-white/10 p-3 rounded-xl">
                  <p className="text-sm opacity-90">Cost Savings</p>
                  <p className="text-lg font-bold">R 2,140 saved</p>
                  <p className="text-sm opacity-90 mt-1">with AI optimization</p>
                </div>
                <div className="bg-white/10 p-3 rounded-xl">
                  <p className="text-sm opacity-90">Quality Score</p>
                  <p className="text-lg font-bold">9.4/10</p>
                  <p className="text-sm opacity-90 mt-1">AI design quality</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ClientDashboard;
