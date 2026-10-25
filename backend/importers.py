import io
import re
import csv
from datetime import datetime, date, timedelta
from typing import List, Dict, Any, Optional

def normalize_date_string(date_raw: Any) -> str:
    """Normalizes various date formats into YYYY-MM-DD."""
    if not date_raw:
        return (date.today() + timedelta(days=3)).strftime("%Y-%m-%d")
        
    if isinstance(date_raw, (datetime, date)):
        return date_raw.strftime("%Y-%m-%d")
        
    s = str(date_raw).strip()
    
    # Standard YYYY-MM-DD
    match = re.search(r'(\d{4})-(\d{1,2})-(\d{1,2})', s)
    if match:
        y, m, d = match.groups()
        return f"{int(y):04d}-{int(m):02d}-{int(d):02d}"
        
    # DD/MM/YYYY or DD-MM-YYYY
    match = re.search(r'(\d{1,2})[/-](\d{1,2})[/-](\d{4})', s)
    if match:
        d, m, y = match.groups()
        return f"{int(y):04d}-{int(m):02d}-{int(d):02d}"
        
    # Textual dates: 12 Nov 2026 or Nov 12, 2026
    month_names = {
        'jan': 1, 'feb': 2, 'mar': 3, 'apr': 4, 'may': 5, 'jun': 6,
        'jul': 7, 'aug': 8, 'sep': 9, 'oct': 10, 'nov': 11, 'dec': 12
    }
    match = re.search(r'(\d{1,2})\s+([A-Za-z]{3,9})\s+(\d{4})', s)
    if match:
        d, mon, y = match.groups()
        m = month_names.get(mon[:3].lower(), 1)
        return f"{int(y):04d}-{m:02d}-{int(d):02d}"
        
    match = re.search(r'([A-Za-z]{3,9})\s+(\d{1,2}),?\s+(\d{4})', s)
    if match:
        mon, d, y = match.groups()
        m = month_names.get(mon[:3].lower(), 1)
        return f"{int(y):04d}-{m:02d}-{int(d):02d}"

    return (date.today() + timedelta(days=3)).strftime("%Y-%m-%d")

def normalize_priority(val: Any) -> str:
    s = str(val).strip().capitalize()
    if s in ["High", "Medium", "Low"]:
        return s
    if any(k in s.lower() for k in ["urgent", "1", "high"]):
        return "High"
    if any(k in s.lower() for k in ["low", "3"]):
        return "Low"
    return "Medium"

def normalize_category(val: Any, title: str = "") -> str:
    s = str(val).strip().capitalize()
    valid = ["Assignment", "Exam", "Project", "Lab", "Reading", "Admin"]
    if s in valid:
        return s
    combined = (s + " " + title).lower()
    if "exam" in combined or "midterm" in combined or "final" in combined or "cat" in combined:
        return "Exam"
    if "lab" in combined or "practical" in combined or "experiment" in combined:
        return "Lab"
    if "project" in combined or "capstone" in combined or "demo" in combined:
        return "Project"
    if "reading" in combined or "chapter" in combined:
        return "Reading"
    return "Assignment"

def parse_tasks_from_csv(contents: bytes) -> List[Dict[str, Any]]:
    """Parses CSV, TSV, or plain text table into task dictionaries."""
    try:
        text = contents.decode("utf-8-sig")
    except UnicodeDecodeError:
        text = contents.decode("latin-1", errors="ignore")
        
    lines = [l.strip() for l in text.splitlines() if l.strip()]
    if not lines:
        return []

    # Detect delimiter
    first_line = lines[0]
    delimiter = '\t' if '\t' in first_line else (';' if ';' in first_line else ',')
    
    reader = csv.reader(lines, delimiter=delimiter)
    rows = [r for r in reader if any(field.strip() for field in r)]
    if not rows:
        return []

    header = [h.strip().lower() for h in rows[0]]
    has_header = any(k in " ".join(header) for k in ["title", "task", "course", "due", "subject", "assignment", "deadline", "date"])
    
    data_rows = rows[1:] if has_header else rows
    
    # Map column indexes
    col_map = {
        "title": -1,
        "course": -1,
        "due_date": -1,
        "priority": -1,
        "category": -1,
        "estimated_hours": -1,
        "description": -1
    }
    
    if has_header:
        for idx, h in enumerate(header):
            if any(k in h for k in ["title", "task", "assignment", "name"]):
                if col_map["title"] == -1: col_map["title"] = idx
            elif any(k in h for k in ["course", "subject", "code", "class"]):
                if col_map["course"] == -1: col_map["course"] = idx
            elif any(k in h for k in ["due", "deadline", "date"]):
                if col_map["due_date"] == -1: col_map["due_date"] = idx
            elif any(k in h for k in ["priority", "urgency", "level"]):
                if col_map["priority"] == -1: col_map["priority"] = idx
            elif any(k in h for k in ["category", "type"]):
                if col_map["category"] == -1: col_map["category"] = idx
            elif any(k in h for k in ["hour", "duration", "time", "est"]):
                if col_map["estimated_hours"] == -1: col_map["estimated_hours"] = idx
            elif any(k in h for k in ["desc", "detail", "note"]):
                if col_map["description"] == -1: col_map["description"] = idx

    tasks = []
    for r in data_rows:
        if not r: continue
        
        # If mapping found
        if has_header and col_map["title"] != -1 and col_map["title"] < len(r):
            title = r[col_map["title"]].strip()
            course = r[col_map["course"]].strip() if col_map["course"] != -1 and col_map["course"] < len(r) else "General"
            raw_due = r[col_map["due_date"]].strip() if col_map["due_date"] != -1 and col_map["due_date"] < len(r) else ""
            raw_prio = r[col_map["priority"]].strip() if col_map["priority"] != -1 and col_map["priority"] < len(r) else "Medium"
            raw_cat = r[col_map["category"]].strip() if col_map["category"] != -1 and col_map["category"] < len(r) else "Assignment"
            raw_hours = r[col_map["estimated_hours"]].strip() if col_map["estimated_hours"] != -1 and col_map["estimated_hours"] < len(r) else "2.0"
            desc = r[col_map["description"]].strip() if col_map["description"] != -1 and col_map["description"] < len(r) else ""
        else:
            # Fallback by column order: Title, Course, DueDate, Priority, Category, Hours
            title = r[0].strip() if len(r) > 0 else "Academic Task"
            course = r[1].strip() if len(r) > 1 else "General"
            raw_due = r[2].strip() if len(r) > 2 else ""
            raw_prio = r[3].strip() if len(r) > 3 else "Medium"
            raw_cat = r[4].strip() if len(r) > 4 else "Assignment"
            raw_hours = r[5].strip() if len(r) > 5 else "2.0"
            desc = r[6].strip() if len(r) > 6 else ""

        if not title:
            continue
            
        due_date = normalize_date_string(raw_due)
        priority = normalize_priority(raw_prio)
        category = normalize_category(raw_cat, title)
        
        try:
            hours = float(re.sub(r'[^0-9.]', '', str(raw_hours))) or 2.0
        except Exception:
            hours = 2.0
            
        tasks.append({
            "title": title,
            "course": course or "General",
            "due_date": due_date,
            "priority": priority,
            "category": category,
            "estimated_hours": hours,
            "description": desc or f"Imported assignment for {course}."
        })

    return tasks

def parse_tasks_from_xlsx(contents: bytes) -> List[Dict[str, Any]]:
    """Parses Excel workbook (.xlsx) into task dictionaries using openpyxl."""
    try:
        import openpyxl
        wb = openpyxl.load_workbook(io.BytesIO(contents), data_only=True)
        sheet = wb.active
        
        rows = []
        for row in sheet.iter_rows(values_only=True):
            if any(cell is not None and str(cell).strip() != "" for cell in row):
                rows.append([str(c).strip() if c is not None else "" for c in row])
                
        if not rows:
            return []
            
        # Re-use table parse logic
        csv_buffer = io.StringIO()
        writer = csv.writer(csv_buffer)
        for r in rows:
            writer.writerow(r)
            
        return parse_tasks_from_csv(csv_buffer.getvalue().encode("utf-8"))
    except Exception as e:
        print(f"Error parsing xlsx: {e}")
        return []

def parse_tasks_from_pdf(contents: bytes) -> List[Dict[str, Any]]:
    """
    Extracts text from timetable/exam schedule PDF using regex patterns
    to find courses, dates, and examination titles.
    """
    try:
        from rag import extract_text_from_pdf
        text = extract_text_from_pdf(contents)
        if not text or text.startswith("Error"):
            return []
            
        lines = [l.strip() for l in text.splitlines() if l.strip()]
        tasks = []
        
        # Regex patterns for courses (e.g., CS304, CS 304, MATH201, EC301, ME402)
        course_regex = re.compile(r'\b([A-Z]{2,4}\s*\d{3,4}[A-Z]?)\b')
        date_regex = re.compile(r'(\d{1,2}[/-]\d{1,2}[/-]\d{2,4}|\d{4}-\d{2}-\d{2}|\d{1,2}\s+[A-Za-z]{3,9}\s+\d{4}|[A-Za-z]{3,9}\s+\d{1,2},?\s+\d{4})')
        
        # Look for lines with course code and/or date
        for line in lines:
            c_match = course_regex.search(line)
            d_match = date_regex.search(line)
            
            if c_match or d_match:
                course = c_match.group(1).replace(" ", "") if c_match else "General"
                raw_date = d_match.group(1) if d_match else ""
                due_date = normalize_date_string(raw_date)
                
                # Determine title
                clean_title = re.sub(r'\b[A-Z]{2,4}\s*\d{3,4}[A-Z]?\b', '', line)
                clean_title = re.sub(r'\d{1,2}[/-]\d{1,2}[/-]\d{2,4}', '', clean_title).strip(' -:|')
                if len(clean_title) < 4:
                    clean_title = f"{course} Examination"
                    
                category = "Exam" if any(w in line.lower() for w in ["exam", "test", "cat", "ese", "midterm", "sem"]) else "Assignment"
                
                tasks.append({
                    "title": clean_title[:120],
                    "course": course,
                    "due_date": due_date,
                    "priority": "High" if category == "Exam" else "Medium",
                    "category": category,
                    "estimated_hours": 4.0 if category == "Exam" else 2.5,
                    "description": f"Extracted from timetable document: '{line[:100]}'."
                })
                
        # If line-by-line yielded nothing, look for dates in overall text
        if not tasks:
            from rag import extract_notice_bulletins
            analysis = extract_notice_bulletins(text)
            for idx, date_str in enumerate(analysis.get("important_dates", [])):
                tasks.append({
                    "title": f"Academic Deadline {idx+1}",
                    "course": "General",
                    "due_date": normalize_date_string(date_str),
                    "priority": "High",
                    "category": "Exam",
                    "estimated_hours": 3.0,
                    "description": f"Extracted from document: {text[:150]}"
                })
                
        return tasks
    except Exception as e:
        print(f"Error parsing PDF tasks: {e}")
        return []

def parse_schedule_from_csv(contents: bytes) -> List[Dict[str, Any]]:
    """Parses timetable schedule blocks (Class, Lab, Study) from CSV/TSV."""
    try:
        text = contents.decode("utf-8-sig")
    except UnicodeDecodeError:
        text = contents.decode("latin-1", errors="ignore")
        
    lines = [l.strip() for l in text.splitlines() if l.strip()]
    if not lines:
        return []

    delimiter = '\t' if '\t' in lines[0] else (';' if ';' in lines[0] else ',')
    reader = csv.reader(lines, delimiter=delimiter)
    rows = [r for r in reader if any(f.strip() for f in r)]
    if not rows:
        return []

    header = [h.strip().lower() for h in rows[0]]
    has_header = any(k in " ".join(header) for k in ["title", "subject", "start", "time", "date", "room", "location"])
    data_rows = rows[1:] if has_header else rows
    
    col_map = {"title": -1, "start_time": -1, "end_time": -1, "category": -1, "date": -1, "location": -1}
    if has_header:
        for idx, h in enumerate(header):
            if any(k in h for k in ["title", "subject", "course", "class", "name"]):
                if col_map["title"] == -1: col_map["title"] = idx
            elif any(k in h for k in ["start", "begin", "from"]):
                if col_map["start_time"] == -1: col_map["start_time"] = idx
            elif any(k in h for k in ["end", "to", "until"]):
                if col_map["end_time"] == -1: col_map["end_time"] = idx
            elif any(k in h for k in ["category", "type"]):
                if col_map["category"] == -1: col_map["category"] = idx
            elif any(k in h for k in ["date", "day"]):
                if col_map["date"] == -1: col_map["date"] = idx
            elif any(k in h for k in ["location", "room", "hall", "venue"]):
                if col_map["location"] == -1: col_map["location"] = idx

    today_str = date.today().strftime("%Y-%m-%d")
    items = []
    
    for r in data_rows:
        if not r: continue
        if has_header and col_map["title"] != -1 and col_map["title"] < len(r):
            title = r[col_map["title"]].strip()
            start_time = r[col_map["start_time"]].strip() if col_map["start_time"] != -1 and col_map["start_time"] < len(r) else "09:00 AM"
            end_time = r[col_map["end_time"]].strip() if col_map["end_time"] != -1 and col_map["end_time"] < len(r) else "10:30 AM"
            raw_cat = r[col_map["category"]].strip() if col_map["category"] != -1 and col_map["category"] < len(r) else "Class"
            raw_date = r[col_map["date"]].strip() if col_map["date"] != -1 and col_map["date"] < len(r) else today_str
            loc = r[col_map["location"]].strip() if col_map["location"] != -1 and col_map["location"] < len(r) else "Campus"
        else:
            title = r[0].strip() if len(r) > 0 else "Lecture"
            start_time = r[1].strip() if len(r) > 1 else "09:00 AM"
            end_time = r[2].strip() if len(r) > 2 else "10:30 AM"
            raw_cat = r[3].strip() if len(r) > 3 else "Class"
            raw_date = r[4].strip() if len(r) > 4 else today_str
            loc = r[5].strip() if len(r) > 5 else "Campus"
            
        if not title: continue
        
        category = "Lab" if "lab" in (raw_cat + " " + title).lower() else ("Study" if "study" in (raw_cat + " " + title).lower() else "Class")
        items.append({
            "title": title,
            "start_time": start_time or "09:00 AM",
            "end_time": end_time or "10:30 AM",
            "category": category,
            "date": normalize_date_string(raw_date),
            "location": loc or "Campus",
            "notes": f"Imported timetable item ({category})."
        })
        
    return items

def get_sample_csv_template() -> str:
    """Returns sample CSV format for assignment/exam timetable upload."""
    lines = [
        "Title,Course,DueDate,Priority,Category,EstimatedHours,Description",
        "Operating Systems Memory Lab,CS304,2026-11-10,High,Assignment,3.0,Implement paging simulator in C++",
        "Database Systems Midterm Examination,CS308,2026-11-15,High,Exam,6.0,Relational algebra and SQL queries",
        "Software Engineering Sprint Acceptance,CS320,2026-11-18,Medium,Project,2.5,Prepare user stories and test criteria",
        "Computer Networks Socket Lab,CS312,2026-11-20,Medium,Lab,2.0,TCP/IP multithreaded chat socket",
        "Discrete Mathematics Problem Set 5,MATH201,2026-11-22,High,Assignment,2.0,Graph planar coloring proofs"
    ]
    return "\r\n".join(lines)
