"use client"

import Link from "next/link"
import { Building2, ExternalLink } from "lucide-react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { PlatformBadge } from "@/components/platform-badge"
import { Platform } from "@prisma/client"

interface ClientCardProps {
  client: {
    id: string
    name: string
    logo: string | null
    socialAccounts: Array<{
      id: string
      platform: Platform
      accountName: string
    }>
    _count?: {
      posts: number
    }
  }
}

export function ClientCard({ client }: ClientCardProps) {
  return (
    <Link href={`/clients/${client.id}`}>
      <Card className="hover:shadow-md transition-shadow cursor-pointer group h-full">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              {client.logo ? (
                <img
                  src={client.logo}
                  alt={client.name}
                  className="h-10 w-10 rounded-lg object-cover"
                />
              ) : (
                <div className="h-10 w-10 rounded-lg bg-indigo-100 flex items-center justify-center">
                  <Building2 className="h-5 w-5 text-indigo-600" />
                </div>
              )}
              <div>
                <h3 className="font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors">
                  {client.name}
                </h3>
                {client._count && (
                  <p className="text-xs text-gray-500">
                    {client._count.posts} Beiträge
                  </p>
                )}
              </div>
            </div>
            <ExternalLink className="h-4 w-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </CardHeader>
        <CardContent>
          {client.socialAccounts.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {client.socialAccounts.map((account) => (
                <PlatformBadge
                  key={account.id}
                  platform={account.platform}
                  size="sm"
                  showLabel={false}
                />
              ))}
              <span className="text-xs text-gray-500 self-center">
                {client.socialAccounts.length} Kanal
                {client.socialAccounts.length !== 1 ? "e" : ""} verbunden
              </span>
            </div>
          ) : (
            <p className="text-sm text-gray-400 italic">
              Noch keine Kanäle verbunden
            </p>
          )}
        </CardContent>
      </Card>
    </Link>
  )
}
