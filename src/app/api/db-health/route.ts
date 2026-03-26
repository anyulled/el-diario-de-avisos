import { NextResponse } from "next/server";
import { db } from "@/db";
import { sql } from "drizzle-orm";

export async function GET() {
  try {
    await db.execute(sql`SELECT 1`);
    return NextResponse.json({ status: "ok" });
  } catch (error) {
    console.error("DB Health Check Failed:", error);
    return NextResponse.json({ status: "error", message: "Database unreachable" }, { status: 503 });
  }
}
