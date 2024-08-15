import React, { useState } from 'react';
import { TModalChildren } from '../../DatafilesModal/DatafilesModal';
import { Button, Modal } from 'antd';
import { TBaseProjectValue, useProjectDetail } from '@client/hooks';
import { ProjectCollapse } from '../ProjectCollapser/ProjectCollapser';
import { PublishableEntityForm } from '../forms/PublishableEntityForm';

const CategoryDetail: React.FC<{
  description?: string;
  entityName: string;
  projectType: TBaseProjectValue['projectType'];
  projectId: string;
  entityUuid: string;
}> = ({ description, projectId, projectType, entityUuid, entityName }) => {
  const [showForm, setShowForm] = useState(false);
  return (
    <>
      <section>
        <article>{description}</article>
        <Button type="link" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel Editing' : 'Edit'}
        </Button>
        &nbsp;|&nbsp;
        <Button type="link">Delete</Button>
      </section>
      {showForm && (
        <section style={{ marginTop: '20px' }}>
          <PublishableEntityForm
            entityName={entityName}
            mode="edit"
            projectId={projectId}
            projectType={projectType}
            entityUuid={entityUuid}
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

  if (!data) return null;

  const projectType = data.baseProject.value.projectType;

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
        <section style={{ backgroundColor: '#f5f5f5', padding: '20px' }}>
          <PublishableEntityForm
            entityName={entityName}
            mode="create"
            projectId={projectId}
            projectType={projectType}
          />
        </section>
        <strong>Category Inventory</strong>
        <article>
          {data.entities
            .filter((e) => e.name === entityName)
            .map((entity) => (
              <ProjectCollapse
                key={entity.uuid}
                title={entity.value.title}
                entityName={entity.name}
              >
                <CategoryDetail
                  description={entity.value.description}
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
