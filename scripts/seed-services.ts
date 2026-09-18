import mongoose from "mongoose";
import { loadEnvConfig } from "@next/env";
import { Service } from "../models/Service";
import { CARE_SERVICES } from "../lib/care-service-catalog";

loadEnvConfig(process.cwd(), process.env.NODE_ENV !== "production");

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI is required in .env.local or the environment");
  await mongoose.connect(uri);
  try {
    const result = await Service.bulkWrite(CARE_SERVICES.map(service => ({
      updateOne: {
        filter: { slug: service.slug },
        update: { $setOnInsert: service },
        upsert: true,
      },
    })));
    console.log(`Seeded ${result.upsertedCount} new care services into database "${mongoose.connection.name}"; ${CARE_SERVICES.length - result.upsertedCount} already existed.`);
  } finally {
    await mongoose.disconnect();
  }
}

main().catch(error => {
  console.error("Care service seed failed:", error instanceof Error ? error.name : "Unknown error");
  process.exitCode = 1;
});
