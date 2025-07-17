import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import styles from './Dashboard.module.css';

interface RawTicket {
  id: number;
  Subject?: string;
  subject?: string;
  Status?: string;
  status?: string;
  created_at?: string;
  Created?: string;
  updated_at?: string;
  LastUpdated?: string;
}

interface NormalizedTicket {
  id: number;
  subject: string;
  status: string;
  created_at: string;
  updated_at?: string;
}

export const TicketList: React.FC = () => {
  const [tickets, setTickets] = useState<NormalizedTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState('');
  const [showResolved, setShowResolved] = useState(false);

  const normalizeTicket = (ticket: RawTicket): NormalizedTicket => ({
    id: ticket.id,
    subject: ticket.subject || ticket.Subject || 'No Subject',
    status: ticket.status || ticket.Status || 'unknown',
    created_at: ticket.created_at || ticket.Created || '',
    updated_at: ticket.updated_at || ticket.LastUpdated,
  });

  const fetchTickets = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await axios.get('/help/tickets/', {
        params: {
          fmt: 'json',
          show_resolved: true,
        },
      });
      const normalized = res.data.map((ticket: RawTicket) =>
        normalizeTicket(ticket)
      );
      setTickets(normalized);
    } catch (e) {
      setError('Failed to load tickets.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  const formatDate = (input?: string) => {
    if (!input) return 'N/A';
    const normalized = input.includes('T') ? input : input.replace(' ', 'T');
    const date = new Date(normalized);
    return isNaN(date.getTime()) ? 'N/A' : date.toLocaleString();
  };

  const isResolved = (status: string) => {
    const s = status.toLowerCase().trim();
    return s === 'resolved' || s === 'closed';
  };

  const filteredTickets = tickets.filter((ticket) => {
    const matchesFilter =
      ticket.subject.toLowerCase().includes(filter.toLowerCase()) ||
      ticket.id.toString().includes(filter);

    return matchesFilter && showResolved === isResolved(ticket.status);
  });

  const handleClose = async (ticketId: number) => {
    const confirmClose = window.confirm(
      'Are you sure you want to close this ticket?'
    );
    if (!confirmClose) return;

    try {
      await axios.post(`/help/tickets/${ticketId}/close/`);
      fetchTickets();
    } catch {
      alert('Failed to close ticket.');
    }
  };

  return (
    <div className={styles.ticketListContainer}>
      <div className={styles.ticketListHeader}>
        <a href="/help/new-ticket" className="btn btn-primary btn-sm">
          + New Ticket
        </a>
      </div>

      <div className={styles.ticketListControls}>
        <button
          className="btn btn-secondary btn-sm"
          onClick={() => setShowResolved((prev) => !prev)}
        >
          {showResolved ? 'Show only open' : 'Show resolved'}
        </button>

        <input
          type="text"
          className="form-control"
          style={{ maxWidth: '200px' }}
          placeholder="Search tickets"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="text-center">
          <i className="fa fa-spinner fa-pulse fa-2x fa-fw" />
        </div>
      ) : error ? (
        <div className="alert alert-danger">{error}</div>
      ) : filteredTickets.length === 0 ? (
        <div className="alert alert-info">No tickets found.</div>
      ) : (
        <div className={styles.ticketListTableWrapper}>
          <table className="table table-bordered table-sm">
            <thead className="table-light">
              <tr>
                <th>Status</th>
                <th>Ticket ID / Subject</th>
                <th>Last Updated</th>
                <th style={{ minWidth: '100px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredTickets.map((ticket) => {
                const isClosed = isResolved(ticket.status);

                return (
                  <tr key={ticket.id}>
                    <td>{ticket.status}</td>
                    <td>
                      <a href={`/help/tickets/${ticket.id}`}>
                        {ticket.id} / {ticket.subject}
                      </a>
                    </td>
                    <td>
                      {formatDate(ticket.updated_at ?? ticket.created_at)}
                    </td>
                    <td>
                      <div className="btn-group btn-group-sm">
                        <a
                          className="btn btn-info"
                          href={`/help/tickets/${ticket.id}/reply`}
                          title="Reply to this ticket"
                        >
                          <i className="fa fa-reply" /> Reply
                        </a>
                        {!isClosed && (
                          <button
                            type="button"
                            className="btn btn-danger"
                            title="Close this ticket"
                            onClick={() => handleClose(ticket.id)}
                          >
                            <i className="fa fa-times" /> Close
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
