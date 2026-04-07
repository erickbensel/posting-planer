import axios from "axios";

const LINKEDIN_API_URL = "https://api.linkedin.com/v2";
const LINKEDIN_AUTH_URL = "https://www.linkedin.com/oauth/v2";

export function getLinkedInAuthUrl(state: string): string {
  const params = new URLSearchParams({
    response_type: "code",
    client_id: process.env.LINKEDIN_CLIENT_ID!,
    redirect_uri: `${process.env.NEXTAUTH_URL}/api/connect/linkedin/callback`,
    state,
    scope: "openid profile email w_member_social",
  });

  return `${LINKEDIN_AUTH_URL}/authorization?${params.toString()}`;
}

export async function exchangeLinkedInCode(code: string): Promise<{
  accessToken: string;
  expiresIn: number;
  refreshToken?: string;
}> {
  const response = await axios.post(
    `${LINKEDIN_AUTH_URL}/accessToken`,
    new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: `${process.env.NEXTAUTH_URL}/api/connect/linkedin/callback`,
      client_id: process.env.LINKEDIN_CLIENT_ID!,
      client_secret: process.env.LINKEDIN_CLIENT_SECRET!,
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
    refreshToken: response.data.refresh_token,
  };
}

export async function getLinkedInProfile(
  accessToken: string
): Promise<{ id: string; localizedFirstName: string; localizedLastName: string }> {
  const response = await axios.get(`${LINKEDIN_API_URL}/userinfo`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  return {
    id: response.data.sub,
    localizedFirstName: response.data.given_name,
    localizedLastName: response.data.family_name,
  };
}

export async function publishLinkedInPost(
  personUrn: string,
  accessToken: string,
  content: string,
  mediaUrls?: string[]
): Promise<string> {
  const author = `urn:li:person:${personUrn}`;

  let shareContent: any = {
    shareCommentary: {
      text: content,
    },
    shareMediaCategory: "NONE",
  };

  if (mediaUrls && mediaUrls.length > 0) {
    // Register upload for each image
    const mediaAssets = await Promise.all(
      mediaUrls.map((url) => registerLinkedInImage(personUrn, accessToken, url))
    );

    shareContent = {
      shareCommentary: {
        text: content,
      },
      shareMediaCategory: "IMAGE",
      media: mediaAssets.map((asset) => ({
        status: "READY",
        media: asset,
      })),
    };
  }

  const postData = {
    author,
    lifecycleState: "PUBLISHED",
    specificContent: {
      "com.linkedin.ugc.ShareContent": shareContent,
    },
    visibility: {
      "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC",
    },
  };

  const response = await axios.post(`${LINKEDIN_API_URL}/ugcPosts`, postData, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      "X-Restli-Protocol-Version": "2.0.0",
    },
  });

  return response.headers["x-restli-id"] || response.data.id;
}

async function registerLinkedInImage(
  personUrn: string,
  accessToken: string,
  imageUrl: string
): Promise<string> {
  // Register the image upload
  const registerResponse = await axios.post(
    `${LINKEDIN_API_URL}/assets?action=registerUpload`,
    {
      registerUploadRequest: {
        recipes: ["urn:li:digitalmediaRecipe:feedshare-image"],
        owner: `urn:li:person:${personUrn}`,
        serviceRelationships: [
          {
            relationshipType: "OWNER",
            identifier: "urn:li:userGeneratedContent",
          },
        ],
      },
    },
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    }
  );

  const uploadUrl =
    registerResponse.data.value.uploadMechanism[
      "com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest"
    ].uploadUrl;
  const asset = registerResponse.data.value.asset;

  // Download the image from URL and upload to LinkedIn
  const imageResponse = await axios.get(imageUrl, {
    responseType: "arraybuffer",
  });

  await axios.put(uploadUrl, imageResponse.data, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/octet-stream",
    },
  });

  return asset;
}

export async function refreshLinkedInToken(
  refreshToken: string
): Promise<{ accessToken: string; expiresIn: number }> {
  const response = await axios.post(
    `${LINKEDIN_AUTH_URL}/accessToken`,
    new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
      client_id: process.env.LINKEDIN_CLIENT_ID!,
      client_secret: process.env.LINKEDIN_CLIENT_SECRET!,
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
