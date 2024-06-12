import React, { useMemo } from 'react';
import { useProjectPreview } from '@client/hooks';
import { Button } from 'antd';
import { useSearchParams } from 'react-router-dom';
import { TPreviewTreeData } from '@client/hooks';
import { PublishedEntityDisplay } from '../ProjectPreview/ProjectPreview';
import { PublishableEntityButton } from '../PublishableEntityButton';

export const PipelineProofreadPublications: React.FC<{
  projectId: string;
  nextStep: () => void;
  prevStep: () => void;
}> = ({ projectId, nextStep, prevStep }) => {
  const { data } = useProjectPreview(projectId ?? '');
  const { children } = (data?.tree ?? { children: [] }) as TPreviewTreeData;
  const [searchParams] = useSearchParams();

  const sortedChildren = useMemo(() => {
    const selectedUuids = searchParams.getAll('selected');
    return [...(children ?? [])]
      .sort((a, b) => a.order - b.order)
      .filter((e) => selectedUuids.includes(e.uuid));
  }, [children, searchParams]);

  if (!data) return null;

  return (
    <>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginTop: 24,
          marginBottom: 20,
        }}
      >
        <Button type="link" onClick={prevStep}>
          <i role="none" className="fa fa-arrow-left"></i>&nbsp; Back to
          Proofread Project
        </Button>
        <Button
          className="success-button"
          style={{ padding: '0px 40px' }}
          type="primary"
          onClick={nextStep}
        >
          Continue
        </Button>
      </div>

      <PublishableEntityButton projectId={projectId} verb="Manage" editonly />

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
          marginTop: '12px',
        }}
      >
        {sortedChildren.map((child) => (
          <section key={child.id}>
            <PublishedEntityDisplay
              preview
              projectId={projectId}
              treeData={child}
              defaultOpen
              key={child.id}
            />
          </section>
        ))}
      </div>
    </>
  );
};
