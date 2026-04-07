"use client"

import { Platform } from "@prisma/client"
import { cn } from "@/lib/utils"

interface PlatformPreviewProps {
  platform: Platform
  content: string
  mediaUrls: string[]
  accountName?: string
}

const CHAR_LIMITS: Record<Platform, number> = {
  INSTAGRAM: 2200,
  FACEBOOK: 63206,
  LINKEDIN: 3000,
  TIKTOK: 2200,
  YOUTUBE: 5000,
}

export function PlatformPreview({
  platform,
  content,
  mediaUrls,
  accountName,
}: PlatformPreviewProps) {
  const charLimit = CHAR_LIMITS[platform]
  const charCount = content.length
  const isOverLimit = charCount > charLimit
  const charPercentage = Math.min((charCount / charLimit) * 100, 100)

  return (
    <div className="space-y-2">
      {/* Character counter */}
      <div className="flex items-center justify-between text-xs">
        <span className="text-gray-500">{platform}</span>
        <span className={cn("font-medium", isOverLimit ? "text-red-500" : "text-gray-500")}>
          {charCount.toLocaleString()} / {charLimit.toLocaleString()}
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={cn(
            "h-full rounded-full transition-all",
            isOverLimit ? "bg-red-500" : charPercentage > 80 ? "bg-yellow-500" : "bg-green-500"
          )}
          style={{ width: `${charPercentage}%` }}
        />
      </div>

      {/* Preview Card */}
      <PreviewCard platform={platform} content={content} mediaUrls={mediaUrls} accountName={accountName} />
    </div>
  )
}

function PreviewCard({ platform, content, mediaUrls, accountName }: PlatformPreviewProps) {
  const initials = accountName?.charAt(0)?.toUpperCase() || "B"

  if (platform === "INSTAGRAM") {
    return (
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden max-w-sm mx-auto shadow-sm">
        {/* Header */}
        <div className="flex items-center gap-2 px-3 py-2">
          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-purple-500 to-orange-400 flex items-center justify-center text-white text-xs font-bold">
            {initials}
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-900">{accountName || "bensel_media"}</p>
            <p className="text-[10px] text-gray-400">Jetzt</p>
          </div>
          <span className="ml-auto text-gray-400">•••</span>
        </div>
        {/* Image */}
        {mediaUrls[0] ? (
          <img src={mediaUrls[0]} alt="Post preview" className="w-full aspect-square object-cover" />
        ) : (
          <div className="w-full aspect-square bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
            <span className="text-gray-400 text-sm">Kein Bild</span>
          </div>
        )}
        {/* Actions */}
        <div className="px-3 py-2 space-y-1">
          <div className="flex gap-3 text-gray-600">
            <span>🤍</span><span>💬</span><span>✈️</span>
            <span className="ml-auto">🔖</span>
          </div>
          <p className="text-xs">
            <span className="font-semibold">{accountName || "bensel_media"}</span>{" "}
            <span className="text-gray-700 line-clamp-3">{content || "Dein Text kommt hier..."}</span>
          </p>
        </div>
      </div>
    )
  }

  if (platform === "FACEBOOK") {
    return (
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden max-w-sm mx-auto shadow-sm">
        <div className="flex items-center gap-2 px-3 py-3">
          <div className="h-9 w-9 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-bold">
            {initials}
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">{accountName || "Bensel Media"}</p>
            <p className="text-xs text-gray-400">Gerade eben · 🌍</p>
          </div>
        </div>
        <div className="px-3 pb-2">
          <p className="text-sm text-gray-700 line-clamp-4">{content || "Dein Text kommt hier..."}</p>
        </div>
        {mediaUrls[0] && (
          <img src={mediaUrls[0]} alt="Post preview" className="w-full max-h-72 object-cover" />
        )}
        <div className="px-3 py-2 flex gap-4 text-xs text-gray-500 border-t border-gray-100">
          <span>👍 Gefällt mir</span>
          <span>💬 Kommentieren</span>
          <span>↗️ Teilen</span>
        </div>
      </div>
    )
  }

  if (platform === "LINKEDIN") {
    return (
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden max-w-sm mx-auto shadow-sm">
        <div className="flex items-center gap-2 px-3 py-3">
          <div className="h-10 w-10 rounded-full bg-blue-700 flex items-center justify-center text-white text-sm font-bold">
            {initials}
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">{accountName || "Bensel Media"}</p>
            <p className="text-xs text-gray-400">Social Media Agentur</p>
            <p className="text-xs text-gray-400">Gerade eben · 🌍</p>
          </div>
        </div>
        <div className="px-3 pb-2">
          <p className="text-sm text-gray-700 line-clamp-5">{content || "Dein Text kommt hier..."}</p>
        </div>
        {mediaUrls[0] && (
          <img src={mediaUrls[0]} alt="Post preview" className="w-full max-h-60 object-cover" />
        )}
        <div className="px-3 py-2 flex gap-3 text-xs text-gray-500 border-t border-gray-100">
          <span>👍 Gefällt mir</span>
          <span>💬 Kommentar</span>
          <span>🔄 Teilen</span>
        </div>
      </div>
    )
  }

  if (platform === "TIKTOK") {
    return (
      <div className="bg-black rounded-xl overflow-hidden max-w-[200px] mx-auto shadow-sm relative" style={{ aspectRatio: "9/16" }}>
        {mediaUrls[0] ? (
          <img src={mediaUrls[0]} alt="TikTok preview" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gray-900 flex items-center justify-center">
            <span className="text-gray-600 text-xs">Kein Video</span>
          </div>
        )}
        <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80">
          <p className="text-white text-xs font-semibold">@{accountName || "bensel_media"}</p>
          <p className="text-white text-xs line-clamp-2 mt-1">{content || "Dein Text..."}</p>
        </div>
        <div className="absolute right-2 bottom-16 flex flex-col gap-3 items-center">
          <span className="text-white text-lg">❤️</span>
          <span className="text-white text-lg">💬</span>
          <span className="text-white text-lg">↗️</span>
        </div>
      </div>
    )
  }

  if (platform === "YOUTUBE") {
    const title = content.split("\n")[0] || "Videotitel"
    return (
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden max-w-sm mx-auto shadow-sm">
        {mediaUrls[0] ? (
          <div className="relative">
            <img src={mediaUrls[0]} alt="YouTube thumbnail" className="w-full aspect-video object-cover" />
            <div className="absolute bottom-2 right-2 bg-black text-white text-xs px-1.5 py-0.5 rounded">
              0:00
            </div>
          </div>
        ) : (
          <div className="w-full aspect-video bg-gray-200 flex items-center justify-center">
            <span className="text-5xl">▶️</span>
          </div>
        )}
        <div className="p-3 flex gap-2">
          <div className="h-8 w-8 rounded-full bg-red-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
            {initials}
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900 line-clamp-2">{title}</p>
            <p className="text-xs text-gray-500">{accountName || "Bensel Media"} · Gerade eben</p>
          </div>
        </div>
      </div>
    )
  }

  return null
}
