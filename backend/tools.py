import json
from datetime import datetime, date, timedelta
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from models import Task, StudyPlan, ScheduleItem, Notice, ClubEvent, CampusDocument

def tool_create_task(
    db: Session,
    title: str,
    course: str = "General",
    due_date: str = None,
    priority: str = "Medium",
    category: str = "Assignment",
    description: str = "",
    estimated_hours: float = 2.0
) -> Dict[str, Any]:
    """Creates a new student task or deadline in the database."""
    if not due_date:
        # Default to 3 days from now
        due_date = (date.today() + timedelta(days=3)).strftime("%Y-%m-%d")
        
    task = Task(
        title=title,
        course=course,
        due_date=due_date,
        priority=priority.capitalize(),
        category=category.capitalize(),
        description=description,
        estimated_hours=estimated_hours,
        status="Pending"
    )
    db.add(task)
    db.commit()
    db.refresh(task)
    
    return {
        "success": True,
        "message": f"Successfully created task '{task.title}' for course '{task.course}' due on {task.due_date}.",
        "task": {
            "id": task.id,
            "title": task.title,
            "course": task.course,
            "due_date": task.due_date,
            "priority": task.priority,
            "category": task.category,
            "status": task.status
        }
    }

def tool_list_tasks(
    db: Session,
    status: Optional[str] = None,
    category: Optional[str] = None,
    course: Optional[str] = None
) -> Dict[str, Any]:
    """Lists student tasks, optionally filtering by status, category, or course."""
    query = db.query(Task)
    if status:
        query = query.filter(Task.status.ilike(f"%{status}%"))
    if category:
        query = query.filter(Task.category.ilike(f"%{category}%"))
    if course:
        query = query.filter(Task.course.ilike(f"%{course}%"))
        
    tasks = query.order_by(Task.due_date.asc()).all()
    results = [
        {
            "id": t.id,
            "title": t.title,
            "course": t.course,
            "due_date": t.due_date,
            "priority": t.priority,
            "category": t.category,
            "status": t.status,
            "estimated_hours": t.estimated_hours
        }
        for t in tasks
    ]
    return {
        "count": len(results),
        "tasks": results
    }

def tool_complete_task(db: Session, task_id: int) -> Dict[str, Any]:
    """Marks a task as completed."""
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        return {"success": False, "error": f"Task with ID {task_id} not found."}
    
    task.status = "Completed"
    db.commit()
    db.refresh(task)
    return {
        "success": True,
        "message": f"Task '{task.title}' has been marked as Completed!",
        "task_id": task.id
    }

def tool_create_study_plan(
    db: Session,
    subject: str,
    target_exam_date: str,
    topics: List[str],
    daily_hours: float = 2.0
) -> Dict[str, Any]:
    """Generates an organized, day-by-day study roadmap leading up to an exam or deadline."""
    try:
        exam_dt = datetime.strptime(target_exam_date, "%Y-%m-%d").date()
    except Exception:
        exam_dt = date.today() + timedelta(days=7)
        target_exam_date = exam_dt.strftime("%Y-%m-%d")

    today = date.today()
    days_remaining = max(1, (exam_dt - today).days)
    
    if not topics:
        topics = ["Fundamentals & Key Concepts", "Advanced Problem Solving", "Practice Papers & Mock Review"]
    
    # Distribute topics across the days
    milestones = []
    num_topics = len(topics)
    for i in range(days_remaining):
        milestone_date = (today + timedelta(days=i)).strftime("%Y-%m-%d")
        topic_idx = min(i % num_topics, num_topics - 1)
        if i == days_remaining - 1:
            session_topic = f"Final Review & Practice: {subject}"
            milestone_type = "Comprehensive Revision"
        else:
            session_topic = topics[topic_idx]
            milestone_type = "Core Study"

        milestones.append({
            "day": i + 1,
            "date": milestone_date,
            "topic": session_topic,
            "type": milestone_type,
            "duration_hours": daily_hours,
            "completed": False,
            "notes": f"Dedicate {daily_hours} hours to key exercises and past question sets."
        })

    plan = StudyPlan(
        subject=subject,
        target_exam_date=target_exam_date,
        daily_hours=daily_hours,
        total_days=days_remaining,
        topics_json=json.dumps(topics),
        milestones_json=json.dumps(milestones),
        status="Active",
        progress_pct=0
    )
    db.add(plan)
    db.commit()
    db.refresh(plan)

    return {
        "success": True,
        "plan_id": plan.id,
        "subject": plan.subject,
        "target_exam_date": plan.target_exam_date,
        "total_days": plan.total_days,
        "daily_hours": plan.daily_hours,
        "milestones_count": len(milestones),
        "milestones": milestones
    }

def tool_get_schedule(db: Session, schedule_date: Optional[str] = None) -> Dict[str, Any]:
    """Gets the student's timeline of scheduled classes, study blocks, and campus activities."""
    if not schedule_date:
        schedule_date = date.today().strftime("%Y-%m-%d")
        
    items = db.query(ScheduleItem).filter(ScheduleItem.date == schedule_date).order_by(ScheduleItem.start_time.asc()).all()
    results = [
        {
            "id": item.id,
            "title": item.title,
            "start_time": item.start_time,
            "end_time": item.end_time,
            "category": item.category,
            "location": item.location,
            "is_completed": item.is_completed,
            "notes": item.notes
        }
        for item in items
    ]
    return {
        "date": schedule_date,
        "count": len(results),
        "schedule": results
    }

def tool_search_documents(db: Session, query: str) -> Dict[str, Any]:
    """Searches official college documents, rules, handbooks, and syllabi for source-backed facts."""
    docs = db.query(CampusDocument).all()
    matched = []
    q_lower = query.lower()
    keywords = [k for k in q_lower.split() if len(k) > 2]
    
    for doc in docs:
        score = 0
        content_lower = doc.content.lower()
        title_lower = doc.title.lower()
        
        if q_lower in title_lower:
            score += 15
        if q_lower in content_lower:
            score += 10
            
        for k in keywords:
            if k in title_lower:
                score += 5
            if k in content_lower:
                score += content_lower.count(k)
                
        if score > 0:
            # Extract relevant snippet
            idx = content_lower.find(keywords[0]) if keywords and keywords[0] in content_lower else 0
            start = max(0, idx - 100)
            end = min(len(doc.content), idx + 250)
            snippet = doc.content[start:end].strip()
            if start > 0:
                snippet = "..." + snippet
            if end < len(doc.content):
                snippet = snippet + "..."

            matched.append({
                "id": doc.id,
                "title": doc.title,
                "category": doc.category,
                "source_file": doc.source_file or f"{doc.title}.pdf",
                "score": score,
                "snippet": snippet,
                "summary": doc.summary
            })
            
    matched.sort(key=lambda x: x["score"], reverse=True)
    return {
        "query": query,
        "results_count": len(matched),
        "results": matched[:4]
    }

def tool_summarize_notice(db: Session, notice_id: Optional[int] = None, query: Optional[str] = None) -> Dict[str, Any]:
    """Retrieves and summarizes an official campus bulletin or notice, highlighting key deadlines and action items."""
    if notice_id:
        notice = db.query(Notice).filter(Notice.id == notice_id).first()
    elif query:
        notice = db.query(Notice).filter(
            (Notice.title.ilike(f"%{query}%")) | (Notice.content.ilike(f"%{query}%"))
        ).first()
    else:
        notice = db.query(Notice).order_by(Notice.id.desc()).first()
        
    if not notice:
        return {"success": False, "error": "Notice not found."}

    action_items = json.loads(notice.action_items_json) if notice.action_items_json else []
    important_dates = json.loads(notice.important_dates_json) if notice.important_dates_json else []
    
    return {
        "success": True,
        "notice_id": notice.id,
        "title": notice.title,
        "category": notice.category,
        "date": notice.date,
        "source": notice.source,
        "is_verified": notice.is_verified,
        "summary": notice.summary,
        "action_items": action_items,
        "important_dates": important_dates
    }

def tool_get_upcoming_events(db: Session, category: Optional[str] = None) -> Dict[str, Any]:
    """Fetches upcoming campus club meetings, workshops, hackathons, and social events."""
    query = db.query(ClubEvent)
    if category:
        query = query.filter(ClubEvent.category.ilike(f"%{category}%"))
    events = query.order_by(ClubEvent.date.asc()).all()
    results = [
        {
            "id": e.id,
            "title": e.title,
            "club_name": e.club_name,
            "category": e.category,
            "date": e.date,
            "time": e.time,
            "location": e.location,
            "description": e.description,
            "is_registered": e.is_registered
        }
        for e in events
    ]
    return {
        "count": len(results),
        "events": results
    }

def tool_generate_smart_recommendations(db: Session) -> Dict[str, Any]:
    """Analyzes student pending tasks, deadlines, and study plans to provide intelligent, contextual guidance."""
    tasks = db.query(Task).filter(Task.status != "Completed").order_by(Task.due_date.asc()).all()
    plans = db.query(StudyPlan).filter(StudyPlan.status == "Active").all()
    today_str = date.today().strftime("%Y-%m-%d")
    
    urgent_tasks = [t for t in tasks if t.priority == "High" or t.due_date <= today_str]
    exam_tasks = [t for t in tasks if t.category == "Exam"]
    
    if urgent_tasks:
        primary = urgent_tasks[0]
        advice = f"You have '{primary.title}' ({primary.course}) due on {primary.due_date}. We recommend prioritizing this first. Allocate {primary.estimated_hours} hours today."
        action_type = "Urgent Priority"
    elif exam_tasks:
        exam = exam_tasks[0]
        advice = f"Upcoming exam: '{exam.title}' on {exam.due_date}. Start revising topics incrementally using the Study Planner."
        action_type = "Exam Prep"
    elif tasks:
        task = tasks[0]
        advice = f"Good progress! Next pending item is '{task.title}' for {task.course} (Due {task.due_date}). Stay on top of your schedule by wrapping it up early."
        action_type = "Task Focus"
    else:
        advice = "All current deadlines are cleared! Perfect time to explore upcoming campus club hackathons or review upcoming lecture notes."
        action_type = "Campus Exploration"

    return {
        "recommendation": advice,
        "action_type": action_type,
        "pending_count": len(tasks),
        "high_priority_count": len(urgent_tasks),
        "active_study_plans": len(plans)
    }

# Tool Registry Metadata for the Agent
AVAILABLE_TOOLS_METADATA = [
    {
        "name": "create_task",
        "description": "Add an assignment, homework, exam, or project deadline to student's task manager.",
        "parameters": {
            "title": "string (name of the assignment/task)",
            "course": "string (course code e.g. CS304, CS301)",
            "due_date": "string (YYYY-MM-DD)",
            "priority": "string (High, Medium, Low)",
            "category": "string (Assignment, Exam, Project, Lab, Admin)"
        }
    },
    {
        "name": "list_tasks",
        "description": "Retrieve the student's task list, filtered by status or course.",
        "parameters": {
            "status": "string optional (Pending, In Progress, Completed)",
            "course": "string optional"
        }
    },
    {
        "name": "complete_task",
        "description": "Mark a task or assignment as completed by ID.",
        "parameters": {
            "task_id": "integer"
        }
    },
    {
        "name": "create_study_plan",
        "description": "Generate an automated multi-day study schedule with daily milestones leading to an exam.",
        "parameters": {
            "subject": "string (Subject/Course name)",
            "target_exam_date": "string (YYYY-MM-DD)",
            "topics": "list of strings",
            "daily_hours": "number (default 2.0)"
        }
    },
    {
        "name": "search_campus_documents",
        "description": "Search college official policies, handbook rules, grading schemes, and syllabus documents with verified citations.",
        "parameters": {
            "query": "string (search terms e.g. attendance policy, library fines, grading curve)"
        }
    },
    {
        "name": "summarize_notice",
        "description": "Summarize an official college circular or notice and extract actionable dates.",
        "parameters": {
            "notice_id": "integer optional",
            "query": "string optional"
        }
    },
    {
        "name": "get_upcoming_events",
        "description": "Fetch upcoming campus workshops, hackathons, and club activities.",
        "parameters": {
            "category": "string optional (Technical, Cultural, Sports, Entrepreneurship)"
        }
    },
    {
        "name": "get_student_schedule",
        "description": "View classes, lab sessions, and time blocks for today or a specific date.",
        "parameters": {
            "date": "string optional (YYYY-MM-DD)"
        }
    },
    {
        "name": "generate_smart_recommendations",
        "description": "Analyze all student data and generate actionable daily academic recommendations.",
        "parameters": {}
    }
]
