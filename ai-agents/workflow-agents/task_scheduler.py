import asyncio
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
from enum import Enum
import heapq
from dataclasses import dataclass, field
import json

class TaskPriority(Enum):
    CRITICAL = 0
    HIGH = 1
    MEDIUM = 2
    LOW = 3

class TaskStatus(Enum):
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"

@dataclass(order=True)
class ScheduledTask:
    priority: int
    scheduled_time: datetime
    task_id: str = field(compare=False)
    task_type: str = field(compare=False)
    data: Dict[str, Any] = field(compare=False)
    callback_url: Optional[str] = field(compare=False)
    retries: int = field(default=0, compare=False)
    max_retries: int = field(default=3, compare=False)
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "task_id": self.task_id,
            "task_type": self.task_type,
            "priority": TaskPriority(self.priority).name,
            "scheduled_time": self.scheduled_time.isoformat(),
            "data": self.data,
            "callback_url": self.callback_url,
            "retries": self.retries,
            "max_retries": self.max_retries
        }

class AITaskScheduler:
    """Intelligent task scheduler for AI design workflows"""
    
    def __init__(self):
        self.task_queue = []
        self.running_tasks = {}
        self.task_history = []
        self.ai_agents = self._initialize_ai_agents()
        self.resource_pool = self._initialize_resources()
        
    def _initialize_ai_agents(self) -> Dict[str, Dict[str, Any]]:
        """Initialize AI agents with their capabilities"""
        return {
            "design_generator": {
                "capabilities": ["logo_design", "brand_identity", "web_design"],
                "max_concurrent": 5,
                "current_load": 0,
                "avg_completion_time": 300,  # 5 minutes
                "success_rate": 0.95
            },
            "design_optimizer": {
                "capabilities": ["design_analysis", "optimization", "color_correction"],
                "max_concurrent": 10,
                "current_load": 0,
                "avg_completion_time": 180,  # 3 minutes
                "success_rate": 0.98
            },
            "content_generator": {
                "capabilities": ["text_generation", "copywriting", "tagline_creation"],
                "max_concurrent": 15,
                "current_load": 0,
                "avg_completion_time": 120,  # 2 minutes
                "success_rate": 0.97
            },
            "workflow_manager": {
                "capabilities": ["task_coordination", "resource_allocation", "deadline_management"],
                "max_concurrent": 20,
                "current_load": 0,
                "avg_completion_time": 60,  # 1 minute
                "success_rate": 0.99
            }
        }
    
    def _initialize_resources(self) -> Dict[str, Dict[str, Any]]:
        """Initialize system resources"""
        return {
            "gpu": {
                "total": 4,
                "allocated": 0,
                "required_for": ["design_generation", "image_processing"]
            },
            "memory": {
                "total": 32,  # GB
                "allocated": 0,
                "required_for": ["large_designs", "batch_processing"]
            },
            "storage": {
                "total": 1000,  # GB
                "allocated": 0,
                "required_for": ["file_uploads", "design_storage"]
            },
            "bandwidth": {
                "total": 1000,  # Mbps
                "allocated": 0,
                "required_for": ["api_calls", "file_transfers"]
            }
        }
    
    def schedule_task(self, 
                     task_type: str, 
                     data: Dict[str, Any],
                     priority: TaskPriority = TaskPriority.MEDIUM,
                     scheduled_time: Optional[datetime] = None,
                     callback_url: Optional[str] = None) -> str:
        """Schedule a new task"""
        
        task_id = f"task_{datetime.now().timestamp()}_{hash(json.dumps(data))}"
        
        if scheduled_time is None:
            scheduled_time = datetime.now()
        
        task = ScheduledTask(
            priority=priority.value,
            scheduled_time=scheduled_time,
            task_id=task_id,
            task_type=task_type,
            data=data,
            callback_url=callback_url
        )
        
        # Push to priority queue
        heapq.heappush(self.task_queue, task)
        
        # Log task scheduling
        self._log_task_event(task_id, "scheduled", {
            "task_type": task_type,
            "priority": priority.name,
            "scheduled_time": scheduled_time.isoformat()
        })
        
        return task_id
    
    def schedule_design_workflow(self, 
                               design_brief: Dict[str, Any],
                               client_id: str,
                               deadline: datetime) -> List[str]:
        """Schedule a complete design workflow"""
        
        tasks = []
        
        # 1. Analyze design brief
        analysis_task_id = self.schedule_task(
            task_type="brief_analysis",
            data={
                "brief": design_brief,
                "client_id": client_id,
                "deadline": deadline.isoformat()
            },
            priority=TaskPriority.HIGH
        )
        tasks.append(analysis_task_id)
        
        # 2. Generate design concepts (3 variations)
        for i in range(3):
            concept_task_id = self.schedule_task(
                task_type="design_generation",
                data={
                    "brief": design_brief,
                    "variation": i + 1,
                    "depends_on": analysis_task_id
                },
                priority=TaskPriority.HIGH,
                scheduled_time=datetime.now() + timedelta(minutes=5)  # Wait for analysis
            )
            tasks.append(concept_task_id)
        
        # 3. Optimize selected design
        optimization_task_id = self.schedule_task(
            task_type="design_optimization",
            data={
                "depends_on": concept_task_id,
                "client_feedback": None  # Will be updated later
            },
            priority=TaskPriority.MEDIUM,
            scheduled_time=deadline - timedelta(hours=2)
        )
        tasks.append(optimization_task_id)
        
        # 4. Generate marketing content
        content_task_id = self.schedule_task(
            task_type="content_generation",
            data={
                "design_id": optimization_task_id,
                "content_type": "marketing_copy"
            },
            priority=TaskPriority.LOW,
            scheduled_time=deadline - timedelta(hours=1)
        )
        tasks.append(content_task_id)
        
        # 5. Quality assurance
        qa_task_id = self.schedule_task(
            task_type="quality_assurance",
            data={
                "design_id": optimization_task_id,
                "content_id": content_task_id
            },
            priority=TaskPriority.HIGH,
            scheduled_time=deadline - timedelta(minutes=30)
        )
        tasks.append(qa_task_id)
        
        return tasks
    
    async def process_tasks(self):
        """Process scheduled tasks"""
        while True:
            if self.task_queue:
                # Get next task
                task = heapq.heappop(self.task_queue)
                
                # Check if it's time to execute
                if task.scheduled_time <= datetime.now():
                    # Check resource availability
                    if self._check_resources(task.task_type):
                        # Execute task
                        await self._execute_task(task)
                    else:
                        # Requeue with delay
                        task.scheduled_time = datetime.now() + timedelta(seconds=30)
                        heapq.heappush(self.task_queue, task)
                else:
                    # Requeue for later
                    heapq.heappush(self.task_queue, task)
            
            # Sleep to prevent CPU overuse
            await asyncio.sleep(1)
    
    async def _execute_task(self, task: ScheduledTask):
        """Execute a task"""
        
        task_id = task.task_id
        self.running_tasks[task_id] = task
        
        try:
            self._log_task_event(task_id, "started", {
                "agent": task.task_type,
                "resources": self._get_required_resources(task.task_type)
            })
            
            # Allocate resources
            self._allocate_resources(task.task_type)
            
            # Execute based on task type
            result = await self._execute_task_by_type(task)
            
            # Update AI agent metrics
            self._update_agent_metrics(task.task_type, True)
            
            # Free resources
            self._free_resources(task.task_type)
            
            # Mark as completed
            self._complete_task(task_id, result)
            
            # Callback if specified
            if task.callback_url:
                await self._send_callback(task.callback_url, result)
            
        except Exception as e:
            # Handle failure
            self._handle_task_failure(task, str(e))
    
    async def _execute_task_by_type(self, task: ScheduledTask) -> Dict[str, Any]:
        """Execute specific task type"""
        
        task_type = task.task_type
        data = task.data
        
        if task_type == "design_generation":
            return await self._execute_design_generation(data)
        elif task_type == "design_optimization":
            return await self._execute_design_optimization(data)
        elif task_type == "content_generation":
            return await self._execute_content_generation(data)
        elif task_type == "brief_analysis":
            return await self._execute_brief_analysis(data)
        elif task_type == "quality_assurance":
            return await self._execute_quality_assurance(data)
        else:
            raise ValueError(f"Unknown task type: {task_type}")
    
    async def _execute_design_generation(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Execute design generation task"""
        # This would integrate with your design generator
        return {
            "status": "completed",
            "design_url": "https://example.com/design.png",
            "variations": 3,
            "generation_time": 180  # seconds
        }
    
    async def _execute_design_optimization(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Execute design optimization task"""
        # This would integrate with your design optimizer
        return {
            "status": "completed",
            "optimized_url": "https://example.com/optimized.png",
            "improvements": ["color_correction", "contrast_enhancement", "size_optimization"],
            "optimization_time": 120  # seconds
        }
    
    async def _execute_content_generation(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Execute content generation task"""
        # This would integrate with your content generator
        return {
            "status": "completed",
            "content": "Professional marketing copy for your design",
            "taglines": ["Innovative Design", "Creative Excellence"],
            "generation_time": 60  # seconds
        }
    
    async def _execute_brief_analysis(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Execute design brief analysis"""
        # This would use AI to analyze the design brief
        return {
            "status": "completed",
            "analysis": {
                "complexity": "medium",
                "estimated_time": 3600,  # seconds
                "required_resources": ["gpu", "memory"],
                "recommended_styles": ["modern", "minimal"],
                "suggested_color_palettes": ["corporate", "tech"]
            },
            "analysis_time": 45  # seconds
        }
    
    async def _execute_quality_assurance(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Execute quality assurance task"""
        # This would check design quality
        return {
            "status": "completed",
            "quality_score": 9.2,
            "issues_found": [],
            "recommendations": ["Add alternative text", "Optimize file size"],
            "qa_time": 90  # seconds
        }
    
    def _check_resources(self, task_type: str) -> bool:
        """Check if resources are available for task"""
        required_resources = self._get_required_resources(task_type)
        
        for resource, amount in required_resources.items():
            if self.resource_pool[resource]["allocated"] + amount > self.resource_pool[resource]["total"]:
                return False
        
        # Check AI agent availability
        agent = self._get_agent_for_task(task_type)
        if agent["current_load"] >= agent["max_concurrent"]:
            return False
        
        return True
    
    def _allocate_resources(self, task_type: str):
        """Allocate resources for task"""
        required_resources = self._get_required_resources(task_type)
        
        for resource, amount in required_resources.items():
            self.resource_pool[resource]["allocated"] += amount
        
        # Update agent load
        agent = self._get_agent_for_task(task_type)
        agent["current_load"] += 1
    
    def _free_resources(self, task_type: str):
        """Free resources after task completion"""
        required_resources = self._get_required_resources(task_type)
        
        for resource, amount in required_resources.items():
            self.resource_pool[resource]["allocated"] -= amount
        
        # Update agent load
        agent = self._get_agent_for_task(task_type)
        agent["current_load"] -= 1
    
    def _get_required_resources(self, task_type: str) -> Dict[str, int]:
        """Get required resources for task type"""
        # This would be more sophisticated in production
        resource_map = {
            "design_generation": {"gpu": 1, "memory": 8, "storage": 5},
            "design_optimization": {"gpu": 1, "memory": 4, "storage": 2},
            "content_generation": {"memory": 2, "storage": 1},
            "brief_analysis": {"memory": 2},
            "quality_assurance": {"memory": 2}
        }
        
        return resource_map.get(task_type, {"memory": 1})
    
    def _get_agent_for_task(self, task_type: str) -> Dict[str, Any]:
        """Get appropriate AI agent for task"""
        for agent_name, agent_config in self.ai_agents.items():
            if task_type in agent_config["capabilities"]:
                return agent_config
        
        # Default to workflow manager
        return self.ai_agents["workflow_manager"]
    
    def _update_agent_metrics(self, task_type: str, success: bool):
        """Update AI agent performance metrics"""
        agent = self._get_agent_for_task(task_type)
        
        if success:
            agent["success_rate"] = (agent["success_rate"] * 0.95) + (0.05 * 1)
        else:
            agent["success_rate"] = (agent["success_rate"] * 0.95) + (0.05 * 0)
    
    def _complete_task(self, task_id: str, result: Dict[str, Any]):
        """Mark task as completed"""
        task = self.running_tasks.pop(task_id, None)
        if task:
            self.task_history.append({
                "task_id": task_id,
                "status": "completed",
                "result": result,
                "completed_at": datetime.now().isoformat(),
                "task_data": task.to_dict()
            })
            
            self._log_task_event(task_id, "completed", result)
    
    def _handle_task_failure(self, task: ScheduledTask, error: str):
        """Handle task failure with retry logic"""
        task_id = task.task_id
        task.retries += 1
        
        self._log_task_event(task_id, "failed", {
            "error": error,
            "retry": f"{task.retries}/{task.max_retries}"
        })
        
        if task.retries < task.max_retries:
            # Retry with exponential backoff
            backoff_time = timedelta(seconds=2 ** task.retries * 30)
            task.scheduled_time = datetime.now() + backoff_time
            heapq.heappush(self.task_queue, task)
            
            self._log_task_event(task_id, "retry_scheduled", {
                "next_attempt": task.scheduled_time.isoformat(),
                "backoff_seconds": backoff_time.total_seconds()
            })
        else:
            # Max retries exceeded
            self.task_history.append({
                "task_id": task_id,
                "status": "failed",
                "error": error,
                "retries": task.retries,
                "failed_at": datetime.now().isoformat(),
                "task_data": task.to_dict()
            })
            
            # Update agent metrics
            self._update_agent_metrics(task.task_type, False)
            
            # Free resources
            self._free_resources(task.task_type)
            
            # Send failure callback
            if task.callback_url:
                asyncio.create_task(self._send_callback(
                    task.callback_url,
                    {"status": "failed", "error": error, "retries": task.retries}
                ))
    
    async def _send_callback(self, callback_url: str, data: Dict[str, Any]):
        """Send callback to specified URL"""
        import aiohttp
        
        try:
            async with aiohttp.ClientSession() as session:
                async with session.post(callback_url, json=data) as response:
                    if response.status != 200:
                        print(f"Callback failed: {response.status}")
        except Exception as e:
            print(f"Callback error: {e}")
    
    def _log_task_event(self, task_id: str, event: str, data: Dict[str, Any]):
        """Log task event"""
        log_entry = {
            "timestamp": datetime.now().isoformat(),
            "task_id": task_id,
            "event": event,
            "data": data
        }
        
        # In production, this would write to a database or log file
        print(f"Task Event: {json.dumps(log_entry, indent=2)}")
    
    def get_task_status(self, task_id: str) -> Optional[Dict[str, Any]]:
        """Get status of a task"""
        # Check running tasks
        if task_id in self.running_tasks:
            return {
                "status": "running",
                "task": self.running_tasks[task_id].to_dict(),
                "started_at": None  # Would track start time in production
            }
        
        # Check history
        for history_entry in self.task_history:
            if history_entry["task_id"] == task_id:
                return {
                    "status": history_entry["status"],
                    "task": history_entry.get("task_data"),
                    "result": history_entry.get("result"),
                    "error": history_entry.get("error"),
                    "completed_at": history_entry.get("completed_at"),
                    "failed_at": history_entry.get("failed_at")
                }
        
        # Check queue
        for task in self.task_queue:
            if task.task_id == task_id:
                return {
                    "status": "scheduled",
                    "task": task.to_dict(),
                    "scheduled_time": task.scheduled_time.isoformat()
                }
        
        return None
    
    def get_system_metrics(self) -> Dict[str, Any]:
        """Get system metrics and health"""
        queue_size = len(self.task_queue)
        running_tasks = len(self.running_tasks)
        completed_tasks = len([t for t in self.task_history if t["status"] == "completed"])
        failed_tasks = len([t for t in self.task_history if t["status"] == "failed"])
        
        total_tasks = queue_size + running_tasks + completed_tasks + failed_tasks
        success_rate = completed_tasks / max(1, completed_tasks + failed_tasks)
        
        return {
            "queue_size": queue_size,
            "running_tasks": running_tasks,
            "completed_tasks": completed_tasks,
            "failed_tasks": failed_tasks,
            "total_tasks": total_tasks,
            "success_rate": success_rate,
            "resource_utilization": {
                resource: {
                    "allocated": config["allocated"],
                    "total": config["total"],
                    "percentage": (config["allocated"] / config["total"]) * 100
                }
                for resource, config in self.resource_pool.items()
            },
            "agent_performance": {
                agent: {
                    "current_load": config["current_load"],
                    "max_concurrent": config["max_concurrent"],
                    "success_rate": config["success_rate"]
                }
                for agent, config in self.ai_agents.items()
            }
        }

# Example usage
async def main():
    scheduler = AITaskScheduler()
    
    # Schedule a design workflow
    design_brief = {
        "company_name": "Tech Innovations",
        "industry": "technology",
        "style": "modern",
        "color_preference": "blue",
        "budget": "premium"
    }
    
    deadline = datetime.now() + timedelta(hours=24)
    task_ids = scheduler.schedule_design_workflow(
        design_brief=design_brief,
        client_id="client_123",
        deadline=deadline
    )
    
    print(f"Scheduled tasks: {task_ids}")
    
    # Start processing tasks
    await scheduler.process_tasks()

if __name__ == "__main__":
    asyncio.run(main())
