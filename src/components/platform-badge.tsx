"use client"

import { Platform } from "@prisma/client"
import { cn } from "@/lib/utils"

interface PlatformBadgeProps {
  platform: Platform
  size?: "sm" | "md" | "lg"
  showLabel?: boolean
  className?: string
}

const platformConfig = {
  INSTAGRAM: {
    label: "Instagram",
    bg: "bg-gradient-to-r from-purple-500 via-pink-500 to-orange-400",
    textColor: "text-white",
    icon: "📸",
  },
  FACEBOOK: {
    label: "Facebook",
    bg: "bg-blue-600",
    textColor: "text-white",
    icon: "👍",
  },
  LINKEDIN: {
    label: "LinkedIn",
    bg: "bg-blue-700",
    textColor: "text-white",
    icon: "💼",
  },
  TIKTOK: {
    label: "TikTok",
    bg: "bg-black",
    textColor: "text-white",
    icon: "🎵",
  },
  YOUTUBE: {
    label: "YouTube",
    bg: "bg-red-600",
    textColor: "text-white",
    icon: "▶️",
  },
}

export function PlatformBadge({
  platform,
  size = "md",
  showLabel = true,
  className,
}: PlatformBadgeProps) {
  const config = platformConfig[platform]

  const sizeClasses = {
    sm: "text-xs px-2 py-0.5",
    md: "text-sm px-3 py-1",
    lg: "text-base px-4 py-1.5",
  }

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full font-medium",
        config.bg,
        config.textColor,
        sizeClasses[size],
        className
      )}
    >
      <span>{config.icon}</span>
      {showLabel && <span>{config.label}</span>}
    </span>
  )
}

export function getPlatformColor(platform: Platform): string {
  const colors = {
    INSTAGRAM: "#E1306C",
    FACEBOOK: "#1877F2",
    LINKEDIN: "#0A66C2",
    TIKTOK: "#000000",
    YOUTUBE: "#FF0000",
  }
  return colors[platform]
}

export function getPlatformLabel(platform: Platform): string {
  return platformConfig[platform].label
}
