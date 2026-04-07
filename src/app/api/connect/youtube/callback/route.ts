import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { exchangeYouTubeCode, getYouTubeChannelInfo } from "@/lib/apis/youtube";

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

    const { accessToken, refreshToken, expiresIn } =
      await exchangeYouTubeCode(code);

    const channel = await getYouTubeChannelInfo(accessToken);
    const expiresAt = new Date(Date.now() + expiresIn * 1000);

    await prisma.socialAccount.upsert({
      where: {
        clientId_platform: {
          clientId,
          platform: "YOUTUBE",
        },
      },
      update: {
        accessToken,
        refreshToken,
        accountId: channel.id,
        accountName: channel.title,
        expiresAt,
      },
      create: {
        clientId,
        platform: "YOUTUBE",
        accessToken,
        refreshToken,
        accountId: channel.id,
        accountName: channel.title,
        expiresAt,
      },
    });

    return NextResponse.redirect(
      new URL(`/clients/${clientId}?success=youtube`, process.env.NEXTAUTH_URL!)
    );
  } catch (err) {
    console.error("YouTube OAuth callback error:", err);
    return NextResponse.redirect(
      new URL("/clients?error=oauth_failed", process.env.NEXTAUTH_URL!)
    );
  }
}
