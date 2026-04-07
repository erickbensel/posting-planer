import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { PostsPageClient } from "./posts-client"
import { PostStatus } from "@prisma/client"

export default async function PostsPage({
  searchParams,
}: {
  searchParams: { clientId?: string; status?: string; page?: string }
}) {
  const session = await getServerSession(authOptions)
  const userId = (session?.user as any)?.id

  const page = parseInt(searchParams.page || "1")
  const limit = 20

  const where: any = {
    client: { userId },
  }

  if (searchParams.clientId) where.clientId = searchParams.clientId
  if (searchParams.status) where.status = searchParams.status

  const [posts, total, clients] = await Promise.all([
    prisma.post.findMany({
      where,
      include: {
        postPlatforms: true,
        client: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: (page - 1) * limit,
    }),
    prisma.post.count({ where }),
    prisma.client.findMany({
      where: { userId },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ])

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Alle Beiträge</h1>
        <p className="text-gray-500 text-sm mt-1">
          {total} Beiträge gesamt
        </p>
      </div>

      <PostsPageClient
        posts={posts.map((p) => ({
          ...p,
          scheduledAt: p.scheduledAt?.toISOString() || null,
          publishedAt: p.publishedAt?.toISOString() || null,
          createdAt: p.createdAt.toISOString(),
          updatedAt: p.updatedAt.toISOString(),
        }))}
        total={total}
        page={page}
        limit={limit}
        clients={clients}
        defaultClientId={searchParams.clientId || ""}
        defaultStatus={searchParams.status || ""}
      />
    </div>
  )
}
