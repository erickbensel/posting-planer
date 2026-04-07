import { Worker, Job } from "bullmq";
import { connection, PostJobData } from "@/lib/queue";
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

async function getValidAccessToken(socialAccountId: string): Promise<string> {
  const account = await prisma.socialAccount.findUnique({
    where: { id: socialAccountId },
  });

  if (!account) {
    throw new Error(`Social account ${socialAccountId} not found`);
  }

  // Check if token is expired (with 5 min buffer)
  if (account.expiresAt && account.expiresAt < new Date(Date.now() + 300000)) {
    // Token refresh logic per platform
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
          // Update refresh token too
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
        data: {
          accessToken: newToken,
          expiresAt: newExpiry,
        },
      });
      return newToken;
    }
  }

  return account.accessToken;
}

async function publishToInstagram(
  postPlatformId: string,
  content: string,
  mediaUrls: string[],
  accessToken: string,
  accountId: string
): Promise<void> {
  const hasVideo = mediaUrls.some(
    (url) =>
      url.includes(".mp4") ||
      url.includes(".mov") ||
      url.includes("video")
  );

  let platformPostId: string;

  if (mediaUrls.length > 0 && hasVideo) {
    platformPostId = await publishInstagramVideo(
      accountId,
      accessToken,
      mediaUrls[0],
      content
    );
  } else if (mediaUrls.length > 0) {
    platformPostId = await publishInstagramPhoto(
      accountId,
      accessToken,
      mediaUrls[0],
      content
    );
  } else {
    throw new Error("Instagram erfordert mindestens ein Medium");
  }

  await prisma.postPlatform.update({
    where: { id: postPlatformId },
    data: {
      status: PlatformPostStatus.PUBLISHED,
      platformPostId,
      publishedAt: new Date(),
    },
  });
}

async function publishToFacebook(
  postPlatformId: string,
  content: string,
  mediaUrls: string[],
  accessToken: string,
  accountId: string
): Promise<void> {
  const platformPostId = await publishFacebookPost(
    accountId,
    accessToken,
    content,
    mediaUrls
  );

  await prisma.postPlatform.update({
    where: { id: postPlatformId },
    data: {
      status: PlatformPostStatus.PUBLISHED,
      platformPostId,
      publishedAt: new Date(),
    },
  });
}

async function publishToLinkedIn(
  postPlatformId: string,
  content: string,
  mediaUrls: string[],
  accessToken: string,
  accountId: string
): Promise<void> {
  const platformPostId = await publishLinkedInPost(
    accountId,
    accessToken,
    content,
    mediaUrls
  );

  await prisma.postPlatform.update({
    where: { id: postPlatformId },
    data: {
      status: PlatformPostStatus.PUBLISHED,
      platformPostId,
      publishedAt: new Date(),
    },
  });
}

async function publishToTikTok(
  postPlatformId: string,
  content: string,
  mediaUrls: string[],
  accessToken: string,
  accountId: string
): Promise<void> {
  if (mediaUrls.length === 0) {
    throw new Error("TikTok erfordert ein Video");
  }

  const platformPostId = await publishTikTokVideo(
    accountId,
    accessToken,
    mediaUrls[0],
    content
  );

  await prisma.postPlatform.update({
    where: { id: postPlatformId },
    data: {
      status: PlatformPostStatus.PUBLISHED,
      platformPostId,
      publishedAt: new Date(),
    },
  });
}

async function publishToYouTube(
  postPlatformId: string,
  content: string,
  mediaUrls: string[],
  accessToken: string
): Promise<void> {
  if (mediaUrls.length === 0) {
    throw new Error("YouTube erfordert ein Video");
  }

  const lines = content.split("\n");
  const title = lines[0] || "Neues Video";
  const description = lines.slice(1).join("\n") || content;

  const videoId = await uploadYouTubeVideo(
    accessToken,
    mediaUrls[0],
    title,
    description
  );

  await prisma.postPlatform.update({
    where: { id: postPlatformId },
    data: {
      status: PlatformPostStatus.PUBLISHED,
      platformPostId: videoId,
      publishedAt: new Date(),
    },
  });
}

export function startWorker() {
  const worker = new Worker<PostJobData>(
    "post-publisher",
    async (job: Job<PostJobData>) => {
      const { postId, postPlatformIds } = job.data;

      const post = await prisma.post.findUnique({
        where: { id: postId },
        include: {
          postPlatforms: {
            include: {
              socialAccount: true,
            },
          },
        },
      });

      if (!post) {
        throw new Error(`Post ${postId} nicht gefunden`);
      }

      const results = await Promise.allSettled(
        post.postPlatforms
          .filter((pp) => postPlatformIds.includes(pp.id))
          .map(async (postPlatform) => {
            try {
              const accessToken = await getValidAccessToken(
                postPlatform.socialAccountId
              );

              switch (postPlatform.platform) {
                case Platform.INSTAGRAM:
                  await publishToInstagram(
                    postPlatform.id,
                    post.content,
                    post.mediaUrls,
                    accessToken,
                    postPlatform.socialAccount.accountId
                  );
                  break;
                case Platform.FACEBOOK:
                  await publishToFacebook(
                    postPlatform.id,
                    post.content,
                    post.mediaUrls,
                    accessToken,
                    postPlatform.socialAccount.accountId
                  );
                  break;
                case Platform.LINKEDIN:
                  await publishToLinkedIn(
                    postPlatform.id,
                    post.content,
                    post.mediaUrls,
                    accessToken,
                    postPlatform.socialAccount.accountId
                  );
                  break;
                case Platform.TIKTOK:
                  await publishToTikTok(
                    postPlatform.id,
                    post.content,
                    post.mediaUrls,
                    accessToken,
                    postPlatform.socialAccount.accountId
                  );
                  break;
                case Platform.YOUTUBE:
                  await publishToYouTube(
                    postPlatform.id,
                    post.content,
                    post.mediaUrls,
                    accessToken
                  );
                  break;
              }
            } catch (error) {
              const errorMessage =
                error instanceof Error ? error.message : "Unbekannter Fehler";

              await prisma.postPlatform.update({
                where: { id: postPlatform.id },
                data: {
                  status: PlatformPostStatus.FAILED,
                  error: errorMessage,
                },
              });

              throw error;
            }
          })
      );

      // Check overall post status
      const updatedPost = await prisma.post.findUnique({
        where: { id: postId },
        include: { postPlatforms: true },
      });

      if (updatedPost) {
        const allPublished = updatedPost.postPlatforms.every(
          (pp) => pp.status === PlatformPostStatus.PUBLISHED
        );
        const anyFailed = updatedPost.postPlatforms.some(
          (pp) => pp.status === PlatformPostStatus.FAILED
        );

        let newStatus: PostStatus = PostStatus.SCHEDULED;
        if (allPublished) newStatus = PostStatus.PUBLISHED;
        else if (anyFailed && !allPublished) newStatus = PostStatus.FAILED;

        await prisma.post.update({
          where: { id: postId },
          data: {
            status: newStatus,
            publishedAt: allPublished ? new Date() : undefined,
          },
        });
      }

      // Check if any failed
      const failed = results.filter((r) => r.status === "rejected");
      if (failed.length > 0 && failed.length === results.length) {
        throw new Error("Alle Plattform-Veröffentlichungen fehlgeschlagen");
      }
    },
    {
      connection,
      concurrency: 5,
    }
  );

  worker.on("completed", (job) => {
    console.log(`Post job ${job.id} abgeschlossen`);
  });

  worker.on("failed", (job, err) => {
    console.error(`Post job ${job?.id} fehlgeschlagen:`, err.message);
  });

  return worker;
}
