import os
import io
import csv
import json
import re
from datetime import datetime, date, timedelta, timezone
from typing import List, Optional, Dict, Any
from contextlib import asynccontextmanager
from fastapi import FastAPI, Depends, HTTPException, UploadFile, File, Form, Response
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from database import engine, Base, get_db
from models import Task, StudyPlan, ScheduleItem, Notice, ClubEvent, CampusDocument, UserSettings, AgentInteraction
import schemas
import tools
import cce_service
from agent import CampusAgent, get_current_ai_settings
from rag import extract_text_from_pdf, extract_notice_bulletins, ingest_campus_document
from seed_data import seed_database, clear_sample_data
from importers import (
    parse_tasks_from_csv, 
    parse_tasks_from_xlsx, 
    parse_tasks_from_pdf, 
    parse_schedule_from_csv, 
    get_sample_csv_template
)

# Create DB tables
Base.metadata.create_all(bind=engine)

@asynccontextmanager
async def lifespan(app: FastAPI):
    db = next(get_db())
    try:
        seed_database(db)
        cce_service.sync_cce_data(db)
    finally:
        db.close()
    yield

app = FastAPI(
    title="CampusMate AI API",
    description="Intelligent Agentic Campus Companion Backend",
    version="1.0.0",
    lifespan=lifespan
)

# CORS setup for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ----------------- DASHBOARD -----------------

@app.get("/api/dashboard", response_model=schemas.DashboardStats)
def get_dashboard_data(db: Session = Depends(get_db)):
    today = date.today()
    today_str = today.strftime("%Y-%m-%d")
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
    # Genuine count of events happening today or in the future:
    upcoming_events = db.query(ClubEvent).filter(ClubEvent.date >= today_str).count()

    recommendation = tools.tool_generate_smart_recommendations(db)

    deadlines = db.query(Task).filter(Task.status != "Completed").order_by(Task.due_date.asc()).limit(5).all()
    # Real schedule for today only:
    today_schedule = db.query(ScheduleItem).filter(ScheduleItem.date == today_str).order_by(ScheduleItem.start_time.asc()).all()

    # Calculate real Weekly Study Velocity (Monday through Sunday of current week)
    start_of_week = today - timedelta(days=today.weekday())
    days_abbr = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
    active_plans = db.query(StudyPlan).filter(StudyPlan.status == "Active").all()
    avg_target = round(sum(p.daily_hours for p in active_plans) / len(active_plans), 1) if active_plans else 0.0

    weekly_velocity = []
    for i in range(7):
        d = start_of_week + timedelta(days=i)
        d_str = d.strftime("%Y-%m-%d")
        
        # Completed tasks estimated hours
        comp_tasks = db.query(Task).filter(Task.status == "Completed", Task.due_date == d_str).all()
        task_hrs = sum(t.estimated_hours or 0.0 for t in comp_tasks)
        
        # Completed schedule items
        sched_items = db.query(ScheduleItem).filter(ScheduleItem.date == d_str, ScheduleItem.is_completed == True).all()
        sched_hrs = len([s for s in sched_items if s.category in ["Class", "Lab", "Study"]]) * 1.5
        
        actual_hrs = round(max(task_hrs, sched_hrs), 1)
        weekly_velocity.append({
            "day": days_abbr[i],
            "date": d_str,
            "actual": actual_hrs,
            "target": avg_target
        })

    # Calculate real Course Workload Distribution for pending/active tasks
    pending_tasks_list = db.query(Task).filter(Task.status != "Completed").all()
    course_map: Dict[str, Dict[str, Any]] = {}
    for t in pending_tasks_list:
        c = t.course or "General"
        if c not in course_map:
            course_map[c] = {"course": c, "hours": 0.0, "count": 0}
        course_map[c]["hours"] += (t.estimated_hours or 2.0)
        course_map[c]["count"] += 1

    course_workload = sorted(
        [{"course": v["course"], "hours": round(v["hours"], 1), "count": v["count"]} for v in course_map.values()],
        key=lambda x: x["hours"],
        reverse=True
    )

    has_sample_data = bool(
        db.query(Task).filter(Task.is_sample == True).first() or
        db.query(StudyPlan).filter(StudyPlan.is_sample == True).first() or
        db.query(ScheduleItem).filter(ScheduleItem.is_sample == True).first()
    )

    total_tasks = db.query(Task).count()

    return schemas.DashboardStats(
        pending_tasks=pending_tasks,
        upcoming_exams=upcoming_exams,
        completed_tasks=completed_tasks,
        upcoming_events=upcoming_events,
        greeting=greeting,
        ai_recommendation=recommendation,
        deadlines=[schemas.TaskResponse.model_validate(t) for t in deadlines],
        today_schedule=[schemas.ScheduleItemResponse.model_validate(s) for s in today_schedule],
        weekly_velocity=weekly_velocity,
        course_workload=course_workload,
        has_sample_data=has_sample_data,
        total_tasks=total_tasks
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
    task = Task(**task_in.model_dump())
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

@app.post("/api/tasks/import-file")
async def import_tasks_file(file: UploadFile = File(...), db: Session = Depends(get_db)):
    contents = await file.read()
    filename = (file.filename or "").lower()
    
    parsed = []
    if filename.endswith(".xlsx") or filename.endswith(".xls"):
        parsed = parse_tasks_from_xlsx(contents)
    elif filename.endswith(".pdf"):
        parsed = parse_tasks_from_pdf(contents)
    else:
        parsed = parse_tasks_from_csv(contents)
        
    if not parsed:
        raise HTTPException(
            status_code=400,
            detail="Could not detect or parse any tasks/deadlines from the uploaded file. Please ensure columns include Title and DueDate, or download our sample CSV template."
        )
        
    created_tasks = []
    for item in parsed:
        new_task = Task(
            title=item.get("title", "Imported Task"),
            course=item.get("course", "General"),
            due_date=item.get("due_date", date.today().strftime("%Y-%m-%d")),
            priority=item.get("priority", "Medium"),
            category=item.get("category", "Assignment"),
            status="Pending",
            estimated_hours=item.get("estimated_hours", 2.0),
            description=item.get("description", f"Imported from {file.filename}"),
            is_sample=False
        )
        db.add(new_task)
        created_tasks.append(new_task)
        
    db.commit()
    for t in created_tasks:
        db.refresh(t)
        
    return {
        "success": True,
        "count": len(created_tasks),
        "message": f"Successfully imported {len(created_tasks)} tasks from {file.filename} into your planner.",
        "imported_tasks": [schemas.TaskResponse.model_validate(t) for t in created_tasks]
    }

@app.post("/api/tasks/batch")
def create_tasks_batch(payload: schemas.TaskBatchCreate, db: Session = Depends(get_db)):
    created = []
    for t_in in payload.tasks:
        t = Task(**t_in.model_dump())
        t.is_sample = False
        db.add(t)
        created.append(t)
    db.commit()
    for t in created:
        db.refresh(t)
    return {
        "success": True,
        "count": len(created),
        "tasks": [schemas.TaskResponse.model_validate(t) for t in created]
    }

@app.get("/api/tasks/sample-template.csv")
def download_tasks_sample_template():
    csv_text = get_sample_csv_template()
    return Response(
        content=csv_text,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=campusmate_tasks_template.csv"}
    )

@app.get("/api/tasks/export.csv")
def export_tasks_csv(db: Session = Depends(get_db)):
    tasks = db.query(Task).order_by(Task.due_date.asc()).all()
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["Title", "Course", "DueDate", "Priority", "Category", "Status", "EstimatedHours", "IsSample", "Description"])
    for t in tasks:
        writer.writerow([t.title, t.course, t.due_date, t.priority, t.category, t.status, t.estimated_hours, t.is_sample, t.description])
    return Response(
        content=output.getvalue(),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=campusmate_tasks.csv"}
    )

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

def format_ics_datetime(date_str: str, time_str: str = "") -> str:
    clean_date = date_str.replace("-", "").strip()
    hour, minute = 9, 0
    if time_str:
        match = re.search(r'(\d+):(\d+)\s*(AM|PM)?', time_str, re.IGNORECASE)
        if match:
            h = int(match.group(1))
            m = int(match.group(2))
            ampm = match.group(3)
            if ampm:
                if ampm.upper() == "PM" and h < 12:
                    h += 12
                elif ampm.upper() == "AM" and h == 12:
                    h = 0
            hour, minute = h, m
    return f"{clean_date}T{hour:02d}{minute:02d}00"

@app.delete("/api/study-plans/{plan_id}")
def delete_study_plan(plan_id: int, db: Session = Depends(get_db)):
    plan = db.query(StudyPlan).filter(StudyPlan.id == plan_id).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Study plan not found")
    db.delete(plan)
    db.commit()
    return {"success": True, "message": "Study plan deleted"}

@app.get("/api/study-plans/{plan_id}/export.ics")
def export_study_plan_ics(plan_id: int, db: Session = Depends(get_db)):
    plan = db.query(StudyPlan).filter(StudyPlan.id == plan_id).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Study plan not found")
        
    cal_lines = [
        "BEGIN:VCALENDAR",
        "VERSION:2.0",
        "PRODID:-//CampusMate AI//Academic Companion//EN",
        "CALSCALE:GREGORIAN",
        "METHOD:PUBLISH",
        f"X-WR-CALNAME:{plan.subject} Study Plan",
        "X-WR-TIMEZONE:UTC",
    ]
    
    now_stamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    milestones = json.loads(plan.milestones_json) if plan.milestones_json else []
    
    for idx, m in enumerate(milestones):
        m_date = m.get("date", plan.target_exam_date)
        dtstart = format_ics_datetime(m_date, "18:00")
        dtend = format_ics_datetime(m_date, "20:00")
        topic = m.get("topic", f"Study Session {idx+1}")
        action = m.get("action_item", "")
        cal_lines.extend([
            "BEGIN:VEVENT",
            f"UID:plan-{plan.id}-m{idx}@campusmate.ai",
            f"DTSTAMP:{now_stamp}",
            f"DTSTART:{dtstart}",
            f"DTEND:{dtend}",
            f"SUMMARY:{plan.subject} Study: {topic}",
            f"DESCRIPTION:Milestone: {action} | Target Exam: {plan.target_exam_date}",
            "END:VEVENT"
        ])
        
    cal_lines.append("END:VCALENDAR")
    ics_body = "\r\n".join(cal_lines)
    clean_subj = re.sub(r'[^a-zA-Z0-9_]', '_', plan.subject.lower())
    return Response(
        content=ics_body,
        media_type="text/calendar",
        headers={"Content-Disposition": f"attachment; filename={clean_subj}_study_plan.ics"}
    )

# ----------------- SCHEDULE -----------------

@app.get("/api/schedule", response_model=List[schemas.ScheduleItemResponse])
def get_schedule(date_str: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(ScheduleItem)
    if date_str:
        query = query.filter(ScheduleItem.date == date_str)
    return query.order_by(ScheduleItem.date.asc(), ScheduleItem.start_time.asc()).all()

@app.get("/api/schedule/export.ics")
def export_schedule_ics(db: Session = Depends(get_db)):
    schedule_items = db.query(ScheduleItem).order_by(ScheduleItem.date.asc(), ScheduleItem.start_time.asc()).all()
    tasks = db.query(Task).filter(Task.status != "Completed").all()
    
    cal_lines = [
        "BEGIN:VCALENDAR",
        "VERSION:2.0",
        "PRODID:-//CampusMate AI//Academic Companion//EN",
        "CALSCALE:GREGORIAN",
        "METHOD:PUBLISH",
        "X-WR-CALNAME:CampusMate Schedule & Deadlines",
        "X-WR-TIMEZONE:UTC",
    ]
    
    now_stamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    
    for item in schedule_items:
        dtstart = format_ics_datetime(item.date, item.start_time)
        dtend = format_ics_datetime(item.date, item.end_time if item.end_time and item.end_time != "--" else item.start_time)
        cal_lines.extend([
            "BEGIN:VEVENT",
            f"UID:sched-{item.id}@campusmate.ai",
            f"DTSTAMP:{now_stamp}",
            f"DTSTART:{dtstart}",
            f"DTEND:{dtend}",
            f"SUMMARY:{item.title} ({item.category})",
            f"LOCATION:{item.location}",
            f"DESCRIPTION:{item.notes or item.title}",
            "END:VEVENT"
        ])
        
    for task in tasks:
        dtstart = format_ics_datetime(task.due_date, "23:59")
        dtend = format_ics_datetime(task.due_date, "23:59")
        cal_lines.extend([
            "BEGIN:VEVENT",
            f"UID:task-{task.id}@campusmate.ai",
            f"DTSTAMP:{now_stamp}",
            f"DTSTART:{dtstart}",
            f"DTEND:{dtend}",
            f"SUMMARY:DUE: {task.title} [{task.course}]",
            f"DESCRIPTION:Category: {task.category} | Priority: {task.priority} | {task.description}",
            "END:VEVENT"
        ])
        
    cal_lines.append("END:VCALENDAR")
    ics_body = "\r\n".join(cal_lines)
    return Response(
        content=ics_body,
        media_type="text/calendar",
        headers={"Content-Disposition": "attachment; filename=campusmate_schedule.ics"}
    )

@app.post("/api/schedule", response_model=schemas.ScheduleItemResponse)
def add_schedule_item(item_in: schemas.ScheduleItemCreate, db: Session = Depends(get_db)):
    item = ScheduleItem(**item_in.model_dump())
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

@app.post("/api/schedule/import-file")
async def import_schedule_file(file: UploadFile = File(...), db: Session = Depends(get_db)):
    contents = await file.read()
    filename = (file.filename or "").lower()
    
    parsed = []
    if filename.endswith(".xlsx") or filename.endswith(".xls"):
        parsed = parse_tasks_from_xlsx(contents)
    elif filename.endswith(".pdf"):
        parsed = parse_tasks_from_pdf(contents)
    else:
        parsed = parse_schedule_from_csv(contents)
        
    if not parsed:
        raise HTTPException(
            status_code=400,
            detail="Could not detect or parse schedule items from the uploaded file."
        )
        
    created_items = []
    for item in parsed:
        sched = ScheduleItem(
            title=item.get("title", "Lecture"),
            start_time=item.get("start_time", "09:00 AM"),
            end_time=item.get("end_time", "10:30 AM"),
            category=item.get("category", "Class"),
            date=item.get("date", date.today().strftime("%Y-%m-%d")),
            location=item.get("location", "Campus"),
            is_completed=False,
            is_sample=False,
            notes=item.get("notes", f"Imported timetable item from {file.filename}")
        )
        db.add(sched)
        created_items.append(sched)
        
    db.commit()
    for s in created_items:
        db.refresh(s)
        
    return {
        "success": True,
        "count": len(created_items),
        "message": f"Successfully imported {len(created_items)} timetable blocks from {file.filename}."
    }

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
            verification_notes=getattr(n, "verification_notes", "Official CCE Notice") if n.is_verified else "User Uploaded (Unverified)",
            source=n.source,
            source_url=getattr(n, "source_url", "https://cce.edu.in/"),
            pdf_filename=n.pdf_filename
        ))
    return results

@app.post("/api/notices", response_model=schemas.NoticeResponse)
def create_notice(notice_in: schemas.NoticeCreate, db: Session = Depends(get_db)):
    analysis = extract_notice_bulletins(notice_in.content)
    # Only label as verified if origin is authenticated official college publication
    is_official = any(k in notice_in.source.lower() for k in ["cce", "christ", "controller", "dean of academic", "autonomous"])
    is_verified = is_official
    verification_notes = "Verified CCE Official Circular" if is_verified else "User Submitted Notice (Unverified)"
    source_url = "https://cce.edu.in/" if is_verified else ""

    notice = Notice(
        title=notice_in.title,
        category=notice_in.category,
        date=notice_in.date,
        content=notice_in.content,
        summary=analysis["summary"],
        action_items_json=json.dumps(analysis["action_items"]),
        important_dates_json=json.dumps(analysis["important_dates"]),
        is_verified=is_verified,
        verification_notes=verification_notes,
        source=notice_in.source,
        source_url=source_url
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
        verification_notes=notice.verification_notes,
        source=notice.source,
        source_url=notice.source_url,
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
    # Check if uploaded source is certified official
    is_official = any(k in source.lower() for k in ["cce official", "christ college", "controller of examinations"])
    is_verified = is_official
    verification_notes = "Verified CCE Official Document" if is_verified else "User Uploaded Notice (Unverified - Pending Review)"
    source_url = "https://cce.edu.in/" if is_verified else ""

    notice = Notice(
        title=title,
        category=category,
        date=date.today().strftime("%Y-%m-%d"),
        content=extracted_text,
        summary=analysis["summary"],
        action_items_json=json.dumps(analysis["action_items"]),
        important_dates_json=json.dumps(analysis["important_dates"]),
        is_verified=is_verified,
        verification_notes=verification_notes,
        source=source,
        source_url=source_url,
        pdf_filename=file.filename
    )
    db.add(notice)
    db.commit()
    db.refresh(notice)

    # If key dates were found in the uploaded notice, support auto-creating an unverified event
    imported_event_id = None
    if analysis["important_dates"]:
        first_date_entry = analysis["important_dates"][0]
        match = re.search(r'\d{4}-\d{2}-\d{2}', first_date_entry)
        event_date = match.group(0) if match else date.today().strftime("%Y-%m-%d")
        
        # Check if already imported
        existing_event = db.query(ClubEvent).filter(ClubEvent.title == f"Notice Event: {title[:80]}").first()
        if not existing_event:
            new_ev = ClubEvent(
                title=f"Notice Event: {title[:80]}",
                club_name="Uploaded Notice",
                category=category if category in ["Technical", "Cultural", "Sports", "Entrepreneurship"] else "Academic",
                date=event_date,
                time="TBA",
                location="Christ College of Engineering, Irinjalakuda",
                venue="Christ College of Engineering, Irinjalakuda",
                organizer=source,
                description=analysis["summary"] or extracted_text[:200],
                registration_deadline="",
                registration_link="",
                source_url="",
                source_name=f"User Uploaded Notice ({file.filename})",
                is_verified=False,
                verification_notes="Unverified Information (Extracted from User Notice)",
                is_upcoming=(event_date >= date.today().strftime("%Y-%m-%d")),
                is_registered=False,
                tags="Notice, Uploaded"
            )
            db.add(new_ev)
            db.commit()
            imported_event_id = new_ev.id

    return {
        "success": True, 
        "notice_id": notice.id, 
        "is_verified": notice.is_verified,
        "verification_notes": notice.verification_notes,
        "extracted_dates": analysis["important_dates"],
        "imported_event_id": imported_event_id
    }

# ----------------- CLUBS & EVENTS -----------------

@app.get("/api/events", response_model=List[schemas.ClubEventResponse])
def get_events(
    category: Optional[str] = None, 
    status: Optional[str] = "all", # 'upcoming', 'past', 'all'
    db: Session = Depends(get_db)
):
    today_str = date.today().strftime("%Y-%m-%d")
    query = db.query(ClubEvent)
    if category and category != "All":
        query = query.filter(ClubEvent.category == category)
    
    if status == "upcoming":
        query = query.filter(ClubEvent.date >= today_str)
        return query.order_by(ClubEvent.date.asc()).all()
    elif status == "past":
        query = query.filter(ClubEvent.date < today_str)
        return query.order_by(ClubEvent.date.desc()).all()
        
    # 'all': Upcoming first in ascending order, then Past in descending order
    all_events = query.all()
    upcoming = [e for e in all_events if e.date >= today_str]
    past = [e for e in all_events if e.date < today_str]
    upcoming.sort(key=lambda x: x.date)
    past.sort(key=lambda x: x.date, reverse=True)
    return upcoming + past

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
                start_time=event.time or "09:00 AM",
                end_time="--",
                category="Event",
                date=event.date,
                location=event.venue or event.location,
                is_completed=False,
                notes=f"Registered for campus event: {event.description[:100]} | Source: {event.source_url}"
            )
            db.add(sched)
    
    db.commit()
    db.refresh(event)
    return {"success": True, "is_registered": event.is_registered}

# ----------------- SYNCHRONIZATION WITH CCE PORTAL -----------------

@app.post("/api/sync/cce", response_model=schemas.CCESyncResponse)
def trigger_cce_sync(db: Session = Depends(get_db)):
    result = cce_service.sync_cce_data(db)
    return schemas.CCESyncResponse(
        success=result["success"],
        message=result["message"],
        events_imported=result["events_imported"],
        events_updated=result["events_updated"],
        total_events=result["total_events"],
        upcoming_events=result["upcoming_events"],
        past_events=result["past_events"],
        last_synced_at=result["last_synced_at"],
        source_url=result["source_url"]
    )

@app.get("/api/sync/status")
def get_cce_sync_status(db: Session = Depends(get_db)):
    settings = db.query(UserSettings).first()
    today_str = date.today().strftime("%Y-%m-%d")
    total = db.query(ClubEvent).count()
    upcoming = db.query(ClubEvent).filter(ClubEvent.date >= today_str).count()
    past = db.query(ClubEvent).filter(ClubEvent.date < today_str).count()
    
    return {
        "last_synced_at": settings.last_cce_sync if (settings and settings.last_cce_sync) else "Not synced yet",
        "status": settings.last_sync_status if settings else "Ready",
        "primary_source": cce_service.CCE_PRIMARY_URL,
        "ieee_source": cce_service.CCE_IEEE_URL,
        "total_events": total,
        "upcoming_events": upcoming,
        "past_events": past
    }

# ----------------- CAMPUS DOCUMENTS (RAG) -----------------

@app.get("/api/documents", response_model=List[schemas.DocumentResponse])
def get_documents(db: Session = Depends(get_db)):
    return db.query(CampusDocument).order_by(CampusDocument.id.desc()).all()

@app.post("/api/documents/search")
def search_documents(query_payload: Dict[str, str], db: Session = Depends(get_db)):
    query = query_payload.get("query", "")
    return tools.tool_search_documents(db, query)

@app.post("/api/documents/{doc_id}/ask")
def ask_document(doc_id: int, payload: Dict[str, str], db: Session = Depends(get_db)):
    doc = db.query(CampusDocument).filter(CampusDocument.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    question = payload.get("question", "").strip()
    if not question:
        raise HTTPException(status_code=400, detail="Question is required")
        
    paragraphs = [p.strip() for p in doc.content.split("\n\n") if p.strip()]
    q_words = [w.lower() for w in question.split() if len(w) > 2]
    
    scored = []
    for p in paragraphs:
        score = sum(p.lower().count(w) for w in q_words)
        if score > 0:
            scored.append((score, p))
            
    scored.sort(key=lambda x: x[0], reverse=True)
    if scored:
        best_p = scored[0][1]
        answer = f"According to the official {doc.title}:\n\n{best_p}"
    else:
        answer = f"According to {doc.title}:\n\n{doc.summary}"
        best_p = doc.summary

    return {
        "success": True,
        "document_id": doc.id,
        "document_title": doc.title,
        "question": question,
        "answer": answer,
        "snippet": best_p,
        "source_file": doc.source_file or f"{doc.title}.pdf"
    }

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
    result = agent.process_message(chat_in.message, chat_in.context, chat_in.history)
    return schemas.AgentChatResponse(
        response=result["response"],
        thought_process=result["thought_process"],
        tool_called=result.get("tool_called"),
        tool_input=result.get("tool_input"),
        tool_output=result.get("tool_output"),
        is_demo=result.get("is_demo", True),
        is_error=result.get("is_error", False),
        verified_sources=result.get("verified_sources", [])
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
        
    env_key = os.getenv("OPENAI_API_KEY", "") if settings.ai_mode == "openai" else os.getenv("GEMINI_API_KEY", "")
    has_api_key = bool(settings.api_key or env_key)
    
    return {
        "student_name": settings.student_name,
        "student_id": settings.student_id,
        "major": settings.major,
        "semester": settings.semester,
        "email": settings.email,
        "ai_mode": settings.ai_mode,
        "api_key_masked": settings.api_key_masked or ("••••••••" if has_api_key else ""),
        "has_api_key": has_api_key,
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
        
    if payload.api_key is not None and payload.api_key.strip():
        key = payload.api_key.strip()
        settings.api_key = key
        settings.api_key_masked = key[:4] + "..." + key[-4:] if len(key) > 8 else "••••••••"
        if settings.ai_mode == "openai":
            os.environ["OPENAI_API_KEY"] = key
        elif settings.ai_mode == "gemini":
            os.environ["GEMINI_API_KEY"] = key
            
    db.commit()
    return {"success": True, "message": "Settings updated"}

@app.post("/api/reset-data")
def reset_campus_data(db: Session = Depends(get_db)):
    seed_database(db, force=True)
    return {"success": True, "message": "Campus database reset to official default state."}

@app.post("/api/clear-sample-data")
def clear_sample_demo_records(db: Session = Depends(get_db)):
    res = clear_sample_data(db)
    return res

# ----------------- NOTIFICATIONS -----------------

@app.get("/api/notifications", response_model=List[schemas.NotificationItem])
def get_notifications(db: Session = Depends(get_db)):
    today = date.today()
    today_str = today.strftime("%Y-%m-%d")
    near_deadline = (today + timedelta(days=3)).strftime("%Y-%m-%d")
    exam_window = (today + timedelta(days=14)).strftime("%Y-%m-%d")
    
    notifications: List[schemas.NotificationItem] = []
    
    # 1. Urgent Deadlines (due today or within 3 days)
    urgent_tasks = db.query(Task).filter(
        Task.status != "Completed",
        Task.due_date <= near_deadline
    ).order_by(Task.due_date.asc()).limit(3).all()
    
    for t in urgent_tasks:
        if t.due_date < today_str:
            msg = f"Overdue! Was due on {t.due_date} ({t.course})"
            prio = "High"
        elif t.due_date == today_str:
            msg = f"Due today! ({t.course})"
            prio = "High"
        else:
            try:
                days_left = (datetime.strptime(t.due_date, "%Y-%m-%d").date() - today).days
                msg = f"Due in {days_left} days ({t.course})"
            except Exception:
                msg = f"Due soon ({t.course})"
            prio = "Medium"
            
        notifications.append(schemas.NotificationItem(
            id=f"task-{t.id}",
            title=t.title,
            message=msg,
            category="deadline",
            date=t.due_date,
            link="/tasks",
            priority=prio
        ))
        
    # 2. Upcoming Exams (within 14 days)
    upcoming_exams = db.query(Task).filter(
        Task.status != "Completed",
        Task.category == "Exam",
        Task.due_date >= today_str,
        Task.due_date <= exam_window
    ).order_by(Task.due_date.asc()).limit(2).all()
    
    for ex in upcoming_exams:
        notifications.append(schemas.NotificationItem(
            id=f"exam-{ex.id}",
            title=f"Upcoming Exam: {ex.title}",
            message=f"Exam date: {ex.due_date} ({ex.course}) - Start revision roadmap",
            category="exam",
            date=ex.due_date,
            link="/study-planner",
            priority="High"
        ))
        
    # 3. Official Notices
    recent_notices = db.query(Notice).order_by(Notice.id.desc()).limit(2).all()
    for n in recent_notices:
        notifications.append(schemas.NotificationItem(
            id=f"notice-{n.id}",
            title=n.title,
            message=f"{n.category} circular from {n.source}",
            category="notice",
            date=n.date,
            link="/notices",
            priority="Normal"
        ))
        
    # 4. Registered Club Events
    reg_events = db.query(ClubEvent).filter(
        ClubEvent.is_registered == True,
        ClubEvent.date >= today_str
    ).order_by(ClubEvent.date.asc()).limit(2).all()
    for ev in reg_events:
        notifications.append(schemas.NotificationItem(
            id=f"event-{ev.id}",
            title=f"Event RSVP: {ev.title}",
            message=f"{ev.date} at {ev.time} @ {ev.venue or ev.location}",
            category="event",
            date=ev.date,
            link="/clubs-events",
            priority="Normal"
        ))
        
    return notifications
