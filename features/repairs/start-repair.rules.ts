export function canStartRepair(input:{bookingStatus:string;assignmentAccepted:boolean;hasSubmittedDiagnosis:boolean;requiresQuotationApproval:boolean;hasApprovedQuotation:boolean}){
  if(!input.assignmentAccepted)return{allowed:false,reason:"Accept the assignment before starting repair"};
  if(!input.hasSubmittedDiagnosis)return{allowed:false,reason:"A submitted diagnosis is required"};
  if(input.bookingStatus==="APPROVED")return input.hasApprovedQuotation||!input.requiresQuotationApproval?{allowed:true as const,bypass:false}:{allowed:false,reason:"An approved quotation is required"};
  if(input.bookingStatus==="AWAITING_APPROVAL"&&!input.requiresQuotationApproval)return{allowed:true as const,bypass:true};
  return{allowed:false,reason:"The booking is not approved for repair"};
}
