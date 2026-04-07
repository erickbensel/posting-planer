"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { CalendarView } from "@/components/calendar-view"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { PlatformBadge } from "@/components/platform-badge"
import { format } from "date-fns"
import { de } from "date-fns/locale"
import { toast } from "@/hooks/use-toast"
import axios from "axios"
import { PostStatus } from "@prisma/client"

interface Post {
  id: string
  content: string
  status: PostStatus
  scheduledAt: string | null
  publishedAt: string | null
  postPlatforms: Array<{ platform: any; id: string }>
  client?: { id: string; name: string }
}

interface CalendarPageClientProps {
  posts: Post[]
  clients: Array<{ id: string; name: string }>
  defaultClientId: string
}

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

export function CalendarPageClient({
  posts,
  clients,
  defaultClientId,
}: CalendarPageClientProps) {
  const router = useRouter()
  const [selectedClientId, setSelectedClientId] = useState(defaultClientId)
  const [selectedPost, setSelectedPost] = useState<Post | null>(null)
  const [deleting, setDeleting] = useState(false)

  const filtered = selectedClientId
    ? posts.filter((p) => p.client?.id === selectedClientId)
    : posts

  const handleClientChange = (value: string) => {
    setSelectedClientId(value === "all" ? "" : value)
  }

  const handleDeletePost = async () => {
    if (!selectedPost) return
    setDeleting(true)
    try {
      await axios.delete(`/api/posts/${selectedPost.id}/publish`)
      toast({
        title: "Beitrag gelöscht",
        description: "Der Beitrag wurde erfolgreich gelöscht.",
      })
      setSelectedPost(null)
      router.refresh()
    } catch (error) {
      toast({
        title: "Fehler",
        description: "Beitrag konnte nicht gelöscht werden.",
        variant: "destructive",
      })
    } finally {
      setDeleting(false)
    }
  }

  const handlePublishNow = async () => {
    if (!selectedPost) return
    try {
      await axios.post(`/api/posts/${selectedPost.id}/publish`)
      toast({
        title: "Wird veröffentlicht",
        description: "Der Beitrag wird jetzt veröffentlicht.",
      })
      setSelectedPost(null)
      router.refresh()
    } catch (error) {
      toast({
        title: "Fehler",
        description: "Beitrag konnte nicht veröffentlicht werden.",
        variant: "destructive",
      })
    }
  }

  return (
    <>
      {/* Client filter */}
      {clients.length > 1 && (
        <div className="flex items-center gap-3 mb-6">
          <label className="text-sm font-medium text-gray-700">Kunde:</label>
          <Select
            value={selectedClientId || "all"}
            onValueChange={handleClientChange}
          >
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle Kunden</SelectItem>
              {clients.map((client) => (
                <SelectItem key={client.id} value={client.id}>
                  {client.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <CalendarView
        posts={filtered}
        onPostClick={(post) => setSelectedPost(post as Post)}
      />

      {/* Post detail dialog */}
      {selectedPost && (
        <Dialog
          open={!!selectedPost}
          onOpenChange={() => setSelectedPost(null)}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Beitrag Details</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="flex items-center gap-2">
                <Badge variant={statusVariant[selectedPost.status]}>
                  {statusLabel[selectedPost.status]}
                </Badge>
                {selectedPost.client && (
                  <span className="text-sm text-gray-500">
                    {selectedPost.client.name}
                  </span>
                )}
              </div>

              <div>
                <p className="text-sm font-medium text-gray-700 mb-1">Inhalt</p>
                <p className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3">
                  {selectedPost.content}
                </p>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">
                  Plattformen
                </p>
                <div className="flex flex-wrap gap-2">
                  {selectedPost.postPlatforms.map((pp) => (
                    <PlatformBadge key={pp.id} platform={pp.platform} />
                  ))}
                </div>
              </div>

              {selectedPost.scheduledAt && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-1">
                    Geplant für
                  </p>
                  <p className="text-sm text-gray-600">
                    {format(
                      new Date(selectedPost.scheduledAt),
                      "EEEE, dd. MMMM yyyy 'um' HH:mm 'Uhr'",
                      { locale: de }
                    )}
                  </p>
                </div>
              )}
            </div>
            <DialogFooter className="gap-2">
              {selectedPost.status === "SCHEDULED" && (
                <Button
                  variant="outline"
                  onClick={handlePublishNow}
                  className="text-green-600 border-green-200 hover:bg-green-50"
                >
                  Jetzt veröffentlichen
                </Button>
              )}
              {selectedPost.status !== "PUBLISHED" && (
                <Button
                  variant="destructive"
                  onClick={handleDeletePost}
                  disabled={deleting}
                >
                  {deleting ? "Wird gelöscht..." : "Löschen"}
                </Button>
              )}
              <Button variant="outline" onClick={() => setSelectedPost(null)}>
                Schließen
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  )
}
