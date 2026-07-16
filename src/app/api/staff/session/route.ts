import { NextResponse } from "next/server";
import { isStaffAuthenticated } from "@/lib/staff-auth";

export async function GET() {
  return NextResponse.json({ authenticated: await isStaffAuthenticated() });
}
