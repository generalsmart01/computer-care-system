import mongoose from "mongoose";
import { E2E_DATABASE } from "./database";
export default async function teardown() {
  if (!/e2e-test$/.test(E2E_DATABASE))
    throw new Error("Unsafe E2E database name");
  await mongoose.connect(E2E_DATABASE);
  await mongoose.connection.db!.dropDatabase();
  await mongoose.disconnect();
}
