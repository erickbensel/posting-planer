export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
  }

  const userId = (session.user as any).id;

  const clients = await prisma.client.findMany({
    where: { userId },
    include: {
      socialAccounts: {
        select: {
          id: true,
          platform: true,
          accountName: true,
          expiresAt: true,
        },
      },
      _count: {
        select: { posts: true },
      },
    },
    orderBy: { name: "asc" },
  });

  return NextResponse.json(clients);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
  }

  const userId = (session.user as any).id;

  try {
    const body = await req.json();
    const { name, logo } = body;

    if (!name) {
      return NextResponse.json(
        { error: "Name ist erforderlich" },
        { status: 400 }
      );
    }

    const client = await prisma.client.create({
      data: {
        name,
        logo: logo || null,
        userId,
      },
    });

    return NextResponse.json(client, { status: 201 });
  } catch (error) {
    console.error("Client creation error:", error);
    return NextResponse.json(
      { error: "Kunde konnte nicht erstellt werden" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
  }

  const userId = (session.user as any).id;
  const { searchParams } = new URL(req.url);
  const clientId = searchParams.get("id");

  if (!clientId) {
    return NextResponse.json({ error: "Kunden-ID fehlt" }, { status: 400 });
  }

  const client = await prisma.client.findFirst({
    where: { id: clientId, userId },
  });

  if (!client) {
    return NextResponse.json(
      { error: "Kunde nicht gefunden" },
      { status: 404 }
    );
  }

  await prisma.client.delete({ where: { id: clientId } });

  return NextResponse.json({ success: true });
}
