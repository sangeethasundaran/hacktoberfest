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
  Zap,
  Check,
  TrendingUp,
  BarChart2
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
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [newTask, setNewTask] = useState({
    title: '',
    course: 'CS304',
    due_date: new Date(Date.now() + 3*24*60*60*1000).toISOString().split('T')[0],
    priority: 'Medium',
    category: 'Assignment'
  });

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
      if (res.ok) {
        fetchDashboardData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleTask = async (id) => {
    try {
      const res = await fetch(`/api/tasks/${id}/toggle`, { method: 'POST' });
      if (res.ok) {
        fetchDashboardData();
      }
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
        body: JSON.stringify(newTask)
      });
      if (res.ok) {
        setShowTaskModal(false);
        setNewTask({
          title: '',
          course: 'CS304',
          due_date: new Date(Date.now() + 3*24*60*60*1000).toISOString().split('T')[0],
          priority: 'Medium',
          category: 'Assignment'
        });
        fetchDashboardData();
      }
    } catch (err) {
      console.error(err);
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
      return <span className="badge badge-blue">Due Soon</span>;
    }
  };

  if (loading && !stats) {
    return (
      <div style={{ padding: '60px 0', textAlign: 'center', color: '#64748B' }}>
        <Sparkles size={32} color="#2563EB" className="animate-spin" style={{ margin: '0 auto 16px' }} />
        <div style={{ fontSize: '16px', fontWeight: '500' }}>Loading your campus workspace...</div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      {/* Top Banner / Greeting */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div>
          <h2 style={{ fontSize: '26px', fontWeight: '700', color: '#163A63', letterSpacing: '-0.02em' }}>
            {stats?.greeting || "Good morning! Ready to make today productive?"}
          </h2>
          <p style={{ color: '#64748B', fontSize: '14px', marginTop: '4px' }}>
            Here is your live academic snapshot, timeline, and agentic recommendations.
          </p>
        </div>

        {/* Quick Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button 
            className="btn-primary" 
            onClick={() => setShowTaskModal(true)}
          >
            <Plus size={16} /> Add Task
          </button>
          <button 
            className="btn-secondary"
            onClick={() => navigate('/study-planner')}
          >
            <Calendar size={16} /> Create Study Plan
          </button>
          <button 
            className="btn-secondary"
            onClick={() => navigate('/notices')}
          >
            <BookOpen size={16} /> Summarize Notice
          </button>
          <button 
            className="btn-primary" 
            style={{ backgroundColor: '#163A63' }}
            onClick={() => navigate('/assistant')}
          >
            <Sparkles size={16} /> Ask AI
          </button>
        </div>
      </div>

      {/* 4 Statistics Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: '20px'
      }}>
        {/* Card 1: Pending Tasks */}
        <div className="campus-card" style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
          <div style={{
            width: '52px',
            height: '52px',
            borderRadius: '12px',
            backgroundColor: '#EFF6FF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#2563EB',
            flexShrink: 0
          }}>
            <CheckSquare size={26} />
          </div>
          <div>
            <div style={{ fontSize: '13px', color: '#64748B', fontWeight: '500' }}>Pending Tasks</div>
            <div style={{ fontSize: '28px', fontWeight: '700', color: '#163A63', lineHeight: 1.2 }}>
              {stats?.pending_tasks || 0}
            </div>
            <div style={{ fontSize: '11px', color: '#2563EB', marginTop: '2px', fontWeight: '500' }}>
              Real-time database sync
            </div>
          </div>
        </div>

        {/* Card 2: Upcoming Exams */}
        <div className="campus-card" style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
          <div style={{
            width: '52px',
            height: '52px',
            borderRadius: '12px',
            backgroundColor: '#FFF1CC',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#B45309',
            flexShrink: 0
          }}>
            <AlertCircle size={26} />
          </div>
          <div>
            <div style={{ fontSize: '13px', color: '#64748B', fontWeight: '500' }}>Upcoming Exams</div>
            <div style={{ fontSize: '28px', fontWeight: '700', color: '#163A63', lineHeight: 1.2 }}>
              {stats?.upcoming_exams || 0}
            </div>
            <div style={{ fontSize: '11px', color: '#B45309', marginTop: '2px', fontWeight: '500' }}>
              Mid-terms approaching
            </div>
          </div>
        </div>

        {/* Card 3: Completed Tasks */}
        <div className="campus-card" style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
          <div style={{
            width: '52px',
            height: '52px',
            borderRadius: '12px',
            backgroundColor: '#DDF5E5',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#166534',
            flexShrink: 0
          }}>
            <CheckCircle2 size={26} />
          </div>
          <div>
            <div style={{ fontSize: '13px', color: '#64748B', fontWeight: '500' }}>Completed Tasks</div>
            <div style={{ fontSize: '28px', fontWeight: '700', color: '#163A63', lineHeight: 1.2 }}>
              {stats?.completed_tasks || 0}
            </div>
            <div style={{ fontSize: '11px', color: '#166534', marginTop: '2px', fontWeight: '500' }}>
              Steady progress
            </div>
          </div>
        </div>

        {/* Card 4: Upcoming Events */}
        <div className="campus-card" style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
          <div style={{
            width: '52px',
            height: '52px',
            borderRadius: '12px',
            backgroundColor: '#DBEAFE',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#1E40AF',
            flexShrink: 0
          }}>
            <Users size={26} />
          </div>
          <div>
            <div style={{ fontSize: '13px', color: '#64748B', fontWeight: '500' }}>Upcoming Events</div>
            <div style={{ fontSize: '28px', fontWeight: '700', color: '#163A63', lineHeight: 1.2 }}>
              {stats?.upcoming_events || 0}
            </div>
            <div style={{ fontSize: '11px', color: '#2563EB', marginTop: '2px', fontWeight: '500' }}>
              Clubs & Hackathons
            </div>
          </div>
        </div>
      </div>

      {/* AI Recommendation Banner Card */}
      {stats?.ai_recommendation && (
        <div style={{
          backgroundColor: '#FFFFFF',
          border: '1px solid #DCE5F0',
          borderLeft: '4px solid #2563EB',
          borderRadius: '12px',
          padding: '20px 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
          boxShadow: '0 2px 8px rgba(37, 99, 235, 0.06)'
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', flex: 1 }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              backgroundColor: '#EFF6FF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#2563EB',
              flexShrink: 0
            }}>
              <Sparkles size={20} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <span style={{ fontSize: '14px', fontWeight: '700', color: '#163A63' }}>
                  AI Academic Recommendation
                </span>
                <span className="badge badge-blue">
                  {stats.ai_recommendation.action_type}
                </span>
              </div>
              <p style={{ fontSize: '14px', color: '#172B4D', margin: 0, lineHeight: 1.5 }}>
                {stats.ai_recommendation.recommendation}
              </p>
            </div>
          </div>

          <button 
            className="btn-primary"
            onClick={() => navigate('/assistant')}
          >
            Ask CampusMate <ArrowRight size={15} />
          </button>
        </div>
      )}

      {/* Main Grid: Today's Schedule & Upcoming Deadlines */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(460px, 1fr))',
        gap: '24px'
      }}>
        {/* Left Column: Today's Schedule */}
        <div className="campus-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Clock size={20} color="#2563EB" />
              <h3 style={{ fontSize: '17px', fontWeight: '700', color: '#163A63' }}>
                Today's Schedule
              </h3>
            </div>
            <span style={{ fontSize: '12px', color: '#64748B', fontWeight: '500' }}>
              {stats?.today_schedule?.length || 0} scheduled blocks
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {(!stats?.today_schedule || stats.today_schedule.length === 0) ? (
              <div style={{ padding: '24px', textAlign: 'center', color: '#64748B', fontSize: '14px' }}>
                No scheduled activities for today. Relax or schedule a study block!
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
                    backgroundColor: item.is_completed ? '#F5F8FC' : '#FFFFFF',
                    border: '1px solid #DCE5F0',
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
                        border: item.is_completed ? 'none' : '2px solid #cbd5e1',
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
                        color: item.is_completed ? '#64748B' : '#163A63',
                        textDecoration: item.is_completed ? 'line-through' : 'none'
                      }}>
                        {item.title}
                      </div>
                      <div style={{ fontSize: '12px', color: '#64748B' }}>
                        {item.start_time} - {item.end_time} &bull; {item.location}
                      </div>
                    </div>
                  </div>

                  <span className={`badge ${
                    item.category === 'Class' ? 'badge-blue' :
                    item.category === 'Lab' ? 'badge-neutral' :
                    item.category === 'Study' ? 'badge-warning' : 'badge-neutral'
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
              <Calendar size={20} color="#2563EB" />
              <h3 style={{ fontSize: '17px', fontWeight: '700', color: '#163A63' }}>
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
              <div style={{ padding: '24px', textAlign: 'center', color: '#64748B', fontSize: '14px' }}>
                🎉 No upcoming deadlines! You are completely up to date.
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
                    backgroundColor: task.status === 'Completed' ? '#F5F8FC' : '#FFFFFF',
                    border: '1px solid #DCE5F0'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                    <button
                      onClick={() => handleToggleTask(task.id)}
                      style={{
                        width: '22px',
                        height: '22px',
                        borderRadius: '6px',
                        border: task.status === 'Completed' ? 'none' : '2px solid #cbd5e1',
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
                        color: task.status === 'Completed' ? '#64748B' : '#163A63',
                        textDecoration: task.status === 'Completed' ? 'line-through' : 'none'
                      }}>
                        {task.title}
                      </div>
                      <div style={{ fontSize: '12px', color: '#64748B' }}>
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

      {/* Academic Analytics & Study Velocity (Recharts) */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(460px, 1fr))',
        gap: '24px'
      }}>
        {/* Weekly Study Hours vs Target */}
        <div className="campus-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <TrendingUp size={20} color="#2563EB" />
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#163A63', margin: 0 }}>
                  Weekly Study Velocity
                </h3>
                <span style={{ fontSize: '12px', color: '#64748B' }}>Actual study hours vs planned daily target</span>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '11px', fontWeight: '600' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#2563EB' }}>
                <span style={{ width: '10px', height: '10px', backgroundColor: '#2563EB', borderRadius: '2px' }} /> Actual
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#64748B' }}>
                <span style={{ width: '10px', height: '10px', backgroundColor: '#DBEAFE', borderRadius: '2px' }} /> Target
              </span>
            </div>
          </div>

          <div style={{ width: '100%', height: '220px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={[
                  { day: 'Mon', actual: 3.5, target: 3.0 },
                  { day: 'Tue', actual: 4.0, target: 3.5 },
                  { day: 'Wed', actual: 2.5, target: 3.0 },
                  { day: 'Thu', actual: 5.0, target: 3.5 },
                  { day: 'Fri', actual: 3.0, target: 3.0 },
                  { day: 'Sat', actual: 6.0, target: 4.0 },
                  { day: 'Sun', actual: 4.5, target: 3.5 },
                ]}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#EAF1FA" vertical={false} />
                <XAxis dataKey="day" stroke="#64748B" fontSize={12} tickLine={false} />
                <YAxis stroke="#64748B" fontSize={12} tickLine={false} unit="h" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#DCE5F0', borderRadius: '8px', fontSize: '12px' }}
                  formatter={(val) => [`${val} hrs`, '']}
                />
                <Bar dataKey="target" fill="#DBEAFE" radius={[4, 4, 0, 0]} barSize={14} />
                <Bar dataKey="actual" fill="#2563EB" radius={[4, 4, 0, 0]} barSize={14} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Course Effort Allocation */}
        <div className="campus-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <BarChart2 size={20} color="#2563EB" />
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#163A63', margin: 0 }}>
                  Course Workload Distribution
                </h3>
                <span style={{ fontSize: '12px', color: '#64748B' }}>Estimated revision hours by course</span>
              </div>
            </div>
            <span className="badge badge-blue">Fall 2026</span>
          </div>

          <div style={{ width: '100%', height: '220px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={[
                  { course: 'CS304 (OS)', hours: 14 },
                  { course: 'CS308 (DBMS)', hours: 11 },
                  { course: 'MATH201', hours: 8 },
                  { course: 'CS320 (SE)', hours: 7 },
                  { course: 'CS312 (Net)', hours: 5 }
                ]}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="effortGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563EB" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#2563EB" stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#EAF1FA" vertical={false} />
                <XAxis dataKey="course" stroke="#64748B" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748B" fontSize={12} tickLine={false} unit="h" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#DCE5F0', borderRadius: '8px', fontSize: '12px' }}
                  formatter={(val) => [`${val} hrs`, 'Workload']}
                />
                <Area type="monotone" dataKey="hours" stroke="#2563EB" strokeWidth={2} fillOpacity={1} fill="url(#effortGradient)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Quick Add Task Modal */}

      {showTaskModal && (
        <div className="modal-overlay" onClick={() => setShowTaskModal(false)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()} style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#163A63', marginBottom: '16px' }}>
              Add Academic Task or Deadline
            </h3>
            <form onSubmit={handleCreateTask} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '13px', fontWeight: '500', color: '#163A63', display: 'block', marginBottom: '6px' }}>
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
                  <label style={{ fontSize: '13px', fontWeight: '500', color: '#163A63', display: 'block', marginBottom: '6px' }}>
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
                  <label style={{ fontSize: '13px', fontWeight: '500', color: '#163A63', display: 'block', marginBottom: '6px' }}>
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
                  <label style={{ fontSize: '13px', fontWeight: '500', color: '#163A63', display: 'block', marginBottom: '6px' }}>
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
                <div>
                  <label style={{ fontSize: '13px', fontWeight: '500', color: '#163A63', display: 'block', marginBottom: '6px' }}>
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
    </div>
  );
}
