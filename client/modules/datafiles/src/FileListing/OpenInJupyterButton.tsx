import React, { useMemo, useState } from 'react';
//import styles from './FileListing.module.css';
import { Button } from 'antd';
import { TFileListing, useAuthenticatedUser } from '@client/hooks';

export function OpenInJupyterButton({ file }: { file: TFileListing }) {
  const { user } = useAuthenticatedUser();
  const systemPathAlias = {
    'designsafe.storage.community': 'CommunityData',
    'designsafe.storage.published': 'NHERI-Published',
  }[file.system];

  const path =
    file.system === 'designsafe.storage.published'
      ? file.path.replace('/published-data', '')
      : file.path;

  if (!user || !systemPathAlias || !file.path.endsWith('.ipynb')) return null;

  const jupyterLink = `https://jupyter.designsafe-ci.org/user/${
    user.username
  }/lab/tree/${systemPathAlias}/${encodeURIComponent(path)}`;
  return (
    <Button
      size="small"
      style={{ marginLeft: '1rem', textDecoration: 'none' }}
      type="default"
      href={jupyterLink}
      target="_blank"
      rel="noopener noreferrer"
    >
      Open in Jupyter
      <i className="fa fa-external-link" />
    </Button>
  );
}
