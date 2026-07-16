import { NextResponse } from "next/server";
import {
  setStaffSessionCookie,
  verifyStaffPassword,
} from "@/lib/staff-auth";

export async function POST(request: Request) {
  try {
    if (!process.env.STAFF_PASSWORD) {
      return NextResponse.json(
        { error: "Staff password is not configured" },
        { status: 500 },
      );
    }

    const body = (await request.json()) as { password?: string };
    const password = body.password ?? "";

    if (!verifyStaffPassword(password)) {
      return NextResponse.json({ error: "Incorrect password" }, { status: 401 });
    }

    await setStaffSessionCookie();
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Sign in failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
