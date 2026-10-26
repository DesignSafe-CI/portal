export type TUserUsage = {
    total_storage_bytes: number;
}

export type TUserTicket = {
    id: number;
    Subject: string;
}

type TUserNotificationExtra = {
    name: string;
    owner: string;
    status: string;
    uuid: string;
}
export type TUserNotification = {
    action_link: string;
    datetime: string;
    deleted: boolean;
    event_type: string;
    extra: TUserNotificationExtra;
    message: string;
    operation: string;
    pk: number;
    read: boolean;
    status: string;
    user: string;
}