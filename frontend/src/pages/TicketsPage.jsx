import { useState, useEffect } from 'react';
import { api } from '../api';

export default function TicketsPage({ onSelectTicket }) {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Create Ticket Form State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('Medium');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // Status Filter
  const [filter, setFilter] = useState('ALL'); // 'ALL' | 'Open' | 'In Progress' | 'Resolved'

  const fetchTickets = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await api.getTickets();
      setTickets(data.tickets || []);
    } catch (err) {
      setError(err.message || 'Failed to load tickets.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const handleCreateTicket = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!title.trim() || !description.trim()) {
      setFormError('Please provide both a title and description for your ticket.');
      return;
    }

    setSubmitting(true);
    try {
      const data = await api.createTicket({
        title: title.trim(),
        description: description.trim(),
        priority,
      });

      setTitle('');
      setDescription('');
      setPriority('Medium');
      setShowCreateModal(false);
      
      // Select the new ticket or refresh list
      if (data.ticket) {
        onSelectTicket(data.ticket);
      } else {
        await fetchTickets();
      }
    } catch (err) {
      setFormError(err.message || 'Failed to create ticket.');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredTickets = tickets.filter((t) => {
    if (filter === 'ALL') return true;
    return t.status === filter;
  });

  const openCount = tickets.filter((t) => t.status === 'Open').length;
  const progressCount = tickets.filter((t) => t.status === 'In Progress').length;
  const resolvedCount = tickets.filter((t) => t.status === 'Resolved').length;

  return (
    <div className="main-content fade-in">
      
      {/* Top Banner / Metrics & Action */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '1rem',
        marginBottom: '2rem'
      }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '0.25rem' }}>
            Support Tickets
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Track and resolve your customer support inquiries in real-time
          </p>
        </div>

        <button
          className="btn btn-primary"
          onClick={() => setShowCreateModal(true)}
          id="btn-new-ticket"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          Raise New Ticket
        </button>
      </div>

      {/* Stats Summary Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '1rem',
        marginBottom: '2rem'
      }}>
        <div className="glass-card" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: 'var(--radius-md)',
            background: 'rgba(99, 102, 241, 0.15)',
            color: '#818cf8',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.2rem'
          }}>
            📋
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Total Tickets</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>{tickets.length}</div>
          </div>
        </div>

        <div className="glass-card" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: 'var(--radius-md)',
            background: 'var(--status-open-bg)',
            color: 'var(--status-open-text)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.2rem'
          }}>
            ⚡
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Open</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--status-open-text)' }}>{openCount}</div>
          </div>
        </div>

        <div className="glass-card" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: 'var(--radius-md)',
            background: 'var(--status-progress-bg)',
            color: 'var(--status-progress-text)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.2rem'
          }}>
            ⏳
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>In Progress</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--status-progress-text)' }}>{progressCount}</div>
          </div>
        </div>

        <div className="glass-card" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: 'var(--radius-md)',
            background: 'var(--status-resolved-bg)',
            color: 'var(--status-resolved-text)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.2rem'
          }}>
            ✓
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Resolved</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--status-resolved-text)' }}>{resolvedCount}</div>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        marginBottom: '1.5rem',
        borderBottom: '1px solid var(--border-subtle)',
        paddingBottom: '0.75rem'
      }}>
        {['ALL', 'Open', 'In Progress', 'Resolved'].map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            style={{
              background: filter === tab ? 'rgba(99, 102, 241, 0.2)' : 'transparent',
              color: filter === tab ? '#fff' : 'var(--text-muted)',
              border: filter === tab ? '1px solid rgba(99, 102, 241, 0.4)' : '1px solid transparent',
              padding: '0.4rem 0.9rem',
              borderRadius: 'var(--radius-full)',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            {tab === 'ALL' ? 'All Tickets' : tab}
          </button>
        ))}
      </div>

      {/* Error state */}
      {error && (
        <div className="alert alert-error">
          <div>{error}</div>
        </div>
      )}

      {/* Loading state */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem 1rem', color: 'var(--text-muted)' }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>⏳</div>
          <p>Fetching your support tickets...</p>
        </div>
      ) : filteredTickets.length === 0 ? (
        /* Empty state */
        <div className="glass-card" style={{ textAlign: 'center', padding: '3.5rem 1.5rem' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>🎫</div>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.5rem' }}>
            {filter === 'ALL' ? 'No support tickets found' : `No tickets with status "${filter}"`}
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', maxWidth: '420px', margin: '0 auto 1.5rem' }}>
            Need help with an order, billing question, or technical issue? Create a ticket and our team will get right on it.
          </p>
          <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
            + Create Ticket
          </button>
        </div>
      ) : (
        /* Ticket Cards List */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {filteredTickets.map((ticket) => (
            <div
              key={ticket.id}
              className="glass-card"
              style={{
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem',
                borderLeft: ticket.status === 'Resolved' 
                  ? '3px solid #10b981' 
                  : ticket.status === 'In Progress' 
                    ? '3px solid #f59e0b' 
                    : '3px solid #6366f1'
              }}
              onClick={() => onSelectTicket(ticket)}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)', fontFamily: 'monospace', fontWeight: 600 }}>
                    #{ticket.id}
                  </span>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)' }}>
                    {ticket.title}
                  </h3>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  {/* Priority Badge */}
                  <span className={`badge badge-${ticket.priority.toLowerCase()}`}>
                    {ticket.priority}
                  </span>

                  {/* Status Badge */}
                  <span className={`badge badge-${ticket.status.toLowerCase().replace(' ', '-')}`}>
                    {ticket.status}
                  </span>
                </div>
              </div>

              <p style={{
                color: 'var(--text-muted)',
                fontSize: '0.9rem',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                lineHeight: 1.5
              }}>
                {ticket.description}
              </p>

              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingTop: '0.5rem',
                borderTop: '1px solid var(--border-subtle)',
                fontSize: '0.8rem',
                color: 'var(--text-dim)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <span>Created {new Date(ticket.created_at).toLocaleDateString()}</span>
                  <span>💬 {ticket.messages?.length || 1} message{ticket.messages?.length !== 1 ? 's' : ''}</span>
                </div>

                <span style={{ color: 'var(--accent-primary)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  View details →
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* New Ticket Modal Form */}
      {showCreateModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1.5rem',
          zIndex: 100
        }}>
          <div className="glass-card fade-in" style={{
            maxWidth: '520px',
            width: '100%',
            background: 'var(--bg-secondary)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            padding: '2rem'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.3rem', fontWeight: 700 }}>Raise Support Ticket</h2>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-muted)',
                  fontSize: '1.25rem',
                  cursor: 'pointer',
                  padding: '0.25rem'
                }}
              >
                ✕
              </button>
            </div>

            {formError && (
              <div className="alert alert-error">
                <div>{formError}</div>
              </div>
            )}

            <form onSubmit={handleCreateTicket}>
              <div className="form-group">
                <label className="form-label" htmlFor="ticket-title">Ticket Subject / Title</label>
                <input
                  id="ticket-title"
                  type="text"
                  className="form-input"
                  placeholder="e.g. Unable to process payment"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  autoFocus
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="ticket-priority">Priority</label>
                <select
                  id="ticket-priority"
                  className="form-select"
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                >
                  <option value="Low">Low - General inquiry</option>
                  <option value="Medium">Medium - Normal problem</option>
                  <option value="High">High - Urgent / Blocking</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="ticket-desc">Detailed Problem Description</label>
                <textarea
                  id="ticket-desc"
                  className="form-textarea"
                  placeholder="Please describe what happened, steps to reproduce, or what you need assistance with..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows="4"
                  required
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowCreateModal(false)}
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={submitting}
                >
                  {submitting ? 'Creating...' : 'Submit Ticket'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
