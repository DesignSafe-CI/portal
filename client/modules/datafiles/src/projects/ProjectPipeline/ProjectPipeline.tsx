import React, { useCallback, useMemo, useState } from 'react';
import { Steps } from 'antd';
import { PipelineSelectForPublish } from './PipelineSelectForPublish';
import { PipelineProofreadProjectStep } from './PipelineProofreadProjectStep';
import { useProjectDetail } from '@client/hooks';
import { PipelineOtherSelectFiles } from './PipelineOtherSelectFiles';
import { PipelineOrderAuthors } from './PipelineOrderAuthors';
import { PipelineProofreadPublications } from './PipelineProofreadPublications';
import { PipelineProofreadCategories } from './PipelineProofreadCategories';
import { PipelineSelectLicense } from './PipelineSelectLicense';

const getSteps = (
  projectId: string,
  projectType: string,
  next: () => void,
  prev: () => void
) => {
  switch (projectType) {
    case 'hybrid_simulation':
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
          title: 'Proofread Experiments',
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
          content: 'Last-content',
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

  const { data } = useProjectDetail(projectId);
  const projectType = data?.baseProject.value.projectType;

  const next = useCallback(() => {
    setCurrent(current + 1);
  }, [current, setCurrent]);

  const prev = useCallback(() => {
    setCurrent(current - 1);
  }, [current, setCurrent]);

  const steps = useMemo(
    () => getSteps(projectId, projectType ?? '', next, prev),
    [projectId, projectType, next, prev]
  );

  const items = steps.map((item) => ({ key: item.title, title: item.title }));
  if (!data) return null;
  return (
    <section style={{ marginTop: '10px' }}>
      <Steps progressDot current={current} items={items} />

      <div>{steps[current].content}</div>
    </section>
  );
};
