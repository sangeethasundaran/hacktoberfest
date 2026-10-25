import os
import json
from datetime import datetime, date
from typing import List, Optional, Dict, Any
from fastapi import FastAPI, Depends, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from database import engine, Base, get_db
from models import Task, StudyPlan, ScheduleItem, Notice, ClubEvent, CampusDocument, UserSettings, AgentInteraction
import schemas
import tools
from agent import CampusAgent, get_current_ai_settings
from rag import extract_text_from_pdf, extract_notice_bulletins, ingest_campus_document
from seed_data import seed_database

# Create DB tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="CampusMate AI API",
    description="Intelligent Agentic Campus Companion Backend",
    version="1.0.0"
)

# CORS setup for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def startup_event():
    db = next(get_db())
    try:
        seed_database(db)
    finally:
        db.close()

# ----------------- DASHBOARD -----------------

@app.get("/api/dashboard", response_model=schemas.DashboardStats)
def get_dashboard_data(db: Session = Depends(get_db)):
    today_str = date.today().strftime("%Y-%m-%d")
    current_hour = datetime.now().hour
    
    if 5 <= current_hour < 12:
        greeting = "Good morning! Ready to make today productive?"
    elif 12 <= current_hour < 17:
        greeting = "Good afternoon! Keep up the great momentum."
    elif 17 <= current_hour < 21:
        greeting = "Good evening! Time to review and wrap up today's goals."
    else:
        greeting = "Late study session? Remember to pace yourself and rest well."

    pending_tasks = db.query(Task).filter(Task.status != "Completed").count()
    completed_tasks = db.query(Task).filter(Task.status == "Completed").count()
    upcoming_exams = db.query(Task).filter(Task.category == "Exam", Task.status != "Completed").count()
    upcoming_events = db.query(ClubEvent).count()

    recommendation = tools.tool_generate_smart_recommendations(db)

    deadlines = db.query(Task).filter(Task.status != "Completed").order_by(Task.due_date.asc()).limit(5).all()
    today_schedule = db.query(ScheduleItem).filter(ScheduleItem.date == today_str).order_by(ScheduleItem.start_time.asc()).all()

    # If no items for today, fetch next available scheduled items
    if not today_schedule:
        today_schedule = db.query(ScheduleItem).order_by(ScheduleItem.date.asc(), ScheduleItem.start_time.asc()).limit(5).all()

    return schemas.DashboardStats(
        pending_tasks=pending_tasks,
        upcoming_exams=upcoming_exams,
        completed_tasks=completed_tasks,
        upcoming_events=upcoming_events,
        greeting=greeting,
        ai_recommendation=recommendation,
        deadlines=[schemas.TaskResponse.from_orm(t) for t in deadlines],
        today_schedule=[schemas.ScheduleItemResponse.from_orm(s) for s in today_schedule]
    )

# ----------------- TASKS -----------------

@app.get("/api/tasks", response_model=List[schemas.TaskResponse])
def get_tasks(
    status: Optional[str] = None,
    category: Optional[str] = None,
    course: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Task)
    if status and status != "All":
        query = query.filter(Task.status == status)
    if category and category != "All":
        query = query.filter(Task.category == category)
    if course and course != "All":
        query = query.filter(Task.course == course)
    return query.order_by(Task.due_date.asc()).all()

@app.post("/api/tasks", response_model=schemas.TaskResponse)
def create_task(task_in: schemas.TaskCreate, db: Session = Depends(get_db)):
    task = Task(**task_in.dict())
    db.add(task)
    db.commit()
    db.refresh(task)
    return task

@app.put("/api/tasks/{task_id}", response_model=schemas.TaskResponse)
def update_task(task_id: int, task_in: schemas.TaskUpdate, db: Session = Depends(get_db)):
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    update_data = task_in.dict(exclude_unset=True)
    for field, val in update_data.items():
        setattr(task, field, val)
    db.commit()
    db.refresh(task)
    return task

@app.post("/api/tasks/{task_id}/toggle", response_model=schemas.TaskResponse)
def toggle_task_status(task_id: int, db: Session = Depends(get_db)):
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    task.status = "Completed" if task.status != "Completed" else "Pending"
    db.commit()
    db.refresh(task)
    return task

@app.delete("/api/tasks/{task_id}")
def delete_task(task_id: int, db: Session = Depends(get_db)):
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    db.delete(task)
    db.commit()
    return {"success": True, "message": "Task deleted"}

# ----------------- STUDY PLANS -----------------

@app.get("/api/study-plans", response_model=List[schemas.StudyPlanResponse])
def get_study_plans(db: Session = Depends(get_db)):
    plans = db.query(StudyPlan).order_by(StudyPlan.id.desc()).all()
    results = []
    for p in plans:
        topics = json.loads(p.topics_json) if p.topics_json else []
        milestones = json.loads(p.milestones_json) if p.milestones_json else []
        results.append(schemas.StudyPlanResponse(
            id=p.id,
            subject=p.subject,
            target_exam_date=p.target_exam_date,
            daily_hours=p.daily_hours,
            total_days=p.total_days,
            topics=topics,
            milestones=milestones,
            status=p.status,
            progress_pct=p.progress_pct,
            created_at=p.created_at
        ))
    return results

@app.post("/api/study-plans", response_model=schemas.StudyPlanResponse)
def create_study_plan(plan_in: schemas.StudyPlanCreate, db: Session = Depends(get_db)):
    result = tools.tool_create_study_plan(
        db,
        subject=plan_in.subject,
        target_exam_date=plan_in.target_exam_date,
        topics=plan_in.topics,
        daily_hours=plan_in.daily_hours
    )
    plan = db.query(StudyPlan).filter(StudyPlan.id == result["plan_id"]).first()
    return schemas.StudyPlanResponse(
        id=plan.id,
        subject=plan.subject,
        target_exam_date=plan.target_exam_date,
        daily_hours=plan.daily_hours,
        total_days=plan.total_days,
        topics=json.loads(plan.topics_json),
        milestones=json.loads(plan.milestones_json),
        status=plan.status,
        progress_pct=plan.progress_pct,
        created_at=plan.created_at
    )

@app.post("/api/study-plans/{plan_id}/milestone/{idx}/toggle")
def toggle_milestone(plan_id: int, idx: int, db: Session = Depends(get_db)):
    plan = db.query(StudyPlan).filter(StudyPlan.id == plan_id).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Study plan not found")
    
    milestones = json.loads(plan.milestones_json) if plan.milestones_json else []
    if 0 <= idx < len(milestones):
        milestones[idx]["completed"] = not milestones[idx].get("completed", False)
        # Recalculate progress percentage
        completed_count = sum(1 for m in milestones if m.get("completed"))
        plan.progress_pct = int((completed_count / len(milestones)) * 100)
        plan.milestones_json = json.dumps(milestones)
        db.commit()
        db.refresh(plan)
        return {"success": True, "progress_pct": plan.progress_pct, "milestone": milestones[idx]}
    raise HTTPException(status_code=400, detail="Invalid milestone index")

@app.delete("/api/study-plans/{plan_id}")
def delete_study_plan(plan_id: int, db: Session = Depends(get_db)):
    plan = db.query(StudyPlan).filter(StudyPlan.id == plan_id).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Study plan not found")
    db.delete(plan)
    db.commit()
    return {"success": True, "message": "Study plan deleted"}

# ----------------- SCHEDULE -----------------

@app.get("/api/schedule", response_model=List[schemas.ScheduleItemResponse])
def get_schedule(date_str: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(ScheduleItem)
    if date_str:
        query = query.filter(ScheduleItem.date == date_str)
    return query.order_by(ScheduleItem.date.asc(), ScheduleItem.start_time.asc()).all()

@app.post("/api/schedule", response_model=schemas.ScheduleItemResponse)
def add_schedule_item(item_in: schemas.ScheduleItemCreate, db: Session = Depends(get_db)):
    item = ScheduleItem(**item_in.dict())
    db.add(item)
    db.commit()
    db.refresh(item)
    return item

@app.post("/api/schedule/{item_id}/toggle", response_model=schemas.ScheduleItemResponse)
def toggle_schedule_item(item_id: int, db: Session = Depends(get_db)):
    item = db.query(ScheduleItem).filter(ScheduleItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Schedule item not found")
    item.is_completed = not item.is_completed
    db.commit()
    db.refresh(item)
    return item

@app.delete("/api/schedule/{item_id}")
def delete_schedule_item(item_id: int, db: Session = Depends(get_db)):
    item = db.query(ScheduleItem).filter(ScheduleItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Schedule item not found")
    db.delete(item)
    db.commit()
    return {"success": True}

# ----------------- NOTICES -----------------

@app.get("/api/notices", response_model=List[schemas.NoticeResponse])
def get_notices(category: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(Notice)
    if category and category != "All":
        query = query.filter(Notice.category == category)
    notices = query.order_by(Notice.id.desc()).all()
    results = []
    for n in notices:
        results.append(schemas.NoticeResponse(
            id=n.id,
            title=n.title,
            category=n.category,
            date=n.date,
            content=n.content,
            summary=n.summary,
            action_items=json.loads(n.action_items_json) if n.action_items_json else [],
            important_dates=json.loads(n.important_dates_json) if n.important_dates_json else [],
            is_verified=n.is_verified,
            source=n.source,
            pdf_filename=n.pdf_filename
        ))
    return results

@app.post("/api/notices", response_model=schemas.NoticeResponse)
def create_notice(notice_in: schemas.NoticeCreate, db: Session = Depends(get_db)):
    analysis = extract_notice_bulletins(notice_in.content)
    notice = Notice(
        title=notice_in.title,
        category=notice_in.category,
        date=notice_in.date,
        content=notice_in.content,
        summary=analysis["summary"],
        action_items_json=json.dumps(analysis["action_items"]),
        important_dates_json=json.dumps(analysis["important_dates"]),
        is_verified=True,
        source=notice_in.source
    )
    db.add(notice)
    db.commit()
    db.refresh(notice)
    return schemas.NoticeResponse(
        id=notice.id,
        title=notice.title,
        category=notice.category,
        date=notice.date,
        content=notice.content,
        summary=notice.summary,
        action_items=analysis["action_items"],
        important_dates=analysis["important_dates"],
        is_verified=notice.is_verified,
        source=notice.source,
        pdf_filename=notice.pdf_filename
    )

@app.post("/api/notices/upload-pdf")
async def upload_notice_pdf(
    file: UploadFile = File(...),
    title: str = Form(...),
    category: str = Form("Academic"),
    source: str = Form("Campus Administration"),
    db: Session = Depends(get_db)
):
    contents = await file.read()
    extracted_text = extract_text_from_pdf(contents)
    if not extracted_text or extracted_text.startswith("Error"):
        extracted_text = f"Notice uploaded: {file.filename}. Content extraction processed."
        
    analysis = extract_notice_bulletins(extracted_text)
    notice = Notice(
        title=title,
        category=category,
        date=date.today().strftime("%Y-%m-%d"),
        content=extracted_text,
        summary=analysis["summary"],
        action_items_json=json.dumps(analysis["action_items"]),
        important_dates_json=json.dumps(analysis["important_dates"]),
        is_verified=True,
        source=source,
        pdf_filename=file.filename
    )
    db.add(notice)
    db.commit()
    db.refresh(notice)
    return {"success": True, "notice_id": notice.id, "extracted_dates": analysis["important_dates"]}

# ----------------- CLUBS & EVENTS -----------------

@app.get("/api/events", response_model=List[schemas.ClubEventResponse])
def get_events(category: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(ClubEvent)
    if category and category != "All":
        query = query.filter(ClubEvent.category == category)
    return query.order_by(ClubEvent.date.asc()).all()

@app.post("/api/events/{event_id}/toggle-register")
def toggle_event_registration(event_id: int, db: Session = Depends(get_db)):
    event = db.query(ClubEvent).filter(ClubEvent.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    event.is_registered = not event.is_registered
    
    # If registered, also add to student's schedule!
    if event.is_registered:
        existing = db.query(ScheduleItem).filter(
            ScheduleItem.title == event.title,
            ScheduleItem.date == event.date
        ).first()
        if not existing:
            sched = ScheduleItem(
                title=f"{event.title} ({event.club_name})",
                start_time=event.time,
                end_time="--",
                category="Event",
                date=event.date,
                location=event.location,
                is_completed=False,
                notes=f"Registered for club event: {event.description[:100]}"
            )
            db.add(sched)
    
    db.commit()
    db.refresh(event)
    return {"success": True, "is_registered": event.is_registered}

# ----------------- CAMPUS DOCUMENTS (RAG) -----------------

@app.get("/api/documents", response_model=List[schemas.DocumentResponse])
def get_documents(db: Session = Depends(get_db)):
    return db.query(CampusDocument).order_by(CampusDocument.id.desc()).all()

@app.post("/api/documents/search")
def search_documents(query_payload: Dict[str, str], db: Session = Depends(get_db)):
    query = query_payload.get("query", "")
    return tools.tool_search_documents(db, query)

@app.post("/api/documents/upload")
async def upload_document(
    file: UploadFile = File(...),
    title: str = Form(...),
    category: str = Form("Academic Policy"),
    db: Session = Depends(get_db)
):
    contents = await file.read()
    if file.filename.endswith(".pdf"):
        text = extract_text_from_pdf(contents)
    else:
        text = contents.decode("utf-8", errors="ignore")
        
    doc = ingest_campus_document(
        db,
        title=title,
        content=text,
        category=category,
        file_type="PDF" if file.filename.endswith(".pdf") else "TXT",
        source_file=file.filename
    )
    return {"success": True, "document_id": doc.id, "summary": doc.summary}

# ----------------- AGENT CHAT -----------------

@app.post("/api/agent/chat", response_model=schemas.AgentChatResponse)
def chat_with_agent(chat_in: schemas.AgentChatRequest, db: Session = Depends(get_db)):
    agent = CampusAgent(db)
    result = agent.process_message(chat_in.message, chat_in.context)
    return schemas.AgentChatResponse(
        response=result["response"],
        thought_process=result["thought_process"],
        tool_called=result["tool_called"],
        tool_input=result["tool_input"],
        tool_output=result["tool_output"],
        is_demo=result["is_demo"],
        verified_sources=result["verified_sources"]
    )

# ----------------- SETTINGS & RESET -----------------

@app.get("/api/settings")
def get_settings(db: Session = Depends(get_db)):
    settings = db.query(UserSettings).first()
    if not settings:
        settings = UserSettings()
        db.add(settings)
        db.commit()
        db.refresh(settings)
    return {
        "student_name": settings.student_name,
        "student_id": settings.student_id,
        "major": settings.major,
        "semester": settings.semester,
        "email": settings.email,
        "ai_mode": settings.ai_mode,
        "is_demo": settings.ai_mode == "demo"
    }

@app.post("/api/settings")
def update_settings(payload: schemas.SettingsUpdate, db: Session = Depends(get_db)):
    settings = db.query(UserSettings).first()
    if not settings:
        settings = UserSettings()
        db.add(settings)
    
    if payload.student_name is not None:
        settings.student_name = payload.student_name
    if payload.student_id is not None:
        settings.student_id = payload.student_id
    if payload.major is not None:
        settings.major = payload.major
    if payload.semester is not None:
        settings.semester = payload.semester
    if payload.email is not None:
        settings.email = payload.email
    if payload.ai_mode is not None:
        settings.ai_mode = payload.ai_mode
    if payload.api_key:
        settings.api_key_masked = payload.api_key[:4] + "..." + payload.api_key[-4:]
        if settings.ai_mode == "openai":
            os.environ["OPENAI_API_KEY"] = payload.api_key
        elif settings.ai_mode == "gemini":
            os.environ["GEMINI_API_KEY"] = payload.api_key
            
    db.commit()
    return {"success": True, "message": "Settings updated"}

@app.post("/api/reset-data")
def reset_campus_data(db: Session = Depends(get_db)):
    seed_database(db, force=True)
    return {"success": True, "message": "Campus database reset to official default state."}
