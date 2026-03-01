const mongoose = require('mongoose');
const Order = require('../models/Order');
const User = require('../models/User');
const Product = require('../models/Product');
const { sendEmail } = require('./email.service');
const logger = require('../utils/logger');

class RevenueTracker {
  constructor() {
    this.metrics = {
      daily: new Map(),
      weekly: new Map(),
      monthly: new Map(),
      yearly: new Map()
    };
    this.targets = {
      daily: 250, // 250 clients/day to reach 3000 in 12 days
      weekly: 1750,
      monthly: 3000
    };
    this.alerts = [];
  }

  async trackRevenue(order) {
    const now = new Date();
    const dateKey = now.toISOString().split('T')[0];
    const weekKey = this.getWeekKey(now);
    const monthKey = now.toISOString().substring(0, 7);
    const yearKey = now.getFullYear().toString();

    // Update metrics
    this.updateMetric('daily', dateKey, order.total);
    this.updateMetric('weekly', weekKey, order.total);
    this.updateMetric('monthly', monthKey, order.total);
    this.updateMetric('yearly', yearKey, order.total);

    // Track conversion metrics
    await this.trackConversion(order.user, order);

    // Check targets
    await this.checkTargets();

    // Log revenue event
    logger.info(`Revenue tracked: R${order.total} from order ${order.orderId}`);

    return this.getCurrentMetrics();
  }

  updateMetric(period, key, amount) {
    if (!this.metrics[period].has(key)) {
      this.metrics[period].set(key, {
        revenue: 0,
        orders: 0,
        clients: new Set(),
        products: new Map()
      });
    }

    const metric = this.metrics[period].get(key);
    metric.revenue += amount;
    metric.orders += 1;
    metric.clients.add(order.user.toString());

    // Track product revenue
    order.items.forEach(item => {
      const productId = item.product.toString();
      const productRevenue = item.price * item.quantity;
      
      if (!metric.products.has(productId)) {
        metric.products.set(productId, {
          revenue: 0,
          sales: 0,
          quantity: 0
        });
      }

      const productMetric = metric.products.get(productId);
      productMetric.revenue += productRevenue;
      productMetric.sales += 1;
      productMetric.quantity += item.quantity;
    });
  }

  async trackConversion(userId, order) {
    const user = await User.findById(userId);
    
    // Track user lifetime value
    if (!user.stats) user.stats = {};
    if (!user.stats.conversion) {
      user.stats.conversion = {
        firstPurchase: new Date(),
        totalOrders: 0,
        totalSpent: 0,
        averageOrderValue: 0,
        lastPurchase: null
      };
    }

    user.stats.conversion.totalOrders += 1;
    user.stats.conversion.totalSpent += order.total;
    user.stats.conversion.averageOrderValue = 
      user.stats.conversion.totalSpent / user.stats.conversion.totalOrders;
    user.stats.conversion.lastPurchase = new Date();

    // Track acquisition channel
    if (!user.acquisition) {
      user.acquisition = {
        source: order.source || 'direct',
        campaign: order.campaign || null,
        medium: order.medium || 'organic',
        firstTouch: new Date()
      };
    }

    await user.save();

    // Update product conversion rates
    await this.updateProductConversionRates(order.items);
  }

  async updateProductConversionRates(items) {
    for (const item of items) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: {
          salesCount: item.quantity,
          'conversionMetrics.totalRevenue': item.price * item.quantity,
          'conversionMetrics.totalOrders': 1
        }
      });
    }
  }

  async checkTargets() {
    const today = new Date().toISOString().split('T')[0];
    const dailyMetric = this.metrics.daily.get(today);
    
    if (dailyMetric) {
      const clientsToday = dailyMetric.clients.size;
      const target = this.targets.daily;
      
      if (clientsToday < target * 0.5) {
        await this.triggerAlert('critical', `Daily target at risk: ${clientsToday}/${target} clients`);
      } else if (clientsToday >= target) {
        await this.triggerAlert('success', `🎯 Daily target achieved: ${clientsToday} clients!`);
      }
    }

    // Check revenue targets
    const metrics = this.getCurrentMetrics();
    if (metrics.daily.revenue < 125000) { // R125k daily target
      await this.triggerAlert('warning', 'Daily revenue below target');
    }
  }

  async triggerAlert(level, message) {
    const alert = {
      id: Date.now(),
      level,
      message,
      timestamp: new Date(),
      acknowledged: false
    };

    this.alerts.push(alert);

    // Send email for critical alerts
    if (level === 'critical') {
      await sendEmail({
        email: process.env.ADMIN_EMAIL,
        subject: `🚨 Revenue Alert: ${message}`,
        template: 'revenue-alert',
        data: { message, timestamp: new Date().toISOString() }
      });
    }

    logger[level === 'critical' ? 'error' : 'warn'](`Revenue alert: ${message}`);
  }

  getCurrentMetrics() {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const week = this.getWeekKey(now);
    const month = now.toISOString().substring(0, 7);
    const year = now.getFullYear().toString();

    return {
      daily: this.metrics.daily.get(today) || this.createEmptyMetric(),
      weekly: this.metrics.weekly.get(week) || this.createEmptyMetric(),
      monthly: this.metrics.monthly.get(month) || this.createEmptyMetric(),
      yearly: this.metrics.yearly.get(year) || this.createEmptyMetric(),
      targets: this.targets,
      alerts: this.alerts.filter(a => !a.acknowledged)
    };
  }

  getWeekKey(date) {
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
    const pastDaysOfYear = (date - firstDayOfYear) / 86400000;
    return `${date.getFullYear()}-W${Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7)}`;
  }

  createEmptyMetric() {
    return {
      revenue: 0,
      orders: 0,
      clients: new Set(),
      products: new Map()
    };
  }

  async generateRevenueReport(period = 'daily', startDate, endDate) {
    let metrics = [];
    
    switch(period) {
      case 'daily':
        metrics = Array.from(this.metrics.daily.entries())
          .filter(([key]) => !startDate || key >= startDate)
          .filter(([key]) => !endDate || key <= endDate)
          .map(([date, data]) => ({
            date,
            revenue: data.revenue,
            orders: data.orders,
            clients: data.clients.size,
            averageOrderValue: data.revenue / data.orders || 0,
            topProducts: Array.from(data.products.entries())
              .sort((a, b) => b[1].revenue - a[1].revenue)
              .slice(0, 5)
          }));
        break;
      
      case 'weekly':
        metrics = Array.from(this.metrics.weekly.entries())
          .map(([week, data]) => ({
            week,
            revenue: data.revenue,
            orders: data.orders,
            clients: data.clients.size,
            growth: this.calculateGrowth('weekly', week)
          }));
        break;
    }

    return {
      period,
      startDate: startDate || this.getDefaultStartDate(period),
      endDate: endDate || new Date().toISOString().split('T')[0],
      metrics,
      summary: this.calculateSummary(metrics),
      recommendations: await this.generateRecommendations(metrics)
    };
  }

  calculateGrowth(period, currentKey) {
    // Implementation for growth calculation
    return 0;
  }

  calculateSummary(metrics) {
    const totalRevenue = metrics.reduce((sum, m) => sum + m.revenue, 0);
    const totalOrders = metrics.reduce((sum, m) => sum + m.orders, 0);
    const totalClients = metrics.reduce((sum, m) => sum + m.clients, 0);

    return {
      totalRevenue,
      totalOrders,
      totalClients,
      averageOrderValue: totalRevenue / totalOrders || 0,
      conversionRate: totalClients > 0 ? (totalOrders / totalClients) * 100 : 0,
      revenuePerClient: totalClients > 0 ? totalRevenue / totalClients : 0
    };
  }

  async generateRecommendations(metrics) {
    const recommendations = [];
    const summary = this.calculateSummary(metrics);

    // Check conversion rate
    if (summary.conversionRate < 2) {
      recommendations.push({
        type: 'conversion',
        priority: 'high',
        message: 'Low conversion rate detected. Consider implementing exit-intent popups or limited-time offers.',
        action: 'Add urgency triggers to checkout process'
      });
    }

    // Check average order value
    if (summary.averageOrderValue < 1500) {
      recommendations.push({
        type: 'aov',
        priority: 'medium',
        message: 'Average order value below target. Implement upsell strategies.',
        action: 'Add "Frequently bought together" recommendations'
      });
    }

    // Check client acquisition
    const dailyTarget = this.targets.daily;
    const currentClients = summary.totalClients;
    const daysElapsed = metrics.length;
    const projectedClients = (currentClients / daysElapsed) * 30;

    if (projectedClients < this.targets.monthly) {
      recommendations.push({
        type: 'acquisition',
        priority: 'critical',
        message: `Client acquisition rate too low. Need ${this.targets.daily - Math.floor(currentClients/daysElapsed)} more clients/day to reach target.`,
        action: 'Launch aggressive marketing campaign'
      });
    }

    return recommendations;
  }

  getDefaultStartDate(period) {
    const now = new Date();
    switch(period) {
      case 'daily':
        return new Date(now.setDate(now.getDate() - 30)).toISOString().split('T')[0];
      case 'weekly':
        return new Date(now.setDate(now.getDate() - 90)).toISOString().split('T')[0];
      default:
        return new Date(now.setFullYear(now.getFullYear() - 1)).toISOString().split('T')[0];
    }
  }

  // Predict future revenue
  async predictRevenue(days = 30) {
    const dailyMetrics = Array.from(this.metrics.daily.entries())
      .slice(-30) // Last 30 days
      .map(([_, data]) => ({
        revenue: data.revenue,
        clients: data.clients.size
      }));

    if (dailyMetrics.length < 7) {
      return { error: 'Insufficient data for prediction' };
    }

    // Simple moving average prediction
    const avgRevenue = dailyMetrics.reduce((sum, m) => sum + m.revenue, 0) / dailyMetrics.length;
    const avgClients = dailyMetrics.reduce((sum, m) => sum + m.clients, 0) / dailyMetrics.length;
    
    const growthRate = this.calculateGrowthRate(dailyMetrics);
    
    const predictions = [];
    let predictedRevenue = avgRevenue;
    let predictedClients = avgClients;

    for (let i = 1; i <= days; i++) {
      predictedRevenue *= (1 + growthRate.revenue);
      predictedClients *= (1 + growthRate.clients);
      
      predictions.push({
        day: i,
        date: new Date(Date.now() + i * 86400000).toISOString().split('T')[0],
        predictedRevenue: Math.round(predictedRevenue),
        predictedClients: Math.round(predictedClients),
        confidence: Math.max(0.7, 1 - (i * 0.01)) // Confidence decreases over time
      });
    }

    const totalPredictedRevenue = predictions.reduce((sum, p) => sum + p.predictedRevenue, 0);
    const totalPredictedClients = predictions.reduce((sum, p) => sum + p.predictedClients, 0);

    return {
      predictions,
      summary: {
        totalPredictedRevenue,
        totalPredictedClients,
        averageDailyRevenue: totalPredictedRevenue / days,
        averageDailyClients: totalPredictedClients / days,
        growthRate,
        meetsTarget: totalPredictedClients >= this.targets.daily * days
      },
      recommendations: totalPredictedClients < this.targets.daily * days ? 
        ['Increase marketing spend', 'Launch referral program', 'Optimize conversion funnel'] : 
        ['Maintain current strategy', 'Focus on retention']
    };
  }

  calculateGrowthRate(metrics) {
    if (metrics.length < 2) return { revenue: 0.05, clients: 0.05 };

    const first = metrics[0];
    const last = metrics[metrics.length - 1];
    
    const revenueGrowth = (last.revenue - first.revenue) / first.revenue / metrics.length;
    const clientGrowth = (last.clients - first.clients) / first.clients / metrics.length;

    return {
      revenue: Math.max(0.01, Math.min(0.2, revenueGrowth)), // Cap between 1% and 20%
      clients: Math.max(0.01, Math.min(0.15, clientGrowth))  // Cap between 1% and 15%
    };
  }
}

module.exports = new RevenueTracker();
