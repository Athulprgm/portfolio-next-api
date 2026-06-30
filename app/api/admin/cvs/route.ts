export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAdminKey, getBearerToken, verifyAuth } from "@/lib/auth-middleware";
import { serializeData } from "@/lib/utils";
import fs from "fs/promises";
import path from "path";
import crypto from "crypto";

export async function POST(request: Request) {
  if (!verifyAdminKey(request)) {
    const token = getBearerToken(request);
    if (!token || !verifyAuth(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  try {
    const contentType = request.headers.get("content-type") || "";
    let parsedData: any = {};
    let cvFilePath: string | null = null;

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      parsedData.title = formData.get("title")?.toString() || "";
      parsedData.file_url = formData.get("file_url")?.toString() || "";
      parsedData.sort_order = parseInt(formData.get("sort_order")?.toString() || "0", 10);

      const cvFile = formData.get("cv_file") as File | null;
      if (cvFile && cvFile.size > 0) {
        const uploadDir = path.join(process.cwd(), "public/storage/cvs");
        await fs.mkdir(uploadDir, { recursive: true });
        
        const buffer = Buffer.from(await cvFile.arrayBuffer());
        const ext = path.extname(cvFile.name) || ".pdf";
        const newName = "cv_" + crypto.randomBytes(8).toString("hex") + ext;
        await fs.writeFile(path.join(uploadDir, newName), buffer);
        cvFilePath = `/storage/cvs/${newName}`;
      }
    } else {
      parsedData = await request.json();
    }

    if (!parsedData.title) {
      return NextResponse.json({ error: "Title is required" }, { status: 422 });
    }

    const created = await prisma.cv.create({
      data: {
        title: parsedData.title,
        file_path: cvFilePath || parsedData.file_url || "",
        sort_order: parsedData.sort_order || 0,
      }
    });

    return NextResponse.json({ data: serializeData(created) }, { status: 201 });
  } catch (error: any) {
    console.error("CV POST error:", error);
    return NextResponse.json({ error: error.message || "Failed to create CV" }, { status: 500 });
  }
}
