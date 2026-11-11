import { TNcoSchedItem, useNcoSchedListing } from '@client/hooks';
import { Table, TableColumnsType } from 'antd';
import React from 'react';
import styles from './Nco.module.css';
import { NcoSchedSearch } from './schedulerSearch';

export const NcoSchedListing: React.FC = () => {
  const { data, isLoading } = useNcoSchedListing();

  const columns: TableColumnsType<TNcoSchedItem> = [
    {
      render: (_, record) =>
        record.dateStart
          ? new Date(record.dateStart.$date).toISOString().split('T')[0]
          : '',
      title: 'Estimated Start Date',
    },
    {
      render: (_, record) =>
        record.dateEnd
          ? new Date(record.dateEnd.$date).toISOString().split('T')[0]
          : '',
      title: 'Estimated End Date',
    },
    {
      render: (_, record) => record.facility,
      title: 'Facility',
    },
    {
      render: (_, record) => (
        <>
          <p>{record.awardTitle}</p>
          <p>
            <a
              href={`https://www.nsf.gov/awardsearch/showAward?AWD_ID=${record.awardNumber}`}
            >
              NSF {record.directorate ? record.directorate : ''} #
              {record.awardNumber}
            </a>
          </p>
          <p>PI: {record.piName ? record.piName : 'Not Reported'}</p>
        </>
      ),
      title: 'Award',
    },
    {
      render: (_, record) =>
        record.awardDescription ? record.awardDescription : 'Not Available',
      title: 'Event Description',
    },
  ];

  return (
    <>
      <div className={styles.topRowSched}>
        <div className={styles.titleIntroBox}>
          <h1>Facility Scheduling Dashboard</h1>
          <h3>
            <em>Centralized management for NSF-funded awards using NHERI</em>
          </h3>
          <p>
            At any given time, dozens of research projects are underway at
            NHERI's{' '}
            <a href="/facilities/experimental/">
              eight Experimental Facilities
            </a>
            . The Facility Scheduling Dashboard provides researchers with a
            centralized location for managing project experiments and offers a
            public view of the work underway at NHERI facilities.
          </p>
          <p>
            The NHERI{' '}
            <a href="/facilities/nco/">Network Coordination Office (NCO)</a>{' '}
            oversees NHERI's centralized scheduling and will be rolling out
            phased updates to the Scheduling Dashboard.
          </p>
          <p>
            Questions about specific experiments? Please contact the facility
            directly. NHERI experimental facilities, including contact names,
            are listed <a href="/facilities/experimental">here</a>.
          </p>
        </div>
        <div>
          <div>
            <i className="fa fa-briefcase fa-2x"></i>
            <b>
              <a href="/facilities/scheduling/request/">
                {' '}
                Request a New Project
              </a>
            </b>
          </div>
          <div>
            <i className="fa fa-briefcase fa-2x"></i>
            <b>
              <a href="/facilities/scheduling/protocol/">
                {' '}
                NHERI Scheduling Protocol
              </a>
            </b>
          </div>
          <div>
            <i className="fa fa-briefcase fa-2x"></i>
            <b>
              <a href="/facilities/"> NHERI Experimental Facilities</a>
            </b>
          </div>
          <div>
            <i className="fa fa-briefcase fa-2x"></i>
            <b>
              <a href="/facilities/nco/contact/"> Questions? Contact Us</a>
            </b>
          </div>
        </div>
      </div>
      <hr />
      <NcoSchedSearch />
      <Table
        dataSource={data ? data.response : []}
        loading={isLoading}
        columns={columns}
      ></Table>
      <hr />
      <div className={styles.footer}>
        <h3>About the NHERI Network Coordination Office</h3>
        <p>
          The NCO's centralized facility oversight and coordination allows for
          fair and transparent use of these NSF-funded Experimental Facilities
          following a scheduling protocol developed in cooperation with
          facilities. The <a href="/facilities/nco">NHERI NCO</a> developed and
          currently maintains the NHERI Facility Scheduling Dashboard as part of
          its administrative and governance roles within the NHERI network. The
          NHERI scheduling protocol is available{' '}
          <a href="/facilities/scheduling/protocol">here</a>.
        </p>
      </div>
    </>
  );
};
