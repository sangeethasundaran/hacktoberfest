import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Calendar, 
  Clock, 
  MapPin, 
  Check, 
  Plus, 
  Tag, 
  ExternalLink,
  Sparkles,
  Ticket,
  RefreshCw,
  ShieldCheck,
  AlertTriangle,
  Building,
  Info,
  Globe
} from 'lucide-react';

export default function ClubsEvents() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [activeTab, setActiveTab] = useState('upcoming'); // 'upcoming' | 'past' | 'clubs'
  const [syncing, setSyncing] = useState(false);
  const [syncData, setSyncData] = useState({
    last_synced_at: '',
    status: '',
    total_events: 0,
    upcoming_events: 0,
    past_events: 0
  });
  const [syncFeedback, setSyncFeedback] = useState(null);

  const fetchSyncStatus = async () => {
    try {
      const res = await fetch('/api/sync/status');
      if (res.ok) {
        const data = await res.json();
        setSyncData(data);
      }
    } catch (err) {
      console.error("Failed to fetch sync status:", err);
    }
  };

  const fetchEvents = async () => {
    try {
      setLoading(true);
      let statusParam = 'all';
      if (activeTab === 'upcoming') statusParam = 'upcoming';
      else if (activeTab === 'past') statusParam = 'past';

      let url = `/api/events?status=${statusParam}`;
      if (selectedCategory !== 'All') {
        url += `&category=${encodeURIComponent(selectedCategory)}`;
      }

      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setEvents(data);
      }
    } catch (err) {
      console.error("Failed to fetch events:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSyncStatus();
  }, []);

  useEffect(() => {
    if (activeTab !== 'clubs') {
      fetchEvents();
    }
  }, [selectedCategory, activeTab]);

  const handleManualSync = async () => {
    try {
      setSyncing(true);
      setSyncFeedback(null);
      const res = await fetch('/api/sync/cce', { method: 'POST' });
      if (res.ok) {
        const result = await res.json();
        setSyncFeedback({
          type: 'success',
          message: `Synchronized with Christ College of Engineering. ${result.total_events} verified events loaded.`
        });
        await fetchSyncStatus();
        await fetchEvents();
      } else {
        setSyncFeedback({
          type: 'error',
          message: 'Unable to synchronize with CCE portal right now. Retaining verified snapshot.'
        });
      }
    } catch (err) {
      setSyncFeedback({
        type: 'error',
        message: 'Network request error during synchronization.'
      });
    } finally {
      setSyncing(false);
      setTimeout(() => setSyncFeedback(null), 6000);
    }
  };

  const handleToggleRegister = async (eventId) => {
    try {
      const res = await fetch(`/api/events/${eventId}/toggle-register`, { method: 'POST' });
      if (res.ok) {
        fetchEvents();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const categories = ['All', 'Technical', 'Cultural', 'Entrepreneurship', 'Social', 'Academic'];

  // Official student organizations at Christ College of Engineering (Autonomous), Irinjalakuda
  const clubsDirectory = [
    {
      name: "IEEE Student Branch CCE (IEEE SB CCE)",
      category: "Technical",
      officialSource: "https://cce.edu.in/student_services/ieee",
      lead: "Branch Counselor: Prof. Sunil Paul | IEEE Kochi Subsection",
      meets: "Wednesdays & Saturdays @ IEEE Student Center / Seminar Hall",
      description: "Flagship international student branch representing IEEE Computer Society and IEEE Power & Energy Society (PES). Organizes IEEE Buildathon, UNFOLD startup bootcamps, and IEEE Smart Village projects."
    },
    {
      name: "Computer Society of India (CSI Student Chapter)",
      category: "Technical",
      officialSource: "https://cce.edu.in/student_services/clubs/index",
      lead: "Faculty Advisor: Dept of Computer Science & Engineering",
      meets: "Thursdays 4:30 PM @ CSE Software Labs",
      description: "Promotes competitive programming, full-stack Webathons, cloud technologies, open-source development, and systems engineering for computing students."
    },
    {
      name: "American Society of Civil Engineers (ASCE CCE)",
      category: "Technical",
      officialSource: "https://cce.edu.in/student_services/clubs/index",
      lead: "Faculty In-Charge: Dept of Civil Engineering",
      meets: "Tuesdays 4:30 PM @ Civil Seminar Hall",
      description: "Student chapter hosting structural design hackathons, CAD Hack 2026, Total Station surveying masterclasses, and alumni career roadmaps in infrastructure."
    },
    {
      name: "Innovation & Entrepreneurship Development Centre (IEDC)",
      category: "Entrepreneurship",
      officialSource: "https://cce.edu.in/student_services/iedc",
      lead: "Nodal Officer: CCE Startup Cell & KSUM Incubation",
      meets: "Alternate Fridays @ Incubation Center",
      description: "Kerala Startup Mission (KSUM) affiliated center fostering intellectual property, patent filing, student ventures, and government seed grant applications."
    },
    {
      name: "National Service Scheme (NSS Unit CCE)",
      category: "Social",
      officialSource: "https://cce.edu.in/student_services/nss",
      lead: "Program Officer: Prof. Davis & CCE NSS Cell",
      meets: "Weekends @ Campus Quad & Community Outreach Sites",
      description: "Community welfare, Punarjani medical equipment restoration drives, annual 7-day special camps, and environmental sustainability initiatives."
    },
    {
      name: "Fine Arts & Cultural Club (CCE Dhyuti)",
      category: "Cultural",
      officialSource: "https://cce.edu.in/student_services/clubs/index",
      lead: "Cultural Coordinators & Student Senate",
      meets: "Fridays 4:30 PM @ College Auditorium",
      description: "Hosts Christ College annual inter-collegiate arts fest Dhyuti, classical music ensembles, drama productions, choreography, and literary workshops."
    }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Official CCE College Header Banner */}
      <div 
        className="campus-card" 
        style={{ 
          padding: '20px 24px', 
          backgroundColor: '#FFFFFF',
          borderLeft: '4px solid #2563EB',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span className="badge badge-blue" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11px', textTransform: 'uppercase' }}>
                <Building size={12} /> Christ College of Engineering (Autonomous)
              </span>
              <span style={{ fontSize: '12px', color: '#64748B' }}>
                Irinjalakuda, Kerala
              </span>
            </div>
            <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#163A63', margin: 0 }}>
              Campus Events & Student Activities
            </h2>
            <p style={{ color: '#64748B', fontSize: '13px', marginTop: '2px', marginBottom: 0 }}>
              Official events, workshops, hackathons, and student branch activities synchronized from the college database.
            </p>
          </div>

          {/* Sync Button & Status */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
            <button
              onClick={handleManualSync}
              disabled={syncing}
              className="btn-primary"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '7px 14px',
                fontSize: '12.5px',
                cursor: syncing ? 'not-allowed' : 'pointer'
              }}
            >
              <RefreshCw size={13} className={syncing ? 'animate-spin' : ''} />
              {syncing ? 'Synchronizing with CCE...' : 'Sync with CCE Portal'}
            </button>

            <div style={{ fontSize: '11px', color: '#64748B', textAlign: 'right' }}>
              <span>Database status: </span>
              <strong style={{ color: '#163A63' }}>
                {syncData.last_synced_at || 'Connected'}
              </strong>
            </div>
          </div>
        </div>

        {/* Sync Feedback Message */}
        {syncFeedback && (
          <div 
            style={{
              padding: '10px 14px',
              borderRadius: '8px',
              fontSize: '12.5px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: syncFeedback.type === 'success' ? '#DCFCE7' : '#FEF3C7',
              color: syncFeedback.type === 'success' ? '#166534' : '#92400E',
              border: `1px solid ${syncFeedback.type === 'success' ? '#BBF7D0' : '#FDE68A'}`
            }}
          >
            {syncFeedback.type === 'success' ? <ShieldCheck size={16} /> : <AlertTriangle size={16} />}
            <span>{syncFeedback.message}</span>
          </div>
        )}

        {/* Official Sources Citation Bar */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', paddingTop: '10px', borderTop: '1px solid #DCE5F0', fontSize: '12px', color: '#64748B' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Globe size={13} color="#2563EB" />
            <span>Official Portal: </span>
            <a 
              href="https://cce.edu.in/" 
              target="_blank" 
              rel="noreferrer" 
              style={{ color: '#2563EB', fontWeight: '600', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '3px' }}
            >
              cce.edu.in <ExternalLink size={11} />
            </a>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Globe size={13} color="#2563EB" />
            <span>IEEE Student Branch: </span>
            <a 
              href="https://cce.edu.in/student_services/ieee" 
              target="_blank" 
              rel="noreferrer" 
              style={{ color: '#2563EB', fontWeight: '600', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '3px' }}
            >
              cce.edu.in/student_services/ieee <ExternalLink size={11} />
            </a>
          </div>
        </div>
      </div>

      {/* Navigation Tabs (Upcoming vs Past vs Clubs) */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', backgroundColor: '#F1F5F9', padding: '4px', borderRadius: '8px', border: '1px solid #DCE5F0' }}>
          <button
            onClick={() => setActiveTab('upcoming')}
            style={{
              padding: '7px 16px',
              borderRadius: '6px',
              border: 'none',
              fontSize: '13px',
              fontWeight: activeTab === 'upcoming' ? '700' : '500',
              backgroundColor: activeTab === 'upcoming' ? '#FFFFFF' : 'transparent',
              color: activeTab === 'upcoming' ? '#163A63' : '#64748B',
              boxShadow: activeTab === 'upcoming' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
              cursor: 'pointer'
            }}
          >
            Upcoming Events ({syncData.upcoming_events || events.filter(e => e.is_upcoming).length || '0'})
          </button>

          <button
            onClick={() => setActiveTab('past')}
            style={{
              padding: '7px 16px',
              borderRadius: '6px',
              border: 'none',
              fontSize: '13px',
              fontWeight: activeTab === 'past' ? '700' : '500',
              backgroundColor: activeTab === 'past' ? '#FFFFFF' : 'transparent',
              color: activeTab === 'past' ? '#163A63' : '#64748B',
              boxShadow: activeTab === 'past' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
              cursor: 'pointer'
            }}
          >
            Past Events & Highlights
          </button>

          <button
            onClick={() => setActiveTab('clubs')}
            style={{
              padding: '7px 16px',
              borderRadius: '6px',
              border: 'none',
              fontSize: '13px',
              fontWeight: activeTab === 'clubs' ? '700' : '500',
              backgroundColor: activeTab === 'clubs' ? '#FFFFFF' : 'transparent',
              color: activeTab === 'clubs' ? '#163A63' : '#64748B',
              boxShadow: activeTab === 'clubs' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
              cursor: 'pointer'
            }}
          >
            Official Clubs Directory
          </button>
        </div>

        {/* Category Filters (when viewing events) */}
        {activeTab !== 'clubs' && (
          <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '2px' }}>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className="btn-secondary"
                style={{
                  padding: '6px 14px',
                  fontSize: '12px',
                  backgroundColor: selectedCategory === cat ? '#DBEAFE' : '#FFFFFF',
                  color: selectedCategory === cat ? '#163A63' : '#64748B',
                  borderColor: selectedCategory === cat ? '#2563EB' : '#DCE5F0',
                  fontWeight: selectedCategory === cat ? '700' : '500'
                }}
              >
                {cat}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Main Content Area */}
      {activeTab !== 'clubs' ? (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
          gap: '20px'
        }}>
          {loading ? (
            <div style={{ padding: '40px', gridColumn: '1 / -1', textAlign: 'center', color: '#64748B', fontSize: '13px' }}>
              <RefreshCw size={22} className="animate-spin" style={{ margin: '0 auto 10px auto', color: '#2563EB' }} />
              Loading verified events from Christ College of Engineering...
            </div>
          ) : events.length === 0 ? (
            <div className="empty-state" style={{ gridColumn: '1 / -1' }}>
              <Calendar className="empty-state-icon" />
              <div className="empty-state-title">
                {activeTab === 'upcoming' ? 'No Upcoming Events Scheduled' : 'No Events Found'}
              </div>
              <div className="empty-state-desc">
                {activeTab === 'upcoming' 
                  ? 'There are currently no upcoming events matching this filter. Check past highlights or sync with the CCE portal.'
                  : 'No past event archives match your current category selection.'}
              </div>
              <button className="btn-primary" style={{ marginTop: '14px' }} onClick={handleManualSync}>
                <RefreshCw size={14} /> Refresh College Events
              </button>
            </div>
          ) : (
            events.map((event) => {
              const isPast = !event.is_upcoming;
              return (
                <div
                  key={event.id}
                  className="campus-card"
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    padding: '20px',
                    opacity: isPast ? 0.92 : 1,
                    position: 'relative'
                  }}
                >
                  <div>
                    {/* Top Row: Club & Status Badges */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px', gap: '8px' }}>
                      <div>
                        <span style={{ fontSize: '11px', fontWeight: '700', color: '#2563EB', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                          {event.organizer || event.club_name}
                        </span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                          <span className="badge badge-neutral" style={{ fontSize: '10px' }}>
                            {event.category}
                          </span>
                          {event.is_sample && (
                            <span className="badge badge-demo" style={{ fontSize: '9.5px', padding: '1px 5px' }}>Demo</span>
                          )}
                          {event.is_upcoming ? (
                            <span className="badge badge-blue" style={{ fontSize: '10px' }}>
                              Upcoming
                            </span>
                          ) : (
                            <span className="badge badge-neutral" style={{ fontSize: '10px' }}>
                              Past Event
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Verification Status Badge */}
                      {event.is_verified ? (
                        <span 
                          title="Verified from cce.edu.in official college publication"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            backgroundColor: '#DCFCE7',
                            color: '#166534',
                            fontSize: '11px',
                            fontWeight: '600',
                            padding: '3px 8px',
                            borderRadius: '6px'
                          }}
                        >
                          <ShieldCheck size={12} /> Verified
                        </span>
                      ) : (
                        <span 
                          title="Unverified community submission or pending review"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            backgroundColor: '#FEF3C7',
                            color: '#92400E',
                            fontSize: '11px',
                            fontWeight: '600',
                            padding: '3px 8px',
                            borderRadius: '6px'
                          }}
                        >
                          <AlertTriangle size={12} /> Pending Review
                        </span>
                      )}
                    </div>

                    {/* Event Title */}
                    <h4 style={{ fontSize: '15.5px', fontWeight: '700', color: '#163A63', marginBottom: '8px', lineHeight: 1.35 }}>
                      {event.title}
                    </h4>

                    {/* Logistics Details */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', fontSize: '12px', color: '#64748B', marginBottom: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                        <Calendar size={13} color="#2563EB" /> 
                        <strong style={{ color: '#172B4D' }}>{event.date}</strong> &bull; {event.time || "Schedule Announced by Organizer"}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                        <MapPin size={13} color="#64748B" /> 
                        <span>{event.venue || event.location || "Christ College of Engineering, Irinjalakuda"}</span>
                      </div>
                      {event.registration_deadline && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '7px', color: '#D97706', fontWeight: '500' }}>
                          <Clock size={13} color="#D97706" /> 
                          <span>Deadline: <strong>{event.registration_deadline}</strong></span>
                        </div>
                      )}
                    </div>

                    {/* Description */}
                    <p style={{ fontSize: '12.5px', color: '#64748B', lineHeight: 1.5, marginBottom: '14px' }}>
                      {event.description}
                    </p>
                  </div>

                  <div>
                    {/* Official Source Attribution Link */}
                    <div style={{ 
                      padding: '8px 10px', 
                      backgroundColor: '#F8FAFC', 
                      borderRadius: '6px', 
                      fontSize: '11px', 
                      color: '#64748B',
                      marginBottom: '12px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <span>Source: <strong>{event.source_name || "cce.edu.in"}</strong></span>
                      {event.source_url ? (
                        <a 
                          href={event.source_url} 
                          target="_blank" 
                          rel="noreferrer" 
                          style={{ color: '#2563EB', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '3px', fontWeight: '600' }}
                        >
                          View Official Link <ExternalLink size={10} />
                        </a>
                      ) : (
                        <span style={{ color: '#94A3B8' }}>Internal Notice</span>
                      )}
                    </div>

                    {/* RSVP / Registration Actions */}
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      paddingTop: '12px',
                      borderTop: '1px solid #DCE5F0'
                    }}>
                      <span style={{ fontSize: '11.5px', color: '#64748B' }}>
                        {event.is_registered 
                          ? "✓ Scheduled on your Student Calendar" 
                          : (event.registration_link ? "Official Link Available" : "CCE Student Entry")}
                      </span>

                      <div style={{ display: 'flex', gap: '8px' }}>
                        {event.registration_link && (
                          <a
                            href={event.registration_link}
                            target="_blank"
                            rel="noreferrer"
                            className="btn-secondary"
                            style={{
                              padding: '5px 10px',
                              fontSize: '11.5px',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              textDecoration: 'none'
                            }}
                          >
                            <ExternalLink size={11} /> Register Link
                          </a>
                        )}

                        <button
                          onClick={() => handleToggleRegister(event.id)}
                          className={event.is_registered ? "btn-secondary" : "btn-primary"}
                          style={{
                            padding: '5px 12px',
                            fontSize: '11.5px',
                            backgroundColor: event.is_registered ? '#DCFCE7' : '#2563EB',
                            color: event.is_registered ? '#166534' : '#FFFFFF',
                            borderColor: event.is_registered ? '#BBF7D0' : 'transparent',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                        >
                          {event.is_registered ? (
                            <>
                              <Check size={12} /> RSVP Confirmed
                            </>
                          ) : (
                            <>
                              <Ticket size={12} /> RSVP to Schedule
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      ) : (
        /* Official Clubs Directory Tab */
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '20px' }}>
          {clubsDirectory.map((club, idx) => (
            <div key={idx} className="campus-card" style={{ padding: '22px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <span className="badge badge-blue">{club.category}</span>
                  <span style={{ fontSize: '11px', color: '#166534', fontWeight: '600', backgroundColor: '#DCFCE7', padding: '2px 8px', borderRadius: '4px' }}>
                    Active Official Body
                  </span>
                </div>

                <h4 style={{ fontSize: '16px', fontWeight: '700', color: '#163A63', marginBottom: '6px' }}>
                  {club.name}
                </h4>

                <div style={{ fontSize: '12px', color: '#2563EB', fontWeight: '600', marginBottom: '4px' }}>
                  {club.lead}
                </div>

                <div style={{ fontSize: '12px', color: '#64748B', marginBottom: '12px' }}>
                  🗓️ {club.meets}
                </div>

                <p style={{ fontSize: '12.5px', color: '#64748B', lineHeight: 1.5, marginBottom: '16px' }}>
                  {club.description}
                </p>
              </div>

              <div style={{ paddingTop: '12px', borderTop: '1px solid #DCE5F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '11px', color: '#64748B' }}>Official Publication:</span>
                <a
                  href={club.officialSource}
                  target="_blank"
                  rel="noreferrer"
                  style={{ fontSize: '12px', color: '#2563EB', textDecoration: 'none', fontWeight: '600', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                >
                  Visit Club Page <ExternalLink size={11} />
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
