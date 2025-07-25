import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Table, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import styles from './Dashboard.module.css';

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
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    const fetchProjects = async () => {
      setLoading(true);
      try {
        const response = await axios.get(
          '/api/projects/v2/?offset=0&limit=100'
        );
        const rawProjects: RawProject[] = response.data.result;

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

        const sortedRecent = mapped
          .sort(
            (a, b) =>
              new Date(b.lastUpdated).getTime() -
              new Date(a.lastUpdated).getTime()
          )
          .slice(0, 3);

        setProjects(sortedRecent);
      } catch (error) {
        console.error('Failed to fetch recent projects!', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, []);

  if (projects.length === 0) return null;

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
        dataSource={projects}
        columns={columns}
        rowKey="uuid"
        pagination={false}
        loading={loading}
        size="middle"
      />
    </div>
  );
};

export default RecentProjects;
