import React, { useState, useEffect, useMemo } from 'react';
import { Modal, Popover, Select, Table } from 'antd';
import { QuestionCircleOutlined } from '@ant-design/icons';
const { Option } = Select;

export const MetricsModal: React.FC<{
    isOpen: boolean;
    handleCancel: () => void;
    data1: { 
      data: { attributes: { 'relation-type-id': string; total: number } }[];
      
     }; 
     data2: {
      data: {
        attributes: {
          viewsOverTime: {
            yearMonth: string;
            total: number;
          }[];
          downloadsOverTime: {
            yearMonth: string;
            total: number;
          }[];
          citationsOverTime: {
            yearMonth: string;
            total: number;
          }[];
        }
      };
    };
    

  }> = ({ isOpen, handleCancel, data1, data2 }) => {
    interface DataEntry {
      attributes: {
        'relation-type-id': string;
        total: number;
      };
    }

    const latestYearMonth = useMemo(() => {
      const views = data2.data.attributes.viewsOverTime;
      if (views && views.length > 0) {
        const sortedViews = views.sort((a, b) => b.yearMonth.localeCompare(a.yearMonth));
        const mostRecentDate = sortedViews[0].yearMonth;
        const [year, month] = mostRecentDate.split('-');
        return `${month}/${year}`;
      }
      return null;
    }, [data2.data.attributes.viewsOverTime]);

    const title = `Dataset Metrics${latestYearMonth ? ` [Updated ${latestYearMonth}]` : ''}`;

    // Table 1: Usage Breakdown
    const uniqueInvestigations = data1.data.filter((entry: DataEntry) => entry.attributes["relation-type-id"] === 'unique-dataset-investigations-regular');
    const uniqueRequests = data1.data.filter((entry: DataEntry) => entry.attributes["relation-type-id"] === 'unique-dataset-requests-regular');
    const totalRequests = data1.data.filter((entry: DataEntry) => entry.attributes["relation-type-id"] === 'total-dataset-requests-regular');

    const dataSource = [
      {
        key: '1',
        usage: (
          <span> 
            Unique Investigations{' '}
            <span style={{ fontSize: '80%', fontStyle: 'italic' }}>(views) </span>
            <Popover overlayStyle={{ maxWidth: '400px' }} title= "Unique Investigations (Views)" 
                      content="Refers to the number of one-hour sessions during which a user viewed 
                      metadata or previewed/downloaded/copied files associated with this DOI." >
              <QuestionCircleOutlined style={{ color: 'rgba(0, 0, 0, 0.45)' }} />
            </Popover>
          </span>
        ),
        data: uniqueInvestigations.length > 0 ? uniqueInvestigations[0].attributes.total : '--',
      },
      {
        key: '2',
        usage: (
          <span>
            Unique Requests{' '}
            <span style={{ fontSize: '80%', fontStyle: 'italic' }}>(downloads) </span>
            <Popover overlayStyle={{ maxWidth: '400px' }} title= "Unique Requests (Downloads)" 
                      content="Refers to the number of one-hour sessions during which a user   previewed/downloaded/copied files associated with this DOI." >
              <QuestionCircleOutlined style={{ color: 'rgba(0, 0, 0, 0.45)' }} />
            </Popover>
          </span>
        ),
        data: uniqueRequests.length > 0 ? uniqueRequests[0].attributes.total : '--',
      },
      {
        key: '3',
        usage: (
          <span>
            Dataset Total Requests {' '}
            <Popover overlayStyle={{ maxWidth: '400px' }} title= "Dataset Total Requests" 
                      content="All downloads, previews, and copies of files plus Project Downloads." >
              <QuestionCircleOutlined style={{ color: 'rgba(0, 0, 0, 0.45)' }} />
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
    function calculateQuarterSums(yearMonthsData: any[], year: string): { [key: string]: number } {
      const sumsByQuarter: { [key: string]: number } = { Q1: 0, Q2: 0, Q3: 0, Q4: 0 };

      yearMonthsData.forEach(month => {
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
    };

    const [selectedYear, setSelectedYear] = useState<string | undefined>(undefined);

    const [quarterSums, setQuarterSums] = useState<{ [key: string]: number | { [key: string]: number } }>(() => {
      const defaultYear = data2.data.attributes.viewsOverTime.length > 0
        ? data2.data.attributes.viewsOverTime[data2.data.attributes.viewsOverTime.length - 1].yearMonth.substring(0, 4)
        : undefined;
      const defaultSums: { [key: string]: number | { [key: string]: number } } = { Q1: 0, Q2: 0, Q3: 0, Q4: 0 };

      if (defaultYear) {
        const viewsByQuarter = calculateQuarterSums(data2.data.attributes.viewsOverTime, defaultYear);
        const downloadsByQuarter = calculateQuarterSums(data2.data.attributes.downloadsOverTime, defaultYear);
        const citationsByQuarter = calculateQuarterSums(data2.data.attributes.citationsOverTime, defaultYear);
        defaultSums['views'] = viewsByQuarter;
        defaultSums['downloads'] = downloadsByQuarter;
        defaultSums['citations'] = citationsByQuarter;
      }

      return defaultSums;
    });

    useEffect(() => {
      if (data2.data.attributes.viewsOverTime && data2.data.attributes.viewsOverTime.length > 0) {
        const lastItem = data2.data.attributes.viewsOverTime[data2.data.attributes.viewsOverTime.length - 1];
        const latestYear = lastItem.yearMonth.substring(0, 4);
        setSelectedYear(latestYear);
      }
    }, [data2.data.attributes.viewsOverTime]); 
    

    const handleYearChange = (value: string) => {
      setSelectedYear(value);
    
      const viewsByQuarter = calculateQuarterSums(data2.data.attributes.viewsOverTime, value);
      const downloadsByQuarter = calculateQuarterSums(data2.data.attributes.downloadsOverTime, value);
      const citationsByQuarter = calculateQuarterSums(data2.data.attributes.citationsOverTime, value);
      
      setQuarterSums({
        views: viewsByQuarter,
        downloads: downloadsByQuarter,
        citations: citationsByQuarter
      });
    };

    const years = useMemo(() => {
      if (data2.data.attributes.viewsOverTime && data2.data.attributes.viewsOverTime.length > 0) {
        const uniqueYears = new Set(
          data2.data.attributes.viewsOverTime.map((item) =>
            item.yearMonth.substring(0, 4) 
          )
        );
        return Array.from(uniqueYears).map((year) => (
          <Option key={year} value={year}>{year}</Option>
        ));
      }
      return []; 
    }, [data2.data.attributes.viewsOverTime]);

    const quartersData = [
      {
        key: '1',
        quarters: 'Jan-Mar',
        uniqueInvestigations: (quarterSums.views as { [key: string]: number }).Q1 || '--', 
        uniqueRequests: (quarterSums.downloads as { [key: string]: number }).Q1 || '--',   
        totalRequests: (quarterSums.citations as { [key: string]: number }).Q1 || '--',
      },
        {
          key: '2',
          quarters: 'Apr-Jul',
          uniqueInvestigations: (quarterSums.views as { [key: string]: number }).Q2 || '--', 
          uniqueRequests: (quarterSums.downloads as { [key: string]: number }).Q2 || '--',   
          totalRequests: (quarterSums.citations as { [key: string]: number }).Q2 || '--',
        },
        {
          key: '3',
          quarters: 'Aug-Oct',
          uniqueInvestigations: (quarterSums.views as { [key: string]: number }).Q3 || '--', 
          uniqueRequests: (quarterSums.downloads as { [key: string]: number }).Q3 || '--',   
          totalRequests: (quarterSums.citations as { [key: string]: number }).Q3 || '--',
        },
        {
          key: '4',
          quarters: 'Nov-Dec',
          uniqueInvestigations: (quarterSums.views as { [key: string]: number }).Q4 || '--', 
          uniqueRequests: (quarterSums.downloads as { [key: string]: number }).Q4 || '--',   
          totalRequests: (quarterSums.citations as { [key: string]: number }).Q4 || '--',
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
      <Modal
        title={title}
        open={isOpen} 
        onCancel={handleCancel} 
        footer={
          <div style={{ textAlign: 'center' }}>
            <p style={{ display: 'inline-block', backgroundColor: '#f0f0f0', padding: '8px' }}>
              These metrics are presented according to the <a href="https://makedatacount.org/" target="_blank" rel="noopener noreferrer">Make Data Count</a> standard.
            </p>
            <p style={{ fontStyle: 'italic' }}>Metrics recorded since January 2022.</p>
          </div>
        }
        width={800}
      >
        {/* Content of the modal */}
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <div style={{ width: '40%', marginRight: '20px' }}> 
            <Table dataSource={dataSource} columns={columns} pagination={false} />
          </div>
          <div>
            <Table dataSource={quartersData} columns={quartersColumns} pagination={false}/>
          </div>
        </div>
      </Modal>
    );
  }
