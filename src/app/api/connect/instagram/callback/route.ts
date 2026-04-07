import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  exchangeMetaCode,
  exchangeForLongLivedToken,
  getFacebookPages,
  getInstagramAccount,
} from "@/lib/apis/meta";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  if (error || !code || !state) {
    return NextResponse.redirect(
      new URL("/clients?error=oauth_failed", process.env.NEXTAUTH_URL!)
    );
  }

  try {
    const stateData = JSON.parse(Buffer.from(state, "base64").toString());
    const { clientId } = stateData;

    // Exchange code for token
    const tokenData = await exchangeMetaCode(code);
    const longLived = await exchangeForLongLivedToken(tokenData.access_token);
    const expiresAt = new Date(Date.now() + longLived.expiresIn * 1000);

    // Get pages linked to user
    const pages = await getFacebookPages(longLived.accessToken);

    let instagramAccount = null;

    for (const page of pages) {
      const igAccount = await getInstagramAccount(page.id, page.access_token);
      if (igAccount) {
        instagramAccount = {
          ...igAccount,
          pageAccessToken: page.access_token,
        };
        break;
      }
    }

    if (!instagramAccount) {
      return NextResponse.redirect(
        new URL(
          `/clients/${clientId}?error=no_instagram`,
          process.env.NEXTAUTH_URL!
        )
      );
    }

    await prisma.socialAccount.upsert({
      where: {
        clientId_platform: {
          clientId,
          platform: "INSTAGRAM",
        },
      },
      update: {
        accessToken: instagramAccount.pageAccessToken,
        accountId: instagramAccount.id,
        accountName: instagramAccount.username,
        expiresAt,
      },
      create: {
        clientId,
        platform: "INSTAGRAM",
        accessToken: instagramAccount.pageAccessToken,
        accountId: instagramAccount.id,
        accountName: instagramAccount.username,
        expiresAt,
      },
    });

    return NextResponse.redirect(
      new URL(`/clients/${clientId}?success=instagram`, process.env.NEXTAUTH_URL!)
    );
  } catch (err) {
    console.error("Instagram OAuth callback error:", err);
    return NextResponse.redirect(
      new URL("/clients?error=oauth_failed", process.env.NEXTAUTH_URL!)
    );
  }
}
