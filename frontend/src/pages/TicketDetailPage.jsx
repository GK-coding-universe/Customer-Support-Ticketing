import { useState } from 'react';
import { api } from '../api';

export default function TicketDetailPage({ ticket: initialTicket, onBack, onTicketUpdated }) {
  const [ticket, setTicket] = useState(initialTicket);
  const [replyText, setReplyText] = useState('');
  const [newStatus, setNewStatus] = useState(initialTicket?.status || 'Open');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!ticket) {
    return (
      <div className="main-content">
        <button className="btn btn-outline" onClick={onBack}>← Back to tickets</button>
        <p style={{ marginTop: '2rem' }}>Ticket not found.</p>
      </div>
    );
  }

  const handleSendReply = async (e) => {
    if (e) e.preventDefault();
    if (!replyText.trim()) return;

    setError('');
    setSubmitting(true);

    try {
      const data = await api.replyTicket(ticket.id, {
        message: replyText.trim(),
        status: newStatus !== ticket.status ? newStatus : undefined,
      });

      if (data.ticket) {
        setTicket(data.ticket);
        setReplyText('');
        if (onTicketUpdated) onTicketUpdated(data.ticket);
      }
    } catch (err) {
      setError(err.message || 'Failed to submit response');
    } finally {
      setSubmitting(false);
    }
  };

  const handleQuickStatusChange = async (targetStatus) => {
    if (targetStatus === ticket.status) return;
    setError('');
    setSubmitting(true);

    try {
      const data = await api.replyTicket(ticket.id, {
        message: `Status updated to ${targetStatus}`,
        status: targetStatus,
      });

      if (data.ticket) {
        setTicket(data.ticket);
        setNewStatus(targetStatus);
        if (onTicketUpdated) onTicketUpdated(data.ticket);
      }
    } catch (err) {
      setError(err.message || 'Failed to update ticket status');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="main-content fade-in">
      
      {/* Back button */}
      <div style={{ marginBottom: '1.5rem' }}>
        <button
          className="btn btn-outline"
          onClick={onBack}
          style={{ padding: '0.45rem 0.9rem', fontSize: '0.85rem' }}
        >
          ← Back to All Tickets
        </button>
      </div>

      {/* Ticket Header Card */}
      <div className="glass-card" style={{ marginBottom: '1.5rem', padding: '1.75rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.4rem' }}>
              <span style={{ fontFamily: 'monospace', color: 'var(--text-dim)', fontWeight: 700 }}>
                #{ticket.id}
              </span>
              <span className={`badge badge-${ticket.priority?.toLowerCase()}`}>
                {ticket.priority} Priority
              </span>
              <span className={`badge badge-${ticket.status?.toLowerCase().replace(' ', '-')}`}>
                {ticket.status}
              </span>
            </div>
            <h1 style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
              {ticket.title}
            </h1>
          </div>

          {/* Quick status actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {ticket.status !== 'Resolved' ? (
              <button
                className="btn btn-secondary"
                style={{ fontSize: '0.8rem', padding: '0.45rem 0.85rem', color: '#34d399', borderColor: 'rgba(16, 185, 129, 0.3)' }}
                onClick={() => handleQuickStatusChange('Resolved')}
                disabled={submitting}
              >
                ✓ Mark as Resolved
              </button>
            ) : (
              <button
                className="btn btn-secondary"
                style={{ fontSize: '0.8rem', padding: '0.45rem 0.85rem', color: '#818cf8', borderColor: 'rgba(99, 102, 241, 0.3)' }}
                onClick={() => handleQuickStatusChange('In Progress')}
                disabled={submitting}
              >
                ↺ Reopen Ticket
              </button>
            )}
          </div>
        </div>

        <div style={{ fontSize: '0.85rem', color: 'var(--text-dim)', display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
          <span>Created on {new Date(ticket.created_at).toLocaleString()}</span>
          <span>Last active {ticket.updated_at ? new Date(ticket.updated_at).toLocaleString() : 'Recently'}</span>
        </div>
      </div>

      {error && (
        <div className="alert alert-error">
          <div>{error}</div>
        </div>
      )}

      {/* Message Thread */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-muted)' }}>
          Conversation History ({ticket.messages?.length || 0})
        </h3>

        {ticket.messages && ticket.messages.map((msg, idx) => {
          const isCustomer = msg.sender_role === 'customer';
          return (
            <div
              key={msg.id || idx}
              className="glass-card"
              style={{
                padding: '1.25rem',
                borderLeft: isCustomer ? '3px solid var(--accent-primary)' : '3px solid #10b981',
                background: isCustomer ? 'rgba(18, 24, 38, 0.8)' : 'rgba(16, 185, 129, 0.05)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    background: isCustomer ? 'var(--accent-gradient)' : '#10b981',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.75rem',
                    fontWeight: 700
                  }}>
                    {msg.sender_name ? msg.sender_name.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>
                    {msg.sender_name || 'Customer'}
                  </span>
                  <span style={{
                    fontSize: '0.7rem',
                    padding: '0.1rem 0.4rem',
                    borderRadius: '4px',
                    background: isCustomer ? 'rgba(99, 102, 241, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                    color: isCustomer ? '#a5b4fc' : '#6ee7b7'
                  }}>
                    {isCustomer ? 'Customer' : 'Support Specialist'}
                  </span>
                </div>

                <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                  {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {new Date(msg.created_at).toLocaleDateString()}
                </span>
              </div>

              <div style={{ color: 'var(--text-main)', fontSize: '0.95rem', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>
                {msg.message}
              </div>
            </div>
          );
        })}
      </div>

      {/* Reply Composer Form */}
      <div className="glass-card" style={{ padding: '1.5rem', background: 'var(--bg-secondary)' }}>
        <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '1rem' }}>
          Add a Reply or Update
        </h4>

        <form onSubmit={handleSendReply}>
          <div className="form-group">
            <textarea
              className="form-textarea"
              placeholder="Write your update or reply message..."
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              rows="3"
              required
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <label htmlFor="select-status" style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Set Status:
              </label>
              <select
                id="select-status"
                className="form-select"
                style={{ width: 'auto', padding: '0.45rem 0.85rem', fontSize: '0.85rem' }}
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
              >
                <option value="Open">Open</option>
                <option value="In Progress">In Progress</option>
                <option value="Resolved">Resolved</option>
              </select>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={submitting || !replyText.trim()}
            >
              {submitting ? 'Sending...' : 'Post Reply'}
            </button>
          </div>
        </form>
      </div>

    </div>
  );
}
