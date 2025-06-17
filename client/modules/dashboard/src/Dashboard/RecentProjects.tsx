import React, { useEffect, useState } from 'react';
import axios from 'axios';
import styles from './Dashboard.module.css';

type Project = {
  uuid: string;
  title: string;
  projectId: string;
  lastUpdated: string;
  pi: string;
};

// Define the structure of the API response
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

const RecentProjects: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await axios.get('/api/projects/v2/?offset=0&limit=100');
        const rawProjects: RawProject[] = response.data.result;

        const mapped: Project[] = rawProjects.map((proj: RawProject) => {
          const piUser = proj.value.users?.find(
            (user) => user.role === 'pi'
          );

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
      }
    };

    fetchProjects();
  }, []);

  if (projects.length === 0) return null;

  return (
    <div className={styles.recentProjectsContainer}>
      <h2 className={styles.recentProjectsTitle}>Recent Projects</h2>
      <table className={styles.recentProjectsTable}>
        <thead>
          <tr>
            <th>Title</th>
            <th>PI</th>
            <th>ID</th>
          </tr>
        </thead>
        <tbody>
          {projects.map((proj) => (
            <tr key={proj.uuid}>
              <td>
                <a
                  href={`/data/browser/projects/${proj.projectId}`}
                  className={styles.projectLink}
                >
                  {proj.title || proj.projectId}
                </a>
              </td>
              <td>{proj.pi}</td>
              <td className={styles.projectId}>{proj.projectId}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default RecentProjects;
