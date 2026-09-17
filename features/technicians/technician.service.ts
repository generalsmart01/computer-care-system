import "server-only";
import bcrypt from "bcryptjs";
import { randomBytes } from "node:crypto";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import { AuditLog } from "@/models/AuditLog";
import { TechnicianProfile } from "@/models/TechnicianProfile";
import { User } from "@/models/User";
import { ConflictError, NotFoundError } from "@/lib/errors";
import { issueTechnicianInvitation } from "@/features/auth/email-verification.service";
import { EmailVerificationToken } from "@/models/EmailVerificationToken";
import {
  createTechnicianSchema,
  updateTechnicianSchema,
} from "./technician.validation";

function duplicate(error: unknown) {
  return (
    error instanceof mongoose.mongo.MongoServerError && error.code === 11000
  );
}

export async function createTechnician(actorId: string, input: unknown) {
  const data = createTechnicianSchema.parse(input);
  await connectDB();
  if (await User.exists({ email: data.email }))
    throw new ConflictError("An account with this email already exists");
  if (await TechnicianProfile.exists({ employeeNumber: data.employeeNumber }))
    throw new ConflictError("This employee number is already in use");
  let user;
  let profile;
  let audit;
  try {
    user = await User.create({
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      phone: data.phone || undefined,
      passwordHash: await bcrypt.hash(
        randomBytes(48).toString("base64url"),
        12,
      ),
      role: "TECHNICIAN",
      status: "ACTIVE",
      emailVerifiedAt: undefined,
      mustChangePassword: true,
    });
    profile = await TechnicianProfile.create({
      userId: user.id,
      employeeNumber: data.employeeNumber,
      specializations: data.specializations,
      yearsOfExperience: data.yearsOfExperience,
      availabilityStatus: data.availabilityStatus,
      maximumActiveJobs: data.maximumActiveJobs,
      bio: data.bio,
    });
    audit = await AuditLog.create({
      actorId,
      action: "TECHNICIAN_CREATED",
      entityType: "TechnicianProfile",
      entityId: profile.id,
      summary: { userId: user.id, employeeNumber: profile.employeeNumber },
    });
    await issueTechnicianInvitation(user.id);
    return profile;
  } catch (error) {
    if (audit) await AuditLog.deleteOne({ _id: audit.id });
    if (user)
      await EmailVerificationToken.deleteMany({
        userId: user.id,
        purpose: "TECHNICIAN_INVITATION",
      });
    if (profile)
      await TechnicianProfile.deleteOne({ _id: profile.id, userId: user?.id });
    if (user) await User.deleteOne({ _id: user.id, role: "TECHNICIAN" });
    if (duplicate(error))
      throw new ConflictError("The email or employee number is already in use");
    throw error;
  }
}

export async function updateTechnician(
  actorId: string,
  profileId: string,
  input: unknown,
) {
  const data = updateTechnicianSchema.parse(input);
  await connectDB();
  const profile = await TechnicianProfile.findById(profileId);
  if (!profile) throw new NotFoundError("Technician not found");
  if (
    await TechnicianProfile.exists({
      _id: { $ne: profile.id },
      employeeNumber: data.employeeNumber,
    })
  )
    throw new ConflictError("This employee number is already in use");
  try {
    await User.updateOne(
      { _id: profile.userId, role: "TECHNICIAN" },
      {
        $set: {
          firstName: data.firstName,
          lastName: data.lastName,
          phone: data.phone || undefined,
          status: data.status,
        },
      },
    );
    profile.set({
      employeeNumber: data.employeeNumber,
      specializations: data.specializations,
      yearsOfExperience: data.yearsOfExperience,
      availabilityStatus: data.availabilityStatus,
      maximumActiveJobs: data.maximumActiveJobs,
      bio: data.bio,
    });
    await profile.save();
  } catch (error) {
    if (duplicate(error))
      throw new ConflictError("This employee number is already in use");
    throw error;
  }
  await AuditLog.create({
    actorId,
    action: "TECHNICIAN_UPDATED",
    entityType: "TechnicianProfile",
    entityId: profile.id,
    summary: {
      employeeNumber: profile.employeeNumber,
      availabilityStatus: profile.availabilityStatus,
      maximumActiveJobs: profile.maximumActiveJobs,
      status: data.status,
    },
  });
  return profile;
}
