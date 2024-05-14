import {
  useProjectDetail,
  useSelectedFiles,
  useSetFileAssociations,
} from '@client/hooks';
import { Alert, Button } from 'antd';
import { FileListing } from '../../FileListing/FileListing';
import { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';

export const PipelineOtherSelectFiles: React.FC<{
  projectId: string;
  prevStep: () => void;
  nextStep: () => void;
}> = ({ projectId, prevStep, nextStep }) => {
  const { data } = useProjectDetail(projectId ?? '');

  const [canContinue, setCanContinue] = useState(false);
  const [showError, setShowError] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const { mutate } = useSetFileAssociations(projectId);

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
    if (selectedFiles.length > 0 && !!data) {
      // TODO: mutation to set project's fileObjs attribute to the selected files.
      mutate(
        { fileObjs: selectedFiles, entityUuid: data.baseProject.uuid },
        {
          onSuccess: () => {
            setCanContinue(true);
            setShowError(false);
            setShowSuccess(true);
          },
          onError: () => {
            setCanContinue(false);
            setShowError(true);
            setShowSuccess(false);
          },
        }
      );
      return;
    }
    setCanContinue(false);
    setShowError(true);
    setShowSuccess(false);
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
        <NavLink to={`/projects/${projectId}/preview`}>
          <i role="none" className="fa fa-arrow-left"></i>&nbsp; Back to
          Publication Preview
        </NavLink>
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
        {showSuccess && (
          <Alert
            showIcon
            type="success"
            message="Your file selections have been saved."
          />
        )}
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
