import openai
from datetime import datetime
from typing import Dict, List, Any
import asyncio

class AICourseSupport:
    """AI support agent for course students"""
    
    def __init__(self, api_key: str):
        openai.api_key = api_key
        self.common_questions = self._load_common_questions()
        self.student_progress = {}
        
    def _load_common_questions(self) -> Dict[str, Any]:
        return {
            "getting_started": {
                "question": "How do I start with AI design?",
                "answer": "Start with Module 1 Lesson 1. Download the AI tools list. Complete the 10-minute setup.",
                "resources": ["tool_list.pdf", "setup_video.mp4"]
            },
            "client_acquisition": {
                "question": "How do I find first clients?",
                "answer": "Use the 3-email system from Module 4. Target local businesses on Facebook. Offer free AI logo audit.",
                "templates": ["email_1.txt", "email_2.txt", "email_3.txt"]
            },
            "pricing": {
                "question": "How much should I charge?",
                "answer": "Start at R500 for logos, R1,500 for brand identity, R3,000 for websites. Double after 5 clients.",
                "calculator": "pricing_calculator.xlsx"
            }
        }
    
    async def answer_student_question(self, student_id: str, question: str) -> Dict[str, Any]:
        """Answer student questions using AI"""
        
        # Check if common question
        for key, data in self.common_questions.items():
            if data["question"].lower() in question.lower():
                return {
                    "type": "common_question",
                    "answer": data["answer"],
                    "resources": data.get("resources", []),
                    "confidence": 0.95
                }
        
        # Use AI for custom questions
        prompt = f"""
        Student Question: {question}
        
        Context: Student is taking AI Design Mastery course.
        Course teaches AI design tools, client acquisition, scaling to R50k/month.
        
        Provide:
        1. Clear, actionable answer
        2. Related course module reference
        3. Additional resources if needed
        4. Encouragement/motivation
        
        Keep it friendly, professional, and helpful.
        """
        
        try:
            response = openai.ChatCompletion.create(
                model="gpt-4",
                messages=[
                    {"role": "system", "content": "You are an expert AI design coach helping students succeed."},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=500
            )
            
            answer = response.choices[0].message.content
            
            # Track student progress
            await self.track_student_interaction(student_id, question, answer)
            
            return {
                "type": "ai_response",
                "answer": answer,
                "confidence": 0.85,
                "timestamp": datetime.now().isoformat()
            }
            
        except Exception as e:
            return {
                "type": "error",
                "answer": "I'll get back to you shortly with a detailed answer!",
                "error": str(e)
            }
    
    async def track_student_interaction(self, student_id: str, question: str, answer: str):
        """Track student interactions for personalized support"""
        
        if student_id not in self.student_progress:
            self.student_progress[student_id] = {
                "questions_asked": 0,
                "last_active": datetime.now(),
                "common_topics": [],
                "success_rate": 0
            }
        
        self.student_progress[student_id]["questions_asked"] += 1
        self.student_progress[student_id]["last_active"] = datetime.now()
        
        # Analyze question topic
        topics = self._analyze_question_topic(question)
        self.student_progress[student_id]["common_topics"].extend(topics)
    
    def _analyze_question_topic(self, question: str) -> List[str]:
        """Analyze question topic"""
        topics = []
        
        if any(word in question.lower() for word in ["client", "customer", "sell"]):
            topics.append("client_acquisition")
        if any(word in question.lower() for word in ["price", "charge", "cost"]):
            topics.append("pricing")
        if any(word in question.lower() for word in ["tool", "software", "app"]):
            topics.append("tools")
        if any(word in question.lower() for word in ["logo", "brand", "design"]):
            topics.append("design")
        if any(word in question.lower() for word in ["money", "income", "revenue"]):
            topics.append("earnings")
        
        return topics
    
    async def generate_personalized_checkin(self, student_id: str) -> Dict[str, Any]:
        """Generate personalized check-in message"""
        
        if student_id not in self.student_progress:
            return self._get_general_checkin()
        
        profile = self.student_progress[student_id]
        days_since_active = (datetime.now() - profile["last_active"]).days
        
        # Analyze common topics
        from collections import Counter
        topic_counts = Counter(profile["common_topics"])
        most_common_topic = topic_counts.most_common(1)[0][0] if topic_counts else "getting_started"
        
        prompt = f"""
        Generate personalized check-in for student.
        
        Student Profile:
        - Questions asked: {profile['questions_asked']}
        - Days since active: {days_since_active}
        - Most common topic: {most_common_topic}
        
        Create:
        1. Friendly greeting
        2. Progress acknowledgement
        3. Encouragement based on their journey
        4. Suggestion for next step
        5. Motivational closing
        
        Tone: Supportive, encouraging, professional.
        """
        
        try:
            response = openai.ChatCompletion.create(
                model="gpt-4",
                messages=[
                    {"role": "system", "content": "You are a motivational coach helping students achieve success."},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=300
            )
            
            message = response.choices[0].message.content
            
            return {
                "personalized": True,
                "message": message,
                "next_step": self._get_next_step(most_common_topic, days_since_active),
                "resources": self._get_topic_resources(most_common_topic)
            }
            
        except Exception as e:
            return self._get_general_checkin()
    
    def _get_general_checkin(self) -> Dict[str, Any]:
        """Get general check-in message"""
        return {
            "personalized": False,
            "message": "Hope you're enjoying the AI Design Mastery course! Remember to complete one lesson each day. Consistency is key to reaching R50k/month!",
            "next_step": "Complete next module lesson",
            "resources": ["course_schedule.pdf"]
        }
    
    def _get_next_step(self, topic: str, days_inactive: int) -> str:
        """Get next step recommendation"""
        
        if days_inactive > 7:
            return "Re-watch Module 1 to rebuild momentum"
        elif topic == "client_acquisition":
            return "Send 10 outreach emails using our templates"
        elif topic == "pricing":
            return "Raise your prices by 20% for next client"
        elif topic == "tools":
            return "Master one new AI tool this week"
        else:
            return "Complete next course module"
    
    def _get_topic_resources(self, topic: str) -> List[str]:
        """Get resources for topic"""
        
        resources = {
            "client_acquisition": ["client_email_templates.zip", "lead_finding_guide.pdf"],
            "pricing": ["pricing_calculator.xlsx", "value_based_pricing.mp4"],
            "tools": ["ai_tools_cheatsheet.pdf", "tool_tutorial_playlist.txt"],
            "design": ["design_principles.pdf", "color_palette_generator.html"],
            "earnings": ["income_tracker.xlsx", "scaling_playbook.pdf"]
        }
        
        return resources.get(topic, ["course_syllabus.pdf"])
    
    async def generate_success_story(self, student_data: Dict[str, Any]) -> str:
        """Generate success story from student data"""
        
        prompt = f"""
        Create inspiring success story from student data:
        
        Student: {student_data.get('name', 'Student')}
        Background: {student_data.get('background', 'Designer')}
        Starting Point: {student_data.get('starting_point', 'No AI experience')}
        Results: {student_data.get('results', 'Increased income')}
        Timeframe: {student_data.get('timeframe', '30 days')}
        
        Make it:
        - Inspiring and motivational
        - Include specific numbers
        - Show transformation
        - Mention course value
        - Encourage others
        
        Format: Social media post (300-400 words)
        """
        
        try:
            response = openai.ChatCompletion.create(
                model="gpt-4",
                messages=[
                    {"role": "system", "content": "You create viral success stories that inspire action."},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=500
            )
            
            return response.choices[0].message.content
            
        except Exception as e:
            return f"{student_data.get('name', 'Student')} went from {student_data.get('starting_point', 'nothing')} to {student_data.get('results', 'success')} in {student_data.get('timeframe', '30 days')} using AI Design Mastery!"
