import { Queue, Worker, Job } from "bullmq";
import IORedis from "ioredis";

const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";

export const connection = new IORedis(redisUrl, {
  maxRetriesPerRequest: null,
  tls: redisUrl.startsWith("rediss://") ? {} : undefined,
});

export const postQueue = new Queue("post-publisher", {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 5000,
    },
    removeOnComplete: 100,
    removeOnFail: 200,
  },
});

export interface PostJobData {
  postId: string;
  postPlatformIds: string[];
}

export async function schedulePost(
  postId: string,
  postPlatformIds: string[],
  scheduledAt: Date
) {
  const delay = scheduledAt.getTime() - Date.now();
  const jobDelay = Math.max(0, delay);

  await postQueue.add(
    "publish-post",
    { postId, postPlatformIds },
    {
      delay: jobDelay,
      jobId: `post-${postId}`,
    }
  );
}

export async function cancelScheduledPost(postId: string) {
  const job = await postQueue.getJob(`post-${postId}`);
  if (job) {
    await job.remove();
  }
}
