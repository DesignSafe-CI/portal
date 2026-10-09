import { TNcoGrantsItem, useNcoGrantsListing } from '@client/hooks';
import { Table, TableColumnsType, Button, Modal } from 'antd';
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { GrantsDetailsModal } from './grantsDetailsModal';

export const NcoGrantsListing: React.FC = () => {
    const { data, isLoading } = useNcoGrantsListing();
    const [currentPage, setCurrentPage] = useState<number>(1);

    const [open, setOpen] = useState(false);
    const [modaldata, setmodaldata] = useState<string>('');
    const showModal = (record: string) => {
        setmodaldata(record);
        setOpen(true);
    }

    const columns: TableColumnsType<TNcoGrantsItem> = [
        {
            render: (_, record) => record.AwardNumber,
            title: 'Award Number',
        },
        {
            render: (_, record) => record.Title,
            title: 'Title',
        },
        {
            render: (_, record) => new Date(record.EndDate.$date).toISOString().split('T')[0],
            title: 'End Date',
        },
        {
            render: (_, record) => 
                record.CoPiNames
                ? `${record.PiName} / ${record.CoPiNames}`
                : record.PiName,
            title: 'PI / Co-PI',
        },
        {
            render: (_, record) => record.Org,
            title: 'Grant Org',
        },
        {
            render: (_, record) =>
                record.NheriFacility
                ? record.NheriFacility
                : 'No Facility Listed',
            title: 'NHERI Facility',
        },
        {
            render: (_, record) =>
                <Button 
                    type="primary"
                    onClick={() => <GrantsDetailsModal record={record}/>}
                >
                    View Details
                </Button>,
            title: 'Details',
        },
    ];

    return (
        <>
            <Table
                dataSource={data ? data.response: []}
                loading={isLoading}
                columns={columns}
            ></Table>
        </>
    )
}