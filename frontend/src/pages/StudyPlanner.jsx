import React, { useState, useEffect } from 'react';
import { 
  GraduationCap, 
  Plus, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  Play, 
  Pause, 
  RotateCcw, 
  Trash2, 
  BookOpen, 
  Sparkles, 
  ChevronRight, 
  Flame, 
  Check, 
  Copy,
  Download,
  AlertCircle
} from 'lucide-react';

export default function StudyPlanner() {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  
  // New Plan Form State
  const [subject, setSubject] = useState('');
  const [targetDate, setTargetDate] = useState(
    new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [dailyHours, setDailyHours] = useState(2.5);
  const [topicsInput, setTopicsInput] = useState(
    "Unit 1: Fundamentals & Theory\nUnit 2: Problem Solving\nUnit 3: Practice Exam & Mock Sets"
  );

  // Focus Timer State
  const [timerDuration, setTimerDuration] = useState(25 * 60); // 25 min default
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [timerRunning, setTimerRunning] = useState(false);
  const [sessionsCompleted, setSessionsCompleted] = useState(0);

  const fetchPlans = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/study-plans');
      if (res.ok) {
        const data = await res.json();
        setPlans(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  // Timer Tick
  useEffect(() => {
    let interval = null;
    if (timerRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && timerRunning) {
      setTimerRunning(false);
      setSessionsCompleted((prev) => prev + 1);
      alert("🎉 Focus session completed! Take a 5-minute breather.");
      setTimeLeft(timerDuration);
    }
    return () => clearInterval(interval);
  }, [timerRunning, timeLeft, timerDuration]);

  const handleCopyPlan = (plan) => {
    const text = `Study Roadmap: ${plan.subject}\nTarget Exam: ${plan.target_exam_date} (${plan.daily_hours} hrs/day)\n\nDaily Milestones:\n` +
      plan.milestones.map(m => `Day ${m.day} (${m.date}): ${m.topic} [${m.completed ? 'Completed' : 'Pending'}]`).join('\n');
    navigator.clipboard.writeText(text);
    setCopiedId(plan.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCreatePlan = async (e) => {
    e.preventDefault();
    if (!subject.trim()) return;

    const topics = topicsInput
      .split('\n')
      .map((t) => t.trim())
      .filter(Boolean);

    try {
      const res = await fetch('/api/study-plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject,
          target_exam_date: targetDate,
          daily_hours: parseFloat(dailyHours),
          topics
        })
      });

      if (res.ok) {
        setShowModal(false);
        setSubject('');
        fetchPlans();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleMilestone = async (planId, mIndex) => {
    try {
      const res = await fetch(`/api/study-plans/${planId}/milestone/${mIndex}/toggle`, {
        method: 'POST'
      });
      if (res.ok) {
        fetchPlans();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeletePlan = async (planId) => {
    if (!window.confirm("Are you sure you want to remove this study plan?")) return;
    try {
      const res = await fetch(`/api/study-plans/${planId}`, { method: 'DELETE' });
      if (res.ok) {
        fetchPlans();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const formatTime = (secs) => {
    const mins = Math.floor(secs / 60);
    const remaining = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${remaining.toString().padStart(2, '0')}`;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Top Banner */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#163A63', margin: 0 }}>
            Adaptive Study Planner & Sprints
          </h2>
          <p style={{ color: '#64748B', fontSize: '13px', marginTop: '2px', marginBottom: 0 }}>
            Transform syllabus topics into structured daily milestones leading up to your examination deadlines.
          </p>
        </div>

        <button 
          className="btn-primary" 
          onClick={() => setShowModal(true)}
        >
          <Plus size={15} /> Generate Study Roadmap
        </button>
      </div>

      {/* Focus Timer Card */}
      <div className="campus-card" style={{
        padding: '22px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '20px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{
            width: '50px',
            height: '50px',
            borderRadius: '12px',
            backgroundColor: '#EFF6FF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#2563EB',
            flexShrink: 0
          }}>
            <Flame size={26} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '17px', fontWeight: '700', color: '#163A63' }}>
                Deep Work Focus Sprints
              </span>
              <span className="badge badge-blue">Pomodoro</span>
            </div>
            <div style={{ fontSize: '12.5px', color: '#64748B', marginTop: '2px' }}>
              Eliminate interruptions and log concentrated study blocks.
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
          {/* Time Preset Buttons */}
          <div style={{ display: 'flex', gap: '6px' }}>
            <button
              onClick={() => {
                setTimerRunning(false);
                setTimerDuration(25 * 60);
                setTimeLeft(25 * 60);
              }}
              className="btn-secondary"
              style={{
                padding: '6px 12px',
                fontSize: '12px',
                backgroundColor: timerDuration === 25 * 60 ? '#DBEAFE' : '#FFFFFF',
                color: timerDuration === 25 * 60 ? '#163A63' : '#64748B',
                borderColor: timerDuration === 25 * 60 ? '#2563EB' : '#DCE5F0',
                fontWeight: timerDuration === 25 * 60 ? '700' : '500'
              }}
            >
              25m Sprint
            </button>
            <button
              onClick={() => {
                setTimerRunning(false);
                setTimerDuration(50 * 60);
                setTimeLeft(50 * 60);
              }}
              className="btn-secondary"
              style={{
                padding: '6px 12px',
                fontSize: '12px',
                backgroundColor: timerDuration === 50 * 60 ? '#DBEAFE' : '#FFFFFF',
                color: timerDuration === 50 * 60 ? '#163A63' : '#64748B',
                borderColor: timerDuration === 50 * 60 ? '#2563EB' : '#DCE5F0',
                fontWeight: timerDuration === 50 * 60 ? '700' : '500'
              }}
            >
              50m Deep Block
            </button>
          </div>

          {/* Digits Display */}
          <div style={{
            fontSize: '32px',
            fontWeight: '800',
            fontFamily: 'monospace',
            color: '#163A63',
            minWidth: '100px',
            textAlign: 'center'
          }}>
            {formatTime(timeLeft)}
          </div>

          {/* Controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={() => setTimerRunning(!timerRunning)}
              className="btn-primary"
              style={{ padding: '8px 14px' }}
            >
              {timerRunning ? <Pause size={14} /> : <Play size={14} />}
              {timerRunning ? 'Pause' : 'Start Focus'}
            </button>
            <button
              onClick={() => {
                setTimerRunning(false);
                setTimeLeft(timerDuration);
              }}
              className="btn-secondary"
              style={{ padding: '8px' }}
              title="Reset Timer"
            >
              <RotateCcw size={14} />
            </button>
          </div>

          <div style={{
            fontSize: '11.5px',
            color: '#166534',
            backgroundColor: '#DCFCE7',
            padding: '5px 10px',
            borderRadius: '20px',
            fontWeight: '600'
          }}>
            ✓ {sessionsCompleted} sessions logged today
          </div>
        </div>
      </div>

      {/* Active Plans List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <h3 style={{ fontSize: '17px', fontWeight: '700', color: '#163A63', margin: 0 }}>
          Active Study Roadmaps ({plans.length})
        </h3>

        {loading ? (
          <div className="campus-card" style={{ padding: '40px', textAlign: 'center', color: '#64748B', fontSize: '13px' }}>
            Loading study roadmaps...
          </div>
        ) : plans.length === 0 ? (
          <div className="empty-state">
            <GraduationCap className="empty-state-icon" />
            <div className="empty-state-title">
              No Study Plans Created Yet
            </div>
            <div className="empty-state-desc">
              Tell CampusMate AI what exam you are preparing for and it will automatically generate a structured day-by-day milestone roadmap.
            </div>
            <button className="btn-primary" style={{ marginTop: '16px' }} onClick={() => setShowModal(true)}>
              <Plus size={15} /> Create Your First Roadmap
            </button>
          </div>
        ) : (
          plans.map((plan) => (
            <div key={plan.id} className="campus-card" style={{ padding: '22px' }}>
              {/* Header */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                flexWrap: 'wrap',
                gap: '12px',
                marginBottom: '16px'
              }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <h4 style={{ fontSize: '17px', fontWeight: '700', color: '#163A63', margin: 0 }}>
                      {plan.subject}
                    </h4>
                    {plan.is_sample && (
                      <span className="badge badge-demo">Demo Plan</span>
                    )}
                    <span className="badge badge-blue">
                      {plan.total_days} Days Total
                    </span>
                    <span className="badge badge-neutral">
                      {plan.daily_hours} hrs/day
                    </span>
                  </div>
                  <div style={{ fontSize: '12.5px', color: '#64748B', marginTop: '4px' }}>
                    Target Exam Date: <strong>{plan.target_exam_date}</strong>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <a
                    href={`/api/study-plans/${plan.id}/export.ics`}
                    download={`${plan.subject.replace(/\s+/g, '_').toLowerCase()}_study_plan.ics`}
                    className="btn-secondary"
                    style={{ padding: '6px 12px', fontSize: '11.5px', display: 'flex', alignItems: 'center', gap: '5px', textDecoration: 'none' }}
                    title="Export Study Milestones to Apple/Google/Outlook Calendar (.ics)"
                  >
                    <Calendar size={13} color="#2563EB" />
                    <span>Export .ics</span>
                  </a>
                  <button
                    onClick={() => handleCopyPlan(plan)}
                    className="btn-secondary"
                    style={{ padding: '6px 12px', fontSize: '11.5px' }}
                    title="Copy Roadmap to Clipboard"
                  >
                    {copiedId === plan.id ? <Check size={13} color="#166534" /> : <Copy size={13} />}
                    <span>{copiedId === plan.id ? "Copied!" : "Copy Plan"}</span>
                  </button>
                  <button
                    onClick={() => handleDeletePlan(plan.id)}
                    className="btn-secondary"
                    style={{ padding: '6px 10px', color: '#991B1B' }}
                    title="Delete Study Plan"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>

              {/* Progress Bar */}
              <div style={{ marginBottom: '18px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: '600', color: '#163A63', marginBottom: '6px' }}>
                  <span>Roadmap Completion</span>
                  <span>{plan.progress_pct}% Completed</span>
                </div>
                <div style={{
                  height: '7px',
                  backgroundColor: '#EFF6FF',
                  border: '1px solid #DBEAFE',
                  borderRadius: '4px',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    height: '100%',
                    width: `${plan.progress_pct}%`,
                    backgroundColor: '#2563EB',
                    borderRadius: '4px',
                    transition: 'width 0.3s ease'
                  }} />
                </div>
              </div>

              {/* Milestones Timeline */}
              <div>
                <div style={{ fontSize: '12.5px', fontWeight: '700', color: '#163A63', marginBottom: '8px' }}>
                  Daily Study Milestones
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {plan.milestones.map((m, mIdx) => (
                    <div
                      key={mIdx}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '9px 12px',
                        borderRadius: '6px',
                        backgroundColor: m.completed ? '#F8FAFC' : '#FFFFFF',
                        border: '1px solid #DCE5F0',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: 0 }}>
                        <button
                          onClick={() => handleToggleMilestone(plan.id, mIdx)}
                          style={{
                            width: '18px',
                            height: '18px',
                            borderRadius: '4px',
                            border: m.completed ? 'none' : '2px solid #CBD5E1',
                            backgroundColor: m.completed ? '#2563EB' : 'transparent',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            flexShrink: 0
                          }}
                          aria-label="Toggle milestone"
                        >
                          {m.completed && <Check size={12} color="#FFFFFF" />}
                        </button>

                        <div style={{ minWidth: 0 }}>
                          <div style={{
                            fontSize: '13px',
                            fontWeight: '600',
                            color: m.completed ? '#64748B' : '#172B4D',
                            textDecoration: m.completed ? 'line-through' : 'none',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }}>
                            Day {m.day} &bull; {m.topic}
                          </div>
                          <div style={{ fontSize: '11px', color: '#64748B' }}>
                            {m.date} &bull; {m.duration_hours} hrs required &bull; {m.notes}
                          </div>
                        </div>
                      </div>

                      <span className={`badge ${m.completed ? 'badge-success' : 'badge-neutral'}`} style={{ fontSize: '10px' }}>
                        {m.completed ? 'Done' : 'Pending'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal: Generate Study Plan */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()} style={{ padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <div style={{
                width: '34px',
                height: '34px',
                borderRadius: '8px',
                backgroundColor: '#EFF6FF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#2563EB'
              }}>
                <Sparkles size={18} />
              </div>
              <h3 style={{ fontSize: '17px', fontWeight: '700', color: '#163A63', margin: 0 }}>
                Generate Adaptive Study Roadmap
              </h3>
            </div>

            <form onSubmit={handleCreatePlan} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '13px', fontWeight: '600', color: '#163A63', display: 'block', marginBottom: '5px' }}>
                  Course / Subject *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Database Management Systems (CS308)"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="form-input"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '13px', fontWeight: '600', color: '#163A63', display: 'block', marginBottom: '5px' }}>
                    Exam / Target Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={targetDate}
                    onChange={(e) => setTargetDate(e.target.value)}
                    className="form-input"
                  />
                </div>
                <div>
                  <label style={{ fontSize: '13px', fontWeight: '600', color: '#163A63', display: 'block', marginBottom: '5px' }}>
                    Daily Study Commitment (Hours)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="0.5"
                    max="10"
                    value={dailyHours}
                    onChange={(e) => setDailyHours(e.target.value)}
                    className="form-input"
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '13px', fontWeight: '600', color: '#163A63', display: 'block', marginBottom: '5px' }}>
                  Key Topics or Modules to Cover (One per line)
                </label>
                <textarea
                  rows={4}
                  value={topicsInput}
                  onChange={(e) => setTopicsInput(e.target.value)}
                  className="form-input"
                  placeholder="Topic 1&#10;Topic 2&#10;Topic 3"
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
                  <Sparkles size={14} /> Build Roadmap
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
