"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { de } from "date-fns/locale"
import { PostStatus, Platform } from "@prisma/client"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { PlatformBadge } from "@/components/platform-badge"
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
import { toast } from "@/hooks/use-toast"
import axios from "axios"
import { ChevronLeft, ChevronRight, Send, Trash2, Eye } from "lucide-react"

interface Post {
  id: string
  content: string
  status: PostStatus
  scheduledAt: string | null
  publishedAt: string | null
  createdAt: string
  mediaUrls: string[]
  postPlatforms: Array<{ id: string; platform: Platform; status: string; error?: string | null }>
  client: { id: string; name: string }
}

interface PostsPageClientProps {
  posts: Post[]
  total: number
  page: number
  limit: number
  clients: Array<{ id: string; name: string }>
  defaultClientId: string
  defaultStatus: string
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

const ALL_STATUSES = ["", "DRAFT", "SCHEDULED", "PUBLISHED", "FAILED"]
const statusOptions: Record<string, string> = {
  "": "Alle Status",
  DRAFT: "Entwurf",
  SCHEDULED: "Geplant",
  PUBLISHED: "Veröffentlicht",
  FAILED: "Fehlgeschlagen",
}

export function PostsPageClient({
  posts,
  total,
  page,
  limit,
  clients,
  defaultClientId,
  defaultStatus,
}: PostsPageClientProps) {
  const router = useRouter()
  const [selectedPost, setSelectedPost] = useState<Post | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)

  const totalPages = Math.ceil(total / limit)

  const navigate = (params: Record<string, string>) => {
    const current = new URLSearchParams()
    if (defaultClientId) current.set("clientId", defaultClientId)
    if (defaultStatus) current.set("status", defaultStatus)
    Object.entries(params).forEach(([k, v]) => {
      if (v) current.set(k, v)
      else current.delete(k)
    })
    router.push(`/posts?${current.toString()}`)
  }

  const handleDelete = async (postId: string) => {
    if (!confirm("Diesen Beitrag wirklich löschen?")) return
    setDeleting(postId)
    try {
      await axios.delete(`/api/posts/${postId}/publish`)
      toast({ title: "Beitrag gelöscht" })
      router.refresh()
    } catch {
      toast({
        title: "Fehler",
        description: "Beitrag konnte nicht gelöscht werden.",
        variant: "destructive",
      })
    } finally {
      setDeleting(null)
    }
  }

  const handlePublishNow = async (postId: string) => {
    try {
      await axios.post(`/api/posts/${postId}/publish`)
      toast({ title: "Wird veröffentlicht", description: "Der Beitrag wird jetzt veröffentlicht." })
      router.refresh()
    } catch {
      toast({
        title: "Fehler",
        description: "Beitrag konnte nicht veröffentlicht werden.",
        variant: "destructive",
      })
    }
  }

  return (
    <>
      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        {clients.length > 1 && (
          <Select
            value={defaultClientId || "all"}
            onValueChange={(v) => navigate({ clientId: v === "all" ? "" : v, page: "1" })}
          >
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle Kunden</SelectItem>
              {clients.map((c) => (
                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        <Select
          value={defaultStatus || "all"}
          onValueChange={(v) => navigate({ status: v === "all" ? "" : v, page: "1" })}
        >
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {ALL_STATUSES.map((s) => (
              <SelectItem key={s || "all"} value={s || "all"}>
                {statusOptions[s]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Posts table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {posts.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            Keine Beiträge gefunden
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Inhalt</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Kunde</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Plattformen</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Geplant / Erstellt</th>
                    <th className="text-right px-4 py-3 font-medium text-gray-600">Aktionen</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {posts.map((post) => (
                    <tr key={post.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {post.mediaUrls.length > 0 && (
                            <img
                              src={post.mediaUrls[0]}
                              alt=""
                              className="h-8 w-8 rounded object-cover shrink-0"
                            />
                          )}
                          <span className="line-clamp-2 text-gray-700 max-w-xs">
                            {post.content}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{post.client.name}</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {post.postPlatforms.map((pp) => (
                            <PlatformBadge
                              key={pp.id}
                              platform={pp.platform}
                              size="sm"
                              showLabel={false}
                            />
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={statusVariant[post.status]}>
                          {statusLabel[post.status]}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs">
                        {post.scheduledAt
                          ? format(new Date(post.scheduledAt), "dd.MM.yy HH:mm", { locale: de })
                          : format(new Date(post.createdAt), "dd.MM.yy HH:mm", { locale: de })}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setSelectedPost(post)}
                            className="h-7 w-7"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                          {post.status !== "PUBLISHED" && (
                            <>
                              {post.status === "SCHEDULED" && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handlePublishNow(post.id)}
                                  className="h-7 w-7 text-green-600 hover:text-green-700"
                                >
                                  <Send className="h-3.5 w-3.5" />
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDelete(post.id)}
                                disabled={deleting === post.id}
                                className="h-7 w-7 text-red-500 hover:text-red-600"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
                <span className="text-sm text-gray-500">
                  Seite {page} von {totalPages} ({total} Beiträge)
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    disabled={page <= 1}
                    onClick={() => navigate({ page: String(page - 1) })}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    disabled={page >= totalPages}
                    onClick={() => navigate({ page: String(page + 1) })}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Post detail dialog */}
      {selectedPost && (
        <Dialog open={!!selectedPost} onOpenChange={() => setSelectedPost(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Beitrag Details</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="flex items-center gap-2">
                <Badge variant={statusVariant[selectedPost.status]}>
                  {statusLabel[selectedPost.status]}
                </Badge>
                <span className="text-sm text-gray-500">{selectedPost.client.name}</span>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-700 mb-1">Inhalt</p>
                <p className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3 whitespace-pre-wrap">
                  {selectedPost.content}
                </p>
              </div>

              {selectedPost.mediaUrls.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Medien</p>
                  <div className="flex gap-2 flex-wrap">
                    {selectedPost.mediaUrls.map((url, i) => (
                      <img
                        key={i}
                        src={url}
                        alt=""
                        className="h-20 w-20 rounded-lg object-cover"
                      />
                    ))}
                  </div>
                </div>
              )}

              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Plattformen</p>
                <div className="space-y-2">
                  {selectedPost.postPlatforms.map((pp) => (
                    <div key={pp.id} className="flex items-center gap-2">
                      <PlatformBadge platform={pp.platform} size="sm" />
                      <Badge
                        variant={statusVariant[pp.status] || "secondary"}
                        className="text-[10px]"
                      >
                        {statusLabel[pp.status] || pp.status}
                      </Badge>
                      {pp.error && (
                        <span className="text-xs text-red-500 truncate">{pp.error}</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {selectedPost.scheduledAt && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-1">Geplant für</p>
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
            <DialogFooter>
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
