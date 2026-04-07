import axios from "axios";

const TIKTOK_AUTH_URL = "https://www.tiktok.com/v2/auth/authorize/";
const TIKTOK_API_URL = "https://open.tiktokapis.com/v2";

export function getTikTokAuthUrl(state: string): string {
  const params = new URLSearchParams({
    client_key: process.env.TIKTOK_CLIENT_KEY!,
    response_type: "code",
    scope: "user.info.basic,video.publish,video.upload",
    redirect_uri: `${process.env.NEXTAUTH_URL}/api/connect/tiktok/callback`,
    state,
  });

  return `${TIKTOK_AUTH_URL}?${params.toString()}`;
}

export async function exchangeTikTokCode(code: string): Promise<{
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  openId: string;
}> {
  const response = await axios.post(
    `${TIKTOK_API_URL}/oauth/token/`,
    new URLSearchParams({
      client_key: process.env.TIKTOK_CLIENT_KEY!,
      client_secret: process.env.TIKTOK_CLIENT_SECRET!,
      code,
      grant_type: "authorization_code",
      redirect_uri: `${process.env.NEXTAUTH_URL}/api/connect/tiktok/callback`,
    }).toString(),
    {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    }
  );

  const data = response.data.data;
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresIn: data.expires_in,
    openId: data.open_id,
  };
}

export async function getTikTokUserInfo(
  accessToken: string,
  openId: string
): Promise<{ displayName: string; avatarUrl: string }> {
  const response = await axios.get(`${TIKTOK_API_URL}/user/info/`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    params: {
      fields: "display_name,avatar_url",
    },
  });

  const data = response.data.data.user;
  return {
    displayName: data.display_name,
    avatarUrl: data.avatar_url,
  };
}

export async function publishTikTokVideo(
  openId: string,
  accessToken: string,
  videoUrl: string,
  caption: string
): Promise<string> {
  // Step 1: Initialize the video upload
  const initResponse = await axios.post(
    `${TIKTOK_API_URL}/post/publish/video/init/`,
    {
      post_info: {
        title: caption.substring(0, 150),
        privacy_level: "PUBLIC_TO_EVERYONE",
        disable_duet: false,
        disable_comment: false,
        disable_stitch: false,
        video_cover_timestamp_ms: 1000,
      },
      source_info: {
        source: "PULL_FROM_URL",
        video_url: videoUrl,
      },
    },
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json; charset=UTF-8",
      },
    }
  );

  const publishId = initResponse.data.data.publish_id;

  // Step 2: Check publishing status
  await waitForTikTokPublish(accessToken, publishId);

  return publishId;
}

async function waitForTikTokPublish(
  accessToken: string,
  publishId: string,
  maxAttempts = 20
): Promise<void> {
  for (let i = 0; i < maxAttempts; i++) {
    await new Promise((resolve) => setTimeout(resolve, 5000));

    const response = await axios.post(
      `${TIKTOK_API_URL}/post/publish/status/fetch/`,
      { publish_id: publishId },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json; charset=UTF-8",
        },
      }
    );

    const status = response.data.data.status;
    if (status === "PUBLISH_COMPLETE") return;
    if (status === "FAILED") {
      throw new Error(
        `TikTok publish failed: ${response.data.data.fail_reason}`
      );
    }
  }
  throw new Error("TikTok publish timeout");
}

export async function refreshTikTokToken(
  refreshToken: string
): Promise<{ accessToken: string; refreshToken: string; expiresIn: number }> {
  const response = await axios.post(
    `${TIKTOK_API_URL}/oauth/token/`,
    new URLSearchParams({
      client_key: process.env.TIKTOK_CLIENT_KEY!,
      client_secret: process.env.TIKTOK_CLIENT_SECRET!,
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }).toString(),
    {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    }
  );

  const data = response.data.data;
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresIn: data.expires_in,
  };
}
