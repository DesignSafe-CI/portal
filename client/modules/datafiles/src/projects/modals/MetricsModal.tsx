import React, { useState, useEffect, useMemo } from 'react';
import {
  Modal,
  Popover,
  Select,
  Spin,
  Table,
  Typography,
  Divider,
  Row,
  Col,
} from 'antd';
import { QuestionCircleOutlined } from '@ant-design/icons';
import {
  useDataciteEvents,
  useDataciteMetrics,
  useClarivateMetrics,
} from '@client/hooks';

const { Option } = Select;
const { Title, Text } = Typography;

/* ---------- Types  ---------- */
interface EventMetrics {
  data: {
    attributes: {
      'relation-type-id': string;
      total: number;
      'occurred-at'?: string;
    };
  }[];
}

interface UsageMetrics {
  data: {
    attributes: {
      citationCount: number;
      downloadCount: number;
      viewCount: number;
      viewsOverTime: { yearMonth: string; total: number }[];
      downloadsOverTime: { yearMonth: string; total: number }[];
    };
  };
}

type NameLike = { first_name?: string; last_name?: string; display_name?: string };

/* ---------- Helpers  ---------- */
const formatLastFirst = (n?: {
  first_name?: string;
  last_name?: string;
  display_name?: string;
}) => {
  if (!n) return '';
  const first = (n.first_name || '').trim();
  const last = (n.last_name || '').trim();
  if (last && first) return `${last}, ${first}`;
  return (n.display_name || '').trim();
};

const formatFirstLast = (n?: {
  first_name?: string;
  last_name?: string;
  display_name?: string;
}) => {
  if (!n) return '';
  const first = (n.first_name || '').trim();
  const last = (n.last_name || '').trim();
  if (first && last) return `${first} ${last}`.trim();
  return (n.display_name || '').trim();
};

const formatAuthorsLine = (names:  NameLike[] = []) => {
  if (!names.length) return '';
  const [first, ...rest] = names;
  const firstFmt = formatLastFirst(first);
  const restFmt = rest.map(formatFirstLast).filter(Boolean);
  const joined = [firstFmt, ...restFmt].filter(Boolean).join(', ');
  return joined ? `${joined}.` : '';
};

const formatCitationLine = (c: any) => {
  const authors = formatAuthorsLine(c?.names || []);

  const title = (c?.titles?.item || '').trim();
  const titlePart = title ? `"${title}."` : '';

  const source = (c?.titles?.source || '').trim();
  const sourcePart = source ? `${source},` : '';

  const vol = (c?.pubinfo?.vol ?? '').toString().trim();
  const volPart = vol ? `vol ${vol},` : '';

  const year = (c?.pubinfo?.pubyear ?? '').toString().trim();
  const yearPart = year ? `${year}.` : '';

  const doi = (c?.doi || '').trim();
  const doiPart = doi ? `DOI: ${doi}` : '';

  return [authors, titlePart, sourcePart, volPart, yearPart, doiPart]
    .filter(Boolean)
    .join(' ')
    .replace(/\s+,/g, ',');
};

/* ---------- Clarivate types for citations ---------- */
type ClarivateName = {
  first_name?: string;
  last_name?: string;
  display_name?: string;
  role?: string;
};
type ClarivateTitles = {
  item?: string;
  source?: string;
  book_subtitle?: string;
  series?: string;
};
type ClarivatePubInfo = {
  pubtype?: string;
  pubyear?: string | number;
  pubmonth?: string;
  vol?: string | number;
  issue?: string | number;
  page?: { begin?: string | number; end?: string | number };
};
type ClarivateCitation = {
  doi?: string;
  titles?: ClarivateTitles;
  names?: ClarivateName[];
  pubinfo?: ClarivatePubInfo;
};

interface YearMonthEntry {
  yearMonth: string;
  total: number;
}

/* --------------------   BODY   -------------------- */
const MetricsModalBody: React.FC<{
  eventMetricsData: EventMetrics;
  usageMetricsData: UsageMetrics;
  clarivateCitations?: ClarivateCitation[];
  clarivateLoading?: boolean;
  clarivateCount?: number;
}> = ({
  eventMetricsData,
  usageMetricsData,
  clarivateCitations = [],
  clarivateLoading,
  clarivateCount,
}) => {
  /* ---------------- Aggregated Usage ---------------- */
  const citationCount =
    typeof clarivateCount === 'number'
      ? clarivateCount
      : clarivateCitations?.length ?? 0;

  const uniqueInvestigations =
    usageMetricsData?.data?.attributes?.viewCount ?? 0;
  const uniqueRequests = usageMetricsData?.data?.attributes?.downloadCount ?? 0;

  const totalRequests =
    (eventMetricsData?.data ?? [])
      .filter(
        (d) =>
          d?.attributes?.['relation-type-id'] ===
          'total-dataset-requests-regular'
      )
      .reduce((sum, d) => sum + (d?.attributes?.total ?? 0), 0) || 0;

  /* ---------------- Data by Quarter ---------------- */
  function calculateQuarterSums(
    yearMonthsData: YearMonthEntry[] = [],
    year: string
  ) {
    const sums = { Q1: 0, Q2: 0, Q3: 0, Q4: 0 };
    yearMonthsData.forEach((m) => {
      const y = m.yearMonth?.substring(0, 4);
      if (y === year) {
        const month = parseInt(m.yearMonth.substring(5, 7), 10);
        const q =
          month <= 3 ? 'Q1' : month <= 6 ? 'Q2' : month <= 9 ? 'Q3' : 'Q4';
        (sums as any)[q] += m.total ?? 0;
      }
    });
    return sums;
  }

  const mostRecentYear = useMemo(() => {
    const viewsOverTime =
      usageMetricsData?.data?.attributes?.viewsOverTime || [];
    const years = Array.from(
      new Set(viewsOverTime.map((v) => v.yearMonth.slice(0, 4)))
    );
    return years.sort((a, b) => b.localeCompare(a))[0] || '';
  }, [usageMetricsData?.data?.attributes?.viewsOverTime]);

  const [selectedYear, setSelectedYear] = useState(mostRecentYear);
  useEffect(() => {
    if (mostRecentYear) setSelectedYear(mostRecentYear);
  }, [mostRecentYear]);

  const viewsByQ = useMemo(
    () =>
      calculateQuarterSums(
        usageMetricsData?.data?.attributes?.viewsOverTime || [],
        selectedYear
      ),
    [usageMetricsData?.data?.attributes?.viewsOverTime, selectedYear]
  );
  const downloadsByQ = useMemo(
    () =>
      calculateQuarterSums(
        usageMetricsData?.data?.attributes?.downloadsOverTime || [],
        selectedYear
      ),
    [usageMetricsData?.data?.attributes?.downloadsOverTime, selectedYear]
  );
  const totalsByQ = useMemo(() => {
    return (eventMetricsData?.data ?? []).reduce(
      (acc, curr) => {
        const rel = curr?.attributes?.['relation-type-id'];
        const occurredAt = curr?.attributes?.['occurred-at'];
        if (rel === 'total-dataset-requests-regular' && occurredAt) {
          const [y, m] = occurredAt.split('-');
          if (y === selectedYear) {
            const q = `Q${Math.ceil(parseInt(m, 10) / 3)}` as
              | 'Q1'
              | 'Q2'
              | 'Q3'
              | 'Q4';
            acc[q] = (acc[q] || 0) + (curr?.attributes?.total ?? 0);
          }
        }
        return acc;
      },
      { Q1: 0, Q2: 0, Q3: 0, Q4: 0 } as Record<
        'Q1' | 'Q2' | 'Q3' | 'Q4',
        number
      >
    );
  }, [eventMetricsData, selectedYear]);

  const quartersData = [
    {
      key: 'Q1',
      quarters: 'Jan-Mar',
      uniqueInvestigations: viewsByQ.Q1 || '--',
      uniqueRequests: downloadsByQ.Q1 || '--',
      totalRequests: totalsByQ.Q1 || '--',
    },
    {
      key: 'Q2',
      quarters: 'Apr-Jun',
      uniqueInvestigations: viewsByQ.Q2 || '--',
      uniqueRequests: downloadsByQ.Q2 || '--',
      totalRequests: totalsByQ.Q2 || '--',
    },
    {
      key: 'Q3',
      quarters: 'Jul-Sep',
      uniqueInvestigations: viewsByQ.Q3 || '--',
      uniqueRequests: downloadsByQ.Q3 || '--',
      totalRequests: totalsByQ.Q3 || '--',
    },
    {
      key: 'Q4',
      quarters: 'Oct-Dec',
      uniqueInvestigations: viewsByQ.Q4 || '--',
      uniqueRequests: downloadsByQ.Q4 || '--',
      totalRequests: totalsByQ.Q4 || '--',
    },
  ];

  const yearsSelect = useMemo(() => {
    const viewsOverTime =
      usageMetricsData?.data?.attributes?.viewsOverTime || [];
    const uniqueYears = Array.from(
      new Set(viewsOverTime.map((v) => v.yearMonth.slice(0, 4)))
    );
    return uniqueYears.sort().map((y) => (
      <Option key={y} value={y}>
        {y}
      </Option>
    ));
  }, [usageMetricsData?.data?.attributes?.viewsOverTime]);

  const quartersColumns = [
    {
      title: (
        <Select
          value={selectedYear}
          onChange={setSelectedYear}
          style={{ width: 120 }}
          aria-label="Select year for quarterly metrics"
        >
          {yearsSelect}
        </Select>
      ),
      key: 'year',
      dataIndex: '__yearSelector',
      render: () => null,
      width: 140,
    },
    {
      title: 'Quarter',
      dataIndex: 'quarters',
      key: 'quarters',
      width: 140,
    },
    {
      title: (
        <>
          Unique
          <br />
          Investigations
        </>
      ),
      dataIndex: 'uniqueInvestigations',
      key: 'uniqueInvestigations',
    },
    {
      title: (
        <>
          Unique
          <br />
          Requests
        </>
      ),
      dataIndex: 'uniqueRequests',
      key: 'uniqueRequests',
    },
    {
      title: (
        <>
          Total
          <br />
          Requests
        </>
      ),
      dataIndex: 'totalRequests',
      key: 'totalRequests',
    },
  ];

  /* ---------------- Citations list (Clarivate) ---------------- */
  return (
    <div>
      <Title level={5} style={{ marginBottom: 8 }}>
        Aggregated Usage
      </Title>
      <Row gutter={[16, 16]}>
        <Col xs={24} md={8}>
          <div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'baseline' }}>
              <span style={{ fontWeight: 600 }}>Unique Investigations</span>
              <span style={{ fontSize: 'inherit', fontWeight: 700 }}>
                {uniqueInvestigations ?? 0}
              </span>
            </div>
            <div style={{ marginTop: 4 }}>
              <span style={{ fontSize: 12, fontStyle: 'italic' }}>(views)</span>{' '}
              <Popover
                overlayStyle={{ maxWidth: 420 }}
                title="Unique Investigations (Views)"
                content="One-hour sessions in which a user viewed metadata or previewed/downloaded/copied files associated with this DOI."
              >
                <QuestionCircleOutlined style={{ color: '#5883b2' }} />
              </Popover>
            </div>
          </div>
        </Col>
        <Col xs={24} md={8}>
          <div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'baseline' }}>
              <span style={{ fontWeight: 600 }}>Unique Requests</span>
              <span style={{ fontSize: 'inherit', fontWeight: 700 }}>
                {uniqueRequests ?? 0}
              </span>
            </div>
            <div style={{ marginTop: 4 }}>
              <span style={{ fontSize: 12, fontStyle: 'italic' }}>
                (downloads)
              </span>{' '}
              <Popover
                overlayStyle={{ maxWidth: 420 }}
                title="Unique Requests (Downloads)"
                content="One-hour sessions in which a user previewed/downloaded/copied files associated with this DOI."
              >
                <QuestionCircleOutlined style={{ color: '#5883b2' }} />
              </Popover>
            </div>
          </div>
        </Col>
        <Col xs={24} md={8}>
          <div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'baseline' }}>
              <span style={{ fontWeight: 600 }}>Total Requests</span>
              <span style={{ fontSize: 'inherit', fontWeight: 700 }}>
                {totalRequests ?? 0}
              </span>
            </div>
            <div style={{ marginTop: 4 }}>
              <Popover
                overlayStyle={{ maxWidth: 420 }}
                title="Total Requests"
                content="All downloads, previews, and copies of files plus Project Downloads."
              >
                <QuestionCircleOutlined
                  style={{ color: '#5883b2' }}
                  aria-label="About Total Requests"
                />
              </Popover>
            </div>
          </div>
        </Col>
      </Row>

      <Divider style={{ margin: '16px 0' }} />

      <Title level={5} style={{ marginBottom: 8 }}>
        Data by Quarter
      </Title>
      <Table
        dataSource={quartersData}
        columns={quartersColumns}
        pagination={false}
        size="small"
      />

      <div style={{ marginTop: 12, textAlign: 'center' }}>
        <Text style={{ display: 'block', marginTop: 4, fontStyle: 'italic' }}>
          Metrics recorded since January 2022.
        </Text>
        <Text>
          These metrics are presented according to the{' '}
          <a
            href="https://makedatacount.org/"
            target="_blank"
            rel="noopener noreferrer"
          >
            Make Data Count
          </a>{' '}
          standard.
        </Text>
      </div>

      <Divider style={{ margin: '16px 0' }} />

      <Title level={5} style={{ marginBottom: 8 }}>
        {citationCount} {citationCount === 1 ? 'Citation' : 'Citations'}
      </Title>

      {clarivateLoading ? (
        <Spin />
      ) : (clarivateCitations?.length ?? 0) > 0 ? (
        <div style={{ maxHeight: 400, overflowY: 'auto', paddingRight: 8 }}>
          <ol style={{ paddingLeft: 18, marginBottom: 0 }}>
            {clarivateCitations.map((c, idx) => (
              <li
                key={c?.doi || idx}
                style={{ marginBottom: 8, lineHeight: 1.4 }}
              >
                {formatCitationLine(c)}
              </li>
            ))}
          </ol>
        </div>
      ) : (
        <Text type="secondary">No citations found.</Text>
      )}
    </div>
  );
};

/* ----------------   MODAL (fetch data + render body)   ---------------- */

export const MetricsModal: React.FC<{
  doi: string;
  isOpen: boolean;
  handleCancel: () => void;
}> = ({ doi, isOpen, handleCancel }) => {
  const { data: dataciteMetrics } = useDataciteMetrics(doi, isOpen);
  const { data: dataciteEvents } = useDataciteEvents(doi, isOpen);
  const { data: clarivateMetrics, isLoading: clarivateLoading } =
    useClarivateMetrics(doi, isOpen, { includeRecords: true });

  const latestYearMonth = useMemo(() => {
    const views = dataciteMetrics?.data?.attributes?.viewsOverTime || [];
    if (views.length === 0) return '';
    const mostRecent = [...views].sort((a, b) =>
      b.yearMonth.localeCompare(a.yearMonth)
    )[0].yearMonth;
    const [y, m] = mostRecent.split('-');
    return `${m}/${y}`;
  }, [dataciteMetrics]);

  const title = `Dataset Metrics${
    latestYearMonth ? ` - Updated ${latestYearMonth}` : ''
  }`;

  const ready = Boolean(dataciteEvents?.data && dataciteMetrics?.data);

  return (
    <Modal
      title={title}
      open={isOpen}
      onCancel={handleCancel}
      footer={null}
      width={800}
      styles={{ body: { maxHeight: 550, overflowY: 'auto' } }}
    >
      {ready ? (
        <MetricsModalBody
          eventMetricsData={dataciteEvents as EventMetrics}
          usageMetricsData={dataciteMetrics as UsageMetrics}
          clarivateCitations={
            clarivateMetrics?.citations as ClarivateCitation[] | undefined
          }
          clarivateLoading={clarivateLoading}
          clarivateCount={clarivateMetrics?.citationCount ?? 0}
        />
      ) : (
        <div
          style={{ display: 'flex', marginTop: 10, justifyContent: 'center' }}
        >
          <Spin />
        </div>
      )}
    </Modal>
  );
};
