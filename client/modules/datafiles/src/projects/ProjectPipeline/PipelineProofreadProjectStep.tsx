import { useProjectDetail } from '@client/hooks';
import { BaseProjectDetails } from '../BaseProjectDetails';
import { ProjectTitleHeader } from '../ProjectTitleHeader/ProjectTitleHeader';
import { Button } from 'antd';

export const PipelineProofreadProjectStep: React.FC<{
  projectId: string;
  prevStep: () => void;
  nextStep: () => void;
}> = ({ projectId, prevStep, nextStep }) => {
  const { data } = useProjectDetail(projectId ?? '');
  if (!data || !projectId) return null;
  return (
    <>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginTop: 24,
        }}
      >
        <Button type="link" onClick={() => prevStep()}>
          <i role="none" className="fa fa-arrow-left"></i>&nbsp; Back to
          Selection
        </Button>
        <Button
          className="success-button"
          style={{ padding: '0px 40px' }}
          type="primary"
          onClick={() => nextStep()}
        >
          Continue
        </Button>
      </div>
      <section>
        <h3 style={{ textAlign: 'center' }}>Proofread your Project Metadata</h3>
        <ul style={{ listStylePosition: 'inside', paddingInlineStart: '0px' }}>
          <li>Project metadata is published alongside your project.</li>
          <li>
            If you need help, attend{' '}
            <a
              href="/facilities/virtual-office-hours/"
              target="_blank"
              aria-describedby="msg-open-new-window"
            >
              Curation office hours
            </a>{' '}
            for help with publishing.
          </li>
        </ul>
        <ProjectTitleHeader projectId={projectId} />
        <BaseProjectDetails projectValue={data.baseProject.value} />
      </section>
    </>
  );
};
