/* istanbul ignore file */
/* v8 ignore start */
import { db } from "@/db";
import { sql } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    await db.execute(sql`SELECT 1`);
    return NextResponse.json({ status: "ok" });
  } catch (error) {
    return NextResponse.json({ status: "error", message: String(error) }, { status: 503 });
  }
}
/* v8 ignore stop */
