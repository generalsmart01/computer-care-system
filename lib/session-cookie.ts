export function sessionCookieOptions(nodeEnv: "development" | "test" | "production",allowInsecureLocalE2E=false) {
  return { httpOnly: true, sameSite: "lax" as const, secure: nodeEnv === "production"&&!allowInsecureLocalE2E, path: "/", maxAge: 60 * 60 * 24 * 7 };
}
