import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { serializeData } from "@/lib/utils";
import { verifyAuth } from "@/lib/auth-middleware";

export async function POST(request: Request) {
  try {
    const authPayload = verifyAuth(request);
    if (!authPayload) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, description, price, stock, status } = body;

    if (!name || price === undefined) {
      return NextResponse.json({ error: "Name and price are required" }, { status: 400 });
    }

    const product = await prisma.product.create({
      data: {
        name,
        description,
        price,
        stock: stock || 0,
        status: status || "active",
      }
    });

    return NextResponse.json({
      message: "Product created successfully",
      data: serializeData(product)
    }, { status: 201 });
  } catch (error) {
    console.error("Admin Product POST error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
