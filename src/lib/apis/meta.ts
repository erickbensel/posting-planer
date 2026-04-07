import axios from "axios";

const META_API_VERSION = "v19.0";
const META_BASE_URL = `https://graph.facebook.com/${META_API_VERSION}`;

export interface MetaTokenResponse {
  access_token: string;
  token_type: string;
  expires_in?: number;
}

export interface MetaPageInfo {
  id: string;
  name: string;
  access_token: string;
}

// Exchange short-lived token for long-lived token
export async function exchangeForLongLivedToken(
  shortLivedToken: string
): Promise<{ accessToken: string; expiresIn: number }> {
  const response = await axios.get(`${META_BASE_URL}/oauth/access_token`, {
    params: {
      grant_type: "fb_exchange_token",
      client_id: process.env.META_APP_ID,
      client_secret: process.env.META_APP_SECRET,
      fb_exchange_token: shortLivedToken,
    },
  });

  return {
    accessToken: response.data.access_token,
    expiresIn: response.data.expires_in || 5184000, // 60 days default
  };
}

// Get user's Facebook Pages
export async function getFacebookPages(
  userAccessToken: string
): Promise<MetaPageInfo[]> {
  const response = await axios.get(`${META_BASE_URL}/me/accounts`, {
    params: {
      access_token: userAccessToken,
      fields: "id,name,access_token",
    },
  });

  return response.data.data || [];
}

// Get Instagram Business Account linked to a Facebook Page
export async function getInstagramAccount(
  pageId: string,
  pageAccessToken: string
): Promise<{ id: string; username: string } | null> {
  try {
    const response = await axios.get(`${META_BASE_URL}/${pageId}`, {
      params: {
        access_token: pageAccessToken,
        fields: "instagram_business_account{id,username}",
      },
    });

    const igAccount = response.data.instagram_business_account;
    if (igAccount) {
      return { id: igAccount.id, username: igAccount.username };
    }
    return null;
  } catch {
    return null;
  }
}

// Publish photo to Instagram
export async function publishInstagramPhoto(
  igAccountId: string,
  accessToken: string,
  imageUrl: string,
  caption: string
): Promise<string> {
  // Step 1: Create media container
  const containerResponse = await axios.post(
    `${META_BASE_URL}/${igAccountId}/media`,
    null,
    {
      params: {
        image_url: imageUrl,
        caption,
        access_token: accessToken,
      },
    }
  );

  const containerId = containerResponse.data.id;

  // Step 2: Publish the container
  const publishResponse = await axios.post(
    `${META_BASE_URL}/${igAccountId}/media_publish`,
    null,
    {
      params: {
        creation_id: containerId,
        access_token: accessToken,
      },
    }
  );

  return publishResponse.data.id;
}

// Publish video to Instagram (Reels)
export async function publishInstagramVideo(
  igAccountId: string,
  accessToken: string,
  videoUrl: string,
  caption: string
): Promise<string> {
  // Step 1: Create media container
  const containerResponse = await axios.post(
    `${META_BASE_URL}/${igAccountId}/media`,
    null,
    {
      params: {
        media_type: "REELS",
        video_url: videoUrl,
        caption,
        access_token: accessToken,
      },
    }
  );

  const containerId = containerResponse.data.id;

  // Wait for video processing
  await waitForInstagramMedia(igAccountId, containerId, accessToken);

  // Step 2: Publish the container
  const publishResponse = await axios.post(
    `${META_BASE_URL}/${igAccountId}/media_publish`,
    null,
    {
      params: {
        creation_id: containerId,
        access_token: accessToken,
      },
    }
  );

  return publishResponse.data.id;
}

async function waitForInstagramMedia(
  igAccountId: string,
  containerId: string,
  accessToken: string,
  maxAttempts = 20
): Promise<void> {
  for (let i = 0; i < maxAttempts; i++) {
    await new Promise((resolve) => setTimeout(resolve, 3000));
    const response = await axios.get(`${META_BASE_URL}/${containerId}`, {
      params: {
        fields: "status_code,status",
        access_token: accessToken,
      },
    });

    if (response.data.status_code === "FINISHED") return;
    if (response.data.status_code === "ERROR") {
      throw new Error(`Instagram media processing failed: ${response.data.status}`);
    }
  }
  throw new Error("Instagram media processing timeout");
}

// Post to Facebook Page
export async function publishFacebookPost(
  pageId: string,
  accessToken: string,
  message: string,
  mediaUrls?: string[]
): Promise<string> {
  if (mediaUrls && mediaUrls.length > 0) {
    // Photo post
    const response = await axios.post(
      `${META_BASE_URL}/${pageId}/photos`,
      null,
      {
        params: {
          url: mediaUrls[0],
          message,
          access_token: accessToken,
        },
      }
    );
    return response.data.post_id || response.data.id;
  } else {
    // Text post
    const response = await axios.post(`${META_BASE_URL}/${pageId}/feed`, null, {
      params: {
        message,
        access_token: accessToken,
      },
    });
    return response.data.id;
  }
}

// Refresh a page access token (page tokens are long-lived by default)
export async function refreshMetaToken(
  userId: string,
  userAccessToken: string
): Promise<{ accessToken: string; expiresAt: Date }> {
  const result = await exchangeForLongLivedToken(userAccessToken);
  const expiresAt = new Date(Date.now() + result.expiresIn * 1000);
  return { accessToken: result.accessToken, expiresAt };
}

export function getMetaAuthUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: process.env.META_APP_ID!,
    redirect_uri: `${process.env.NEXTAUTH_URL}/api/connect/facebook/callback`,
    scope:
      "email,public_profile,pages_show_list,pages_read_engagement,pages_manage_posts,instagram_basic,instagram_content_publish",
    response_type: "code",
    state,
  });

  return `https://www.facebook.com/${META_API_VERSION}/dialog/oauth?${params.toString()}`;
}

export async function exchangeMetaCode(
  code: string
): Promise<MetaTokenResponse> {
  const response = await axios.get(`${META_BASE_URL}/oauth/access_token`, {
    params: {
      client_id: process.env.META_APP_ID,
      client_secret: process.env.META_APP_SECRET,
      redirect_uri: `${process.env.NEXTAUTH_URL}/api/connect/facebook/callback`,
      code,
    },
  });

  return response.data;
}
