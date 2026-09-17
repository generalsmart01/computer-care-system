import mongoose,{Schema} from "mongoose"; import { BOOKING_STATUSES } from "@/lib/constants";
const schema=new Schema({bookingId:{type:Schema.Types.ObjectId,ref:"Booking",required:true},fromStatus:{type:String,enum:BOOKING_STATUSES},toStatus:{type:String,enum:BOOKING_STATUSES,required:true},changedBy:{type:Schema.Types.ObjectId,ref:"User",required:true},note:String},{timestamps:{createdAt:true,updatedAt:false}});schema.index({bookingId:1,createdAt:1});
export const BookingStatusHistory:mongoose.Model<any>=mongoose.models.BookingStatusHistory||mongoose.model("BookingStatusHistory",schema);
