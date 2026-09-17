import { describe, expect, it } from "vitest";
import type { Schema } from "mongoose";
import { User } from "@/models/User";
import { Booking } from "@/models/Booking";
import { Device } from "@/models/Device";
import { Assignment } from "@/models/Assignment";
import { Notification } from "@/models/Notification";
import { Diagnosis } from "@/models/Diagnosis";
import { Quotation } from "@/models/Quotation";
import { EmailVerificationToken } from "@/models/EmailVerificationToken";

type IndexOptions = Record<string, unknown>;

function findIndex(schema: Schema, keys: Record<string, number>) {
  return schema
    .indexes()
    .find(([actual]) => JSON.stringify(actual) === JSON.stringify(keys));
}

function expectIndex(
  schema: Schema,
  keys: Record<string, number>,
  options: IndexOptions = {},
) {
  const index = findIndex(schema, keys);
  expect(index, `missing index ${JSON.stringify(keys)}`).toBeDefined();
  expect(index?.[1]).toMatchObject(options);
}

describe("Phase 61 database index review", () => {
  it("keeps identifiers unique", () => {
    expectIndex(User.schema, { email: 1 }, { unique: true });
    expectIndex(Booking.schema, { reference: 1 }, { unique: true });
    expectIndex(
      EmailVerificationToken.schema,
      { tokenHash: 1 },
      { unique: true },
    );
  });

  it("expires email verification tokens automatically", () => {
    expectIndex(
      EmailVerificationToken.schema,
      { expiresAt: 1 },
      { expireAfterSeconds: 0 },
    );
    expectIndex(EmailVerificationToken.schema, {
      userId: 1,
      purpose: 1,
      usedAt: 1,
    });
  });

  it("supports customer booking history and status/date administration queries", () => {
    expectIndex(Booking.schema, { customerId: 1, createdAt: -1 });
    expectIndex(Booking.schema, { status: 1, preferredDate: 1 });
  });

  it("supports device ownership and optional serial uniqueness", () => {
    expectIndex(Device.schema, { ownerId: 1 });
    expectIndex(
      Device.schema,
      { serialNumber: 1 },
      { unique: true, sparse: true },
    );
  });

  it("supports active assignments by booking and technician", () => {
    expectIndex(Assignment.schema, { technicianId: 1, status: 1 });
    expectIndex(
      Assignment.schema,
      { bookingId: 1, status: 1 },
      {
        unique: true,
        partialFilterExpression: { status: "ACTIVE" },
      },
    );
  });

  it("supports notification inbox and unread queries", () => {
    expectIndex(Notification.schema, { userId: 1, createdAt: -1 });
    expectIndex(Notification.schema, { userId: 1, readAt: 1, createdAt: -1 });
  });

  it("supports versioned diagnosis and quotation lookup by booking", () => {
    expectIndex(
      Diagnosis.schema,
      { bookingId: 1, revision: 1 },
      { unique: true },
    );
    expectIndex(
      Quotation.schema,
      { bookingId: 1, version: 1 },
      { unique: true },
    );
  });
});
