import { useProjectDetail, useSelectedFiles } from '@client/hooks';
import { Alert, Button } from 'antd';
import { FileListing } from '../../FileListing/FileListing';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

export const PipelineOtherSelectFiles: React.FC<{
  projectId: string;
  prevStep: () => void;
  nextStep: () => void;
}> = ({ projectId, prevStep, nextStep }) => {
  const { data } = useProjectDetail(projectId ?? '');

  const [canContinue, setCanContinue] = useState(false);
  const [showError, setShowError] = useState(false);

  const [searchParams, setSearchParams] = useSearchParams();

  const { selectedFiles, setSelectedFiles } = useSelectedFiles(
    'tapis',
    `project-${data?.baseProject.uuid}`,
    ''
  );
  useEffect(() => {
    // Clear selected files on initial render to remove stale selections from curation views.
    setSelectedFiles([]);
  }, [setSelectedFiles, projectId]);

  const onSaveSelections = () => {
    console.log(selectedFiles);
    if (selectedFiles.length > 0) {
      // TODO: mutation to set project's fileObjs attribute to the selected files.
      setCanContinue(true);
      setShowError(false);

      const newSearchParams = new URLSearchParams(searchParams);
      data && newSearchParams.set('selected', data?.baseProject.uuid);
      setSearchParams(newSearchParams);
      return;
    }
    setCanContinue(false);
    setShowError(true);
  };

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
          disabled={!canContinue}
          className="success-button"
          style={{ padding: '0px 40px' }}
          type="primary"
          onClick={nextStep}
        >
          Continue
        </Button>
      </div>
      <section>
        <h3 style={{ textAlign: 'center' }}>Select what you want to publish</h3>
        <ul style={{ listStylePosition: 'inside', paddingInlineStart: '0px' }}>
          <li>You may only select files from one directory.</li>
          <li>
            Select the files you wish to publish and click "Save Selections".
          </li>
          <li>
            If you want to deselect individual files, deselect the checkboxes.
          </li>
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
        {showError && (
          <Alert
            showIcon
            type="error"
            message="Please select at least 1 file or folder."
          />
        )}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <h3>Select Files</h3>{' '}
          <Button type="primary" onClick={onSaveSelections}>
            Save Selections
          </Button>
        </div>
        <FileListing api="tapis" system={`project-${data.baseProject.uuid}`} />
      </section>
    </>
  );
};
