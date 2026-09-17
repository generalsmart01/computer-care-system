import "server-only";
import { z } from "zod";
import { connectDB } from "@/lib/db";
import { transitionBooking } from "@/features/bookings/status.service";
import { AuditLog } from "@/models/AuditLog";
import { Assignment } from "@/models/Assignment";
import { Booking } from "@/models/Booking";
import { Notification } from "@/models/Notification";
import { Quotation } from "@/models/Quotation";
import { BusinessRuleError, ConflictError, NotFoundError } from "@/lib/errors";
import { canRespondToQuotation } from "./quotation-response.rules";

const responseSchema=z.object({approve:z.boolean(),note:z.string().trim().max(1000).optional()}).strict();
export async function respondToQuotation(customerId:string,quotationId:string,input:unknown){
  const data=responseSchema.parse(input);await connectDB();
  const quotation=await Quotation.findById(quotationId);if(!quotation)throw new NotFoundError("Quotation not found");
  const booking=await Booking.findOne({_id:quotation.bookingId,customerId});if(!booking)throw new NotFoundError("Quotation not found");
  const decision=canRespondToQuotation({quotationStatus:quotation.status,bookingStatus:booking.status,validUntil:quotation.validUntil,approve:data.approve});if(!decision.allowed)throw new BusinessRuleError(decision.reason);
  const status=data.approve?"APPROVED":"REJECTED",responded=await Quotation.findOneAndUpdate({_id:quotationId,status:"PENDING"},{$set:{status,customerResponseNote:data.note||undefined}},{new:true});if(!responded)throw new ConflictError("Quotation has already been answered");
  let audit;
  try{
    audit=await AuditLog.create({actorId:customerId,action:`QUOTATION_${status}`,entityType:"Quotation",entityId:responded.id,summary:{bookingId:booking.id,version:responded.version,noteSupplied:Boolean(data.note)}});
    if(data.approve)await transitionBooking(booking.id,"APPROVED",customerId,"Quotation approved");
  }catch(error){if(audit)await AuditLog.deleteOne({_id:audit.id,actorId:customerId});await Quotation.updateOne({_id:responded.id,status},{$set:{status:"PENDING"},$unset:{customerResponseNote:1}});throw error}
  const assignment=await Assignment.findOne({bookingId:booking.id,status:"ACTIVE"}).select("technicianId assignedBy").lean();
  if(assignment){const recipients=[String((assignment as any).technicianId),String((assignment as any).assignedBy)].filter((id,index,all)=>id&&all.indexOf(id)===index);try{await Notification.insertMany(recipients.map(userId=>({userId,bookingId:booking.id,type:`QUOTATION_${status}`,title:`Quotation ${status.toLowerCase()}`,message:`The customer ${data.approve?"approved":"rejected"} quotation v${responded.version} for ${booking.reference}.`})))}catch(error){console.error("Quotation response saved but notification failed",error)}}
  return responded;
}
