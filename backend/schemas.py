from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Any, Dict
from datetime import datetime

class TaskBase(BaseModel):
    title: str
    description: Optional[str] = ""
    course: Optional[str] = "General"
    due_date: str
    priority: Optional[str] = "Medium"
    category: Optional[str] = "Assignment"
    status: Optional[str] = "Pending"
    estimated_hours: Optional[float] = 2.0

class TaskCreate(TaskBase):
    pass

class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    course: Optional[str] = None
    due_date: Optional[str] = None
    priority: Optional[str] = None
    category: Optional[str] = None
    status: Optional[str] = None
    estimated_hours: Optional[float] = None

class TaskResponse(TaskBase):
    id: int
    created_at: Optional[datetime] = None
    model_config = ConfigDict(from_attributes=True)

class StudyPlanCreate(BaseModel):
    subject: str
    target_exam_date: str
    daily_hours: Optional[float] = 2.0
    topics: List[str] = []

class StudyPlanResponse(BaseModel):
    id: int
    subject: str
    target_exam_date: str
    daily_hours: float
    total_days: int
    topics: List[str] = []
    milestones: List[Dict[str, Any]] = []
    status: str
    progress_pct: int
    created_at: Optional[datetime] = None
    model_config = ConfigDict(from_attributes=True)

class ScheduleItemCreate(BaseModel):
    title: str
    start_time: str
    end_time: str
    category: Optional[str] = "Class"
    date: str
    location: Optional[str] = "Campus"
    notes: Optional[str] = ""

class ScheduleItemResponse(BaseModel):
    id: int
    title: str
    start_time: str
    end_time: str
    category: str
    date: str
    location: str
    is_completed: bool
    notes: str
    model_config = ConfigDict(from_attributes=True)

class NoticeCreate(BaseModel):
    title: str
    category: Optional[str] = "Academic"
    date: str
    content: str
    source: Optional[str] = "Office of the Dean"

class NoticeResponse(BaseModel):
    id: int
    title: str
    category: str
    date: str
    content: str
    summary: str
    action_items: List[str] = []
    important_dates: List[str] = []
    is_verified: bool
    source: str
    pdf_filename: Optional[str] = ""
    model_config = ConfigDict(from_attributes=True)

class ClubEventResponse(BaseModel):
    id: int
    title: str
    club_name: str
    category: str
    date: str
    time: str
    location: str
    description: str
    is_registered: bool
    tags: str
    model_config = ConfigDict(from_attributes=True)

class DocumentResponse(BaseModel):
    id: int
    title: str
    category: str
    content: str
    summary: str
    file_type: str
    source_file: str
    uploaded_at: Optional[datetime] = None
    model_config = ConfigDict(from_attributes=True)

class AgentChatRequest(BaseModel):
    message: str
    context: Optional[Dict[str, Any]] = None
    history: Optional[List[Dict[str, str]]] = []

class AgentChatResponse(BaseModel):
    response: str
    thought_process: List[str] = []
    tool_called: Optional[str] = None
    tool_input: Optional[Dict[str, Any]] = None
    tool_output: Optional[Any] = None
    is_demo: bool = True
    verified_sources: List[Dict[str, str]] = []

class SettingsUpdate(BaseModel):
    student_name: Optional[str] = None
    student_id: Optional[str] = None
    major: Optional[str] = None
    semester: Optional[str] = None
    email: Optional[str] = None
    ai_mode: Optional[str] = None
    api_key: Optional[str] = None

class DashboardStats(BaseModel):
    pending_tasks: int
    upcoming_exams: int
    completed_tasks: int
    upcoming_events: int
    greeting: str
    ai_recommendation: Dict[str, Any]
    deadlines: List[TaskResponse]
    today_schedule: List[ScheduleItemResponse]
    model_config = ConfigDict(from_attributes=True)
