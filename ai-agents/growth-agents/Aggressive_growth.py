import asyncio
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional
import aiohttp
import json
from dataclasses import dataclass, field
from enum import Enum
import pandas as pd
import numpy as np
from sklearn.linear_model import LinearRegression

class GrowthTactic(Enum):
    VIRAL_LOOPS = "viral_loops"
    SCARCITY = "scarcity"
    SOCIAL_PROOF = "social_proof"
    FOMO = "fomo"
    URGENCY = "urgency"
    RECIPROCITY = "reciprocity"
    AUTHORITY = "authority"
    LOSS_AVERSION = "loss_aversion"

@dataclass
class GrowthTarget:
    total_clients: int = 3000
    days: int = 12
    daily_target: int = field(init=False)
    start_date: datetime = field(default_factory=datetime.now)
    
    def __post_init__(self):
        self.daily_target = self.total_clients // self.days
        
    def get_progress(self, current_clients: int) -> Dict[str, Any]:
        days_elapsed = (datetime.now() - self.start_date).days
        expected_clients = self.daily_target * days_elapsed
        percentage = (current_clients / self.total_clients) * 100
        on_track = current_clients >= expected_clients
        
        return {
            "current": current_clients,
            "target": self.total_clients,
            "percentage": percentage,
            "days_elapsed": days_elapsed,
            "days_remaining": self.days - days_elapsed,
            "needed_per_day": max(0, (self.total_clients - current_clients) / max(1, self.days - days_elapsed)),
            "on_track": on_track,
            "expected": expected_clients,
            "variance": current_clients - expected_clients
        }

class AggressiveGrowthAgent:
    """AI agent designed to acquire 3000 paying clients in 12 days"""
    
    def __init__(self, api_keys: Dict[str, str]):
        self.api_keys = api_keys
        self.target = GrowthTarget()
        self.tactics = self._initialize_tactics()
        self.campaigns = []
        self.conversion_data = []
        self.budget = 50000  # R50,000 marketing budget
        self.budget_spent = 0
        
    def _initialize_tactics(self) -> Dict[GrowthTactic, Dict[str, Any]]:
        """Initialize growth tactics with success probabilities"""
        return {
            GrowthTactic.VIRAL_LOOPS: {
                "name": "Viral Referral Loops",
                "description": "Users get R200 credit for each friend who signs up and makes a purchase",
                "cost_per_acquisition": 200,
                "expected_conversion": 0.15,
                "scale_factor": 1.8,
                "resources_needed": ["landing_page", "referral_tracking", "reward_system"],
                "execution_time": 2  # days
            },
            GrowthTactic.SCARCITY: {
                "name": "Limited Time Bonuses",
                "description": "First 100 signups each day get free AI credit upgrades",
                "cost_per_acquisition": 50,
                "expected_conversion": 0.25,
                "scale_factor": 1.2,
                "resources_needed": ["countdown_timer", "limited_offer_ui", "notification_system"],
                "execution_time": 1
            },
            GrowthTactic.SOCIAL_PROOF: {
                "name": "Social Proof Overload",
                "description": "Real-time notifications of purchases, testimonials, trust badges",
                "cost_per_acquisition": 30,
                "expected_conversion": 0.18,
                "scale_factor": 1.5,
                "resources_needed": ["live_notifications", "testimonial_wall", "trust_badges"],
                "execution_time": 1
            },
            GrowthTactic.FOMO: {
                "name": "FOMO Triggers",
                "description": "Show users what they're missing with competitor comparisons",
                "cost_per_acquisition": 40,
                "expected_conversion": 0.22,
                "scale_factor": 1.3,
                "resources_needed": ["competitor_comparison", "feature_highlight", "urgency_timers"],
                "execution_time": 2
            }
        }
    
    async def launch_campaign(self, tactic: GrowthTactic, intensity: float = 1.0) -> Dict[str, Any]:
        """Launch a growth campaign"""
        
        tactic_config = self.tactics[tactic]
        
        # Calculate expected results
        budget = min(10000, self.budget - self.budget_spent)  # Max R10,000 per campaign
        expected_acquisitions = int((budget / tactic_config["cost_per_acquisition"]) * 
                                  tactic_config["expected_conversion"] * intensity)
        
        campaign = {
            "id": f"campaign_{datetime.now().timestamp()}",
            "tactic": tactic.value,
            "name": tactic_config["name"],
            "launch_date": datetime.now(),
            "budget": budget,
            "expected_acquisitions": expected_acquisitions,
            "intensity": intensity,
            "status": "active",
            "metrics": {
                "impressions": 0,
                "clicks": 0,
                "signups": 0,
                "conversions": 0,
                "cost": 0,
                "roi": 0
            }
        }
        
        self.campaigns.append(campaign)
        self.budget_spent += budget
        
        # Execute campaign
        await self._execute_campaign(campaign, tactic_config)
        
        return campaign
    
    async def _execute_campaign(self, campaign: Dict[str, Any], tactic_config: Dict[str, Any]):
        """Execute the growth campaign"""
        
        if campaign["tactic"] == GrowthTactic.VIRAL_LOOPS.value:
            await self._launch_viral_loops(campaign)
        elif campaign["tactic"] == GrowthTactic.SCARCITY.value:
            await self._launch_scarcity_campaign(campaign)
        elif campaign["tactic"] == GrowthTactic.SOCIAL_PROOF.value:
            await self._launch_social_proof_campaign(campaign)
        elif campaign["tactic"] == GrowthTactic.FOMO.value:
            await self._launch_fomo_campaign(campaign)
    
    async def _launch_viral_loops(self, campaign: Dict[str, Any]):
        """Launch viral referral loops"""
        
        # 1. Create referral program
        referral_program = {
            "reward_amount": 200,  # R200 credit
            "reward_type": "credit",
            "minimum_purchase": 500,  # Friend must spend R500
            "max_referrals_per_user": 10,
            "expiry_days": 30
        }
        
        # 2. Setup tracking
        tracking_url = f"https://apexdigital.studio/ref/{campaign['id']}"
        
        # 3. Create shareable assets
        share_assets = [
            "pre-made social media posts",
            "email templates",
            "WhatsApp message templates",
            "LinkedIn posts"
        ]
        
        # 4. Launch
        campaign["details"] = {
            "referral_program": referral_program,
            "tracking_url": tracking_url,
            "share_assets": share_assets,
            "launch_channels": ["email", "in-app", "social_media", "sms"]
        }
        
        print(f"🚀 Launched viral referral campaign: {campaign['name']}")
        print(f"💰 Reward: R{referral_program['reward_amount']} per successful referral")
        print(f"🔗 Tracking URL: {tracking_url}")
    
    async def _launch_scarcity_campaign(self, campaign: Dict[str, Any]):
        """Launch scarcity campaign"""
        
        # 1. Create limited offers
        limited_offers = [
            {
                "name": "First 100 Daily Bonus",
                "description": "First 100 signups today get 500 bonus AI credits",
                "quantity": 100,
                "reset_daily": True,
                "bonus_amount": 500
            },
            {
                "name": "Founder's Discount",
                "description": "50% off for first 500 customers",
                "quantity": 500,
                "discount_percent": 50,
                "one_time": True
            }
        ]
        
        # 2. Setup countdown timers
        countdowns = [
            {
                "id": "daily_reset",
                "duration_hours": 24,
                "message": "Daily bonuses reset in",
                "reset_action": "refresh_offers"
            },
            {
                "id": "founder_offer",
                "duration_hours": 48,
                "message": "Founder's discount ends in",
                "reset_action": "remove_offer"
            }
        ]
        
        campaign["details"] = {
            "limited_offers": limited_offers,
            "countdown_timers": countdowns,
            "urgency_level": "high"
        }
        
        print(f"⏰ Launched scarcity campaign: {campaign['name']}")
        print(f"🎁 Offers: {len(limited_offers)} limited offers")
        print(f"⏱️ Timers: {len(countdowns)} active countdowns")
    
    async def _launch_social_proof_campaign(self, campaign: Dict[str, Any]):
        """Launch social proof campaign"""
        
        # 1. Real-time notifications
        realtime_notifications = {
            "enabled": True,
            "types": ["purchases", "signups", "designs_created"],
            "frequency": "high",
            "anonymize": True,
            "template": "{user} from {location} just {action}"
        }
        
        # 2. Testimonial wall
        testimonials = {
            "source": "verified_customers",
            "min_rating": 4.5,
            "display": "rotating_carousel",
            "update_frequency": "hourly"
        }
        
        # 3. Trust badges
        trust_badges = [
            "3000+ Designs Created",
            "24/7 AI Support",
            "100% Money Back Guarantee",
            "Featured in Tech Magazine",
            "4.9⭐ Average Rating"
        ]
        
        campaign["details"] = {
            "realtime_notifications": realtime_notifications,
            "testimonials": testimonials,
            "trust_badges": trust_badges
        }
        
        print(f"👥 Launched social proof campaign: {campaign['name']}")
        print(f"🔔 Real-time notifications: {realtime_notifications['types']}")
        print(f"🏆 Trust badges: {len(trust_badges)} badges displayed")
    
    async def _launch_fomo_campaign(self, campaign: Dict[str, Any]):
        """Launch FOMO campaign"""
        
        # 1. Competitor comparison
        competitors = [
            {
                "name": "Traditional Design Agency",
                "price": "R5,000+",
                "timeline": "2-4 weeks",
                "revisions": "2-3 included",
                "advantage": "We're 10x faster & 90% cheaper"
            },
            {
                "name": "Freelancer",
                "price": "R1,500-3,000",
                "timeline": "1-2 weeks",
                "revisions": "Extra charges",
                "advantage": "Unlimited revisions, AI-powered"
            },
            {
                "name": "DIY Tools",
                "price": "R500/month",
                "timeline": "Hours-days",
                "revisions": "Unlimited",
                "advantage": "Professional quality, no learning curve"
            }
        ]
        
        # 2. Feature highlights
        feature_highlights = [
            {
                "feature": "AI Design Generation",
                "benefit": "Get 5 professional designs in 60 seconds",
                "competitor_has": False
            },
            {
                "feature": "Unlimited Revisions",
                "benefit": "Make unlimited changes at no extra cost",
                "competitor_has": False
            },
            {
                "feature": "24/7 AI Support",
                "benefit": "Instant help anytime",
                "competitor_has": False
            }
        ]
        
        campaign["details"] = {
            "competitor_comparison": competitors,
            "feature_highlights": feature_highlights,
            "fomo_triggers": [
                "Show similar designs others are buying",
                "Display limited stock warnings",
                "Show popular items trending now"
            ]
        }
        
        print(f"🔥 Launched FOMO campaign: {campaign['name']}")
        print(f"📊 Competitor comparisons: {len(competitors)} competitors")
        print(f"💡 Feature highlights: {len(feature_highlights)} unique advantages")
    
    async def track_conversion(self, user_id: str, action: str, value: float = 0):
        """Track conversion events"""
        
        conversion = {
            "user_id": user_id,
            "action": action,
            "value": value,
            "timestamp": datetime.now(),
            "campaign_id": self._get_active_campaign_id(),
            "attribution": self._get_attribution_data()
        }
        
        self.conversion_data.append(conversion)
        
        # Update campaign metrics
        if conversion["campaign_id"]:
            campaign = self._get_campaign_by_id(conversion["campaign_id"])
            if campaign:
                if action == "signup":
                    campaign["metrics"]["signups"] += 1
                elif action == "purchase":
                    campaign["metrics"]["conversions"] += 1
                    campaign["metrics"]["cost"] += value * 0.3  # Assume 30% CPA
                    campaign["metrics"]["roi"] = (
                        campaign["metrics"]["conversions"] * 1500 /  # Avg order value R1500
                        max(1, campaign["metrics"]["cost"])
                    )
    
    def _get_active_campaign_id(self) -> Optional[str]:
        """Get currently active campaign ID"""
        active_campaigns = [c for c in self.campaigns if c["status"] == "active"]
        return active_campaigns[0]["id"] if active_campaigns else None
    
    def _get_campaign_by_id(self, campaign_id: str) -> Optional[Dict[str, Any]]:
        """Get campaign by ID"""
        for campaign in self.campaigns:
            if campaign["id"] == campaign_id:
                return campaign
        return None
    
    def _get_attribution_data(self) -> Dict[str, Any]:
        """Get attribution data for conversion"""
        return {
            "source": "direct",  # Would be populated from tracking
            "medium": "organic",
            "campaign": "growth_push",
            "channel": "web"
        }
    
    async def optimize_campaigns(self):
        """Optimize running campaigns based on performance"""
        
        for campaign in self.campaigns:
            if campaign["status"] != "active":
                continue
            
            metrics = campaign["metrics"]
            expected = campaign["expected_acquisitions"]
            actual = metrics["conversions"]
            
            # Calculate performance
            if metrics["cost"] > 0:
                cpa = metrics["cost"] / max(1, actual)
                roi = metrics["roi"]
                
                # Optimization rules
                if cpa > self.tactics[GrowthTactic(campaign["tactic"])]["cost_per_acquisition"] * 1.5:
                    # CPA too high - reduce intensity
                    campaign["intensity"] *= 0.7
                    print(f"📉 Reducing intensity for {campaign['name']} (CPA too high)")
                
                elif roi < 1.5:
                    # ROI too low - adjust targeting
                    campaign["intensity"] *= 0.8
                    print(f"📉 Reducing intensity for {campaign['name']} (ROI too low)")
                
                elif actual < expected * 0.5:
                    # Underperforming - consider switching tactics
                    print(f"⚠️ Campaign underperforming: {campaign['name']}")
                    print(f"   Expected: {expected}, Actual: {actual}")
                    
                    # If 3 days underperforming, kill campaign
                    days_running = (datetime.now() - campaign["launch_date"]).days
                    if days_running >= 3 and actual < expected * 0.3:
                        campaign["status"] = "terminated"
                        print(f"❌ Terminating campaign: {campaign['name']}")
    
    async def predict_acquisitions(self, days: int = 5) -> Dict[str, Any]:
        """Predict future acquisitions"""
        
        if len(self.conversion_data) < 3:
            return {"error": "Insufficient data for prediction"}
        
        # Prepare data
        df = pd.DataFrame([
            {
                "day": i,
                "conversions": len([c for c in self.conversion_data 
                                  if (datetime.now() - c["timestamp"]).days == i])
            }
            for i in range(7)
        ])
        
        if df.empty:
            return {"error": "No conversion data"}
        
        # Train model
        X = df[["day"]].values
        y = df["conversions"].values
        
        if len(X) < 2:
            return {"error": "Not enough data points"}
        
        model = LinearRegression()
        model.fit(X, y)
        
        # Predict next days
        future_days = np.array([[i] for i in range(7, 7 + days)])
        predictions = model.predict(future_days)
        
        # Calculate if target will be met
        total_predicted = sum(predictions)
        progress = self.target.get_progress(len(self.conversion_data))
        remaining_days = self.target.days - progress["days_elapsed"]
        
        total_needed = self.target.total_clients - progress["current"]
        daily_needed = total_needed / max(1, remaining_days)
        
        predicted_meets_target = total_predicted >= (daily_needed * days)
        
        return {
            "predictions": [
                {
                    "day": i + 1,
                    "predicted_conversions": int(max(0, pred)),
                    "date": (datetime.now() + timedelta(days=i)).strftime("%Y-%m-%d")
                }
                for i, pred in enumerate(predictions)
            ],
            "summary": {
                "total_predicted": int(total_predicted),
                "daily_average": int(total_predicted / days),
                "needed_daily": int(daily_needed),
                "on_track": predicted_meets_target,
                "confidence": min(0.9, len(self.conversion_data) / 100)  # More data = more confidence
            },
            "recommendations": self._generate_recommendations(predicted_meets_target, daily_needed)
        }
    
    def _generate_recommendations(self, on_track: bool, daily_needed: float) -> List[str]:
        """Generate recommendations based on predictions"""
        
        if on_track:
            return [
                "✅ Maintain current strategy",
                "📈 Increase budget allocation to best-performing campaigns",
                "🔄 Test one new growth channel per week",
                "🌟 Focus on customer retention and upsells"
            ]
        else:
            recommendations = [
                "🚨 URGENT: Need to increase acquisition rate",
                f"📊 Currently need {int(daily_needed)} clients/day but getting less",
                "💰 Increase marketing budget by 50%",
                "🎯 Launch emergency referral bonus program (R500 per referral)",
                "🔥 Run 48-hour flash sale with 60% discount",
                "📱 Launch aggressive social media ad campaign",
                "🤝 Partner with influencers in design/tech space",
                "📧 Send urgent email campaign to waitlist (5000+ emails)"
            ]
            
            if daily_needed > 300:
                recommendations.append("⚡ EXTREME: Offer 1-month free trial to first 1000 signups")
                recommendations.append("🎁 Give R1000 credit to anyone who refers 3 friends")
            
            return recommendations
    
    async def generate_growth_report(self) -> Dict[str, Any]:
        """Generate comprehensive growth report"""
        
        progress = self.target.get_progress(len([c for c in self.conversion_data if c["action"] == "purchase"]))
        
        active_campaigns = [c for c in self.campaigns if c["status"] == "active"]
        completed_campaigns = [c for c in self.campaigns if c["status"] in ["completed", "terminated"]]
        
        # Calculate overall metrics
        total_spent = sum(c["budget"] for c in self.campaigns)
        total_conversions = sum(c["metrics"]["conversions"] for c in self.campaigns)
        total_revenue = total_conversions * 1500  # Assume R1500 average order
        
        overall_roi = (total_revenue - total_spent) / max(1, total_spent)
        
        # Best performing tactic
        tactic_performance = {}
        for campaign in self.campaigns:
            tactic = campaign["tactic"]
            if tactic not in tactic_performance:
                tactic_performance[tactic] = {
                    "spent": 0,
                    "conversions": 0,
                    "cpa": 0
                }
            tactic_performance[tactic]["spent"] += campaign["budget"]
            tactic_performance[tactic]["conversions"] += campaign["metrics"]["conversions"]
        
        for tactic in tactic_performance:
            data = tactic_performance[tactic]
            data["cpa"] = data["spent"] / max(1, data["conversions"])
        
        best_tactic = min(tactic_performance.items(), 
                         key=lambda x: x[1]["cpa"] if x[1]["conversions"] > 0 else float('inf'))
        
        return {
            "timestamp": datetime.now().isoformat(),
            "target_progress": progress,
            "budget": {
                "total": self.budget,
                "spent": self.budget_spent,
                "remaining": self.budget - self.budget_spent,
                "utilization": (self.budget_spent / self.budget) * 100
            },
            "campaigns": {
                "active": len(active_campaigns),
                "completed": len(completed_campaigns),
                "total": len(self.campaigns)
            },
            "performance": {
                "total_conversions": total_conversions,
                "total_revenue": total_revenue,
                "total_spent": total_spent,
                "roi": overall_roi,
                "cpa": total_spent / max(1, total_conversions),
                "best_performing_tactic": {
                    "name": best_tactic[0],
                    "cpa": best_tactic[1]["cpa"],
                    "conversions": best_tactic[1]["conversions"]
                }
            },
            "predictions": await self.predict_acquisitions(5),
            "urgent_actions": self._get_urgent_actions(progress),
            "next_steps": self._get_next_steps(progress)
        }
    
    def _get_urgent_actions(self, progress: Dict[str, Any]) -> List[str]:
        """Get urgent actions needed"""
        
        actions = []
        
        if progress["variance"] < -50:
            actions.append(f"🚨 CRITICAL: {abs(progress['variance'])} clients behind schedule!")
            actions.append("💰 Double marketing budget immediately")
            actions.append("🎯 Launch emergency referral program")
        
        if progress["days_remaining"] <= 3 and not progress["on_track"]:
            actions.append("⏰ FINAL PUSH: Only 3 days left!")
            actions.append("🔥 Launch 72-hour mega sale")
            actions.append("📧 Email entire database with extreme urgency")
        
        if self.budget_spent > self.budget * 0.8:
            actions.append("💸 Budget running low - consider additional funding")
        
        return actions
    
    def _get_next_steps(self, progress: Dict[str, Any]) -> List[str]:
        """Get next steps"""
        
        steps = []
        
        if progress["on_track"]:
            steps.append("✅ Continue current strategy")
            steps.append("📈 Scale best-performing campaigns by 30%")
            steps.append("🔄 Test one new growth tactic")
        else:
            steps.append("📊 Analyze underperforming campaigns")
            steps.append("🎯 Reallocate budget to better tactics")
            steps.append("🚀 Launch new acquisition channels")
        
        # Always do these
        steps.append("📈 Optimize conversion funnel weekly")
        steps.append("👥 Nurture existing leads daily")
        steps.append("📊 Review metrics every 6 hours")
        
        return steps

# Example usage
async def main():
    # Initialize growth agent
    agent = AggressiveGrowthAgent({
        "facebook": "your_fb_token",
        "google": "your_google_token",
        "email": "your_email_service_key"
    })
    
    print(f"🎯 Target: {agent.target.total_clients} clients in {agent.target.days} days")
    print(f"📅 Daily target: {agent.target.daily_target} clients/day")
    
    # Launch multiple campaigns
    campaigns = []
    for tactic in [GrowthTactic.VIRAL_LOOPS, GrowthTactic.SCARCITY, 
                  GrowthTactic.SOCIAL_PROOF, GrowthTactic.FOMO]:
        campaign = await agent.launch_campaign(tactic, intensity=1.0)
        campaigns.append(campaign)
        print(f"\nLaunched: {campaign['name']}")
        print(f"Budget: R{campaign['budget']}")
        print(f"Expected: {campaign['expected_acquisitions']} clients")
    
    # Simulate some conversions
    for i in range(100):
        await agent.track_conversion(f"user_{i}", "signup")
        if i % 3 == 0:  # Every 3rd user converts
            await agent.track_conversion(f"user_{i}", "purchase", 1500)
    
    # Optimize campaigns
    await agent.optimize_campaigns()
    
    # Get predictions
    predictions = await agent.predict_acquisitions(5)
    print(f"\n📈 Predictions for next 5 days:")
    for pred in predictions.get("predictions", []):
        print(f"  Day {pred['day']}: {pred['predicted_conversions']} clients")
    
    # Generate report
    report = await agent.generate_growth_report()
    print(f"\n📊 Growth Report:")
    print(f"  Progress: {report['target_progress']['percentage']:.1f}%")
    print(f"  On track: {report['target_progress']['on_track']}")
    print(f"  Budget used: {report['budget']['utilization']:.1f}%")
    
    # Show urgent actions
    if report['urgent_actions']:
        print(f"\n🚨 URGENT ACTIONS NEEDED:")
        for action in report['urgent_actions']:
            print(f"  • {action}")

if __name__ == "__main__":
    asyncio.run(main())
