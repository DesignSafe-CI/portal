import React from "react";
import { TGetNotificationsResponse } from "@client/hooks";

export const UserNotifications = ({ userNotifications }: {userNotifications: TGetNotificationsResponse | undefined}) => {
    return (
        <div className="col-sm-6">
            <div className="panel panel-default">
                <div className="panel-heading dashboard">
                    <h3 className="panel-title">Notifications&nbsp;
                        <span className="badge badge-danger"> { userNotifications?.total } </span>
                    </h3>
                </div>
                <ul className="list-group">
                    {!userNotifications?.notifs.length ? 
                        <li className="list-group-item">
                            No new notifications!
                        </li>
                    :
                    userNotifications.notifs.map((notif) => 
                        <li className="list-group-item">
                            <div className="row">
                                <div className="col-md-4">
                                    <span className="label label-default"> 
                                        {new Date(notif.datetime).toLocaleString("en-US", {
                                            year: "numeric",
                                            month: "short",
                                            day: "numeric"
                                        })}
                                    </span>
                                </div>
                                <div className="col-md-8">
                                    {notif.event_type === 'interactive_session_ready' ? 'Ready to view' : notif.message}
                                </div>
                            </div>
                        </li>
                    )}
            </ul>

            </div>
        </div>

    )
}