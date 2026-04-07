import axios from "axios";

const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const YOUTUBE_API_URL = "https://www.googleapis.com/youtube/v3";

export function getYouTubeAuthUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID!,
    redirect_uri: `${process.env.NEXTAUTH_URL}/api/connect/youtube/callback`,
    response_type: "code",
    scope: [
      "https://www.googleapis.com/auth/youtube.upload",
      "https://www.googleapis.com/auth/youtube.readonly",
      "https://www.googleapis.com/auth/userinfo.profile",
    ].join(" "),
    access_type: "offline",
    prompt: "consent",
    state,
  });

  return `${GOOGLE_AUTH_URL}?${params.toString()}`;
}

export async function exchangeYouTubeCode(code: string): Promise<{
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}> {
  const response = await axios.post(
    GOOGLE_TOKEN_URL,
    new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri: `${process.env.NEXTAUTH_URL}/api/connect/youtube/callback`,
      grant_type: "authorization_code",
    }).toString(),
    {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    }
  );

  return {
    accessToken: response.data.access_token,
    refreshToken: response.data.refresh_token,
    expiresIn: response.data.expires_in,
  };
}

export async function getYouTubeChannelInfo(
  accessToken: string
): Promise<{ id: string; title: string; thumbnailUrl: string }> {
  const response = await axios.get(`${YOUTUBE_API_URL}/channels`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    params: {
      part: "snippet",
      mine: true,
    },
  });

  const channel = response.data.items?.[0];
  if (!channel) {
    throw new Error("Kein YouTube-Kanal gefunden");
  }

  return {
    id: channel.id,
    title: channel.snippet.title,
    thumbnailUrl: channel.snippet.thumbnails?.default?.url || "",
  };
}

export async function uploadYouTubeVideo(
  accessToken: string,
  videoUrl: string,
  title: string,
  description: string
): Promise<string> {
  // Download the video first
  const videoResponse = await axios.get(videoUrl, {
    responseType: "stream",
  });

  const contentLength = videoResponse.headers["content-length"];
  const contentType = videoResponse.headers["content-type"] || "video/mp4";

  // Initialize resumable upload
  const initResponse = await axios.post(
    `https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status`,
    {
      snippet: {
        title: title.substring(0, 100),
        description,
        tags: [],
        categoryId: "22", // People & Blogs
      },
      status: {
        privacyStatus: "public",
        selfDeclaredMadeForKids: false,
      },
    },
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        "X-Upload-Content-Type": contentType,
        ...(contentLength ? { "X-Upload-Content-Length": contentLength } : {}),
      },
    }
  );

  const uploadUrl = initResponse.headers.location;

  // Upload the video
  const uploadResponse = await axios.put(uploadUrl, videoResponse.data, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": contentType,
    },
    maxContentLength: Infinity,
    maxBodyLength: Infinity,
  });

  return uploadResponse.data.id;
}

export async function refreshYouTubeToken(
  refreshToken: string
): Promise<{ accessToken: string; expiresIn: number }> {
  const response = await axios.post(
    GOOGLE_TOKEN_URL,
    new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }).toString(),
    {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    }
  );

  return {
    accessToken: response.data.access_token,
    expiresIn: response.data.expires_in,
  };
}
