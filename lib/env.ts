import "server-only";
import { parseEnvironment } from "@/lib/env-schema";
export function getEnv() { return parseEnvironment(process.env); }
