import { NextResponse } from "next/server";
import {
  setStaffSessionCookie,
  verifyStaffPassword,
} from "@/lib/staff-auth";
import { badRequest, readJsonBody, serverError } from "@/lib/http";

export async function POST(request: Request) {
  try {
    if (!process.env.STAFF_PASSWORD) {
      return serverError("Staff password is not configured");
    }

    const body = await readJsonBody<{ password?: string }>(request);
    if (!body) return badRequest("Invalid request body");

    if (!verifyStaffPassword(body.password ?? "")) {
      return NextResponse.json({ error: "Incorrect password" }, { status: 401 });
    }

    await setStaffSessionCookie();
    return NextResponse.json({ ok: true });
  } catch {
    return serverError("Sign in failed");
  }
}
