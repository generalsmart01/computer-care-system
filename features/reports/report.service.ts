import "server-only";
import { connectDB } from "@/lib/db";
import { Assignment } from "@/models/Assignment";
import { Booking } from "@/models/Booking";
import { Diagnosis } from "@/models/Diagnosis";
import { TechnicianProfile } from "@/models/TechnicianProfile";
import { ACTIVE_REPAIR_STATUSES, buildReportDateMatch, reportQuerySchema } from "./report.validation";

export async function getAdminReports(input: unknown) {
  const query = reportQuerySchema.parse(input), dateMatch = buildReportDateMatch(query);
  await connectDB();
  const [bookingResults, faultCategories, workload, completedJobs, availableResult] = await Promise.all([
    Booking.aggregate([
      { $match: dateMatch },
      { $facet: {
        summary: [{ $group: { _id: null, total: { $sum: 1 }, pending: { $sum: { $cond: [{ $eq: ["$status", "PENDING"] }, 1, 0] } }, activeRepairs: { $sum: { $cond: [{ $in: ["$status", ACTIVE_REPAIR_STATUSES] }, 1, 0] } }, completed: { $sum: { $cond: [{ $eq: ["$status", "COMPLETED"] }, 1, 0] } }, cancelled: { $sum: { $cond: [{ $eq: ["$status", "CANCELLED"] }, 1, 0] } } } }],
        byMonth: [{ $group: { _id: { $dateToString: { format: "%Y-%m", date: "$createdAt", timezone: "UTC" } }, count: { $sum: 1 } } }, { $sort: { _id: 1 } }],
        byStatus: [{ $group: { _id: "$status", count: { $sum: 1 } } }, { $sort: { count: -1, _id: 1 } }],
        topServices: [{ $unwind: "$serviceIds" }, { $group: { _id: "$serviceIds", count: { $sum: 1 } } }, { $sort: { count: -1 } }, { $limit: 10 }, { $lookup: { from: "services", localField: "_id", foreignField: "_id", as: "service" } }, { $set: { name: { $ifNull: [{ $first: "$service.name" }, "Unknown service"] } } }, { $project: { service: 0 } }],
        completion: [{ $match: { status: "COMPLETED", handoverAt: { $type: "date" } } }, { $group: { _id: null, averageMilliseconds: { $avg: { $subtract: ["$handoverAt", "$createdAt"] } }, count: { $sum: 1 } } }],
      } },
    ]),
    Diagnosis.aggregate([{ $match: { status: { $in: ["SUBMITTED", "APPROVED"] }, faultCategory: { $nin: [null, ""] }, ...dateMatch } }, { $group: { _id: "$faultCategory", count: { $sum: 1 } } }, { $sort: { count: -1, _id: 1 } }, { $limit: 10 }]),
    TechnicianProfile.aggregate([{ $lookup: { from: "users", localField: "userId", foreignField: "_id", as: "user" } }, { $set: { user: { $first: "$user" } } }, { $match: { "user.role": "TECHNICIAN" } }, { $project: { name: { $concat: ["$user.firstName", " ", "$user.lastName"] }, employeeNumber: 1, availabilityStatus: 1, activeJobCount: 1, maximumActiveJobs: 1 } }, { $sort: { activeJobCount: -1, name: 1 } }]),
    Assignment.aggregate([{ $match: { status: "COMPLETED", ...dateMatch } }, { $group: { _id: "$technicianId", completedJobs: { $sum: 1 } } }, { $lookup: { from: "users", localField: "_id", foreignField: "_id", as: "user" } }, { $set: { user: { $first: "$user" } } }, { $project: { name: { $concat: ["$user.firstName", " ", "$user.lastName"] }, completedJobs: 1 } }, { $sort: { completedJobs: -1, name: 1 } }]),
    TechnicianProfile.aggregate([{ $match: { availabilityStatus: "AVAILABLE" } }, { $lookup: { from: "users", localField: "userId", foreignField: "_id", as: "user" } }, { $match: { user: { $elemMatch: { role: "TECHNICIAN", status: "ACTIVE" } } } }, { $count: "count" }]),
  ]);
  const bookingReport = bookingResults[0] || {}, summary = bookingReport.summary?.[0] || { total: 0, pending: 0, activeRepairs: 0, completed: 0, cancelled: 0 }, completion = bookingReport.completion?.[0], averageMilliseconds = completion?.averageMilliseconds || 0;
  return { query, summary: { ...summary, availableTechnicians: availableResult[0]?.count || 0 }, byMonth: bookingReport.byMonth || [], byStatus: bookingReport.byStatus || [], topServices: bookingReport.topServices || [], faultCategories, averageCompletionHours: averageMilliseconds / 3_600_000, completedForAverage: completion?.count || 0, workload, completedJobs };
}
