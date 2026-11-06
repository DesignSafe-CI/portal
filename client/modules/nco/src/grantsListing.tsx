import { TNcoGrantsItem, useNcoGrantsListing } from '@client/hooks';
import { Table, TableColumnsType } from 'antd';
import React from 'react';
import { GrantsDetailsModal } from './grantsDetailsModal';
import styles from './Nco.module.css';
import { NcoGrantsSearch } from './grantsSearch';

export const NcoGrantsListing: React.FC = () => {
  const { data, isLoading } = useNcoGrantsListing();

  const columns: TableColumnsType<TNcoGrantsItem> = [
    {
      render: (_, record) => {
        return (
          <a
            href={`https://www.nsf.gov/awardsearch/showAward?AWD_ID=${record.AwardNumber}`}
          >
            {record.AwardNumber}
          </a>
        );
      },
      title: 'Award Number',
    },
    {
      render: (_, record) => record.Title,
      title: 'Title',
    },
    {
      render: (_, record) =>
        new Date(record.EndDate.$date).toISOString().split('T')[0],
      title: 'End Date',
    },
    {
      render: (_, record) =>
        record.CoPiNames
          ? `${record.PiName} / ${record.CoPiNames}`
          : record.PiName,
      title: 'PI / Co-PI',
    },
    {
      render: (_, record) => record.Org,
      title: 'Grant Org',
    },
    {
      render: (_, record) =>
        record.NheriFacility ? record.NheriFacility : 'No Facility Listed',
      title: 'NHERI Facility',
    },
    {
      render: (_, record) => {
        return <GrantsDetailsModal record={record} />;
      },
      title: 'Details',
    },
  ];

  return (
    <>
      <div className={styles.topRowGrants}>
        <h1>NHERI Grant Research</h1>
        Search for NSF-funded research awards that employ one or more NHERI
        resources.
        <br />
        The NCO Technology Transfer Committee maintains this database as a way
        for potential users of NHERI research and other researchers to discover
        cognate investigations conducted within the NHERI network.
        <br />
        <br />
        Questions? Contact the NCO Technology Transfer Committee
        [ttc-inquiry@designsafe-ci.org].
        <ul>
          <li>
            <a href="https://www.designsafe-ci.org/community/ttc/">
              TTC Webpage
            </a>
          </li>
          <li>Contact TTC: ttc-inquiry@designsafe-ci.org</li>
          <li>
            <a href="https://www.designsafe-ci.org/nco/scheduler/">
              NHERI Scheduler Database
            </a>
          </li>
          <li>
            <a href="https://www.designsafe-ci.org/news/">NHERI News</a>
          </li>
        </ul>
      </div>
      <br />
      <NcoGrantsSearch />
      <hr />
      <Table
        dataSource={data ? data.response : []}
        loading={isLoading}
        columns={columns}
      ></Table>
    </>
  );
};
