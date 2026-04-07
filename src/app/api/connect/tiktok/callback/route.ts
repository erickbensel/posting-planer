import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { exchangeTikTokCode, getTikTokUserInfo } from "@/lib/apis/tiktok";

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

    const { accessToken, refreshToken, expiresIn, openId } =
      await exchangeTikTokCode(code);

    const userInfo = await getTikTokUserInfo(accessToken, openId);
    const expiresAt = new Date(Date.now() + expiresIn * 1000);

    await prisma.socialAccount.upsert({
      where: {
        clientId_platform: {
          clientId,
          platform: "TIKTOK",
        },
      },
      update: {
        accessToken,
        refreshToken,
        accountId: openId,
        accountName: userInfo.displayName,
        expiresAt,
      },
      create: {
        clientId,
        platform: "TIKTOK",
        accessToken,
        refreshToken,
        accountId: openId,
        accountName: userInfo.displayName,
        expiresAt,
      },
    });

    return NextResponse.redirect(
      new URL(`/clients/${clientId}?success=tiktok`, process.env.NEXTAUTH_URL!)
    );
  } catch (err) {
    console.error("TikTok OAuth callback error:", err);
    return NextResponse.redirect(
      new URL("/clients?error=oauth_failed", process.env.NEXTAUTH_URL!)
    );
  }
}
