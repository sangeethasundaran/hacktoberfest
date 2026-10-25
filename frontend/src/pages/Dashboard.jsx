import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  CheckSquare, 
  Clock, 
  Calendar, 
  Sparkles, 
  Plus, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle, 
  BookOpen, 
  Users, 
  Check, 
  TrendingUp, 
  BarChart2, 
  Upload, 
  Download, 
  Info, 
  Layers, 
  FileSpreadsheet, 
  GraduationCap, 
  Building, 
  ExternalLink,
  Send,
  X
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid 
} from 'recharts';

export default function Dashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [userSettings, setUserSettings] = useState(null);
  
  // Modals
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);

  // Quick prompt input
  const [quickPrompt, setQuickPrompt] = useState('');

  // Quick Task Form
  const [newTask, setNewTask] = useState({
    title: '',
    course: '',
    due_date: new Date(Date.now() + 3*24*60*60*1000).toISOString().split('T')[0],
    priority: 'Medium',
    category: 'Assignment',
    estimated_hours: 2.0
  });

  // Quick Schedule Form
  const [newSchedule, setNewSchedule] = useState({
    title: '',
    start_time: '09:00 AM',
    end_time: '10:30 AM',
    category: 'Class',
    date: new Date().toISOString().split('T')[0],
    location: 'Campus'
  });

  // Import State
  const [importFile, setImportFile] = useState(null);
  const [importing, setImporting] = useState(false);
  const [importFeedback, setImportFeedback] = useState(null);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [dashRes, settingsRes] = await Promise.all([
        fetch('/api/dashboard'),
        fetch('/api/settings').catch(() => null)
      ]);

      if (dashRes.ok) {
        const data = await dashRes.json();
        setStats(data);
      }
      if (settingsRes?.ok) {
        const sData = await settingsRes.json();
        setUserSettings(sData);
      }
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleToggleSchedule = async (id) => {
    try {
      const res = await fetch(`/api/schedule/${id}/toggle`, { method: 'POST' });
      if (res.ok) fetchDashboardData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleTask = async (id) => {
    try {
      const res = await fetch(`/api/tasks/${id}/toggle`, { method: 'POST' });
      if (res.ok) fetchDashboardData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!newTask.title.trim()) return;
    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newTask,
          course: newTask.course.trim() || 'General'
        })
      });
      if (res.ok) {
        setShowTaskModal(false);
        setNewTask({
          title: '',
          course: '',
          due_date: new Date(Date.now() + 3*24*60*60*1000).toISOString().split('T')[0],
          priority: 'Medium',
          category: 'Assignment',
          estimated_hours: 2.0
        });
        fetchDashboardData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateSchedule = async (e) => {
    e.preventDefault();
    if (!newSchedule.title.trim()) return;
    try {
      const res = await fetch('/api/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSchedule)
      });
      if (res.ok) {
        setShowScheduleModal(false);
        setNewSchedule({
          title: '',
          start_time: '09:00 AM',
          end_time: '10:30 AM',
          category: 'Class',
          date: new Date().toISOString().split('T')[0],
          location: 'Campus'
        });
        fetchDashboardData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleImportSubmit = async (e) => {
    e.preventDefault();
    if (!importFile) return;
    try {
      setImporting(true);
      setImportFeedback(null);
      const formData = new FormData();
      formData.append('file', importFile);
      const res = await fetch('/api/tasks/import-file', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (res.ok) {
        setImportFeedback({ type: 'success', text: data.message });
        setImportFile(null);
        fetchDashboardData();
        setTimeout(() => setShowImportModal(false), 1400);
      } else {
        setImportFeedback({ type: 'error', text: data.detail || 'Import failed.' });
      }
    } catch (err) {
      setImportFeedback({ type: 'error', text: err.message });
    } finally {
      setImporting(false);
    }
  };

  const handleQuickPromptSubmit = (e) => {
    e.preventDefault();
    if (!quickPrompt.trim()) return;
    navigate(`/assistant?prompt=${encodeURIComponent(quickPrompt.trim())}`);
  };

  const studentName = userSettings?.student_name || 'Student';

  // Greeting based on time of day
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : (hour < 17 ? 'Good afternoon' : 'Good evening');

  const pendingCount = stats?.pending_tasks ?? 0;
  const upcomingDeadlinesCount = stats?.urgent_deadlines?.length ?? 0;
  const eventsCount = stats?.upcoming_events_count ?? 0;
  const studyProgressCount = stats?.completed_tasks ?? 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* =========================================================================
          TOP SECTION: Welcome & Campus Info Card
          ========================================================================= */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '16px',
        alignItems: 'stretch'
      }}>
        {/* Welcome Card */}
        <div className="campus-card" style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <h1 style={{ fontSize: '23px', fontWeight: '800', color: '#163A63', marginBottom: '6px' }}>
              {greeting}, {studentName}!
            </h1>
            <p style={{ color: '#64748B', fontSize: '13.5px', lineHeight: 1.5, margin: 0 }}>
              Here is your academic snapshot and prioritized schedule grounded directly in your database.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '18px', flexWrap: 'wrap' }}>
            <button className="btn-primary" onClick={() => setShowTaskModal(true)}>
              <Plus size={15} /> Add Task
            </button>
            <button className="btn-secondary" onClick={() => setShowImportModal(true)}>
              <Upload size={14} /> Import File
            </button>
            <button className="btn-secondary" onClick={() => setShowScheduleModal(true)}>
              <Calendar size={14} /> Add Block
            </button>
          </div>
        </div>

        {/* Compact Campus Information Card */}
        <div className="campus-card" style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', borderLeft: '4px solid #2563EB' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Building size={15} color="#2563EB" />
                <span style={{ fontSize: '12px', fontWeight: '700', color: '#163A63', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Christ College of Engineering (Autonomous)
                </span>
              </div>
              <span className="badge badge-success" style={{ fontSize: '10.5px' }}>
                Verified Portal
              </span>
            </div>

            <p style={{ fontSize: '13px', color: '#64748B', margin: '4px 0 12px 0', lineHeight: 1.45 }}>
              Department of {userSettings?.major || 'Computer Science & Engineering'} &bull; {userSettings?.semester || 'Semester 5'}
            </p>

            <div style={{ fontSize: '12.5px', color: '#172B4D', backgroundColor: '#EFF6FF', padding: '10px 12px', borderRadius: '8px', border: '1px solid #DBEAFE', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Info size={15} color="#2563EB" style={{ flexShrink: 0 }} />
              <span>Official circulars, attendance thresholds (75%), and exam guidelines are indexed.</span>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px', paddingTop: '10px', borderTop: '1px solid #DCE5F0' }}>
            <span style={{ fontSize: '12px', color: '#64748B' }}>Source: cce.edu.in</span>
            <button 
              onClick={() => navigate('/campus-info')}
              className="btn-tertiary"
              style={{ padding: 0, fontSize: '12px' }}
            >
              Search Regulations &rarr;
            </button>
          </div>
        </div>
      </div>

      {/* =========================================================================
          OVERVIEW CARDS (4 Compact Metrics)
          ========================================================================= */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '16px'
      }}>
        {/* 1. Pending Assignments */}
        <div 
          className="campus-card" 
          onClick={() => navigate('/tasks')}
          style={{ padding: '18px 20px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '16px' }}
        >
          <div style={{ width: '44px', height: '44px', borderRadius: '10px', backgroundColor: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563EB', flexShrink: 0 }}>
            <CheckSquare size={22} />
          </div>
          <div>
            <div style={{ fontSize: '12px', fontWeight: '600', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Pending Tasks
            </div>
            <div style={{ fontSize: '24px', fontWeight: '800', color: '#163A63', lineHeight: 1.2, marginTop: '2px' }}>
              {pendingCount}
            </div>
            <div style={{ fontSize: '11px', color: '#64748B', marginTop: '2px' }}>
              Active coursework items
            </div>
          </div>
        </div>

        {/* 2. Upcoming Deadlines */}
        <div 
          className="campus-card" 
          onClick={() => navigate('/tasks')}
          style={{ padding: '18px 20px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '16px' }}
        >
          <div style={{ width: '44px', height: '44px', borderRadius: '10px', backgroundColor: '#FEF3C7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#D97706', flexShrink: 0 }}>
            <Clock size={22} />
          </div>
          <div>
            <div style={{ fontSize: '12px', fontWeight: '600', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Upcoming Deadlines
            </div>
            <div style={{ fontSize: '24px', fontWeight: '800', color: '#B45309', lineHeight: 1.2, marginTop: '2px' }}>
              {upcomingDeadlinesCount}
            </div>
            <div style={{ fontSize: '11px', color: '#64748B', marginTop: '2px' }}>
              Due within 7 days
            </div>
          </div>
        </div>

        {/* 3. College Events */}
        <div 
          className="campus-card" 
          onClick={() => navigate('/clubs-events')}
          style={{ padding: '18px 20px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '16px' }}
        >
          <div style={{ width: '44px', height: '44px', borderRadius: '10px', backgroundColor: '#DCFCE7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#166534', flexShrink: 0 }}>
            <Users size={22} />
          </div>
          <div>
            <div style={{ fontSize: '12px', fontWeight: '600', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              College Events
            </div>
            <div style={{ fontSize: '24px', fontWeight: '800', color: '#166534', lineHeight: 1.2, marginTop: '2px' }}>
              {eventsCount}
            </div>
            <div style={{ fontSize: '11px', color: '#64748B', marginTop: '2px' }}>
              CCE verified campus activities
            </div>
          </div>
        </div>

        {/* 4. Study Progress */}
        <div 
          className="campus-card" 
          onClick={() => navigate('/study-planner')}
          style={{ padding: '18px 20px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '16px' }}
        >
          <div style={{ width: '44px', height: '44px', borderRadius: '10px', backgroundColor: '#DBEAFE', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1E40AF', flexShrink: 0 }}>
            <GraduationCap size={22} />
          </div>
          <div>
            <div style={{ fontSize: '12px', fontWeight: '600', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Study Progress
            </div>
            <div style={{ fontSize: '24px', fontWeight: '800', color: '#163A63', lineHeight: 1.2, marginTop: '2px' }}>
              {studyProgressCount}
            </div>
            <div style={{ fontSize: '11px', color: '#64748B', marginTop: '2px' }}>
              Tasks completed successfully
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          MAIN CONTENT: Responsive Two-Column Layout
          ========================================================================= */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))',
        gap: '24px',
        alignItems: 'start'
      }}>
        {/* ---------------------------------------------------------------------
            COLUMN 1: Today's Schedule & Weekly Study Activity
            --------------------------------------------------------------------- */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Card 1: Today's Schedule */}
          <div className="campus-card" style={{ padding: '22px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
              <div>
                <h3 style={{ fontSize: '17px', fontWeight: '700', color: '#163A63', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Calendar size={18} color="#2563EB" /> Today's Schedule
                </h3>
                <div style={{ fontSize: '12px', color: '#64748B', marginTop: '2px' }}>
                  Daily lectures, labs, and focused study blocks
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <a
                  href="/api/schedule/export.ics"
                  download="today_schedule.ics"
                  className="btn-secondary"
                  style={{ padding: '5px 10px', fontSize: '11.5px', textDecoration: 'none' }}
                  title="Export today's blocks to calendar"
                >
                  Export .ics
                </a>
                <button
                  onClick={() => setShowScheduleModal(true)}
                  className="btn-secondary"
                  style={{ padding: '5px 10px', fontSize: '11.5px' }}
                >
                  <Plus size={13} /> Add Block
                </button>
              </div>
            </div>

            {loading ? (
              <div style={{ padding: '30px', textAlign: 'center', color: '#64748B', fontSize: '13px' }}>
                Loading schedule...
              </div>
            ) : !stats?.today_schedule || stats.today_schedule.length === 0 ? (
              <div className="empty-state" style={{ padding: '28px 16px' }}>
                <Calendar className="empty-state-icon" style={{ width: '36px', height: '36px' }} />
                <div className="empty-state-title" style={{ fontSize: '15px' }}>No Classes Scheduled Today</div>
                <div className="empty-state-desc" style={{ fontSize: '12.5px' }}>
                  Enjoy your open study block, or add a custom study sprint or lecture using the button above.
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {stats.today_schedule.map((item) => (
                  <div
                    key={item.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '11px 14px',
                      borderRadius: '8px',
                      border: '1px solid #DCE5F0',
                      backgroundColor: item.completed ? '#F8FAFC' : '#FFFFFF',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <button
                        onClick={() => handleToggleSchedule(item.id)}
                        style={{
                          width: '20px',
                          height: '20px',
                          borderRadius: '5px',
                          border: item.completed ? 'none' : '2px solid #CBD5E1',
                          backgroundColor: item.completed ? '#2563EB' : 'transparent',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          flexShrink: 0
                        }}
                        aria-label="Toggle schedule item"
                      >
                        {item.completed && <Check size={13} color="#FFFFFF" />}
                      </button>

                      <div>
                        <div style={{
                          fontSize: '13.5px',
                          fontWeight: '600',
                          color: item.completed ? '#64748B' : '#172B4D',
                          textDecoration: item.completed ? 'line-through' : 'none'
                        }}>
                          {item.title}
                        </div>
                        <div style={{ fontSize: '11.5px', color: '#64748B', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                          <span>{item.start_time} - {item.end_time}</span>
                          <span>&bull;</span>
                          <span>{item.location || 'Campus'}</span>
                        </div>
                      </div>
                    </div>

                    <span className={`badge ${
                      item.category === 'Class' ? 'badge-blue' :
                      item.category === 'Lab' ? 'badge-navy' : 'badge-neutral'
                    }`}>
                      {item.category}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Card 2: Weekly Study Activity Chart */}
          <div className="campus-card" style={{ padding: '22px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h3 style={{ fontSize: '17px', fontWeight: '700', color: '#163A63', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <TrendingUp size={18} color="#2563EB" /> Weekly Study Activity
                </h3>
                <div style={{ fontSize: '12px', color: '#64748B', marginTop: '2px' }}>
                  Scheduled milestone hours vs targets across Monday to Sunday
                </div>
              </div>
            </div>

            {loading ? (
              <div style={{ padding: '40px', textAlign: 'center', color: '#64748B', fontSize: '13px' }}>
                Loading study activity...
              </div>
            ) : !stats?.weekly_velocity || stats.weekly_velocity.length === 0 ? (
              <div className="empty-state" style={{ padding: '28px 16px' }}>
                <BarChart2 className="empty-state-icon" style={{ width: '36px', height: '36px' }} />
                <div className="empty-state-title" style={{ fontSize: '15px' }}>No Study Velocity Logged</div>
                <div className="empty-state-desc" style={{ fontSize: '12.5px' }}>
                  Create a study plan or log tasks with estimated hours to track your weekly study velocity.
                </div>
              </div>
            ) : (
              <div>
                <div style={{ height: '220px', width: '100%' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats.weekly_velocity} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                      <XAxis dataKey="day" tick={{ fontSize: 12, fill: '#64748B' }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 12, fill: '#64748B' }} axisLine={false} tickLine={false} unit="h" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#FFFFFF',
                          borderColor: '#DCE5F0',
                          borderRadius: '8px',
                          fontSize: '12px',
                          boxShadow: '0 4px 12px rgba(15, 39, 68, 0.08)'
                        }}
                      />
                      <Bar dataKey="target" name="Target Hours" fill="#CBD5E1" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="actual" name="Actual Hours" fill="#2563EB" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginTop: '12px', fontSize: '12px', color: '#64748B' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div style={{ width: '10px', height: '10px', backgroundColor: '#2563EB', borderRadius: '2px' }} />
                    <span>Actual Study Hours</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div style={{ width: '10px', height: '10px', backgroundColor: '#CBD5E1', borderRadius: '2px' }} />
                    <span>Target Commitment</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ---------------------------------------------------------------------
            COLUMN 2: Upcoming Deadlines & Ask CampusMate AI
            --------------------------------------------------------------------- */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Card 3: Upcoming Deadlines */}
          <div className="campus-card" style={{ padding: '22px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h3 style={{ fontSize: '17px', fontWeight: '700', color: '#163A63', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Clock size={18} color="#D97706" /> Upcoming Deadlines
                </h3>
                <div style={{ fontSize: '12px', color: '#64748B', marginTop: '2px' }}>
                  Urgent assignments and exams requiring attention
                </div>
              </div>

              <button
                onClick={() => navigate('/tasks')}
                className="btn-tertiary"
                style={{ fontSize: '12px', padding: 0 }}
              >
                View All Tasks &rarr;
              </button>
            </div>

            {loading ? (
              <div style={{ padding: '30px', textAlign: 'center', color: '#64748B', fontSize: '13px' }}>
                Checking deadlines...
              </div>
            ) : !stats?.urgent_deadlines || stats.urgent_deadlines.length === 0 ? (
              <div className="empty-state" style={{ padding: '28px 16px' }}>
                <CheckCircle2 className="empty-state-icon" style={{ width: '36px', height: '36px', color: '#166534' }} />
                <div className="empty-state-title" style={{ fontSize: '15px' }}>No Impending Deadlines</div>
                <div className="empty-state-desc" style={{ fontSize: '12.5px' }}>
                  You are all caught up! Use the "+ Add Task" button above to log upcoming course assignments.
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {stats.urgent_deadlines.map((task) => (
                  <div
                    key={task.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px 14px',
                      borderRadius: '8px',
                      border: '1px solid #DCE5F0',
                      backgroundColor: task.status === 'Completed' ? '#F8FAFC' : '#FFFFFF',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
                      <button
                        onClick={() => handleToggleTask(task.id)}
                        style={{
                          width: '20px',
                          height: '20px',
                          borderRadius: '5px',
                          border: task.status === 'Completed' ? 'none' : '2px solid #CBD5E1',
                          backgroundColor: task.status === 'Completed' ? '#2563EB' : 'transparent',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          flexShrink: 0
                        }}
                        aria-label="Toggle task completion"
                      >
                        {task.status === 'Completed' && <Check size={13} color="#FFFFFF" />}
                      </button>

                      <div style={{ minWidth: 0 }}>
                        <div style={{
                          fontSize: '13.5px',
                          fontWeight: '600',
                          color: task.status === 'Completed' ? '#64748B' : '#172B4D',
                          textDecoration: task.status === 'Completed' ? 'line-through' : 'none',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}>
                          {task.title}
                        </div>
                        <div style={{ fontSize: '11.5px', color: '#64748B', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                          <span style={{ fontWeight: '600', color: '#2563EB' }}>{task.course}</span>
                          <span>&bull;</span>
                          <span>Due: <strong>{task.due_date}</strong></span>
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                      {task.priority === 'High' && (
                        <span className="badge badge-error" style={{ fontSize: '10px' }}>Urgent</span>
                      )}
                      <span className="badge badge-neutral" style={{ fontSize: '10px' }}>
                        {task.category}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Card 4: Ask CampusMate AI & Academic Recommendation */}
          <div className="campus-card" style={{ padding: '22px', backgroundColor: '#FFFFFF', border: '1px solid #DCE5F0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
              <div style={{ width: '28px', height: '28px', borderRadius: '6px', backgroundColor: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563EB' }}>
                <Sparkles size={16} />
              </div>
              <h3 style={{ fontSize: '17px', fontWeight: '700', color: '#163A63', margin: 0 }}>
                Ask CampusMate AI
              </h3>
            </div>

            {/* Live Academic Recommendation if present */}
            {stats?.ai_recommendation && (
              <div style={{
                backgroundColor: '#EFF6FF',
                border: '1px solid #DBEAFE',
                borderRadius: '8px',
                padding: '12px 14px',
                marginBottom: '14px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <span style={{ fontSize: '11.5px', fontWeight: '700', color: '#1E40AF', textTransform: 'uppercase' }}>
                    Agent Priority Recommendation
                  </span>
                  <span className="badge badge-warning" style={{ fontSize: '10px' }}>Recommended</span>
                </div>
                <p style={{ fontSize: '12.5px', color: '#172B4D', margin: 0, lineHeight: 1.45 }}>
                  {stats.ai_recommendation.text}
                </p>
                <div style={{ marginTop: '8px', display: 'flex', justifyContent: 'flex-end' }}>
                  <button
                    onClick={() => navigate(`/assistant?prompt=${encodeURIComponent(stats.ai_recommendation.prompt_action || 'Help me act on this priority task')}`)}
                    className="btn-primary"
                    style={{ padding: '4px 10px', fontSize: '11.5px' }}
                  >
                    Act with AI &rarr;
                  </button>
                </div>
              </div>
            )}

            {/* Quick Prompt Input */}
            <form onSubmit={handleQuickPromptSubmit} style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
              <input
                type="text"
                placeholder="Ask your assistant anything..."
                value={quickPrompt}
                onChange={(e) => setQuickPrompt(e.target.value)}
                className="form-input"
                style={{ fontSize: '13px', padding: '8px 12px' }}
              />
              <button type="submit" className="btn-primary" style={{ padding: '8px 14px', flexShrink: 0 }}>
                <Send size={13} /> Ask
              </button>
            </form>

            {/* Suggested Quick Prompt Chips */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {[
                "What assignments do I have due this week?",
                "What is the 75% attendance rule?",
                "Create a study plan for upcoming exams"
              ].map((chip, idx) => (
                <button
                  key={idx}
                  onClick={() => navigate(`/assistant?prompt=${encodeURIComponent(chip)}`)}
                  className="btn-secondary"
                  style={{
                    padding: '5px 10px',
                    fontSize: '11.5px',
                    borderRadius: '16px',
                    backgroundColor: '#F8FAFC'
                  }}
                >
                  {chip}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          MODALS: Add Task, Import File, Add Schedule Block
          ========================================================================= */}

      {/* Modal: Quick Task */}
      {showTaskModal && (
        <div className="modal-overlay" onClick={() => setShowTaskModal(false)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()} style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '17px', fontWeight: '700', color: '#163A63', margin: 0 }}>
                Add Academic Task / Assignment
              </h3>
              <button onClick={() => setShowTaskModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateTask} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '13px', fontWeight: '600', color: '#163A63', display: 'block', marginBottom: '5px' }}>
                  Task Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Computer Networks Lab Report 4"
                  value={newTask.title}
                  onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                  className="form-input"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '13px', fontWeight: '600', color: '#163A63', display: 'block', marginBottom: '5px' }}>
                    Course Code
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., CS304"
                    value={newTask.course}
                    onChange={(e) => setNewTask({ ...newTask, course: e.target.value })}
                    className="form-input"
                  />
                </div>
                <div>
                  <label style={{ fontSize: '13px', fontWeight: '600', color: '#163A63', display: 'block', marginBottom: '5px' }}>
                    Due Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={newTask.due_date}
                    onChange={(e) => setNewTask({ ...newTask, due_date: e.target.value })}
                    className="form-input"
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '13px', fontWeight: '600', color: '#163A63', display: 'block', marginBottom: '5px' }}>
                    Priority
                  </label>
                  <select
                    value={newTask.priority}
                    onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })}
                    className="form-select"
                  >
                    <option value="High">High Priority</option>
                    <option value="Medium">Medium Priority</option>
                    <option value="Low">Low Priority</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '13px', fontWeight: '600', color: '#163A63', display: 'block', marginBottom: '5px' }}>
                    Category
                  </label>
                  <select
                    value={newTask.category}
                    onChange={(e) => setNewTask({ ...newTask, category: e.target.value })}
                    className="form-select"
                  >
                    <option value="Assignment">Assignment</option>
                    <option value="Exam">Exam</option>
                    <option value="Project">Project</option>
                    <option value="Lab">Lab</option>
                    <option value="Admin">Admin</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button type="button" className="btn-secondary" onClick={() => setShowTaskModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Save Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Import File */}
      {showImportModal && (
        <div className="modal-overlay" onClick={() => setShowImportModal(false)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()} style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '17px', fontWeight: '700', color: '#163A63', margin: 0 }}>
                Import Assignments or Schedule File
              </h3>
              <button onClick={() => setShowImportModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}>
                <X size={18} />
              </button>
            </div>

            {importFeedback && (
              <div style={{
                padding: '10px 12px',
                borderRadius: '8px',
                marginBottom: '14px',
                fontSize: '12.5px',
                backgroundColor: importFeedback.type === 'success' ? '#DCFCE7' : '#FEE2E2',
                color: importFeedback.type === 'success' ? '#166534' : '#991B1B'
              }}>
                {importFeedback.text}
              </div>
            )}

            <form onSubmit={handleImportSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{
                border: '2px dashed #CBD5E1',
                borderRadius: '10px',
                padding: '24px',
                textAlign: 'center',
                backgroundColor: '#F8FAFC'
              }}>
                <Upload size={32} color="#2563EB" style={{ margin: '0 auto 8px' }} />
                <div style={{ fontSize: '13.5px', fontWeight: '600', color: '#163A63' }}>
                  {importFile ? importFile.name : 'Choose a CSV, XLSX, or PDF file'}
                </div>
                <div style={{ fontSize: '11.5px', color: '#64748B', marginTop: '4px' }}>
                  Extract tasks and timetables automatically from official college syllabus spreadsheets or documents.
                </div>
                <input
                  type="file"
                  accept=".csv,.xlsx,.tsv,.pdf"
                  onChange={(e) => setImportFile(e.target.files[0])}
                  style={{ display: 'none' }}
                  id="dashboard-file-import"
                />
                <label
                  htmlFor="dashboard-file-import"
                  className="btn-secondary"
                  style={{ display: 'inline-block', marginTop: '12px', cursor: 'pointer' }}
                >
                  Select File
                </label>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <a
                  href="/api/tasks/sample-template.csv"
                  download="tasks_template.csv"
                  style={{ fontSize: '12px', color: '#2563EB', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}
                >
                  <Download size={13} /> Sample CSV Template
                </a>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button type="button" className="btn-secondary" onClick={() => setShowImportModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" disabled={!importFile || importing} className="btn-primary">
                    {importing ? 'Processing...' : 'Upload & Import'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Quick Schedule */}
      {showScheduleModal && (
        <div className="modal-overlay" onClick={() => setShowScheduleModal(false)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()} style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '17px', fontWeight: '700', color: '#163A63', margin: 0 }}>
                Add Schedule / Lecture Block
              </h3>
              <button onClick={() => setShowScheduleModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateSchedule} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '13px', fontWeight: '600', color: '#163A63', display: 'block', marginBottom: '5px' }}>
                  Session Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g., CS304 Operating Systems Lecture"
                  value={newSchedule.title}
                  onChange={(e) => setNewSchedule({ ...newSchedule, title: e.target.value })}
                  className="form-input"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '13px', fontWeight: '600', color: '#163A63', display: 'block', marginBottom: '5px' }}>
                    Start Time
                  </label>
                  <input
                    type="text"
                    placeholder="09:00 AM"
                    value={newSchedule.start_time}
                    onChange={(e) => setNewSchedule({ ...newSchedule, start_time: e.target.value })}
                    className="form-input"
                  />
                </div>
                <div>
                  <label style={{ fontSize: '13px', fontWeight: '600', color: '#163A63', display: 'block', marginBottom: '5px' }}>
                    End Time
                  </label>
                  <input
                    type="text"
                    placeholder="10:30 AM"
                    value={newSchedule.end_time}
                    onChange={(e) => setNewSchedule({ ...newSchedule, end_time: e.target.value })}
                    className="form-input"
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '13px', fontWeight: '600', color: '#163A63', display: 'block', marginBottom: '5px' }}>
                    Category
                  </label>
                  <select
                    value={newSchedule.category}
                    onChange={(e) => setNewSchedule({ ...newSchedule, category: e.target.value })}
                    className="form-select"
                  >
                    <option value="Class">Class / Lecture</option>
                    <option value="Lab">Laboratory Session</option>
                    <option value="Study">Deep Work / Study</option>
                    <option value="Meeting">Club / Meeting</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '13px', fontWeight: '600', color: '#163A63', display: 'block', marginBottom: '5px' }}>
                    Location
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Hall 204 or Library"
                    value={newSchedule.location}
                    onChange={(e) => setNewSchedule({ ...newSchedule, location: e.target.value })}
                    className="form-input"
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button type="button" className="btn-secondary" onClick={() => setShowScheduleModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Save Schedule Block
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
