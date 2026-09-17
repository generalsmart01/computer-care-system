import { z } from "zod";
export const MAX_UPLOAD_SIZE = 5 * 1024 * 1024;
export const MAX_UPLOAD_COUNT = 5;
export const ALLOWED_UPLOAD_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
export function validateUpload(file: File) { return z.instanceof(File).refine(f => f.size > 0, "Empty files are not allowed").refine(f => f.size <= MAX_UPLOAD_SIZE, "File exceeds 5 MB").refine(f => (ALLOWED_UPLOAD_TYPES as readonly string[]).includes(f.type), "Unsupported image type").parse(file); }
export function validateUploads(files: File[]) { if (files.length > MAX_UPLOAD_COUNT) throw new Error(`A maximum of ${MAX_UPLOAD_COUNT} images is allowed`); return files.map(validateUpload); }
export function safeFilename(name: string) { return name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-100); }
