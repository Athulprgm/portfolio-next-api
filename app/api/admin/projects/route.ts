import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAdminKey, getBearerToken, verifyAuth } from "@/lib/auth-middleware";
import { serializeData } from "@/lib/utils";
import fs from "fs/promises";
import path from "path";
import crypto from "crypto";

export async function POST(request: Request) {
  // Try custom header first, then fallback to Bearer token
  if (!verifyAdminKey(request)) {
    const token = getBearerToken(request);
    if (!token || !verifyAuth(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  try {
    const contentType = request.headers.get("content-type") || "";
    if (!contentType.includes("multipart/form-data") && !contentType.includes("application/json")) {
      return NextResponse.json({ error: "Unsupported Content-Type" }, { status: 400 });
    }

    let parsedData: any = {};
    let uploadedImages: string[] = [];
    let thumbnailPath: string | null = null;

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      
      parsedData.title = formData.get("title")?.toString() || "";
      parsedData.description = formData.get("description")?.toString() || "";
      parsedData.tags = formData.get("tags")?.toString() || "[]";
      parsedData.sort_order = parseInt(formData.get("sort_order")?.toString() || "0", 10);
      parsedData.has_details = formData.get("has_details")?.toString() === "true" || formData.get("has_details")?.toString() === "1";
      parsedData.detail_data = formData.get("detail_data")?.toString() || "{}";

      // File handling
      const uploadDir = path.join(process.cwd(), "public/storage/projects");
      await fs.mkdir(uploadDir, { recursive: true });

      // Handle thumbnail
      const thumbnailFile = formData.get("thumbnail") as File | null;
      if (thumbnailFile && thumbnailFile.size > 0) {
        const buffer = Buffer.from(await thumbnailFile.arrayBuffer());
        const ext = path.extname(thumbnailFile.name) || ".jpg";
        const newName = "thumb_" + crypto.randomBytes(8).toString("hex") + ext;
        await fs.writeFile(path.join(uploadDir, newName), buffer);
        thumbnailPath = `/storage/projects/${newName}`;
      }

      // Handle image files
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

    if (!parsedData.title || !parsedData.description) {
      return NextResponse.json({ error: "Title and description are required" }, { status: 422 });
    }

    const projectData = {
      title: parsedData.title,
      description: parsedData.description,
      image: JSON.stringify(parsedData.image ? [...(Array.isArray(parsedData.image) ? parsedData.image : []), ...uploadedImages] : uploadedImages),
      thumbnail: thumbnailPath || parsedData.thumbnail || null,
      tags: parsedData.tags,
      sort_order: parsedData.sort_order || 0,
      has_details: parsedData.has_details !== undefined ? parsedData.has_details : true,
      detail_data: parsedData.detail_data || "{}"
    };

    const created = await prisma.project.create({
      data: projectData
    });

    return NextResponse.json({ data: serializeData(created) }, { status: 201 });
  } catch (error: any) {
    console.error("Project POST error:", error);
    return NextResponse.json({ error: error.message || "Failed to create project" }, { status: 500 });
  }
}
