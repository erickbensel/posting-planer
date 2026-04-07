"use client"

import { useState } from "react"
import { Platform } from "@prisma/client"
import { Button } from "@/components/ui/button"
import { Loader2, Plus, Trash2 } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import axios from "axios"

interface ConnectPlatformButtonProps {
  clientId: string
  platform: Platform
  isConnected: boolean
  accountName?: string
  onDisconnect?: () => void
}

const platformLabels: Record<Platform, string> = {
  INSTAGRAM: "Instagram",
  FACEBOOK: "Facebook",
  LINKEDIN: "LinkedIn",
  TIKTOK: "TikTok",
  YOUTUBE: "YouTube",
}

const platformColors: Record<Platform, string> = {
  INSTAGRAM: "from-purple-500 to-orange-400",
  FACEBOOK: "bg-blue-600",
  LINKEDIN: "bg-blue-700",
  TIKTOK: "bg-black",
  YOUTUBE: "bg-red-600",
}

const platformEndpoints: Record<Platform, string> = {
  INSTAGRAM: "/api/connect/instagram",
  FACEBOOK: "/api/connect/facebook",
  LINKEDIN: "/api/connect/linkedin",
  TIKTOK: "/api/connect/tiktok",
  YOUTUBE: "/api/connect/youtube",
}

export function ConnectPlatformButton({
  clientId,
  platform,
  isConnected,
  accountName,
  onDisconnect,
}: ConnectPlatformButtonProps) {
  const [loading, setLoading] = useState(false)

  const handleConnect = async () => {
    setLoading(true)
    try {
      // Store clientId in session storage for the OAuth callback
      sessionStorage.setItem("oauth_client_id", clientId)
      sessionStorage.setItem("oauth_platform", platform)

      // Get OAuth URL from backend
      const response = await axios.get(
        `${platformEndpoints[platform]}?clientId=${clientId}`
      )
      const { url } = response.data

      // Redirect to OAuth provider
      window.location.href = url
    } catch (error) {
      toast({
        title: "Fehler",
        description: "Verbindung konnte nicht hergestellt werden.",
        variant: "destructive",
      })
      setLoading(false)
    }
  }

  const handleDisconnect = async () => {
    if (!confirm(`${platformLabels[platform]} wirklich trennen?`)) return

    setLoading(true)
    try {
      await axios.delete(`/api/connect/${platform.toLowerCase()}`, {
        data: { clientId },
      })
      toast({
        title: "Getrennt",
        description: `${platformLabels[platform]} wurde erfolgreich getrennt.`,
      })
      onDisconnect?.()
    } catch (error) {
      toast({
        title: "Fehler",
        description: "Trennung fehlgeschlagen.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  if (isConnected) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm text-green-600 font-medium">
          ✓ {accountName || "Verbunden"}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={handleDisconnect}
          disabled={loading}
          className="text-red-500 border-red-200 hover:bg-red-50"
        >
          {loading ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <Trash2 className="h-3 w-3" />
          )}
          <span className="ml-1">Trennen</span>
        </Button>
      </div>
    )
  }

  return (
    <Button
      size="sm"
      onClick={handleConnect}
      disabled={loading}
      className="bg-indigo-600 hover:bg-indigo-700 text-white"
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin mr-2" />
      ) : (
        <Plus className="h-4 w-4 mr-2" />
      )}
      {platformLabels[platform]} verbinden
    </Button>
  )
}
