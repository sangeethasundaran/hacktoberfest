import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  Menu, 
  Search, 
  Bell, 
  Calendar as CalendarIcon, 
  Sparkles,
  CheckCircle2,
  FileText,
  AlertCircle,
  Clock,
  Users,
  CheckSquare,
  BookOpen,
  ArrowRight,
  X
} from 'lucide-react';

const titleMap = {
  '/': 'Dashboard Overview',
  '/assistant': 'Campus AI Assistant',
  '/study-planner': 'Adaptive Study Planner',
  '/tasks': 'Tasks & Academic Deadlines',
  '/notices': 'Campus Bulletins & Notices',
  '/clubs-events': 'Clubs & Campus Life',
  '/campus-info': 'Campus Knowledge & Documents',
  '/settings': 'System & AI Settings'
};

export default function TopNavbar({ onMenuToggle, userSettings }) {
  const location = useLocation();
  const navigate = useNavigate();
  const pageTitle = titleMap[location.pathname] || 'CampusMate AI';
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  const searchContainerRef = useRef(null);

  const fetchNotifications = async () => {
    try {
      setLoadingNotifications(true);
      const res = await fetch('/api/notifications');
      if (res.ok) {
        const data = await res.json();
        setNotifications(data);
      }
    } catch (err) {
      console.error("Failed to load notifications:", err);
    } finally {
      setLoadingNotifications(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [location.pathname]);

  // Dynamic date formatting
  const todayStr = new Date().toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  const getInitials = (name) => {
    if (!name) return 'AC';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  // Live search across tasks, notices, events, and campus documents
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.length < 2) {
      setSearchResults(null);
      setShowSearchDropdown(false);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setIsSearching(true);
        const q = searchQuery.toLowerCase().trim();

        // Fetch from multiple real endpoints concurrently
        const [tasksRes, noticesRes, eventsRes, docsRes] = await Promise.all([
          fetch('/api/tasks').catch(() => null),
          fetch('/api/notices').catch(() => null),
          fetch('/api/events?status=upcoming').catch(() => null),
          fetch('/api/documents').catch(() => null)
        ]);

        const tasksData = tasksRes?.ok ? await tasksRes.json() : [];
        const noticesData = noticesRes?.ok ? await noticesRes.json() : [];
        const eventsData = eventsRes?.ok ? await eventsRes.json() : [];
        const docsData = docsRes?.ok ? await docsRes.json() : [];

        const matchedTasks = tasksData.filter(t => 
          t.title.toLowerCase().includes(q) || t.course.toLowerCase().includes(q)
        ).slice(0, 3);

        const matchedNotices = noticesData.filter(n => 
          n.title.toLowerCase().includes(q) || n.category.toLowerCase().includes(q)
        ).slice(0, 3);

        const matchedEvents = eventsData.filter(e => 
          (e.is_upcoming && !e.is_expired) && (e.title.toLowerCase().includes(q) || (e.organizer && e.organizer.toLowerCase().includes(q)))
        ).slice(0, 3);

        const matchedDocs = docsData.filter(d => 
          d.title.toLowerCase().includes(q) || d.summary.toLowerCase().includes(q)
        ).slice(0, 3);

        const totalCount = matchedTasks.length + matchedNotices.length + matchedEvents.length + matchedDocs.length;

        setSearchResults({
          tasks: matchedTasks,
          notices: matchedNotices,
          events: matchedEvents,
          docs: matchedDocs,
          total: totalCount
        });
        setShowSearchDropdown(true);
      } catch (err) {
        console.error("Search error:", err);
      } finally {
        setIsSearching(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Click outside to close search dropdown
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target)) {
        setShowSearchDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setShowSearchDropdown(false);
    navigate(`/campus-info?q=${encodeURIComponent(searchQuery)}`);
  };

  const handleNotificationClick = (link) => {
    setShowNotifications(false);
    if (link) navigate(link);
  };

  return (
    <header style={{
      height: '68px',
      backgroundColor: '#FFFFFF',
      borderBottom: '1px solid #DCE5F0',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 28px',
      position: 'sticky',
      top: 0,
      zIndex: 50
    }}>
      {/* Left: Mobile Toggle & Page Title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        <button
          onClick={onMenuToggle}
          className="md-hidden"
          style={{
            background: 'none',
            border: 'none',
            padding: '6px',
            cursor: 'pointer',
            color: '#163A63',
            display: 'flex',
            alignItems: 'center'
          }}
          aria-label="Toggle Navigation"
        >
          <Menu size={22} />
        </button>

        <div>
          <h1 style={{ fontSize: '18px', fontWeight: '700', color: '#163A63', margin: 0 }}>
            {pageTitle}
          </h1>
          <div style={{ fontSize: '11.5px', color: '#64748B' }}>
            CampusMate AI &bull; {userSettings?.semester || 'Semester 5 (Fall 2026)'}
          </div>
        </div>
      </div>

      {/* Right: Search, Date, Notifications, Profile */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        {/* Responsive Global Search with Live Results Dropdown */}
        <div ref={searchContainerRef} style={{ position: 'relative' }} className="search-form-desktop">
          <form onSubmit={handleSearchSubmit} style={{ position: 'relative' }}>
            <Search size={15} color="#64748B" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              placeholder="Search tasks, circulars, events, policies..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => { if (searchResults) setShowSearchDropdown(true); }}
              style={{
                padding: '8px 12px 8px 36px',
                backgroundColor: '#F5F8FC',
                border: '1px solid #DCE5F0',
                borderRadius: '20px',
                fontSize: '12.5px',
                outline: 'none',
                width: '280px',
                color: '#172B4D',
                transition: 'all 0.15s ease'
              }}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => { setSearchQuery(''); setSearchResults(null); setShowSearchDropdown(false); }}
                style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8' }}
              >
                <X size={13} />
              </button>
            )}
          </form>

          {/* Search Results Dropdown */}
          {showSearchDropdown && searchResults && (
            <div style={{
              position: 'absolute',
              top: '42px',
              left: 0,
              width: '380px',
              backgroundColor: '#FFFFFF',
              border: '1px solid #DCE5F0',
              borderRadius: '12px',
              boxShadow: '0 10px 25px rgba(15, 39, 68, 0.12)',
              zIndex: 100,
              padding: '12px',
              maxHeight: '440px',
              overflowY: 'auto'
            }}>
              <div style={{ fontSize: '11px', fontWeight: '700', color: '#64748B', textTransform: 'uppercase', marginBottom: '8px', padding: '0 4px' }}>
                Search Results ({searchResults.total})
              </div>

              {searchResults.total === 0 ? (
                <div style={{ padding: '16px 8px', textAlign: 'center', color: '#64748B', fontSize: '12.5px' }}>
                  No matching records found across your campus database.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {/* Tasks */}
                  {searchResults.tasks.length > 0 && (
                    <div>
                      <div style={{ fontSize: '11px', fontWeight: '700', color: '#2563EB', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px' }}>
                        <CheckSquare size={12} /> Tasks & Deadlines
                      </div>
                      {searchResults.tasks.map(t => (
                        <div
                          key={`task-${t.id}`}
                          onClick={() => { setShowSearchDropdown(false); navigate('/tasks'); }}
                          style={{ padding: '6px 8px', borderRadius: '6px', cursor: 'pointer', fontSize: '12.5px', color: '#172B4D', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F5F8FC'}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                        >
                          <span style={{ fontWeight: '500' }}>{t.title}</span>
                          <span style={{ fontSize: '11px', color: '#64748B' }}>{t.course} &bull; {t.due_date}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Notices */}
                  {searchResults.notices.length > 0 && (
                    <div>
                      <div style={{ fontSize: '11px', fontWeight: '700', color: '#163A63', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px' }}>
                        <FileText size={12} /> Notices & Circulars
                      </div>
                      {searchResults.notices.map(n => (
                        <div
                          key={`notice-${n.id}`}
                          onClick={() => { setShowSearchDropdown(false); navigate('/notices'); }}
                          style={{ padding: '6px 8px', borderRadius: '6px', cursor: 'pointer', fontSize: '12.5px', color: '#172B4D', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F5F8FC'}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                        >
                          <span style={{ fontWeight: '500' }}>{n.title}</span>
                          <span style={{ fontSize: '11px', color: '#64748B' }}>{n.category}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Events */}
                  {searchResults.events.length > 0 && (
                    <div>
                      <div style={{ fontSize: '11px', fontWeight: '700', color: '#166534', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px' }}>
                        <Users size={12} /> Campus Events
                      </div>
                      {searchResults.events.map(ev => (
                        <div
                          key={`event-${ev.id}`}
                          onClick={() => { setShowSearchDropdown(false); navigate('/clubs-events'); }}
                          style={{ padding: '6px 8px', borderRadius: '6px', cursor: 'pointer', fontSize: '12.5px', color: '#172B4D', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F5F8FC'}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                        >
                          <span style={{ fontWeight: '500' }}>{ev.title}</span>
                          <span style={{ fontSize: '11px', color: '#64748B' }}>{ev.date}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Documents */}
                  {searchResults.docs.length > 0 && (
                    <div>
                      <div style={{ fontSize: '11px', fontWeight: '700', color: '#64748B', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px' }}>
                        <BookOpen size={12} /> Policies & Handbook
                      </div>
                      {searchResults.docs.map(d => (
                        <div
                          key={`doc-${d.id}`}
                          onClick={() => { setShowSearchDropdown(false); navigate(`/campus-info?q=${encodeURIComponent(d.title)}`); }}
                          style={{ padding: '6px 8px', borderRadius: '6px', cursor: 'pointer', fontSize: '12.5px', color: '#172B4D', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F5F8FC'}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                        >
                          <span style={{ fontWeight: '500' }}>{d.title}</span>
                          <span style={{ fontSize: '11px', color: '#64748B' }}>{d.category}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Dynamic Date Badge */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          backgroundColor: '#EFF6FF',
          border: '1px solid #DBEAFE',
          padding: '6px 12px',
          borderRadius: '8px',
          fontSize: '12px',
          fontWeight: '500',
          color: '#163A63'
        }}>
          <CalendarIcon size={14} color="#2563EB" />
          <span>{todayStr}</span>
        </div>

        {/* Notifications Popover */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => {
              setShowNotifications(!showNotifications);
              if (!showNotifications) fetchNotifications();
            }}
            style={{
              backgroundColor: '#F5F8FC',
              border: '1px solid #DCE5F0',
              borderRadius: '8px',
              width: '36px',
              height: '36px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              position: 'relative',
              color: '#163A63',
              transition: 'background-color 0.15s ease'
            }}
            aria-label="View notifications"
          >
            <Bell size={17} />
            {notifications.length > 0 && (
              <span style={{
                position: 'absolute',
                top: '-3px',
                right: '-3px',
                minWidth: '16px',
                height: '16px',
                padding: '0 4px',
                borderRadius: '8px',
                backgroundColor: '#2563EB',
                color: '#FFFFFF',
                fontSize: '10px',
                fontWeight: '700',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                {notifications.length}
              </span>
            )}
          </button>

          {showNotifications && (
            <div style={{
              position: 'absolute',
              top: '46px',
              right: 0,
              width: '340px',
              backgroundColor: '#FFFFFF',
              border: '1px solid #DCE5F0',
              borderRadius: '12px',
              boxShadow: '0 10px 25px rgba(15, 39, 68, 0.12)',
              zIndex: 100,
              padding: '16px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <span style={{ fontSize: '14px', fontWeight: '700', color: '#163A63' }}>
                  Academic Alerts & Notices
                </span>
                <span 
                  style={{ fontSize: '11px', color: '#2563EB', fontWeight: '600', cursor: 'pointer' }} 
                  onClick={() => {
                    setShowNotifications(false);
                    navigate('/notices');
                  }}
                >
                  View Notices &rarr;
                </span>
              </div>

              {loadingNotifications ? (
                <div style={{ padding: '20px', textAlign: 'center', color: '#64748B', fontSize: '12px' }}>
                  Checking database for updates...
                </div>
              ) : notifications.length === 0 ? (
                <div style={{ padding: '24px 16px', textAlign: 'center', color: '#64748B', fontSize: '13px' }}>
                  <CheckCircle2 size={24} color="#166534" style={{ margin: '0 auto 8px' }} />
                  <div>No urgent notifications right now.</div>
                  <div style={{ fontSize: '11px', color: '#94A3B8', marginTop: '2px' }}>Your schedule and deadlines are clear!</div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '340px', overflowY: 'auto' }}>
                  {notifications.map((n) => (
                    <div 
                      key={n.id}
                      onClick={() => handleNotificationClick(n.link)}
                      style={{ 
                        padding: '10px 12px', 
                        borderRadius: '8px', 
                        backgroundColor: n.priority === 'High' ? '#FEF2F2' : '#F8FAFC', 
                        border: n.priority === 'High' ? '1px solid #FECACA' : '1px solid #E2E8F0',
                        cursor: 'pointer',
                        transition: 'background-color 0.15s ease'
                      }}
                    >
                      <div style={{ fontSize: '12px', fontWeight: '600', color: '#163A63', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {n.category === 'deadline' && <AlertCircle size={14} color="#DC2626" />}
                        {n.category === 'exam' && <CalendarIcon size={14} color="#D97706" />}
                        {n.category === 'notice' && <FileText size={14} color="#2563EB" />}
                        {n.category === 'event' && <Users size={14} color="#163A63" />}
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {n.title}
                        </span>
                      </div>
                      <div style={{ fontSize: '11px', color: '#64748B', marginTop: '4px' }}>
                        {n.message}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Profile Avatar */}
        <div 
          onClick={() => navigate('/settings')}
          style={{
            display: 'flex',
            alignItems: 'center',
            cursor: 'pointer'
          }}
          title="Go to Settings & Profile"
        >
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            backgroundColor: '#DBEAFE',
            border: '2px solid #2563EB',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: '700',
            fontSize: '12.5px',
            color: '#163A63',
            transition: 'transform 0.1s ease'
          }}>
            {getInitials(userSettings?.student_name)}
          </div>
        </div>
      </div>
    </header>
  );
}
