export const dynamic = "force-dynamic";
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { PostComposerWrapper } from "./composer-wrapper"

export default async function ComposerPage({
  searchParams,
}: {
  searchParams: { clientId?: string }
}) {
  const session = await getServerSession(authOptions)
  const userId = (session?.user as any)?.id

  // Get all clients with their social accounts
  const clients = await prisma.client.findMany({
    where: { userId },
    include: {
      socialAccounts: {
        select: {
          id: true,
          platform: true,
          accountName: true,
          accountId: true,
        },
      },
    },
    orderBy: { name: "asc" },
  })

  const defaultClientId = searchParams.clientId || clients[0]?.id || ""

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Beitrag erstellen</h1>
        <p className="text-gray-500 text-sm mt-1">
          Erstelle und plane Beiträge für deine Kunden
        </p>
      </div>

      <PostComposerWrapper
        clients={clients}
        defaultClientId={defaultClientId}
      />
    </div>
  )
}
