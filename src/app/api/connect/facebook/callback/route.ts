import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  exchangeMetaCode,
  exchangeForLongLivedToken,
  getFacebookPages,
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
    const { clientId, userId } = stateData;

    // Exchange code for token
    const tokenData = await exchangeMetaCode(code);

    // Exchange for long-lived token
    const longLived = await exchangeForLongLivedToken(tokenData.access_token);
    const expiresAt = new Date(Date.now() + longLived.expiresIn * 1000);

    // Get pages
    const pages = await getFacebookPages(longLived.accessToken);

    if (pages.length === 0) {
      return NextResponse.redirect(
        new URL(
          `/clients/${clientId}?error=no_pages`,
          process.env.NEXTAUTH_URL!
        )
      );
    }

    // Use first page (in production, you'd show a selection UI)
    const page = pages[0];

    // Upsert social account
    await prisma.socialAccount.upsert({
      where: {
        clientId_platform: {
          clientId,
          platform: "FACEBOOK",
        },
      },
      update: {
        accessToken: page.access_token,
        accountId: page.id,
        accountName: page.name,
        expiresAt,
      },
      create: {
        clientId,
        platform: "FACEBOOK",
        accessToken: page.access_token,
        accountId: page.id,
        accountName: page.name,
        expiresAt,
      },
    });

    return NextResponse.redirect(
      new URL(`/clients/${clientId}?success=facebook`, process.env.NEXTAUTH_URL!)
    );
  } catch (err) {
    console.error("Facebook OAuth callback error:", err);
    return NextResponse.redirect(
      new URL("/clients?error=oauth_failed", process.env.NEXTAUTH_URL!)
    );
  }
}
