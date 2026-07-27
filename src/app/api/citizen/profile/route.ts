import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthUserFromRequest, createJWT, setAuthCookie } from "@/lib/auth";

export async function PATCH(req: NextRequest) {
  try {
    const authUser = await getAuthUserFromRequest(req);
    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { name, phone, preferredLanguage, notificationPreference, newPassword } = body;

    const updateData: any = {};
    if (name && name.trim()) updateData.name = name.trim();
    if (phone !== undefined) updateData.phone = phone.trim();
    if (preferredLanguage) updateData.preferredLanguage = preferredLanguage;
    if (notificationPreference) updateData.notificationPreference = notificationPreference;
    if (newPassword && newPassword.trim().length >= 6) {
      updateData.password = newPassword.trim();
    }

    const updatedUser = await (db as any).user.update({
      where: { id: authUser.id },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        phone: true,
        preferredLanguage: true,
        notificationPreference: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // If name changed, update citizenName on existing complaints so complaints remain linked
    if (name && name.trim() !== authUser.name) {
      await db.complaint.updateMany({
        where: { citizenName: authUser.name },
        data: { citizenName: name.trim() },
      });
    }

    // Refresh JWT Cookie with updated user details
    const newAuthUser = {
      id: updatedUser.id,
      email: updatedUser.email,
      name: updatedUser.name,
      role: updatedUser.role as any,
      department: null,
    };
    const token = await createJWT(newAuthUser);

    const res = NextResponse.json({
      success: true,
      user: updatedUser,
      message: "Profile updated successfully!",
    });

    setAuthCookie(res, token);
    return res;
  } catch (error: any) {
    console.error("Profile Update Error:", error);
    return NextResponse.json(
      { error: "Failed to update profile: " + error.message },
      { status: 500 }
    );
  }
}
