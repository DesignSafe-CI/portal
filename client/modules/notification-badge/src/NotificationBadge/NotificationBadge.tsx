import React from "react";
import { Button, Tooltip, Dropdown, ConfigProvider } from 'antd';
import { useGetNotifications, TJobStatusNotification, useDeleteNotifications } from "@client/hooks";
import { ItemType } from "antd/es/menu/interface";
import styles from './NotificationBadge.module.css'


export function NotificationBadge() {

    const { data: userNotifications } = useGetNotifications({});
    const { mutate: deleteNotifications } = useDeleteNotifications();
    const baseItems: ItemType[] = [
        {
            key: 'open-history',
            label:
            <>
                <h3 className="menu-title"></h3>
                <a href="/workspace/history">
                    <h3 className="menu-title pull-right">
                        View all Jobs
                        <i className="glyphicon glyphicon-circle-arrow-right"></i>
                    </h3>
                </a>
            </>,
            className: "notification-heading"
        },
        {
            type: 'divider'
        },
    ];

    const NotifLabel: React.FC<{notif: TJobStatusNotification}> = ({ notif }) => (
        <div className="notification-item" onClick={(e) => e?.stopPropagation()}>
            <a 
                className="content"
                href={`${notif.event_type == 'job' ? '/workspace/history' : notif.event_type == 'data_depot' ? '/data/browser' : ''}`} 
                target={`${notif.event_type === 'interactive_session_ready' ? '_blank' : '_self' }`}
            >
                <dl className="dl-horizontal">
                <dt>
                    {new Date(notif.datetime).toLocaleString("en-US", {
                                year: "numeric",
                                month: "short",
                                day: "numeric"
                            })}<br />
                    {new Date(notif.datetime).toLocaleTimeString([])}
                </dt>
                <dd className="item-info">
                    <span>{notif.message || "Interactive session ready to view."}</span>
                    {notif.extra.path ? 
                        <Tooltip title={`${notif.extra.path}`} >
                            <div id="notif-path">
                                <bdi>{notif.extra.path}</bdi>
                            </div>
                        </Tooltip>
                    : null
                    }
                </dd>
                </dl>
            </a>
            <div className="notif-close-wrapper">
            <Button className="notif-close close" aria-label="Close" onClick={() => deleteNotifications(notif.pk)}>
                <span aria-hidden="true">&times;</span>
            </Button>
            </div>
        </div>
    );

    let notifContents: ItemType[] = userNotifications?.notifs.length === 0 ? 
        [
            {
                key: 'no-notifs',
                label: 'You have no notifications.',
                disabled: true
            }
        ]
    : userNotifications && [...userNotifications.notifs.map((notif) => (
        {
            key: notif.pk,
            label: <NotifLabel notif={notif} />
        }
    )), { 
            key: 'clear',
            label: 
                <h3 
                    className="clear-notifs"
                    onClick={(e) => {
                        deleteNotifications('all');
                        e?.stopPropagation();
                    }} 
                    role="button"
                >
                    Clear all notifications
                </h3> 
    }] || [];
    const items = [...baseItems,...notifContents];

    return (
        <ConfigProvider
            theme={{
            components: {
                Dropdown: {
                    controlItemBgHover: 'transparent', // Removes the gray highlight background
                    controlItemBgActive: 'transparent',
                    paddingBlock: 0, // Removes top & bottom padding of the menu items
                    controlPaddingHorizontal: 0,
                },
            },
            }}
        >
            <Dropdown menu={{ items }} className="btn" trigger={['click']}>
                <Button id="dLabel" className={`${styles["dropdown-toggle-button"]} no-underline-on-hover`} role="button">
                    <i id="notification_bell" role="none" className="fa fa-bell fa-2x"></i>
                    <span id="notification_badge" className={`label label-as-badge ${userNotifications?.unread && userNotifications?.unread > 0 ? 'label-info' : 'label-default'}`} title="Notifications">
                        {userNotifications?.unread}
                    </span>
                    <h3 className="menu-title">Job Status</h3>
                    <div className="arrow-up"></div>
                </Button>
            </Dropdown>
        </ConfigProvider>
    )
}

export default NotificationBadge;