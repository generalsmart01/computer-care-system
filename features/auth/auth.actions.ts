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
  return signIn(form, ["CUSTOMER"], "/dashboard");
}
async function signIn(form: FormData, roles: string[], destination: string): Promise<ActionState> {
  try {
    await auth.login(Object.fromEntries(form), roles);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Login failed" };
  }
  redirect(destination);
}
export async function adminLoginAction(_s: ActionState, form: FormData): Promise<ActionState> {
  return signIn(form, ["ADMIN", "SUPER_ADMIN"], "/admin");
}
export async function technicianLoginAction(_s: ActionState, form: FormData): Promise<ActionState> {
  return signIn(form, ["TECHNICIAN"], "/technician");
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
  redirect("/login/technician?onboardingComplete=1");
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
  redirect("/login/admin?onboardingComplete=1");
}
export async function logoutAction() {
  await auth.logout();
  redirect("/");
}
