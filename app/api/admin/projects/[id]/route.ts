import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAdminKey, getBearerToken, verifyAuth } from "@/lib/auth-middleware";
import { serializeData } from "@/lib/utils";
import fs from "fs/promises";
import path from "path";
import crypto from "crypto";

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  if (!verifyAdminKey(request)) {
    const token = getBearerToken(request);
    if (!token || !verifyAuth(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  try {
    const existing = await prisma.project.findUnique({ where: { id: BigInt(params.id) } });
    if (!existing) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const contentType = request.headers.get("content-type") || "";
    let parsedData: any = {};
    let uploadedImages: string[] = [];
    let thumbnailPath: string | null = null;

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      
      parsedData.title = formData.get("title")?.toString();
      parsedData.description = formData.get("description")?.toString();
      parsedData.tags = formData.get("tags")?.toString();
      parsedData.sort_order = formData.has("sort_order") ? parseInt(formData.get("sort_order")!.toString(), 10) : undefined;
      parsedData.has_details = formData.has("has_details") ? (formData.get("has_details")?.toString() === "true" || formData.get("has_details")?.toString() === "1") : undefined;
      parsedData.detail_data = formData.get("detail_data")?.toString();
      parsedData.existingImages = formData.get("existingImages")?.toString();

      const uploadDir = path.join(process.cwd(), "public/storage/projects");
      await fs.mkdir(uploadDir, { recursive: true });

      const thumbnailFile = formData.get("thumbnail") as File | null;
      if (thumbnailFile && thumbnailFile.size > 0) {
        const buffer = Buffer.from(await thumbnailFile.arrayBuffer());
        const ext = path.extname(thumbnailFile.name) || ".jpg";
        const newName = "thumb_" + crypto.randomBytes(8).toString("hex") + ext;
        await fs.writeFile(path.join(uploadDir, newName), buffer);
        thumbnailPath = `/storage/projects/${newName}`;
      }

      const imageFiles = formData.getAll("imageFiles[]") as File[];
      for (const file of imageFiles) {
        if (file && file.size > 0) {
          const buffer = Buffer.from(await file.arrayBuffer());
          const ext = path.extname(file.name) || ".jpg";
          const newName = "proj_" + crypto.randomBytes(8).toString("hex") + ext;
          await fs.writeFile(path.join(uploadDir, newName), buffer);
          uploadedImages.push(`/storage/projects/${newName}`);
        }
      }
    } else {
      parsedData = await request.json();
    }

    let existingImagesArray: string[] = [];
    if (parsedData.existingImages) {
      try { existingImagesArray = JSON.parse(parsedData.existingImages); } catch(e) {}
    } else if (parsedData.image) {
      existingImagesArray = Array.isArray(parsedData.image) ? parsedData.image : [parsedData.image];
    } else if (existing.image) {
      try { existingImagesArray = JSON.parse(existing.image); } catch(e) {}
    }

    const finalImages = [...existingImagesArray, ...uploadedImages];

    const projectData = {
      title: parsedData.title !== undefined ? parsedData.title : existing.title,
      description: parsedData.description !== undefined ? parsedData.description : existing.description,
      image: JSON.stringify(finalImages),
      thumbnail: thumbnailPath || parsedData.thumbnail || existing.thumbnail,
      tags: parsedData.tags !== undefined ? parsedData.tags : existing.tags,
      sort_order: parsedData.sort_order !== undefined ? parsedData.sort_order : existing.sort_order,
      has_details: parsedData.has_details !== undefined ? parsedData.has_details : existing.has_details,
      detail_data: parsedData.detail_data !== undefined ? parsedData.detail_data : existing.detail_data
    };

    const updated = await prisma.project.update({
      where: { id: BigInt(params.id) },
      data: projectData
    });

    return NextResponse.json({ data: serializeData(updated) });
  } catch (error: any) {
    console.error("Project PUT error:", error);
    return NextResponse.json({ error: error.message || "Failed to update project" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  if (!verifyAdminKey(request)) {
    const token = getBearerToken(request);
    if (!token || !verifyAuth(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  try {
    const existing = await prisma.project.findUnique({ where: { id: BigInt(params.id) } });
    if (!existing) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Delete files logic (simplified, ignoring errors)
    try {
      if (existing.thumbnail) {
        const thumbPath = path.join(process.cwd(), "public", existing.thumbnail);
        await fs.unlink(thumbPath).catch(() => {});
      }
      if (existing.image) {
        const images = JSON.parse(existing.image);
        for (const img of images) {
          const imgPath = path.join(process.cwd(), "public", img);
          await fs.unlink(imgPath).catch(() => {});
        }
      }
    } catch(e) {}

    await prisma.project.delete({ where: { id: BigInt(params.id) } });

    return NextResponse.json({ data: { message: "Project deleted successfully" } });
  } catch (error: any) {
    console.error("Project DELETE error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
