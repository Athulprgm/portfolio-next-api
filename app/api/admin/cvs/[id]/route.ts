export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAdminKey, getBearerToken, verifyAuth } from "@/lib/auth-middleware";
import { serializeData } from "@/lib/utils";
import fs from "fs/promises";
import path from "path";
import crypto from "crypto";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!verifyAdminKey(request)) {
    const token = getBearerToken(request);
    if (!token || !verifyAuth(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  try {
    const { id } = await params;
    const existing = await prisma.cv.findUnique({ where: { id: BigInt(id) } });
    if (!existing) {
      return NextResponse.json({ error: "CV not found" }, { status: 404 });
    }

    const contentType = request.headers.get("content-type") || "";
    let parsedData: any = {};
    let cvFilePath: string | null = null;

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      parsedData.title = formData.get("title")?.toString();
      parsedData.file_url = formData.get("file_url")?.toString();
      parsedData.sort_order = formData.has("sort_order") ? parseInt(formData.get("sort_order")!.toString(), 10) : undefined;

      const cvFile = formData.get("cv_file") as File | null;
      if (cvFile && cvFile.size > 0) {
        const uploadDir = path.join(process.cwd(), "public/storage/cvs");
        await fs.mkdir(uploadDir, { recursive: true });
        
        const buffer = Buffer.from(await cvFile.arrayBuffer());
        const ext = path.extname(cvFile.name) || ".pdf";
        const newName = "cv_" + crypto.randomBytes(8).toString("hex") + ext;
        await fs.writeFile(path.join(uploadDir, newName), buffer);
        cvFilePath = `/storage/cvs/${newName}`;

        // Delete old local file if replaced
        if (existing.file_path && existing.file_path.startsWith("/storage/cvs/")) {
          const oldPath = path.join(process.cwd(), "public", existing.file_path);
          await fs.unlink(oldPath).catch(() => {});
        }
      }
    } else {
      parsedData = await request.json();
    }

    const updated = await prisma.cv.update({
      where: { id: BigInt(id) },
      data: {
        title: parsedData.title !== undefined ? parsedData.title : existing.title,
        file_path: cvFilePath || (parsedData.file_url !== undefined ? parsedData.file_url : existing.file_path),
        sort_order: parsedData.sort_order !== undefined ? parsedData.sort_order : existing.sort_order,
      }
    });

    return NextResponse.json({ data: serializeData(updated) });
  } catch (error: any) {
    console.error("CV PUT error:", error);
    return NextResponse.json({ error: error.message || "Failed to update CV" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!verifyAdminKey(request)) {
    const token = getBearerToken(request);
    if (!token || !verifyAuth(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  try {
    const { id } = await params;
    const existing = await prisma.cv.findUnique({ where: { id: BigInt(id) } });
    if (!existing) {
      return NextResponse.json({ error: "CV not found" }, { status: 404 });
    }

    if (existing.file_path && existing.file_path.startsWith("/storage/cvs/")) {
      const oldPath = path.join(process.cwd(), "public", existing.file_path);
      await fs.unlink(oldPath).catch(() => {});
    }

    await prisma.cv.delete({ where: { id: BigInt(id) } });

    return NextResponse.json({ data: { message: "CV deleted successfully" } });
  } catch (error: any) {
    console.error("CV DELETE error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
