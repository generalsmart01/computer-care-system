import "server-only";
import mongoose from "mongoose";
import { getEnv } from "@/lib/env";
type Cache = { connection: typeof mongoose | null; promise: Promise<typeof mongoose> | null };
const globalForMongoose = globalThis as typeof globalThis & { mongooseCache?: Cache };
const cache = globalForMongoose.mongooseCache ??= { connection: null, promise: null };
export async function connectDB() { if (cache.connection) return cache.connection; const env=getEnv();cache.promise ??= mongoose.connect(env.MONGODB_URI, { bufferCommands: false, autoIndex: env.NODE_ENV !== "production" }).catch(error => { cache.promise = null; throw new Error("Unable to connect to MongoDB", { cause: error }); }); cache.connection = await cache.promise; return cache.connection; }
