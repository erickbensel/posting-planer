export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { schedulePost } from "@/lib/queue";
import { PostStatus, PlatformPostStatus } from "@prisma/client";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const clientId = searchParams.get("clientId");
  const status = searchParams.get("status");
  const limit = parseInt(searchParams.get("limit") || "50");
  const page = parseInt(searchParams.get("page") || "1");

  const userId = (session.user as any).id;

  // Build where clause
  const where: any = {
    client: {
      userId,
    },
  };

  if (clientId) where.clientId = clientId;
  if (status) where.status = status;

  const [posts, total] = await Promise.all([
    prisma.post.findMany({
      where,
      include: {
        postPlatforms: {
          include: {
            socialAccount: true,
          },
        },
        client: {
          select: { id: true, name: true, logo: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: (page - 1) * limit,
    }),
    prisma.post.count({ where }),
  ]);

  return NextResponse.json({ posts, total, page, limit });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
  }

  const userId = (session.user as any).id;

  try {
    const body = await req.json();
    const { clientId, content, mediaUrls, socialAccountIds, scheduledAt, publishNow } = body;

    if (!clientId || !content || !socialAccountIds?.length) {
      return NextResponse.json(
        { error: "Fehlende Pflichtfelder" },
        { status: 400 }
      );
    }

    // Verify client belongs to user
    const client = await prisma.client.findFirst({
      where: { id: clientId, userId },
    });

    if (!client) {
      return NextResponse.json(
        { error: "Kunde nicht gefunden" },
        { status: 404 }
      );
    }

    // Verify social accounts
    const socialAccounts = await prisma.socialAccount.findMany({
      where: {
        id: { in: socialAccountIds },
        clientId,
      },
    });

    if (socialAccounts.length !== socialAccountIds.length) {
      return NextResponse.json(
        { error: "Ungültige Social-Media-Konten" },
        { status: 400 }
      );
    }

    // Determine post status
    let postStatus: PostStatus = PostStatus.DRAFT;
    let scheduledAtDate: Date | null = null;

    if (scheduledAt) {
      scheduledAtDate = new Date(scheduledAt);
      postStatus = PostStatus.SCHEDULED;
    } else if (publishNow) {
      postStatus = PostStatus.SCHEDULED;
      scheduledAtDate = new Date(); // Publish immediately
    }

    // Create post with platform entries
    const post = await prisma.post.create({
      data: {
        clientId,
        content,
        mediaUrls: mediaUrls || [],
        status: postStatus,
        scheduledAt: scheduledAtDate,
        postPlatforms: {
          create: socialAccounts.map((account) => ({
            platform: account.platform,
            socialAccountId: account.id,
            status: PlatformPostStatus.PENDING,
          })),
        },
      },
      include: {
        postPlatforms: true,
      },
    });

    // Add to queue if scheduled or immediate
    if (scheduledAtDate) {
      await schedulePost(
        post.id,
        post.postPlatforms.map((pp) => pp.id),
        scheduledAtDate
      );
    }

    return NextResponse.json(post, { status: 201 });
  } catch (error) {
    console.error("Post creation error:", error);
    return NextResponse.json(
      { error: "Beitrag konnte nicht erstellt werden" },
      { status: 500 }
    );
  }
}
