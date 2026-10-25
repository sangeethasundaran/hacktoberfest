import React, { useState, useEffect, useRef } from 'react';
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
  Tag,
  Upload,
  Download,
  FileSpreadsheet,
  FileText,
  Sparkles,
  Info,
  X
} from 'lucide-react';

export default function Tasks() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('All');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [sortBy, setSortBy] = useState('dueAsc');
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importTab, setImportTab] = useState('file'); // 'file' or 'manual'
  const [importFile, setImportFile] = useState(null);
  const [importLoading, setImportLoading] = useState(false);
  const [importStatus, setImportStatus] = useState(null);
  const [manualBatchText, setManualBatchText] = useState('');
  const [clearingSample, setClearingSample] = useState(false);
  const fileInputRef = useRef(null);

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

  const handleFileUpload = async (e) => {
    e.preventDefault();
    if (!importFile) return;
    try {
      setImportLoading(true);
      setImportStatus(null);
      const formData = new FormData();
      formData.append('file', importFile);
      const res = await fetch('/api/tasks/import-file', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (res.ok) {
        setImportStatus({ success: true, message: data.message });
        setImportFile(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
        fetchTasks();
        setTimeout(() => setShowImportModal(false), 1500);
      } else {
        setImportStatus({ success: false, message: data.detail || 'Import failed.' });
      }
    } catch (err) {
      setImportStatus({ success: false, message: err.message });
    } finally {
      setImportLoading(false);
    }
  };

  const handleManualBatchSubmit = async (e) => {
    e.preventDefault();
    if (!manualBatchText.trim()) return;
    try {
      setImportLoading(true);
      setImportStatus(null);
      const lines = manualBatchText.trim().split('\n');
      const taskList = [];
      for (const line of lines) {
        const parts = line.split(',').map(s => s.trim());
        if (parts.length >= 1 && parts[0]) {
          taskList.push({
            title: parts[0],
            course: parts[1] || 'GEN101',
            due_date: parts[2] || new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
            priority: parts[3] || 'Medium',
            category: parts[4] || 'Assignment',
            description: parts[5] || ''
          });
        }
      }

      if (taskList.length === 0) {
        setImportStatus({ success: false, message: 'No valid tasks parsed from text.' });
        return;
      }

      const res = await fetch('/api/tasks/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tasks: taskList })
      });
      const data = await res.json();
      if (res.ok) {
        setImportStatus({ success: true, message: data.message });
        setManualBatchText('');
        fetchTasks();
        setTimeout(() => setShowImportModal(false), 1500);
      } else {
        setImportStatus({ success: false, message: data.detail || 'Batch creation failed.' });
      }
    } catch (err) {
      setImportStatus({ success: false, message: err.message });
    } finally {
      setImportLoading(false);
    }
  };

  const handleClearDemoData = async () => {
    if (!window.confirm("Remove demonstration sample tasks? Your personal tasks and custom uploads will be preserved.")) return;
    try {
      setClearingSample(true);
      const res = await fetch('/api/clear-sample-data', { method: 'POST' });
      if (res.ok) {
        fetchTasks();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setClearingSample(false);
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
  const hasSampleData = tasks.some((t) => t.is_sample);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#163A63', margin: 0 }}>
            Academic Tasks & Deadlines
          </h2>
          <p style={{ color: '#64748B', fontSize: '13px', marginTop: '2px', marginBottom: 0 }}>
            Track assignments, lab submissions, and exam milestones connected directly to your database.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <a
            href="/api/tasks/export.csv"
            download="campusmate_tasks.csv"
            className="btn-secondary"
            title="Export tasks to CSV"
          >
            <Download size={14} /> Export CSV
          </a>

          <button className="btn-secondary" onClick={() => setShowImportModal(true)}>
            <Upload size={14} /> Import Tasks
          </button>

          <button className="btn-primary" onClick={() => setShowModal(true)}>
            <Plus size={15} /> Add Task
          </button>
        </div>
      </div>

      {/* Demo Data Banner if sample records exist */}
      {hasSampleData && (
        <div style={{
          backgroundColor: '#FFFBEB',
          border: '1px solid #FDE68A',
          borderRadius: '8px',
          padding: '10px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span className="badge badge-demo">Demo Records Active</span>
            <span style={{ fontSize: '12.5px', color: '#92400E' }}>
              Sample demonstration tasks are currently active. You can clear them or import your actual syllabus anytime.
            </span>
          </div>
          <button
            onClick={handleClearDemoData}
            disabled={clearingSample}
            style={{
              fontSize: '11.5px',
              padding: '5px 10px',
              backgroundColor: '#92400E',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: '600'
            }}
          >
            {clearingSample ? 'Clearing...' : 'Remove Demo Tasks'}
          </button>
        </div>
      )}

      {/* Metrics Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
        <div className="campus-card" style={{ padding: '16px 20px', borderLeft: '4px solid #2563EB' }}>
          <div style={{ fontSize: '11.5px', color: '#64748B', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Active Deadlines
          </div>
          <div style={{ fontSize: '24px', fontWeight: '800', color: '#163A63', marginTop: '2px' }}>
            {pendingCount}
          </div>
        </div>

        <div className="campus-card" style={{ padding: '16px 20px', borderLeft: '4px solid #D97706' }}>
          <div style={{ fontSize: '11.5px', color: '#64748B', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            High Priority
          </div>
          <div style={{ fontSize: '24px', fontWeight: '800', color: '#B45309', marginTop: '2px' }}>
            {highPriorityCount}
          </div>
        </div>

        <div className="campus-card" style={{ padding: '16px 20px', borderLeft: '4px solid #166534' }}>
          <div style={{ fontSize: '11.5px', color: '#64748B', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Completed Tasks
          </div>
          <div style={{ fontSize: '24px', fontWeight: '800', color: '#166534', marginTop: '2px' }}>
            {completedCount}
          </div>
        </div>
      </div>

      {/* Filters & Search Toolbar */}
      <div className="campus-card" style={{ padding: '14px 18px', display: 'flex', flexWrap: 'wrap', gap: '14px', alignItems: 'center', justifyContent: 'space-between' }}>
        {/* Search */}
        <div style={{ position: 'relative', flex: '1 1 240px' }}>
          <Search size={15} color="#64748B" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            placeholder="Search by title, course, or category..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="form-input"
            style={{ paddingLeft: '34px', fontSize: '13px', padding: '7px 12px 7px 34px' }}
          />
        </div>

        {/* Filter & Sort Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '12px', color: '#64748B', fontWeight: '600' }}>Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="form-select"
              style={{ width: 'auto', padding: '6px 10px', fontSize: '12.5px' }}
            >
              <option value="All">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '12px', color: '#64748B', fontWeight: '600' }}>Category:</span>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="form-select"
              style={{ width: 'auto', padding: '6px 10px', fontSize: '12.5px' }}
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
            <span style={{ fontSize: '12px', color: '#64748B', fontWeight: '600' }}>Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="form-select"
              style={{ width: 'auto', padding: '6px 10px', fontSize: '12.5px' }}
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
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {loading ? (
          <div className="campus-card" style={{ padding: '40px', textAlign: 'center', color: '#64748B', fontSize: '13px' }}>
            Loading academic tasks...
          </div>
        ) : sortedTasks.length === 0 ? (
          <div className="empty-state">
            <CheckSquare className="empty-state-icon" />
            <div className="empty-state-title">
              {tasks.length === 0 ? 'No Academic Tasks Found' : 'No Matching Tasks Found'}
            </div>
            <div className="empty-state-desc">
              {tasks.length === 0
                ? 'Your task list is empty. Upload your assignment timetable or course syllabus to automatically extract deadlines.'
                : 'Try adjusting your search query or reset your status filter.'}
            </div>
            <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
              {tasks.length === 0 ? (
                <>
                  <button className="btn-primary" onClick={() => setShowImportModal(true)}>
                    <Upload size={14} /> Import Tasks
                  </button>
                  <button className="btn-secondary" onClick={() => setShowModal(true)}>
                    <Plus size={14} /> Add First Task
                  </button>
                </>
              ) : (
                <button
                  className="btn-secondary"
                  onClick={() => {
                    setSearchQuery('');
                    setStatusFilter('All');
                    setCategoryFilter('All');
                  }}
                >
                  Reset Filters
                </button>
              )}
            </div>
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
                  backgroundColor: isCompleted ? '#F8FAFC' : '#FFFFFF',
                  border: '1px solid #DCE5F0',
                  borderRadius: '10px',
                  padding: '14px 18px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '16px',
                  boxShadow: 'var(--shadow-xs)',
                  transition: 'border-color 0.15s ease'
                }}
              >
                {/* Left: Checkbox & Info */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: 0 }}>
                  <button
                    onClick={() => handleToggle(task.id)}
                    style={{
                      width: '20px',
                      height: '20px',
                      borderRadius: '5px',
                      border: isCompleted ? 'none' : '2px solid #CBD5E1',
                      backgroundColor: isCompleted ? '#2563EB' : 'transparent',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      flexShrink: 0
                    }}
                    aria-label="Toggle task status"
                  >
                    {isCompleted && <Check size={13} color="#FFFFFF" />}
                  </button>

                  <div style={{ minWidth: 0 }}>
                    <div style={{
                      fontSize: '14px',
                      fontWeight: '600',
                      color: isCompleted ? '#64748B' : '#172B4D',
                      textDecoration: isCompleted ? 'line-through' : 'none',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}>
                      <span>{task.title}</span>
                      {task.is_sample && (
                        <span className="badge badge-demo" style={{ fontSize: '9.5px', padding: '1px 5px' }}>Demo</span>
                      )}
                    </div>
                    <div style={{ fontSize: '12px', color: '#64748B', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px', flexWrap: 'wrap' }}>
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
                          <span style={{ fontStyle: 'italic', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {task.description}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: Badges & Actions */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
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
                    <Trash2 size={13} />
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
            <h3 style={{ fontSize: '17px', fontWeight: '700', color: '#163A63', marginBottom: '16px' }}>
              Add Academic Task or Assignment
            </h3>

            <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '13px', fontWeight: '600', color: '#163A63', display: 'block', marginBottom: '5px' }}>
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
              </div>

              <div>
                <label style={{ fontSize: '13px', fontWeight: '600', color: '#163A63', display: 'block', marginBottom: '5px' }}>
                  Estimated Workload (Hours)
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="0.5"
                  value={newTask.estimated_hours}
                  onChange={(e) => setNewTask({ ...newTask, estimated_hours: parseFloat(e.target.value) || 1.0 })}
                  className="form-input"
                />
              </div>

              <div>
                <label style={{ fontSize: '13px', fontWeight: '600', color: '#163A63', display: 'block', marginBottom: '5px' }}>
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

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
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

      {/* Modal: Import Tasks (CSV, XLSX, PDF, Manual Paste) */}
      {showImportModal && (
        <div className="modal-overlay" onClick={() => setShowImportModal(false)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '560px', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '17px', fontWeight: '700', color: '#163A63', margin: 0 }}>
                Import Academic Tasks & Deadlines
              </h3>
              <button
                onClick={() => setShowImportModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Import Tabs */}
            <div style={{ display: 'flex', borderBottom: '1px solid #DCE5F0', marginBottom: '16px' }}>
              <button
                onClick={() => setImportTab('file')}
                style={{
                  padding: '8px 16px',
                  background: 'none',
                  border: 'none',
                  borderBottom: importTab === 'file' ? '2px solid #2563EB' : '2px solid transparent',
                  fontWeight: importTab === 'file' ? '700' : '500',
                  color: importTab === 'file' ? '#2563EB' : '#64748B',
                  cursor: 'pointer',
                  fontSize: '13px'
                }}
              >
                File Upload (.csv, .xlsx, .pdf)
              </button>
              <button
                onClick={() => setImportTab('manual')}
                style={{
                  padding: '8px 16px',
                  background: 'none',
                  border: 'none',
                  borderBottom: importTab === 'manual' ? '2px solid #2563EB' : '2px solid transparent',
                  fontWeight: importTab === 'manual' ? '700' : '500',
                  color: importTab === 'manual' ? '#2563EB' : '#64748B',
                  cursor: 'pointer',
                  fontSize: '13px'
                }}
              >
                Paste / Manual Batch
              </button>
            </div>

            {importStatus && (
              <div style={{
                padding: '10px 14px',
                borderRadius: '8px',
                marginBottom: '14px',
                fontSize: '12.5px',
                backgroundColor: importStatus.success ? '#DCFCE7' : '#FEE2E2',
                color: importStatus.success ? '#166534' : '#991B1B',
                border: `1px solid ${importStatus.success ? '#BBF7D0' : '#FECACA'}`
              }}>
                {importStatus.message}
              </div>
            )}

            {importTab === 'file' ? (
              <form onSubmit={handleFileUpload} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{
                  border: '2px dashed #CBD5E1',
                  borderRadius: '10px',
                  padding: '24px 16px',
                  textAlign: 'center',
                  backgroundColor: '#F8FAFC'
                }}>
                  <Upload size={32} color="#2563EB" style={{ margin: '0 auto 8px auto' }} />
                  <div style={{ fontSize: '13.5px', fontWeight: '600', color: '#163A63' }}>
                    {importFile ? importFile.name : 'Choose a CSV, Excel (.xlsx), or PDF timetable'}
                  </div>
                  <div style={{ fontSize: '12px', color: '#64748B', marginTop: '4px' }}>
                    Upload your actual course syllabus, assignment schedule, or LMS exported spreadsheet.
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv,.xlsx,.tsv,.txt,.pdf"
                    onChange={(e) => setImportFile(e.target.files[0])}
                    style={{ display: 'none' }}
                    id="task-file-input"
                  />
                  <label
                    htmlFor="task-file-input"
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
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={() => setShowImportModal(false)}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={!importFile || importLoading}
                      className="btn-primary"
                    >
                      {importLoading ? 'Processing...' : 'Upload & Import'}
                    </button>
                  </div>
                </div>
              </form>
            ) : (
              <form onSubmit={handleManualBatchSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <label style={{ fontSize: '12.5px', fontWeight: '600', color: '#163A63', display: 'block', marginBottom: '5px' }}>
                    Enter One Task Per Line (Format: Title, Course, Due Date, Priority, Category)
                  </label>
                  <textarea
                    rows={6}
                    value={manualBatchText}
                    onChange={(e) => setManualBatchText(e.target.value)}
                    className="form-input"
                    style={{ fontFamily: 'monospace', fontSize: '12px' }}
                    placeholder="Midterm Exam 1, CS304, 2026-11-15, High, Exam&#10;Lab Report 4, CS304, 2026-11-10, Medium, Lab&#10;Project Sprint Review, EE201, 2026-11-18, High, Project"
                  />
                </div>
                <div style={{ fontSize: '11.5px', color: '#64748B' }}>
                  Tip: Copy-paste rows directly from Excel or Google Sheets separated by commas.
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '6px' }}>
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => setShowImportModal(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!manualBatchText.trim() || importLoading}
                    className="btn-primary"
                  >
                    {importLoading ? 'Importing...' : 'Batch Save Tasks'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
