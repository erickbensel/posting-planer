export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { uploadToCloudinary } from "@/lib/cloudinary";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
  }

  const userId = (session.user as any).id;

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const clientId = formData.get("clientId") as string;

    if (!file) {
      return NextResponse.json(
        { error: "Keine Datei hochgeladen" },
        { status: 400 }
      );
    }

    if (!clientId) {
      return NextResponse.json(
        { error: "Kunden-ID fehlt" },
        { status: 400 }
      );
    }

    // Verify client belongs to user
    const client = await prisma.client.findFirst({
      where: { id: clientId, userId },
    });

    if (!client) {
      return NextResponse.json(
        { error: "Kunde nicht gefunden" },
        { status: 404 }
      );
    }

    // Check file size (max 100MB)
    const maxSize = 100 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "Datei zu groß (max. 100 MB)" },
        { status: 400 }
      );
    }

    // Check file type
    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/gif",
      "video/mp4",
      "video/quicktime",
      "video/mpeg",
    ];

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Ungültiger Dateityp" },
        { status: 400 }
      );
    }

    const isVideo = file.type.startsWith("video/");

    // Convert File to Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to Cloudinary
    const result = await uploadToCloudinary(buffer, {
      folder: `bensel-media/${clientId}`,
      resource_type: isVideo ? "video" : "image",
    });

    // Save to database
    const mediaFile = await prisma.mediaFile.create({
      data: {
        url: result.url,
        type: isVideo ? "VIDEO" : "IMAGE",
        cloudinaryId: result.publicId,
        clientId,
      },
    });

    return NextResponse.json({
      id: mediaFile.id,
      url: mediaFile.url,
      type: mediaFile.type,
      cloudinaryId: mediaFile.cloudinaryId,
    });
  } catch (error) {
    console.error("Media upload error:", error);
    return NextResponse.json(
      { error: "Upload fehlgeschlagen" },
      { status: 500 }
    );
  }
}
