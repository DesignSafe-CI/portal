import React, { useState } from 'react';
import { JobsListing } from '../../../workspace/src/JobsListing/JobsListing';
import styles from './dashboard.module.css';
import { JobsListingWrapper } from './JobsListingWrapper';
import { JobDetailModalWrapper } from './JobDetailModalWrapper';

const JobStatus: React.FC = () => {
  const [selectedJobUuid, setSelectedJobUuid] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleViewDetails = (uuid: string) => {
    setSelectedJobUuid(uuid);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedJobUuid(null);
    // Optional: You can add any additional logic here when closing
  };

  return (
    <div className={styles.recentJobsCard}>
      <div className={styles.recentJobsHeader}>
        <h2>Recent Jobs</h2>
        <a href="/workspace/history" className={styles.viewAllLink}>
          View All Jobs
        </a>
      </div>
      <div className={styles.jobsTableWrapper}>
        <JobsListingWrapper onViewDetails={handleViewDetails} />
      </div>
      
      <JobDetailModalWrapper
        uuid={selectedJobUuid}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />
    </div>
  );
};

export default JobStatus;