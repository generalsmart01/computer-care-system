import "server-only";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import { ConflictError, NotFoundError } from "@/lib/errors";
import { Service } from "@/models/Service";
import { serviceInputSchema } from "./service.validation";

function isDuplicateKey(error: unknown) {
  return error instanceof mongoose.mongo.MongoServerError && error.code === 11000;
}

export async function createService(input: unknown) {
  const data = serviceInputSchema.parse(input);
  await connectDB();
  try {
    return await Service.create(data);
  } catch (error) {
    if (isDuplicateKey(error)) throw new ConflictError("A service with this slug already exists");
    throw error;
  }
}

export async function updateService(serviceId: string, input: unknown) {
  const data = serviceInputSchema.parse(input);
  await connectDB();
  try {
    const service = await Service.findByIdAndUpdate(serviceId, data, { new: true, runValidators: true });
    if (!service) throw new NotFoundError("Service not found");
    return service;
  } catch (error) {
    if (isDuplicateKey(error)) throw new ConflictError("A service with this slug already exists");
    throw error;
  }
}

export async function setServiceActive(serviceId: string, isActive: boolean) {
  await connectDB();
  const service = await Service.findByIdAndUpdate(serviceId, { isActive }, { new: true, runValidators: true });
  if (!service) throw new NotFoundError("Service not found");
  return service;
}
