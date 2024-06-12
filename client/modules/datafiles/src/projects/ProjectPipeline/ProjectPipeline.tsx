import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Steps } from 'antd';
import { PipelineSelectForPublish } from './PipelineSelectForPublish';
import { PipelineProofreadProjectStep } from './PipelineProofreadProjectStep';
import { TBaseProjectValue, useProjectDetail } from '@client/hooks';
import { PipelineOtherSelectFiles } from './PipelineOtherSelectFiles';
import { PipelineOrderAuthors } from './PipelineOrderAuthors';
import { PipelineProofreadPublications } from './PipelineProofreadPublications';
import { PipelineProofreadCategories } from './PipelineProofreadCategories';
import { PipelineSelectLicense } from './PipelineSelectLicense';
import { Link, useSearchParams } from 'react-router-dom';

const getSteps = (
  projectId: string,
  projectType: TBaseProjectValue['projectType'],
  next: () => void,
  prev: () => void
) => {
  const proofreadStepMapping: Partial<
    Record<TBaseProjectValue['projectType'], string>
  > = {
    experimental: 'Experiments',
    field_recon: 'Missions',
    hybrid_simulation: 'Hybrid Simulations',
    simulation: 'Simulations',
  };

  switch (projectType) {
    case 'hybrid_simulation':
    case 'experimental':
    case 'field_recon':
    case 'simulation':
      return [
        {
          title: 'Selection',
          content: (
            <PipelineSelectForPublish projectId={projectId} nextStep={next} />
          ),
        },
        {
          title: 'Proofread Project',
          content: (
            <PipelineProofreadProjectStep
              projectId={projectId}
              nextStep={next}
              prevStep={prev}
            />
          ),
        },
        {
          title: `Proofread ${proofreadStepMapping[projectType]}`,
          content: (
            <PipelineProofreadPublications
              projectId={projectId}
              nextStep={next}
              prevStep={prev}
            />
          ),
        },
        {
          title: 'Proofread Categories',
          content: (
            <PipelineProofreadCategories
              projectId={projectId}
              nextStep={next}
              prevStep={prev}
            />
          ),
        },
        {
          title: 'Order Authors',
          content: (
            <PipelineOrderAuthors
              projectId={projectId}
              prevStep={prev}
              nextStep={next}
            />
          ),
        },
        {
          title: 'Licenses',
          content: (
            <PipelineSelectLicense
              projectId={projectId}
              nextStep={next}
              prevStep={prev}
            />
          ),
        },
      ];

    case 'other':
      return [
        {
          title: 'Select Files',
          content: (
            <PipelineOtherSelectFiles
              projectId={projectId}
              prevStep={prev}
              nextStep={next}
            />
          ),
        },
        {
          title: 'Proofread Project',
          content: (
            <PipelineProofreadProjectStep
              projectId={projectId}
              nextStep={next}
              prevStep={prev}
            />
          ),
        },
        {
          title: 'Order Authors',
          content: (
            <PipelineOrderAuthors
              projectId={projectId}
              prevStep={prev}
              nextStep={next}
            />
          ),
        },
        {
          title: 'Licenses',
          content: (
            <PipelineSelectLicense
              projectId={projectId}
              nextStep={next}
              prevStep={prev}
            />
          ),
        },
      ];
    default:
      return [];
  }
};

export const ProjectPipeline: React.FC<{ projectId: string }> = ({
  projectId,
}) => {
  const [current, setCurrent] = useState(0);
  const [searchParams, setSearchParams] = useSearchParams();

  const { data } = useProjectDetail(projectId);
  const projectType = data?.baseProject.value.projectType;

  // type Other doesn't support entity selection, so we select the base project here.
  useEffect(() => {
    if (projectType === 'other' && data?.baseProject.uuid) {
      setSearchParams(
        (e) => {
          e.set('selected', data?.baseProject.uuid);
          return e;
        },
        { replace: true }
      );
    }
  }, [projectType, setSearchParams, data]);

  const next = useCallback(() => {
    setCurrent(current + 1);
  }, [current, setCurrent]);

  const prev = useCallback(() => {
    setCurrent(current - 1);
  }, [current, setCurrent]);

  const steps = useMemo(() => {
    if (!projectType) return [];
    return getSteps(projectId, projectType, next, prev);
  }, [projectId, projectType, next, prev]);

  const operationName = {
    amend: 'Amending',
    version: 'Versioning',
    publish: 'Publishing',
  }[searchParams.get('operation') ?? 'publish'];

  const items = steps.map((item) => ({ key: item.title, title: item.title }));
  if (!data) return null;
  return (
    <section style={{ marginTop: '10px' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '12px',
        }}
      >
        <h2>
          {operationName} {projectId}
        </h2>

        <Link to={`/projects/${projectId}/preview`}>
          <i role="none" className="fa fa-times"></i>&nbsp; Exit Prepare to
          Publish
        </Link>
      </div>
      <Steps progressDot current={current} items={items} />

      <div>{steps[current].content}</div>
    </section>
  );
};
