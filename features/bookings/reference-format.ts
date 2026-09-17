export function formatBookingReference(year:number,sequence:number){return `CMB-${year}-${String(sequence).padStart(6,"0")}`}
