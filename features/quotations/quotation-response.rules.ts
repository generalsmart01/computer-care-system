export function canRespondToQuotation(input:{quotationStatus:string;bookingStatus:string;validUntil:Date;approve:boolean}){
  if(input.quotationStatus!=="PENDING")return{allowed:false,reason:"Quotation is no longer pending"};
  if(input.bookingStatus!=="AWAITING_APPROVAL")return{allowed:false,reason:"Booking is no longer awaiting quotation approval"};
  if(input.approve&&input.validUntil<=new Date())return{allowed:false,reason:"Quotation has expired"};
  return{allowed:true as const};
}
