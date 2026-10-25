import os
import json
import re
from datetime import datetime, date, timedelta
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
import tools
from models import AgentInteraction, UserSettings, Notice, CampusDocument

def get_current_ai_settings(db: Session) -> Dict[str, Any]:
    settings = db.query(UserSettings).first()
    if not settings:
        settings = UserSettings()
        db.add(settings)
        db.commit()
        db.refresh(settings)
        
    env_openai = os.getenv("OPENAI_API_KEY", "")
    env_gemini = os.getenv("GEMINI_API_KEY", "")
    
    is_live = bool((settings.ai_mode == "openai" and env_openai) or (settings.ai_mode == "gemini" and env_gemini))
    return {
        "mode": settings.ai_mode,
        "is_live": is_live,
        "student_name": settings.student_name,
        "student_id": settings.student_id,
        "major": settings.major
    }

class CampusAgent:
    def __init__(self, db: Session):
        self.db = db
        self.settings = get_current_ai_settings(db)

    def process_message(self, message: str, context: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Orchestrates intent understanding, tool selection, execution, and synthesis."""
        q = message.strip()
        q_lower = q.lower()
        
        thought_process = []
        tool_called = None
        tool_input = {}
        tool_output = None
        verified_sources = []
        is_demo = not self.settings["is_live"]
        
        thought_process.append(f"Received query: '{q}'")
        thought_process.append("Analyzing intent and mapping to available CampusMate backend tools...")

        # 1. Intent: Create Task
        if any(w in q_lower for w in ["add task", "create task", "add assignment", "remind me to", "new task", "due on", "deadline for"]):
            thought_process.append("Identified intent: TASK_CREATION")
            thought_process.append("Selecting tool: 'create_task'")
            tool_called = "create_task"
            
            # Extract course code if present (e.g., CS304, CS301, MATH201)
            course_match = re.search(r'\b(CS\d+|MATH\d+|ENG\d+|EC\d+|EE\d+)\b', q, re.IGNORECASE)
            course = course_match.group(1).upper() if course_match else "General"
            
            # Extract date if present
            due_date = None
            if "tomorrow" in q_lower:
                due_date = (date.today() + timedelta(days=1)).strftime("%Y-%m-%d")
            elif "friday" in q_lower:
                # next friday
                today = date.today()
                days_ahead = 4 - today.weekday()
                if days_ahead <= 0:
                    days_ahead += 7
                due_date = (today + timedelta(days=days_ahead)).strftime("%Y-%m-%d")
            elif "monday" in q_lower:
                today = date.today()
                days_ahead = 0 - today.weekday()
                if days_ahead <= 0:
                    days_ahead += 7
                due_date = (today + timedelta(days=days_ahead)).strftime("%Y-%m-%d")
            else:
                date_match = re.search(r'(\d{4}-\d{2}-\d{2})', q)
                if date_match:
                    due_date = date_match.group(1)
                else:
                    due_date = (date.today() + timedelta(days=3)).strftime("%Y-%m-%d")

            # Extract title
            title = q
            for prefix in ["add task", "create task", "add assignment", "new task", "remind me to"]:
                if prefix in q_lower:
                    idx = q_lower.find(prefix) + len(prefix)
                    title = q[idx:].strip()
                    break
            
            # Clean title
            title = re.sub(r'due (on|by).*', '', title, flags=re.IGNORECASE).strip()
            if not title:
                title = "New Academic Task"

            priority = "High" if "urgent" in q_lower or "high" in q_lower or "exam" in q_lower else "Medium"
            category = "Exam" if "exam" in q_lower else ("Project" if "project" in q_lower else "Assignment")

            tool_input = {
                "title": title,
                "course": course,
                "due_date": due_date,
                "priority": priority,
                "category": category
            }
            thought_process.append(f"Executing tool 'create_task' with parameters: {json.dumps(tool_input)}")
            tool_output = tools.tool_create_task(
                self.db,
                title=title,
                course=course,
                due_date=due_date,
                priority=priority,
                category=category
            )
            thought_process.append("Task successfully recorded in database.")
            
            response = (
                f"I've added the new task **'{title}'** for **{course}** to your task list!\n\n"
                f"- **Due Date:** {due_date}\n"
                f"- **Priority:** {priority}\n"
                f"- **Category:** {category}\n\n"
                f"You can view and manage it anytime in your **Tasks & Deadlines** tab."
            )

        # 2. Intent: Create Study Plan
        elif any(w in q_lower for w in ["study plan", "study schedule", "prepare for exam", "revision plan"]):
            thought_process.append("Identified intent: STUDY_PLAN_GENERATION")
            thought_process.append("Selecting tool: 'create_study_plan'")
            tool_called = "create_study_plan"
            
            # Extract subject
            subject = "Computer Science"
            if "operating systems" in q_lower or "os" in q_lower:
                subject = "Operating Systems (CS304)"
            elif "database" in q_lower or "dbms" in q_lower:
                subject = "Database Management Systems (CS308)"
            elif "data structures" in q_lower or "dsa" in q_lower:
                subject = "Data Structures & Algorithms (CS301)"
            elif "discrete math" in q_lower or "math" in q_lower:
                subject = "Discrete Mathematics (MATH201)"
            
            exam_date = (date.today() + timedelta(days=6)).strftime("%Y-%m-%d")
            topics = [
                "Unit 1: Core Fundamentals & Theory",
                "Unit 2: Algorithms & Architectures",
                "Unit 3: Problem Solving & Case Studies",
                "Unit 4: High-Yield Practice Sets",
                "Unit 5: Mock Exam & Comprehensive Review"
            ]
            
            tool_input = {
                "subject": subject,
                "target_exam_date": exam_date,
                "daily_hours": 2.5,
                "topics": topics
            }
            thought_process.append(f"Executing tool 'create_study_plan' with 5 structured milestones leading up to {exam_date}...")
            tool_output = tools.tool_create_study_plan(
                self.db,
                subject=subject,
                target_exam_date=exam_date,
                topics=topics,
                daily_hours=2.5
            )
            thought_process.append("Study roadmap created with daily milestones.")

            response = (
                f"I have built a personalized **{tool_output['total_days']}-Day Study Roadmap** for **{subject}**!\n\n"
                f"- **Target Exam Date:** {exam_date}\n"
                f"- **Daily Commitment:** 2.5 Hours/day\n"
                f"- **Total Milestones:** {tool_output['milestones_count']} study sessions\n\n"
                f"**First 3 Sessions:**\n"
                + "\n".join([f"- **Day {m['day']} ({m['date']}):** {m['topic']}" for m in tool_output['milestones'][:3]])
                + f"\n\nCheck out the **Study Planner** tab to see your visual roadmap and start the Focus Timer!"
            )

        # 3. Intent: List Tasks or Deadlines
        elif any(w in q_lower for w in ["deadline", "what assignments", "what tasks", "list tasks", "my homework", "pending tasks"]):
            thought_process.append("Identified intent: RETRIEVE_DEADLINES")
            thought_process.append("Selecting tool: 'list_tasks'")
            tool_called = "list_tasks"
            tool_input = {"status": "Pending"}
            
            thought_process.append("Fetching active pending student tasks from database...")
            tool_output = tools.tool_list_tasks(self.db, status="Pending")
            tasks = tool_output["tasks"]
            thought_process.append(f"Retrieved {len(tasks)} tasks.")

            if tasks:
                items_text = []
                for t in tasks[:5]:
                    items_text.append(f"- **{t['title']}** ({t['course']}) — Due **{t['due_date']}** [{t['priority']} Priority]")
                response = (
                    f"You have **{len(tasks)} pending tasks/deadlines**:\n\n"
                    + "\n".join(items_text)
                    + "\n\nWould you like me to create a focused study block for any of these?"
                )
            else:
                response = "You're all caught up! There are currently no pending tasks in your planner."

        # 4. Intent: Campus Document / Policy Search (RAG)
        elif any(w in q_lower for w in ["policy", "attendance", "grading", "rule", "handbook", "library", "hostel", "syllabus", "credit", "exam rule"]):
            thought_process.append("Identified intent: SEARCH_CAMPUS_DOCUMENTS (RAG)")
            thought_process.append("Selecting tool: 'search_campus_documents'")
            tool_called = "search_campus_documents"
            tool_input = {"query": q}
            
            thought_process.append(f"Searching verified campus documents repository for '{q}'...")
            tool_output = tools.tool_search_documents(self.db, q)
            results = tool_output["results"]
            thought_process.append(f"Found {len(results)} source-backed document matches.")

            if results:
                top_hit = results[0]
                verified_sources.append({
                    "title": top_hit["title"],
                    "category": top_hit["category"],
                    "source": top_hit["source_file"],
                    "verified": "True"
                })
                response = (
                    f"According to the official **{top_hit['title']}** ({top_hit['category']}):\n\n"
                    f"> \"{top_hit['snippet']}\"\n\n"
                    f"**Summary:** {top_hit['summary']}\n\n"
                    f"*Source verified from official campus file: `{top_hit['source_file']}`.*"
                )
            else:
                response = "I checked our campus knowledge base but couldn't find an exact document match. You can upload relevant handbook PDFs in the **Campus Information** section."

        # 5. Intent: Notice / Circular Summary
        elif any(w in q_lower for w in ["notice", "circular", "announcement", "bulletin", "mid-term exam", "fee payment"]):
            thought_process.append("Identified intent: SUMMARIZE_NOTICE")
            thought_process.append("Selecting tool: 'summarize_notice'")
            tool_called = "summarize_notice"
            tool_input = {"query": q}
            
            thought_process.append("Querying latest official college notices...")
            tool_output = tools.tool_summarize_notice(self.db, query=q)
            
            if tool_output.get("success"):
                verified_sources.append({
                    "title": tool_output["title"],
                    "category": tool_output["category"],
                    "source": f"Issued by {tool_output['source']}",
                    "verified": "True"
                })
                actions = "\n".join([f"- {a}" for a in tool_output['action_items']]) if tool_output['action_items'] else "- Review notice details on campus portal"
                dates = ", ".join(tool_output['important_dates']) if tool_output['important_dates'] else "See full notice"
                
                response = (
                    f"Here is the verified summary for **'{tool_output['title']}'** (Issued: {tool_output['date']}):\n\n"
                    f"**Executive Summary:**\n{tool_output['summary']}\n\n"
                    f"**Key Dates:** {dates}\n\n"
                    f"**Action Items for Students:**\n{actions}"
                )
            else:
                response = "No matching campus notices were found. You can browse all announcements in the **Notices** tab."

        # 6. Intent: Clubs and Events
        elif any(w in q_lower for w in ["club", "event", "hackathon", "workshop", "fest", "activity", "activities"]):
            thought_process.append("Identified intent: DISCOVER_EVENTS")
            thought_process.append("Selecting tool: 'get_upcoming_events'")
            tool_called = "get_upcoming_events"
            tool_input = {}
            
            thought_process.append("Fetching active campus clubs and upcoming scheduled events...")
            tool_output = tools.tool_get_upcoming_events(self.db)
            events = tool_output["events"]
            thought_process.append(f"Found {len(events)} campus events.")

            if events:
                event_items = []
                for e in events[:4]:
                    reg_status = "✓ Registered" if e['is_registered'] else "Open"
                    event_items.append(f"- **{e['title']}** by *{e['club_name']}* ({e['category']})\n  🗓️ {e['date']} at {e['time']} | 📍 {e['location']} | Status: {reg_status}")
                response = (
                    f"Here are top upcoming campus events:\n\n"
                    + "\n\n".join(event_items)
                    + "\n\nYou can RSVP and add them to your schedule in the **Clubs & Events** tab!"
                )
            else:
                response = "There are no campus events currently posted."

        # 7. Intent: Today's Schedule
        elif any(w in q_lower for w in ["schedule", "routine", "classes today", "timetable", "what do i have today"]):
            thought_process.append("Identified intent: RETRIEVE_SCHEDULE")
            thought_process.append("Selecting tool: 'get_student_schedule'")
            tool_called = "get_student_schedule"
            tool_input = {"date": date.today().strftime("%Y-%m-%d")}
            
            thought_process.append("Fetching student's timeline for today...")
            tool_output = tools.tool_get_schedule(self.db)
            items = tool_output["schedule"]
            thought_process.append(f"Retrieved {len(items)} scheduled items for today.")

            if items:
                lines = []
                for i in items:
                    done_mark = "✅ " if i['is_completed'] else "⏳ "
                    lines.append(f"{done_mark}**{i['start_time']} - {i['end_time']}**: {i['title']} ({i['category']} @ {i['location']})")
                response = (
                    f"Here is your schedule for today (**{tool_output['date']}**):\n\n"
                    + "\n".join(lines)
                    + "\n\nKeep up the great work! You can check off items on your **Dashboard**."
                )
            else:
                response = "No scheduled activities found for today. Enjoy your free time or schedule a study session!"

        # 8. Intent: Smart Recommendation / Advice
        elif any(w in q_lower for w in ["recommend", "what should i do", "advice", "suggest", "priority"]):
            thought_process.append("Identified intent: SMART_RECOMMENDATION")
            thought_process.append("Selecting tool: 'generate_smart_recommendations'")
            tool_called = "generate_smart_recommendations"
            tool_input = {}
            
            thought_process.append("Analyzing pending coursework, exam timelines, and active plans...")
            tool_output = tools.tool_generate_smart_recommendations(self.db)
            thought_process.append(f"Derived advice category: {tool_output['action_type']}")

            response = (
                f"**CampusMate Academic Recommendation ({tool_output['action_type']}):**\n\n"
                f"{tool_output['recommendation']}\n\n"
                f"- **Pending Tasks:** {tool_output['pending_count']}\n"
                f"- **High Priority Items:** {tool_output['high_priority_count']}\n"
                f"- **Active Study Plans:** {tool_output['active_study_plans']}"
            )

        # 9. Default Fallback Conversational Guidance
        else:
            thought_process.append("General academic assistant query. Synthesizing campus context...")
            response = (
                f"Hello! I am **CampusMate AI**, your intelligent campus companion.\n\n"
                f"I can take real actions to keep your academic life on track:\n"
                f"- 📝 **Manage Tasks & Deadlines:** \"Add an Operating Systems assignment due next Friday\"\n"
                f"- 📅 **Generate Study Roadmaps:** \"Create a 5-day study plan for Database Systems exam\"\n"
                f"- 📜 **Search Official College Policies:** \"What is the minimum attendance requirement?\"\n"
                f"- 📢 **Summarize Notices:** \"Summarize the mid-term examination notice\"\n"
                f"- 🎪 **Discover Events & Clubs:** \"What tech events are happening this week?\"\n"
                f"- 🕒 **Check Schedule:** \"What is my schedule for today?\"\n\n"
                f"What would you like to achieve right now?"
            )

        # Save interaction to DB for audit and history
        interaction = AgentInteraction(
            query=message,
            thought_process=json.dumps(thought_process),
            tool_called=tool_called or "conversational_reasoner",
            tool_input=json.dumps(tool_input),
            tool_output=json.dumps(tool_output) if tool_output else "{}",
            response=response,
            is_demo=is_demo
        )
        self.db.add(interaction)
        self.db.commit()

        return {
            "response": response,
            "thought_process": thought_process,
            "tool_called": tool_called,
            "tool_input": tool_input,
            "tool_output": tool_output,
            "is_demo": is_demo,
            "verified_sources": verified_sources
        }
