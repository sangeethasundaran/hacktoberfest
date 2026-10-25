import React, { useState, useEffect } from 'react';
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
  Users
} from 'lucide-react';

const titleMap = {
  '/': 'Dashboard Overview',
  '/assistant': 'Campus AI Agent',
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
  const [notifications, setNotifications] = useState([]);
  const [loadingNotifications, setLoadingNotifications] = useState(false);

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

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    navigate(`/campus-info?q=${encodeURIComponent(searchQuery)}`);
    setSearchQuery('');
  };

  const handleNotificationClick = (link) => {
    setShowNotifications(false);
    if (link) navigate(link);
  };

  return (
    <header style={{
      height: '70px',
      backgroundColor: '#FFFFFF',
      borderBottom: '1px solid #DCE0E5',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 32px',
      position: 'sticky',
      top: 0,
      zIndex: 50
    }}>
      {/* Left: Mobile Toggle & Page Title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <button
          onClick={onMenuToggle}
          className="md-hidden"
          style={{
            background: 'none',
            border: 'none',
            padding: '8px',
            cursor: 'pointer',
            color: '#4A0E17',
            display: 'flex',
            alignItems: 'center'
          }}
          aria-label="Toggle Navigation"
        >
          <Menu size={22} />
        </button>

        <div>
          <h1 style={{ fontSize: '19px', fontWeight: '700', color: '#4A0E17', margin: 0 }}>
            {pageTitle}
          </h1>
          <div style={{ fontSize: '12px', color: '#6B7280' }}>
            CampusMate AI &bull; {userSettings?.semester || 'Fall Semester 2026'}
          </div>
        </div>
      </div>

      {/* Right: Search, Date, Notifications, Profile */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
        {/* Quick Search */}
        <form onSubmit={handleSearchSubmit} style={{ position: 'relative', display: 'none' }} className="search-form-desktop">
          <Search size={16} color="#6B7280" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            placeholder="Search policies, notices, tasks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              padding: '8px 14px 8px 36px',
              backgroundColor: '#F4F5F7',
              border: '1px solid #DCE0E5',
              borderRadius: '20px',
              fontSize: '13px',
              outline: 'none',
              width: '260px',
              transition: 'all 0.15s ease'
            }}
          />
        </form>

        {/* Current Date Badge */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          backgroundColor: '#FDF2F4',
          border: '1px solid #F3CCD3',
          padding: '6px 12px',
          borderRadius: '8px',
          fontSize: '12px',
          fontWeight: '500',
          color: '#7B1123'
        }}>
          <CalendarIcon size={14} color="#7B1123" />
          <span>{todayStr}</span>
        </div>

        {/* Notifications Icon with Popover */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => {
              setShowNotifications(!showNotifications);
              if (!showNotifications) fetchNotifications();
            }}
            style={{
              background: '#F4F5F7',
              border: '1px solid #DCE0E5',
              borderRadius: '8px',
              width: '38px',
              height: '38px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              position: 'relative',
              color: '#4A0E17'
            }}
            aria-label="View notifications"
          >
            <Bell size={18} />
            {notifications.length > 0 && (
              <span style={{
                position: 'absolute',
                top: '5px',
                right: '5px',
                minWidth: '16px',
                height: '16px',
                padding: '0 4px',
                borderRadius: '8px',
                backgroundColor: '#7B1123',
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
              top: '48px',
              right: 0,
              width: '340px',
              backgroundColor: '#FFFFFF',
              border: '1px solid #DCE0E5',
              borderRadius: '12px',
              boxShadow: '0 10px 25px rgba(56, 7, 16, 0.12)',
              zIndex: 100,
              padding: '16px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <span style={{ fontSize: '14px', fontWeight: '700', color: '#4A0E17' }}>
                  Live Campus Notifications
                </span>
                <span 
                  style={{ fontSize: '11px', color: '#7B1123', fontWeight: '600', cursor: 'pointer' }} 
                  onClick={() => {
                    setShowNotifications(false);
                    navigate('/notices');
                  }}
                >
                  View Notices
                </span>
              </div>

              {loadingNotifications ? (
                <div style={{ padding: '20px', textAlign: 'center', color: '#6B7280', fontSize: '12px' }}>
                  Checking database for updates...
                </div>
              ) : notifications.length === 0 ? (
                <div style={{ padding: '24px 16px', textAlign: 'center', color: '#6B7280', fontSize: '13px' }}>
                  <CheckCircle2 size={24} color="#166534" style={{ margin: '0 auto 8px' }} />
                  <div>No new alerts right now.</div>
                  <div style={{ fontSize: '11px', color: '#9CA3AF', marginTop: '2px' }}>You are completely up to date!</div>
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
                        backgroundColor: n.priority === 'High' ? '#FFF5F6' : '#F9FAFB', 
                        border: n.priority === 'High' ? '1px solid #F3CCD3' : '1px solid #E5E7EB',
                        cursor: 'pointer',
                        transition: 'background-color 0.15s ease'
                      }}
                    >
                      <div style={{ fontSize: '12px', fontWeight: '600', color: '#4A0E17', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {n.category === 'deadline' && <AlertCircle size={14} color="#7B1123" />}
                        {n.category === 'exam' && <CalendarIcon size={14} color="#B45309" />}
                        {n.category === 'notice' && <FileText size={14} color="#7B1123" />}
                        {n.category === 'event' && <Users size={14} color="#4A0E17" />}
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {n.title}
                        </span>
                      </div>
                      <div style={{ fontSize: '11px', color: '#6B7280', marginTop: '4px' }}>
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
            gap: '10px',
            cursor: 'pointer',
            padding: '4px 8px',
            borderRadius: '8px',
            transition: 'background-color 0.15s ease'
          }}
          title="Go to Settings & Profile"
        >
          <div style={{
            width: '38px',
            height: '38px',
            borderRadius: '50%',
            backgroundColor: '#FDF2F4',
            border: '2px solid #7B1123',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: '700',
            fontSize: '13px',
            color: '#7B1123'
          }}>
            {getInitials(userSettings?.student_name)}
          </div>
        </div>
      </div>
    </header>
  );
}
