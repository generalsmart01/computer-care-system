import "server-only";
import mongoose from "mongoose";
import { getEnv } from "@/lib/env";

type Cache = {
  connection: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
};
type ConnectionFailure = {
  name?: string;
  code?: string;
  cause?: { code?: string };
  reason?: {
    type?: string;
    servers?: Map<string, {
      error?: { name?: string; code?: string; cause?: { code?: string } };
    }>;
  };
};

const globalForMongoose = globalThis as typeof globalThis & { mongooseCache?: Cache };
const cache = globalForMongoose.mongooseCache ??= { connection: null, promise: null };

export async function connectDB() {
  if (cache.connection) return cache.connection;
  const env = getEnv();
  cache.promise ??= mongoose.connect(env.MONGODB_URI, {
    bufferCommands: false,
    autoIndex: env.NODE_ENV !== "production",
  }).catch((error: unknown) => {
    cache.promise = null;
    const failure = error as ConnectionFailure;
    // Keep credentials and the URI out of logs; error codes are enough to triage.
    console.error("MongoDB connection failed", {
      name: failure?.name,
      code: failure?.code ?? failure?.cause?.code,
      topology: failure?.reason?.type,
      servers: failure?.reason?.servers
        ? [...failure.reason.servers.values()].map(server => ({
            name: server.error?.name,
            code: server.error?.code ?? server.error?.cause?.code,
          }))
        : undefined,
    });
    throw new Error("Unable to connect to MongoDB", { cause: error });
  });
  cache.connection = await cache.promise;
  return cache.connection;
}
