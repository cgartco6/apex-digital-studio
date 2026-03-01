import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  AreaChart, Area, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from 'recharts';

const AdminDashboard = () => {
  const [timeframe, setTimeframe] = useState('7d');
  const [stats, setStats] = useState({
    revenue: 0,
    orders: 0,
    users: 0,
    designs: 0,
    growth: 0,
    conversion: 0
  });
  const [recentOrders, setRecentOrders] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [aiPerformance, setAiPerformance] = useState([]);
  const [systemHealth, setSystemHealth] = useState({});

  useEffect(() => {
    fetchDashboardData();
  }, [timeframe]);

  const fetchDashboardData = async () => {
    // Mock data - in production, this would be API calls
    setStats({
      revenue: 85420,
      orders: 324,
      users: 1289,
      designs: 5421,
      growth: 24.5,
      conversion: 3.2
    });

    setRecentOrders([
      { id: 'ORD-12345', customer: 'John Smith', amount: 2499, status: 'completed', date: '2024-01-15' },
      { id: 'ORD-12346', customer: 'Sarah Johnson', amount: 1599, status: 'processing', date: '2024-01-15' },
      { id: 'ORD-12347', customer: 'Mike Wilson', amount: 3299, status: 'designing', date: '2024-01-14' },
      { id: 'ORD-12348', customer: 'Emma Davis', amount: 899, status: 'pending', date: '2024-01-14' },
      { id: 'ORD-12349', customer: 'David Brown', amount: 2199, status: 'completed', date: '2024-01-13' }
    ]);

    setTopProducts([
      { name: 'Logo Design Pro', sales: 142, revenue: 35480 },
      { name: 'Brand Identity', sales: 89, revenue: 44500 },
      { name: 'Website Design', sales: 67, revenue: 46900 },
      { name: 'Social Media Kit', sales: 121, revenue: 24200 },
      { name: 'Business Cards', sales: 234, revenue: 11700 }
    ]);

    setAiPerformance([
      { month: 'Jan', successRate: 95, speed: 87, quality: 92, efficiency: 94 },
      { month: 'Feb', successRate: 96, speed: 89, quality: 93, efficiency: 95 },
      { month: 'Mar', successRate: 97, speed: 91, quality: 94, efficiency: 96 },
      { month: 'Apr', successRate: 96, speed: 90, quality: 95, efficiency: 95 },
      { month: 'May', successRate: 98, speed: 92, quality: 96, efficiency: 97 }
    ]);

    setSystemHealth({
      cpu: 65,
      memory: 78,
      storage: 42,
      network: 91,
      agents: 4,
      uptime: '99.97%'
    });
  };

  const revenueData = [
    { date: 'Jan 1', revenue: 12000 },
    { date: 'Jan 2', revenue: 19000 },
    { date: 'Jan 3', revenue: 15000 },
    { date: 'Jan 4', revenue: 22000 },
    { date: 'Jan 5', revenue: 18000 },
    { date: 'Jan 6', revenue: 25000 },
    { date: 'Jan 7', revenue: 21000 }
  ];

  const categoryData = [
    { name: 'Logo Design', value: 35, color: '#8884d8' },
    { name: 'Web Design', value: 25, color: '#82ca9d' },
    { name: 'Print', value: 20, color: '#ffc658' },
    { name: 'Branding', value: 15, color: '#ff8042' },
    { name: 'Social Media', value: 5, color: '#0088fe' }
  ];

  const agentPerformance = [
    { subject: 'Success Rate', A: 98, fullMark: 100 },
    { subject: 'Speed', A: 92, fullMark: 100 },
    { subject: 'Quality', A: 96, fullMark: 100 },
    { subject: 'Efficiency', A: 94, fullMark: 100 },
    { subject: 'Accuracy', A: 97, fullMark: 100 }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-8">
      {/* Header */}
      <div className="mb-8">
        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl font-bold text-gray-900 mb-2"
        >
          Admin Dashboard
        </motion.h1>
        <div className="flex flex-col md:flex-row md:items-center justify-between">
          <p className="text-gray-600 mb-4 md:mb-0">
            Real-time insights and AI performance monitoring
          </p>
          <div className="flex items-center space-x-4">
            <select
              value={timeframe}
              onChange={(e) => setTimeframe(e.target.value)}
              className="border border-gray-300 rounded-lg px-4 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="24h">Last 24 Hours</option>
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
              <option value="90d">Last 90 Days</option>
              <option value="1y">Last Year</option>
            </select>
            <button className="bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-bold py-2 px-6 rounded-lg hover:opacity-90 transition-opacity">
              Export Report
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[
          { title: 'Total Revenue', value: `R ${stats.revenue.toLocaleString()}`, change: '+24.5%', icon: '💰', color: 'from-green-500 to-emerald-500' },
          { title: 'Orders', value: stats.orders.toLocaleString(), change: '+18.2%', icon: '📦', color: 'from-blue-500 to-cyan-500' },
          { title: 'Active Users', value: stats.users.toLocaleString(), change: '+12.7%', icon: '👥', color: 'from-purple-500 to-pink-500' },
          { title: 'AI Designs', value: stats.designs.toLocaleString(), change: '+42.3%', icon: '🤖', color: 'from-orange-500 to-red-500' }
        ].map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`bg-gradient-to-br ${stat.color} rounded-2xl p-6 text-white shadow-xl`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">{stat.title}</p>
                <p className="text-3xl font-bold mt-2">{stat.value}</p>
                <p className="text-sm opacity-90 mt-2">
                  <span className="text-green-300">↑ {stat.change}</span> from last period
                </p>
              </div>
              <div className="text-4xl">{stat.icon}</div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Main Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Revenue Chart */}
        <div className="bg-white rounded-2xl shadow-xl p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold">Revenue Overview</h3>
            <div className="flex items-center space-x-2">
              <span className="w-3 h-3 rounded-full bg-blue-500"></span>
              <span className="text-sm text-gray-600">Revenue</span>
            </div>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" stroke="#666" />
                <YAxis stroke="#666" />
                <Tooltip />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#8884d8"
                  fill="#8884d8"
                  fillOpacity={0.3}
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Distribution */}
        <div className="bg-white rounded-2xl shadow-xl p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold">Category Distribution</h3>
            <div className="text-sm text-gray-600">By revenue</div>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Bottom Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Orders */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl shadow-xl p-6 mb-8">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold">Recent Orders</h3>
              <button className="text-blue-600 hover:text-blue-800 font-medium">
                View All →
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Order ID</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Customer</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Amount</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Status</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Date</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map((order) => (
                    <tr key={order.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4 font-medium">{order.id}</td>
                      <td className="py-3 px-4">{order.customer}</td>
                      <td className="py-3 px-4 font-bold">R {order.amount}</td>
                      <td className="py-3 px-4">
                        <span className={`px-3 py-1 rounded-full text-sm ${order.status === 'completed'
                            ? 'bg-green-100 text-green-800'
                            : order.status === 'processing'
                              ? 'bg-blue-100 text-blue-800'
                              : order.status === 'designing'
                                ? 'bg-purple-100 text-purple-800'
                                : 'bg-yellow-100 text-yellow-800'
                          }`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-600">{order.date}</td>
                      <td className="py-3 px-4">
                        <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* AI Performance */}
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <h3 className="text-xl font-bold mb-6">AI Agent Performance</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={agentPerformance}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="subject" />
                  <PolarRadiusAxis />
                  <Radar
                    name="Performance"
                    dataKey="A"
                    stroke="#8884d8"
                    fill="#8884d8"
                    fillOpacity={0.6}
                  />
                  <Legend />
                  <Tooltip />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-8">
          {/* System Health */}
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <h3 className="text-xl font-bold mb-6">System Health</h3>
            <div className="space-y-4">
              {[
                { label: 'CPU Usage', value: systemHealth.cpu, color: 'blue' },
                { label: 'Memory Usage', value: systemHealth.memory, color: 'purple' },
                { label: 'Storage Usage', value: systemHealth.storage, color: 'green' },
                { label: 'Network Uptime', value: systemHealth.network, color: 'orange' }
              ].map((item) => (
                <div key={item.label}>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700">{item.label}</span>
                    <span className="text-sm font-bold">{item.value}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${item.color === 'blue' ? 'bg-blue-500' :
                          item.color === 'purple' ? 'bg-purple-500' :
                            item.color === 'green' ? 'bg-green-500' :
                              'bg-orange-500'
                        }`}
                      style={{ width: `${item.value}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold">{systemHealth.agents}</div>
                  <div className="text-sm text-gray-600">AI Agents</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{systemHealth.uptime}</div>
                  <div className="text-sm text-gray-600">Uptime</div>
                </div>
              </div>
            </div>
          </div>

          {/* Top Products */}
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <h3 className="text-xl font-bold mb-6">Top Products</h3>
            <div className="space-y-4">
              {topProducts.map((product, index) => (
                <div key={product.name} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center text-white font-bold mr-3">
                      {index + 1}
                    </div>
                    <div>
                      <div className="font-medium">{product.name}</div>
                      <div className="text-sm text-gray-600">{product.sales} sales</div>
                    </div>
                  </div>
                  <div className="font-bold">R {product.revenue.toLocaleString()}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-gradient-to-br from-gray-900 to-black rounded-2xl shadow-xl p-6 text-white">
            <h3 className="text-xl font-bold mb-6">Quick Actions</h3>
            <div className="space-y-3">
              <button className="w-full bg-white/10 hover:bg-white/20 p-3 rounded-xl text-left transition-all">
                <div className="flex items-center">
                  <span className="text-xl mr-3">🚀</span>
                  <div>
                    <div className="font-semibold">Launch AI Training</div>
                    <div className="text-sm text-gray-300">Train new AI models</div>
                  </div>
                </div>
              </button>
              <button className="w-full bg-white/10 hover:bg-white/20 p-3 rounded-xl text-left transition-all">
                <div className="flex items-center">
                  <span className="text-xl mr-3">📊</span>
                  <div>
                    <div className="font-semibold">Generate Reports</div>
                    <div className="text-sm text-gray-300">Create business insights</div>
                  </div>
                </div>
              </button>
              <button className="w-full bg-white/10 hover:bg-white/20 p-3 rounded-xl text-left transition-all">
                <div className="flex items-center">
                  <span className="text-xl mr-3">⚙️</span>
                  <div>
                    <div className="font-semibold">System Settings</div>
                    <div className="text-sm text-gray-300">Configure AI agents</div>
                  </div>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
