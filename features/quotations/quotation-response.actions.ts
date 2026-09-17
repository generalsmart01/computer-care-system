"use server";
import { revalidatePath } from "next/cache";
import { requireCustomer } from "@/lib/permissions";
import { respondToQuotation } from "./response.service";

export type QuotationResponseState={error?:string;success?:string};
export async function quotationResponseAction(quotationId:string,_state:QuotationResponseState,form:FormData):Promise<QuotationResponseState>{const customer=await requireCustomer(),intent=String(form.get("intent")||"");if(intent!=="approve"&&intent!=="reject")return{error:"Choose approve or reject"};let quotation;try{quotation=await respondToQuotation(customer.id,quotationId,{approve:intent==="approve",note:String(form.get("note")||"")||undefined})}catch(error){return{error:error instanceof Error?error.message:"Could not record quotation response"}}revalidatePath(`/dashboard/bookings`);revalidatePath(`/dashboard/bookings/${quotation.bookingId}`);return{success:intent==="approve"?"Quotation approved":"Quotation rejected; the administrator can now review or revise it"}}
