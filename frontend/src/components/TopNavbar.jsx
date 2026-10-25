import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  Menu, 
  Search, 
  Bell, 
  Calendar as CalendarIcon, 
  Sparkles,
  CheckCircle2,
  FileText
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

  const todayStr = new Date().toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    navigate(`/campus-info?q=${encodeURIComponent(searchQuery)}`);
    setSearchQuery('');
  };

  return (
    <header style={{
      height: '70px',
      backgroundColor: '#FFFFFF',
      borderBottom: '1px solid #DCE5F0',
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
            color: '#163A63',
            display: 'flex',
            alignItems: 'center'
          }}
          aria-label="Toggle Navigation"
        >
          <Menu size={22} />
        </button>

        <div>
          <h1 style={{ fontSize: '19px', fontWeight: '700', color: '#163A63', margin: 0 }}>
            {pageTitle}
          </h1>
          <div style={{ fontSize: '12px', color: '#64748B' }}>
            CampusMate AI &bull; Fall Semester 2026
          </div>
        </div>
      </div>

      {/* Right: Search, Date, Notifications, Profile */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
        {/* Quick Search */}
        <form onSubmit={handleSearchSubmit} style={{ position: 'relative', display: 'none' }} className="search-form-desktop">
          <Search size={16} color="#64748B" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            placeholder="Search documents, policies, notices..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              padding: '8px 14px 8px 36px',
              backgroundColor: '#F5F8FC',
              border: '1px solid #DCE5F0',
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
          backgroundColor: '#EAF1FA',
          padding: '6px 12px',
          borderRadius: '8px',
          fontSize: '12px',
          fontWeight: '500',
          color: '#163A63'
        }}>
          <CalendarIcon size={14} color="#2563EB" />
          <span>{todayStr}</span>
        </div>

        {/* Notifications Icon with Popover */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            style={{
              background: '#F5F8FC',
              border: '1px solid #DCE5F0',
              borderRadius: '8px',
              width: '38px',
              height: '38px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              position: 'relative',
              color: '#163A63'
            }}
            aria-label="View notifications"
          >
            <Bell size={18} />
            <span style={{
              position: 'absolute',
              top: '6px',
              right: '6px',
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: '#2563EB'
            }} />
          </button>

          {showNotifications && (
            <div style={{
              position: 'absolute',
              top: '48px',
              right: 0,
              width: '320px',
              backgroundColor: '#FFFFFF',
              border: '1px solid #DCE5F0',
              borderRadius: '12px',
              boxShadow: '0 10px 25px rgba(22, 58, 99, 0.12)',
              zIndex: 100,
              padding: '16px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <span style={{ fontSize: '14px', fontWeight: '600', color: '#163A63' }}>Notifications</span>
                <span style={{ fontSize: '11px', color: '#2563EB', fontWeight: '500', cursor: 'pointer' }} onClick={() => navigate('/notices')}>View All</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ padding: '8px', borderRadius: '8px', backgroundColor: '#EFF6FF', border: '1px solid #DBEAFE' }}>
                  <div style={{ fontSize: '12px', fontWeight: '600', color: '#163A63', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <FileText size={14} color="#2563EB" /> Mid-Term Schedule Published
                  </div>
                  <div style={{ fontSize: '11px', color: '#64748B', marginTop: '4px' }}>
                    Admit cards available for download by Oct 30.
                  </div>
                </div>

                <div style={{ padding: '8px', borderRadius: '8px', backgroundColor: '#F5F8FC', border: '1px solid #DCE5F0' }}>
                  <div style={{ fontSize: '12px', fontWeight: '600', color: '#163A63', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Sparkles size={14} color="#2563EB" /> HackCampus 2026 Registration
                  </div>
                  <div style={{ fontSize: '11px', color: '#64748B', marginTop: '4px' }}>
                    RSVP confirmed for ACM Chapter Hackathon.
                  </div>
                </div>
              </div>
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
            backgroundColor: '#EFF6FF',
            border: '2px solid #2563EB',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: '700',
            fontSize: '14px',
            color: '#2563EB'
          }}>
            AC
          </div>
        </div>
      </div>
    </header>
  );
}
