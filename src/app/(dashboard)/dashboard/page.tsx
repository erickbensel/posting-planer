import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { PlatformBadge } from "@/components/platform-badge"
import { Users, FileText, Send, Clock, AlertCircle } from "lucide-react"
import { format } from "date-fns"
import { de } from "date-fns/locale"
import Link from "next/link"

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)
  const userId = (session?.user as any)?.id

  const [
    totalClients,
    totalPosts,
    scheduledPosts,
    publishedPosts,
    failedPosts,
    recentPosts,
    clients,
  ] = await Promise.all([
    prisma.client.count({ where: { userId } }),
    prisma.post.count({ where: { client: { userId } } }),
    prisma.post.count({ where: { client: { userId }, status: "SCHEDULED" } }),
    prisma.post.count({ where: { client: { userId }, status: "PUBLISHED" } }),
    prisma.post.count({ where: { client: { userId }, status: "FAILED" } }),
    prisma.post.findMany({
      where: { client: { userId } },
      include: { postPlatforms: true, client: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    prisma.client.findMany({
      where: { userId },
      include: {
        socialAccounts: { select: { platform: true, accountName: true } },
        _count: { select: { posts: true } },
      },
      orderBy: { name: "asc" },
      take: 5,
    }),
  ])

  const stats = [
    { label: "Kunden", value: totalClients, icon: Users, href: "/clients" },
    { label: "Beiträge", value: totalPosts, icon: FileText, href: "/posts" },
    { label: "Geplant", value: scheduledPosts, icon: Clock, href: "/posts?status=SCHEDULED" },
    { label: "Veröffentlicht", value: publishedPosts, icon: Send, href: "/posts?status=PUBLISHED" },
    { label: "Fehlgeschlagen", value: failedPosts, icon: AlertCircle, href: "/posts?status=FAILED" },
  ]

  const statusLabel: Record<string, string> = {
    DRAFT: "Entwurf",
    SCHEDULED: "Geplant",
    PUBLISHED: "Veröffentlicht",
    FAILED: "Fehlgeschlagen",
  }

  const statusColor: Record<string, string> = {
    DRAFT: "bg-gray-100 text-gray-500",
    SCHEDULED: "bg-black/5 text-[#010101]",
    PUBLISHED: "bg-green-50 text-green-700",
    FAILED: "bg-red-50 text-[#ca151a]",
  }

  return (
    <div className="p-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-xl font-semibold text-[#010101]">
          Guten Tag, {session?.user?.name?.split(" ")[0] || "Team"}
        </h1>
        <p className="text-sm text-gray-400 mt-0.5">Hier ist deine aktuelle Übersicht</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-8">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <Link key={stat.label} href={stat.href}>
              <div className="bg-white border border-gray-100 rounded-xl p-5 hover:border-[#010101]/20 transition-colors cursor-pointer">
                <Icon className="h-4 w-4 text-gray-300 mb-3" />
                <p className="text-2xl font-bold text-[#010101]">{stat.value}</p>
                <p className="text-xs text-gray-400 mt-0.5">{stat.label}</p>
              </div>
            </Link>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Recent Posts */}
        <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
            <h2 className="text-sm font-semibold text-[#010101]">Letzte Beiträge</h2>
            <Link href="/posts" className="text-xs text-[#ca151a] hover:underline">Alle</Link>
          </div>
          <div className="divide-y divide-gray-50">
            {recentPosts.length === 0 ? (
              <p className="text-sm text-gray-300 text-center py-8">Noch keine Beiträge</p>
            ) : (
              recentPosts.map((post) => (
                <div key={post.id} className="flex items-start gap-3 px-5 py-3.5">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-medium text-[#010101]">{post.client.name}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${statusColor[post.status]}`}>
                        {statusLabel[post.status]}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 truncate">{post.content}</p>
                    <div className="flex items-center gap-2 mt-1.5">
                      {post.postPlatforms.slice(0, 3).map((pp) => (
                        <PlatformBadge key={pp.id} platform={pp.platform} size="sm" showLabel={false} />
                      ))}
                      <span className="text-[10px] text-gray-300">
                        {post.scheduledAt
                          ? format(new Date(post.scheduledAt), "dd.MM. HH:mm", { locale: de })
                          : format(new Date(post.createdAt), "dd.MM. HH:mm", { locale: de })}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Clients */}
        <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
            <h2 className="text-sm font-semibold text-[#010101]">Kunden</h2>
            <Link href="/clients" className="text-xs text-[#ca151a] hover:underline">Alle</Link>
          </div>
          <div className="divide-y divide-gray-50">
            {clients.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-sm text-gray-300 mb-3">Noch keine Kunden</p>
                <Link href="/clients" className="text-xs font-medium text-[#ca151a] hover:underline">
                  Ersten Kunden anlegen
                </Link>
              </div>
            ) : (
              clients.map((client) => (
                <Link key={client.id} href={`/clients/${client.id}`}
                  className="flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50/50 transition-colors"
                >
                  <div className="h-8 w-8 rounded-lg bg-[#010101] flex items-center justify-center text-white font-bold text-xs shrink-0">
                    {client.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#010101]">{client.name}</p>
                    <div className="flex items-center gap-1 mt-0.5">
                      {client.socialAccounts.slice(0, 4).map((acc) => (
                        <PlatformBadge key={acc.platform} platform={acc.platform} size="sm" showLabel={false} />
                      ))}
                      <span className="text-[10px] text-gray-300 ml-1">{client._count.posts} Beiträge</span>
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
