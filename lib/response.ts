import { AppError } from "@/lib/errors";
export function ok<T>(data: T, status=200) { return Response.json({ success: true, data }, { status }); }
export function errorResponse(error: unknown) { if (error instanceof AppError) return Response.json({ success:false, error:{ code:error.code, message:error.message, details:error.details } }, { status:error.statusCode }); console.error(error); return Response.json({ success:false, error:{ code:"INTERNAL_ERROR", message:"An unexpected error occurred" } }, { status:500 }); }
