import React from 'react';
import { Layout } from 'antd';
import { NcoGrantsListing } from '@client/nco';

export const NCOGrantsLayout: React.FC = () => {
    return (
        <Layout>
            <NcoGrantsListing />
        </Layout>
    )
};