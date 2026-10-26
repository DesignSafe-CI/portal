import React from "react";
import { TUserTicket } from "@client/hooks";

export const UserTickets = ({ userTickets }: { userTickets: TUserTicket[] | undefined}) => {
    
    return (
        <div className="col-sm-6">
            <div className="panel panel-default">
                <div className="panel-heading clearfix dashboard">
                    <h3 className="panel-title pull-left">My Tickets</h3>
                    <a className="button btn-xs btn-primary pull-right" href="/help/tickets"> Create New </a>
                </div>
                <ul className="list-group">
                    {userTickets?.map((ticket) => 
                        <li className="list-group-item">
                            <a href={`/help/tickets/${ticket.id}`}>
                                {ticket.id}
                            </a> 
                            {ticket.Subject}
                        </li>
                    )}
                </ul>
            </div>
        </div>
    )
}