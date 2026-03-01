const User = require('../models/User');
const Order = require('../models/Order');
const { sendEmail } = require('./email.service');
const OpenAI = require('openai');

class ViralReferralSystem {
  constructor() {
    this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    this.commissionRate = 0.4; // 40% commission (R200 per R500 course)
    this.bonusTiers = [
      { referrals: 5, bonus: 500 },   // R500 bonus
      { referrals: 10, bonus: 1500 }, // R1500 bonus
      { referrals: 20, bonus: 5000 }  // R5000 bonus
    ];
    this.referralLinks = new Map();
  }

  async generateReferralLink(userId) {
    const user = await User.findById(userId);
    if (!user) throw new Error('User not found');

    // Create unique referral code
    const referralCode = `APEX-${userId.toString().substr(-6)}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
    
    // Store referral link
    const referralLink = `${process.env.FRONTEND_URL}/course?ref=${referralCode}`;
    
    this.referralLinks.set(referralCode, {
      userId,
      code: referralCode,
      link: referralLink,
      clicks: 0,
      conversions: 0,
      earnings: 0,
      created: new Date()
    });

    // Update user with referral code
    user.referral = {
      code: referralCode,
      link: referralLink,
      stats: {
        totalReferrals: 0,
        successfulReferrals: 0,
        totalEarnings: 0,
        tier: 0
      }
    };

    await user.save();

    // Generate shareable content for the user
    const shareContent = await this.generateShareContent(user, referralLink);

    return {
      code: referralCode,
      link: referralLink,
      shareContent,
      commission: this.commissionRate * 500, // R200 per sale
      bonusTiers: this.bonusTiers
    };
  }

  async generateShareContent(user, referralLink) {
    const prompt = `Create viral share content for a referral link.

    User: ${user.firstName} ${user.lastName}
    Product: R500 AI Design Mastery Course
    Commission: R200 per sale + bonuses
    Link: ${referralLink}

    Generate:
    1. Twitter thread (5 tweets)
    2. LinkedIn post
    3. Instagram caption
    4. WhatsApp message
    5. Email template

    Make it:
    - Highly engaging
    - Include social proof
    - Create urgency
    - Show earning potential
    - Personalizable`;

    try {
      const response = await this.openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "You create viral referral content that converts at 20%+."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: 1000
      });

      return JSON.parse(response.choices[0].message.content);
    } catch (error) {
      console.error('Failed to generate share content:', error);
      return this.getFallbackShareContent(user, referralLink);
    }
  }

  getFallbackShareContent(user, referralLink) {
    return {
      twitter: `🚀 I just joined the AI Design Mastery course and it's changing everything!

Traditional design: R5,000, 2 weeks
AI design: R500, 60 seconds

I'm already on track to make R50k/month with AI.

Best part? You can earn R200 for every friend who joins through your link!

Get the course here (R500): ${referralLink}

Then share your link to earn R200 per referral + bonuses up to R5,000!

#AIDesign #MakeMoneyOnline #Referral`,
      
      linkedin: `The AI Design Revolution is Here - And You Can Profit From It

I recently enrolled in the AI Design Mastery course (R500) and the results have been incredible.

What surprised me most? The referral program.

For every friend who joins through my link, I earn R200 commission.

With bonuses:
• 5 referrals: +R500 bonus
• 10 referrals: +R1,500 bonus  
• 20 referrals: +R5,000 bonus

That's up to R9,000 in potential earnings just for sharing!

The course itself is transforming careers. Students average R50k/month within 30 days.

If you're in design, marketing, or want to start a side hustle, this is a no-brainer.

Get the course here: ${referralLink}

Then share your link to start earning.

#CareerGrowth #PassiveIncome #DigitalTransformation`,
      
      instagram: `💰 EARN R200 PER REFERRAL

I'm sharing my AI Design Course link and making R200 every time someone joins!

Course: R500 (worth R1,000)
You earn: R200 per referral
Bonuses: Up to R5,000 extra

👇 How it works:
1. Get course through my link: ${referralLink}
2. Get YOUR referral link
3. Share with friends
4. Earn R200 each time they join
5. Get bonuses at 5, 10, 20 referrals

The course itself is insane - people are making R50k/month with AI design.

This is literally free money for sharing.

Comment "LINK" and I'll send you mine!

#PassiveIncome #SideHustle #MakeMoneyOnline`,
      
      whatsapp: `*🚀 AI DESIGN COURSE + EARN R200 PER REFERRAL*

Hey! I found this insane AI Design course for R500 (normally R1,000).

The course teaches AI design that people are using to make R50k/month.

BUT the best part is the referral program:

🎯 *EARN R200 FOR EVERY FRIEND WHO JOINS*
💰 *BONUSES:*
   - 5 referrals: +R500
   - 10 referrals: +R1,500  
   - 20 referrals: +R5,000

*HOW IT WORKS:*
1. Get course through my link: ${referralLink}
2. You get YOUR referral link
3. Share with friends
4. Earn R200 each time they join

This is literally free money for sharing something awesome.

Get it here: ${referralLink}

Then start sharing to earn!`,
      
      email: `Subject: 🔥 Earn R200 for each friend who joins this AI Design course

Hi [Friend's Name],

I wanted to share something that's literally changing lives - and you can earn money just by sharing it.

It's an AI Design Mastery course that normally costs R1,000 but is R500 for a limited time.

What's incredible:
• People are making R50k/month with these AI skills
• The course has a 4.9⭐ rating from 842 students
• 30-day money back guarantee

But here's the best part - the referral program:

💰 *EARN R200 FOR EVERY FRIEND*
🎁 *BONUSES:*
   - 5 friends: +R500
   - 10 friends: +R1,500
   - 20 friends: +R5,000

That's up to R9,000 in potential earnings!

Here's my link: ${referralLink}

Get the course, then share YOUR link with friends.

This is a no-brainer - either you learn AI design skills that can make you R50k/month, or you earn R200+ for each friend who does.

Let me know if you have questions!

Best,
[Your Name]`
    };
  }

  async trackReferralClick(referralCode, ipAddress, userAgent) {
    const referral = this.referralLinks.get(referralCode);
    if (!referral) return null;

    // Track click
    referral.clicks++;
    
    // Store click details
    if (!referral.clicksData) referral.clicksData = [];
    referral.clicksData.push({
      ip: ipAddress,
      userAgent,
      timestamp: new Date()
    });

    this.referralLinks.set(referralCode, referral);

    return {
      referrerId: referral.userId,
      clickCount: referral.clicks
    };
  }

  async processReferralSale(referralCode, purchaserId, amount) {
    const referral = this.referralLinks.get(referralCode);
    if (!referral) return null;

    // Calculate commission
    const commission = amount * this.commissionRate; // R200 for R500 course
    referral.conversions++;
    referral.earnings += commission;

    // Update referrer's stats
    const referrer = await User.findById(referral.userId);
    if (referrer && referrer.referral) {
      referrer.referral.stats.totalReferrals++;
      referrer.referral.stats.successfulReferrals++;
      referrer.referral.stats.totalEarnings += commission;

      // Check for bonus tiers
      const successfulReferrals = referrer.referral.stats.successfulReferrals;
      let bonusEarned = 0;
      
      for (const tier of this.bonusTiers) {
        if (successfulReferrals === tier.referrals) {
          bonusEarned = tier.bonus;
          referrer.referral.stats.totalEarnings += tier.bonus;
          
          // Send bonus notification
          await this.sendBonusNotification(referrer, tier);
          break;
        }
      }

      await referrer.save();

      // Create commission record
      await this.createCommissionRecord({
        referrerId: referral.userId,
        purchaserId,
        referralCode,
        amount,
        commission,
        bonus: bonusEarned,
        totalEarning: commission + bonusEarned
      });

      // Send notifications
      await this.sendCommissionNotification(referrer, commission, bonusEarned);
      await this.sendWelcomeToPurchaser(purchaserId, referral.userId);

      return {
        referrerId: referral.userId,
        commission,
        bonus: bonusEarned,
        totalEarning: commission + bonusEarned,
        totalReferrals: referrer.referral.stats.successfulReferrals
      };
    }

    return null;
  }

  async createCommissionRecord(data) {
    // In production, save to database
    console.log('💰 Commission Record:', data);
    
    // This would be saved to a Commission model
    // await Commission.create(data);
  }

  async sendCommissionNotification(user, commission, bonus) {
    const total = commission + bonus;
    
    await sendEmail({
      email: user.email,
      subject: '💰 You Earned a Commission!',
      template: 'commission-earned',
      data: {
        name: user.firstName,
        commission: commission.toFixed(2),
        bonus: bonus > 0 ? bonus.toFixed(2) : 0,
        total: total.toFixed(2),
        totalReferrals: user.referral?.stats?.successfulReferrals || 0,
        nextBonus: this.getNextBonus(user.referral?.stats?.successfulReferrals || 0)
      }
    });

    // Also send in-app notification
    // This would connect to your notification system
  }

  async sendBonusNotification(user, tier) {
    await sendEmail({
      email: user.email,
      subject: '🎉 BONUS UNLOCKED!',
      template: 'bonus-unlocked',
      data: {
        name: user.firstName,
        tierReferrals: tier.referrals,
        bonusAmount: tier.bonus,
        totalEarnings: user.referral?.stats?.totalEarnings || 0,
        nextTier: this.bonusTiers.find(t => t.referrals > tier.referrals)
      }
    });
  }

  async sendWelcomeToPurchaser(purchaserId, referrerId) {
    const purchaser = await User.findById(purchaserId);
    const referrer = await User.findById(referrerId);

    if (purchaser && referrer) {
      await sendEmail({
        email: purchaser.email,
        subject: '🎓 Welcome to AI Design Mastery!',
        template: 'course-welcome',
        data: {
          name: purchaser.firstName,
          referrerName: referrer.firstName,
          coursePrice: 500,
          courseLink: `${process.env.FRONTEND_URL}/course/dashboard`,
          referralInfo: `You were referred by ${referrer.firstName}. You can now refer friends and earn R200 each!`
        }
      });
    }
  }

  getNextBonus(currentReferrals) {
    for (const tier of this.bonusTiers) {
      if (currentReferrals < tier.referrals) {
        return {
          referralsNeeded: tier.referrals - currentReferrals,
          bonusAmount: tier.bonus
        };
      }
    }
    return null;
  }

  async getLeaderboard(limit = 20) {
    // Get top referrers
    const users = await User.find({
      'referral.stats.successfulReferrals': { $gt: 0 }
    })
    .sort({ 'referral.stats.totalEarnings': -1 })
    .limit(limit)
    .select('firstName lastName avatar referral.stats');

    return users.map((user, index) => ({
      rank: index + 1,
      name: `${user.firstName} ${user.lastName}`,
      avatar: user.avatar,
      referrals: user.referral?.stats?.successfulReferrals || 0,
      earnings: user.referral?.stats?.totalEarnings || 0,
      tier: this.getTier(user.referral?.stats?.successfulReferrals || 0)
    }));
  }

  getTier(referrals) {
    if (referrals >= 20) return 'Diamond';
    if (referrals >= 10) return 'Gold';
    if (referrals >= 5) return 'Silver';
    if (referrals >= 1) return 'Bronze';
    return 'Starter';
  }

  async getReferralStats(userId) {
    const user = await User.findById(userId);
    if (!user || !user.referral) {
      return null;
    }

    const referralData = this.referralLinks.get(user.referral.code);
    
    return {
      code: user.referral.code,
      link: user.referral.link,
      stats: user.referral.stats,
      performance: {
        clickRate: referralData?.clicks > 0 ? (referralData.conversions / referralData.clicks) * 100 : 0,
        conversionRate: referralData?.clicks > 0 ? (referralData.conversions / referralData.clicks) * 100 : 0,
        avgEarningPerClick: referralData?.clicks > 0 ? referralData.earnings / referralData.clicks : 0
      },
      nextBonus: this.getNextBonus(user.referral.stats.successfulReferrals),
      leaderboardRank: await this.getUserRank(userId),
      shareContent: await this.generateShareContent(user, user.referral.link)
    };
  }

  async getUserRank(userId) {
    const leaderboard = await this.getLeaderboard(100); // Get top 100
    const userIndex = leaderboard.findIndex(entry => 
      entry.name.includes((await User.findById(userId))?.firstName || '')
    );
    return userIndex >= 0 ? userIndex + 1 : null;
  }

  async simulateViralGrowth(days = 12) {
    console.log(`📈 Simulating viral growth over ${days} days...`);
    
    // Initial seed users
    let totalUsers = 100;
    let totalSales = 100;
    const kFactor = 1.2; // Each user refers 1.2 others
    
    const dailyStats = [];
    
    for (let day = 1; day <= days; day++) {
      // New referrals from existing users
      const newReferrals = Math.floor(totalUsers * kFactor);
      totalUsers += newReferrals;
      
      // Conversions (40% of referrals buy)
      const newSales = Math.floor(newReferrals * 0.4);
      totalSales += newSales;
      
      // Revenue
      const dailyRevenue = newSales * 500;
      const referralPayouts = newSales * 200;
      const netRevenue = dailyRevenue - referralPayouts;
      
      dailyStats.push({
        day,
        newUsers: newReferrals,
        newSales,
        totalUsers,
        totalSales,
        dailyRevenue,
        referralPayouts,
        netRevenue,
        viralCoefficient: kFactor
      });
      
      // Adjust k-factor based on day (momentum)
      if (day % 3 === 0 && kFactor < 1.5) {
        kFactor += 0.1; // Increase virality every 3 days
      }
    }
    
    console.log(`🎯 Final projection after ${days} days:`);
    console.log(`👥 Total users: ${totalUsers.toLocaleString()}`);
    console.log(`💰 Total sales: ${totalSales.toLocaleString()}`);
    console.log(`📈 Total revenue: R${(totalSales * 500).toLocaleString()}`);
    console.log(`💸 Referral payouts: R${(totalSales * 200).toLocaleString()}`);
    console.log(`💵 Net revenue: R${(totalSales * 300).toLocaleString()}`);
    
    return {
      finalStats: dailyStats[dailyStats.length - 1],
      dailyStats,
      meetsTarget: totalSales >= 3000,
      percentageOfTarget: (totalSales / 3000) * 100
    };
  }
}

// Export singleton
const viralReferral = new ViralReferralSystem();
module.exports = viralReferral;
