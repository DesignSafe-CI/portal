import React, { useState, useEffect, useMemo } from 'react';
import { Modal, Popover, Select, Spin, Table } from 'antd';
import { QuestionCircleOutlined } from '@ant-design/icons';
import { useDataciteEvents, useDataciteMetrics } from '@client/hooks';
const { Option } = Select;

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

interface DataEntryAttributes {
  'relation-type-id': string;
  total: number;
  'occurred-at'?: string;
}

interface DataEntryA {
  attributes: DataEntryAttributes;
}

interface MetricsModalProps {
  eventMetricsData: EventMetrics;
  usageMetricsData: UsageMetrics;
}

interface YearMonthEntry {
  yearMonth: string;
  total: number;
}

export const MetricsModalBody: React.FC<MetricsModalProps> = ({
  eventMetricsData,
  usageMetricsData,
}) => {
  interface DataEntry {
    attributes: {
      'relation-type-id': string;
      total: number;
    };
  }

  // Table 1: Aggregated Usage
  const uniqueInvestigations =
    usageMetricsData?.data?.attributes?.viewCount ?? 0;
  const uniqueRequests = usageMetricsData?.data?.attributes?.downloadCount ?? 0;

  const sumTotals = (data: DataEntry[] = [], relationTypeId: string) => {
    return data
      .filter(
        (entry) => entry?.attributes?.['relation-type-id'] === relationTypeId
      )
      .reduce((sum, entry) => sum + (entry?.attributes?.total ?? 0), 0);
  };
  const totalRequests =
    sumTotals(eventMetricsData?.data ?? [], 'total-dataset-requests-regular') ||
    0;

  const dataSource = [
    {
      key: '1',
      usage: (
        <span>
          Unique Investigations{' '}
          <span style={{ fontSize: '80%', fontStyle: 'italic' }}>(views) </span>
          <Popover
            overlayStyle={{ maxWidth: '400px' }}
            title="Unique Investigations (Views)"
            content="Refers to the number of one-hour sessions during which a user viewed 
                      metadata or previewed/downloaded/copied files associated with this DOI."
          >
            <QuestionCircleOutlined style={{ color: 'rgba(0, 0, 0, 0.45)' }} />
          </Popover>
        </span>
      ),
      data: uniqueInvestigations > 0 ? uniqueInvestigations : 0,
    },
    {
      key: '2',
      usage: (
        <span>
          Unique Requests{' '}
          <span style={{ fontSize: '80%', fontStyle: 'italic' }}>
            (downloads){' '}
          </span>
          <Popover
            overlayStyle={{ maxWidth: '400px' }}
            title="Unique Requests (Downloads)"
            content="Refers to the number of one-hour sessions during which a user previewed/downloaded/copied files associated with this DOI."
          >
            <QuestionCircleOutlined style={{ color: 'rgba(0, 0, 0, 0.45)' }} />
          </Popover>
        </span>
      ),
      data: uniqueRequests > 0 ? uniqueRequests : 0,
    },
    {
      key: '3',
      usage: (
        <span>
          Total Requests{' '}
          <Popover
            overlayStyle={{ maxWidth: '400px' }}
            title="Total Requests"
            content="All downloads, previews, and copies of files plus Project Downloads."
          >
            <QuestionCircleOutlined style={{ color: 'rgba(0, 0, 0, 0.45)' }} />
          </Popover>
        </span>
      ),
      data: totalRequests > 0 ? totalRequests : 0,
    },
  ];

  const columns = [
    {
      title: 'Aggregated Usage',
      dataIndex: 'usage',
      key: 'usage',
    },
    {
      title: '',
      dataIndex: 'data',
      key: 'data',
    },
  ];

  // Table 2: Quarters Data
  function calculateQuarterSums(
    yearMonthsData: YearMonthEntry[],
    year: string
  ): { [key: string]: number } {
    const sumsByQuarter: { [key: string]: number } = {
      Q1: 0,
      Q2: 0,
      Q3: 0,
      Q4: 0,
    };

    yearMonthsData.forEach((month) => {
      const monthYear = month.yearMonth.substring(0, 4);
      if (monthYear === year) {
        const monthNumber = parseInt(month.yearMonth.substring(5, 7), 10);
        if (monthNumber >= 1 && monthNumber <= 3) {
          sumsByQuarter.Q1 += month.total;
        } else if (monthNumber >= 4 && monthNumber <= 6) {
          sumsByQuarter.Q2 += month.total;
        } else if (monthNumber >= 7 && monthNumber <= 9) {
          sumsByQuarter.Q3 += month.total;
        } else if (monthNumber >= 10 && monthNumber <= 12) {
          sumsByQuarter.Q4 += month.total;
        }
      }
    });

    return sumsByQuarter;
  }

  const mostRecentYear = useMemo(() => {
    const viewsOverTime = usageMetricsData?.data?.attributes?.viewsOverTime;

    if (!viewsOverTime || viewsOverTime.length === 0) {
      return null; // Handle cases where viewsOverTime is undefined or empty
    }

    const orderedYears = viewsOverTime
      .map((entry) => entry.yearMonth.split('-')[0]) // Get only the years
      .filter((year, index, array) => array.indexOf(year) === index) // Unique years
      .sort((a, b) => b.localeCompare(a)); // Sort descending

    return orderedYears.length > 0 ? orderedYears[0] : null; // Return the most recent year
  }, [usageMetricsData?.data?.attributes?.viewsOverTime]);

  const defaultYear = mostRecentYear || '';

  const [selectedYear, setSelectedYear] = useState(defaultYear);

  useEffect(() => {
    if (defaultYear) {
      setSelectedYear(defaultYear);
    }
  }, [defaultYear]);

  const [quarterSums, setQuarterSums] = useState<{
    views: { [key: string]: number };
    downloads: { [key: string]: number };
    totals: { [key: string]: number };
  }>({
    views: { Q1: 0, Q2: 0, Q3: 0, Q4: 0 },
    downloads: { Q1: 0, Q2: 0, Q3: 0, Q4: 0 },
    totals: { Q1: 0, Q2: 0, Q3: 0, Q4: 0 },
  });

  const processTotalRequests = (
    eventMetricsData: EventMetrics,
    year: string
  ) => {
    return (eventMetricsData?.data ?? []).reduce(
      (acc: { [key: string]: number }, curr: DataEntryA) => {
        const occurredAt = curr?.attributes?.['occurred-at'];
        if (
          curr?.attributes?.['relation-type-id'] ===
            'total-dataset-requests-regular' &&
          occurredAt
        ) {
          const [occurredYear, occurredMonth] = occurredAt.split('-');
          if (occurredYear === year) {
            const quarter = `Q${Math.ceil(parseInt(occurredMonth) / 3)}`;
            acc[quarter] = (acc[quarter] || 0) + (curr?.attributes?.total ?? 0);
          }
        }
        return acc;
      },
      { Q1: 0, Q2: 0, Q3: 0, Q4: 0 }
    );
  };

  useEffect(() => {
    if (selectedYear) {
      const views = calculateQuarterSums(
        usageMetricsData?.data?.attributes?.viewsOverTime ?? [],
        selectedYear
      );
      const downloads = calculateQuarterSums(
        usageMetricsData?.data?.attributes?.downloadsOverTime ?? [],
        selectedYear
      );
      const totals = processTotalRequests(eventMetricsData, selectedYear);
      setQuarterSums({ views, downloads, totals });
    }
  }, [selectedYear, eventMetricsData, usageMetricsData?.data?.attributes]);

  const handleYearChange = (value: string) => {
    setSelectedYear(value);

    const viewsByQuarter = calculateQuarterSums(
      usageMetricsData?.data?.attributes?.viewsOverTime ?? [],
      value
    );
    const downloadsByQuarter = calculateQuarterSums(
      usageMetricsData?.data?.attributes?.downloadsOverTime ?? [],
      value
    );
    const totalRequestsQuarterlySums = processTotalRequests(
      eventMetricsData,
      defaultYear || ''
    );

    setQuarterSums({
      views: viewsByQuarter,
      downloads: downloadsByQuarter,
      totals: totalRequestsQuarterlySums,
    });
  };

  const years = useMemo(() => {
    const viewsOverTime =
      usageMetricsData?.data?.attributes?.viewsOverTime ?? [];
    if (viewsOverTime.length > 0) {
      const uniqueYears = new Set(
        viewsOverTime.map((item) => item?.yearMonth?.substring(0, 4))
      );
      return Array.from(uniqueYears).map((year) => (
        <Option key={year} value={year}>
          {year}
        </Option>
      ));
    }
    return [];
  }, [usageMetricsData?.data?.attributes?.viewsOverTime]);

  const quartersData = [
    {
      key: '1',
      quarters: 'Jan-Mar',
      uniqueInvestigations:
        quarterSums?.views?.Q1 > 0 ? quarterSums.views.Q1 : '--',
      uniqueRequests:
        quarterSums?.downloads?.Q1 > 0 ? quarterSums.downloads.Q1 : '--',
      totalRequests: quarterSums?.totals?.Q1 > 0 ? quarterSums.totals.Q1 : '--',
    },
    {
      key: '2',
      quarters: 'Apr-Jun',
      uniqueInvestigations:
        quarterSums?.views?.Q2 > 0 ? quarterSums.views.Q2 : '--',
      uniqueRequests:
        quarterSums?.downloads?.Q2 > 0 ? quarterSums.downloads.Q2 : '--',
      totalRequests: quarterSums?.totals?.Q2 > 0 ? quarterSums.totals.Q2 : '--',
    },
    {
      key: '3',
      quarters: 'Jul-Sep',
      uniqueInvestigations:
        quarterSums?.views?.Q3 > 0 ? quarterSums.views.Q3 : '--',
      uniqueRequests:
        quarterSums?.downloads?.Q3 > 0 ? quarterSums.downloads.Q3 : '--',
      totalRequests: quarterSums?.totals?.Q3 > 0 ? quarterSums.totals.Q3 : '--',
    },
    {
      key: '4',
      quarters: 'Oct-Dec',
      uniqueInvestigations:
        quarterSums?.views?.Q4 > 0 ? quarterSums.views.Q4 : '--',
      uniqueRequests:
        quarterSums?.downloads?.Q4 > 0 ? quarterSums.downloads.Q4 : '--',
      totalRequests: quarterSums?.totals?.Q4 > 0 ? quarterSums.totals.Q4 : '--',
    },
  ];

  const quartersColumns = [
    {
      title: (
        <span style={{ display: 'flex', alignItems: 'center' }}>
          Quarter
          <Select
            value={selectedYear}
            onChange={handleYearChange}
            style={{ marginLeft: 8, width: 80 }}
          >
            {years}
          </Select>
        </span>
      ),
      dataIndex: 'quarters',
      key: 'quarters',
    },
    {
      title: 'Unique Investigations',
      dataIndex: 'uniqueInvestigations',
      key: 'uniqueInvestigations',
    },
    {
      title: 'Unique Requests',
      dataIndex: 'uniqueRequests',
      key: 'uniqueRequests',
    },
    {
      title: 'Total Requests',
      dataIndex: 'totalRequests',
      key: 'totalRequests',
    },
  ];

  return (
    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
      <div style={{ width: '40%', marginRight: '20px' }}>
        <Table dataSource={dataSource} columns={columns} pagination={false} />
      </div>
      <div>
        <Table
          dataSource={quartersData}
          columns={quartersColumns}
          pagination={false}
        />
      </div>
    </div>
  );
};

export const MetricsModal: React.FC<{
  doi: string;
  isOpen: boolean;
  handleCancel: () => void;
}> = ({ doi, isOpen, handleCancel }) => {
  const { data: dataciteMetrics } = useDataciteMetrics(doi, isOpen);
  const { data: dataciteEvents } = useDataciteEvents(doi, isOpen);

  const latestYearMonth = useMemo(() => {
    const views = dataciteMetrics?.data.attributes.viewsOverTime;
    if (views && views.length > 0) {
      const sortedViews = views.sort((a, b) =>
        b.yearMonth.localeCompare(a.yearMonth)
      );
      const mostRecentDate = sortedViews[0].yearMonth;
      const [year, month] = mostRecentDate.split('-');
      return `${month}/${year}`;
    }
    return null;
  }, [dataciteMetrics]);

  const title = `Dataset Metrics${
    latestYearMonth ? ` [Updated ${latestYearMonth}]` : ''
  }`;

  return (
    <Modal
      title={title}
      open={isOpen}
      onCancel={handleCancel}
      footer={
        <div style={{ textAlign: 'center' }}>
          <p
            style={{
              display: 'inline-block',
              backgroundColor: '#f0f0f0',
              padding: '8px',
            }}
          >
            These metrics are presented according to the{' '}
            <a
              href="https://makedatacount.org/"
              target="_blank"
              rel="noopener noreferrer"
            >
              Make Data Count
            </a>{' '}
            standard.
          </p>
          <p style={{ fontStyle: 'italic' }}>
            Metrics recorded since January 2022.
          </p>
        </div>
      }
      width={800}
    >
      {dataciteEvents?.data && dataciteMetrics?.data ? (
        <MetricsModalBody
          eventMetricsData={dataciteEvents}
          usageMetricsData={dataciteMetrics}
        />
      ) : (
        <div
          style={{
            display: 'flex',
            marginTop: '10px',
            justifyContent: 'center',
          }}
        >
          <Spin />
        </div>
      )}
    </Modal>
  );
};
