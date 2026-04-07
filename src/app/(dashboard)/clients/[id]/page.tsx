import { notFound } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { Platform } from "@prisma/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { PlatformBadge } from "@/components/platform-badge"
import { ConnectPlatformButton } from "@/components/connect-platform-button"
import { Building2, Calendar, FileText, Send } from "lucide-react"
import { format } from "date-fns"
import { de } from "date-fns/locale"
import Link from "next/link"

const ALL_PLATFORMS: Platform[] = [
  "INSTAGRAM",
  "FACEBOOK",
  "LINKEDIN",
  "TIKTOK",
  "YOUTUBE",
]

const platformIcons: Record<Platform, string> = {
  INSTAGRAM: "📸",
  FACEBOOK: "👍",
  LINKEDIN: "💼",
  TIKTOK: "🎵",
  YOUTUBE: "▶️",
}

const platformDescriptions: Record<Platform, string> = {
  INSTAGRAM: "Bilder & Reels veröffentlichen",
  FACEBOOK: "Posts & Fotos auf Pages teilen",
  LINKEDIN: "Professionelle Inhalte teilen",
  TIKTOK: "Kurzvideos veröffentlichen",
  YOUTUBE: "Videos hochladen",
}

export default async function ClientDetailPage({
  params,
  searchParams,
}: {
  params: { id: string }
  searchParams: { success?: string; error?: string }
}) {
  const session = await getServerSession(authOptions)
  const userId = (session?.user as any)?.id

  const client = await prisma.client.findFirst({
    where: { id: params.id, userId },
    include: {
      socialAccounts: true,
      posts: {
        include: { postPlatforms: true },
        orderBy: { createdAt: "desc" },
        take: 10,
      },
      _count: { select: { posts: true } },
    },
  })

  if (!client) {
    notFound()
  }

  const connectedPlatforms = new Map(
    client.socialAccounts.map((acc) => [acc.platform, acc])
  )

  const statusLabel: Record<string, string> = {
    DRAFT: "Entwurf",
    SCHEDULED: "Geplant",
    PUBLISHED: "Veröffentlicht",
    FAILED: "Fehlgeschlagen",
  }

  const statusVariant: Record<string, any> = {
    DRAFT: "secondary",
    SCHEDULED: "default",
    PUBLISHED: "success",
    FAILED: "destructive",
  }

  return (
    <div className="p-8">
      {/* Success/Error Banner */}
      {searchParams.success && (
        <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-sm text-green-700 font-medium">
            {searchParams.success === "instagram" && "Instagram erfolgreich verbunden!"}
            {searchParams.success === "facebook" && "Facebook erfolgreich verbunden!"}
            {searchParams.success === "linkedin" && "LinkedIn erfolgreich verbunden!"}
            {searchParams.success === "tiktok" && "TikTok erfolgreich verbunden!"}
            {searchParams.success === "youtube" && "YouTube erfolgreich verbunden!"}
          </p>
        </div>
      )}

      {searchParams.error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-700 font-medium">
            {searchParams.error === "no_pages" &&
              "Keine Facebook Pages gefunden. Bitte erstelle zuerst eine Facebook Page."}
            {searchParams.error === "no_instagram" &&
              "Kein Instagram Business Account gefunden. Verknüpfe dein Instagram mit einer Facebook Page."}
            {searchParams.error === "oauth_failed" &&
              "Die Verbindung konnte nicht hergestellt werden. Bitte versuche es erneut."}
          </p>
        </div>
      )}

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
          <Link href="/clients" className="hover:text-indigo-600">Kunden</Link>
          <span>/</span>
          <span className="text-gray-900 font-medium">{client.name}</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 rounded-xl bg-indigo-100 flex items-center justify-center">
            {client.logo ? (
              <img src={client.logo} alt={client.name} className="h-14 w-14 rounded-xl object-cover" />
            ) : (
              <Building2 className="h-7 w-7 text-indigo-600" />
            )}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{client.name}</h1>
            <p className="text-gray-500 text-sm">{client._count.posts} Beiträge gesamt</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Platform connections */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Social Media Kanäle</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {ALL_PLATFORMS.map((platform) => {
                const connected = connectedPlatforms.get(platform)
                return (
                  <div
                    key={platform}
                    className="flex items-center justify-between p-4 rounded-xl border border-gray-100 hover:border-gray-200 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{platformIcons[platform]}</span>
                      <div>
                        <div className="flex items-center gap-2">
                          <PlatformBadge platform={platform} size="sm" />
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {platformDescriptions[platform]}
                        </p>
                        {connected?.expiresAt && (
                          <p className="text-[10px] text-gray-400 mt-0.5">
                            Token läuft ab:{" "}
                            {format(new Date(connected.expiresAt), "dd.MM.yyyy", { locale: de })}
                          </p>
                        )}
                      </div>
                    </div>
                    <ConnectPlatformButton
                      clientId={client.id}
                      platform={platform}
                      isConnected={!!connected}
                      accountName={connected?.accountName}
                    />
                  </div>
                )
              })}
            </CardContent>
          </Card>

          {/* Quick actions */}
          <div className="grid grid-cols-2 gap-3">
            <Link
              href={`/composer?clientId=${client.id}`}
              className="flex items-center gap-3 p-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-colors"
            >
              <Send className="h-5 w-5" />
              <div>
                <p className="font-medium text-sm">Beitrag erstellen</p>
                <p className="text-xs text-indigo-200">Für diesen Kunden</p>
              </div>
            </Link>
            <Link
              href={`/calendar?clientId=${client.id}`}
              className="flex items-center gap-3 p-4 bg-white border border-gray-200 hover:border-indigo-300 text-gray-700 rounded-xl transition-colors"
            >
              <Calendar className="h-5 w-5 text-indigo-600" />
              <div>
                <p className="font-medium text-sm">Kalender ansehen</p>
                <p className="text-xs text-gray-400">Geplante Beiträge</p>
              </div>
            </Link>
          </div>
        </div>

        {/* Right: Recent posts */}
        <div>
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Letzte Beiträge</CardTitle>
                <Link
                  href={`/posts?clientId=${client.id}`}
                  className="text-xs text-indigo-600 hover:underline"
                >
                  Alle
                </Link>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {client.posts.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4">
                  Noch keine Beiträge
                </p>
              ) : (
                client.posts.map((post) => (
                  <div
                    key={post.id}
                    className="p-3 bg-gray-50 rounded-lg space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <Badge variant={statusVariant[post.status]} className="text-[10px]">
                        {statusLabel[post.status]}
                      </Badge>
                      <span className="text-[10px] text-gray-400">
                        {post.scheduledAt
                          ? format(new Date(post.scheduledAt), "dd.MM. HH:mm", { locale: de })
                          : format(new Date(post.createdAt), "dd.MM.", { locale: de })}
                      </span>
                    </div>
                    <p className="text-xs text-gray-700 line-clamp-2">{post.content}</p>
                    <div className="flex gap-1">
                      {post.postPlatforms.map((pp) => (
                        <PlatformBadge
                          key={pp.id}
                          platform={pp.platform}
                          size="sm"
                          showLabel={false}
                        />
                      ))}
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
