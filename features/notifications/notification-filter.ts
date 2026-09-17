export type NotificationFilter="all"|"unread";
export function parseNotificationFilter(value:unknown):NotificationFilter{return value==="unread"?"unread":"all"}
export function buildNotificationFilter(userId:string,filter:NotificationFilter){return filter==="unread"?{userId,readAt:null}:{userId}}
