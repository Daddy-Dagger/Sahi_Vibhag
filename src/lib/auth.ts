import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export type Role = "CONSUMER" | "OFFICER";

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: Role;
  department?: string | null;
}

export interface JWTPayload extends AuthUser {
  iat: number;
  exp: number;
}

const JWT_SECRET = process.env.JWT_SECRET || "sahi_vibhag_secure_jwt_token_secret_key_2026_hackathon";
export const AUTH_COOKIE_NAME = "sahi_vibhag_auth";

// Base64Url helper functions compatible with Edge & Node
function base64UrlEncode(str: string): string {
  return btoa(str)
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function base64UrlDecode(str: string): string {
  let base64 = str.replace(/-/g, "+").replace(/_/g, "/");
  while (base64.length % 4) {
    base64 += "=";
  }
  return atob(base64);
}

// Convert string secret to CryptoKey
async function getCryptoKey(secret: string): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const secretData = encoder.encode(secret);
  return crypto.subtle.importKey(
    "raw",
    secretData,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

// Sign JWT token using Web Crypto API
export async function createJWT(user: AuthUser, expiresInSeconds: number = 86400): Promise<string> {
  const header = { alg: "HS256", typ: "JWT" };
  const now = Math.floor(Date.now() / 1000);
  const payload: JWTPayload = {
    ...user,
    iat: now,
    exp: now + expiresInSeconds,
  };

  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const dataToSign = `${encodedHeader}.${encodedPayload}`;

  const key = await getCryptoKey(JWT_SECRET);
  const encoder = new TextEncoder();
  const signatureBuffer = await crypto.subtle.sign("HMAC", key, encoder.encode(dataToSign));
  
  // Convert ArrayBuffer to binary string and base64url encode
  const signatureArray = Array.from(new Uint8Array(signatureBuffer));
  const signatureStr = String.fromCharCode(...signatureArray);
  const encodedSignature = base64UrlEncode(signatureStr);

  return `${dataToSign}.${encodedSignature}`;
}

// Verify JWT token using Web Crypto API
export async function verifyJWT(token: string): Promise<JWTPayload | null> {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;

    const [encodedHeader, encodedPayload, encodedSignature] = parts;
    const dataToSign = `${encodedHeader}.${encodedPayload}`;

    const key = await getCryptoKey(JWT_SECRET);
    const encoder = new TextEncoder();

    // Decode signature
    const signatureStr = base64UrlDecode(encodedSignature);
    const signatureUint8 = new Uint8Array(signatureStr.length);
    for (let i = 0; i < signatureStr.length; i++) {
      signatureUint8[i] = signatureStr.charCodeAt(i);
    }

    const isValid = await crypto.subtle.verify(
      "HMAC",
      key,
      signatureUint8,
      encoder.encode(dataToSign)
    );

    if (!isValid) return null;

    const payload: JWTPayload = JSON.parse(base64UrlDecode(encodedPayload));

    // Expiration check
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp < now) return null;

    return payload;
  } catch (error) {
    return null;
  }
}

// Extract and verify user from NextRequest
export async function getAuthUserFromRequest(req: NextRequest): Promise<AuthUser | null> {
  const token = req.cookies.get(AUTH_COOKIE_NAME)?.value || req.headers.get("Authorization")?.replace("Bearer ", "");
  if (!token) return null;
  return await verifyJWT(token);
}

// Extract user from Next.js server components / route handlers via cookies()
export async function getAuthUser(): Promise<AuthUser | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
    if (!token) return null;
    return await verifyJWT(token);
  } catch (e) {
    return null;
  }
}

// Set auth cookie on NextResponse
export function setAuthCookie(res: NextResponse, token: string) {
  res.cookies.set({
    name: AUTH_COOKIE_NAME,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 86400, // 24 hours
  });
}

// Clear auth cookie
export function clearAuthCookie(res: NextResponse) {
  res.cookies.set({
    name: AUTH_COOKIE_NAME,
    value: "",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}
