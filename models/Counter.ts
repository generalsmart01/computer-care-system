import mongoose,{Schema} from "mongoose"; const schema=new Schema({_id:String,sequence:{type:Number,default:0}});
export const Counter:mongoose.Model<any>=mongoose.models.Counter||mongoose.model("Counter",schema);
