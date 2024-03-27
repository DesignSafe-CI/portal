import React, { useState } from 'react';
import { TModalChildren } from '../../DatafilesModal/DatafilesModal';
import { Button, Modal } from 'antd';
import { TBaseProjectValue, useProjectDetail } from '@client/hooks';
import { CATEGORIES_BY_PROJECT_TYPE } from '../constants';
import { ProjectCollapse } from '../ProjectCollapser/ProjectCollapser';
import { ProjectCategoryForm } from '../forms/ProjectCategoryForm';

const CategoryDetail: React.FC<{
  description?: string;
  projectType: TBaseProjectValue['projectType'];
  projectId: string;
  entityUuid: string;
}> = ({ description, projectId, projectType, entityUuid }) => {
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
          <ProjectCategoryForm
            projectType={projectType}
            projectId={projectId}
            entityUuid={entityUuid}
            mode="edit"
          />
        </section>
      )}
    </>
  );
};

export const ManageCategoryModal: React.FC<{
  projectId: string;
  children: TModalChildren;
}> = ({ projectId, children }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { data } = useProjectDetail(projectId);
  const showModal = () => setIsModalOpen(true);
  const handleClose = () => {
    setIsModalOpen(false);
  };

  if (!data) return null;

  const projectType = data.baseProject.value.projectType;

  const categories = CATEGORIES_BY_PROJECT_TYPE[projectType] ?? [];

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
          <ProjectCategoryForm
            mode="create"
            projectId={projectId}
            projectType={projectType}
          />
        </section>
        <strong>Category Inventory</strong>
        <article>
          {categories.map((category) =>
            data.entities
              .filter((e) => e.name === category)
              .map((entity) => (
                <ProjectCollapse
                  key={entity.uuid}
                  title={entity.value.title}
                  entityName={entity.name}
                >
                  <CategoryDetail
                    description={entity.value.description}
                    entityUuid={entity.uuid}
                    projectId={projectId}
                    projectType={projectType}
                  />
                </ProjectCollapse>
              ))
          )}
        </article>
      </Modal>
    </>
  );
};
