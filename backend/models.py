from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Text, Boolean, Float, DateTime
from database import Base

def utc_now():
    return datetime.now(timezone.utc)

class Task(Base):
    __tablename__ = "tasks"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False)
    description = Column(Text, default="")
    course = Column(String(100), default="General")
    due_date = Column(String(50), nullable=False)
    priority = Column(String(20), default="Medium")  # High, Medium, Low
    category = Column(String(50), default="Assignment")  # Assignment, Exam, Project, Lab, Reading, Admin
    status = Column(String(30), default="Pending")  # Pending, In Progress, Completed
    estimated_hours = Column(Float, default=2.0)
    is_sample = Column(Boolean, default=False)
    created_at = Column(DateTime, default=utc_now)

class StudyPlan(Base):
    __tablename__ = "study_plans"

    id = Column(Integer, primary_key=True, index=True)
    subject = Column(String(150), nullable=False)
    target_exam_date = Column(String(50), nullable=False)
    daily_hours = Column(Float, default=2.0)
    total_days = Column(Integer, default=7)
    topics_json = Column(Text, default="[]")  # JSON list of strings
    milestones_json = Column(Text, default="[]")  # JSON list of day objects
    status = Column(String(30), default="Active")  # Active, Completed, Paused
    progress_pct = Column(Integer, default=0)
    is_sample = Column(Boolean, default=False)
    created_at = Column(DateTime, default=utc_now)

class ScheduleItem(Base):
    __tablename__ = "schedule_items"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False)
    start_time = Column(String(30), nullable=False)
    end_time = Column(String(30), nullable=False)
    category = Column(String(50), default="Class")  # Class, Lab, Study, Event, Deadline, Personal
    date = Column(String(50), nullable=False)  # YYYY-MM-DD
    location = Column(String(150), default="Campus")
    is_completed = Column(Boolean, default=False)
    is_sample = Column(Boolean, default=False)
    notes = Column(Text, default="")

class Notice(Base):
    __tablename__ = "notices"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(250), nullable=False)
    category = Column(String(60), default="Academic")  # Academic, Administrative, Placement, Hostel, Sports, Examination
    date = Column(String(50), nullable=False)
    content = Column(Text, nullable=False)
    summary = Column(Text, default="")
    action_items_json = Column(Text, default="[]")
    important_dates_json = Column(Text, default="[]")
    is_verified = Column(Boolean, default=True)
    verification_notes = Column(String(250), default="Verified Official Circular")
    source = Column(String(150), default="Office of the Dean")
    source_url = Column(String(300), default="https://cce.edu.in/")
    pdf_filename = Column(String(150), default="")
    is_sample = Column(Boolean, default=False)

class ClubEvent(Base):
    __tablename__ = "club_events"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False)
    club_name = Column(String(150), nullable=False)
    category = Column(String(60), default="Technical")  # Technical, Cultural, Sports, Entrepreneurship, Social
    date = Column(String(50), nullable=False)
    time = Column(String(50), default="TBA")
    location = Column(String(150), default="Christ College of Engineering, Irinjalakuda")
    venue = Column(String(150), default="Christ College of Engineering, Irinjalakuda")
    organizer = Column(String(150), default="CCE")
    description = Column(Text, default="")
    registration_deadline = Column(String(50), default="")
    registration_link = Column(String(300), default="")
    source_url = Column(String(300), default="https://cce.edu.in/")
    source_name = Column(String(150), default="Christ College of Engineering Official Portal")
    is_verified = Column(Boolean, default=True)
    verification_notes = Column(String(250), default="Official CCE Publication")
    is_upcoming = Column(Boolean, default=True)
    external_id = Column(String(100), default="", index=True)
    is_registered = Column(Boolean, default=False)
    tags = Column(String(200), default="CCE, Campus Event")
    is_sample = Column(Boolean, default=False)
    last_synced_at = Column(DateTime, default=utc_now)

class CampusDocument(Base):
    __tablename__ = "campus_documents"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(250), nullable=False)
    category = Column(String(100), default="Academic Policy")
    content = Column(Text, nullable=False)
    summary = Column(Text, default="")
    file_type = Column(String(20), default="PDF")
    source_file = Column(String(200), default="")
    uploaded_at = Column(DateTime, default=utc_now)

class AgentInteraction(Base):
    __tablename__ = "agent_interactions"

    id = Column(Integer, primary_key=True, index=True)
    query = Column(Text, nullable=False)
    thought_process = Column(Text, default="[]")
    tool_called = Column(String(100), default="")
    tool_input = Column(Text, default="{}")
    tool_output = Column(Text, default="{}")
    response = Column(Text, nullable=False)
    is_demo = Column(Boolean, default=True)
    created_at = Column(DateTime, default=utc_now)

class UserSettings(Base):
    __tablename__ = "user_settings"

    id = Column(Integer, primary_key=True, index=True)
    student_name = Column(String(100), default="Alex Chen")
    student_id = Column(String(50), default="CS-2024-8842")
    major = Column(String(100), default="Computer Science & Engineering")
    semester = Column(String(50), default="Semester 5 (Fall 2026)")
    email = Column(String(100), default="alex.chen@campus.edu")
    ai_mode = Column(String(30), default="demo")  # demo, openai, gemini
    api_key_masked = Column(String(100), default="")
    api_key = Column(String(500), default="")
    last_cce_sync = Column(String(50), default="")
    last_sync_status = Column(String(50), default="Ready")
