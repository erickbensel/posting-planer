export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Platform, PlatformPostStatus, PostStatus } from "@prisma/client";
import {
  publishInstagramPhoto,
  publishInstagramVideo,
  publishFacebookPost,
} from "@/lib/apis/meta";
import { publishLinkedInPost } from "@/lib/apis/linkedin";
import { publishTikTokVideo } from "@/lib/apis/tiktok";
import { uploadYouTubeVideo } from "@/lib/apis/youtube";

export const maxDuration = 60;

async function getValidAccessToken(socialAccountId: string): Promise<string> {
  const account = await prisma.socialAccount.findUnique({
    where: { id: socialAccountId },
  });

  if (!account) throw new Error(`Account ${socialAccountId} nicht gefunden`);

  if (account.expiresAt && account.expiresAt < new Date(Date.now() + 300000)) {
    let newToken: string | null = null;
    let newExpiry: Date | null = null;

    switch (account.platform) {
      case Platform.YOUTUBE: {
        const { refreshYouTubeToken } = await import("@/lib/apis/youtube");
        if (account.refreshToken) {
          const result = await refreshYouTubeToken(account.refreshToken);
          newToken = result.accessToken;
          newExpiry = new Date(Date.now() + result.expiresIn * 1000);
        }
        break;
      }
      case Platform.LINKEDIN: {
        const { refreshLinkedInToken } = await import("@/lib/apis/linkedin");
        if (account.refreshToken) {
          const result = await refreshLinkedInToken(account.refreshToken);
          newToken = result.accessToken;
          newExpiry = new Date(Date.now() + result.expiresIn * 1000);
        }
        break;
      }
      case Platform.TIKTOK: {
        const { refreshTikTokToken } = await import("@/lib/apis/tiktok");
        if (account.refreshToken) {
          const result = await refreshTikTokToken(account.refreshToken);
          newToken = result.accessToken;
          newExpiry = new Date(Date.now() + result.expiresIn * 1000);
          await prisma.socialAccount.update({
            where: { id: socialAccountId },
            data: { refreshToken: result.refreshToken },
          });
        }
        break;
      }
    }

    if (newToken) {
      await prisma.socialAccount.update({
        where: { id: socialAccountId },
        data: { accessToken: newToken, expiresAt: newExpiry },
      });
      return newToken;
    }
  }

  return account.accessToken;
}

async function publishPost(postId: string) {
  const post = await prisma.post.findUnique({
    where: { id: postId },
    include: {
      postPlatforms: {
        where: { status: PlatformPostStatus.PENDING },
        include: { socialAccount: true },
      },
    },
  });

  if (!post) return;

  await Promise.allSettled(
    post.postPlatforms.map(async (pp) => {
      try {
        const accessToken = await getValidAccessToken(pp.socialAccountId);
        let platformPostId: string | undefined;

        switch (pp.platform) {
          case Platform.INSTAGRAM: {
            const hasVideo = post.mediaUrls.some(
              (u) => u.includes(".mp4") || u.includes(".mov") || u.includes("video")
            );
            if (post.mediaUrls.length === 0) throw new Error("Instagram erfordert ein Medium");
            platformPostId = hasVideo
              ? await publishInstagramVideo(pp.socialAccount.accountId, accessToken, post.mediaUrls[0], post.content)
              : await publishInstagramPhoto(pp.socialAccount.accountId, accessToken, post.mediaUrls[0], post.content);
            break;
          }
          case Platform.FACEBOOK: {
            platformPostId = await publishFacebookPost(pp.socialAccount.accountId, accessToken, post.content, post.mediaUrls);
            break;
          }
          case Platform.LINKEDIN: {
            platformPostId = await publishLinkedInPost(pp.socialAccount.accountId, accessToken, post.content, post.mediaUrls);
            break;
          }
          case Platform.TIKTOK: {
            if (post.mediaUrls.length === 0) throw new Error("TikTok erfordert ein Video");
            platformPostId = await publishTikTokVideo(pp.socialAccount.accountId, accessToken, post.mediaUrls[0], post.content);
            break;
          }
          case Platform.YOUTUBE: {
            if (post.mediaUrls.length === 0) throw new Error("YouTube erfordert ein Video");
            const lines = post.content.split("\n");
            platformPostId = await uploadYouTubeVideo(accessToken, post.mediaUrls[0], lines[0] || "Neues Video", lines.slice(1).join("\n") || post.content);
            break;
          }
        }

        await prisma.postPlatform.update({
          where: { id: pp.id },
          data: { status: PlatformPostStatus.PUBLISHED, platformPostId, publishedAt: new Date() },
        });
      } catch (error) {
        await prisma.postPlatform.update({
          where: { id: pp.id },
          data: {
            status: PlatformPostStatus.FAILED,
            error: error instanceof Error ? error.message : "Unbekannter Fehler",
          },
        });
      }
    })
  );

  // Update overall post status
  const updated = await prisma.post.findUnique({
    where: { id: postId },
    include: { postPlatforms: true },
  });

  if (updated) {
    const allPublished = updated.postPlatforms.every((pp) => pp.status === PlatformPostStatus.PUBLISHED);
    const anyFailed = updated.postPlatforms.some((pp) => pp.status === PlatformPostStatus.FAILED);

    await prisma.post.update({
      where: { id: postId },
      data: {
        status: allPublished ? PostStatus.PUBLISHED : anyFailed ? PostStatus.FAILED : PostStatus.SCHEDULED,
        publishedAt: allPublished ? new Date() : undefined,
      },
    });
  }
}

export async function GET(req: NextRequest) {
  // Vercel Cron Secret prüfen
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Alle fälligen Posts finden
    const duePosts = await prisma.post.findMany({
      where: {
        status: PostStatus.SCHEDULED,
        scheduledAt: { lte: new Date() },
      },
      select: { id: true },
    });

    if (duePosts.length === 0) {
      return NextResponse.json({ processed: 0 });
    }

    await Promise.allSettled(duePosts.map((p) => publishPost(p.id)));

    return NextResponse.json({ processed: duePosts.length });
  } catch (error) {
    console.error("Cron error:", error);
    return NextResponse.json({ error: "Cron fehlgeschlagen" }, { status: 500 });
  }
}
