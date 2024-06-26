import React, { useState } from 'react';
import { TModalChildren } from '../../DatafilesModal/DatafilesModal';
import { Button, Modal } from 'antd';
import {
  TBaseProjectValue,
  TEntityValue,
  useCreateEntity,
  useDeleteEntity,
  useNotifyContext,
  usePatchEntityMetadata,
  useProjectDetail,
} from '@client/hooks';
import { CATEGORIES_BY_PROJECT_TYPE } from '../constants';
import { ProjectCollapse } from '../ProjectCollapser/ProjectCollapser';
import { ProjectCategoryForm } from '../forms/ProjectCategoryForm';
import { SubEntityDetails } from '../SubEntityDetails';

const CategoryDetail: React.FC<{
  value: TEntityValue;
  projectType: TBaseProjectValue['projectType'];
  projectId: string;
  entityUuid: string;
}> = ({ value, projectId, projectType, entityUuid }) => {
  const [showForm, setShowForm] = useState(false);
  const { mutate: patchEntityMeta } = usePatchEntityMetadata();
  const { mutate: deleteEntity } = useDeleteEntity();

  const { notifyApi } = useNotifyContext();

  const onSuccess = () => {
    setShowForm(false);
    notifyApi?.open({
      type: 'success',
      message: '',
      description: 'Metadata has been updated successfully.',
      placement: 'bottomLeft',
    });
  };
  return (
    <>
      <section>
        <SubEntityDetails entityValue={value} />
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
          <ProjectCategoryForm
            projectType={projectType}
            projectId={projectId}
            entityUuid={entityUuid}
            mode="edit"
            onSubmit={(v: { name: string; value: Record<string, unknown> }) => {
              console.log(v);
              patchEntityMeta(
                { entityUuid, patchMetadata: v.value },
                { onSuccess }
              );
            }}
          />
        </section>
      )}
    </>
  );
};

export const ManageCategoryModal: React.FC<{
  projectId: string;
  editOnly?: boolean;
  children: TModalChildren;
}> = ({ projectId, editOnly = false, children }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { data } = useProjectDetail(projectId);
  const showModal = () => setIsModalOpen(true);
  const handleClose = () => {
    setIsModalOpen(false);
  };

  const { mutate } = useCreateEntity(projectId);

  const { notifyApi } = useNotifyContext();

  const onSuccess = () => {
    notifyApi?.open({
      type: 'success',
      message: '',
      description: 'A new metadata record has been created.',
      placement: 'bottomLeft',
    });
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
        {!editOnly && (
          <section style={{ backgroundColor: '#f5f5f5', padding: '20px' }}>
            <ProjectCategoryForm
              mode="create"
              projectId={projectId}
              projectType={projectType}
              onSubmit={(v: { name: string; value: Record<string, unknown> }) =>
                mutate({ formData: v }, { onSuccess })
              }
            />
          </section>
        )}
        <article style={{ marginTop: '5px' }}>
          <strong>Category Inventory</strong>
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
                    value={entity.value}
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
