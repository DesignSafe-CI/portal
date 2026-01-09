import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import {
  Table,
  Button,
  Input,
  Alert,
  Space,
  Typography,
  Spin,
  Modal,
} from 'antd';
import {
  CloseOutlined,
  CommentOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import styles from '../Dashboard/Dashboard.module.css';

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
  const [ticketToClose, setTicketToClose] = useState<number | null>(null);
  const [closing, setClosing] = useState(false);
  const [closeError, setCloseError] = useState<string | null>(null);

  // Normalize status: replace unknown or unexpected values with 'new'
  const normalizeStatus = (status?: string) => {
    if (!status) return 'unknown';
    const s = status.toLowerCase().trim();
    const allowedStatuses = ['new', 'open', 'pending', 'resolved', 'closed'];
    return allowedStatuses.includes(s) ? s : 'new';
  };

  const normalizeTicket = useCallback(
    (ticket: RawTicket): NormalizedTicket => ({
      id: ticket.id,
      subject: ticket.subject || ticket.Subject || 'No Subject',
      status: normalizeStatus(ticket.status || ticket.Status),
      created_at: ticket.created_at || ticket.Created || '',
      updated_at: ticket.updated_at || ticket.LastUpdated,
    }),
    []
  );

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
  }, [normalizeTicket]);

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

  const handleClose = (ticketId: number) => {
    setTicketToClose(ticketId);
  };

  const handleCloseCancel = () => {
    setTicketToClose(null);
    setCloseError(null);
  };

  const handleCloseConfirm = async () => {
    if (!ticketToClose) return;

    setClosing(true);
    setCloseError(null);
    try {
      await axios.post(`/help/tickets/${ticketToClose}/close/`);
      setTicketToClose(null);
      fetchTickets();
    } catch (err) {
      setCloseError('Failed to close ticket. Please try again.');
    } finally {
      setClosing(false);
    }
  };

  const columns = [
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: string) => (
        <Typography.Text
          type={isResolved(status) ? 'secondary' : 'success'}
          strong={!isResolved(status)}
        >
          {status}
        </Typography.Text>
      ),
    },
    {
      title: 'Ticket ID / Subject',
      dataIndex: 'subject',
      key: 'subject',
      render: (_: unknown, record: NormalizedTicket) => (
        <a href={`/help/tickets/${record.id}`}>
          {record.id} / {record.subject}
        </a>
      ),
    },
    {
      title: 'Last Updated',
      dataIndex: 'updated_at',
      key: 'updated_at',
      width: 180,
      render: (date: string | undefined, record: NormalizedTicket) =>
        formatDate(date ?? record.created_at),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 160,
      render: (_: unknown, record: NormalizedTicket) => {
        const resolved = isResolved(record.status);
        return (
          <Space>
            <Button
              type="default"
              icon={<CommentOutlined />}
              href={`/help/tickets/${record.id}/reply`}
              size="small"
            >
              Reply
            </Button>
            {!resolved && (
              <Button
                danger
                icon={<CloseOutlined />}
                size="small"
                onClick={() => handleClose(record.id)}
              >
                Close
              </Button>
            )}
          </Space>
        );
      },
    },
  ];

  return (
    <div className={styles.ticketListContainer}>
      <div className={styles.ticketListHeader} style={{ marginBottom: 16 }}>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          href="/help/new-ticket"
          size="middle"
        >
          New Ticket
        </Button>
      </div>

      <div
        className={styles.ticketListControls}
        style={{
          marginBottom: 16,
          display: 'flex',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '8px',
        }}
      >
        <Button onClick={() => setShowResolved((prev) => !prev)}>
          {showResolved ? 'Show only open' : 'Show resolved'}
        </Button>

        <Input.Search
          placeholder="Search tickets"
          allowClear
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          style={{ maxWidth: 300 }}
        />
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 40 }}>
          <Spin size="large" />
        </div>
      ) : error ? (
        <Alert message={error} type="error" showIcon />
      ) : filteredTickets.length === 0 ? (
        <Alert message="No tickets found." type="info" showIcon />
      ) : (
        <div className={styles.ticketListTableWrapper}>
          <Table
            dataSource={filteredTickets}
            columns={columns}
            rowKey="id"
            pagination={false}
            size="middle"
          />
        </div>
      )}

      <Modal
        title={<h2>Confirm Close</h2>}
        width="60%"
        open={ticketToClose !== null}
        destroyOnClose
        footer={null}
        onCancel={handleCloseCancel}
      >
        {closeError && (
          <Alert
            message={closeError}
            type="error"
            showIcon
          />
        )}
        <p style={{ textAlign: 'left', marginTop: '10px' }}>
          Are you sure you want to close this ticket?
        </p>
        <div style={{ marginTop: '20px', textAlign: 'right' }}>
          <Button onClick={handleCloseCancel} disabled={closing}>
            No
          </Button>
          <Button
            type="primary"
            onClick={handleCloseConfirm}
            loading={closing}
            style={{ marginLeft: '8px' }}
          >
            Yes
          </Button>
        </div>
      </Modal>
    </div>
  );
};
