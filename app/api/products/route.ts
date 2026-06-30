export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { serializeData } from "@/lib/utils";
import { ProductStatus } from "@prisma/client";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const sortBy = searchParams.get("sort_by") || "created_at";
    const sortOrder = (searchParams.get("sort_order") || "desc").toLowerCase() as "asc" | "desc";
    const search = searchParams.get("search");
    const status = searchParams.get("status") as ProductStatus | null;

    const skip = (page - 1) * limit;

    const where: any = {};
    if (status) {
      where.status = status;
    }
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ];
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          [sortBy]: sortOrder
        }
      }),
      prisma.product.count({ where })
    ]);

    return NextResponse.json({
      data: serializeData(products),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error("Products GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
