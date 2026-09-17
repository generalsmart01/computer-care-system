"use server";
import{revalidatePath}from"next/cache";import{requireTechnician}from"@/lib/permissions";import{startRepair}from"./start-repair.service";
export type StartRepairState={error?:string;success?:string};
export async function startRepairAction(bookingId:string,_state:StartRepairState,_form:FormData):Promise<StartRepairState>{const technician=await requireTechnician();try{await startRepair(bookingId,technician.id)}catch(error){return{error:error instanceof Error?error.message:"Could not start repair"}}revalidatePath(`/technician/jobs/${bookingId}`);revalidatePath(`/dashboard/bookings/${bookingId}`);return{success:"Repair started"}}
