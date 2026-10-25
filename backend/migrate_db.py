import os
import sqlite3

def run_migration():
    db_path = os.path.join(os.path.dirname(__file__), 'campusmate.db')
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    def get_columns(table):
        cursor.execute(f"PRAGMA table_info({table})")
        return [col[1] for col in cursor.fetchall()]

    # 1. club_events
    ce_cols = get_columns('club_events')
    print('Current club_events columns:', ce_cols)
    new_ce_cols = [
        ('venue', "VARCHAR(150) DEFAULT 'Christ College of Engineering, Irinjalakuda'"),
        ('organizer', "VARCHAR(150) DEFAULT 'CCE'"),
        ('end_date', "VARCHAR(50) DEFAULT ''"),
        ('end_time', "VARCHAR(50) DEFAULT ''"),
        ('registration_deadline', "VARCHAR(50) DEFAULT ''"),
        ('registration_link', "VARCHAR(300) DEFAULT ''"),
        ('source_url', "VARCHAR(300) DEFAULT 'https://cce.edu.in/'"),
        ('source_name', "VARCHAR(150) DEFAULT 'Christ College of Engineering Official Portal'"),
        ('is_verified', "BOOLEAN DEFAULT 1"),
        ('verification_notes', "VARCHAR(250) DEFAULT 'Official CCE Publication'"),
        ('is_upcoming', "BOOLEAN DEFAULT 1"),
        ('external_id', "VARCHAR(100) DEFAULT ''"),
        ('last_synced_at', "DATETIME")
    ]

    for col_name, col_def in new_ce_cols:
        if col_name not in ce_cols:
            print(f'Adding {col_name} to club_events')
            cursor.execute(f'ALTER TABLE club_events ADD COLUMN {col_name} {col_def}')

    # 2. user_settings
    us_cols = get_columns('user_settings')
    print('Current user_settings columns:', us_cols)
    new_us_cols = [
        ('last_cce_sync', "VARCHAR(50) DEFAULT ''"),
        ('last_sync_status', "VARCHAR(50) DEFAULT 'Ready'")
    ]
    for col_name, col_def in new_us_cols:
        if col_name not in us_cols:
            print(f'Adding {col_name} to user_settings')
            cursor.execute(f'ALTER TABLE user_settings ADD COLUMN {col_name} {col_def}')

    # 3. notices
    notices_cols = get_columns('notices')
    print('Current notices columns:', notices_cols)
    new_n_cols = [
        ('verification_notes', "VARCHAR(250) DEFAULT 'Verified Official Circular'"),
        ('source_url', "VARCHAR(300) DEFAULT 'https://cce.edu.in/'")
    ]
    for col_name, col_def in new_n_cols:
        if col_name not in notices_cols:
            print(f'Adding {col_name} to notices')
            cursor.execute(f'ALTER TABLE notices ADD COLUMN {col_name} {col_def}')

    # 4. is_sample columns
    for table_name in ['tasks', 'study_plans', 'schedule_items', 'notices', 'club_events']:
        cols = get_columns(table_name)
        if 'is_sample' not in cols:
            print(f'Adding is_sample to {table_name}')
            cursor.execute(f'ALTER TABLE {table_name} ADD COLUMN is_sample BOOLEAN DEFAULT 0')

    # Flag initial demo seed records (tasks 1-7, plan 1, schedule items 1-6) as demo data
    cursor.execute("UPDATE tasks SET is_sample = 1 WHERE id IN (1, 2, 3, 4, 5, 6, 7)")
    cursor.execute("UPDATE study_plans SET is_sample = 1 WHERE id = 1")
    cursor.execute("UPDATE schedule_items SET is_sample = 1 WHERE id IN (1, 2, 3, 4, 5, 6)")

    conn.commit()
    conn.close()
    print('Migration completed successfully!')

if __name__ == '__main__':
    run_migration()
