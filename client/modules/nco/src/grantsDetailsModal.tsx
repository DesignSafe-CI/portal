import { TNcoGrantsItem } from '@client/hooks';
import { Modal } from 'antd';
import React, { useEffect, useState } from 'react';

export const GrantsDetailsModal: React.FC<{
    record: TNcoGrantsItem;
}> = ({ record }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const showModal = () => setIsModalOpen(true);
    const handleClose = () => setIsModalOpen(false);

    return (
        <Modal
        open={isModalOpen}
        onCancel={handleClose}
        width="80%"
        title={<h2>Grant Details</h2>}
        footer={null}
        >
            <div>
                <div>Title: {record.Title}</div>
                <div>Award Number:
                    <a href={`https://www.nsf.gov/awardsearch/showAward?AWD_ID=${record.AwardNumber}`}>
                        {record.AwardNumber}
                    </a>
                </div>
                <div>Start Date: {new Date(record.StartDate.$date).toISOString().split('T')[0]}</div>
                <div>End Date: {new Date(record.EndDate.$date).toISOString().split('T')[0]}</div>
                <div>PI: {record.PiName}</div>
                {record.CoPiNames && (
                    <div>Co-PI(s): {record.CoPiNames}</div>
                )}
                <div>Grant Org: {record.Org}</div>
                <div>NHERI Facility:
                    {record.NheriFacility
                        ? record.NheriFacility
                        : 'No Facility Listed'
                    }
                </div>
                <div>Hazard Type: {record.Hazard}</div>
                <div>Grant Type: {record.Type}</div>
                <div>Keywords:
                    {record.Subjects}
                </div>
            </div>
            <hr />
            <div>
                Abstract:
                <br />
                {record.Abstract}
            </div>
        </Modal>
    )
}