import "server-only";
import { connectDB } from "@/lib/db";
import { assertAcceptedAssignment, assertAssigned } from "@/features/assignments/assignment.service";
import { transitionBooking } from "@/features/bookings/status.service";
import { Booking } from "@/models/Booking";
import { Diagnosis } from "@/models/Diagnosis";
import { Notification } from "@/models/Notification";
import { Quotation } from "@/models/Quotation";
import { BusinessRuleError, NotFoundError } from "@/lib/errors";
import { canStartRepair } from "./start-repair.rules";

export async function startRepair(bookingId:string,technicianId:string){
  await connectDB();await assertAssigned(bookingId,technicianId);await assertAcceptedAssignment(bookingId,technicianId);
  const[booking,diagnosis,approvedQuotation]=await Promise.all([
    Booking.findById(bookingId).populate("serviceIds"),Diagnosis.exists({bookingId,status:{$in:["SUBMITTED","APPROVED"]}}),Quotation.exists({bookingId,status:"APPROVED"}),
  ]);
  if(!booking)throw new NotFoundError("Booking not found");
  const services=booking.serviceIds as any[],requiresQuotationApproval=!services.length||services.some(service=>!service||service.requiresQuotationApproval!==false);
  const decision=canStartRepair({bookingStatus:booking.status,assignmentAccepted:true,hasSubmittedDiagnosis:Boolean(diagnosis),requiresQuotationApproval,hasApprovedQuotation:Boolean(approvedQuotation)});
  if(!decision.allowed)throw new BusinessRuleError(decision.reason);
  if(decision.bypass)await transitionBooking(bookingId,"APPROVED",technicianId,"Fixed-price service does not require quotation approval");
  const repaired=await transitionBooking(bookingId,"REPAIRING",technicianId,"Repair started");
  try{await Notification.create({userId:booking.customerId,bookingId,type:"REPAIR_STARTED",title:"Repair started",message:`Repair work has started for ${booking.reference}.`})}catch(error){console.error("Repair started but customer notification failed",error)}
  return repaired;
}
