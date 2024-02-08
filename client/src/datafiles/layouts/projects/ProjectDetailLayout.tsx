import React from 'react';
import { Outlet, useParams } from 'react-router-dom';
import { BaseProjectForm } from '@client/datafiles';
import { useProjectDetail } from '@client/hooks';

export const ProjectDetailLayout: React.FC = () => {
  const { projectId } = useParams();
  const { data } = useProjectDetail(projectId ?? '');
  if (!data) return <div>loading...</div>
  const pi = data?.baseProject.value.users.find(u => u.role === 'pi');
  const coPis =  data?.baseProject.value.users.filter(u => u.role === 'co_pi');

  return (
    <div style={{width: "100%"}}>
      Placeholder for the project detail layout (handles workdir and curation).{' '}
      <table style={{ width: '100%' }}>
        <colgroup>
          <col style={{ width: '200px' }} />
          <col />
        </colgroup>
        <tbody>
          <tr className="prj-row" style={{height: "26px"}}>
            <td>PI</td>
            <td style={{fontWeight: 'bold'}}>{`${pi.lname}, ${pi.fname}`}</td>
          </tr>
          <tr className="prj-row" style={{height: "26px"}}>
            <td>Co-PIs</td>
            <td style={{fontWeight: 'bold'}}>{coPis.map(u => `${u.lname}, ${u.fname}`).join(', ')}</td>
          </tr>
          <tr className="prj-row" style={{height: "26px"}}>
            <td>Data Type</td>
            <td style={{fontWeight: 'bold'}}>Gonzalez, Vanessa</td>
          </tr>
          <tr className="prj-row" style={{height: "26px"}}>
            <td>Natural Hazard Type</td>
            <td style={{fontWeight: 'bold'}}>Gonzalez, Vanessa</td>
          </tr>
        </tbody>
      </table>
      <BaseProjectForm projectId={projectId}/>
      <Outlet />
    </div>
  );
};
