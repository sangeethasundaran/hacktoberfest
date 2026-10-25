import json
from datetime import date, timedelta
from sqlalchemy.orm import Session
from models import Task, StudyPlan, ScheduleItem, Notice, ClubEvent, CampusDocument, UserSettings

def seed_database(db: Session, force: bool = False):
    """Populates realistic initial campus data if database is empty."""
    if not force and db.query(Task).count() > 0:
        return {"status": "already_seeded"}

    # Clear existing if force
    if force:
        db.query(Task).delete()
        db.query(StudyPlan).delete()
        db.query(ScheduleItem).delete()
        db.query(Notice).delete()
        db.query(ClubEvent).delete()
        db.query(CampusDocument).delete()
        db.query(UserSettings).delete()
        db.commit()

    today = date.today()
    today_str = today.strftime("%Y-%m-%d")

    # 1. User Settings
    user = UserSettings(
        student_name="Alex Chen",
        student_id="CS-2024-8842",
        major="Computer Science & Engineering",
        semester="Semester 5 (Fall 2026)",
        email="alex.chen@campus.edu",
        ai_mode="demo"
    )
    db.add(user)

    # 2. Tasks
    tasks_data = [
        Task(
            title="Operating Systems Lab 4: Virtual Memory Simulation",
            course="CS304",
            due_date=(today + timedelta(days=2)).strftime("%Y-%m-%d"),
            priority="High",
            category="Assignment",
            status="Pending",
            estimated_hours=3.5,
            description="Implement LRU and Clock page replacement algorithms in C++."
        ),
        Task(
            title="Database Systems Project: Indexing & Query Optimization",
            course="CS308",
            due_date=(today + timedelta(days=4)).strftime("%Y-%m-%d"),
            priority="Medium",
            category="Project",
            status="Pending",
            estimated_hours=4.0,
            description="Benchmark B-Tree vs Hash index performance on 1M tuples."
        ),
        Task(
            title="Discrete Mathematics Problem Set: Graph Coloring",
            course="MATH201",
            due_date=(today + timedelta(days=1)).strftime("%Y-%m-%d"),
            priority="High",
            category="Assignment",
            status="Pending",
            estimated_hours=2.0,
            description="Submit solutions for exercises 4.1 to 4.5."
        ),
        Task(
            title="Mid-Term Examination: Operating Systems",
            course="CS304",
            due_date=(today + timedelta(days=9)).strftime("%Y-%m-%d"),
            priority="High",
            category="Exam",
            status="Pending",
            estimated_hours=8.0,
            description="Covers processes, threads, CPU scheduling, synchronization, and virtual memory."
        ),
        Task(
            title="Software Engineering Sprint 2 Demo",
            course="CS320",
            due_date=(today + timedelta(days=6)).strftime("%Y-%m-%d"),
            priority="Medium",
            category="Project",
            status="In Progress",
            estimated_hours=3.0,
            description="Prepare 10-minute sprint demo and user story acceptance testing."
        ),
        Task(
            title="Computer Networks Socket Programming Lab",
            course="CS312",
            due_date=(today - timedelta(days=2)).strftime("%Y-%m-%d"),
            priority="Medium",
            category="Lab",
            status="Completed",
            estimated_hours=2.5,
            description="Build multi-threaded chat server using TCP sockets."
        ),
        Task(
            title="Mid-Term Examination: Database Systems",
            course="CS308",
            due_date=(today + timedelta(days=12)).strftime("%Y-%m-%d"),
            priority="High",
            category="Exam",
            status="Pending",
            estimated_hours=6.0,
            description="Covers Relational Algebra, SQL, Normalization (1NF-BCNF), and Storage."
        )
    ]
    db.add_all(tasks_data)

    # 3. Study Plan
    exam_date = (today + timedelta(days=9)).strftime("%Y-%m-%d")
    topics = [
        "Process Scheduling & CPU Context Switching",
        "Synchronization: Mutexes, Semaphores & Deadlock Avoidance",
        "Memory Management: Paging, Segmentation & Virtual Memory",
        "File Systems & I/O Hardware Interface",
        "Mock Exam & Past 5-Year Question Solving"
    ]
    milestones = []
    for i, t in enumerate(topics):
        m_date = (today + timedelta(days=i * 2)).strftime("%Y-%m-%d")
        milestones.append({
            "day": i + 1,
            "date": m_date,
            "topic": t,
            "duration_hours": 2.5,
            "completed": (i == 0),
            "notes": "Solve practice questions from textbook chapters 3-7."
        })

    study_plan = StudyPlan(
        subject="Operating Systems (CS304)",
        target_exam_date=exam_date,
        daily_hours=2.5,
        total_days=9,
        topics_json=json.dumps(topics),
        milestones_json=json.dumps(milestones),
        status="Active",
        progress_pct=25
    )
    db.add(study_plan)

    # 4. Schedule Items for Today
    schedule_data = [
        ScheduleItem(
            title="CS304: Operating Systems Lecture",
            start_time="09:00 AM",
            end_time="10:30 AM",
            category="Class",
            date=today_str,
            location="Lecture Hall 201",
            is_completed=True,
            notes="Discussing Belady's Anomaly and Optimal Page Replacement."
        ),
        ScheduleItem(
            title="CS308: Database Systems Lab",
            start_time="11:00 AM",
            end_time="12:30 PM",
            category="Lab",
            date=today_str,
            location="Computing Lab 3",
            is_completed=False,
            notes="Implementing B+ tree queries on PostgreSQL."
        ),
        ScheduleItem(
            title="CS301: Algorithms Problem Solving",
            start_time="02:00 PM",
            end_time="03:30 PM",
            category="Class",
            date=today_str,
            location="Lecture Hall 104",
            is_completed=False,
            notes="Dijkstra's & Bellman-Ford algorithm complexity."
        ),
        ScheduleItem(
            title="Deep Work: Virtual Memory Lab Assignment",
            start_time="04:30 PM",
            end_time="06:00 PM",
            category="Study",
            date=today_str,
            location="Library 2nd Floor Quiet Zone",
            is_completed=False,
            notes="Code page fault counter and FIFO replacement."
        ),
        ScheduleItem(
            title="ACM Student Chapter Weekly Technical Meet",
            start_time="07:00 PM",
            end_time="08:30 PM",
            category="Event",
            date=today_str,
            location="Main Auditorium",
            is_completed=False,
            notes="Tech talk on Building Agentic AI Apps."
        )
    ]
    db.add_all(schedule_data)

    # 5. Notices
    notices_data = [
        Notice(
            title="Mid-Term Examination Schedule & Admit Card Protocol",
            category="Academic",
            date=today_str,
            content="Official Circular: The Mid-Term Examinations for Fall Semester 2026 will commence from November 2, 2026. All students must download their digital admit cards from the campus ERP portal by October 30. No student will be permitted into the examination hall without their physical student ID and hall ticket. Non-programmable calculators are allowed for Engineering Mathematics and Thermodynamics only.",
            summary="Mid-Term exams commence on November 2, 2026. Mandatory to download digital admit cards by October 30. Physical student ID and hall ticket are required for entry.",
            action_items_json=json.dumps([
                "Download digital admit card from campus ERP by October 30",
                "Verify student photo and course codes on admit card",
                "Ensure physical campus ID card is active"
            ]),
            important_dates_json=json.dumps([
                "October 30, 2026: Admit card portal closes",
                "November 2, 2026: Mid-Term examinations commence",
                "November 11, 2026: Examination conclusion"
            ]),
            is_verified=True,
            source="Office of the Controller of Examinations",
            pdf_filename="CIRCULAR_2026_FALL_EXAM_SCHEDULE.pdf"
        ),
        Notice(
            title="Annual Tech Fest 'Innovate 2026' Hackathon Registrations Open",
            category="Administrative",
            date=(today - timedelta(days=1)).strftime("%Y-%m-%d"),
            content="The Dean of Student Affairs announces the 12th Edition of Innovate 2026 Hackathon. Teams of 2 to 4 students from all engineering branches are invited to submit their project proposals. Tracks include Generative AI, Sustainable Smart Cities, and FinTech. Total cash prize pool is $5,000 with internship fast-tracks with industry sponsors. Proposal deadline is November 5, 2026.",
            summary="Innovate 2026 Hackathon registrations open. Tracks include Generative AI and Smart Cities. Teams of 2-4 students. $5,000 prize pool. Registration closes Nov 5, 2026.",
            action_items_json=json.dumps([
                "Form team of 2-4 students",
                "Submit project abstract via hackathon.campus.edu",
                "Attend briefing webinar on November 3"
            ]),
            important_dates_json=json.dumps([
                "November 5, 2026: Abstract submission deadline",
                "November 14-16, 2026: Hackathon Grand Finale"
            ]),
            is_verified=True,
            source="Dean of Student Affairs",
            pdf_filename="TECHFEST_2026_CALL_FOR_TEAMS.pdf"
        ),
        Notice(
            title="Library Extended Operating Hours for Mid-Term Period",
            category="Academic",
            date=(today - timedelta(days=2)).strftime("%Y-%m-%d"),
            content="In view of upcoming mid-term examinations, the Central University Library will remain open 24 hours a day starting October 26 through November 12. Floors 2 and 3 are designated as Silent Study Zones. Night canteen services will operate in the courtyard until 03:00 AM. Access between 11:00 PM and 06:00 AM requires biometric check-in at the main gate.",
            summary="Central Library open 24/7 from October 26 to November 12. Floors 2 & 3 designated Silent Study Zones. Night canteen available until 3 AM.",
            action_items_json=json.dumps([
                "Carry student RFID badge for night access",
                "Adhere to silent study guidelines on upper floors"
            ]),
            important_dates_json=json.dumps([
                "October 26, 2026: 24/7 schedule begins",
                "November 12, 2026: Regular library hours resume"
            ]),
            is_verified=True,
            source="University Chief Librarian",
            pdf_filename="LIBRARY_HOURS_OCT_NOV_2026.pdf"
        ),
        Notice(
            title="Campus Placement Drive: Google & Microsoft Pre-Placement Talks",
            category="Placement",
            date=(today - timedelta(days=3)).strftime("%Y-%m-%d"),
            content="The Training and Placement Cell invites eligible pre-final and final year students to attend pre-placement sessions for software engineering and data science roles. Minimum eligibility is CGPA 7.5 with no active backlogs. Resume upload deadline on the placement portal is October 28, 2026.",
            summary="Google and Microsoft pre-placement sessions for software roles. Minimum CGPA requirement 7.5. Resume deadline is October 28, 2026.",
            action_items_json=json.dumps([
                "Upload updated ATS-friendly resume to placement portal",
                "Register for campus attendance slot before Oct 28"
            ]),
            important_dates_json=json.dumps([
                "October 28, 2026: Portal registration deadline",
                "October 31, 2026: Pre-Placement Talk in Main Auditorium"
            ]),
            is_verified=True,
            source="Training & Placement Cell (T&P)",
            pdf_filename="PLACEMENT_DRIVE_PPT_OCT2026.pdf"
        )
    ]
    db.add_all(notices_data)

    # 6. Club Events
    events_data = [
        ClubEvent(
            title="HackCampus 2026: 36-Hour Hackathon",
            club_name="ACM Student Chapter",
            category="Technical",
            date=(today + timedelta(days=5)).strftime("%Y-%m-%d"),
            time="09:00 AM",
            location="CS Complex & Innovation Lab",
            description="Build agentic AI applications and IoT solutions. Mentors from top tech companies, free meals, and $3,000 in bounties.",
            is_registered=True,
            tags="AI, Hackathon, Coding, Prizes"
        ),
        ClubEvent(
            title="Generative AI & Agentic Systems Masterclass",
            club_name="Google Developer Student Club (GDSC)",
            category="Technical",
            date=(today + timedelta(days=3)).strftime("%Y-%m-%d"),
            time="04:30 PM",
            location="Seminar Hall B",
            description="Hands-on workshop building autonomous agents using LLM tool calling, RAG pipelines, and vector databases.",
            is_registered=False,
            tags="Workshop, Agents, AI, Free Swag"
        ),
        ClubEvent(
            title="Startup Pitch Battle & Venture Fireside",
            club_name="E-Cell (Entrepreneurship Cell)",
            category="Entrepreneurship",
            date=(today + timedelta(days=7)).strftime("%Y-%m-%d"),
            time="02:00 PM",
            location="Campus Incubation Hub",
            description="10 student-founded startups pitch to angel investors and alumni founders. Networking dinner included.",
            is_registered=False,
            tags="Startups, Pitching, Funding"
        ),
        ClubEvent(
            title="Acoustic Sunset Jam & Open Mic",
            club_name="Cultural & Music Society",
            category="Cultural",
            date=(today + timedelta(days=4)).strftime("%Y-%m-%d"),
            time="06:00 PM",
            location="Open Air Amphitheatre",
            description="Unwind before mid-terms with live acoustic performances, poetry readings, and student indie bands.",
            is_registered=False,
            tags="Music, Relax, Open Mic"
        ),
        ClubEvent(
            title="Inter-Department Futsal Tournament",
            club_name="University Sports Council",
            category="Sports",
            date=(today + timedelta(days=8)).strftime("%Y-%m-%d"),
            time="04:00 PM",
            location="North Sports Complex",
            description="Annual 5-a-side futsal tournament. CS vs ECE kickoff match on Friday afternoon.",
            is_registered=False,
            tags="Sports, Tournament, Football"
        )
    ]
    db.add_all(events_data)

    # 7. Official Campus Documents (for RAG)
    docs_data = [
        CampusDocument(
            title="University Academic Regulations & Grading Policy",
            category="Academic Policy",
            file_type="PDF",
            source_file="ACADEMIC_REGULATIONS_2026.pdf",
            summary="Outlines 10-point GPA scale, course credit weights, assignment late penalties, and academic probation standards.",
            content="""CAMPUS ACADEMIC REGULATIONS & EVALUATION SYSTEM (2026-2027)
Section 4: Grading System and CGPA Calculation
1. The university operates on a 10-point grading scale:
   - Grade 'O' (Outstanding): 10 grade points (90-100 marks)
   - Grade 'A+' (Excellent): 9 grade points (80-89 marks)
   - Grade 'A' (Very Good): 8 grade points (70-79 marks)
   - Grade 'B+' (Good): 7 grade points (60-69 marks)
   - Grade 'B' (Above Average): 6 grade points (50-59 marks)
   - Grade 'C' (Pass): 5 grade points (40-49 marks)
   - Grade 'F' (Fail): 0 grade points (<40 marks)

Section 7: Late Submission of Coursework
Assignments submitted past the deadline incur a penalty of 10% deduction per 24-hour period. Submissions delayed by more than 72 hours without prior written medical exemption will not be graded and will receive zero credit.

Section 9: Academic Integrity Policy
Any instance of plagiarism, unauthorized collaboration, or illicit use of generative tools without attribution will be referred to the Academic Ethics Committee. First offenses incur zero marks for the component; repeated violations result in disciplinary probation."""
        ),
        CampusDocument(
            title="Student Attendance & Medical Leave Regulations",
            category="Academic Policy",
            file_type="PDF",
            source_file="STUDENT_ATTENDANCE_CODE_2026.pdf",
            summary="Specifies mandatory 75% attendance threshold, medical leave certification procedure, and condonation rules.",
            content="""STUDENT ATTENDANCE & LEAVE CODE
Section 2: Mandatory Attendance Threshold
A minimum attendance of 75% in lectures, tutorials, and practical laboratory sessions is mandatory to be eligible to appear in the end-semester examinations.

Section 3: Condonation of Shortage
Attendance between 65% and 74.9% may be condoned by the Dean of Academic Affairs strictly on valid grounds:
1. Documented medical hospitalization or illness certified by the Chief Medical Officer at the Campus Health Center within 5 working days of return.
2. Official representation of the university in recognized sports, technical hackathons, or cultural conferences with prior authorization.
Attendance below 65% will strictly require repeating the course in subsequent semesters."""
        ),
        CampusDocument(
            title="Central Library Borrowing Rules & Digital Access Handbook",
            category="Policy",
            file_type="PDF",
            source_file="LIBRARY_USER_GUIDE_2026.pdf",
            summary="Details book borrowing quotas (up to 5 books for 14 days), fine structures ($0.50/day), and institutional digital database credentials.",
            content="""CAMPUS CENTRAL LIBRARY CODE OF PRACTICE
Section 1: Membership and Borrowing Quota
- Undergraduate students may borrow up to 5 physical books concurrently for a loan period of 14 days.
- Books may be renewed once online via the Library Portal provided no reservation hold exists.
- Overdue fines accrue at $0.50 per book per calendar day.

Section 4: Digital Research Databases
Students have 24/7 off-campus access to IEEE Xplore, ACM Digital Library, ScienceDirect, and SpringerLink using their university SSO credentials via the OpenAthens proxy at library.campus.edu/ezproxy."""
        ),
        CampusDocument(
            title="Hostel Residence Conduct and Curfew Regulations",
            category="Handbook",
            file_type="PDF",
            source_file="HOSTEL_REGULATIONS_2026.pdf",
            summary="Provides hostel check-in hours (curfew 10:30 PM), silent study hours, guest visitation rules, and safety guidelines.",
            content="""CAMPUS RESIDENCE CODE & HOSTEL MANUAL
Section 3: Curfew and Gate Timings
Hostel residents must swipe their biometric ID cards at the hostel entry gate before 10:30 PM on weekdays and 11:30 PM on weekends. Late entry requests must be pre-approved via the Campus Resident App by the Hostel Warden.

Section 5: Quiet Hours and Community Standards
Quiet study hours are strictly enforced between 11:00 PM and 06:00 AM across all residential blocks. Non-resident visitors are permitted only in the common lounge between 09:00 AM and 07:00 PM."""
        )
    ]
    db.add_all(docs_data)

    db.commit()
    return {"status": "seeded_successfully"}
