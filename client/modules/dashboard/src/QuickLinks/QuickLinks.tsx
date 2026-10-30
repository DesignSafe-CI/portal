import React from 'react';

export const QuickLinks = () => {
  return (
    <div className="col-sm-6">
      <div>
        {' '}
        <span> Quick Links </span>{' '}
      </div>
      <div>
        <a href="/account"> Manage Account </a>{' '}
      </div>
      <div>
        {' '}
        <a href="/data/browser"> Data Depot </a>{' '}
      </div>
      <div>
        {' '}
        <a href="/workspace"> Tools & Applications </a>{' '}
      </div>
      <div>
        {' '}
        <a href="/recon-portal"> Recon Portal </a>{' '}
      </div>
      <div>
        {' '}
        <a href="/learning-center/overview"> Training </a>{' '}
      </div>
    </div>
  );
};
