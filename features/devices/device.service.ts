import "server-only";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import { Device } from "@/models/Device";
import { ConflictError, NotFoundError } from "@/lib/errors";
import { deviceSchema } from "./device.validation";

function isDuplicateSerial(error: unknown) {
  return error instanceof mongoose.mongo.MongoServerError && error.code === 11000;
}

export async function listDevices(ownerId: string) {
  await connectDB();
  return Device.find({ ownerId, isActive: true }).select("type brand model createdAt").sort({ createdAt: -1 }).limit(100).lean();
}

export async function createDevice(ownerId: string, input: unknown) {
  await connectDB();
  try { return await Device.create({ ...deviceSchema.parse(input), ownerId }); }
  catch (error) {
    if (isDuplicateSerial(error)) throw new ConflictError("A device with this serial number already exists");
    throw error;
  }
}

export async function updateDevice(ownerId: string, id: string, input: unknown) {
  await connectDB();
  try {
    const device = await Device.findOneAndUpdate(
      { _id: id, ownerId, isActive: true },
      deviceSchema.parse(input),
      { new: true, runValidators: true },
    );
    if (!device) throw new NotFoundError("Active device not found");
    return device;
  } catch (error) {
    if (isDuplicateSerial(error)) throw new ConflictError("A device with this serial number already exists");
    throw error;
  }
}

export async function deactivateDevice(ownerId: string, id: string) {
  await connectDB();
  const device = await Device.findOneAndUpdate({ _id: id, ownerId, isActive: true }, { isActive: false }, { new: true });
  if (!device) throw new NotFoundError("Active device not found");
  return device;
}
