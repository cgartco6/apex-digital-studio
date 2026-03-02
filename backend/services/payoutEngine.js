const cron = require('node-cron');
const Order = require('../models/Order');
const PayoutAccount = require('../models/PayoutAccount');
const WeeklyPayout = require('../models/WeeklyPayout');
const PayoutTransaction = require('../models/PayoutTransaction');
const { performBankTransfer } = require('./bankingApi'); // mock or actual
const logger = require('../utils/logger');

class PayoutEngine {
  constructor() {
    // Schedule weekly payout every Monday at 00:05 (after week ends)
    cron.schedule('5 0 * * 1', () => {
      this.runWeeklyPayout();
    });
    logger.info('PayoutEngine scheduled: every Monday 00:05');
  }

  async runWeeklyPayout(week = null) {
    try {
      // Determine week: if not provided, use last week
      const { weekString, startDate, endDate } = this.getWeekDates(week);
      
      logger.info(`Starting weekly payout for week ${weekString}`);

      // Check if already processed
      const existing = await WeeklyPayout.findOne({ week: weekString });
      if (existing) {
        logger.warn(`Week ${weekString} already processed. Skipping.`);
        return;
      }

      // Fetch all completed orders within date range that are not yet payoutProcessed
      const orders = await Order.find({
        paymentStatus: 'completed',
        orderStatus: 'completed',
        payoutProcessed: false,
        createdAt: { $gte: startDate, $lt: endDate }
      });

      if (orders.length === 0) {
        logger.info(`No orders for week ${weekString}. Creating empty payout record.`);
        await WeeklyPayout.create({
          week: weekString,
          startDate,
          endDate,
          totalRevenue: 0,
          allocations: [],
          retainedAmount: 0,
          status: 'completed',
          processedAt: new Date()
        });
        return;
      }

      // Calculate total revenue (sum of total)
      const totalRevenue = orders.reduce((sum, o) => sum + o.total, 0);
      logger.info(`Total revenue for week ${weekString}: R${totalRevenue}`);

      // Load payout accounts (active)
      const accounts = await PayoutAccount.find({ isActive: true });
      if (accounts.length === 0) {
        logger.error('No active payout accounts configured');
        throw new Error('No active payout accounts');
      }

      // Verify percentages sum to 90% (since 10% retained)
      const totalPercentage = accounts.reduce((sum, a) => sum + a.percentage, 0);
      if (Math.abs(totalPercentage - 90) > 0.01) {
        logger.error(`Payout accounts total percentage ${totalPercentage}% != 90%`);
        throw new Error('Payout accounts must sum to 90%');
      }

      // Allocate amounts
      const allocations = [];
      for (const acc of accounts) {
        const amount = (totalRevenue * acc.percentage) / 100;
        allocations.push({
          account: acc._id,
          amount,
          percentage: acc.percentage,
          status: 'pending'
        });
      }
      const retainedAmount = totalRevenue * 0.1; // 10% stays in platform

      // Create WeeklyPayout record
      const weeklyPayout = await WeeklyPayout.create({
        week: weekString,
        startDate,
        endDate,
        totalRevenue,
        allocations,
        retainedAmount,
        status: 'processing',
        processedAt: new Date()
      });

      // Process each allocation via bank transfer
      for (let i = 0; i < allocations.length; i++) {
        const alloc = allocations[i];
        const account = accounts.find(a => a._id.equals(alloc.account));
        
        // Create transaction record
        const transaction = await PayoutTransaction.create({
          weeklyPayout: weeklyPayout._id,
          account: account._id,
          amount: alloc.amount,
          status: 'processing'
        });

        try {
          // Perform actual bank transfer (mock)
          const result = await performBankTransfer({
            amount: alloc.amount,
            accountNumber: account.accountNumber,
            bank: account.bank,
            branchCode: account.branchCode,
            beneficiary: account.beneficiaryName,
            reference: `ApexPayout-${weekString}`
          });

          // Update transaction
          transaction.status = 'completed';
          transaction.completedAt = new Date();
          transaction.transactionId = result.transactionId;
          transaction.bankReference = result.reference;
          await transaction.save();

          // Update allocation in weeklyPayout
          weeklyPayout.allocations[i].status = 'completed';
          weeklyPayout.allocations[i].transactionId = result.transactionId;
        } catch (err) {
          logger.error(`Payout to ${account.name} failed:`, err);
          transaction.status = 'failed';
          transaction.errorMessage = err.message;
          await transaction.save();

          weeklyPayout.allocations[i].status = 'failed';
          weeklyPayout.allocations[i].errorMessage = err.message;
        }
      }

      // Update weeklyPayout overall status
      const allCompleted = weeklyPayout.allocations.every(a => a.status === 'completed');
      weeklyPayout.status = allCompleted ? 'completed' : 'failed';
      if (allCompleted) weeklyPayout.completedAt = new Date();
      await weeklyPayout.save();

      // Mark orders as payout processed
      await Order.updateMany(
        { _id: { $in: orders.map(o => o._id) } },
        { payoutProcessed: true, payoutWeek: weekString }
      );

      logger.info(`Weekly payout for ${weekString} completed. Status: ${weeklyPayout.status}`);
    } catch (error) {
      logger.error('Error in weekly payout:', error);
    }
  }

  getWeekDates(week = null) {
    // If week is provided in format 'YYYY-Www', parse it
    // Otherwise, use last week (Monday to Sunday)
    const now = new Date();
    const day = now.getDay(); // 0 Sunday, 1 Monday, ...
    const diffToMonday = (day === 0 ? 6 : day - 1); // days to subtract to get Monday
    const lastMonday = new Date(now);
    lastMonday.setDate(now.getDate() - diffToMonday - 7); // last week Monday
    const lastSunday = new Date(lastMonday);
    lastSunday.setDate(lastMonday.getDate() + 6);

    const year = lastMonday.getFullYear();
    const weekNumber = this.getWeekNumber(lastMonday);
    const weekString = `${year}-W${weekNumber.toString().padStart(2, '0')}`;

    return {
      weekString,
      startDate: lastMonday,
      endDate: lastSunday
    };
  }

  getWeekNumber(date) {
    const d = new Date(date);
    d.setHours(0,0,0,0);
    d.setDate(d.getDate() + 3 - (d.getDay() + 6) % 7);
    const week1 = new Date(d.getFullYear(), 0, 4);
    return 1 + Math.round(((d - week1) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7);
  }

  // Manual trigger (admin)
  async triggerManualPayout(week = null) {
    return this.runWeeklyPayout(week);
  }

  // Get payout history
  async getPayoutHistory(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const payouts = await WeeklyPayout.find()
      .sort({ week: -1 })
      .skip(skip)
      .limit(limit)
      .populate('allocations.account', 'name bank');
    const total = await WeeklyPayout.countDocuments();
    return { payouts, total };
  }
}

// Mock banking API (replace with actual integration)
async function performBankTransfer(details) {
  // In production, integrate with PayFast, Ozow, or bank API
  logger.info(`Simulating bank transfer: R${details.amount} to ${details.accountNumber}`);
  // Simulate success/failure randomly for testing
  if (Math.random() < 0.05) throw new Error('Bank transfer failed (simulated)');
  return {
    transactionId: `TX${Date.now()}`,
    reference: details.reference
  };
}

module.exports = new PayoutEngine();
