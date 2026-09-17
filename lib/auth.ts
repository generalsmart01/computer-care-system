import "server-only";import { cookies } from "next/headers";import { SignJWT,jwtVerify } from "jose";import { getEnv } from "@/lib/env";import type { UserRole } from "@/lib/constants";
import { sessionCookieOptions } from "@/lib/session-cookie";
const COOKIE="cmb_session";export type SessionUser={id:string;role:UserRole;email:string;name:string};
function key(){return new TextEncoder().encode(getEnv().SESSION_SECRET)}
export async function createSession(user:SessionUser){const token=await new SignJWT(user).setProtectedHeader({alg:"HS256"}).setIssuedAt().setExpirationTime("7d").sign(key()),env=getEnv();(await cookies()).set(COOKIE,token,sessionCookieOptions(env.NODE_ENV,env.ALLOW_INSECURE_LOCAL_E2E==="true"));}
export async function destroySession(){(await cookies()).delete(COOKIE)}
export async function getSession():Promise<SessionUser|null>{const token=(await cookies()).get(COOKIE)?.value;if(!token)return null;try{return (await jwtVerify(token,key())).payload as SessionUser}catch{return null}}
