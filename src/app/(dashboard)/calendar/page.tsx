import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { CalendarPageClient } from "./calendar-client"

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: { clientId?: string }
}) {
  const session = await getServerSession(authOptions)
  const userId = (session?.user as any)?.id

  const where: any = {
    client: { userId },
    scheduledAt: { not: null },
  }

  if (searchParams.clientId) {
    where.clientId = searchParams.clientId
  }

  const posts = await prisma.post.findMany({
    where,
    include: {
      postPlatforms: true,
      client: { select: { id: true, name: true } },
    },
    orderBy: { scheduledAt: "asc" },
  })

  const clients = await prisma.client.findMany({
    where: { userId },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  })

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Kalender</h1>
        <p className="text-gray-500 text-sm mt-1">
          Übersicht aller geplanten und veröffentlichten Beiträge
        </p>
      </div>

      <CalendarPageClient
        posts={posts.map((p) => ({
          ...p,
          scheduledAt: p.scheduledAt?.toISOString() || null,
          publishedAt: p.publishedAt?.toISOString() || null,
          createdAt: p.createdAt.toISOString(),
          updatedAt: p.updatedAt.toISOString(),
        }))}
        clients={clients}
        defaultClientId={searchParams.clientId || ""}
      />
    </div>
  )
}
