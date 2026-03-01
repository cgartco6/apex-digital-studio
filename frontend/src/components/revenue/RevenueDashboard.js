import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  LineChart, Line, BarChart, Bar, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import { TrendingUp, Users, DollarSign, Target, AlertTriangle, CheckCircle } from 'lucide-react';

const RevenueDashboard = () => {
  const [timeframe, setTimeframe] = useState('7d');
  const [revenueData, setRevenueData] = useState([]);
  const [conversionData, setConversionData] = useState([]);
  const [metrics, setMetrics] = useState({});
  const [alerts, setAlerts] = useState([]);
  const [predictions, setPredictions] = useState([]);
  const [targetProgress, setTargetProgress] = useState(0);

  useEffect(() => {
    fetchRevenueData();
    fetchPredictions();
  }, [timeframe]);

  const fetchRevenueData = async () => {
    // Mock data - in production, fetch from API
    const mockRevenueData = [
      { date: 'Day 1', revenue: 45000, clients: 120, target: 250 },
      { date: 'Day 2', revenue: 52000, clients: 145, target: 250 },
      { date: 'Day 3', revenue: 48000, clients: 130, target: 250 },
      { date: 'Day 4', revenue: 61000, clients: 170, target: 250 },
      { date: 'Day 5', revenue: 55000, clients: 155, target: 250 },
      { date: 'Day 6', revenue: 72000, clients: 210, target: 250 },
      { date: 'Day 7', revenue: 68000, clients: 195, target: 250 },
    ];

    const mockConversionData = [
      { source: 'Direct', conversions: 45, revenue: 22500 },
      { source: 'Social', conversions: 32, revenue: 16000 },
      { source: 'Google', conversions: 28, revenue: 14000 },
      { source: 'Referral', conversions: 19, revenue: 9500 },
      { source: 'Email', conversions: 12, revenue: 6000 },
    ];

    const totalClients = mockRevenueData.reduce((sum, day) => sum + day.clients, 0);
    const totalRevenue = mockRevenueData.reduce((sum, day) => sum + day.revenue, 0);
    const targetProgress = (totalClients / 3000) * 100;

    setRevenueData(mockRevenueData);
    setConversionData(mockConversionData);
    setTargetProgress(targetProgress);
    
    setMetrics({
      totalRevenue,
      totalClients,
      averageOrderValue: 1499,
      conversionRate: 3.2,
      dailyTarget: 250,
      daysRemaining: 12 - mockRevenueData.length,
      neededPerDay: Math.ceil((3000 - totalClients) / Math.max(1, 12 - mockRevenueData.length))
    });

    setAlerts([
      {
        id: 1,
        level: 'warning',
        message: 'Day 6 below target - need 40 more clients',
        timestamp: '2 hours ago'
      },
      {
        id: 2,
        level: 'info',
        message: 'Social media campaign performing 35% above average',
        timestamp: '1 day ago'
      }
    ]);
  };

  const fetchPredictions = async () => {
    const mockPredictions = [
      { day: 'D+8', predictedClients: 240, confidence: 0.85 },
      { day: 'D+9', predictedClients: 255, confidence: 0.82 },
      { day: 'D+10', predictedClients: 265, confidence: 0.78 },
      { day: 'D+11', predictedClients: 280, confidence: 0.75 },
      { day: 'D+12', predictedClients: 295, confidence: 0.72 },
    ];
    setPredictions(mockPredictions);
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  return (
    <div className="space-y-6">
      {/* Target Progress */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl p-6 text-white">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-2xl font-bold">🎯 3000 Clients in 12 Days</h2>
            <p className="opacity-90">Aggressive growth campaign</p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold">{Math.round(targetProgress)}%</div>
            <div className="text-sm opacity-90">Progress</div>
          </div>
        </div>
        
        <div className="mb-4">
          <div className="flex justify-between text-sm mb-2">
            <span>Current: {metrics.totalClients || 0} clients</span>
            <span>Target: 3000 clients</span>
          </div>
          <div className="w-full bg-white/30 rounded-full h-4">
            <motion.div
              className="bg-green-400 h-4 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${targetProgress}%` }}
              transition={{ duration: 1 }}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white/10 p-3 rounded-xl">
            <div className="text-sm opacity-90">Days Left</div>
            <div className="text-xl font-bold">{metrics.daysRemaining || 0}</div>
          </div>
          <div className="bg-white/10 p-3 rounded-xl">
            <div className="text-sm opacity-90">Needed/Day</div>
            <div className="text-xl font-bold">{metrics.neededPerDay || 0}</div>
          </div>
          <div className="bg-white/10 p-3 rounded-xl">
            <div className="text-sm opacity-90">Daily Target</div>
            <div className="text-xl font-bold">{metrics.dailyTarget || 0}</div>
          </div>
          <div className="bg-white/10 p-3 rounded-xl">
            <div className="text-sm opacity-90">On Track?</div>
            <div className="text-xl font-bold">
              {targetProgress >= (revenueData.length / 12) * 100 ? '✅ Yes' : '❌ No'}
            </div>
          </div>
        </div>
      </div>

      {/* Main Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div
          whileHover={{ scale: 1.05 }}
          className="bg-white rounded-2xl shadow-xl p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Revenue</p>
              <p className="text-3xl font-bold">R {metrics.totalRevenue?.toLocaleString() || '0'}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <div className="mt-4 text-sm text-green-600 flex items-center">
            <TrendingUp className="w-4 h-4 mr-1" />
            +24.5% from last period
          </div>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.05 }}
          className="bg-white rounded-2xl shadow-xl p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Clients</p>
              <p className="text-3xl font-bold">{metrics.totalClients?.toLocaleString() || '0'}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <div className="mt-4 text-sm text-blue-600 flex items-center">
            <TrendingUp className="w-4 h-4 mr-1" />
            {metrics.neededPerDay || 0} more per day needed
          </div>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.05 }}
          className="bg-white rounded-2xl shadow-xl p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Avg Order Value</p>
              <p className="text-3xl font-bold">R {metrics.averageOrderValue?.toLocaleString() || '0'}</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-full">
              <Target className="w-6 h-6 text-purple-600" />
            </div>
          </div>
          <div className="mt-4 text-sm text-purple-600">
            Target: R 1,500
          </div>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.05 }}
          className="bg-white rounded-2xl shadow-xl p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Conversion Rate</p>
              <p className="text-3xl font-bold">{metrics.conversionRate || '0'}%</p>
            </div>
            <div className="p-3 bg-orange-100 rounded-full">
              <TrendingUp className="w-6 h-6 text-orange-600" />
            </div>
          </div>
          <div className="mt-4 text-sm text-orange-600">
            Industry avg: 2.5%
          </div>
        </motion.div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue & Clients Trend */}
        <div className="bg-white rounded-2xl shadow-xl p-6">
          <h3 className="text-xl font-bold mb-6">Daily Performance</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Legend />
                <Area
                  yAxisId="left"
                  type="monotone"
                  dataKey="revenue"
                  stroke="#8884d8"
                  fill="#8884d8"
                  fillOpacity={0.3}
                  name="Revenue (R)"
                />
                <Area
                  yAxisId="right"
                  type="monotone"
                  dataKey="clients"
                  stroke="#82ca9d"
                  fill="#82ca9d"
                  fillOpacity={0.3}
                  name="Clients"
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="target"
                  stroke="#ff7300"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  name="Daily Target"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Conversion Sources */}
        <div className="bg-white rounded-2xl shadow-xl p-6">
          <h3 className="text-xl font-bold mb-6">Conversion Sources</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={conversionData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="revenue"
                >
                  {conversionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`R ${value.toLocaleString()}`, 'Revenue']} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Predictions & Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Predictions */}
        <div className="bg-white rounded-2xl shadow-xl p-6">
          <h3 className="text-xl font-bold mb-6">📈 5-Day Predictions</h3>
          <div className="space-y-4">
            {predictions.map((prediction) => (
              <div key={prediction.day} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                <div className="flex items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-3 ${
                    prediction.predictedClients >= 250 ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                  }`}>
                    {prediction.day}
                  </div>
                  <div>
                    <div className="font-semibold">{prediction.predictedClients} predicted clients</div>
                    <div className="text-sm text-gray-600">
                      Confidence: {(prediction.confidence * 100).toFixed(0)}%
                    </div>
                  </div>
                </div>
                <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                  prediction.predictedClients >= 250 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {prediction.predictedClients >= 250 ? 'On Track' : 'Below Target'}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Alerts */}
        <div className="bg-white rounded-2xl shadow-xl p-6">
          <h3 className="text-xl font-bold mb-6 flex items-center">
            <AlertTriangle className="w-6 h-6 mr-2 text-orange-500" />
            Active Alerts
          </h3>
          <div className="space-y-4">
            {alerts.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-2" />
                <p>All systems go! No alerts.</p>
              </div>
            ) : (
              alerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`p-4 rounded-xl border-l-4 ${
                    alert.level === 'critical'
                      ? 'bg-red-50 border-red-500'
                      : alert.level === 'warning'
                      ? 'bg-orange-50 border-orange-500'
                      : 'bg-blue-50 border-blue-500'
                  }`}
                >
                  <div className="flex justify-between">
                    <h4 className="font-semibold">{alert.message}</h4>
                    <span className="text-sm text-gray-600">{alert.timestamp}</span>
                  </div>
                  <div className="mt-2">
                    <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                      View details →
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Action Recommendations */}
      <div className="bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl shadow-xl p-6 text-white">
        <h3 className="text-xl font-bold mb-6">🚀 Growth Actions Needed</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white/10 p-4 rounded-xl">
            <div className="text-lg font-bold mb-2">1. Boost Acquisition</div>
            <p className="text-sm opacity-90">Launch Google Ads campaign targeting "logo design" keywords</p>
            <div className="mt-3">
              <span className="text-xs bg-white/20 px-2 py-1 rounded">Est. cost: R5,000</span>
              <span className="text-xs bg-white/20 px-2 py-1 rounded ml-2">Est. ROI: 320%</span>
            </div>
          </div>
          <div className="bg-white/10 p-4 rounded-xl">
            <div className="text-lg font-bold mb-2">2. Improve Conversion</div>
            <p className="text-sm opacity-90">Add exit-intent popup with 20% discount offer</p>
            <div className="mt-3">
              <span className="text-xs bg-white/20 px-2 py-1 rounded">Implementation: 2 hours</span>
              <span className="text-xs bg-white/20 px-2 py-1 rounded ml-2">Expected lift: +15%</span>
            </div>
          </div>
          <div className="bg-white/10 p-4 rounded-xl">
            <div className="text-lg font-bold mb-2">3. Increase AOV</div>
            <p className="text-sm opacity-90">Add "Frequently bought together" bundles</p>
            <div className="mt-3">
              <span className="text-xs bg-white/20 px-2 py-1 rounded">Dev time: 1 day</span>
              <span className="text-xs bg-white/20 px-2 py-1 rounded ml-2">Expected AOV increase: +R300</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RevenueDashboard;
