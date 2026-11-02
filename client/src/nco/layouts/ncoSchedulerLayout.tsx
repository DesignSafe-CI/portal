import React from 'react';
import { Layout } from 'antd';
import { NcoSchedListing } from '@client/nco';

export const NCOSchedLayout: React.FC = () => {
    return (
        <Layout>
            <NcoSchedListing />
        </Layout>
    )
};