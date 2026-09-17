"use server";import{revalidatePath}from"next/cache";import{requireCustomer}from"@/lib/permissions";import{markAllNotificationsRead,markNotificationRead}from"./notification.service";
export async function markNotificationReadAction(notificationId:string){const user=await requireCustomer();await markNotificationRead(user.id,notificationId);revalidatePath("/dashboard/notifications")}
export async function markAllNotificationsReadAction(){const user=await requireCustomer();await markAllNotificationsRead(user.id);revalidatePath("/dashboard/notifications")}
