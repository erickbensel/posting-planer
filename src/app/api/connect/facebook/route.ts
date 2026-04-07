export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getMetaAuthUrl } from "@/lib/apis/meta";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const clientId = searchParams.get("clientId");

  if (!clientId) {
    return NextResponse.json({ error: "Kunden-ID fehlt" }, { status: 400 });
  }

  const state = Buffer.from(
    JSON.stringify({ clientId, userId: (session.user as any).id, platform: "FACEBOOK" })
  ).toString("base64");

  const url = getMetaAuthUrl(state);

  return NextResponse.json({ url });
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
  }

  const { prisma } = await import("@/lib/prisma");
  const userId = (session.user as any).id;
  const body = await req.json();
  const { clientId } = body;

  await prisma.socialAccount.deleteMany({
    where: {
      clientId,
      platform: "FACEBOOK",
      client: { userId },
    },
  });

  return NextResponse.json({ success: true });
}
