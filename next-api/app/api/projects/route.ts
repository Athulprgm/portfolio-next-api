import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { serializeData } from "@/lib/utils";

export async function GET(request: Request) {
  try {
    const projects = await prisma.project.findMany({
      orderBy: { sort_order: 'asc' }
    });

    return NextResponse.json({
      data: serializeData(projects)
    });
  } catch (error) {
    console.error("Projects GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
