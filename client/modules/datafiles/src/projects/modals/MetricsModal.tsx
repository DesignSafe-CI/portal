import React, { useState, useEffect } from 'react';
import { Modal, Popover, Select, Table } from 'antd';
import { InfoCircleOutlined } from '@ant-design/icons';
const { Option } = Select;

export const MetricsModal: React.FC<{
  isOpen: boolean;
  handleCancel: () => void;
  data1: {
    data: { attributes: { 'relation-type-id': string; total: number } }[];
    meta: {
      total: number;
      occurred: { id: string; title: string; count: number }[];
      'relation-types': {
        id: string;
        title: string;
        count: number;
        'year-months': { id: string; title: string; sum: number }[];
      }[];
    };
  };
}> = ({ isOpen, handleCancel, data1 }) => {
  interface DataEntry {
    attributes: {
      'relation-type-id': string;
      total: number;
    };
  }

  // Table 1: Usage Breakdown
  const uniqueInvestigations = data1.data.filter(
    (entry: DataEntry) =>
      entry.attributes['relation-type-id'] ===
      'unique-dataset-investigations-regular'
  );
  const uniqueRequests = data1.data.filter(
    (entry: DataEntry) =>
      entry.attributes['relation-type-id'] === 'unique-dataset-requests-regular'
  );
  const totalRequests = data1.data.filter(
    (entry: DataEntry) =>
      entry.attributes['relation-type-id'] === 'total-dataset-requests-regular'
  );

  const dataSource = [
    {
      key: '1',
      usage: (
        <span>
          Unique Investigations{' '}
          <span style={{ fontSize: '80%', fontStyle: 'italic' }}>(views)</span>
          <Popover
            overlayStyle={{ maxWidth: '400px' }}
            title="Unique Investigations (Views)"
            content="Refers to the number of one-hour sessions during which a user viewed 
              metadata or previewed/downloaded/copied files associated with this DOI."
            placement="right"
          >
            <InfoCircleOutlined style={{ marginLeft: 8 }} />
          </Popover>
        </span>
      ),
      data:
        uniqueInvestigations.length > 0
          ? uniqueInvestigations[0].attributes.total
          : '--',
    },
    {
      key: '2',
      usage: (
        <span>
          Unique Requests{' '}
          <span style={{ fontSize: '80%', fontStyle: 'italic' }}>
            (downloads)
          </span>
          <Popover
            overlayStyle={{ maxWidth: '400px' }}
            title="Unique Requests (Downloads)"
            content="Refers to the number of one-hour sessions during which a user 
                      previewed/downloaded/copied files associated with this DOI."
          >
            <InfoCircleOutlined style={{ marginLeft: 8 }} />
          </Popover>
        </span>
      ),
      data:
        uniqueRequests.length > 0 ? uniqueRequests[0].attributes.total : '--',
    },
    {
      key: '3',
      usage: (
        <span>
          Dataset Total Requests
          <Popover
            overlayStyle={{ maxWidth: '400px' }}
            title="Dataset Total Requests"
            content="All downloads, previews, and copies of files plus Project Downloads."
          >
            <InfoCircleOutlined style={{ marginLeft: 8 }} />
          </Popover>
        </span>
      ),
      data: totalRequests.length > 0 ? totalRequests[0].attributes.total : '--',
    },
  ];

  const columns = [
    {
      title: 'Usage Breakdown',
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
  // Function to calculate quarter sums for a specific relation type
  function calculateQuarterSums(
    relationTypeId: string,
    yearMonthsData: any[],
    year: string
  ): { [key: string]: number } {
    const sumsByQuarter: { [key: string]: number } = {
      Q1: 0,
      Q2: 0,
      Q3: 0,
      Q4: 0,
    };

    yearMonthsData.forEach((month) => {
      const monthYear = month.id.substr(0, 4);
      if (monthYear === year) {
        const monthNumber = parseInt(month.id.substr(5, 2), 10);
        if (monthNumber >= 1 && monthNumber <= 3) {
          sumsByQuarter.Q1 += month.sum;
        } else if (monthNumber >= 4 && monthNumber <= 6) {
          sumsByQuarter.Q2 += month.sum;
        } else if (monthNumber >= 7 && monthNumber <= 9) {
          sumsByQuarter.Q3 += month.sum;
        } else if (monthNumber >= 10 && monthNumber <= 12) {
          sumsByQuarter.Q4 += month.sum;
        }
      }
    });

    return sumsByQuarter;
  }

  const [selectedYear, setSelectedYear] = useState<string | undefined>(
    undefined
  );

  const [quarterSums, setQuarterSums] = useState<{
    [key: string]: number | { [key: string]: number };
  }>(() => {
    const defaultYear =
      data1.meta.occurred.length > 0 ? data1.meta.occurred[0].id : undefined;
    const defaultSums: { [key: string]: number | { [key: string]: number } } = {
      Q1: 0,
      Q2: 0,
      Q3: 0,
      Q4: 0,
    };

    if (defaultYear) {
      data1.meta['relation-types'].forEach((relationType) => {
        const yearMonthsData = relationType?.['year-months'];
        if (yearMonthsData) {
          const sumsByQuarter = calculateQuarterSums(
            relationType.id,
            yearMonthsData,
            defaultYear
          );
          defaultSums[relationType.id] = sumsByQuarter;
        }
      });
    }

    return defaultSums;
  });

  useEffect(() => {
    // Set selectedYear to the most recent year from the data
    if (data1.meta.occurred.length > 0) {
      setSelectedYear(data1.meta.occurred[0].id);
    }
  }, [data1.meta.occurred]);

  const handleYearChange = (value: string) => {
    setSelectedYear(value);

    const sumsByQuarter: { [key: string]: number | { [key: string]: number } } =
      {};

    data1.meta['relation-types'].forEach((relationType) => {
      const yearMonthsData = relationType?.['year-months'];
      if (yearMonthsData) {
        const sums = calculateQuarterSums(
          relationType.id,
          yearMonthsData,
          value
        );
        sumsByQuarter[relationType.id] = sums;
      }
    });

    setQuarterSums(sumsByQuarter);
  };

  const years = data1.meta.occurred.map((item) => (
    <Option key={item.id} value={item.id}>
      {item.id}
    </Option>
  ));

  const quartersData = [
    {
      key: '1',
      quarters: 'Jan-Mar',
      uniqueInvestigations:
        (
          quarterSums['unique-dataset-investigations-regular'] as {
            [key: string]: number;
          }
        ).Q1 !== undefined
          ? (
              quarterSums['unique-dataset-investigations-regular'] as {
                [key: string]: number;
              }
            ).Q1
          : '--',
      uniqueRequests:
        (
          quarterSums['unique-dataset-requests-regular'] as {
            [key: string]: number;
          }
        ).Q1 !== undefined
          ? (
              quarterSums['unique-dataset-requests-regular'] as {
                [key: string]: number;
              }
            ).Q1
          : '--',
      totalRequests:
        (
          quarterSums['total-dataset-requests-regular'] as {
            [key: string]: number;
          }
        ).Q1 !== undefined
          ? (
              quarterSums['total-dataset-requests-regular'] as {
                [key: string]: number;
              }
            ).Q1
          : '--',
    },
    {
      key: '2',
      quarters: 'Apr-Jul',
      uniqueInvestigations:
        (
          quarterSums['unique-dataset-investigations-regular'] as {
            [key: string]: number;
          }
        ).Q2 !== undefined
          ? (
              quarterSums['unique-dataset-investigations-regular'] as {
                [key: string]: number;
              }
            ).Q2
          : '--',
      uniqueRequests:
        (
          quarterSums['unique-dataset-requests-regular'] as {
            [key: string]: number;
          }
        ).Q2 !== undefined
          ? (
              quarterSums['unique-dataset-requests-regular'] as {
                [key: string]: number;
              }
            ).Q2
          : '--',
      totalRequests:
        (
          quarterSums['total-dataset-requests-regular'] as {
            [key: string]: number;
          }
        ).Q2 !== undefined
          ? (
              quarterSums['total-dataset-requests-regular'] as {
                [key: string]: number;
              }
            ).Q2
          : '--',
    },
    {
      key: '3',
      quarters: 'Aug-Oct',
      uniqueInvestigations:
        (
          quarterSums['unique-dataset-investigations-regular'] as {
            [key: string]: number;
          }
        ).Q3 !== undefined
          ? (
              quarterSums['unique-dataset-investigations-regular'] as {
                [key: string]: number;
              }
            ).Q3
          : '--',
      uniqueRequests:
        (
          quarterSums['unique-dataset-requests-regular'] as {
            [key: string]: number;
          }
        ).Q3 !== undefined
          ? (
              quarterSums['unique-dataset-requests-regular'] as {
                [key: string]: number;
              }
            ).Q3
          : '--',
      totalRequests:
        (
          quarterSums['total-dataset-requests-regular'] as {
            [key: string]: number;
          }
        ).Q3 !== undefined
          ? (
              quarterSums['total-dataset-requests-regular'] as {
                [key: string]: number;
              }
            ).Q3
          : '--',
    },
    {
      key: '4',
      quarters: 'Nov-Dec',
      uniqueInvestigations:
        (
          quarterSums['unique-dataset-investigations-regular'] as {
            [key: string]: number;
          }
        ).Q4 !== undefined
          ? (
              quarterSums['unique-dataset-investigations-regular'] as {
                [key: string]: number;
              }
            ).Q4
          : '--',
      uniqueRequests:
        (
          quarterSums['unique-dataset-requests-regular'] as {
            [key: string]: number;
          }
        ).Q4 !== undefined
          ? (
              quarterSums['unique-dataset-requests-regular'] as {
                [key: string]: number;
              }
            ).Q4
          : '--',
      totalRequests:
        (
          quarterSums['total-dataset-requests-regular'] as {
            [key: string]: number;
          }
        ).Q4 !== undefined
          ? (
              quarterSums['total-dataset-requests-regular'] as {
                [key: string]: number;
              }
            ).Q4
          : '--',
    },
  ];

  const quartersColumns = [
    {
      title: (
        <span>
          Quarters
          <Select
            value={selectedYear}
            onChange={handleYearChange}
            style={{ marginLeft: 8, width: 120 }}
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
    <Modal
      title="Dataset Metrics"
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
      {/* Content of the modal */}
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <div style={{ width: '40%', marginRight: '20px' }}>
          {' '}
          {/* Adjust the width as needed */}
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
    </Modal>
  );
};
