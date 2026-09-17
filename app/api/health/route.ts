import{ok}from"@/lib/response";import{connectDB}from"@/lib/db";
export const dynamic="force-dynamic";
export async function GET(){try{const database=await connectDB(),native=database.connection.db;if(!native)throw new Error("Database unavailable");await native.admin().ping();return ok({status:"ok",architecture:"nextjs-modular-monolith",database:"connected"})}catch{return Response.json({success:false,data:{status:"unavailable",architecture:"nextjs-modular-monolith",database:"disconnected"}},{status:503})}}
