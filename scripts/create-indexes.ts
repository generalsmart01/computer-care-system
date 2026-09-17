import mongoose from "mongoose";
import { Assignment } from "../models/Assignment";
import { AuditLog } from "../models/AuditLog";
import { Booking } from "../models/Booking";
import { BookingStatusHistory } from "../models/BookingStatusHistory";
import { Device } from "../models/Device";
import { Diagnosis } from "../models/Diagnosis";
import { Notification } from "../models/Notification";
import { Quotation } from "../models/Quotation";
import { RepairReport } from "../models/RepairReport";
import { Review } from "../models/Review";
import { Service } from "../models/Service";
import { TechnicianProfile } from "../models/TechnicianProfile";
import { User } from "../models/User";

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri || !/^mongodb(?:\+srv)?:\/\//.test(uri)) throw new Error("A valid MONGODB_URI is required");
  await mongoose.connect(uri, { autoIndex: false });
  try {
    const models = [User, Service, Device, Booking, BookingStatusHistory, AuditLog, TechnicianProfile, Assignment, Diagnosis, Quotation, RepairReport, Notification, Review];
    for (const model of models) { await model.createIndexes(); console.log(`Verified indexes for ${model.modelName}`); }
  } finally { await mongoose.disconnect(); }
}

main().catch(error => { console.error(error instanceof Error ? error.message : "Index creation failed"); process.exit(1); });
