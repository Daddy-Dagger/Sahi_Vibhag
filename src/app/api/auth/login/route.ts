import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createJWT, setAuthCookie, Role } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password, portal } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    // Lookup user in database / mockDb
    const user = await (db as any).user.findUnique({
      where: { email: email.trim() },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    // Simple password check (in production, bcrypt/argon2 compare would be used)
    if (user.password !== password) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    // Portal role validation
    const expectedRole: Role = portal === "officer" ? "OFFICER" : "CONSUMER";
    
    if (portal === "officer" && user.role !== "OFFICER") {
      return NextResponse.json(
        { error: "Access Denied: Consumer accounts cannot access the Officer Portal." },
        { status: 403 }
      );
    }

    if (portal === "consumer" && user.role !== "CONSUMER") {
      return NextResponse.json(
        { error: "Access Denied: Officer accounts must use the discrete Officer Login portal." },
        { status: 403 }
      );
    }

    const authUser = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role as Role,
      department: user.department || null,
    };

    const token = await createJWT(authUser);

    const res = NextResponse.json({
      success: true,
      user: authUser,
    });

    setAuthCookie(res, token);
    return res;
  } catch (error: any) {
    console.error("Login Error:", error);
    return NextResponse.json(
      { error: "Authentication failed: " + error.message },
      { status: 500 }
    );
  }
}
