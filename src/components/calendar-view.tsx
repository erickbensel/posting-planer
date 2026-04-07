"use client"

import { useState } from "react"
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  startOfWeek,
  endOfWeek,
} from "date-fns"
import { de } from "date-fns/locale"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { getPlatformColor } from "@/components/platform-badge"
import { Platform, PostStatus } from "@prisma/client"
import { cn } from "@/lib/utils"

interface ScheduledPost {
  id: string
  content: string
  status: PostStatus
  scheduledAt: string | null
  publishedAt?: string | null
  postPlatforms: Array<{
    id?: string
    platform: Platform
  }>
  client?: {
    id?: string
    name: string
  }
}

interface CalendarViewProps {
  posts: ScheduledPost[]
  onPostClick?: (post: ScheduledPost) => void
}

const WEEKDAYS = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"]

export function CalendarView({ posts, onPostClick }: CalendarViewProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date())

  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)
  const calStart = startOfWeek(monthStart, { weekStartsOn: 1 })
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 })

  const days = eachDayOfInterval({ start: calStart, end: calEnd })

  const getPostsForDay = (day: Date) =>
    posts.filter((post) => {
      if (!post.scheduledAt) return false
      return isSameDay(new Date(post.scheduledAt), day)
    })

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Calendar header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
        <h2 className="font-semibold text-gray-900 text-lg">
          {format(currentMonth, "MMMM yyyy", { locale: de })}
        </h2>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentMonth(new Date())}
          >
            Heute
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Weekday labels */}
      <div className="grid grid-cols-7 border-b border-gray-100">
        {WEEKDAYS.map((day) => (
          <div
            key={day}
            className="py-2 text-center text-xs font-medium text-gray-500"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7">
        {days.map((day, idx) => {
          const dayPosts = getPostsForDay(day)
          const isCurrentMonth = isSameMonth(day, currentMonth)
          const isToday = isSameDay(day, new Date())

          return (
            <div
              key={idx}
              className={cn(
                "min-h-[100px] p-2 border-b border-r border-gray-100",
                !isCurrentMonth && "bg-gray-50/50",
                idx % 7 === 6 && "border-r-0"
              )}
            >
              <div
                className={cn(
                  "inline-flex h-7 w-7 items-center justify-center rounded-full text-sm font-medium mb-1",
                  isToday
                    ? "bg-indigo-600 text-white"
                    : isCurrentMonth
                    ? "text-gray-900"
                    : "text-gray-400"
                )}
              >
                {format(day, "d")}
              </div>

              {/* Posts for this day */}
              <div className="space-y-1">
                {dayPosts.slice(0, 3).map((post) => (
                  <button
                    key={post.id}
                    onClick={() => onPostClick?.(post)}
                    className="w-full text-left"
                  >
                    <div
                      className={cn(
                        "rounded px-1.5 py-0.5 text-white text-[10px] font-medium truncate",
                        post.status === "PUBLISHED"
                          ? "bg-green-500"
                          : post.status === "FAILED"
                          ? "bg-red-500"
                          : "bg-indigo-500"
                      )}
                    >
                      {post.postPlatforms[0] && (
                        <span className="mr-1">
                          {post.postPlatforms[0].platform === "INSTAGRAM"
                            ? "📸"
                            : post.postPlatforms[0].platform === "FACEBOOK"
                            ? "👍"
                            : post.postPlatforms[0].platform === "LINKEDIN"
                            ? "💼"
                            : post.postPlatforms[0].platform === "TIKTOK"
                            ? "🎵"
                            : "▶️"}
                        </span>
                      )}
                      {post.content.substring(0, 20)}
                      {post.content.length > 20 ? "..." : ""}
                    </div>
                  </button>
                ))}
                {dayPosts.length > 3 && (
                  <p className="text-[10px] text-gray-400 pl-1">
                    +{dayPosts.length - 3} weitere
                  </p>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 px-6 py-3 border-t border-gray-100 text-xs text-gray-500">
        <div className="flex items-center gap-1.5">
          <div className="h-2.5 w-2.5 rounded bg-indigo-500" />
          Geplant
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-2.5 w-2.5 rounded bg-green-500" />
          Veröffentlicht
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-2.5 w-2.5 rounded bg-red-500" />
          Fehlgeschlagen
        </div>
      </div>
    </div>
  )
}
