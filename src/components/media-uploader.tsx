"use client"

import { useState, useRef } from "react"
import { Upload, X, Image, Video, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "@/hooks/use-toast"
import axios from "axios"
import { cn } from "@/lib/utils"

interface MediaFile {
  url: string
  type: "image" | "video"
  cloudinaryId: string
  name: string
}

interface MediaUploaderProps {
  clientId: string
  onMediaChange: (mediaUrls: string[]) => void
  maxFiles?: number
}

export function MediaUploader({
  clientId,
  onMediaChange,
  maxFiles = 10,
}: MediaUploaderProps) {
  const [files, setFiles] = useState<MediaFile[]>([])
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleUpload = async (selectedFiles: FileList | null) => {
    if (!selectedFiles || selectedFiles.length === 0) return
    if (files.length + selectedFiles.length > maxFiles) {
      toast({
        title: "Zu viele Dateien",
        description: `Maximal ${maxFiles} Dateien erlaubt.`,
        variant: "destructive",
      })
      return
    }

    setUploading(true)
    try {
      const uploadPromises = Array.from(selectedFiles).map(async (file) => {
        const formData = new FormData()
        formData.append("file", file)
        formData.append("clientId", clientId)

        const response = await axios.post("/api/media/upload", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        })

        return {
          url: response.data.url,
          type: file.type.startsWith("video/") ? "video" : "image",
          cloudinaryId: response.data.cloudinaryId,
          name: file.name,
        } as MediaFile
      })

      const uploaded = await Promise.all(uploadPromises)
      const newFiles = [...files, ...uploaded]
      setFiles(newFiles)
      onMediaChange(newFiles.map((f) => f.url))

      toast({
        title: "Hochgeladen",
        description: `${uploaded.length} Datei(en) erfolgreich hochgeladen.`,
      })
    } catch (error) {
      toast({
        title: "Upload fehlgeschlagen",
        description: "Bitte versuche es erneut.",
        variant: "destructive",
      })
    } finally {
      setUploading(false)
    }
  }

  const removeFile = (index: number) => {
    const newFiles = files.filter((_, i) => i !== index)
    setFiles(newFiles)
    onMediaChange(newFiles.map((f) => f.url))
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    handleUpload(e.dataTransfer.files)
  }

  return (
    <div className="space-y-3">
      {/* Upload Area */}
      <div
        className={cn(
          "border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors",
          dragOver
            ? "border-indigo-400 bg-indigo-50"
            : "border-gray-300 hover:border-indigo-300 hover:bg-gray-50"
        )}
        onClick={() => fileInputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
      >
        {uploading ? (
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-8 w-8 text-indigo-500 animate-spin" />
            <p className="text-sm text-gray-600">Wird hochgeladen...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <Upload className="h-8 w-8 text-gray-400" />
            <div>
              <p className="text-sm font-medium text-gray-700">
                Dateien hochladen
              </p>
              <p className="text-xs text-gray-500">
                Bilder (JPG, PNG, WebP) oder Videos (MP4, MOV)
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Drag & Drop oder klicken
              </p>
            </div>
          </div>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*,video/*"
        className="hidden"
        onChange={(e) => handleUpload(e.target.files)}
      />

      {/* Preview */}
      {files.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {files.map((file, index) => (
            <div
              key={index}
              className="relative rounded-lg overflow-hidden bg-gray-100 aspect-square group"
            >
              {file.type === "image" ? (
                <img
                  src={file.url}
                  alt={file.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Video className="h-8 w-8 text-gray-400" />
                  <span className="text-xs text-gray-500 mt-1 absolute bottom-2 left-2 right-2 truncate">
                    {file.name}
                  </span>
                </div>
              )}
              <button
                onClick={(e) => { e.stopPropagation(); removeFile(index) }}
                className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
