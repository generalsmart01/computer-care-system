"use server";
import { redirect } from "next/navigation";
import * as auth from "./auth.service";
import { resendEmailVerification } from "./email-verification.service";
export type ActionState = { error?: string };
export async function registerAction(
  _s: ActionState,
  form: FormData,
): Promise<ActionState> {
  try {
    await auth.register(Object.fromEntries(form));
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Registration failed" };
  }
  redirect("/verify-email?sent=1");
}
export async function loginAction(
  _s: ActionState,
  form: FormData,
): Promise<ActionState> {
  let role;
  try {
    const result = await auth.login(Object.fromEntries(form));
    role = result.role;
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Login failed" };
  }
  redirect(
    role === "ADMIN" || role === "SUPER_ADMIN"
      ? "/admin"
      : role === "TECHNICIAN"
        ? "/technician"
        : "/dashboard",
  );
}
export async function resendVerificationAction(
  _s: ActionState,
  form: FormData,
): Promise<ActionState & { success?: string }> {
  try {
    await resendEmailVerification(form.get("email"));
    return {
      success:
        "If an unverified customer account exists, a new verification email has been sent.",
    };
  } catch (e) {
    return {
      error:
        e instanceof Error ? e.message : "Unable to resend verification email",
    };
  }
}
export async function changePasswordAction(
  _s: ActionState,
  form: FormData,
): Promise<ActionState> {
  const { requireCustomer } = await import("@/lib/permissions");
  try {
    const user = await requireCustomer();
    await auth.changePassword(user.id, Object.fromEntries(form));
  } catch (e) {
    return {
      error: e instanceof Error ? e.message : "Unable to change password",
    };
  }
  await auth.logout();
  redirect("/login?passwordChanged=1");
}
export async function technicianOnboardingAction(
  _s: ActionState,
  form: FormData,
): Promise<ActionState> {
  try {
    const { completeTechnicianInvitation } =
      await import("./email-verification.service");
    await completeTechnicianInvitation(Object.fromEntries(form));
  } catch (e) {
    return {
      error: e instanceof Error ? e.message : "Unable to complete onboarding",
    };
  }
  redirect("/login?onboardingComplete=1");
}
export async function administratorOnboardingAction(
  _s: ActionState,
  form: FormData,
): Promise<ActionState> {
  try {
    const { completeAdministratorInvitation } =
      await import("./email-verification.service");
    await completeAdministratorInvitation(Object.fromEntries(form));
  } catch (e) {
    return {
      error: e instanceof Error ? e.message : "Unable to complete onboarding",
    };
  }
  redirect("/login?onboardingComplete=1");
}
export async function logoutAction() {
  await auth.logout();
  redirect("/");
}
