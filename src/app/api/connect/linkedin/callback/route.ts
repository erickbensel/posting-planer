import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { exchangeLinkedInCode, getLinkedInProfile } from "@/lib/apis/linkedin";

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

    const { accessToken, expiresIn, refreshToken } =
      await exchangeLinkedInCode(code);

    const profile = await getLinkedInProfile(accessToken);
    const expiresAt = new Date(Date.now() + expiresIn * 1000);

    await prisma.socialAccount.upsert({
      where: {
        clientId_platform: {
          clientId,
          platform: "LINKEDIN",
        },
      },
      update: {
        accessToken,
        refreshToken: refreshToken || null,
        accountId: profile.id,
        accountName: `${profile.localizedFirstName} ${profile.localizedLastName}`,
        expiresAt,
      },
      create: {
        clientId,
        platform: "LINKEDIN",
        accessToken,
        refreshToken: refreshToken || null,
        accountId: profile.id,
        accountName: `${profile.localizedFirstName} ${profile.localizedLastName}`,
        expiresAt,
      },
    });

    return NextResponse.redirect(
      new URL(`/clients/${clientId}?success=linkedin`, process.env.NEXTAUTH_URL!)
    );
  } catch (err) {
    console.error("LinkedIn OAuth callback error:", err);
    return NextResponse.redirect(
      new URL("/clients?error=oauth_failed", process.env.NEXTAUTH_URL!)
    );
  }
}
