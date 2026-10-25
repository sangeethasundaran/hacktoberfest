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
  FileSpreadsheet
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid,
  AreaChart,
  Area
} from 'recharts';

export default function Dashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  
  // Modals
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);

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
      const res = await fetch('/api/dashboard');
      if (res.ok) {
        const data = await res.json();
        setStats(data);
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

  const handleFileUpload = async (e) => {
    e.preventDefault();
    if (!importFile) return;

    setImporting(true);
    setImportFeedback(null);
    try {
      const formData = new FormData();
      formData.append('file', importFile);

      const res = await fetch('/api/tasks/import-file', {
        method: 'POST',
        body: formData
      });

      const data = await res.json();
      if (res.ok) {
        setImportFeedback({ type: 'success', message: data.message || `Successfully imported ${data.count} items!` });
        setImportFile(null);
        setTimeout(() => {
          setShowImportModal(false);
          setImportFeedback(null);
          fetchDashboardData();
        }, 1500);
      } else {
        setImportFeedback({ type: 'error', message: data.detail || 'Failed to parse file.' });
      }
    } catch (err) {
      setImportFeedback({ type: 'error', message: 'Network error uploading file.' });
    } finally {
      setImporting(false);
    }
  };

  const getDeadlineBadge = (dueDate, status) => {
    if (status === 'Completed') {
      return <span className="badge badge-success"><Check size={11} /> Completed</span>;
    }
    const today = new Date().toISOString().split('T')[0];
    if (dueDate < today) {
      return <span className="badge badge-error">Overdue</span>;
    } else if (dueDate === today) {
      return <span className="badge badge-warning">Due Today</span>;
    } else {
      return <span className="badge badge-burgundy">Due Soon</span>;
    }
  };

  if (loading && !stats) {
    return (
      <div style={{ padding: '80px 0', textAlign: 'center', color: '#6B7280' }}>
        <Sparkles size={34} color="#7B1123" className="animate-spin" style={{ margin: '0 auto 16px' }} />
        <div style={{ fontSize: '16px', fontWeight: '600', color: '#4A0E17' }}>Loading your campus workspace...</div>
        <div style={{ fontSize: '13px', color: '#9CA3AF', marginTop: '4px' }}>Connecting to database</div>
      </div>
    );
  }

  const weeklyData = stats?.weekly_velocity || [];
  const workloadData = stats?.course_workload || [];
  const hasVelocityData = weeklyData.some(d => d.actual > 0 || d.target > 0);
  const hasWorkloadData = workloadData.length > 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '26px' }}>
      
      {/* Sample Demo Data Notice (if any demo items exist in DB) */}
      {stats?.has_sample_data && (
        <div style={{
          backgroundColor: '#FFFBEB',
          border: '1px solid #FDE68A',
          borderRadius: '10px',
          padding: '12px 18px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span className="badge badge-demo">Sample Mode</span>
            <span style={{ fontSize: '13px', color: '#92400E' }}>
              Demonstration records are visible and labeled. You can upload your actual syllabus/timetable or clear sample records in Settings.
            </span>
          </div>
          <button 
            onClick={() => navigate('/settings')}
            style={{ 
              background: 'none', 
              border: 'none', 
              color: '#92400E', 
              fontSize: '12px', 
              fontWeight: '600', 
              cursor: 'pointer',
              textDecoration: 'underline'
            }}
          >
            Manage Data
          </button>
        </div>
      )}

      {/* Top Banner / Greeting */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div>
          <h2 style={{ fontSize: '26px', fontWeight: '700', color: '#4A0E17', letterSpacing: '-0.02em', margin: 0 }}>
            {stats?.greeting || "Good morning! Ready to make today productive?"}
          </h2>
          <p style={{ color: '#6B7280', fontSize: '14px', marginTop: '4px', marginBottom: 0 }}>
            Real-time academic snapshot and schedule grounded in your database.
          </p>
        </div>

        {/* Quick Action Buttons in Burgundy & Grey */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <button 
            className="btn-primary" 
            onClick={() => setShowTaskModal(true)}
          >
            <Plus size={16} /> Add Task
          </button>
          <button 
            className="btn-secondary"
            onClick={() => setShowImportModal(true)}
            title="Import assignments or exam timetable from CSV, Excel, or PDF"
          >
            <Upload size={16} color="#7B1123" /> Import File
          </button>
          <button 
            className="btn-secondary"
            onClick={() => setShowScheduleModal(true)}
          >
            <Clock size={16} color="#7B1123" /> Add Schedule Block
          </button>
          <button 
            className="btn-primary" 
            style={{ backgroundColor: '#4A0E17' }}
            onClick={() => navigate('/assistant')}
          >
            <Sparkles size={16} /> Ask AI Agent
          </button>
        </div>
      </div>

      {/* 4 Statistics Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
        gap: '18px'
      }}>
        {/* Card 1: Pending Tasks */}
        <div className="campus-card" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{
            width: '50px',
            height: '50px',
            borderRadius: '12px',
            backgroundColor: '#FDF2F4',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#7B1123',
            flexShrink: 0
          }}>
            <CheckSquare size={24} />
          </div>
          <div>
            <div style={{ fontSize: '13px', color: '#6B7280', fontWeight: '500' }}>Active Deadlines</div>
            <div style={{ fontSize: '28px', fontWeight: '700', color: '#4A0E17', lineHeight: 1.2 }}>
              {stats?.pending_tasks ?? 0}
            </div>
            <div style={{ fontSize: '11px', color: '#7B1123', marginTop: '2px', fontWeight: '600' }}>
              Database verified
            </div>
          </div>
        </div>

        {/* Card 2: Upcoming Exams */}
        <div className="campus-card" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{
            width: '50px',
            height: '50px',
            borderRadius: '12px',
            backgroundColor: '#FFFBEB',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#B45309',
            flexShrink: 0
          }}>
            <AlertCircle size={24} />
          </div>
          <div>
            <div style={{ fontSize: '13px', color: '#6B7280', fontWeight: '500' }}>Scheduled Exams</div>
            <div style={{ fontSize: '28px', fontWeight: '700', color: '#4A0E17', lineHeight: 1.2 }}>
              {stats?.upcoming_exams ?? 0}
            </div>
            <div style={{ fontSize: '11px', color: '#B45309', marginTop: '2px', fontWeight: '500' }}>
              {stats?.upcoming_exams > 0 ? "Revision roadmaps active" : "No pending exams"}
            </div>
          </div>
        </div>

        {/* Card 3: Completed Tasks */}
        <div className="campus-card" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{
            width: '50px',
            height: '50px',
            borderRadius: '12px',
            backgroundColor: '#ECFDF5',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#065F46',
            flexShrink: 0
          }}>
            <CheckCircle2 size={24} />
          </div>
          <div>
            <div style={{ fontSize: '13px', color: '#6B7280', fontWeight: '500' }}>Completed Tasks</div>
            <div style={{ fontSize: '28px', fontWeight: '700', color: '#4A0E17', lineHeight: 1.2 }}>
              {stats?.completed_tasks ?? 0}
            </div>
            <div style={{ fontSize: '11px', color: '#065F46', marginTop: '2px', fontWeight: '500' }}>
              Logged achievements
            </div>
          </div>
        </div>

        {/* Card 4: Upcoming Events (Genuine) */}
        <div className="campus-card" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{
            width: '50px',
            height: '50px',
            borderRadius: '12px',
            backgroundColor: '#F3F4F6',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#374151',
            flexShrink: 0
          }}>
            <Users size={24} />
          </div>
          <div>
            <div style={{ fontSize: '13px', color: '#6B7280', fontWeight: '500' }}>Upcoming Events</div>
            <div style={{ fontSize: '28px', fontWeight: '700', color: '#4A0E17', lineHeight: 1.2 }}>
              {stats?.upcoming_events ?? 0}
            </div>
            <div style={{ fontSize: '11px', color: '#6B7280', marginTop: '2px', fontWeight: '500' }}>
              Official CCE Portal
            </div>
          </div>
        </div>
      </div>

      {/* AI Recommendation Banner */}
      {stats?.ai_recommendation && (
        <div style={{
          backgroundColor: '#FFFFFF',
          border: '1px solid #DCE0E5',
          borderLeft: '4px solid #7B1123',
          borderRadius: '12px',
          padding: '20px 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', flex: 1 }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              backgroundColor: '#FDF2F4',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#7B1123',
              flexShrink: 0
            }}>
              <Sparkles size={20} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <span style={{ fontSize: '14px', fontWeight: '700', color: '#4A0E17' }}>
                  AI Academic Recommendation
                </span>
                <span className="badge badge-burgundy">
                  {stats.ai_recommendation.action_type}
                </span>
              </div>
              <p style={{ fontSize: '14px', color: '#1F2937', margin: 0, lineHeight: 1.5 }}>
                {stats.ai_recommendation.recommendation}
              </p>
            </div>
          </div>

          <button 
            className="btn-primary"
            onClick={() => navigate(`/assistant?prompt=${encodeURIComponent("Help me act on this recommendation: " + stats.ai_recommendation.recommendation)}`)}
          >
            Ask CampusMate <ArrowRight size={15} />
          </button>
        </div>
      )}

      {/* Main Grid: Today's Schedule & Upcoming Deadlines */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(440px, 1fr))',
        gap: '24px'
      }}>
        {/* Left Column: Today's Schedule */}
        <div className="campus-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Clock size={20} color="#7B1123" />
              <h3 style={{ fontSize: '17px', fontWeight: '700', color: '#4A0E17', margin: 0 }}>
                Today's Schedule
              </h3>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <a
                href="/api/schedule/export.ics"
                download="campusmate_schedule.ics"
                className="btn-secondary"
                style={{ padding: '5px 12px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '5px', textDecoration: 'none' }}
                title="Export schedule to calendar (.ics)"
              >
                <Calendar size={13} color="#7B1123" /> Export .ics
              </a>
              <button 
                onClick={() => setShowScheduleModal(true)}
                className="btn-secondary"
                style={{ padding: '5px 10px', fontSize: '12px' }}
              >
                <Plus size={13} /> Add Block
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {(!stats?.today_schedule || stats.today_schedule.length === 0) ? (
              <div style={{ 
                padding: '36px 20px', 
                textAlign: 'center', 
                backgroundColor: '#F9FAFB', 
                borderRadius: '8px', 
                border: '1px dashed #D1D5DB' 
              }}>
                <Clock size={28} color="#9CA3AF" style={{ margin: '0 auto 10px' }} />
                <div style={{ fontSize: '14px', fontWeight: '600', color: '#4A0E17' }}>
                  No classes or study sessions scheduled for today
                </div>
                <div style={{ fontSize: '12px', color: '#6B7280', marginTop: '4px', maxWidth: '360px', margin: '4px auto 14px' }}>
                  You have a clean schedule! Relax or add a scheduled study block to stay on track.
                </div>
                <button 
                  className="btn-primary" 
                  style={{ fontSize: '13px', padding: '8px 16px' }}
                  onClick={() => setShowScheduleModal(true)}
                >
                  <Plus size={14} /> Schedule a Time Block
                </button>
              </div>
            ) : (
              stats.today_schedule.map((item) => (
                <div 
                  key={item.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 14px',
                    borderRadius: '8px',
                    backgroundColor: item.is_completed ? '#F9FAFB' : '#FFFFFF',
                    border: '1px solid #DCE0E5',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                    <button
                      onClick={() => handleToggleSchedule(item.id)}
                      style={{
                        width: '22px',
                        height: '22px',
                        borderRadius: '6px',
                        border: item.is_completed ? 'none' : '2px solid #D1D5DB',
                        backgroundColor: item.is_completed ? '#166534' : 'transparent',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        flexShrink: 0
                      }}
                      aria-label="Toggle completion"
                    >
                      {item.is_completed && <Check size={14} color="#FFFFFF" />}
                    </button>
                    <div>
                      <div style={{
                        fontSize: '14px',
                        fontWeight: '600',
                        color: item.is_completed ? '#9CA3AF' : '#1F2937',
                        textDecoration: item.is_completed ? 'line-through' : 'none'
                      }}>
                        {item.title}
                        {item.is_sample && (
                          <span className="badge badge-demo" style={{ marginLeft: '8px', fontSize: '9px', padding: '1px 5px' }}>
                            Demo
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '12px', color: '#6B7280' }}>
                        {item.start_time} - {item.end_time} &bull; {item.location}
                      </div>
                    </div>
                  </div>

                  <span className={`badge ${
                    item.category === 'Class' ? 'badge-burgundy' :
                    item.category === 'Lab' ? 'badge-grey' :
                    item.category === 'Study' ? 'badge-warning' : 'badge-grey'
                  }`}>
                    {item.category}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Column: Upcoming Deadlines */}
        <div className="campus-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Calendar size={20} color="#7B1123" />
              <h3 style={{ fontSize: '17px', fontWeight: '700', color: '#4A0E17', margin: 0 }}>
                Upcoming Deadlines
              </h3>
            </div>
            <button 
              className="btn-tertiary"
              onClick={() => navigate('/tasks')}
              style={{ padding: 0 }}
            >
              View All <ArrowRight size={14} />
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {(!stats?.deadlines || stats.deadlines.length === 0) ? (
              <div style={{ 
                padding: '36px 20px', 
                textAlign: 'center', 
                backgroundColor: '#F9FAFB', 
                borderRadius: '8px', 
                border: '1px dashed #D1D5DB' 
              }}>
                <CheckCircle2 size={28} color="#065F46" style={{ margin: '0 auto 10px' }} />
                <div style={{ fontSize: '14px', fontWeight: '600', color: '#4A0E17' }}>
                  No pending deadlines recorded!
                </div>
                <div style={{ fontSize: '12px', color: '#6B7280', marginTop: '4px', maxWidth: '360px', margin: '4px auto 14px' }}>
                  You are completely caught up. Upload your assignment list or add tasks to stay prepared.
                </div>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '10px' }}>
                  <button 
                    className="btn-primary" 
                    style={{ fontSize: '13px', padding: '8px 16px' }}
                    onClick={() => setShowTaskModal(true)}
                  >
                    <Plus size={14} /> Add Task
                  </button>
                  <button 
                    className="btn-secondary" 
                    style={{ fontSize: '13px', padding: '8px 16px' }}
                    onClick={() => setShowImportModal(true)}
                  >
                    <Upload size={14} /> Import File
                  </button>
                </div>
              </div>
            ) : (
              stats.deadlines.map((task) => (
                <div 
                  key={task.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 14px',
                    borderRadius: '8px',
                    backgroundColor: task.status === 'Completed' ? '#F9FAFB' : '#FFFFFF',
                    border: '1px solid #DCE0E5'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                    <button
                      onClick={() => handleToggleTask(task.id)}
                      style={{
                        width: '22px',
                        height: '22px',
                        borderRadius: '6px',
                        border: task.status === 'Completed' ? 'none' : '2px solid #D1D5DB',
                        backgroundColor: task.status === 'Completed' ? '#166534' : 'transparent',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        flexShrink: 0
                      }}
                      aria-label="Toggle task completion"
                    >
                      {task.status === 'Completed' && <Check size={14} color="#FFFFFF" />}
                    </button>
                    <div>
                      <div style={{
                        fontSize: '14px',
                        fontWeight: '600',
                        color: task.status === 'Completed' ? '#9CA3AF' : '#1F2937',
                        textDecoration: task.status === 'Completed' ? 'line-through' : 'none'
                      }}>
                        {task.title}
                        {task.is_sample && (
                          <span className="badge badge-demo" style={{ marginLeft: '8px', fontSize: '9px', padding: '1px 5px' }}>
                            Demo Data
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '12px', color: '#6B7280' }}>
                        Course: <strong>{task.course}</strong> &bull; Due: {task.due_date}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {getDeadlineBadge(task.due_date, task.status)}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Real Academic Analytics: Weekly Study Velocity & Course Workload Distribution */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(440px, 1fr))',
        gap: '24px'
      }}>
        {/* Weekly Study Velocity Chart (Actual DB data) */}
        <div className="campus-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <TrendingUp size={20} color="#7B1123" />
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#4A0E17', margin: 0 }}>
                  Weekly Study Velocity
                </h3>
                <span style={{ fontSize: '12px', color: '#6B7280' }}>Actual logged hours vs target for this week</span>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '11px', fontWeight: '600' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#7B1123' }}>
                <span style={{ width: '10px', height: '10px', backgroundColor: '#7B1123', borderRadius: '2px' }} /> Actual
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#6B7280' }}>
                <span style={{ width: '10px', height: '10px', backgroundColor: '#E5E7EB', borderRadius: '2px' }} /> Target
              </span>
            </div>
          </div>

          {!hasVelocityData ? (
            <div style={{ 
              height: '220px', 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              justifyContent: 'center', 
              backgroundColor: '#F9FAFB', 
              borderRadius: '8px',
              border: '1px dashed #D1D5DB',
              padding: '20px',
              textAlign: 'center'
            }}>
              <TrendingUp size={28} color="#9CA3AF" style={{ marginBottom: '8px' }} />
              <div style={{ fontSize: '14px', fontWeight: '600', color: '#4A0E17' }}>No study hours logged this week yet</div>
              <div style={{ fontSize: '12px', color: '#6B7280', marginTop: '4px', maxWidth: '320px' }}>
                Create a study roadmap or complete scheduled study sessions to track your weekly velocity.
              </div>
            </div>
          ) : (
            <div style={{ width: '100%', height: '220px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={weeklyData}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                  <XAxis dataKey="day" stroke="#6B7280" fontSize={12} tickLine={false} />
                  <YAxis stroke="#6B7280" fontSize={12} tickLine={false} unit="h" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#DCE0E5', borderRadius: '8px', fontSize: '12px' }}
                    formatter={(val) => [`${val} hrs`, '']}
                  />
                  <Bar dataKey="target" fill="#E5E7EB" radius={[4, 4, 0, 0]} barSize={14} />
                  <Bar dataKey="actual" fill="#7B1123" radius={[4, 4, 0, 0]} barSize={14} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Course Workload Distribution Chart (Actual DB data) */}
        <div className="campus-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <BarChart2 size={20} color="#7B1123" />
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#4A0E17', margin: 0 }}>
                  Course Workload Distribution
                </h3>
                <span style={{ fontSize: '12px', color: '#6B7280' }}>Estimated revision hours by course from database</span>
              </div>
            </div>
            <span className="badge badge-burgundy">Live Queue</span>
          </div>

          {!hasWorkloadData ? (
            <div style={{ 
              height: '220px', 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              justifyContent: 'center', 
              backgroundColor: '#F9FAFB', 
              borderRadius: '8px',
              border: '1px dashed #D1D5DB',
              padding: '20px',
              textAlign: 'center'
            }}>
              <BarChart2 size={28} color="#9CA3AF" style={{ marginBottom: '8px' }} />
              <div style={{ fontSize: '14px', fontWeight: '600', color: '#4A0E17' }}>No active course tasks found</div>
              <div style={{ fontSize: '12px', color: '#6B7280', marginTop: '4px', maxWidth: '320px' }}>
                Add academic tasks or upload your course syllabus to visualize your effort distribution.
              </div>
            </div>
          ) : (
            <div style={{ width: '100%', height: '220px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={workloadData}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="effortGradientBurgundy" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#7B1123" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#7B1123" stopOpacity={0.0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                  <XAxis dataKey="course" stroke="#6B7280" fontSize={11} tickLine={false} />
                  <YAxis stroke="#6B7280" fontSize={12} tickLine={false} unit="h" />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#DCE0E5', borderRadius: '8px', fontSize: '12px' }}
                    formatter={(val) => [`${val} hrs`, 'Workload']}
                  />
                  <Area type="monotone" dataKey="hours" stroke="#7B1123" strokeWidth={2} fillOpacity={1} fill="url(#effortGradientBurgundy)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* Quick Add Task Modal */}
      {showTaskModal && (
        <div className="modal-overlay" onClick={() => setShowTaskModal(false)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()} style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#4A0E17', marginBottom: '16px' }}>
              Add Academic Task or Deadline
            </h3>
            <form onSubmit={handleCreateTask} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '13px', fontWeight: '600', color: '#4A0E17', display: 'block', marginBottom: '6px' }}>
                  Task Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Operating Systems Lab Report"
                  value={newTask.title}
                  onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                  className="form-input"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '13px', fontWeight: '600', color: '#4A0E17', display: 'block', marginBottom: '6px' }}>
                    Course Code
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., CS304 or General"
                    value={newTask.course}
                    onChange={(e) => setNewTask({ ...newTask, course: e.target.value })}
                    className="form-input"
                  />
                </div>
                <div>
                  <label style={{ fontSize: '13px', fontWeight: '600', color: '#4A0E17', display: 'block', marginBottom: '6px' }}>
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
                  <label style={{ fontSize: '13px', fontWeight: '600', color: '#4A0E17', display: 'block', marginBottom: '6px' }}>
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
                    <option value="Reading">Reading</option>
                    <option value="Admin">Admin</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '13px', fontWeight: '600', color: '#4A0E17', display: 'block', marginBottom: '6px' }}>
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
              </div>

              <div>
                <label style={{ fontSize: '13px', fontWeight: '600', color: '#4A0E17', display: 'block', marginBottom: '6px' }}>
                  Estimated Hours
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="0.5"
                  value={newTask.estimated_hours}
                  onChange={(e) => setNewTask({ ...newTask, estimated_hours: parseFloat(e.target.value) || 2.0 })}
                  className="form-input"
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setShowTaskModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Create Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Schedule Time Block Modal */}
      {showScheduleModal && (
        <div className="modal-overlay" onClick={() => setShowScheduleModal(false)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()} style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#4A0E17', marginBottom: '16px' }}>
              Add Daily Schedule Block
            </h3>
            <form onSubmit={handleCreateSchedule} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '13px', fontWeight: '600', color: '#4A0E17', display: 'block', marginBottom: '6px' }}>
                  Block Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g., CS304: Operating Systems Lecture"
                  value={newSchedule.title}
                  onChange={(e) => setNewSchedule({ ...newSchedule, title: e.target.value })}
                  className="form-input"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '13px', fontWeight: '600', color: '#4A0E17', display: 'block', marginBottom: '6px' }}>
                    Start Time
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="09:00 AM"
                    value={newSchedule.start_time}
                    onChange={(e) => setNewSchedule({ ...newSchedule, start_time: e.target.value })}
                    className="form-input"
                  />
                </div>
                <div>
                  <label style={{ fontSize: '13px', fontWeight: '600', color: '#4A0E17', display: 'block', marginBottom: '6px' }}>
                    End Time
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="10:30 AM"
                    value={newSchedule.end_time}
                    onChange={(e) => setNewSchedule({ ...newSchedule, end_time: e.target.value })}
                    className="form-input"
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '13px', fontWeight: '600', color: '#4A0E17', display: 'block', marginBottom: '6px' }}>
                    Date
                  </label>
                  <input
                    type="date"
                    required
                    value={newSchedule.date}
                    onChange={(e) => setNewSchedule({ ...newSchedule, date: e.target.value })}
                    className="form-input"
                  />
                </div>
                <div>
                  <label style={{ fontSize: '13px', fontWeight: '600', color: '#4A0E17', display: 'block', marginBottom: '6px' }}>
                    Category
                  </label>
                  <select
                    value={newSchedule.category}
                    onChange={(e) => setNewSchedule({ ...newSchedule, category: e.target.value })}
                    className="form-select"
                  >
                    <option value="Class">Class</option>
                    <option value="Lab">Lab</option>
                    <option value="Study">Study</option>
                    <option value="Event">Event</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ fontSize: '13px', fontWeight: '600', color: '#4A0E17', display: 'block', marginBottom: '6px' }}>
                  Location / Room
                </label>
                <input
                  type="text"
                  placeholder="e.g., Lecture Hall 201 or Computing Lab"
                  value={newSchedule.location}
                  onChange={(e) => setNewSchedule({ ...newSchedule, location: e.target.value })}
                  className="form-input"
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setShowScheduleModal(false)}
                >
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

      {/* File Import Modal (CSV, Spreadsheet, PDF) */}
      {showImportModal && (
        <div className="modal-overlay" onClick={() => setShowImportModal(false)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()} style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#4A0E17', marginBottom: '12px' }}>
              Import Assignments & Timetable
            </h3>
            <p style={{ fontSize: '13px', color: '#6B7280', marginBottom: '16px' }}>
              Upload your actual academic schedule, syllabus, or deadline list. Supports <strong>CSV, Excel (.xlsx), TSV</strong> and <strong>PDF</strong> timetable files.
            </p>

            {importFeedback && (
              <div style={{
                padding: '12px 16px',
                borderRadius: '8px',
                marginBottom: '16px',
                fontSize: '13px',
                backgroundColor: importFeedback.type === 'success' ? '#DDF5E5' : '#FCE4E4',
                color: importFeedback.type === 'success' ? '#166534' : '#991B1B',
                border: importFeedback.type === 'success' ? '1px solid #bbf7d0' : '1px solid #fca5a5'
              }}>
                {importFeedback.message}
              </div>
            )}

            <form onSubmit={handleFileUpload} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{
                border: '2px dashed #D1D5DB',
                borderRadius: '10px',
                padding: '24px',
                textAlign: 'center',
                backgroundColor: '#F9FAFB',
                cursor: 'pointer'
              }}>
                <FileSpreadsheet size={36} color="#7B1123" style={{ margin: '0 auto 10px' }} />
                <div style={{ fontSize: '14px', fontWeight: '600', color: '#4A0E17' }}>
                  {importFile ? importFile.name : "Select or drag CSV, Excel (.xlsx), or PDF"}
                </div>
                <div style={{ fontSize: '12px', color: '#6B7280', marginTop: '4px' }}>
                  Auto-detects Title, Course, Due Date, Priority, and Exam dates
                </div>
                <input
                  type="file"
                  accept=".csv,.xlsx,.xls,.tsv,.txt,.pdf"
                  required
                  onChange={(e) => setImportFile(e.target.files[0])}
                  style={{ marginTop: '12px' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <a
                  href="/api/tasks/sample-template.csv"
                  download="campusmate_tasks_template.csv"
                  className="btn-secondary"
                  style={{ fontSize: '12px', padding: '6px 12px', textDecoration: 'none' }}
                >
                  <Download size={13} color="#7B1123" /> Download Sample CSV
                </a>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => setShowImportModal(false)}
                    disabled={importing}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn-primary"
                    disabled={importing || !importFile}
                  >
                    {importing ? "Processing..." : "Import into Planner"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
