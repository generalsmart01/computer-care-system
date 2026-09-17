export type LifecycleEmailEvent =
  | "BOOKING_CONFIRMED"
  | "QUOTATION_READY"
  | "READY_FOR_COLLECTION"
  | "BOOKING_COMPLETED";
const titles: Record<LifecycleEmailEvent, string> = {
  BOOKING_CONFIRMED: "Booking confirmed",
  QUOTATION_READY: "Quotation ready",
  READY_FOR_COLLECTION: "Device ready for collection",
  BOOKING_COMPLETED: "Repair completed",
};
function escapeHtml(value: string) {
  return value.replace(
    /[&<>"']/g,
    (character) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        character
      ]!,
  );
}
export function verificationEmail(name: string, verificationUrl: string) {
  const safeName = escapeHtml(name),
    safeUrl = escapeHtml(verificationUrl);
  return {
    subject: "Verify your ComputerCare email address",
    text: `Hello ${name},\n\nVerify your email address to activate your customer account:\n${verificationUrl}\n\nThis link expires in 30 minutes. If you did not create this account, you can ignore this message.`,
    html: `<h1>Verify your email address</h1><p>Hello ${safeName},</p><p>Verify your email address to activate your customer account.</p><p><a href="${safeUrl}">Verify email address</a></p><p>This link expires in 30 minutes. If you did not create this account, you can ignore this message.</p>`,
  };
}
export function technicianInvitationEmail(name: string, setupUrl: string) {
  const safeName = escapeHtml(name),
    safeUrl = escapeHtml(setupUrl);
  return {
    subject: "Set up your ComputerCare technician account",
    text: `Hello ${name},\n\nAn administrator created a technician account for you. Verify your email and create your password using this secure link:\n${setupUrl}\n\nThis single-use link expires in 30 minutes. If you were not expecting this invitation, contact your administrator.`,
    html: `<h1>Set up your technician account</h1><p>Hello ${safeName},</p><p>An administrator created a technician account for you. Use the secure link below to verify your email and create your password.</p><p><a href="${safeUrl}">Verify email and create password</a></p><p>This single-use link expires in 30 minutes. If you were not expecting this invitation, contact your administrator.</p>`,
  };
}
export function administratorInvitationEmail(name: string, setupUrl: string) {
  const safeName = escapeHtml(name),
    safeUrl = escapeHtml(setupUrl);
  return {
    subject: "Set up your ComputerCare administrator account",
    text: `Hello ${name},\n\nA super administrator created an administrator account for you. Verify your email and create your password using this secure link:\n${setupUrl}\n\nThis single-use link expires in 30 minutes. If you were not expecting it, contact the super administrator.`,
    html: `<h1>Set up your administrator account</h1><p>Hello ${safeName},</p><p>A super administrator created an administrator account for you. Verify your email and create your password using this secure link.</p><p><a href="${safeUrl}">Verify email and create password</a></p><p>This single-use link expires in 30 minutes.</p>`,
  };
}
export function lifecycleEmail(
  event: LifecycleEmailEvent,
  reference: string,
  bookingUrl: string,
  detail?: string,
) {
  const messages: Record<LifecycleEmailEvent, string> = {
      BOOKING_CONFIRMED: `Your booking ${reference} has been confirmed.`,
      QUOTATION_READY: `A quotation for ${reference} is ready for your review.`,
      READY_FOR_COLLECTION: `${reference} passed quality checking and is ready for collection.`,
      BOOKING_COMPLETED: `${reference} has been handed over and marked complete.`,
    },
    subject = `ComputerCare: ${titles[event]} — ${reference}`,
    text = `${messages[event]}${detail ? ` ${detail}` : ""}\n\nView booking: ${bookingUrl}`,
    html = `<h1>${escapeHtml(titles[event])}</h1><p>${escapeHtml(messages[event])}</p>${detail ? `<p>${escapeHtml(detail)}</p>` : ""}<p><a href="${escapeHtml(bookingUrl)}">View your booking</a></p>`;
  return { subject, text, html };
}
