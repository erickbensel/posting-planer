"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { format } from "date-fns"
import { de } from "date-fns/locale"
import { Platform } from "@prisma/client"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PlatformBadge } from "@/components/platform-badge"
import { PlatformPreview } from "@/components/platform-preview"
import { MediaUploader } from "@/components/media-uploader"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "@/hooks/use-toast"
import { Loader2, Send, Clock, Calendar } from "lucide-react"
import axios from "axios"

const CHAR_LIMITS: Record<Platform, number> = {
  INSTAGRAM: 2200,
  FACEBOOK: 63206,
  LINKEDIN: 3000,
  TIKTOK: 2200,
  YOUTUBE: 5000,
}

interface SocialAccount {
  id: string
  platform: Platform
  accountName: string
}

interface PostComposerProps {
  clientId: string
  socialAccounts: SocialAccount[]
  onSuccess?: () => void
}

const postSchema = z.object({
  content: z.string().min(1, "Inhalt darf nicht leer sein"),
  scheduledAt: z.string().optional(),
})

type PostFormData = z.infer<typeof postSchema>

export function PostComposer({
  clientId,
  socialAccounts,
  onSuccess,
}: PostComposerProps) {
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([])
  const [mediaUrls, setMediaUrls] = useState<string[]>([])
  const [isScheduled, setIsScheduled] = useState(false)
  const [loading, setLoading] = useState(false)
  const [previewPlatform, setPreviewPlatform] = useState<Platform | null>(
    socialAccounts[0]?.platform || null
  )

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
    reset,
  } = useForm<PostFormData>({
    resolver: zodResolver(postSchema),
  })

  const content = watch("content") || ""

  const togglePlatform = (accountId: string) => {
    setSelectedPlatforms((prev) =>
      prev.includes(accountId)
        ? prev.filter((id) => id !== accountId)
        : [...prev, accountId]
    )
  }

  const onSubmit = async (data: PostFormData) => {
    if (selectedPlatforms.length === 0) {
      toast({
        title: "Keine Plattform ausgewählt",
        description: "Bitte wähle mindestens eine Plattform aus.",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      const payload = {
        clientId,
        content: data.content,
        mediaUrls,
        socialAccountIds: selectedPlatforms,
        scheduledAt: isScheduled && data.scheduledAt ? data.scheduledAt : null,
        publishNow: !isScheduled,
      }

      await axios.post("/api/posts", payload)

      toast({
        title: isScheduled ? "Geplant" : "Veröffentlicht",
        description: isScheduled
          ? "Der Beitrag wurde erfolgreich geplant."
          : "Der Beitrag wird jetzt veröffentlicht.",
      })

      reset()
      setSelectedPlatforms([])
      setMediaUrls([])
      setIsScheduled(false)
      onSuccess?.()
    } catch (error: any) {
      toast({
        title: "Fehler",
        description:
          error.response?.data?.error || "Der Beitrag konnte nicht erstellt werden.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const selectedAccount = socialAccounts.find(
    (a) => a.platform === previewPlatform
  )

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Composer */}
      <div className="space-y-5">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* Platform selector */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Plattformen</CardTitle>
            </CardHeader>
            <CardContent>
              {socialAccounts.length === 0 ? (
                <p className="text-sm text-gray-500">
                  Keine verbundenen Konten. Verbinde zuerst Social-Media-Konten
                  in den Kundeneinstellungen.
                </p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {socialAccounts.map((account) => (
                    <button
                      key={account.id}
                      type="button"
                      onClick={() => {
                        togglePlatform(account.id)
                        setPreviewPlatform(account.platform)
                      }}
                      className={`flex items-center gap-2 rounded-lg border-2 px-3 py-2 text-sm font-medium transition-colors ${
                        selectedPlatforms.includes(account.id)
                          ? "border-indigo-500 bg-indigo-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <PlatformBadge
                        platform={account.platform}
                        size="sm"
                        showLabel={false}
                      />
                      <span>{account.accountName}</span>
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Content editor */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Inhalt</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Textarea
                {...register("content")}
                placeholder="Schreibe deinen Beitrag..."
                className="min-h-[160px] resize-none text-sm"
              />
              {errors.content && (
                <p className="text-xs text-red-500">{errors.content.message}</p>
              )}

              {/* Char counters for selected platforms */}
              {selectedPlatforms.length > 0 && (
                <div className="space-y-1">
                  {socialAccounts
                    .filter((a) => selectedPlatforms.includes(a.id))
                    .map((account) => {
                      const limit = CHAR_LIMITS[account.platform]
                      const count = content.length
                      const isOver = count > limit
                      return (
                        <div
                          key={account.id}
                          className="flex items-center justify-between text-xs"
                        >
                          <span className="text-gray-500">
                            {account.platform}
                          </span>
                          <span
                            className={
                              isOver ? "text-red-500 font-medium" : "text-gray-400"
                            }
                          >
                            {count.toLocaleString()} / {limit.toLocaleString()}
                          </span>
                        </div>
                      )
                    })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Media */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Medien</CardTitle>
            </CardHeader>
            <CardContent>
              <MediaUploader
                clientId={clientId}
                onMediaChange={setMediaUrls}
              />
            </CardContent>
          </Card>

          {/* Scheduling */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Veröffentlichung</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsScheduled(false)}
                  className={`flex items-center gap-2 rounded-lg border-2 px-4 py-2 text-sm font-medium transition-colors flex-1 justify-center ${
                    !isScheduled
                      ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <Send className="h-4 w-4" />
                  Jetzt posten
                </button>
                <button
                  type="button"
                  onClick={() => setIsScheduled(true)}
                  className={`flex items-center gap-2 rounded-lg border-2 px-4 py-2 text-sm font-medium transition-colors flex-1 justify-center ${
                    isScheduled
                      ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <Clock className="h-4 w-4" />
                  Planen
                </button>
              </div>

              {isScheduled && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Datum und Uhrzeit
                  </label>
                  <input
                    {...register("scheduledAt")}
                    type="datetime-local"
                    min={new Date().toISOString().slice(0, 16)}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              )}
            </CardContent>
          </Card>

          <Button
            type="submit"
            disabled={loading || selectedPlatforms.length === 0}
            className="w-full bg-indigo-600 hover:bg-indigo-700"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : isScheduled ? (
              <Clock className="h-4 w-4 mr-2" />
            ) : (
              <Send className="h-4 w-4 mr-2" />
            )}
            {loading
              ? "Wird verarbeitet..."
              : isScheduled
              ? "Beitrag planen"
              : "Jetzt veröffentlichen"}
          </Button>
        </form>
      </div>

      {/* Preview panel */}
      <div className="space-y-4">
        <h3 className="font-semibold text-gray-900">Vorschau</h3>

        {previewPlatform ? (
          <Tabs
            value={previewPlatform}
            onValueChange={(v) => setPreviewPlatform(v as Platform)}
          >
            {socialAccounts.length > 1 && (
              <TabsList className="w-full">
                {socialAccounts.map((account) => (
                  <TabsTrigger
                    key={account.id}
                    value={account.platform}
                    className="flex-1 text-xs"
                  >
                    {account.platform.charAt(0) + account.platform.slice(1).toLowerCase()}
                  </TabsTrigger>
                ))}
              </TabsList>
            )}
            {socialAccounts.map((account) => (
              <TabsContent key={account.id} value={account.platform}>
                <PlatformPreview
                  platform={account.platform}
                  content={content}
                  mediaUrls={mediaUrls}
                  accountName={account.accountName}
                />
              </TabsContent>
            ))}
          </Tabs>
        ) : (
          <div className="border-2 border-dashed border-gray-200 rounded-xl p-12 text-center">
            <p className="text-gray-400 text-sm">
              Verbinde ein Social-Media-Konto um die Vorschau zu sehen
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
