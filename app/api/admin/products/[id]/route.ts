export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { serializeData } from "@/lib/utils";
import { verifyAuth } from "@/lib/auth-middleware";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authPayload = verifyAuth(request);
    if (!authPayload) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    
    // Check if product exists
    const existing = await prisma.product.findUnique({
      where: { id: BigInt((await params).id) }
    });
    
    if (!existing) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const product = await prisma.product.update({
      where: { id: BigInt((await params).id) },
      data: body
    });

    return NextResponse.json({
      message: "Product updated successfully",
      data: serializeData(product)
    });
  } catch (error) {
    console.error("Admin Product PUT error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authPayload = verifyAuth(request);
    if (!authPayload) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if product exists
    const existing = await prisma.product.findUnique({
      where: { id: BigInt((await params).id) }
    });
    
    if (!existing) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    await prisma.product.delete({
      where: { id: BigInt((await params).id) }
    });

    return NextResponse.json({
      message: "Product deleted successfully"
    });
  } catch (error) {
    console.error("Admin Product DELETE error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
