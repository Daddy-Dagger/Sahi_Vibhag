import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createJWT, setAuthCookie, Role } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, name, password } = body;

    if (!email || !name || !password) {
      return NextResponse.json(
        { error: "Email, name, and password are required" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters long" },
        { status: 400 }
      );
    }

    // Check if user exists
    const existing = await (db as any).user.findUnique({
      where: { email: email.trim() },
    });

    if (existing) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 409 }
      );
    }

    // Register user with CONSUMER role
    const newUser = await (db as any).user.create({
      data: {
        email: email.trim(),
        name: name.trim(),
        password,
        role: "CONSUMER",
      },
    });

    const authUser = {
      id: newUser.id,
      email: newUser.email,
      name: newUser.name,
      role: "CONSUMER" as Role,
      department: null,
    };

    const token = await createJWT(authUser);

    const res = NextResponse.json(
      {
        success: true,
        user: authUser,
      },
      { status: 201 }
    );

    setAuthCookie(res, token);
    return res;
  } catch (error: any) {
    console.error("Register Error:", error);
    return NextResponse.json(
      { error: "Registration failed: " + error.message },
      { status: 500 }
    );
  }
}
