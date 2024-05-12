import React from 'react';
import { Modal, Popover, Select, Table } from 'antd';
const { Option } = Select;

export const MetricsModal: React.FC<{
    isOpen: boolean;
    handleCancel: () => void;
    data1: { data: { attributes: { 'relation-type-id': string, total: number } }[] }; 
    

  }> = ({ isOpen, handleCancel, data1 }) => {
    interface DataEntry {
      attributes: {
        'relation-type-id': string;
        total: number;
      };
    }
    const uniqueInvestigations = data1.data.filter((entry: DataEntry) => entry.attributes["relation-type-id"] === 'unique-dataset-investigations-regular');
    const uniqueRequests = data1.data.filter((entry: DataEntry) => entry.attributes["relation-type-id"] === 'unique-dataset-requests-regular');
    const totalRequests = data1.data.filter((entry: DataEntry) => entry.attributes["relation-type-id"] === 'total-dataset-requests-regular');

    const dataSource = [
      {
        key: '1',
        usage: (
          <span>
            Unique Investigations{' '}
            <span style={{ fontSize: '80%', fontStyle: 'italic' }}>(views)</span>
            <Popover overlayStyle={{ maxWidth: '400px' }} title= "Unique Investigations (Views)" 
                      content="Refers to the number of one-hour sessions during which a user viewed 
                      metadata or previewed/downloaded/copied files associated with this DOI." >
              <a href="#">?</a>
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
            <span style={{ fontSize: '80%', fontStyle: 'italic' }}>(downloads)</span>
            <Popover overlayStyle={{ maxWidth: '400px' }} title= "Unique Requests (Downloads)" 
                      content="Refers to the number of one-hour sessions during which a user   previewed/downloaded/copied files associated with this DOI." >
              <a href="#">?</a>
            </Popover>
          </span>
        ),
        data: uniqueRequests.length > 0 ? uniqueRequests[0].attributes.total : '--',
      },
      {
        key: '3',
        usage: (
          <span>
            Dataset Total Requests
            <Popover overlayStyle={{ maxWidth: '400px' }} title= "Dataset Total Requests" 
                      content="All downloads, previews, and copies of files plus Project Downloads." >
              <a href="#">?</a>
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

    const yearOptions = ['2022', '2023', '2024', '2025']; // Update with the desired years

    const quartersData = [
      {
        key: '1',
        quarters: 'Jan-Mar',
        uniqueInvestigations: '--', // Placeholder for data
        uniqueRequests: '--', // Placeholder for data
        totalRequests: '--', // Placeholder for data
      },
      {
        key: '2',
        quarters: 'Apr-Jul',
        uniqueInvestigations: '--', // Placeholder for data
        uniqueRequests: '--', // Placeholder for data
        totalRequests: '--', // Placeholder for data
      },
      {
        key: '3',
        quarters: 'Aug-Oct',
        uniqueInvestigations: '--', // Placeholder for data
        uniqueRequests: '--', // Placeholder for data
        totalRequests: '--', // Placeholder for data
      },
      {
        key: '4',
        quarters: 'Nov-Dec',
        uniqueInvestigations: '--', // Placeholder for data
        uniqueRequests: '--', // Placeholder for data
        totalRequests: '--', // Placeholder for data
      },
    ];
    
    const quartersColumns = [
      {
        title: 'Quarters',
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
          <div style={{ width: '40%' }}> {/* Adjust the width as needed */}
            <Table dataSource={dataSource} columns={columns} pagination={false} />
          </div>
          <div>
            <Table dataSource={quartersData} columns={quartersColumns} pagination={false}/>
          </div>
        </div>
      </Modal>
    );
  }
