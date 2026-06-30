import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { serializeData } from "@/lib/utils";

export async function GET(request: Request) {
  try {
    const cvs = await prisma.cv.findMany({
      orderBy: { sort_order: 'asc' }
    });

    return NextResponse.json({
      data: serializeData(cvs)
    });
  } catch (error) {
    console.error("CVs GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
