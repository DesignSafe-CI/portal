import React, { useState } from 'react';
import { TModalChildren } from '../../DatafilesModal/DatafilesModal';
import { Modal } from 'antd';
import { usePatchEntityMetadata, useProjectDetail } from '@client/hooks';
import { ProjectCategoryForm } from '../forms/ProjectCategoryForm';
import { PublishableEntityForm } from '../forms/PublishableEntityForm';
import { useNotifyContext } from '@client/hooks';

export const PipelineEditCategoryModal: React.FC<{
  projectId: string;
  entityUuid: string;
  entityName?: string;
  formType: 'publication' | 'category';
  children: TModalChildren;
}> = ({ projectId, entityUuid, formType, entityName, children }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { data } = useProjectDetail(projectId);
  const showModal = () => setIsModalOpen(true);
  const handleClose = () => {
    setIsModalOpen(false);
  };

  const { notifyApi } = useNotifyContext();
  const { mutate: patchEntityMeta } = usePatchEntityMetadata();

  if (!data) return null;

  const projectType = data.baseProject.value.projectType;

  const onSuccess = () => {
    handleClose();
    notifyApi?.open({
      type: 'success',
      message: '',
      description: 'Metadata has been updated successfully.',
      placement: 'bottomLeft',
    });
  };

  return (
    <>
      {React.createElement(children, { onClick: showModal })}
      <Modal
        open={isModalOpen}
        onCancel={handleClose}
        width="900px"
        title={<h2>Manage Categories</h2>}
        footer={null}
      >
        <article style={{ marginTop: '5px' }}>
          {formType === 'category' && (
            <ProjectCategoryForm
              projectType={projectType}
              projectId={projectId}
              entityUuid={entityUuid}
              mode="edit"
              onSubmit={(v: {
                name: string;
                value: Record<string, unknown>;
              }) => {
                console.log(v);
                patchEntityMeta(
                  { entityUuid, patchMetadata: v.value },
                  { onSuccess: onSuccess }
                );
              }}
            />
          )}
          {formType === 'publication' && (
            <PublishableEntityForm
              entityName={entityName ?? ''}
              mode="edit"
              projectId={projectId}
              projectType={projectType}
              entityUuid={entityUuid}
              onSubmit={(v: {
                name: string;
                value: Record<string, unknown>;
              }) => {
                patchEntityMeta(
                  { entityUuid, patchMetadata: v },
                  { onSuccess: onSuccess }
                );
              }}
            />
          )}
        </article>
      </Modal>
    </>
  );
};
