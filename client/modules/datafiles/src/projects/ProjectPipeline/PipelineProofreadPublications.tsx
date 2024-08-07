import React, { useMemo } from 'react';
import { useProjectPreview } from '@client/hooks';
import { Button } from 'antd';
import { useSearchParams } from 'react-router-dom';
import { TPreviewTreeData } from '@client/hooks';
import { PublishedEntityDisplay } from '../ProjectPreview/ProjectPreview';
import { PipelineEditCategoryModal } from '../modals';

export const PipelineProofreadPublications: React.FC<{
  projectId: string;
  displayName?: string;
  nextStep: () => void;
  prevStep: () => void;
}> = ({ projectId, displayName, nextStep, prevStep }) => {
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
      <h3 style={{ textAlign: 'center' }}>
        Proofread your {displayName} Metadata
      </h3>
      <ul style={{ listStylePosition: 'inside', paddingInlineStart: '0px' }}>
        <li>If you selected the wrong collection, go back to Selection.</li>
        <li>
          If you need to add or modify files, click "Exit Prepare to Publish"
          and make your changes in the Curation Directory.
        </li>
        <li>
          If you need help, attend{' '}
          <a
            href="/facilities/virtual-office-hours/"
            target="_blank"
            aria-describedby="msg-open-new-window"
          >
            curation office hours
          </a>{' '}
          for help with publishing.
        </li>
      </ul>

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
            <div>
              <PipelineEditCategoryModal
                projectId={projectId ?? ''}
                entityName={child.name}
                formType="publication"
                entityUuid={child.uuid}
              >
                {({ onClick }) => (
                  <Button
                    onClick={onClick}
                    type="link"
                    style={{ marginTop: '10px', fontWeight: 'bold' }}
                  >
                    Edit {child.value.title}
                  </Button>
                )}
              </PipelineEditCategoryModal>
            </div>
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
