import React from 'react';
import { PreviewModal } from './PreviewModal';

export type TModalChildren = (props: {
  onClick: React.MouseEventHandler<HTMLElement>;
}) => React.ReactElement;

const DatafilesModal = () => <span>Data Files Modal Root</span>;

DatafilesModal.Preview = PreviewModal;

export default DatafilesModal;
