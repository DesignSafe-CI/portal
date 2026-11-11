import React, { useMemo } from 'react';
import { useProjectListing } from '@client/hooks';
import { Table, Typography, Alert } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import styles from '../Dashboard/Dashboard.module.css';

type Project = {
  uuid: string;
  title: string;
  projectId: string;
  lastUpdated: string;
  pi: string;
};

interface RawUser {
  role: string;
  fname: string;
  lname: string;
}

interface RawProject {
  uuid: string;
  lastUpdated: string;
  value: {
    title: string;
    projectId: string;
    users?: RawUser[];
  };
}

const { Link, Text } = Typography;

const RecentProjects: React.FC = () => {
  const { data, isLoading, error } = useProjectListing(1, 100);

  const sortedRecent = useMemo(() => {
    if (!data?.result) return [];

    const rawProjects: RawProject[] = data.result;

    const mapped: Project[] = rawProjects.map((proj) => {
      const piUser = proj.value.users?.find((user) => user.role === 'pi');

      return {
        uuid: proj.uuid,
        title: proj.value.title,
        projectId: proj.value.projectId,
        lastUpdated: proj.lastUpdated,
        pi: piUser ? `${piUser.fname} ${piUser.lname}` : 'N/A',
      };
    });

    return mapped
      .sort(
        (a, b) =>
          new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime()
      )
      .slice(0, 3);
  }, [data]);

  if (error) {
    return (
      <Alert
        type="error"
        message="Failed to load recent projects"
        description="Please try refreshing the page."
        showIcon
      />
    );
  }

  if (!isLoading && sortedRecent.length === 0) {
    return null;
  }

  const columns: ColumnsType<Project> = [
    {
      title: 'Title',
      dataIndex: 'title',
      key: 'title',
      render: (text: string, record: Project) => (
        <Link
          href={`/data/browser/projects/${record.projectId}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          {text || record.projectId}
        </Link>
      ),
    },
    {
      title: 'PI',
      dataIndex: 'pi',
      key: 'pi',
    },
    {
      title: 'ID',
      dataIndex: 'projectId',
      key: 'projectId',
      className: styles.projectId,
      render: (text: string) => <Text code>{text}</Text>,
    },
  ];

  return (
    <div className={styles.recentProjectsContainer}>
      <Table
        dataSource={sortedRecent}
        columns={columns}
        rowKey="uuid"
        pagination={false}
        loading={isLoading}
        size="middle"
      />
    </div>
  );
};

export default RecentProjects;
