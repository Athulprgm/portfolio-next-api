export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { serializeData } from "@/lib/utils";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const project = await prisma.project.findUnique({
      where: { id: BigInt(id) },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Parse JSON fields
    const parsedProject = { ...project };
    if (typeof parsedProject.tags === 'string') {
      try { parsedProject.tags = JSON.parse(parsedProject.tags); } catch (e) {}
    }
    if (typeof parsedProject.detail_data === 'string') {
      try { parsedProject.detail_data = JSON.parse(parsedProject.detail_data); } catch (e) {}
    }
    if (typeof parsedProject.image === 'string') {
      try { parsedProject.image = JSON.parse(parsedProject.image); } catch (e) {}
    }

    return NextResponse.json({ data: serializeData(parsedProject) });
  } catch (error) {
    console.error("Project GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
