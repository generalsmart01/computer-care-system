import{z}from"zod";
const dateText=z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().or(z.literal(""));
export const reportQuerySchema=z.object({dateFrom:dateText,dateTo:dateText}).superRefine((value,context)=>{if(value.dateFrom&&value.dateTo&&value.dateFrom>value.dateTo)context.addIssue({code:"custom",path:["dateTo"],message:"End date must be on or after start date"})});
export type ReportQuery=z.infer<typeof reportQuerySchema>;
export function buildReportDateMatch(query:ReportQuery){const createdAt:Record<string,Date>={};if(query.dateFrom)createdAt.$gte=new Date(`${query.dateFrom}T00:00:00.000Z`);if(query.dateTo)createdAt.$lte=new Date(`${query.dateTo}T23:59:59.999Z`);return Object.keys(createdAt).length?{createdAt}:{} }
export const ACTIVE_REPAIR_STATUSES=["ASSIGNED","DIAGNOSING","AWAITING_APPROVAL","APPROVED","REPAIRING","QUALITY_CHECK","READY_FOR_COLLECTION"]as const;
