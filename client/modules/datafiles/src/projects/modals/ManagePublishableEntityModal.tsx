import React, { useState } from 'react';
import { TModalChildren } from '../../DatafilesModal/DatafilesModal';
import { Button, Modal } from 'antd';
import {
  TBaseProjectValue,
  TEntityValue,
  useCreateEntity,
  useDeleteEntity,
  usePatchEntityMetadata,
  useProjectDetail,
} from '@client/hooks';
import { ProjectCollapse } from '../ProjectCollapser/ProjectCollapser';
import { PublishableEntityForm } from '../forms/PublishableEntityForm';
import { PublishedEntityDetails } from '../PublishedEntityDetails';
import { DISPLAY_NAMES } from '../constants';

const CategoryDetail: React.FC<{
  value?: TEntityValue;
  entityName: string;
  projectType: TBaseProjectValue['projectType'];
  projectId: string;
  entityUuid: string;
}> = ({ value, projectId, projectType, entityUuid, entityName }) => {
  const [showForm, setShowForm] = useState(false);
  const { mutate } = usePatchEntityMetadata();
  const { mutate: deleteEntity } = useDeleteEntity();
  return (
    <>
      <section>
        {value && <PublishedEntityDetails entityValue={value} />}
        <Button type="link" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel Editing' : 'Edit'}
        </Button>
        &nbsp;|&nbsp;
        <Button type="link" onClick={() => deleteEntity({ entityUuid })}>
          Delete
        </Button>
      </section>
      {showForm && (
        <section style={{ marginTop: '20px' }}>
          <PublishableEntityForm
            entityName={entityName}
            mode="edit"
            projectId={projectId}
            projectType={projectType}
            entityUuid={entityUuid}
            onSubmit={(v: { name: string; value: Record<string, unknown> }) => {
              mutate(
                { entityUuid, patchMetadata: v },
                { onSuccess: () => setShowForm(false) }
              );
            }}
          />
        </section>
      )}
    </>
  );
};

export const ManagePublishableEntityModal: React.FC<{
  projectId: string;
  entityName: string;
  children: TModalChildren;
}> = ({ projectId, entityName, children }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { data } = useProjectDetail(projectId);
  const showModal = () => setIsModalOpen(true);
  const handleClose = () => {
    setIsModalOpen(false);
  };
  const { mutate } = useCreateEntity(projectId);

  if (!data) return null;

  const projectType = data.baseProject.value.projectType;

  return (
    <>
      {React.createElement(children, { onClick: showModal })}
      <Modal
        open={isModalOpen}
        onCancel={handleClose}
        width="900px"
        title={<h2>Manage {DISPLAY_NAMES[entityName]}s</h2>}
        footer={null}
      >
        <section style={{ backgroundColor: '#f5f5f5', padding: '20px' }}>
          <PublishableEntityForm
            entityName={entityName}
            mode="create"
            projectId={projectId}
            projectType={projectType}
            onSubmit={(v: Record<string, unknown>) => {
              console.log(v);
              mutate({ formData: { name: entityName, value: v } });
            }}
          />
        </section>

        <article style={{ marginTop: '5px' }}>
          {data.entities
            .filter((e) => e.name === entityName)
            .map((entity) => (
              <ProjectCollapse
                key={entity.uuid}
                title={entity.value.title}
                entityName={entity.name}
              >
                <CategoryDetail
                  value={entity.value}
                  entityName={entityName}
                  entityUuid={entity.uuid}
                  projectId={projectId}
                  projectType={projectType}
                />
              </ProjectCollapse>
            ))}
        </article>
      </Modal>
    </>
  );
};
