import { z } from "zod";

const requiredText = z.string().trim().min(1), requiredPort = z.coerce.number().int().min(1).max(65535), optionalText = z.string().trim().optional();

export const environmentSchema = z.object({
  MONGODB_URI: z.string().trim().regex(/^mongodb(?:\+srv)?:\/\//, "Must be a MongoDB connection URI"),
  SESSION_SECRET: z.string().min(32).refine(value => !/replace|change[-_ ]?me|example/i.test(value), "Placeholder secrets are not allowed"),
  APP_URL: z.url(),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  ALLOW_INSECURE_LOCAL_E2E: z.enum(["true", "false"]).optional(),
  EMAIL_HOST: requiredText,
  EMAIL_PORT: requiredPort,
  EMAIL_USER: requiredText,
  EMAIL_PASSWORD: requiredText,
  EMAIL_FROM: requiredText,
  CLOUDINARY_CLOUD_NAME: optionalText,
  CLOUDINARY_API_KEY: optionalText,
  CLOUDINARY_API_SECRET: optionalText,
}).superRefine((value, context) => {
  const cloudinary = [value.CLOUDINARY_CLOUD_NAME, value.CLOUDINARY_API_KEY, value.CLOUDINARY_API_SECRET], configured = cloudinary.filter(Boolean).length;
  const localE2E=value.ALLOW_INSECURE_LOCAL_E2E==="true",safeLocalE2E=localE2E&&/^http:\/\/(?:127\.0\.0\.1|localhost)(?::\d+)?$/.test(value.APP_URL)&&/^mongodb:\/\/127\.0\.0\.1(?::\d+)?\/computer-maintenance-e2e-test(?:\?|$)/.test(value.MONGODB_URI);
  if(localE2E&&!safeLocalE2E)context.addIssue({code:"custom",path:["ALLOW_INSECURE_LOCAL_E2E"],message:"Local E2E override requires loopback APP_URL and the guarded E2E database"});
  if (configured > 0 && configured < cloudinary.length) context.addIssue({ code: "custom", path: ["CLOUDINARY_CLOUD_NAME"], message: "Configure all Cloudinary credentials together" });
  if (value.NODE_ENV === "production") {
    if (!value.APP_URL.startsWith("https://")&&!safeLocalE2E) context.addIssue({ code: "custom", path: ["APP_URL"], message: "Production APP_URL must use HTTPS" });
    if (configured !== cloudinary.length) context.addIssue({ code: "custom", path: ["CLOUDINARY_CLOUD_NAME"], message: "Cloudinary credentials are required in production" });
  }
});

export function parseEnvironment(input: Record<string, unknown>) {
  const parsed = environmentSchema.safeParse(input);
  if (!parsed.success) throw new Error(`Invalid server environment: ${parsed.error.issues.map(issue => `${issue.path.join(".")}: ${issue.message}`).join("; ")}`);
  return parsed.data;
}
