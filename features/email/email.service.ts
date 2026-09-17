import "server-only";
import nodemailer from "nodemailer";
import { getEnv } from "@/lib/env";
import { User } from "@/models/User";
import { resolveEmailConfig } from "./email.config";
import {
  administratorInvitationEmail,
  lifecycleEmail,
  technicianInvitationEmail,
  verificationEmail,
  type LifecycleEmailEvent,
} from "./email.templates";
export async function sendAdministratorInvitationEmail(
  email: string,
  name: string,
  token: string,
) {
  const environment = getEnv(),
    config = resolveEmailConfig(environment);
  const content = administratorInvitationEmail(
    name,
    `${config.appUrl}/onboarding/administrator?token=${encodeURIComponent(token)}`,
  );
  if (environment.ALLOW_INSECURE_LOCAL_E2E === "true")
    return { sent: true as const };
  const transport = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: config.auth,
  });
  await transport.sendMail({ from: config.from, to: email, ...content });
  return { sent: true as const };
}
export async function sendLifecycleEmail(
  userId: string,
  event: LifecycleEmailEvent,
  bookingId: string,
  reference: string,
  detail?: string,
) {
  const config = resolveEmailConfig(getEnv());
  const user: any = await User.findOne({ _id: userId, status: "ACTIVE" })
    .select("email")
    .lean();
  if (!user?.email)
    return { sent: false, reason: "recipient_unavailable" as const };
  const content = lifecycleEmail(
      event,
      reference,
      `${config.appUrl}/dashboard/bookings/${bookingId}`,
      detail,
    ),
    transport = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: config.auth,
    });
  await transport.sendMail({ from: config.from, to: user.email, ...content });
  return { sent: true as const };
}
export async function sendTechnicianInvitationEmail(
  email: string,
  name: string,
  token: string,
) {
  const environment = getEnv(),
    config = resolveEmailConfig(environment);
  const content = technicianInvitationEmail(
    name,
    `${config.appUrl}/onboarding/technician?token=${encodeURIComponent(token)}`,
  );
  if (environment.ALLOW_INSECURE_LOCAL_E2E === "true")
    return { sent: true as const };
  const transport = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: config.auth,
  });
  await transport.sendMail({ from: config.from, to: email, ...content });
  return { sent: true as const };
}
export async function sendVerificationEmail(
  email: string,
  name: string,
  token: string,
) {
  const environment = getEnv(),
    config = resolveEmailConfig(environment),
    content = verificationEmail(
      name,
      `${config.appUrl}/verify-email?token=${encodeURIComponent(token)}`,
    );
  if (environment.ALLOW_INSECURE_LOCAL_E2E === "true")
    return { sent: true as const };
  const transport = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: config.auth,
  });
  await transport.sendMail({ from: config.from, to: email, ...content });
  return { sent: true as const };
}
