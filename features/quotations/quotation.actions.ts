"use server";
import { revalidatePath } from "next/cache";
import { requireAdmin, requireTechnician } from "@/lib/permissions";
import { parseQuotationItems } from "./quotation-builder.validation";
import { buildQuotation } from "./quotation-builder.service";

export type QuotationActionState={error?:string;success?:string};
function input(form:FormData){return{diagnosisId:String(form.get("diagnosisId")||""),validUntil:new Date(`${String(form.get("validUntil")||"")}T23:59:59.999Z`),discount:form.get("discount"),items:parseQuotationItems(String(form.get("items")||"[]"))}}
async function run(actor:{id:string;role:"TECHNICIAN"|"ADMIN"},bookingId:string,form:FormData):Promise<QuotationActionState>{try{await buildQuotation(actor,bookingId,input(form))}catch(error){return{error:error instanceof Error?error.message:"Could not create quotation"}}revalidatePath(`/technician/jobs/${bookingId}`);revalidatePath(`/admin/bookings/${bookingId}`);revalidatePath(`/dashboard/bookings/${bookingId}`);return{success:"Quotation sent to customer"}}
export async function technicianQuotationAction(bookingId:string,_state:QuotationActionState,form:FormData){const actor=await requireTechnician();return run({id:actor.id,role:"TECHNICIAN"},bookingId,form)}
export async function adminQuotationAction(bookingId:string,_state:QuotationActionState,form:FormData){const actor=await requireAdmin();return run({id:actor.id,role:"ADMIN"},bookingId,form)}
