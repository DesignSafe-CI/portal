import React, { useMemo, useState } from 'react';
import {
  TPipelineValidationResult,
  useProjectPreview,
  useValidateEntitySelection,
} from '@client/hooks';
import { Alert, Button } from 'antd';
import { DISPLAY_NAMES } from '../constants';
import { NavLink, useSearchParams } from 'react-router-dom';
import {
  TTreeData,
  PublishedEntityDisplay,
} from '../ProjectPreview/ProjectPreview';

const PipelineValidationAlert: React.FC<{
  validationErrors: TPipelineValidationResult[] | undefined;
}> = ({ validationErrors }) => {
  return (
    <Alert
      type="error"
      style={{ marginBottom: '24px' }}
      description={
        <div>
          Your selection has missing data or incomplete requirements. Please
          review the following fields:
          {(validationErrors ?? []).map((validationError) => (
            <div key={validationError.title}>
              In the {DISPLAY_NAMES[validationError.name]}{' '}
              <strong>{validationError.title}</strong>, the following
              requirements are missing or incomplete:
              <ul>
                {validationError.missing.map((missingReq) => (
                  <li key={missingReq}>{DISPLAY_NAMES[missingReq]}</li>
                ))}
              </ul>
            </div>
          ))}{' '}
        </div>
      }
    />
  );
};

export const PipelineSelectForPublish: React.FC<{
  projectId: string;
  nextStep: () => void;
}> = ({ projectId, nextStep }) => {
  const { data } = useProjectPreview(projectId ?? '');
  const { children } = (data?.tree ?? { children: [] }) as TTreeData;
  const { mutateAsync } = useValidateEntitySelection();
  const [validationErrors, setValidationErrors] = useState<
    TPipelineValidationResult[] | undefined
  >(undefined);

  const sortedChildren = useMemo(
    () => [...(children ?? [])].sort((a, b) => a.order - b.order),
    [children]
  );
  const [searchParams, setSearchParams] = useSearchParams();

  const toggleEntitySelection = (uuid: string) => {
    const selectedEntities = searchParams.getAll('selected');
    const newSearchParams = new URLSearchParams(searchParams);

    if (selectedEntities.includes(uuid)) {
      newSearchParams.delete('selected', uuid);
      setSearchParams(newSearchParams, { replace: true });
    } else {
      newSearchParams.append('selected', uuid);
      setSearchParams(newSearchParams, { replace: true });
    }
  };

  const validateAndContinue = async () => {
    const entityUuids = searchParams.getAll('selected');
    const res = await mutateAsync({ projectId, entityUuids: entityUuids });
    if (res.result.length > 0) {
      setValidationErrors(res.result);
    } else {
      setValidationErrors(undefined);
      nextStep();
    }
  };

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
        <NavLink to={`/projects/${projectId}/preview`}>
          <i role="none" className="fa fa-arrow-left"></i>&nbsp; Back to
          Publication Preview
        </NavLink>
        <Button
          className="success-button"
          style={{ padding: '0px 40px' }}
          type="primary"
          onClick={() => validateAndContinue()}
        >
          Continue
        </Button>
      </div>
      {(validationErrors?.length ?? 0) > 0 && (
        <PipelineValidationAlert validationErrors={validationErrors} />
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {sortedChildren.map((child) => (
          <section key={child.id}>
            <Button
              type="link"
              onClick={() => toggleEntitySelection(child.uuid)}
            >
              Select this {DISPLAY_NAMES[child.name]} and all its files
            </Button>{' '}
            {searchParams.getAll('selected').includes(child.uuid) && (
              <i
                role="none"
                className="fa fa-check"
                style={{ color: '#1CB500' }}
              ></i>
            )}
            <PublishedEntityDisplay
              projectId={projectId}
              treeData={child}
              defaultOpen={false}
              key={child.id}
            />
          </section>
        ))}
      </div>
    </>
  );
};
