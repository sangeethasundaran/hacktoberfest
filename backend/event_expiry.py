"""
Automatic Event Expiry & Lifecycle Engine for CampusMate AI.
Handles timezone-aware (Asia/Kolkata) event expiry, registration deadlines,
ongoing event detection, and missing/invalid date handling.
"""

from datetime import datetime, date, time as dt_time
import re
from typing import Optional, Dict, Any, Tuple
try:
    from zoneinfo import ZoneInfo
    COLLEGE_TIMEZONE = ZoneInfo("Asia/Kolkata")
except Exception:
    import pytz
    COLLEGE_TIMEZONE = pytz.timezone("Asia/Kolkata")


def get_current_college_time() -> datetime:
    """Returns the current timezone-aware datetime for Christ College of Engineering (IST)."""
    return datetime.now(COLLEGE_TIMEZONE)


def parse_flexible_date(date_str: Optional[str]) -> Optional[date]:
    """
    Parses date string into a date object.
    Supports YYYY-MM-DD, DD-MM-YYYY, DD/MM/YYYY, and month name formats.
    Returns None if date is missing, empty, or invalid.
    """
    if not date_str or not isinstance(date_str, str):
        return None
    
    clean_str = date_str.strip()
    if clean_str.lower() in ("tba", "tbd", "unknown", "invalid", "none", "--", ""):
        return None

    # Try ISO YYYY-MM-DD
    match = re.search(r'(\d{4})-(\d{1,2})-(\d{1,2})', clean_str)
    if match:
        try:
            return date(int(match.group(1)), int(match.group(2)), int(match.group(3)))
        except ValueError:
            return None

    # Try DD-MM-YYYY or DD/MM/YYYY
    match_dmy = re.search(r'(\d{1,2})[-/](\d{1,2})[-/](\d{4})', clean_str)
    if match_dmy:
        try:
            return date(int(match_dmy.group(3)), int(match_dmy.group(2)), int(match_dmy.group(1)))
        except ValueError:
            return None

    return None


def parse_flexible_time(time_str: Optional[str]) -> Optional[dt_time]:
    """
    Parses a time string into a time object.
    Supports 12-hour AM/PM (e.g. '09:30 AM', '1:30 PM') and 24-hour ('14:00').
    Returns None if missing or unparseable.
    """
    if not time_str or not isinstance(time_str, str):
        return None

    clean = time_str.strip()
    # 12-hour AM/PM e.g. "09:30 AM" or "9:30am" or "10:00 AM"
    match_12 = re.search(r'(\d{1,2})(?::(\d{2}))?\s*(AM|PM|am|pm)', clean)
    if match_12:
        hours = int(match_12.group(1))
        minutes = int(match_12.group(2)) if match_12.group(2) else 0
        meridiem = match_12.group(3).upper()
        if meridiem == 'PM' and hours < 12:
            hours += 12
        elif meridiem == 'AM' and hours == 12:
            hours = 0
        try:
            return dt_time(hours, minutes)
        except ValueError:
            return None

    # 24-hour e.g. "14:30"
    match_24 = re.search(r'(\d{1,2}):(\d{2})', clean)
    if match_24:
        hours = int(match_24.group(1))
        minutes = int(match_24.group(2))
        try:
            return dt_time(hours, minutes)
        except ValueError:
            return None

    return None


def extract_time_range(time_str: Optional[str]) -> Tuple[Optional[dt_time], Optional[dt_time]]:
    """
    Checks if a time string represents a range (e.g. '09:30 AM - 04:30 PM' or '10:00 AM to 01:00 PM').
    Returns (start_time, end_time).
    """
    if not time_str or not isinstance(time_str, str):
        return None, None

    clean = time_str.strip()
    # Look for delimiters: '-' or 'to'
    parts = re.split(r'\s+(?:-|–|to)\s+', clean, flags=re.IGNORECASE)
    if len(parts) == 2:
        start_t = parse_flexible_time(parts[0])
        end_t = parse_flexible_time(parts[1])
        return start_t, end_t

    return parse_flexible_time(clean), None


def evaluate_event_expiry(event: Any, now_dt: Optional[datetime] = None) -> Dict[str, Any]:
    """
    Calculates the exact real-time expiry and registration state for an event.
    
    Rules implemented:
    1. Event date: Once ended, is_upcoming=False, is_expired=True.
    2. Registration deadline: Once passed, is_registration_closed=True, can_register=False.
    3. Ongoing events: If current time is between start and end datetime, is_ongoing=True, is_upcoming=True.
    4. Missing dates: If unknown or invalid, is_upcoming=False, is_expired=True.
    5. No registration deadline: Uses event date to determine registration deadline.
    """
    if now_dt is None:
        now_dt = get_current_college_time()
    elif now_dt.tzinfo is None:
        now_dt = now_dt.replace(tzinfo=COLLEGE_TIMEZONE)

    event_date_str = getattr(event, 'date', None)
    event_time_str = getattr(event, 'time', None)
    end_date_str = getattr(event, 'end_date', None)
    end_time_str = getattr(event, 'end_time', None)
    reg_deadline_str = getattr(event, 'registration_deadline', None)

    # 1. Parse Event Start Date
    start_date = parse_flexible_date(event_date_str)
    if not start_date:
        # Rule 4: If event date is unknown or invalid, do not display as upcoming event
        return {
            "is_valid_date": False,
            "is_upcoming": False,
            "is_expired": True,
            "is_ongoing": False,
            "is_registration_closed": True,
            "can_register": False,
            "status_label": "Missing / Invalid Date",
            "start_dt": None,
            "end_dt": None,
            "reg_deadline_dt": None
        }

    # 2. Parse Event Start Time
    parsed_start_t, range_end_t = extract_time_range(event_time_str)
    if parsed_start_t:
        start_dt = datetime.combine(start_date, parsed_start_t, tzinfo=COLLEGE_TIMEZONE)
    else:
        # If no time or 'All Day', starts at beginning of day
        start_dt = datetime.combine(start_date, dt_time(0, 0, 0), tzinfo=COLLEGE_TIMEZONE)

    # 3. Parse Event End Date & Time
    end_date = parse_flexible_date(end_date_str) or start_date
    explicit_end_t = parse_flexible_time(end_time_str)
    final_end_t = explicit_end_t or range_end_t

    if final_end_t:
        end_dt = datetime.combine(end_date, final_end_t, tzinfo=COLLEGE_TIMEZONE)
    else:
        # If no explicit end time is given, the event remains ongoing through the end of the day (23:59:59)
        # Rule 3: Keep an event visible until its actual end date and time have passed.
        end_dt = datetime.combine(end_date, dt_time(23, 59, 59), tzinfo=COLLEGE_TIMEZONE)

    # 4. Determine Expiry and Ongoing status
    if now_dt > end_dt:
        # Event has concluded
        is_expired = True
        is_upcoming = False
        is_ongoing = False
    elif now_dt >= start_dt:
        # Event is currently happening!
        is_expired = False
        is_upcoming = True
        is_ongoing = True
    else:
        # Event is scheduled in the future
        is_expired = False
        is_upcoming = True
        is_ongoing = False

    # 5. Determine Registration Deadline
    reg_deadline_date = parse_flexible_date(reg_deadline_str)
    if reg_deadline_date:
        reg_deadline_time = parse_flexible_time(reg_deadline_str) or dt_time(23, 59, 59)
        reg_deadline_dt = datetime.combine(reg_deadline_date, reg_deadline_time, tzinfo=COLLEGE_TIMEZONE)
    else:
        # Rule: If an event has no registration deadline, use its event date/start to determine when it expires.
        reg_deadline_dt = start_dt

    if is_expired:
        is_registration_closed = True
        can_register = False
    else:
        if now_dt > reg_deadline_dt:
            is_registration_closed = True
            can_register = False
        else:
            is_registration_closed = False
            can_register = True

    # Build human status label
    if is_expired:
        status_label = "Event Ended"
    elif is_ongoing:
        status_label = "Ongoing Now"
    elif is_registration_closed:
        status_label = "Registration Closed"
    else:
        status_label = "Registration Open"

    return {
        "is_valid_date": True,
        "is_upcoming": is_upcoming,
        "is_expired": is_expired,
        "is_ongoing": is_ongoing,
        "is_registration_closed": is_registration_closed,
        "can_register": can_register,
        "status_label": status_label,
        "start_dt": start_dt,
        "end_dt": end_dt,
        "reg_deadline_dt": reg_deadline_dt
    }
