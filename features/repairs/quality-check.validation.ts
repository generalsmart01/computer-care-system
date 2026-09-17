import{z}from"zod";
export const qualityCheckSchema=z.object({decision:z.enum(["PASS","FAIL"]),deviceCondition:z.enum(["GOOD","DAMAGED","NEEDS_ATTENTION"]),note:z.string().trim().max(2000).default("")}).superRefine((value,context)=>{if(value.decision==="FAIL"&&value.note.length<5)context.addIssue({code:"custom",path:["note"],message:"A return reason of at least 5 characters is required"})});
