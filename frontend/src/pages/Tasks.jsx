import React, { useState, useEffect } from 'react';
import { 
  CheckSquare, 
  Plus, 
  Search, 
  Filter, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Trash2, 
  Calendar,
  Check,
  Tag
} from 'lucide-react';

export default function Tasks() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('All');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [sortBy, setSortBy] = useState('dueAsc');
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);

  const [newTask, setNewTask] = useState({
    title: '',
    course: 'CS304',
    due_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    priority: 'Medium',
    category: 'Assignment',
    description: '',
    estimated_hours: 2.0
  });

  const fetchTasks = async () => {
    try {
      setLoading(true);
      let url = '/api/tasks?';
      if (statusFilter !== 'All') url += `status=${encodeURIComponent(statusFilter)}&`;
      if (categoryFilter !== 'All') url += `category=${encodeURIComponent(categoryFilter)}&`;

      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setTasks(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [statusFilter, categoryFilter]);

  const handleToggle = async (id) => {
    try {
      const res = await fetch(`/api/tasks/${id}/toggle`, { method: 'POST' });
      if (res.ok) {
        fetchTasks();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this academic task?")) return;
    try {
      const res = await fetch(`/api/tasks/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchTasks();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newTask.title.trim()) return;
    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTask)
      });
      if (res.ok) {
        setShowModal(false);
        setNewTask({
          title: '',
          course: 'CS304',
          due_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          priority: 'Medium',
          category: 'Assignment',
          description: '',
          estimated_hours: 2.0
        });
        fetchTasks();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const filteredTasks = tasks.filter((t) => {
    const q = searchQuery.toLowerCase();
    return (
      t.title.toLowerCase().includes(q) ||
      t.course.toLowerCase().includes(q) ||
      t.category.toLowerCase().includes(q)
    );
  });

  const sortedTasks = [...filteredTasks].sort((a, b) => {
    if (sortBy === 'dueAsc') return a.due_date.localeCompare(b.due_date);
    if (sortBy === 'dueDesc') return b.due_date.localeCompare(a.due_date);
    if (sortBy === 'priority') {
      const pWeights = { 'High': 3, 'Medium': 2, 'Low': 1 };
      return (pWeights[b.priority] || 0) - (pWeights[a.priority] || 0);
    }
    if (sortBy === 'course') return a.course.localeCompare(b.course);
    return 0;
  });

  const todayStr = new Date().toISOString().split('T')[0];
  const pendingCount = tasks.filter((t) => t.status !== 'Completed').length;
  const highPriorityCount = tasks.filter((t) => t.priority === 'High' && t.status !== 'Completed').length;
  const completedCount = tasks.filter((t) => t.status === 'Completed').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: '700', color: '#163A63' }}>
            Academic Tasks & Deadlines
          </h2>
          <p style={{ color: '#64748B', fontSize: '14px', marginTop: '4px' }}>
            Track assignments, lab submissions, and exam milestones in one centralized tracker.
          </p>
        </div>

        <button className="btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={16} /> Add Academic Task
        </button>
      </div>

      {/* Metrics Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
        <div className="campus-card" style={{ padding: '16px 20px' }}>
          <div style={{ fontSize: '12px', color: '#64748B', fontWeight: '500' }}>Active Deadlines</div>
          <div style={{ fontSize: '24px', fontWeight: '700', color: '#163A63', marginTop: '4px' }}>
            {pendingCount}
          </div>
        </div>

        <div className="campus-card" style={{ padding: '16px 20px' }}>
          <div style={{ fontSize: '12px', color: '#64748B', fontWeight: '500' }}>High Priority</div>
          <div style={{ fontSize: '24px', fontWeight: '700', color: '#B45309', marginTop: '4px' }}>
            {highPriorityCount}
          </div>
        </div>

        <div className="campus-card" style={{ padding: '16px 20px' }}>
          <div style={{ fontSize: '12px', color: '#64748B', fontWeight: '500' }}>Completed</div>
          <div style={{ fontSize: '24px', fontWeight: '700', color: '#166534', marginTop: '4px' }}>
            {completedCount}
          </div>
        </div>
      </div>

      {/* Filters & Search Toolbar */}
      <div className="campus-card" style={{ padding: '16px 20px', display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'center', justifyContent: 'space-between' }}>
        {/* Search */}
        <div style={{ position: 'relative', flex: '1 1 260px' }}>
          <Search size={16} color="#64748B" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            placeholder="Search by title, course, or category..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="form-input"
            style={{ paddingLeft: '36px' }}
          />
        </div>

        {/* Filter & Sort Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '13px', color: '#64748B', fontWeight: '500' }}>Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="form-select"
              style={{ width: 'auto', padding: '6px 12px' }}
            >
              <option value="All">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '13px', color: '#64748B', fontWeight: '500' }}>Category:</span>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="form-select"
              style={{ width: 'auto', padding: '6px 12px' }}
            >
              <option value="All">All Categories</option>
              <option value="Assignment">Assignment</option>
              <option value="Exam">Exam</option>
              <option value="Project">Project</option>
              <option value="Lab">Lab</option>
              <option value="Admin">Admin</option>
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '13px', color: '#64748B', fontWeight: '500' }}>Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="form-select"
              style={{ width: 'auto', padding: '6px 12px' }}
            >
              <option value="dueAsc">Due Date (Earliest)</option>
              <option value="dueDesc">Due Date (Latest)</option>
              <option value="priority">Priority (High to Low)</option>
              <option value="course">Course Code</option>
            </select>
          </div>
        </div>
      </div>

      {/* Task List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#64748B' }}>
            Loading tasks...
          </div>
        ) : sortedTasks.length === 0 ? (
          <div className="campus-card" style={{ padding: '40px', textAlign: 'center', color: '#64748B' }}>
            No matching tasks found.
          </div>
        ) : (
          sortedTasks.map((task) => {

            const isCompleted = task.status === 'Completed';
            const isOverdue = !isCompleted && task.due_date < todayStr;
            const isDueToday = !isCompleted && task.due_date === todayStr;

            return (
              <div
                key={task.id}
                style={{
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #DCE5F0',
                  borderRadius: '12px',
                  padding: '16px 20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '16px',
                  boxShadow: 'var(--shadow-sm)',
                  opacity: isCompleted ? 0.75 : 1
                }}
              >
                {/* Left: Checkbox & Info */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: 1 }}>
                  <button
                    onClick={() => handleToggle(task.id)}
                    style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '6px',
                      border: isCompleted ? 'none' : '2px solid #cbd5e1',
                      backgroundColor: isCompleted ? '#166534' : 'transparent',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      flexShrink: 0
                    }}
                    aria-label="Toggle task status"
                  >
                    {isCompleted && <Check size={15} color="#FFFFFF" />}
                  </button>

                  <div>
                    <div style={{
                      fontSize: '15px',
                      fontWeight: '600',
                      color: isCompleted ? '#64748B' : '#163A63',
                      textDecoration: isCompleted ? 'line-through' : 'none'
                    }}>
                      {task.title}
                    </div>
                    <div style={{ fontSize: '12px', color: '#64748B', display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px', flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: '600', color: '#2563EB' }}>{task.course}</span>
                      <span>&bull;</span>
                      <span>Due: <strong>{task.due_date}</strong></span>
                      {task.estimated_hours && (
                        <>
                          <span>&bull;</span>
                          <span>Est. {task.estimated_hours} hrs</span>
                        </>
                      )}
                      {task.description && (
                        <>
                          <span>&bull;</span>
                          <span style={{ fontStyle: 'italic' }}>{task.description}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: Badges & Actions */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  {isOverdue && <span className="badge badge-error">Overdue</span>}
                  {isDueToday && <span className="badge badge-warning">Due Today</span>}

                  <span className={`badge ${
                    task.priority === 'High' ? 'badge-error' :
                    task.priority === 'Medium' ? 'badge-blue' : 'badge-neutral'
                  }`}>
                    {task.priority} Priority
                  </span>

                  <span className="badge badge-neutral">
                    {task.category}
                  </span>

                  <button
                    onClick={() => handleDelete(task.id)}
                    className="btn-secondary"
                    style={{ padding: '6px 8px', color: '#991B1B' }}
                    title="Delete Task"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal: Add Task */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()} style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#163A63', marginBottom: '16px' }}>
              Add Academic Task or Assignment
            </h3>

            <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '13px', fontWeight: '500', color: '#163A63', display: 'block', marginBottom: '6px' }}>
                  Task Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Computer Networks Lab Report 3"
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

              <div>
                <label style={{ fontSize: '13px', fontWeight: '500', color: '#163A63', display: 'block', marginBottom: '6px' }}>
                  Description / Instructions (Optional)
                </label>
                <textarea
                  rows={3}
                  value={newTask.description}
                  onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                  className="form-input"
                  placeholder="Additional assignment details or requirements..."
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setShowModal(false)}
                >
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
    </div>
  );
}
