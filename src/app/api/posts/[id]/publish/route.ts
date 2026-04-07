export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { schedulePost, cancelScheduledPost } from "@/lib/queue";
import { PostStatus } from "@prisma/client";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
  }

  const userId = (session.user as any).id;
  const { id: postId } = params;

  const post = await prisma.post.findFirst({
    where: {
      id: postId,
      client: { userId },
    },
    include: { postPlatforms: true },
  });

  if (!post) {
    return NextResponse.json(
      { error: "Beitrag nicht gefunden" },
      { status: 404 }
    );
  }

  if (post.status === PostStatus.PUBLISHED) {
    return NextResponse.json(
      { error: "Beitrag wurde bereits veröffentlicht" },
      { status: 400 }
    );
  }

  // Cancel any existing scheduled job
  await cancelScheduledPost(postId);

  // Update post to scheduled with immediate time
  const updatedPost = await prisma.post.update({
    where: { id: postId },
    data: {
      status: PostStatus.SCHEDULED,
      scheduledAt: new Date(),
    },
  });

  // Schedule for immediate publishing
  await schedulePost(
    postId,
    post.postPlatforms.map((pp) => pp.id),
    new Date()
  );

  return NextResponse.json(updatedPost);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
  }

  const userId = (session.user as any).id;
  const { id: postId } = params;

  const post = await prisma.post.findFirst({
    where: {
      id: postId,
      client: { userId },
    },
  });

  if (!post) {
    return NextResponse.json(
      { error: "Beitrag nicht gefunden" },
      { status: 404 }
    );
  }

  // Cancel queue job
  await cancelScheduledPost(postId);

  // Delete post
  await prisma.post.delete({ where: { id: postId } });

  return NextResponse.json({ success: true });
}
